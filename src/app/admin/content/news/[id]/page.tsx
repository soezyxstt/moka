import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import {
  contentRevisions,
  mediaAssets,
  newsArticles,
} from "@/server/db/schema";
import { NewsWorkspace, type NewsArticleData, type NewsRevisionItem } from "../news-workspace";

export const metadata = { title: "Edit Berita" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditNewsPage({ params }: PageProps) {
  const { id } = await params;
  const actor = await requirePermission("content.view");
  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    notFound();
  }

  const [article] = await database
    .select()
    .from(newsArticles)
    .where(and(eq(newsArticles.id, id), eq(newsArticles.editionId, currentEdition.id)))
    .limit(1);

  if (!article) {
    notFound();
  }

  // Fetch cover asset if present
  let coverAsset = null;
  if (article.coverMediaId) {
    const [asset] = await database
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, article.coverMediaId))
      .limit(1);

    if (asset) {
      coverAsset = {
        id: asset.id,
        url: asset.url,
        filename: asset.filename,
        mimeType: asset.mimeType,
        bytes: asset.bytes,
        alt: asset.alt,
        decorative: asset.decorative,
        lifecycle: asset.lifecycle,
        folderId: asset.folderId,
      };
    }
  }

  // Fetch revisions
  const revisionRows = await database
    .select()
    .from(contentRevisions)
    .where(and(eq(contentRevisions.resourceType, "newsArticle"), eq(contentRevisions.resourceId, id)))
    .orderBy(desc(contentRevisions.version));

  const initialRevisions: NewsRevisionItem[] = revisionRows.map((r) => ({
    id: r.id,
    version: r.version,
    reason: r.reason,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
    snapshotJson: r.snapshotJson,
  }));

  const articleData: NewsArticleData = {
    id: article.id,
    editionId: article.editionId,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    body: article.body,
    bodyJson: article.bodyJson,
    kind: article.kind,
    sourceUrl: article.sourceUrl,
    coverMediaId: article.coverMediaId,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    status: article.status,
    version: article.version,
    coverAsset,
  };

  const canPublish = actor.effectivePermissions.has("content.publish");
  const canEdit = actor.effectivePermissions.has("content.edit");
  const canManage = actor.effectivePermissions.has("media.manage");

  return (
    <AdminPage
      eyebrow="Konten"
      title={article.title}
    >
      <NewsWorkspace
        initialArticle={articleData}
        initialRevisions={initialRevisions}
        editionName={currentEdition.name}
        activeEditionId={currentEdition.id}
        canPublish={canPublish}
        canManage={canManage}
        canEdit={canEdit}
      />
    </AdminPage>
  );
}
