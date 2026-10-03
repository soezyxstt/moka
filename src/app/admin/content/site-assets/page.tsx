import { eq, inArray } from "drizzle-orm";

import { AdminCard, AdminEmptyState, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { SITE_ASSET_SLOTS } from "@/server/cms/site-asset-manifest";
import { database } from "@/server/db/client";
import { mediaAssets, siteAssetBindings } from "@/server/db/schema";
import { SiteAssetsClient, type SiteAssetSlotWithData } from "./site-assets-client";

export const metadata = { title: "Aset situs" };

export default async function SiteAssetsPage() {
  const { effectivePermissions } = await requirePermission("content.view");
  const canManageContent = effectivePermissions.has("content.edit");
  const editionContext = await getAdminEditionContext();

  if (!editionContext) {
    return (
      <AdminPage
        eyebrow="Konten"
        title="Aset situs"
      >
        <AdminCard>
          <AdminEmptyState
            icon="images"
            title="Belum ada edisi dipilih"
            description="Pilih edisi pada selector di header untuk mulai."
          />
        </AdminCard>
      </AdminPage>
    );
  }

  const bindings = await database
    .select()
    .from(siteAssetBindings)
    .where(eq(siteAssetBindings.editionId, editionContext.id));

  const bindingMap = new Map(bindings.map((b) => [b.slotKey, b]));

  const mediaIds = bindings
    .map((b) => b.mediaId)
    .filter((id): id is string => Boolean(id));

  let assetsMap = new Map<string, typeof mediaAssets.$inferSelect>();
  if (mediaIds.length > 0) {
    const assets = await database
      .select()
      .from(mediaAssets)
      .where(inArray(mediaAssets.id, mediaIds));

    assetsMap = new Map(assets.map((a) => [a.id, a]));
  }

  const slotsData: SiteAssetSlotWithData[] = SITE_ASSET_SLOTS.map((definition) => {
    const binding = bindingMap.get(definition.slotKey) ?? null;
    const mediaRow = binding?.mediaId ? assetsMap.get(binding.mediaId) ?? null : null;

    return {
      definition,
      binding,
      mediaAsset: mediaRow
        ? {
            id: mediaRow.id,
            url: mediaRow.url,
            filename: mediaRow.filename,
            mimeType: mediaRow.mimeType,
            bytes: mediaRow.bytes,
            alt: mediaRow.alt,
            decorative: mediaRow.decorative,
            lifecycle: mediaRow.lifecycle,
            folderId: mediaRow.folderId,
          }
        : null,
    };
  });

  return (
    <AdminPage
      eyebrow="Konten"
      title="Aset situs"
    >
      <SiteAssetsClient
        key={editionContext.id}
        edition={editionContext}
        slotsData={slotsData}
        canManageContent={canManageContent}
      />
    </AdminPage>
  );
}
