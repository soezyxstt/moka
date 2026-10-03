import { asc, eq } from "drizzle-orm";

import { AdminBadge, AdminCard, AdminEmptyState, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { mediaAssets, sponsors } from "@/server/db/schema";
import { SponsorsClient, type SponsorWithAsset } from "./sponsors-client";

export const metadata = { title: "Sponsor" };

export default async function SponsorsPage() {
  const { effectivePermissions } = await requirePermission("content.view");
  const canEdit = effectivePermissions.has("content.edit");
  const canPublish = effectivePermissions.has("content.publish");
  const canManageMedia = effectivePermissions.has("media.manage");

  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    return (
      <AdminPage
        eyebrow="Konten"
        title="Sponsor"
      >
        <AdminCard padding="none">
          <div className="p-8">
            <AdminEmptyState
              icon="handshake"
              title="Belum ada edisi dipilih"
              description="Pilih edisi pada selector di header untuk mulai."
            />
          </div>
        </AdminCard>
      </AdminPage>
    );
  }

  const rawRows = await database
    .select({
      id: sponsors.id,
      editionId: sponsors.editionId,
      name: sponsors.name,
      tier: sponsors.tier,
      website: sponsors.website,
      logoMediaId: sponsors.logoMediaId,
      displayOrder: sponsors.displayOrder,
      active: sponsors.active,
      version: sponsors.version,
      createdAt: sponsors.createdAt,
      updatedAt: sponsors.updatedAt,
      assetId: mediaAssets.id,
      assetUrl: mediaAssets.url,
      assetFilename: mediaAssets.filename,
      assetMimeType: mediaAssets.mimeType,
      assetBytes: mediaAssets.bytes,
      assetAlt: mediaAssets.alt,
      assetDecorative: mediaAssets.decorative,
      assetLifecycle: mediaAssets.lifecycle,
      assetFolderId: mediaAssets.folderId,
    })
    .from(sponsors)
    .leftJoin(mediaAssets, eq(sponsors.logoMediaId, mediaAssets.id))
    .where(eq(sponsors.editionId, currentEdition.id))
    .orderBy(asc(sponsors.displayOrder), asc(sponsors.createdAt));

  const initialSponsors: SponsorWithAsset[] = rawRows.map((row) => ({
    id: row.id,
    editionId: row.editionId,
    name: row.name,
    tier: row.tier,
    website: row.website,
    logoMediaId: row.logoMediaId,
    displayOrder: row.displayOrder,
    active: row.active,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    logoAsset: row.assetId
      ? {
          id: row.assetId,
          url: row.assetUrl!,
          filename: row.assetFilename!,
          mimeType: row.assetMimeType!,
          bytes: row.assetBytes!,
          alt: row.assetAlt,
          decorative: row.assetDecorative ?? false,
          lifecycle: row.assetLifecycle!,
          folderId: row.assetFolderId,
        }
      : null,
  }));

  return (
    <AdminPage
      eyebrow="Konten"
      title="Sponsor"
      action={<AdminBadge value={currentEdition.lifecycle} />}
    >
      <SponsorsClient
        edition={{
          id: currentEdition.id,
          year: currentEdition.year,
          name: currentEdition.name,
          lifecycle: currentEdition.lifecycle,
        }}
        initialSponsors={initialSponsors}
        canEdit={canEdit}
        canPublish={canPublish}
        canManageMedia={canManageMedia}
      />
    </AdminPage>
  );
}
