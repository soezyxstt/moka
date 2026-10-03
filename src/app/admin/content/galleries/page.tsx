import { asc, eq, inArray, sql } from "drizzle-orm";

import { AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { events, galleries, galleryItems, mediaAssets } from "@/server/db/schema";
import {
  GalleriesListClient,
  type GalleryListItem,
} from "./galleries-list-client";

export const metadata = { title: "Galeri & Album" };

export type GalleriesPageProps = {
  searchParams: Promise<{ eventId?: string }>;
};

export default async function GalleriesPage(props: GalleriesPageProps) {
  const actor = await requirePermission("content.view");
  const currentEdition = await getAdminEditionContext();
  const searchParams = await props.searchParams;
  const filterEventId = searchParams.eventId;

  if (!currentEdition) {
    return (
      <AdminPage
        eyebrow="Galeri"
        title="Galeri & Album Dokumentasi"
      >
        <div className="p-8 text-center text-muted-foreground text-sm">
          Tidak ada edisi yang aktif.
        </div>
      </AdminPage>
    );
  }

  // Fetch galleries for current edition with cover media and events
  const rawGalleries = await database
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
      coverUrl: mediaAssets.url,
      coverAlt: mediaAssets.alt,
    })
    .from(galleries)
    .leftJoin(mediaAssets, eq(galleries.coverMediaId, mediaAssets.id))
    .where(eq(galleries.editionId, currentEdition.id))
    .orderBy(asc(galleries.displayOrder));

  // Get item counts per gallery
  const galleryIds = rawGalleries.map((gallery) => gallery.id);
  const itemCounts =
    galleryIds.length === 0
      ? []
      : await database
          .select({
            galleryId: galleryItems.galleryId,
            totalCount: sql<number>`count(${galleryItems.id})`.mapWith(Number),
            photoCount:
              sql<number>`sum(case when ${galleryItems.mediaId} is not null then 1 else 0 end)`.mapWith(
                Number,
              ),
            videoCount:
              sql<number>`sum(case when ${galleryItems.youtubeId} is not null then 1 else 0 end)`.mapWith(
                Number,
              ),
          })
          .from(galleryItems)
          .where(inArray(galleryItems.galleryId, galleryIds))
          .groupBy(galleryItems.galleryId);

  const itemCountMap = new Map<string, { total: number; photo: number; video: number }>();
  for (const row of itemCounts) {
    itemCountMap.set(row.galleryId, {
      total: row.totalCount ?? 0,
      photo: row.photoCount ?? 0,
      video: row.videoCount ?? 0,
    });
  }

  // Fetch event labels for event-owned galleries
  const eventIds = rawGalleries
    .filter((g) => g.ownerType === "event")
    .map((g) => g.ownerId);

  const eventLabelMap = new Map<string, string>();
  if (eventIds.length > 0) {
    const eventRows = await database
      .select({ id: events.id, label: events.label })
      .from(events)
      .where(inArray(events.id, eventIds));
    for (const ev of eventRows) {
      eventLabelMap.set(ev.id, ev.label);
    }
  }

  const initialGalleries: GalleryListItem[] = rawGalleries.map((g) => {
    const counts = itemCountMap.get(g.id) ?? { total: 0, photo: 0, video: 0 };
    return {
      id: g.id,
      title: g.title,
      slug: g.slug,
      description: g.description,
      ownerType: g.ownerType as "standalone" | "event",
      ownerId: g.ownerId,
      ownerLabel: g.ownerType === "event" ? eventLabelMap.get(g.ownerId) ?? null : null,
      displayOrder: g.displayOrder,
      status: g.status,
      active: Boolean(g.active),
      version: g.version,
      coverUrl: g.coverUrl,
      coverAlt: g.coverAlt,
      itemCount: counts.total,
      photoCount: counts.photo,
      videoCount: counts.video,
    };
  });

  const canEdit = actor.effectivePermissions.has("gallery.manage");

  return (
    <AdminPage
      eyebrow="Galeri"
      title="Galeri & Album Dokumentasi"
    >
      <GalleriesListClient
        key={currentEdition.id}
        initialGalleries={initialGalleries}
        editionName={currentEdition.name}
        editionId={currentEdition.id}
        filterEventId={filterEventId}
        canEdit={canEdit}
      />
    </AdminPage>
  );
}
