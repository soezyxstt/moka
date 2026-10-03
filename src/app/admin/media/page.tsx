import { desc } from "drizzle-orm";
import { AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { editions, mediaAssets, mediaFolders } from "@/server/db/schema";
import { getAdminEditionContext } from "@/server/cms/context";
import { Import2025MediaPanel } from "./import-2025-media";
import { MediaExplorer, type MediaAssetRecord, type MediaFolderRecord } from "./uploader";

export default async function MediaPage() {
  const { effectivePermissions } = await requirePermission("media.view");
  const canManage = effectivePermissions.has("media.manage");
  const canImport2025Media = canManage && process.env.NODE_ENV !== "production" && process.env.TURSO_DATABASE_URL === "file:local.db";
  const currentEdition = await getAdminEditionContext();

  const [assets, folders, editionRows] = await Promise.all([
    database.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(500),
    database.select().from(mediaFolders).orderBy(mediaFolders.name),
    database.select({ id: editions.id, year: editions.year, name: editions.name }).from(editions).orderBy(desc(editions.year)),
  ]);

  const serializedAssets: MediaAssetRecord[] = assets.map((asset) => ({ ...asset, createdAt: asset.createdAt.toISOString() }));
  const serializedFolders: MediaFolderRecord[] = folders.map((folder) => ({ ...folder, createdAt: folder.createdAt.toISOString() }));

  return (
    <AdminPage
      eyebrow="Pustaka"
      title="Pustaka media"
    >
      {canImport2025Media ? <Import2025MediaPanel /> : null}
      <MediaExplorer
        assets={serializedAssets}
        folders={serializedFolders}
        editions={editionRows}
        canManage={canManage}
        activeEditionId={currentEdition?.id ?? null}
      />
    </AdminPage>
  );
}
