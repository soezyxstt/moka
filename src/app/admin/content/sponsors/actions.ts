"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { appendAuditLog } from "@/server/auth/audit";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { mediaAssets, sponsors } from "@/server/db/schema";

import { SPONSOR_TIERS, type SponsorTier } from "./constants";
import { validateWebsiteUrl } from "./utils";

export async function createSponsorAction(formData: FormData) {
  const actor = await requirePermission("content.edit");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const name = String(formData.get("name") ?? "").trim();
  const tier = String(formData.get("tier") ?? "").trim();
  const websiteRaw = formData.get("website")?.toString().trim();
  const logoMediaIdRaw = formData.get("logoMediaId")?.toString().trim();
  const displayOrderRaw = formData.get("displayOrder");

  if (!name) {
    throw new Error("Nama sponsor wajib diisi");
  }

  if (!SPONSOR_TIERS.includes(tier as SponsorTier)) {
    throw new Error("Tier sponsor tidak valid");
  }

  const website = validateWebsiteUrl(websiteRaw);
  const displayOrder = Number.isInteger(Number(displayOrderRaw))
    ? Math.max(0, Number(displayOrderRaw))
    : 0;

  // Sponsor baru selalu menunggu penerbitan terpisah dari pengguna berizin.
  const active = false;

  const logoMediaId = logoMediaIdRaw && logoMediaIdRaw.length > 0 ? logoMediaIdRaw : null;
  if (logoMediaId) {
    const [asset] = await database
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, logoMediaId))
      .limit(1);

    if (!asset || asset.lifecycle !== "ready" || !asset.mimeType.startsWith("image/")) {
      throw new Error("Logo harus berupa gambar yang valid dan siap digunakan");
    }
  }

  const id = crypto.randomUUID();
  await database.transaction(async (tx) => {
    await tx.insert(sponsors).values({
      id,
      editionId: editionContext.id,
      name,
      tier: tier as SponsorTier,
      website,
      logoMediaId,
      displayOrder,
      active,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "sponsor.create",
      resourceType: "sponsor",
      resourceId: id,
      resourceLabel: name,
      after: {
        id,
        editionId: editionContext.id,
        name,
        tier,
        website,
        logoMediaId,
        displayOrder,
        active,
        version: 1,
      },
      changedFields: [
        "editionId",
        "name",
        "tier",
        "website",
        "logoMediaId",
        "displayOrder",
        "active",
        "version",
      ],
      source: "admin-content",
    });
  });

  revalidatePath("/admin/content/sponsors");
  revalidatePath("/admin");
}

