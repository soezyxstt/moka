"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "@/server/cms/public-cache";

import { appendAuditLog } from "@/server/auth/audit";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { events, galleries, galleryItems, mediaAssets } from "@/server/db/schema";
import {
  assertCompleteGalleryItemOrder,
  normalizeYoutubeId,
} from "@/server/gallery-validation";

const concurrentEditMessage =
  "Data galeri telah diperbarui oleh pengguna lain. Silakan muat ulang.";

async function requireReadyImages(mediaIds: string[]) {
  const uniqueIds = [...new Set(mediaIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  const rows = await database
    .select({ id: mediaAssets.id, mimeType: mediaAssets.mimeType, lifecycle: mediaAssets.lifecycle })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, uniqueIds));
  const validIds = new Set(
    rows
      .filter((asset) => asset.lifecycle === "ready" && asset.mimeType.startsWith("image/"))
      .map((asset) => asset.id),
  );
  if (uniqueIds.some((id) => !validIds.has(id))) {
    throw new Error("Pilih gambar dari pustaka media yang sudah siap");
  }
}

export async function createGalleryAction(input: {
  title: string;
  slug: string;
  description?: string | null;
  coverMediaId?: string | null;
  ownerType: "standalone" | "event";
  ownerId?: string | null;
  displayOrder?: number;
  status?: "draft" | "published";
}) {
  const actor = await requirePermission("gallery.manage");
  const edition = await getAdminEditionContext();
  if (!edition) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  if (title.length < 2) {
    throw new Error("Judul galeri minimal 2 karakter");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Format slug tidak valid");
  }
  await requireReadyImages(input.coverMediaId ? [input.coverMediaId] : []);

  let finalOwnerId = input.ownerId?.trim() || "";
  if (input.ownerType === "event") {
    if (!finalOwnerId) {
      throw new Error("Acara wajib dipilih untuk album galeri bertipe acara");
    }
    const [targetEvent] = await database
      .select()
      .from(events)
      .where(and(eq(events.id, finalOwnerId), eq(events.editionId, edition.id)));
    if (!targetEvent) {
      throw new Error("Acara yang dipilih tidak ditemukan pada edisi ini");
    }
  } else {
    finalOwnerId = edition.id;
  }

  const existingSlug = await database
    .select()
    .from(galleries)
    .where(and(eq(galleries.editionId, edition.id), eq(galleries.slug, slug)));
  if (existingSlug.length > 0) {
    throw new Error("Slug galeri sudah digunakan pada edisi ini");
  }

  const galleryId = crypto.randomUUID();
  const now = new Date();

  await database.transaction(async (tx) => {
    if (input.ownerType === "event") {
      const [targetEvent] = await tx
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, finalOwnerId), eq(events.editionId, edition.id)))
        .limit(1);
      if (!targetEvent) {
        throw new Error("Acara yang dipilih tidak ditemukan pada edisi ini");
      }
    }
    await tx.insert(galleries).values({
      id: galleryId,
      editionId: edition.id,
      title,
      slug,
      description: input.description?.trim() || null,
      coverMediaId: input.coverMediaId || null,
      ownerType: input.ownerType,
      ownerId: finalOwnerId,
      displayOrder: input.displayOrder ?? 0,
      status: input.status ?? "published",
      active: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "gallery.create",
      resourceType: "gallery",
      resourceId: galleryId,
      resourceLabel: title,
      after: {
        title,
        slug,
        ownerType: input.ownerType,
        ownerId: finalOwnerId,
        editionId: edition.id,
      },
      changedFields: ["title", "slug", "ownerType", "ownerId", "editionId"],
      source: "admin-galleries",
    });
  });

  revalidatePath("/admin/content/galleries");
  return { success: true, galleryId };
}

