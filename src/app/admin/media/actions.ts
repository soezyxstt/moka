"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "@/server/cms/public-cache";
import { revalidatePath as revalidateAdminPath } from "next/cache";

import { appendAuditLog } from "@/server/auth/audit";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { editions, mediaAssets, mediaFolders } from "@/server/db/schema";
import { listMediaAssets, type ListMediaAssetsInput } from "@/server/media/queries";

function normalizeFolderName(value: FormDataEntryValue | null) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) throw new Error("Nama folder harus berisi 1 sampai 80 karakter");
  return name;
}

function toFolderSlug(name: string) {
  const slug = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("Nama folder tidak dapat digunakan");
  return slug;
}

async function getFolder(id: string) {
  const [folder] = await database.select().from(mediaFolders).where(eq(mediaFolders.id, id)).limit(1);
  if (!folder) throw new Error("Folder tidak ditemukan");
  return folder;
}

export async function createMediaFolderAction(formData: FormData): Promise<void> {
  const actor = await requirePermission("media.manage");
  const name = normalizeFolderName(formData.get("name"));
  const slug = toFolderSlug(name);
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const rawEditionId = String(formData.get("editionId") ?? "").trim() || null;

  if (parentId) await getFolder(parentId);
  if (rawEditionId) {
    const [edition] = await database.select().from(editions).where(eq(editions.id, rawEditionId)).limit(1);
    if (!edition) throw new Error("Edisi tidak ditemukan");
  }

  const [duplicate] = await database
    .select({ id: mediaFolders.id })
    .from(mediaFolders)
    .where(and(parentId ? eq(mediaFolders.parentId, parentId) : isNull(mediaFolders.parentId), eq(mediaFolders.slug, slug)))
    .limit(1);
  if (duplicate) throw new Error("Nama folder sudah digunakan pada lokasi ini");

  const id = crypto.randomUUID();
  const after = { id, parentId, editionId: rawEditionId, name, slug };

  await database.transaction(async (tx) => {
    await tx.insert(mediaFolders).values({ ...after, ownerUserId: actor.session.user.id });
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "media.folder.create",
      resourceType: "mediaFolder",
      resourceId: id,
      resourceLabel: name,
      after,
      changedFields: ["parentId", "editionId", "name", "slug"],
      source: "admin-media",
    });
  });
  revalidateAdminPath("/admin/media");
}

export async function renameMediaFolderAction(formData: FormData): Promise<void> {
  const actor = await requirePermission("media.manage");
  const folderId = String(formData.get("folderId") ?? "").trim();
  const folder = await getFolder(folderId);
  const name = normalizeFolderName(formData.get("name"));
  const slug = toFolderSlug(name);
  const rawEditionId = formData.has("editionId") ? (String(formData.get("editionId") ?? "").trim() || null) : folder.editionId;

  if (rawEditionId && rawEditionId !== folder.editionId) {
    const [edition] = await database.select().from(editions).where(eq(editions.id, rawEditionId)).limit(1);
    if (!edition) throw new Error("Edisi tidak ditemukan");
  }

  await database.transaction(async (tx) => {
    await tx.update(mediaFolders).set({ name, slug, editionId: rawEditionId, updatedAt: new Date() }).where(eq(mediaFolders.id, folderId));
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "media.folder.rename",
      resourceType: "mediaFolder",
      resourceId: folderId,
      resourceLabel: name,
      before: { name: folder.name, slug: folder.slug, editionId: folder.editionId },
      after: { name, slug, editionId: rawEditionId },
      changedFields: ["name", "slug", "editionId"],
      source: "admin-media",
    });
  });
  revalidateAdminPath("/admin/media");
}

export async function updateMediaAssetMetadataAction(formData: FormData): Promise<void> {
  const actor = await requirePermission("media.manage");
  const assetId = String(formData.get("assetId") ?? "").trim();
  if (!assetId) throw new Error("ID media wajib diisi");

  const [asset] = await database.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
  if (!asset) throw new Error("Media tidak ditemukan");

  const rawAlt = formData.get("alt");
  const rawDecorative = formData.get("decorative");
  const decorative = rawDecorative === "true" || rawDecorative === "on" || rawDecorative === "1";
  const alt = decorative ? null : (rawAlt !== null ? String(rawAlt).trim() || null : asset.alt);

  const after = { alt, decorative };

  await database.transaction(async (tx) => {
    await tx.update(mediaAssets).set({
      alt: after.alt,
      decorative: after.decorative,
      updatedAt: new Date(),
    }).where(eq(mediaAssets.id, assetId));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "media.asset.metadata.update",
      resourceType: "mediaAsset",
      resourceId: asset.id,
      resourceLabel: asset.filename,
      before: { alt: asset.alt, decorative: asset.decorative },
      after,
      changedFields: ["alt", "decorative"],
      source: "admin-media",
      reason: "Pembaruan metadata alt dan dekoratif",
    });
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin/content/site-assets");
  revalidatePath("/admin/content/participants");
}

export async function moveMediaAssetAction(formData: FormData): Promise<void> {
  const actor = await requirePermission("media.manage");
  const assetId = String(formData.get("assetId") ?? "").trim();
  const folderId = String(formData.get("folderId") ?? "").trim() || null;
  const [asset] = await database.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)).limit(1);
  if (!asset) throw new Error("Media tidak ditemukan");
  if (folderId) await getFolder(folderId);
  if (asset.folderId === folderId) return;

  await database.transaction(async (tx) => {
    await tx.update(mediaAssets).set({ folderId, updatedAt: new Date() }).where(and(eq(mediaAssets.id, assetId), asset.folderId ? eq(mediaAssets.folderId, asset.folderId) : isNull(mediaAssets.folderId)));
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "media.asset.move",
      resourceType: "mediaAsset",
      resourceId: asset.id,
      resourceLabel: asset.filename,
      before: { folderId: asset.folderId },
      after: { folderId },
      changedFields: ["folderId"],
      source: "admin-media",
      reason: "Dipindahkan melalui media explorer",
    });
  });
  revalidateAdminPath("/admin/media");
}

export async function getMediaAssetsAction(filters?: ListMediaAssetsInput) {
  await requirePermission("media.view");
  return listMediaAssets(database, filters);
}