export async function updateSponsorAction(formData: FormData) {
  const actor = await requirePermission("content.edit");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const id = String(formData.get("id") ?? "").trim();
  const version = Number(formData.get("version") ?? 1);
  const name = String(formData.get("name") ?? "").trim();
  const tier = String(formData.get("tier") ?? "").trim();
  const websiteRaw = formData.get("website")?.toString().trim();
  const logoMediaIdRaw = formData.get("logoMediaId")?.toString().trim();
  const displayOrderRaw = formData.get("displayOrder");

  if (!id) {
    throw new Error("ID sponsor wajib disertakan");
  }

  if (!name) {
    throw new Error("Nama sponsor wajib diisi");
  }

  if (!SPONSOR_TIERS.includes(tier as SponsorTier)) {
    throw new Error("Tier sponsor tidak valid");
  }

  const website = validateWebsiteUrl(websiteRaw);
  const displayOrder = Number.isInteger(Number(displayOrderRaw))
    ? Math.max(0, Number(displayOrderRaw))
    : 0;

  const logoMediaId = logoMediaIdRaw && logoMediaIdRaw.length > 0 ? logoMediaIdRaw : null;
  if (logoMediaId) {
    const [asset] = await database
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, logoMediaId))
      .limit(1);

    if (!asset || asset.lifecycle !== "ready" || !asset.mimeType.startsWith("image/")) {
      throw new Error("Logo harus berupa gambar yang valid dan siap digunakan");
    }
  }

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(sponsors)
      .where(and(eq(sponsors.id, id), eq(sponsors.editionId, editionContext.id)))
      .limit(1);

    if (!current) {
      throw new Error("Sponsor tidak ditemukan pada edisi ini");
    }

    if (current.version !== version) {
      throw new Error("Versi data telah diperbarui oleh pengguna lain. Silakan muat ulang halaman.");
    }

    const desiredActive = formData.has("active")
      ? ["true", "on", "1"].includes(String(formData.get("active")))
      : current.active;
    const canPublish = actor.effectivePermissions.has("content.publish");
    let active = current.active;
    if (desiredActive !== current.active) {
      if (desiredActive && !canPublish) {
        throw new Error("Izin penayangan konten (content.publish) diperlukan untuk mengaktifkan sponsor");
      }
      active = desiredActive;
    }

    const nextVersion = current.version + 1;
    await tx
      .update(sponsors)
      .set({
        name,
        tier: tier as SponsorTier,
        website,
        logoMediaId,
        displayOrder,
        active,
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(sponsors.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "sponsor.update",
      resourceType: "sponsor",
      resourceId: id,
      resourceLabel: name,
      before: {
        name: current.name,
        tier: current.tier,
        website: current.website,
        logoMediaId: current.logoMediaId,
        displayOrder: current.displayOrder,
        active: current.active,
        version: current.version,
      },
      after: {
        name,
        tier,
        website,
        logoMediaId,
        displayOrder,
        active,
        version: nextVersion,
      },
      changedFields: [
        "name",
        "tier",
        "website",
        "logoMediaId",
        "displayOrder",
        "active",
        "version",
      ],
      source: "admin-content",
    });
  });

  revalidatePath("/admin/content/sponsors");
  revalidatePath("/admin");
}

export async function deleteSponsorAction(formData: FormData) {
  const actor = await requirePermission("content.edit");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("ID sponsor wajib disertakan");
  }

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(sponsors)
      .where(and(eq(sponsors.id, id), eq(sponsors.editionId, editionContext.id)))
      .limit(1);

    if (!current) {
      throw new Error("Sponsor tidak ditemukan pada edisi ini");
    }

    await tx.delete(sponsors).where(eq(sponsors.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "sponsor.delete",
      resourceType: "sponsor",
      resourceId: id,
      resourceLabel: current.name,
      before: current,
      changedFields: ["id"],
      source: "admin-content",
    });
  });

  revalidatePath("/admin/content/sponsors");
  revalidatePath("/admin");
}

export async function toggleSponsorActiveAction(formData: FormData) {
  const actor = await requirePermission("content.edit");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("ID sponsor wajib disertakan");
  }

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(sponsors)
      .where(and(eq(sponsors.id, id), eq(sponsors.editionId, editionContext.id)))
      .limit(1);

    if (!current) {
      throw new Error("Sponsor tidak ditemukan pada edisi ini");
    }

    const nextActive = !current.active;
    if (nextActive && !actor.effectivePermissions.has("content.publish")) {
      throw new Error("Izin penayangan konten (content.publish) diperlukan untuk mengaktifkan sponsor");
    }

    const nextVersion = current.version + 1;
    await tx
      .update(sponsors)
      .set({
        active: nextActive,
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(sponsors.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: nextActive ? "sponsor.activate" : "sponsor.deactivate",
      resourceType: "sponsor",
      resourceId: id,
      resourceLabel: current.name,
      before: {
        active: current.active,
        version: current.version,
      },
      after: {
        active: nextActive,
        version: nextVersion,
      },
      changedFields: ["active", "version"],
      source: "admin-content",
    });
  });

  revalidatePath("/admin/content/sponsors");
  revalidatePath("/admin");
}