export async function updateGalleryAction(input: {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverMediaId?: string | null;
  ownerType: "standalone" | "event";
  ownerId?: string | null;
  displayOrder?: number;
  status?: "draft" | "published";
  active?: boolean;
  version: number;
}) {
  const actor = await requirePermission("gallery.manage");
  const edition = await getAdminEditionContext();
  if (!edition) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const [existing] = await database
    .select()
    .from(galleries)
    .where(and(eq(galleries.id, input.id), eq(galleries.editionId, edition.id)));
  if (!existing) {
    throw new Error("Galeri tidak ditemukan");
  }
  if (existing.version !== input.version) {
    throw new Error(concurrentEditMessage);
  }

  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  if (title.length < 2) {
    throw new Error("Judul galeri minimal 2 karakter");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Format slug tidak valid");
  }
  await requireReadyImages(input.coverMediaId ? [input.coverMediaId] : []);

  let finalOwnerId = input.ownerId?.trim() || "";
  if (input.ownerType === "event") {
    if (!finalOwnerId) {
      throw new Error("Acara wajib dipilih untuk album galeri bertipe acara");
    }
    const [targetEvent] = await database
      .select()
      .from(events)
      .where(and(eq(events.id, finalOwnerId), eq(events.editionId, edition.id)));
    if (!targetEvent) {
      throw new Error("Acara yang dipilih tidak ditemukan pada edisi ini");
    }
  } else {
    finalOwnerId = edition.id;
  }

  const existingSlug = await database
    .select()
    .from(galleries)
    .where(and(eq(galleries.editionId, edition.id), eq(galleries.slug, slug)));
  if (existingSlug.length > 0 && existingSlug[0].id !== input.id) {
    throw new Error("Slug galeri sudah digunakan oleh album lain pada edisi ini");
  }

  const now = new Date();

  await database.transaction(async (tx) => {
    if (input.ownerType === "event") {
      const [targetEvent] = await tx
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, finalOwnerId), eq(events.editionId, edition.id)))
        .limit(1);
      if (!targetEvent) {
        throw new Error("Acara yang dipilih tidak ditemukan pada edisi ini");
      }
    }
    const changed = await tx
      .update(galleries)
      .set({
        title,
        slug,
        description: input.description !== undefined ? input.description?.trim() || null : existing.description,
        coverMediaId: input.coverMediaId !== undefined ? input.coverMediaId : existing.coverMediaId,
        ownerType: input.ownerType,
        ownerId: finalOwnerId,
        displayOrder: input.displayOrder ?? existing.displayOrder,
        status: input.status ?? existing.status,
        active: input.active ?? existing.active,
        version: existing.version + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(galleries.id, input.id),
          eq(galleries.editionId, edition.id),
          eq(galleries.version, input.version),
        ),
      )
      .returning({ id: galleries.id });
    if (changed.length !== 1) {
      throw new Error(concurrentEditMessage);
    }

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "gallery.update",
      resourceType: "gallery",
      resourceId: input.id,
      resourceLabel: title,
      before: existing,
      after: {
        title,
        slug,
        description:
          input.description !== undefined ? input.description?.trim() || null : existing.description,
        coverMediaId:
          input.coverMediaId !== undefined ? input.coverMediaId : existing.coverMediaId,
        ownerType: input.ownerType,
        ownerId: finalOwnerId,
        displayOrder: input.displayOrder ?? existing.displayOrder,
        status: input.status ?? existing.status,
        active: input.active ?? existing.active,
        version: existing.version + 1,
      },
      changedFields: [
        "title",
        "slug",
        "description",
        "coverMediaId",
        "ownerType",
        "ownerId",
        "displayOrder",
        "status",
        "active",
        "version",
      ],
      source: "admin-galleries",
    });
  });

  revalidatePath("/admin/content/galleries");
  revalidatePath(`/admin/content/galleries/${input.id}`);
  return { success: true, version: input.version + 1 };
}

export async function deleteGalleryAction(input: { id: string; expectedVersion: number }) {
  const actor = await requirePermission("gallery.manage");
  const edition = await getAdminEditionContext();
  if (!edition) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const [existing] = await database
    .select()
    .from(galleries)
    .where(and(eq(galleries.id, input.id), eq(galleries.editionId, edition.id)));
  if (!existing) {
    throw new Error("Galeri tidak ditemukan");
  }
  if (existing.version !== input.expectedVersion) {
    throw new Error(concurrentEditMessage);
  }

  await database.transaction(async (tx) => {
    const deleted = await tx
      .delete(galleries)
      .where(
        and(
          eq(galleries.id, input.id),
          eq(galleries.editionId, edition.id),
          eq(galleries.version, input.expectedVersion),
        ),
      )
      .returning({ id: galleries.id });
    if (deleted.length !== 1) {
      throw new Error(concurrentEditMessage);
    }
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "gallery.delete",
      resourceType: "gallery",
      resourceId: input.id,
      resourceLabel: existing.title,
      before: existing,
      changedFields: ["deleted"],
      source: "admin-galleries",
    });
  });

  revalidatePath("/admin/content/galleries");
  return { success: true };
}

