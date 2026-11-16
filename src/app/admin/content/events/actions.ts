"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "@/server/cms/public-cache";

import { appendAuditLog } from "@/server/auth/audit";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { events, galleries, mediaAssets } from "@/server/db/schema";

async function requireReadyHero(mediaId: string | null | undefined) {
  if (!mediaId) return;
  const [asset] = await database
    .select({ id: mediaAssets.id, mimeType: mediaAssets.mimeType })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.lifecycle, "ready")))
    .limit(1);
  if (!asset || !asset.mimeType.startsWith("image/")) {
    throw new Error("Foto hero harus berupa gambar ready dari pustaka media");
  }
}

export async function createEventAction(input: {
  label: string;
  slug: string;
  description?: string | null;
  heroMediaId?: string | null;
  displayOrder?: number;
  active?: boolean;
}) {
  const actor = await requirePermission("events.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const editionId = editionContext.id;
  const label = input.label.trim();
  const slug = input.slug.trim().toLowerCase();

  if (label.length < 2) {
    throw new Error("Nama acara minimal 2 karakter");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Format slug tidak valid");
  }

  const existingSlug = await database
    .select()
    .from(events)
    .where(and(eq(events.editionId, editionId), eq(events.slug, slug)));
  if (existingSlug.length > 0) {
    throw new Error("Slug acara sudah digunakan pada edisi ini");
  }
  await requireReadyHero(input.heroMediaId);

  const id = crypto.randomUUID();
  const now = new Date();

  await database.transaction(async (tx) => {
    await tx.insert(events).values({
      id,
      editionId,
      label,
      slug,
      description: input.description?.trim() || null,
      heroMediaId: input.heroMediaId || null,
      displayOrder: input.displayOrder ?? 0,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "event.create",
      resourceType: "event",
      resourceId: id,
      resourceLabel: label,
      after: { editionId, label, slug, heroMediaId: input.heroMediaId },
      changedFields: ["editionId", "label", "slug", "description", "heroMediaId"],
      source: "admin-events",
    });
  });

  revalidatePath("/admin/content/events");
  revalidatePath(`/admin/content/events/${id}`);
  return { success: true, eventId: id };
}

export async function updateEventAction(input: {
  id: string;
  label: string;
  slug: string;
  description?: string | null;
  heroMediaId?: string | null;
  displayOrder?: number;
  active?: boolean;
  expectedVersion: number;
}) {
  const actor = await requirePermission("events.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const [existing] = await database
    .select()
    .from(events)
    .where(and(eq(events.id, input.id), eq(events.editionId, editionContext.id)));
  if (!existing) {
    throw new Error("Acara tidak ditemukan");
  }
  if (!Number.isInteger(input.expectedVersion) || existing.version !== input.expectedVersion) {
    throw new Error("Acara telah diubah. Muat ulang halaman.");
  }

  const label = input.label.trim();
  const slug = input.slug.trim().toLowerCase();
  if (label.length < 2) {
    throw new Error("Nama acara minimal 2 karakter");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Format slug tidak valid");
  }

  const existingSlug = await database
    .select()
    .from(events)
    .where(and(eq(events.editionId, editionContext.id), eq(events.slug, slug)));
  if (existingSlug.length > 0 && existingSlug[0].id !== input.id) {
    throw new Error("Slug acara sudah digunakan oleh acara lain pada edisi ini");
  }
  await requireReadyHero(input.heroMediaId === undefined ? existing.heroMediaId : input.heroMediaId);

  const now = new Date();

  await database.transaction(async (tx) => {
    const updated = await tx
      .update(events)
      .set({
        label,
        slug,
        description: input.description !== undefined ? input.description?.trim() || null : existing.description,
        heroMediaId: input.heroMediaId !== undefined ? input.heroMediaId : existing.heroMediaId,
        displayOrder: input.displayOrder ?? existing.displayOrder,
        active: input.active ?? existing.active,
        version: existing.version + 1,
        updatedAt: now,
      })
      .where(and(eq(events.id, input.id), eq(events.editionId, editionContext.id), eq(events.version, input.expectedVersion)))
      .returning({ id: events.id });
    if (updated.length !== 1) throw new Error("Acara telah diubah. Muat ulang halaman.");

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "event.update",
      resourceType: "event",
      resourceId: input.id,
      resourceLabel: label,
      before: existing,
      after: {
        label,
        slug,
        description:
          input.description !== undefined ? input.description?.trim() || null : existing.description,
        heroMediaId:
          input.heroMediaId !== undefined ? input.heroMediaId : existing.heroMediaId,
        displayOrder: input.displayOrder ?? existing.displayOrder,
        active: input.active ?? existing.active,
        version: existing.version + 1,
      },
      changedFields: ["label", "slug", "description", "heroMediaId", "displayOrder", "active", "version"],
      source: "admin-events",
    });
  });

  revalidatePath("/admin/content/events");
  revalidatePath(`/admin/content/events/${input.id}`);
  return { success: true, version: existing.version + 1 };
}

