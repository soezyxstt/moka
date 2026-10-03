import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminCard, AdminLinkButton, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { events, galleries, mediaAssets } from "@/server/db/schema";
import { EventForm, type EventFormValue } from "../event-form";

export const metadata = { title: "Detail Acara" };

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("content.view");
  const edition = await getAdminEditionContext();
  if (!edition) notFound();
  const { id } = await params;
  const [row] = await database.select({
    id: events.id, label: events.label, slug: events.slug, description: events.description, heroMediaId: events.heroMediaId,
    displayOrder: events.displayOrder, active: events.active, version: events.version,
    mediaId: mediaAssets.id, mediaUrl: mediaAssets.url, mediaFilename: mediaAssets.filename, mediaMimeType: mediaAssets.mimeType,
    mediaBytes: mediaAssets.bytes, mediaAlt: mediaAssets.alt, mediaDecorative: mediaAssets.decorative, mediaLifecycle: mediaAssets.lifecycle,
    mediaFolderId: mediaAssets.folderId,
  }).from(events).leftJoin(mediaAssets, eq(mediaAssets.id, events.heroMediaId)).where(and(eq(events.id, id), eq(events.editionId, edition.id))).limit(1);
  if (!row) notFound();
  const galleryRows = await database.select({ id: galleries.id, title: galleries.title, status: galleries.status }).from(galleries).where(and(eq(galleries.editionId, edition.id), eq(galleries.ownerType, "event"), eq(galleries.ownerId, id))).orderBy(asc(galleries.displayOrder));
  const value: EventFormValue = {
    id: row.id, label: row.label, slug: row.slug, description: row.description, heroMediaId: row.heroMediaId,
    heroMedia: row.mediaId ? { id: row.mediaId, url: row.mediaUrl!, filename: row.mediaFilename!, mimeType: row.mediaMimeType!, bytes: row.mediaBytes!, alt: row.mediaAlt, decorative: row.mediaDecorative ?? false, lifecycle: row.mediaLifecycle!, folderId: row.mediaFolderId } : null,
    displayOrder: row.displayOrder, active: row.active, version: row.version,
  };
  const canEdit = actor.effectivePermissions.has("events.manage");
  return <AdminPage eyebrow="Acara" title={row.label} action={<AdminLinkButton href="/admin/content/events" variant="secondary"><ArrowLeft className="size-4" />Kembali</AdminLinkButton>}><div className="space-y-5"><EventForm key={`${row.id}:${row.version}`} editionId={edition.id} initialValue={value} canEdit={canEdit} canManageMedia={actor.effectivePermissions.has("media.manage")} /><AdminCard><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-montserrat text-lg font-semibold text-dgb-900">Album terkait</h2>{canEdit ? <AdminLinkButton href={`/admin/content/galleries/new?eventId=${row.id}`}>Tambah album</AdminLinkButton> : null}</div><div className="mt-3 space-y-2">{galleryRows.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada album.</p> : galleryRows.map((gallery) => <div key={gallery.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3"><span className="text-sm font-medium">{gallery.title}</span><AdminLinkButton href={`/admin/content/galleries/${gallery.id}`} variant="secondary">Buka</AdminLinkButton></div>)}</div></AdminCard></div></AdminPage>;
}