export async function addGalleryItemsAction(input: {
  galleryId: string;
  expectedGalleryVersion: number;
  mediaIds?: string[];
  youtubeId?: string | null;
  caption?: string | null;
}) {
  const actor = await requirePermission("gallery.manage");
  const edition = await getAdminEditionContext();
  if (!edition) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }
  const [gallery] = await database
    .select()
    .from(galleries)
    .where(and(eq(galleries.id, input.galleryId), eq(galleries.editionId, edition.id)));
  if (!gallery) {
    throw new Error("Galeri tidak ditemukan");
  }
  if (gallery.version !== input.expectedGalleryVersion) {
    throw new Error(concurrentEditMessage);
  }

  const mediaIds = [...new Set((input.mediaIds ?? []).filter(Boolean))];
  const youtubeId = normalizeYoutubeId(input.youtubeId);
  if (mediaIds.length === 0 && !youtubeId) {
    throw new Error("Pilih minimal satu foto atau video YouTube");
  }
  await requireReadyImages(mediaIds);

  const now = new Date();
  const createdItems: Array<{
    id: string;
    mediaId: string | null;
    youtubeId: string | null;
    caption: string | null;
    displayOrder: number;
  }> = [];

  // Ambil item terakhir untuk displayOrder
  const existingItems = await database
    .select()
    .from(galleryItems)
    .where(eq(galleryItems.galleryId, input.galleryId))
    .orderBy(asc(galleryItems.displayOrder));

  let startOrder = existingItems.length > 0 ? existingItems[existingItems.length - 1].displayOrder + 1 : 1;

  await database.transaction(async (tx) => {
    // 1. YouTube video insertion (single)
    if (youtubeId) {
      const itemId = crypto.randomUUID();
      const displayOrder = startOrder++;
      await tx.insert(galleryItems).values({
        id: itemId,
        galleryId: input.galleryId,
        mediaId: null,
        youtubeId,
        caption: input.caption?.trim() || null,
        displayOrder,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      createdItems.push({
        id: itemId,
        mediaId: null,
        youtubeId,
        caption: input.caption?.trim() || null,
        displayOrder,
      });
    }

    // 2. Batch Media assets insertion
    if (mediaIds.length > 0) {
      for (const mediaId of mediaIds) {
        const itemId = crypto.randomUUID();
        const displayOrder = startOrder++;
        await tx.insert(galleryItems).values({
          id: itemId,
          galleryId: input.galleryId,
          mediaId,
          youtubeId: null,
          caption: input.caption?.trim() || null,
          displayOrder,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
        createdItems.push({
          id: itemId,
          mediaId,
          youtubeId: null,
          caption: input.caption?.trim() || null,
          displayOrder,
        });
      }
    }

    const changed = await tx
      .update(galleries)
      .set({ version: gallery.version + 1, updatedAt: now })
      .where(
        and(
          eq(galleries.id, input.galleryId),
          eq(galleries.editionId, edition.id),
          eq(galleries.version, input.expectedGalleryVersion),
        ),
      )
      .returning({ id: galleries.id });
    if (changed.length !== 1) {
      throw new Error(concurrentEditMessage);
    }

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "gallery.items.add",
      resourceType: "gallery",
      resourceId: input.galleryId,
      resourceLabel: gallery.title,
      after: {
        mediaCount: mediaIds.length,
        youtubeId,
      },
      changedFields: ["items", "version"],
      source: "admin-galleries",
    });
  });

  revalidatePath(`/admin/content/galleries/${input.galleryId}`);
  return {
    success: true,
    version: input.expectedGalleryVersion + 1,
    items: createdItems,
  };
}

export async function updateGalleryItemAction(input: {
  itemId: string;
  expectedGalleryVersion: number;
  caption?: string | null;
  active?: boolean;
}) {
  const actor = await requirePermission("gallery.manage");
  const edition = await getAdminEditionContext();
  if (!edition) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }
  const [item] = await database
    .select({ item: galleryItems, gallery: galleries })
    .from(galleryItems)
    .innerJoin(galleries, eq(galleryItems.galleryId, galleries.id))
    .where(and(eq(galleryItems.id, input.itemId), eq(galleries.editionId, edition.id)));
  if (!item) {
    throw new Error("Item galeri tidak ditemukan");
  }
  if (item.gallery.version !== input.expectedGalleryVersion) {
    throw new Error(concurrentEditMessage);
  }

  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .update(galleryItems)
      .set({
        caption:
          input.caption !== undefined ? input.caption?.trim() || null : item.item.caption,
        active: input.active !== undefined ? input.active : item.item.active,
        updatedAt: now,
      })
      .where(and(eq(galleryItems.id, input.itemId), eq(galleryItems.galleryId, item.gallery.id)));
    const changed = await tx
      .update(galleries)
      .set({ version: item.gallery.version + 1, updatedAt: now })
      .where(
        and(
          eq(galleries.id, item.gallery.id),
          eq(galleries.editionId, edition.id),
          eq(galleries.version, input.expectedGalleryVersion),
        ),
      )
      .returning({ id: galleries.id });
    if (changed.length !== 1) throw new Error(concurrentEditMessage);
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "gallery.item.update",
      resourceType: "gallery",
      resourceId: item.gallery.id,
      resourceLabel: item.gallery.title,
      before: item.item,
      after: { caption: input.caption, active: input.active },
      changedFields: ["items", "version"],
      source: "admin-galleries",
    });
  });

  revalidatePath(`/admin/content/galleries/${item.gallery.id}`);
  return { success: true, version: input.expectedGalleryVersion + 1 };
}

