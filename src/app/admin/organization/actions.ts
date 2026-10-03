"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { appendAuditLog } from "@/server/auth/audit";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { validatePeriodEditionSelection } from "@/server/organization/period-editions";
import {
  editions,
  mediaAssets,
  organizationAssignments,
  organizationMemberships,
  organizationPeriods,
  organizationUnits,
  people,
  personSocialLinks,
  socialPlatforms,
  type OrganizationUnitRow,
  type PeriodLifecycle,
  type SocialPlatform,
} from "@/server/db/schema";

const PERIOD_LIFECYCLES = ["draft", "active", "archived"] as const;

function assertPeriodCanChange(lifecycle: PeriodLifecycle) {
  if (lifecycle === "archived") {
    throw new Error("Periode arsip hanya dapat dilihat");
  }
}

function validateHttpsUrl(urlStr: string): string {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    throw new Error("URL tidak boleh kosong");
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      throw new Error("URL wajib menggunakan protokol https://");
    }
    return trimmed;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("https://")) {
      throw err;
    }
    throw new Error("Format URL tidak valid, gunakan format https://...");
  }
}

function slugify(text: string): string {
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "profil";
}

function parseNonNegativeInteger(value: FormDataEntryValue | null | undefined, label: string, fallback = 0) {
  const raw = value === null || value === undefined || value === "" ? fallback : Number(value);
  if (!Number.isInteger(raw) || raw < 0) {
    throw new Error(`${label} harus berupa bilangan bulat nol atau lebih`);
  }
  return raw;
}

function parseVersion(value: FormDataEntryValue | null | undefined, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} tidak valid`);
  }
  return parsed;
}

function parseMissions(value: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value || "[]");
  } catch {
    throw new Error("Format daftar misi tidak valid");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Format daftar misi tidak valid");
  }

  const missions = parsed.map((item) => String(item).trim()).filter(Boolean);
  return JSON.stringify(missions);
}

function parseUniqueStringArray(value: FormDataEntryValue | null, label: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(value ?? "[]"));
  } catch {
    throw new Error(`${label} tidak valid`);
  }

  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`${label} tidak valid`);
  }

  const normalized = parsed.map((item) => item.trim());
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${label} tidak boleh memuat data ganda`);
  }
  return normalized;
}

// ---------------------------------------------------------------------------
// Unit Tree Helper / Validation
// ---------------------------------------------------------------------------

function validateOrganizationTree(units: Pick<OrganizationUnitRow, "id" | "parentId">[]) {
  const unitMap = new Map(units.map((unit) => [unit.id, unit]));
  const state = new Map<string, "visiting" | "visited">();
  const depthMap = new Map<string, number>();

  const visit = (id: string): number => {
    const currentState = state.get(id);
    if (currentState === "visiting") {
      throw new Error("Terdeteksi struktur melingkar pada hierarki unit");
    }
    if (currentState === "visited") return depthMap.get(id) ?? 1;

    const unit = unitMap.get(id);
    if (!unit) throw new Error("Unit organisasi tidak ditemukan pada periode ini");

    state.set(id, "visiting");
    const depth = unit.parentId ? visit(unit.parentId) + 1 : 1;
    if (depth > 4) {
      throw new Error(`Struktur organisasi maksimal 4 tingkat kedalaman (tingkat saat ini: ${depth})`);
    }
    depthMap.set(id, depth);
    state.set(id, "visited");
    return depth;
  };

  for (const unit of units) visit(unit.id);
  return depthMap;
}

function checkTreeCycleAndDepth(
  units: OrganizationUnitRow[],
  targetUnitId: string | null,
  newParentId: string | null
) {
  const depthMap = validateOrganizationTree(units);
  if (!newParentId) return;

  if (targetUnitId && newParentId === targetUnitId) {
    throw new Error("Unit tidak dapat menjadi induk bagi dirinya sendiri");
  }

  const childrenMap = new Map<string, string[]>();

  for (const u of units) {
    if (u.parentId) {
      const list = childrenMap.get(u.parentId) ?? [];
      list.push(u.id);
      childrenMap.set(u.parentId, list);
    }
  }

  const parent = units.find((unit) => unit.id === newParentId);
  if (!parent) {
    throw new Error("Unit induk tidak ditemukan");
  }

  if (targetUnitId) {
    let ancestorId: string | null = parent.id;
    const visited = new Set<string>();
    while (ancestorId) {
      if (ancestorId === targetUnitId) {
        throw new Error("Terdeteksi hubungan melingkar: unit turunan tidak bisa menjadi induk");
      }
      if (visited.has(ancestorId)) {
        throw new Error("Terdeteksi struktur melingkar pada hierarki unit");
      }
      visited.add(ancestorId);
      ancestorId = units.find((unit) => unit.id === ancestorId)?.parentId ?? null;
    }
  }

  // Calculate max subtree height if updating existing unit
  let subtreeHeight = 0;
  if (targetUnitId) {
    function getSubtreeHeight(id: string): number {
      const children = childrenMap.get(id) ?? [];
      if (children.length === 0) return 0;
      let maxH = 0;
      for (const chId of children) {
        const h = 1 + getSubtreeHeight(chId);
        if (h > maxH) maxH = h;
      }
      return maxH;
    }
    subtreeHeight = getSubtreeHeight(targetUnitId);
  }

  const totalDepth = (depthMap.get(parent.id) ?? 1) + 1 + subtreeHeight;
  if (totalDepth > 4) {
    throw new Error(`Struktur organisasi maksimal 4 tingkat kedalaman (tingkat saat ini: ${totalDepth})`);
  }
}