export async function deleteEventAction(input: { id: string; expectedVersion: number }) {
  const actor = await requirePermission("events.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const [existing] = await database
    .select()
    .from(events)
    .where(and(eq(events.id, input.id), eq(events.editionId, editionContext.id)));
  if (!existing) {
    throw new Error("Acara tidak ditemukan");
  }
  if (!Number.isInteger(input.expectedVersion) || existing.version !== input.expectedVersion) {
    throw new Error("Acara telah diubah. Muat ulang halaman.");
  }
  await database.transaction(async (tx) => {
    const [linkedGallery] = await tx
      .select({ id: galleries.id })
      .from(galleries)
      .where(
        and(
          eq(galleries.editionId, editionContext.id),
          eq(galleries.ownerType, "event"),
          eq(galleries.ownerId, existing.id),
        ),
      )
      .limit(1);
    if (linkedGallery) {
      throw new Error("Acara yang memiliki album galeri tidak dapat dihapus");
    }
    const deleted = await tx
      .delete(events)
      .where(and(eq(events.id, input.id), eq(events.editionId, editionContext.id), eq(events.version, input.expectedVersion)))
      .returning({ id: events.id });
    if (deleted.length !== 1) throw new Error("Acara telah diubah. Muat ulang halaman.");
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "event.delete",
      resourceType: "event",
      resourceId: input.id,
      resourceLabel: existing.label,
      before: existing,
      changedFields: ["deleted"],
      source: "admin-events",
    });
  });

  revalidatePath("/admin/content/events");
  return { success: true };
}

export async function reorderEventsAction(input: { items: Array<{ id: string; expectedVersion: number }> }) {
  const actor = await requirePermission("events.manage");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const now = new Date();
  await database.transaction(async (tx) => {
    const current = await tx
      .select()
      .from(events)
      .where(eq(events.editionId, editionContext.id))
      .orderBy(asc(events.displayOrder), asc(events.id));
    if (current.length !== input.items.length || new Set(input.items.map((item) => item.id)).size !== input.items.length || current.some((event) => !input.items.some((item) => item.id === event.id))) {
      throw new Error("Daftar acara telah berubah. Muat ulang halaman.");
    }
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      const before = current.find((event) => event.id === item.id)!;
      if (before.version !== item.expectedVersion) throw new Error("Acara telah diubah. Muat ulang halaman.");
      const updated = await tx
        .update(events)
        .set({ displayOrder: i + 1, version: before.version + 1, updatedAt: now })
        .where(and(eq(events.id, item.id), eq(events.editionId, editionContext.id), eq(events.version, item.expectedVersion)))
        .returning({ id: events.id });
      if (updated.length !== 1) throw new Error("Acara telah diubah. Muat ulang halaman.");
    }
    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "event.reorder",
      resourceType: "event",
      resourceId: editionContext.id,
      resourceLabel: "Urutan acara",
      before: { order: current.map((event) => event.id) },
      after: { order: input.items.map((item) => item.id) },
      changedFields: ["displayOrder", "version"],
      source: "admin-events",
    });
  });

  revalidatePath("/admin/content/events");
  return { success: true };
}
