import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { events, galleries, galleryItems, mediaAssets } from "@/server/db/schema";
import {
  GalleryWorkspace,
  type GalleryDetail,
  type GalleryItemDetail,
  type SiblingGallery,
} from "./gallery-workspace";

export const metadata = { title: "Kelola Album Galeri" };

export type GalleryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GalleryDetailPage(props: GalleryDetailPageProps) {
  const actor = await requirePermission("content.view");
  const currentEdition = await getAdminEditionContext();
  const { id } = await props.params;

  if (!currentEdition) {
    redirect("/admin/content/galleries");
  }

  // Fetch gallery details
  const [galleryRow] = await database
    .select({
      id: galleries.id,
      title: galleries.title,
      slug: galleries.slug,
      description: galleries.description,
      ownerType: galleries.ownerType,
      ownerId: galleries.ownerId,
      displayOrder: galleries.displayOrder,
      status: galleries.status,
      active: galleries.active,
      version: galleries.version,
      coverMediaId: galleries.coverMediaId,
      coverAsset: {
        id: mediaAssets.id,
        url: mediaAssets.url,
        filename: mediaAssets.filename,
        alt: mediaAssets.alt,
        mimeType: mediaAssets.mimeType,
        bytes: mediaAssets.bytes,
        decorative: mediaAssets.decorative,
        lifecycle: mediaAssets.lifecycle,
        folderId: mediaAssets.folderId,
      },
    })
    .from(galleries)
    .leftJoin(mediaAssets, eq(galleries.coverMediaId, mediaAssets.id))
    .where(and(eq(galleries.id, id), eq(galleries.editionId, currentEdition.id)));

  if (!galleryRow) {
    notFound();
  }

  // Fetch items of this gallery
  const rawItems = await database
    .select({
      id: galleryItems.id,
      galleryId: galleryItems.galleryId,
      mediaId: galleryItems.mediaId,
      youtubeId: galleryItems.youtubeId,
      caption: galleryItems.caption,
      displayOrder: galleryItems.displayOrder,
      active: galleryItems.active,
      media: {
        id: mediaAssets.id,
        url: mediaAssets.url,
        filename: mediaAssets.filename,
        alt: mediaAssets.alt,
        mimeType: mediaAssets.mimeType,
        bytes: mediaAssets.bytes,
        decorative: mediaAssets.decorative,
        lifecycle: mediaAssets.lifecycle,
        folderId: mediaAssets.folderId,
      },
    })
    .from(galleryItems)
    .leftJoin(mediaAssets, eq(galleryItems.mediaId, mediaAssets.id))
    .where(eq(galleryItems.galleryId, id))
    .orderBy(asc(galleryItems.displayOrder));

  // Fetch sibling galleries for preview index
  const siblingRows = await database
    .select({
      id: galleries.id,
      title: galleries.title,
      slug: galleries.slug,
      displayOrder: galleries.displayOrder,
    })
    .from(galleries)
    .where(eq(galleries.editionId, currentEdition.id))
    .orderBy(asc(galleries.displayOrder));

  // Get item counts per sibling gallery
  const siblingIds = siblingRows.map((gallery) => gallery.id);
  const siblingItemCounts =
    siblingIds.length === 0
      ? []
      : await database
          .select({
            galleryId: galleryItems.galleryId,
            count: sql<number>`count(${galleryItems.id})`.mapWith(Number),
          })
          .from(galleryItems)
          .where(inArray(galleryItems.galleryId, siblingIds))
          .groupBy(galleryItems.galleryId);

  const siblingCountMap = new Map<string, number>();
  for (const row of siblingItemCounts) {
    siblingCountMap.set(row.galleryId, row.count);
  }

  const siblingGalleries: SiblingGallery[] = siblingRows.map((sib) => ({
    id: sib.id,
    title: sib.title,
    slug: sib.slug,
    displayOrder: sib.displayOrder,
    itemCount: siblingCountMap.get(sib.id) ?? 0,
  }));

  // Fetch events list for event selection
  const eventsList = await database
    .select({ id: events.id, label: events.label })
    .from(events)
    .where(eq(events.editionId, currentEdition.id))
    .orderBy(asc(events.displayOrder));

  const galleryDetail: GalleryDetail = {
    id: galleryRow.id,
    title: galleryRow.title,
    slug: galleryRow.slug,
    description: galleryRow.description,
    ownerType: galleryRow.ownerType as "standalone" | "event",
    ownerId: galleryRow.ownerId,
    displayOrder: galleryRow.displayOrder,
    status: galleryRow.status,
    active: Boolean(galleryRow.active),
    version: galleryRow.version,
    coverMediaId: galleryRow.coverMediaId,
    coverAsset: galleryRow.coverAsset?.id ? galleryRow.coverAsset : null,
  };

  const initialItems: GalleryItemDetail[] = rawItems.map((item) => ({
    id: item.id,
    galleryId: item.galleryId,
    mediaId: item.mediaId,
    youtubeId: item.youtubeId,
    caption: item.caption,
    displayOrder: item.displayOrder,
    active: Boolean(item.active),
    media: item.media?.id ? item.media : null,
  }));

  const canEdit = actor.effectivePermissions.has("gallery.manage");

  return (
    <AdminPage
      eyebrow="Galeri"
      title="Studio Album Galeri"
    >
      <GalleryWorkspace
        key={`${currentEdition.id}:${galleryDetail.id}:${galleryDetail.version}`}
        gallery={galleryDetail}
        initialItems={initialItems}
        siblingGalleries={siblingGalleries}
        eventsList={eventsList}
        editionName={currentEdition.name}
        editionId={currentEdition.id}
        canEdit={canEdit}
      />
    </AdminPage>
  );
}