// ---------------------------------------------------------------------------
// 1. MANAJEMEN PERIODE KEPENGURUSAN
// ---------------------------------------------------------------------------

export async function createPeriodAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const label = String(formData.get("label") ?? "").trim();
  const startYear = Number(formData.get("startYear"));
  const endYear = Number(formData.get("endYear"));
  const vision = formData.get("vision")?.toString().trim() || null;
  const missionJsonRaw = formData.get("missionJson")?.toString().trim() || "[]";
  const lifecycleRaw = formData.get("lifecycle")?.toString().trim() || "draft";

  if (!label) {
    throw new Error("Label periode wajib diisi");
  }

  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear < 1900 || endYear < 1900) {
    throw new Error("Tahun mulai dan tahun selesai harus berupa tahun yang valid");
  }

  if (startYear > endYear) {
    throw new Error("Tahun mulai tidak boleh melebihi tahun selesai");
  }

  if (!PERIOD_LIFECYCLES.includes(lifecycleRaw as PeriodLifecycle)) {
    throw new Error("Status siklus periode tidak valid");
  }

  const missionJson = parseMissions(missionJsonRaw);

  const id = crypto.randomUUID();
  const now = new Date();

  await database.transaction(async (tx) => {
    await tx.insert(organizationPeriods).values({
      id,
      label,
      startYear,
      endYear,
      vision,
      missionJson,
      lifecycle: lifecycleRaw as PeriodLifecycle,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.period.create",
      resourceType: "organization_period",
      resourceId: id,
      resourceLabel: label,
      after: {
        id,
        label,
        startYear,
        endYear,
        vision,
        missionJson,
        lifecycle: lifecycleRaw,
        version: 1,
      },
      changedFields: ["label", "startYear", "endYear", "vision", "missionJson", "lifecycle"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  revalidatePath("/admin");
  return { success: true, id };
}

export async function updatePeriodAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const id = String(formData.get("id") ?? "").trim();
  const version = parseVersion(formData.get("version"), "Versi periode");
  const label = String(formData.get("label") ?? "").trim();
  const startYear = Number(formData.get("startYear"));
  const endYear = Number(formData.get("endYear"));
  const vision = formData.get("vision")?.toString().trim() || null;
  const missionJsonRaw = formData.get("missionJson")?.toString().trim() || "[]";
  const lifecycleRaw = formData.get("lifecycle")?.toString().trim() || "draft";

  if (!id) {
    throw new Error("ID periode wajib disertakan");
  }

  if (!label) {
    throw new Error("Label periode wajib diisi");
  }

  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear < 1900 || endYear < 1900) {
    throw new Error("Tahun mulai dan tahun selesai harus berupa tahun yang valid");
  }

  if (startYear > endYear) {
    throw new Error("Tahun mulai tidak boleh melebihi tahun selesai");
  }

  if (!PERIOD_LIFECYCLES.includes(lifecycleRaw as PeriodLifecycle)) {
    throw new Error("Status siklus periode tidak valid");
  }

  const missionJson = parseMissions(missionJsonRaw);

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, id))
      .limit(1);

    if (!current) {
      throw new Error("Periode kepengurusan tidak ditemukan");
    }

    assertPeriodCanChange(current.lifecycle);

    if (current.version !== version) {
      throw new Error("Versi data telah diperbarui oleh pengguna lain. Silakan muat ulang halaman.");
    }

    const nextVersion = current.version + 1;
    await tx
      .update(organizationPeriods)
      .set({
        label,
        startYear,
        endYear,
        vision,
        missionJson,
        lifecycle: lifecycleRaw as PeriodLifecycle,
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(organizationPeriods.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.period.update",
      resourceType: "organization_period",
      resourceId: id,
      resourceLabel: label,
      before: {
        label: current.label,
        startYear: current.startYear,
        endYear: current.endYear,
        vision: current.vision,
        missionJson: current.missionJson,
        lifecycle: current.lifecycle,
        version: current.version,
      },
      after: {
        label,
        startYear,
        endYear,
        vision,
        missionJson,
        lifecycle: lifecycleRaw,
        version: nextVersion,
      },
      changedFields: ["label", "startYear", "endYear", "vision", "missionJson", "lifecycle", "version"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  revalidatePath(`/admin/organization/periods/${id}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function setPeriodEditionsAction(formData: FormData) {
  const actor = await requirePermission("people.manage");
  const periodId = String(formData.get("periodId") ?? "").trim();
  const periodVersion = parseVersion(formData.get("periodVersion"), "Versi periode");
  const editionIds = parseUniqueStringArray(formData.get("editionIds"), "Daftar edisi");
  const confirmedReassignmentIds = parseUniqueStringArray(
    formData.get("confirmedReassignmentIds"),
    "Konfirmasi pemindahan"
  );

  if (!periodId) {
    throw new Error("ID periode wajib disertakan");
  }

  const selectedIds = new Set(editionIds);
  let affectedPreviousPeriodIds: string[] = [];

  await database.transaction(async (tx) => {
    const [period] = await tx
      .select()
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, periodId))
      .limit(1);

    if (!period) {
      throw new Error("Periode kepengurusan tidak ditemukan");
    }
    assertPeriodCanChange(period.lifecycle);
    if (period.version !== periodVersion) {
      throw new Error("Versi data telah diperbarui oleh pengguna lain. Silakan muat ulang halaman.");
    }

    const allEditions = await tx.select().from(editions);
    const { selectedEditions, conflicts } = validatePeriodEditionSelection(
      allEditions,
      periodId,
      editionIds,
      confirmedReassignmentIds
    );
    const editionById = new Map(selectedEditions.map((edition) => [edition.id, edition]));

    const currentLinked = allEditions.filter((edition) => edition.organizationPeriodId === periodId);
    const previousPeriodIds = new Set(
      conflicts
        .map((edition) => edition.organizationPeriodId)
        .filter((id): id is string => Boolean(id))
    );
    affectedPreviousPeriodIds = [...previousPeriodIds];

    for (const edition of currentLinked) {
      if (selectedIds.has(edition.id)) continue;
      await tx
        .update(editions)
        .set({
          organizationPeriodId: null,
          version: edition.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(editions.id, edition.id));
    }

    for (const editionId of editionIds) {
      const edition = editionById.get(editionId)!;
      if (edition.organizationPeriodId === periodId) continue;
      await tx
        .update(editions)
        .set({
          organizationPeriodId: periodId,
          version: edition.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(editions.id, edition.id));
    }

    const nextPeriodVersion = period.version + 1;
    await tx
      .update(organizationPeriods)
      .set({ version: nextPeriodVersion, updatedAt: new Date() })
      .where(eq(organizationPeriods.id, periodId));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.period.editions.update",
      resourceType: "organization_period",
      resourceId: periodId,
      resourceLabel: period.label,
      before: {
        editionIds: currentLinked.map((edition) => edition.id),
        version: period.version,
      },
      after: {
        editionIds,
        reassignedEditionIds: conflicts.map((edition) => edition.id),
        version: nextPeriodVersion,
      },
      changedFields: ["editionIds", "version"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  revalidatePath(`/admin/organization/periods/${periodId}`);
  for (const previousPeriodId of affectedPreviousPeriodIds) {
    revalidatePath(`/admin/organization/periods/${previousPeriodId}`);
  }
  revalidatePath("/admin");
  return { success: true, linkedCount: editionIds.length };
}

export async function deletePeriodAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const id = String(formData.get("id") ?? "").trim();
  const version = parseVersion(formData.get("version"), "Versi periode");
  if (!id) {
    throw new Error("ID periode wajib disertakan");
  }

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, id))
      .limit(1);

    if (!current) {
      throw new Error("Periode kepengurusan tidak ditemukan");
    }

    if (current.version !== version) {
      throw new Error("Versi data telah diperbarui oleh pengguna lain. Silakan muat ulang halaman.");
    }

    if (current.lifecycle !== "draft") {
      throw new Error("Periode aktif atau arsip tidak dapat dihapus");
    }

    // Unlink any editions tied to this period
    await tx
      .update(editions)
      .set({ organizationPeriodId: null, updatedAt: new Date() })
      .where(eq(editions.organizationPeriodId, id));

    // Delete period (cascade deletes units and memberships in SQLite schema)
    await tx.delete(organizationPeriods).where(eq(organizationPeriods.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.period.delete",
      resourceType: "organization_period",
      resourceId: id,
      resourceLabel: current.label,
      before: current,
      changedFields: ["id"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  revalidatePath("/admin");
  return { success: true };
}

// ---------------------------------------------------------------------------
// 2. MANAJEMEN UNIT TREE (MAX 4 LEVEL, CYCLE PREVENTION)
// ---------------------------------------------------------------------------

export async function createUnitAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const periodId = String(formData.get("periodId") ?? "").trim();
  const parentIdRaw = formData.get("parentId")?.toString().trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const displayOrderRaw = formData.get("displayOrder");
  const activeRaw = formData.get("active");

  if (!periodId) {
    throw new Error("ID periode kepengurusan wajib disertakan");
  }

  if (!name) {
    throw new Error("Nama unit organisasi wajib diisi");
  }

  const displayOrder = parseNonNegativeInteger(displayOrderRaw, "Urutan unit");
  const active = activeRaw === "false" || activeRaw === "0" ? false : true;

  const id = crypto.randomUUID();
  const now = new Date();

  await database.transaction(async (tx) => {
    const [period] = await tx
      .select()
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, periodId))
      .limit(1);

    if (!period) {
      throw new Error("Periode kepengurusan tidak ditemukan");
    }

    assertPeriodCanChange(period.lifecycle);

    const existingUnits = await tx
      .select()
      .from(organizationUnits)
      .where(eq(organizationUnits.periodId, periodId));

    validateOrganizationTree(existingUnits);

    if (parentIdRaw) {
      const parentUnit = existingUnits.find((u) => u.id === parentIdRaw);
      if (!parentUnit) {
        throw new Error("Unit induk tidak ditemukan pada periode ini");
      }
      checkTreeCycleAndDepth(existingUnits, null, parentIdRaw);
    }

    await tx.insert(organizationUnits).values({
      id,
      periodId,
      parentId: parentIdRaw,
      name,
      displayOrder,
      active,
      createdAt: now,
      updatedAt: now,
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.unit.create",
      resourceType: "organization_unit",
      resourceId: id,
      resourceLabel: name,
      after: {
        id,
        periodId,
        parentId: parentIdRaw,
        name,
        displayOrder,
        active,
      },
      changedFields: ["periodId", "parentId", "name", "displayOrder", "active"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  revalidatePath(`/admin/organization/periods/${periodId}`);
  return { success: true, id };
}

export async function updateUnitAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const parentIdRaw = formData.get("parentId")?.toString().trim() || null;
  const displayOrderRaw = formData.get("displayOrder");
  const activeRaw = formData.get("active");

  if (!id) {
    throw new Error("ID unit wajib disertakan");
  }

  if (!name) {
    throw new Error("Nama unit organisasi wajib diisi");
  }

  const displayOrder = parseNonNegativeInteger(displayOrderRaw, "Urutan unit");
  const active = activeRaw === "false" || activeRaw === "0" ? false : true;

  let periodId = "";

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(organizationUnits)
      .where(eq(organizationUnits.id, id))
      .limit(1);

    if (!current) {
      throw new Error("Unit organisasi tidak ditemukan");
    }

    periodId = current.periodId;
    const [period] = await tx
      .select({ lifecycle: organizationPeriods.lifecycle })
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, periodId))
      .limit(1);
    if (!period) throw new Error("Periode kepengurusan tidak ditemukan");
    assertPeriodCanChange(period.lifecycle);

    const existingUnits = await tx
      .select()
      .from(organizationUnits)
      .where(eq(organizationUnits.periodId, current.periodId));

    validateOrganizationTree(existingUnits);

    if (parentIdRaw) {
      const parentUnit = existingUnits.find((u) => u.id === parentIdRaw);
      if (!parentUnit) {
        throw new Error("Unit induk tidak ditemukan pada periode ini");
      }
      checkTreeCycleAndDepth(existingUnits, id, parentIdRaw);
    }

    await tx
      .update(organizationUnits)
      .set({
        name,
        parentId: parentIdRaw,
        displayOrder,
        active,
        updatedAt: new Date(),
      })
      .where(eq(organizationUnits.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.unit.update",
      resourceType: "organization_unit",
      resourceId: id,
      resourceLabel: name,
      before: {
        name: current.name,
        parentId: current.parentId,
        displayOrder: current.displayOrder,
        active: current.active,
      },
      after: {
        name,
        parentId: parentIdRaw,
        displayOrder,
        active,
      },
      changedFields: ["name", "parentId", "displayOrder", "active"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  if (periodId) {
    revalidatePath(`/admin/organization/periods/${periodId}`);
  }
  return { success: true };
}



export async function deleteUnitAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("ID unit wajib disertakan");
  }

  let periodId = "";

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(organizationUnits)
      .where(eq(organizationUnits.id, id))
      .limit(1);

    if (!current) {
      throw new Error("Unit organisasi tidak ditemukan");
    }

    periodId = current.periodId;
    const [period] = await tx
      .select({ lifecycle: organizationPeriods.lifecycle })
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, periodId))
      .limit(1);
    if (!period) throw new Error("Periode kepengurusan tidak ditemukan");
    assertPeriodCanChange(period.lifecycle);

    await tx.delete(organizationUnits).where(eq(organizationUnits.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.unit.delete",
      resourceType: "organization_unit",
      resourceId: id,
      resourceLabel: current.name,
      before: current,
      changedFields: ["id"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  if (periodId) {
    revalidatePath(`/admin/organization/periods/${periodId}`);
  }
  return { success: true };
}

export async function reorderUnitsAction(items: { id: string; displayOrder: number }[]) {
  const actor = await requirePermission("people.manage");

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Daftar unit untuk pengurutan wajib disertakan");
  }

  const normalizedItems = items.map((item) => {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id.trim()) {
      throw new Error("ID unit tidak valid");
    }
    if (typeof item.displayOrder !== "number" || !Number.isInteger(item.displayOrder) || item.displayOrder < 0) {
      throw new Error("Urutan unit harus berupa bilangan bulat nol atau lebih");
    }
    return { id: item.id.trim(), displayOrder: item.displayOrder };
  });

  const itemIds = normalizedItems.map((item) => item.id);
  if (new Set(itemIds).size !== itemIds.length) {
    throw new Error("Unit yang sama tidak boleh diurutkan lebih dari sekali");
  }

  let periodId = "";

  await database.transaction(async (tx) => {
    const targetUnits = await tx
      .select()
      .from(organizationUnits)
      .where(inArray(organizationUnits.id, itemIds));

    if (targetUnits.length !== normalizedItems.length) {
      throw new Error("Satu atau beberapa unit organisasi tidak ditemukan");
    }

    const periodIds = new Set(targetUnits.map((unit) => unit.periodId));
    if (periodIds.size !== 1) {
      throw new Error("Pengurutan unit lintas periode tidak diizinkan");
    }

    const parentIds = new Set(targetUnits.map((unit) => unit.parentId));
    if (parentIds.size !== 1) {
      throw new Error("Unit yang diurutkan harus berada pada tingkat induk yang sama");
    }

    periodId = targetUnits[0]!.periodId;
    const [period] = await tx
      .select({ lifecycle: organizationPeriods.lifecycle })
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, periodId))
      .limit(1);
    if (!period) throw new Error("Periode kepengurusan tidak ditemukan");
    assertPeriodCanChange(period.lifecycle);

    const allPeriodUnits = await tx
      .select()
      .from(organizationUnits)
      .where(eq(organizationUnits.periodId, periodId));
    validateOrganizationTree(allPeriodUnits);

    const now = new Date();
    for (const item of normalizedItems) {
      await tx
        .update(organizationUnits)
        .set({ displayOrder: item.displayOrder, updatedAt: now })
        .where(eq(organizationUnits.id, item.id));
    }

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.unit.reorder",
      resourceType: "organization_unit",
      resourceId: periodId || "bulk",
      resourceLabel: "Pengurutan unit organisasi",
      after: { items: normalizedItems, periodId },
      changedFields: ["displayOrder"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  if (periodId) {
    revalidatePath(`/admin/organization/periods/${periodId}`);
  }
  return { success: true };
}

// ---------------------------------------------------------------------------
// 3. MANAJEMEN PENUGASAN PENGURUS (MEMBERSHIPS)
// ---------------------------------------------------------------------------

export async function assignMemberAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const periodId = String(formData.get("periodId") ?? "").trim();
  const unitId = String(formData.get("unitId") ?? "").trim();
  const personId = String(formData.get("personId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const displayOrderRaw = formData.get("displayOrder");
  const activeRaw = formData.get("active");

  if (!periodId || !unitId || !personId) {
    throw new Error("Periode, unit organisasi, dan profil orang wajib dipilih");
  }

  if (!title) {
    throw new Error("Nama jabatan wajib diisi");
  }

  const displayOrder = parseNonNegativeInteger(displayOrderRaw, "Urutan penugasan");
  const active = activeRaw === "false" || activeRaw === "0" ? false : true;

  const id = crypto.randomUUID();
  const now = new Date();

  await database.transaction(async (tx) => {
    const [period] = await tx
      .select({ lifecycle: organizationPeriods.lifecycle })
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, periodId))
      .limit(1);
    if (!period) throw new Error("Periode kepengurusan tidak ditemukan");
    assertPeriodCanChange(period.lifecycle);

    const [unit] = await tx
      .select()
      .from(organizationUnits)
      .where(and(eq(organizationUnits.id, unitId), eq(organizationUnits.periodId, periodId)))
      .limit(1);

    if (!unit) {
      throw new Error("Unit organisasi tidak valid untuk periode ini");
    }

    const [person] = await tx
      .select()
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);

    if (!person) {
      throw new Error("Profil orang tidak ditemukan");
    }

    await tx.insert(organizationMemberships).values({
      id,
      periodId,
      unitId,
      personId,
      title,
      displayOrder,
      active,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.membership.create",
      resourceType: "organization_membership",
      resourceId: id,
      resourceLabel: `${person.name} - ${title}`,
      after: {
        id,
        periodId,
        unitId,
        personId,
        title,
        displayOrder,
        active,
        version: 1,
      },
      changedFields: ["periodId", "unitId", "personId", "title", "displayOrder", "active"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  revalidatePath(`/admin/organization/periods/${periodId}`);
  return { success: true, id };
}

export async function updateMembershipAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const id = String(formData.get("id") ?? "").trim();
  const version = parseVersion(formData.get("version"), "Versi penugasan");
  const unitId = String(formData.get("unitId") ?? "").trim();
  const personId = String(formData.get("personId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const displayOrderRaw = formData.get("displayOrder");
  const activeRaw = formData.get("active");

  if (!id) {
    throw new Error("ID penugasan pengurus wajib disertakan");
  }

  if (!title) {
    throw new Error("Nama jabatan wajib diisi");
  }

  const displayOrder = parseNonNegativeInteger(displayOrderRaw, "Urutan penugasan");
  const active = activeRaw === "false" || activeRaw === "0" ? false : true;

  let periodId = "";

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(organizationMemberships)
      .where(eq(organizationMemberships.id, id))
      .limit(1);

    if (!current) {
      throw new Error("Penugasan pengurus tidak ditemukan");
    }

    const [period] = await tx
      .select({ lifecycle: organizationPeriods.lifecycle })
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, current.periodId))
      .limit(1);
    if (!period) throw new Error("Periode kepengurusan tidak ditemukan");
    assertPeriodCanChange(period.lifecycle);

    if (current.version !== version) {
      throw new Error("Versi data telah diperbarui oleh pengguna lain. Silakan muat ulang halaman.");
    }

    periodId = current.periodId;

    const targetUnitId = unitId || current.unitId;
    const [unit] = await tx
      .select()
      .from(organizationUnits)
      .where(and(eq(organizationUnits.id, targetUnitId), eq(organizationUnits.periodId, periodId)))
      .limit(1);

    if (!unit) {
      throw new Error("Unit organisasi tidak valid untuk periode ini");
    }

    const targetPersonId = personId || current.personId;
    const [person] = await tx
      .select()
      .from(people)
      .where(eq(people.id, targetPersonId))
      .limit(1);

    if (!person) {
      throw new Error("Profil orang tidak ditemukan");
    }

    const nextVersion = current.version + 1;

    await tx
      .update(organizationMemberships)
      .set({
        unitId: targetUnitId,
        personId: targetPersonId,
        title,
        displayOrder,
        active,
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(organizationMemberships.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.membership.update",
      resourceType: "organization_membership",
      resourceId: id,
      resourceLabel: `${person.name} - ${title}`,
      before: {
        unitId: current.unitId,
        personId: current.personId,
        title: current.title,
        displayOrder: current.displayOrder,
        active: current.active,
        version: current.version,
      },
      after: {
        unitId: targetUnitId,
        personId: targetPersonId,
        title,
        displayOrder,
        active,
        version: nextVersion,
      },
      changedFields: ["unitId", "personId", "title", "displayOrder", "active", "version"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  if (periodId) {
    revalidatePath(`/admin/organization/periods/${periodId}`);
  }
  return { success: true };
}

export async function removeMembershipAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("ID penugasan pengurus wajib disertakan");
  }

  let periodId = "";

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(organizationMemberships)
      .where(eq(organizationMemberships.id, id))
      .limit(1);

    if (!current) {
      throw new Error("Penugasan pengurus tidak ditemukan");
    }

    periodId = current.periodId;
    const [period] = await tx
      .select({ lifecycle: organizationPeriods.lifecycle })
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, periodId))
      .limit(1);
    if (!period) throw new Error("Periode kepengurusan tidak ditemukan");
    assertPeriodCanChange(period.lifecycle);

    await tx.delete(organizationMemberships).where(eq(organizationMemberships.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.membership.delete",
      resourceType: "organization_membership",
      resourceId: id,
      resourceLabel: current.title,
      before: current,
      changedFields: ["id"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  if (periodId) {
    revalidatePath(`/admin/organization/periods/${periodId}`);
  }
  return { success: true };
}

// ---------------------------------------------------------------------------
// 4. DIREKTORI PROFIL ORANG & SOSIAL MEDIA LINKS
// ---------------------------------------------------------------------------

export type PersonSocialLinkInput = {
  platform: SocialPlatform;
  label?: string | null;
  url: string;
  displayOrder?: number;
};

export async function savePersonAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const idRaw = formData.get("id")?.toString().trim();
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = formData.get("slug")?.toString().trim();
  const shortBio = formData.get("shortBio")?.toString().trim() || null;
  const portraitMediaIdRaw = formData.get("portraitMediaId")?.toString().trim() || null;
  const socialLinksRaw = formData.get("socialLinks")?.toString().trim() || "[]";
  const version = idRaw ? parseVersion(formData.get("version"), "Versi profil") : 1;

  if (!name) {
    throw new Error("Nama lengkap profil wajib diisi");
  }

  const baseSlug = slugInput ? slugify(slugInput) : slugify(name);
  const portraitMediaId = portraitMediaIdRaw && portraitMediaIdRaw.length > 0 ? portraitMediaIdRaw : null;

  let socialLinks: PersonSocialLinkInput[] = [];
  try {
    const parsed = JSON.parse(socialLinksRaw);
    if (!Array.isArray(parsed)) {
      throw new Error("Format tautan sosial media tidak valid");
    }
    socialLinks = parsed.map((item, idx) => {
        if (!item || typeof item !== "object") {
          throw new Error("Format tautan sosial media tidak valid");
        }
        const record = item as Record<string, unknown>;
        const platform = String(record.platform ?? "").toLowerCase();
        if (!socialPlatforms.includes(platform as SocialPlatform)) {
          throw new Error(`Platform sosial tidak valid: ${platform}`);
        }
        const url = validateHttpsUrl(String(record.url ?? ""));
        const label = record.label ? String(record.label).trim() : null;
        if (platform === "other" && !label) {
          throw new Error("Platform 'other' (lainnya) wajib menyertakan label");
        }
        const displayOrder = record.displayOrder === undefined ? idx : Number(record.displayOrder);
        if (!Number.isInteger(displayOrder) || displayOrder < 0) {
          throw new Error("Urutan tautan sosial harus berupa bilangan bulat nol atau lebih");
        }
        return {
          platform: platform as SocialPlatform,
          label,
          url,
          displayOrder,
        };
      });
  } catch (err: unknown) {
    if (err instanceof Error) throw err;
    throw new Error("Format tautan sosial media tidak valid");
  }

  const isNew = !idRaw;
  const personId = idRaw || crypto.randomUUID();
  const now = new Date();

  await database.transaction(async (tx) => {
    if (portraitMediaId) {
      const [asset] = await tx
        .select({ id: mediaAssets.id, lifecycle: mediaAssets.lifecycle, mimeType: mediaAssets.mimeType })
        .from(mediaAssets)
        .where(eq(mediaAssets.id, portraitMediaId))
        .limit(1);

      if (!asset || asset.lifecycle !== "ready" || !asset.mimeType.startsWith("image/")) {
        throw new Error("Foto portrait harus berupa gambar yang valid dan siap digunakan");
      }
    }

    let finalSlug = baseSlug;
    const existingSlug = await tx
      .select({ id: people.id, slug: people.slug })
      .from(people)
      .where(eq(people.slug, finalSlug))
      .limit(1);

    if (existingSlug.length > 0 && existingSlug[0].id !== personId) {
      finalSlug = `${baseSlug}-${personId.slice(0, 4)}`;
    }

    if (isNew) {
      await tx.insert(people).values({
        id: personId,
        name,
        slug: finalSlug,
        shortBio,
        portraitMediaId,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      for (const link of socialLinks) {
        await tx.insert(personSocialLinks).values({
          id: crypto.randomUUID(),
          personId,
          platform: link.platform,
          label: link.label,
          url: link.url,
          displayOrder: link.displayOrder ?? 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      await appendAuditLog(tx, {
        actorUserId: actor.session.user.id,
        actorLabel: actor.session.user.email,
        action: "person.create",
        resourceType: "person",
        resourceId: personId,
        resourceLabel: name,
        after: {
          id: personId,
          name,
          slug: finalSlug,
          shortBio,
          portraitMediaId,
          socialLinks,
          version: 1,
        },
        changedFields: ["name", "slug", "shortBio", "portraitMediaId", "socialLinks"],
        source: "admin-organization",
      });
    } else {
      const [current] = await tx
        .select()
        .from(people)
        .where(eq(people.id, personId))
        .limit(1);

      if (!current) {
        throw new Error("Profil orang tidak ditemukan");
      }

      const [archivedMembership] = await tx
        .select({ id: organizationMemberships.id })
        .from(organizationMemberships)
        .innerJoin(organizationPeriods, eq(organizationMemberships.periodId, organizationPeriods.id))
        .where(and(eq(organizationMemberships.personId, personId), eq(organizationPeriods.lifecycle, "archived")))
        .limit(1);
      if (archivedMembership) {
        throw new Error("Profil yang tercatat pada periode arsip tidak dapat diubah");
      }

      if (current.version !== version) {
        throw new Error("Versi data telah diperbarui oleh pengguna lain. Silakan muat ulang halaman.");
      }

      const nextVersion = current.version + 1;

      await tx
        .update(people)
        .set({
          name,
          slug: finalSlug,
          shortBio,
          portraitMediaId,
          version: nextVersion,
          updatedAt: now,
        })
        .where(eq(people.id, personId));

      await tx.delete(personSocialLinks).where(eq(personSocialLinks.personId, personId));
      for (const link of socialLinks) {
        await tx.insert(personSocialLinks).values({
          id: crypto.randomUUID(),
          personId,
          platform: link.platform,
          label: link.label,
          url: link.url,
          displayOrder: link.displayOrder ?? 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      await appendAuditLog(tx, {
        actorUserId: actor.session.user.id,
        actorLabel: actor.session.user.email,
        action: "person.update",
        resourceType: "person",
        resourceId: personId,
        resourceLabel: name,
        before: {
          name: current.name,
          slug: current.slug,
          shortBio: current.shortBio,
          portraitMediaId: current.portraitMediaId,
          version: current.version,
        },
        after: {
          name,
          slug: finalSlug,
          shortBio,
          portraitMediaId,
          socialLinks,
          version: nextVersion,
        },
        changedFields: ["name", "slug", "shortBio", "portraitMediaId", "socialLinks", "version"],
        source: "admin-organization",
      });
    }
  });

  revalidatePath("/admin/organization");
  revalidatePath("/admin/content/committee");
  return { success: true, id: personId };
}

export async function deletePersonAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const id = String(formData.get("id") ?? "").trim();
  const version = parseVersion(formData.get("version"), "Versi profil");
  if (!id) {
    throw new Error("ID profil wajib disertakan");
  }

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(people)
      .where(eq(people.id, id))
      .limit(1);

    if (!current) {
      throw new Error("Profil orang tidak ditemukan");
    }

    const [archivedMembership] = await tx
      .select({ id: organizationMemberships.id })
      .from(organizationMemberships)
      .innerJoin(organizationPeriods, eq(organizationMemberships.periodId, organizationPeriods.id))
      .where(and(eq(organizationMemberships.personId, id), eq(organizationPeriods.lifecycle, "archived")))
      .limit(1);
    if (archivedMembership) {
      throw new Error("Profil yang tercatat pada periode arsip tidak dapat dihapus");
    }

    if (current.version !== version) {
      throw new Error("Versi data telah diperbarui oleh pengguna lain. Silakan muat ulang halaman.");
    }

    await tx.delete(organizationAssignments).where(eq(organizationAssignments.personId, id));
    await tx.delete(people).where(eq(people.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "person.delete",
      resourceType: "person",
      resourceId: id,
      resourceLabel: current.name,
      before: current,
      changedFields: ["id"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  revalidatePath("/admin/content/committee");
  return { success: true };
}

// ---------------------------------------------------------------------------
// 5. PEMETAAN LEGACY ASSIGNMENT KE MEMBERSHIP MODERN
// ---------------------------------------------------------------------------

export async function mapLegacyAssignmentAction(formData: FormData) {
  const actor = await requirePermission("people.manage");

  const legacyAssignmentId = String(formData.get("legacyAssignmentId") ?? "").trim();
  const periodId = String(formData.get("periodId") ?? "").trim();
  const unitId = String(formData.get("unitId") ?? "").trim();
  const titleOverride = formData.get("title")?.toString().trim();
  const personIdOverride = formData.get("personId")?.toString().trim();

  if (!legacyAssignmentId || !periodId || !unitId) {
    throw new Error("ID penugasan lama, periode baru, dan unit baru wajib dipilih");
  }

  const newMembershipId = crypto.randomUUID();
  const now = new Date();

  await database.transaction(async (tx) => {
    const [period] = await tx
      .select({ lifecycle: organizationPeriods.lifecycle })
      .from(organizationPeriods)
      .where(eq(organizationPeriods.id, periodId))
      .limit(1);
    if (!period) throw new Error("Periode kepengurusan tidak ditemukan");
    assertPeriodCanChange(period.lifecycle);

    const [legacy] = await tx
      .select()
      .from(organizationAssignments)
      .where(eq(organizationAssignments.id, legacyAssignmentId))
      .limit(1);

    if (!legacy) {
      throw new Error("Penugasan kepengurusan lama tidak ditemukan");
    }

    const [unit] = await tx
      .select()
      .from(organizationUnits)
      .where(and(eq(organizationUnits.id, unitId), eq(organizationUnits.periodId, periodId)))
      .limit(1);

    if (!unit) {
      throw new Error("Unit organisasi tidak valid untuk periode terpilih");
    }

    const personId = personIdOverride || legacy.personId;
    const title = titleOverride || legacy.title;

    const [person] = await tx
      .select()
      .from(people)
      .where(eq(people.id, personId))
      .limit(1);

    if (!person) {
      throw new Error("Profil orang tidak ditemukan");
    }

    await tx.insert(organizationMemberships).values({
      id: newMembershipId,
      periodId,
      unitId,
      personId,
      title,
      displayOrder: legacy.displayOrder ?? 0,
      active: legacy.active,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "organization.legacy.map",
      resourceType: "organization_membership",
      resourceId: newMembershipId,
      resourceLabel: `Pemetaan legacy ${legacy.title} -> ${person.name} (${title})`,
      after: {
        id: newMembershipId,
        legacyAssignmentId,
        periodId,
        unitId,
        personId,
        title,
      },
      changedFields: ["periodId", "unitId", "personId", "title"],
      source: "admin-organization",
    });
  });

  revalidatePath("/admin/organization");
  revalidatePath(`/admin/organization/periods/${periodId}`);
  return { success: true, id: newMembershipId };
}