export async function deleteGalleryItemAction(input: {
  itemId: string;
  expectedGalleryVersion: number;
}) {
  const actor = await requirePermission("gallery.manage");
  const edition = await getAdminEditionContext();
  if (!edition) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }
  const [item] = await database
    .select({ item: galleryItems, gallery: galleries })
    .from(galleryItems)
    .innerJoin(galleries, eq(galleryItems.galleryId, galleries.id))
    .where(and(eq(galleryItems.id, input.itemId), eq(galleries.editionId, edition.id)));
  if (!item) {
    throw new Error("Item galeri tidak ditemukan");
  }
  if (item.gallery.version !== input.expectedGalleryVersion) {
    throw new Error(concurrentEditMessage);
  }

  const now = new Date();
  await database.transaction(async (tx) => {
    await tx
      .delete(galleryItems)
      .where(and(eq(galleryItems.id, input.itemId), eq(galleryItems.galleryId, item.gallery.id)));
    const changed = await tx
      .update(galleries)
      .set({ version: item.gallery.version + 1, updatedAt: now })
      .where(
        and(
          eq(galleries.id, item.gallery.id),
          eq(galleries.editionId, edition.id),
          eq(galleries.version, input.expectedGalleryVersion),
        ),
      )
      .returning({ id: galleries.id });
    if (changed.length !== 1) throw new Error(concurrentEditMessage);
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "gallery.item.delete",
      resourceType: "gallery",
      resourceId: item.gallery.id,
      resourceLabel: item.gallery.title,
      before: item.item,
      changedFields: ["items", "version"],
      source: "admin-galleries",
    });
  });

  revalidatePath(`/admin/content/galleries/${item.gallery.id}`);
  return { success: true, version: input.expectedGalleryVersion + 1 };
}

export async function reorderGalleryItemsAction(input: {
  galleryId: string;
  itemIds: string[];
  expectedGalleryVersion: number;
}) {
  const actor = await requirePermission("gallery.manage");
  const edition = await getAdminEditionContext();
  if (!edition) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }
  const [gallery] = await database
    .select()
    .from(galleries)
    .where(and(eq(galleries.id, input.galleryId), eq(galleries.editionId, edition.id)));
  if (!gallery) throw new Error("Galeri tidak ditemukan");
  if (gallery.version !== input.expectedGalleryVersion) throw new Error(concurrentEditMessage);

  const existingItems = await database
    .select({ id: galleryItems.id })
    .from(galleryItems)
    .where(eq(galleryItems.galleryId, gallery.id));
  assertCompleteGalleryItemOrder(
    input.itemIds,
    existingItems.map((item) => item.id),
  );
  const now = new Date();

  await database.transaction(async (tx) => {
    for (let i = 0; i < input.itemIds.length; i++) {
      await tx
        .update(galleryItems)
        .set({ displayOrder: i + 1, updatedAt: now })
        .where(
          and(
            eq(galleryItems.id, input.itemIds[i]),
            eq(galleryItems.galleryId, input.galleryId),
          ),
        );
    }
    const changed = await tx
      .update(galleries)
      .set({ version: gallery.version + 1, updatedAt: now })
      .where(
        and(
          eq(galleries.id, gallery.id),
          eq(galleries.editionId, edition.id),
          eq(galleries.version, input.expectedGalleryVersion),
        ),
      )
      .returning({ id: galleries.id });
    if (changed.length !== 1) throw new Error(concurrentEditMessage);
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "gallery.items.reorder",
      resourceType: "gallery",
      resourceId: gallery.id,
      resourceLabel: gallery.title,
      after: { itemIds: input.itemIds },
      changedFields: ["items", "version"],
      source: "admin-galleries",
    });
  });

  revalidatePath(`/admin/content/galleries/${input.galleryId}`);
  return { success: true, version: input.expectedGalleryVersion + 1 };
}
