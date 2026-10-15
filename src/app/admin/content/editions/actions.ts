"use server";import { eq } from "drizzle-orm";import { revalidatePath } from "next/cache";import { requirePermission } from "@/server/auth/authorization";import { appendAuditLog } from "@/server/auth/audit";import { database } from "@/server/db/client";import { categories, editions } from "@/server/db/schema";
import { DEFAULT_CATEGORIES, getEditionReadiness } from "@/server/cms/edition-readiness";
export async function createEditionAction(formData: FormData) {
  const actor = await requirePermission("settings.manage");
  const year = Number(formData.get("year"));
  const name = String(formData.get("name") ?? "").trim();
  if (!Number.isInteger(year) || year < 2020 || year > 2100 || !name || name.length > 200) throw new Error("Edisi tidak valid");
  const id = crypto.randomUUID();
  await database.transaction(async (tx) => {
    await tx.insert(editions).values({ id, year, slug: String(year), name, lifecycle: "draft" });
    await tx.insert(categories).values(DEFAULT_CATEGORIES.map((category, index) => ({ ...category, editionId: id, displayOrder: index })));
    await appendAuditLog(tx, { actorUserId: actor.session.user.id, actorLabel: actor.session.user.email, action: "edition.create", resourceType: "edition", resourceId: id, resourceLabel: name, after: { year, name, lifecycle: "draft", categories: DEFAULT_CATEGORIES }, changedFields: ["year", "name", "lifecycle", "categories"], source: "admin-content" });
  });
  revalidatePath("/admin", "layout");
}

export async function createCategoryAction(formData: FormData) {
  const actor = await requirePermission("participants.manage");
  const editionId = String(formData.get("editionId") ?? "");
  const category = DEFAULT_CATEGORIES.find((item) => item.code === formData.get("code"));
  if (!category) throw new Error("Pilih kategori JD, MD, JR, atau MR");
  await database.transaction(async (tx) => {
    const [edition] = await tx.select().from(editions).where(eq(editions.id, editionId)).limit(1);
    if (!edition || edition.lifecycle === "archived") throw new Error("Edisi tidak dapat diubah");
    const existing = await tx.select().from(categories).where(eq(categories.editionId, editionId));
    if (existing.some((row) => row.code === category.code)) throw new Error("Kategori sudah tersedia");
    const [created] = await tx.insert(categories).values({ ...category, editionId }).returning();
    await appendAuditLog(tx, { actorUserId: actor.session.user.id, actorLabel: actor.session.user.email, action: "category.create", resourceType: "category", resourceId: created.id, resourceLabel: category.label, after: created, changedFields: ["editionId", "code", "slug", "label"], source: "admin-content" });
  });
  revalidatePath("/admin/content/editions");
}

export async function activateEditionAction(formData: FormData) {
  const actor = await requirePermission("settings.manage");
  const editionId = String(formData.get("editionId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const version = Number(formData.get("version"));
  if (!editionId || reason.length < 8 || reason.length > 1000 || !Number.isInteger(version)) throw new Error("Alasan aktivasi minimal 8 karakter");
  await database.transaction(async (tx) => {
    const [edition] = await tx.select().from(editions).where(eq(editions.id, editionId)).limit(1);
    if (!edition || edition.lifecycle !== "draft" || edition.version !== version) throw new Error("Edisi berubah atau bukan draf. Muat ulang halaman.");
    const missing = (await getEditionReadiness(tx, editionId)).filter((item) => !item.ready);
    if (missing.length) throw new Error(`Lengkapi sebelum aktivasi: ${missing.map((item) => item.label).join(", ")}`);
    const previous = await tx.select().from(editions).where(eq(editions.lifecycle, "active"));
    for (const current of previous) await tx.update(editions).set({ lifecycle: "archived", version: current.version + 1, updatedAt: new Date() }).where(eq(editions.id, current.id));
    await tx.update(editions).set({ lifecycle: "active", version: version + 1, updatedAt: new Date() }).where(eq(editions.id, editionId));
    await appendAuditLog(tx, { actorUserId: actor.session.user.id, actorLabel: actor.session.user.email, action: "edition.activate", resourceType: "edition", resourceId: editionId, resourceLabel: edition.name, before: { edition, previous }, after: { lifecycle: "active", archivedEditionIds: previous.map((item) => item.id) }, changedFields: ["lifecycle", "version"], source: "admin-content", reason });
  });
  revalidatePath("/", "layout");
}
