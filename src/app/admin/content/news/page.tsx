import { desc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";

import { AdminBadge, AdminLinkButton, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { mediaAssets, newsArticles } from "@/server/db/schema";
import { NewsListClient } from "./news-list-client";

export const metadata = { title: "Berita" };

export default async function NewsPage() {
  const actor = await requirePermission("content.view");
  const currentEdition = await getAdminEditionContext();

  const rows = await database
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      excerpt: newsArticles.excerpt,
      status: newsArticles.status,
      version: newsArticles.version,
      publishedAt: newsArticles.publishedAt,
      createdAt: newsArticles.createdAt,
      coverUrl: mediaAssets.url,
      coverAlt: mediaAssets.alt,
    })
    .from(newsArticles)
    .leftJoin(mediaAssets, eq(newsArticles.coverMediaId, mediaAssets.id))
    .where(currentEdition ? eq(newsArticles.editionId, currentEdition.id) : undefined)
    .orderBy(desc(newsArticles.createdAt));

  const articles = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    status: r.status,
    version: r.version,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    coverUrl: r.coverUrl,
    coverAlt: r.coverAlt,
  }));

  const canEdit = actor.effectivePermissions.has("content.edit");

  return (
    <AdminPage
      eyebrow="Konten"
      title="Berita"
      action={
        currentEdition ? (
          <div className="flex items-center gap-2">
            <AdminBadge value={currentEdition.lifecycle} />
            {canEdit && (
              <AdminLinkButton href="/admin/content/news/new" className="h-9 px-3 text-xs">
                <Plus size={14} /> Tulis berita
              </AdminLinkButton>
            )}
          </div>
        ) : null
      }
    >
      <NewsListClient
        initialArticles={articles}
        editionName={currentEdition?.name ?? "Edisi Aktif"}
        canEdit={canEdit}
      />
    </AdminPage>
  );
}
