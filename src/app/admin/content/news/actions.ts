"use server";

import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "@/server/cms/public-cache";

import { appendAuditLog } from "@/server/auth/audit";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import {
  contentDrafts,
  contentRevisions,
  mediaAssets,
  newsArticles,
} from "@/server/db/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type TipTapMark = {
  type: "bold" | "italic" | "link";
  attrs?: { href: string };
};

type TipTapDocumentNode = {
  type: string;
  attrs?: Record<string, string | number>;
  content?: TipTapDocumentNode[];
  marks?: TipTapMark[];
  text?: string;
};

type NormalizedTipTapDocument = {
  document: TipTapDocumentNode;
  imageMediaIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTipTapDocument(bodyJson: string): NormalizedTipTapDocument {
  let raw: unknown;
  try {
    raw = JSON.parse(bodyJson);
  } catch {
    throw new Error("Format isi berita tidak valid");
  }

  if (!isRecord(raw) || raw.type !== "doc" || !Array.isArray(raw.content)) {
    throw new Error("Format isi berita tidak valid");
  }

  const imageMediaIds = new Set<string>();
  const allowedNodeTypes = new Set([
    "paragraph",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "blockquote",
    "image",
    "text",
    "hardBreak",
    "horizontalRule",
  ]);

  const normalizeMarks = (value: unknown): TipTapMark[] | undefined => {
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) throw new Error("Format pemformatan isi berita tidak valid");

    return value.map((mark) => {
      if (!isRecord(mark) || typeof mark.type !== "string") {
        throw new Error("Format pemformatan isi berita tidak valid");
      }

      if (mark.type === "bold" || mark.type === "italic") {
        return { type: mark.type };
      }

      if (mark.type === "link") {
        const attrs = isRecord(mark.attrs) ? mark.attrs : null;
        const href = typeof attrs?.href === "string" ? attrs.href.trim() : "";
        if (!href || (!href.startsWith("/") && !/^https:\/\//i.test(href))) {
          throw new Error("Tautan isi berita harus menggunakan URL https atau jalur internal");
        }
        return { type: "link", attrs: { href } };
      }

      throw new Error("Format pemformatan isi berita tidak didukung");
    });
  };

  const normalizeNode = (value: unknown): TipTapDocumentNode => {
    if (!isRecord(value) || typeof value.type !== "string" || !allowedNodeTypes.has(value.type)) {
      throw new Error("Format isi berita tidak didukung");
    }

    if (value.type === "text") {
      if (typeof value.text !== "string") throw new Error("Teks isi berita tidak valid");
      const marks = normalizeMarks(value.marks);
      return marks && marks.length > 0 ? { type: "text", text: value.text, marks } : { type: "text", text: value.text };
    }

    if (value.type === "image") {
      const attrs = isRecord(value.attrs) ? value.attrs : null;
      const mediaAssetId = typeof attrs?.mediaAssetId === "string" ? attrs.mediaAssetId.trim() : "";
      if (!mediaAssetId) {
        throw new Error("Setiap gambar isi berita harus berasal dari pustaka media");
      }
      imageMediaIds.add(mediaAssetId);
      const alt = typeof attrs?.alt === "string" ? attrs.alt : "";
      return {
        type: "image",
        attrs: { mediaAssetId, ...(alt ? { alt } : {}) },
      };
    }

    if (value.type === "heading") {
      const attrs = isRecord(value.attrs) ? value.attrs : null;
      const level = attrs?.level;
      if (level !== 2 && level !== 3) {
        throw new Error("Heading isi berita hanya boleh memakai tingkat 2 atau 3");
      }
      const content = Array.isArray(value.content) ? value.content.map(normalizeNode) : [];
      return { type: "heading", attrs: { level }, ...(content.length > 0 ? { content } : {}) };
    }

    if (value.type === "paragraph") {
      const content = Array.isArray(value.content) ? value.content.map(normalizeNode) : [];
      return { type: "paragraph", ...(content.length > 0 ? { content } : {}) };
    }

    if (value.type === "hardBreak" || value.type === "horizontalRule") {
      return { type: value.type };
    }

    if (!Array.isArray(value.content)) {
      throw new Error("Struktur isi berita tidak valid");
    }
    return { type: value.type, content: value.content.map(normalizeNode) };
  };

  return {
    document: { type: "doc", content: raw.content.map(normalizeNode) },
    imageMediaIds: [...imageMediaIds],
  };
}

function hasContentInTipTapDocument(document: TipTapDocumentNode): boolean {
  if (document.type === "text") return Boolean(document.text?.trim());
  if (document.type === "image") return true;
  return document.content?.some(hasContentInTipTapDocument) ?? false;
}

function replaceImageSources(
  node: TipTapDocumentNode,
  assetsById: Map<string, { url: string }>,
): TipTapDocumentNode {
  const mediaAssetId = node.attrs?.mediaAssetId;
  if (node.type === "image" && typeof mediaAssetId === "string" && mediaAssetId) {
    const asset = assetsById.get(mediaAssetId);
    if (!asset) throw new Error("Gambar isi berita tidak ditemukan di pustaka media");
    return { ...node, attrs: { ...node.attrs, src: asset.url } };
  }
  if (!node.content) return node;
  return { ...node, content: node.content.map((child) => replaceImageSources(child, assetsById)) };
}

export type SaveNewsDraftInput = {
  id?: string | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverMediaId?: string | null;
  bodyJson?: string | null;
  baseVersion?: number;
};

export async function saveNewsDraftAction(input: SaveNewsDraftInput) {
  const actor = await requirePermission("content.edit");
  if (!input || typeof input !== "object") {
    throw new Error("Data draft berita tidak valid");
  }
  if (typeof input.title !== "string" || typeof input.slug !== "string") {
    throw new Error("Judul dan slug berita wajib berupa teks");
  }
  if (input.id !== undefined && input.id !== null && typeof input.id !== "string") {
    throw new Error("ID artikel tidak valid");
  }
  if (input.excerpt !== undefined && input.excerpt !== null && typeof input.excerpt !== "string") {
    throw new Error("Ringkasan berita tidak valid");
  }
  if (input.coverMediaId !== undefined && input.coverMediaId !== null && typeof input.coverMediaId !== "string") {
    throw new Error("Sampul berita tidak valid");
  }
  if (input.bodyJson !== undefined && input.bodyJson !== null && typeof input.bodyJson !== "string") {
    throw new Error("Isi berita tidak valid");
  }
  if (input.baseVersion !== undefined && (typeof input.baseVersion !== "number" || !Number.isInteger(input.baseVersion))) {
    throw new Error("Versi data artikel tidak valid");
  }
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  const title = (input.title ?? "").trim();
  let slug = (input.slug ?? "").trim().toLowerCase();

  if (title.length < 3) {
    throw new Error("Judul artikel minimal 3 karakter");
  }

  if (!slug) {
    slug = slugify(title);
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("Slug hanya boleh berisi huruf kecil, angka, dan tanda minus (-)");
  }

  const excerpt = input.excerpt?.trim() || null;
  const coverMediaId = input.coverMediaId?.trim() || null;
  const bodyJson = input.bodyJson?.trim() || null;
  const normalizedBody = bodyJson ? normalizeTipTapDocument(bodyJson) : null;

  const result = await database.transaction(async (tx) => {
    // Check slug uniqueness
    if (input.id) {
      const [existingSlug] = await tx
        .select()
        .from(newsArticles)
        .where(and(eq(newsArticles.slug, slug), ne(newsArticles.id, input.id)))
        .limit(1);

      if (existingSlug) {
        throw new Error(`Slug '${slug}' sudah digunakan oleh artikel lain`);
      }
    } else {
      const [existingSlug] = await tx
        .select()
        .from(newsArticles)
        .where(eq(newsArticles.slug, slug))
        .limit(1);

      if (existingSlug) {
        throw new Error(`Slug '${slug}' sudah digunakan oleh artikel lain`);
      }
    }

    const mediaIds = [...new Set([...(normalizedBody?.imageMediaIds ?? []), ...(coverMediaId ? [coverMediaId] : [])])];
    const mediaRows = mediaIds.length > 0
      ? await tx.select().from(mediaAssets).where(inArray(mediaAssets.id, mediaIds))
      : [];
    const assetsById = new Map(mediaRows.map((asset) => [asset.id, asset]));

    for (const mediaId of normalizedBody?.imageMediaIds ?? []) {
      const asset = assetsById.get(mediaId);
      if (!asset || asset.lifecycle !== "ready" || !asset.mimeType.startsWith("image/")) {
        throw new Error("Gambar isi berita harus berupa aset gambar yang valid dan berstatus siap");
      }
    }
    if (coverMediaId) {
      const coverAsset = assetsById.get(coverMediaId);
      if (!coverAsset || coverAsset.lifecycle !== "ready" || !coverAsset.mimeType.startsWith("image/")) {
        throw new Error("Sampul harus berupa aset gambar yang valid dan berstatus siap");
      }
    }
    const normalizedBodyJson = normalizedBody
      ? JSON.stringify(replaceImageSources(normalizedBody.document, assetsById))
      : null;

    if (input.id) {
      const [current] = await tx
        .select()
        .from(newsArticles)
        .where(and(eq(newsArticles.id, input.id), eq(newsArticles.editionId, editionContext.id)))
        .limit(1);

      if (!current) {
        throw new Error("Artikel berita tidak ditemukan pada edisi ini");
      }

      if (input.baseVersion !== undefined) {
        if (!Number.isInteger(input.baseVersion) || input.baseVersion < 1) {
          throw new Error("Versi data artikel tidak valid");
        }
        if (current.version !== input.baseVersion) {
          throw new Error("Versi data artikel telah berubah. Silakan muat ulang halaman sebelum menyimpan.");
        }
      }

      const nextVersion = current.version + 1;
      const now = new Date();

      await tx
        .update(newsArticles)
        .set({
          title,
          slug,
          excerpt,
          coverMediaId,
          bodyJson: normalizedBodyJson,
          version: nextVersion,
          updatedAt: now,
        })
        .where(eq(newsArticles.id, input.id));

      const snapshot = {
        id: input.id,
        editionId: editionContext.id,
        title,
        slug,
        excerpt,
        coverMediaId,
        bodyJson: normalizedBodyJson,
        status: current.status,
        version: nextVersion,
      };

      // Upsert draft
      const [existingDraft] = await tx
        .select()
        .from(contentDrafts)
        .where(and(eq(contentDrafts.resourceType, "newsArticle"), eq(contentDrafts.resourceId, input.id)))
        .limit(1);

      if (existingDraft) {
        await tx
          .update(contentDrafts)
          .set({
            baseVersion: nextVersion,
            snapshotJson: JSON.stringify(snapshot),
            authorUserId: actor.session.user.id,
            updatedAt: now,
          })
          .where(eq(contentDrafts.id, existingDraft.id));
      } else {
        await tx.insert(contentDrafts).values({
          id: crypto.randomUUID(),
          resourceType: "newsArticle",
          resourceId: input.id,
          baseVersion: nextVersion,
          snapshotJson: JSON.stringify(snapshot),
          authorUserId: actor.session.user.id,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Record revision
      await tx.insert(contentRevisions).values({
        id: crypto.randomUUID(),
        resourceType: "newsArticle",
        resourceId: input.id,
        version: nextVersion,
        snapshotJson: JSON.stringify(snapshot),
        authorUserId: actor.session.user.id,
        reason: "Simpan draft",
        createdAt: now,
      });

      // Append audit log
      await appendAuditLog(tx, {
        actorUserId: actor.session.user.id,
        actorLabel: actor.session.user.email,
        action: "news.update",
        resourceType: "newsArticle",
        resourceId: input.id,
        resourceLabel: title,
        before: {
          title: current.title,
          slug: current.slug,
          excerpt: current.excerpt,
          coverMediaId: current.coverMediaId,
          bodyJson: current.bodyJson,
          version: current.version,
        },
        after: {
          title,
          slug,
          excerpt,
          coverMediaId,
          bodyJson: normalizedBodyJson,
          version: nextVersion,
        },
        changedFields: ["title", "slug", "excerpt", "coverMediaId", "bodyJson", "version"],
        source: "admin-news-editor",
      });

      return {
        articleId: input.id,
        version: nextVersion,
        isNew: false,
      };
    } else {
      // Create new article
      const newId = crypto.randomUUID();
      const now = new Date();

      await tx.insert(newsArticles).values({
        id: newId,
        editionId: editionContext.id,
        title,
        slug,
        excerpt,
        coverMediaId,
        bodyJson: normalizedBodyJson,
        status: "draft",
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      const snapshot = {
        id: newId,
        editionId: editionContext.id,
        title,
        slug,
        excerpt,
        coverMediaId,
        bodyJson: normalizedBodyJson,
        status: "draft",
        version: 1,
      };

      await tx.insert(contentDrafts).values({
        id: crypto.randomUUID(),
        resourceType: "newsArticle",
        resourceId: newId,
        baseVersion: 1,
        snapshotJson: JSON.stringify(snapshot),
        authorUserId: actor.session.user.id,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(contentRevisions).values({
        id: crypto.randomUUID(),
        resourceType: "newsArticle",
        resourceId: newId,
        version: 1,
        snapshotJson: JSON.stringify(snapshot),
        authorUserId: actor.session.user.id,
        reason: "Dibuat pertama kali",
        createdAt: now,
      });

      await appendAuditLog(tx, {
        actorUserId: actor.session.user.id,
        actorLabel: actor.session.user.email,
        action: "news.create",
        resourceType: "newsArticle",
        resourceId: newId,
        resourceLabel: title,
        after: {
          id: newId,
          editionId: editionContext.id,
          title,
          slug,
          excerpt,
          coverMediaId,
          bodyJson: normalizedBodyJson,
          status: "draft",
          version: 1,
        },
        changedFields: ["editionId", "title", "slug", "excerpt", "coverMediaId", "bodyJson", "status", "version"],
        source: "admin-news-editor",
      });

      return {
        articleId: newId,
        version: 1,
        isNew: true,
      };
    }
  });

  revalidatePath("/admin/content/news");
  revalidatePath(`/admin/content/news/${result.articleId}`);
  revalidatePath("/admin");
  return { success: true, ...result };
}

export async function publishNewsArticleAction(input: { id: string; version: number }) {
  const actor = await requirePermission("content.publish");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  if (!input || typeof input !== "object") {
    throw new Error("Data publikasi berita tidak valid");
  }
  const { id, version } = input;
  if (typeof id !== "string" || !id) {
    throw new Error("ID artikel wajib disertakan");
  }
  if (!Number.isInteger(version) || version < 1) {
    throw new Error("Versi data artikel tidak valid");
  }

  const result = await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(newsArticles)
      .where(and(eq(newsArticles.id, id), eq(newsArticles.editionId, editionContext.id)))
      .limit(1);

    if (!current) {
      throw new Error("Artikel berita tidak ditemukan pada edisi ini");
    }

    if (current.version !== version) {
      throw new Error("Versi data artikel telah berubah. Silakan muat ulang halaman sebelum menerbitkan.");
    }

    let publishBodyJson = current.bodyJson;
    let bodyHasContent = false;
    if (current.bodyJson?.trim()) {
      const normalizedBody = normalizeTipTapDocument(current.bodyJson.trim());
      const imageRows = normalizedBody.imageMediaIds.length > 0
        ? await tx.select().from(mediaAssets).where(inArray(mediaAssets.id, normalizedBody.imageMediaIds))
        : [];
      const imageAssetsById = new Map(imageRows.map((asset) => [asset.id, asset]));
      for (const mediaId of normalizedBody.imageMediaIds) {
        const asset = imageAssetsById.get(mediaId);
        if (!asset || asset.lifecycle !== "ready" || !asset.mimeType.startsWith("image/")) {
          throw new Error("Gambar isi berita harus berupa aset gambar yang valid dan berstatus siap");
        }
      }
      publishBodyJson = JSON.stringify(replaceImageSources(normalizedBody.document, imageAssetsById));
      bodyHasContent = hasContentInTipTapDocument(normalizedBody.document);
    } else {
      bodyHasContent = Boolean(current.body?.trim());
    }

    // Validate readiness for publishing
    if (!current.title || current.title.trim().length < 3) {
      throw new Error("Judul artikel minimal 3 karakter untuk diterbitkan");
    }

    if (!current.slug || !/^[a-z0-9-]+$/.test(current.slug)) {
      throw new Error("Slug artikel tidak valid");
    }

    if (!current.excerpt || current.excerpt.trim().length < 10) {
      throw new Error("Ringkasan artikel minimal 10 karakter untuk diterbitkan");
    }

    if (!current.coverMediaId) {
      throw new Error("Sampul berita wajib dipilih sebelum diterbitkan");
    }

    const [coverAsset] = await tx
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, current.coverMediaId))
      .limit(1);

    if (!coverAsset || coverAsset.lifecycle !== "ready" || !coverAsset.mimeType.startsWith("image/")) {
      throw new Error("Aset sampul tidak valid atau belum siap");
    }

    if (!bodyHasContent) {
      throw new Error("Isi artikel berita tidak boleh kosong");
    }

    const nextVersion = current.version + 1;
    const now = new Date();
    const publishedAt = current.publishedAt ?? now;

    await tx
      .update(newsArticles)
      .set({
        status: "published",
        bodyJson: publishBodyJson,
        publishedAt,
        version: nextVersion,
        updatedAt: now,
      })
      .where(eq(newsArticles.id, id));

    const snapshot = {
      ...current,
      bodyJson: publishBodyJson,
      status: "published",
      publishedAt,
      version: nextVersion,
    };

    await tx.insert(contentRevisions).values({
      id: crypto.randomUUID(),
      resourceType: "newsArticle",
      resourceId: id,
      version: nextVersion,
      snapshotJson: JSON.stringify(snapshot),
      authorUserId: actor.session.user.id,
      reason: "Publikasi artikel",
      createdAt: now,
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "news.publish",
      resourceType: "newsArticle",
      resourceId: id,
      resourceLabel: current.title,
      before: {
        status: current.status,
        publishedAt: current.publishedAt,
        version: current.version,
      },
      after: {
        status: "published",
        publishedAt,
        version: nextVersion,
      },
      changedFields: ["status", "publishedAt", "version"],
      source: "admin-news-editor",
    });

    return { version: nextVersion, publishedAt: publishedAt.toISOString() };
  });

  revalidatePath("/admin/content/news");
  revalidatePath(`/admin/content/news/${id}`);
  revalidatePath("/admin");
  return { success: true, ...result };
}

export async function unpublishNewsArticleAction(input: { id: string; version: number }) {
  const actor = await requirePermission("content.publish");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  if (!input || typeof input !== "object") {
    throw new Error("Data penarikan berita tidak valid");
  }
  const { id, version } = input;
  if (typeof id !== "string" || !id) {
    throw new Error("ID artikel wajib disertakan");
  }
  if (!Number.isInteger(version) || version < 1) {
    throw new Error("Versi data artikel tidak valid");
  }

  const result = await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(newsArticles)
      .where(and(eq(newsArticles.id, id), eq(newsArticles.editionId, editionContext.id)))
      .limit(1);

    if (!current) {
      throw new Error("Artikel berita tidak ditemukan pada edisi ini");
    }

    if (current.version !== version) {
      throw new Error("Versi data artikel telah berubah. Silakan muat ulang halaman.");
    }

    const nextVersion = current.version + 1;
    const now = new Date();

    await tx
      .update(newsArticles)
      .set({
        status: "draft",
        version: nextVersion,
        updatedAt: now,
      })
      .where(eq(newsArticles.id, id));

    const snapshot = {
      ...current,
      status: "draft",
      version: nextVersion,
    };

    await tx.insert(contentRevisions).values({
      id: crypto.randomUUID(),
      resourceType: "newsArticle",
      resourceId: id,
      version: nextVersion,
      snapshotJson: JSON.stringify(snapshot),
      authorUserId: actor.session.user.id,
      reason: "Tarik publikasi ke draft",
      createdAt: now,
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "news.unpublish",
      resourceType: "newsArticle",
      resourceId: id,
      resourceLabel: current.title,
      before: {
        status: current.status,
        version: current.version,
      },
      after: {
        status: "draft",
        version: nextVersion,
      },
      changedFields: ["status", "version"],
      source: "admin-news-editor",
    });

    return { version: nextVersion };
  });

  revalidatePath("/admin/content/news");
  revalidatePath(`/admin/content/news/${id}`);
  revalidatePath("/admin");
  return { success: true, ...result };
}

export async function archiveNewsArticleAction(input: { id: string; version: number }) {
  const actor = await requirePermission("content.edit");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  if (!input || typeof input !== "object") {
    throw new Error("Data arsip berita tidak valid");
  }
  const { id, version } = input;
  if (typeof id !== "string" || !id) {
    throw new Error("ID artikel wajib disertakan");
  }
  if (!Number.isInteger(version) || version < 1) {
    throw new Error("Versi data artikel tidak valid");
  }

  const result = await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(newsArticles)
      .where(and(eq(newsArticles.id, id), eq(newsArticles.editionId, editionContext.id)))
      .limit(1);

    if (!current) {
      throw new Error("Artikel berita tidak ditemukan pada edisi ini");
    }

    if (current.version !== version) {
      throw new Error("Versi data artikel telah berubah. Silakan muat ulang halaman.");
    }

    const nextVersion = current.version + 1;
    const now = new Date();

    await tx
      .update(newsArticles)
      .set({
        status: "archived",
        version: nextVersion,
        updatedAt: now,
      })
      .where(eq(newsArticles.id, id));

    const snapshot = {
      ...current,
      status: "archived",
      version: nextVersion,
    };

    await tx.insert(contentRevisions).values({
      id: crypto.randomUUID(),
      resourceType: "newsArticle",
      resourceId: id,
      version: nextVersion,
      snapshotJson: JSON.stringify(snapshot),
      authorUserId: actor.session.user.id,
      reason: "Arsipkan artikel",
      createdAt: now,
    });

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "news.archive",
      resourceType: "newsArticle",
      resourceId: id,
      resourceLabel: current.title,
      before: {
        status: current.status,
        version: current.version,
      },
      after: {
        status: "archived",
        version: nextVersion,
      },
      changedFields: ["status", "version"],
      source: "admin-news-editor",
    });

    return { version: nextVersion };
  });

  revalidatePath("/admin/content/news");
  revalidatePath(`/admin/content/news/${id}`);
  revalidatePath("/admin");
  return { success: true, ...result };
}

export async function deleteNewsArticleAction(input: { id: string }) {
  const actor = await requirePermission("content.edit");
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }

  if (!input || typeof input !== "object") {
    throw new Error("Data penghapusan berita tidak valid");
  }
  const { id } = input;
  if (typeof id !== "string" || !id) {
    throw new Error("ID artikel wajib disertakan");
  }

  await database.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(newsArticles)
      .where(and(eq(newsArticles.id, id), eq(newsArticles.editionId, editionContext.id)))
      .limit(1);

    if (!current) {
      throw new Error("Artikel berita tidak ditemukan pada edisi ini");
    }

    // Remove draft and revisions
    await tx
      .delete(contentDrafts)
      .where(and(eq(contentDrafts.resourceType, "newsArticle"), eq(contentDrafts.resourceId, id)));

    await tx
      .delete(contentRevisions)
      .where(and(eq(contentRevisions.resourceType, "newsArticle"), eq(contentRevisions.resourceId, id)));

    await tx.delete(newsArticles).where(eq(newsArticles.id, id));

    await appendAuditLog(tx, {
      actorUserId: actor.session.user.id,
      actorLabel: actor.session.user.email,
      action: "news.delete",
      resourceType: "newsArticle",
      resourceId: id,
      resourceLabel: current.title,
      before: current,
      changedFields: ["id"],
      source: "admin-news-editor",
    });
  });

  revalidatePath("/admin/content/news");
  revalidatePath("/admin");
  return { success: true };
}

export async function getNewsRevisionsAction(articleId: string) {
  await requirePermission("content.view");
  if (typeof articleId !== "string" || !articleId) {
    throw new Error("ID artikel tidak valid");
  }
  const editionContext = await getAdminEditionContext();
  if (!editionContext) {
    throw new Error("Konteks edisi aktif tidak ditemukan");
  }
  const [article] = await database
    .select({ id: newsArticles.id })
    .from(newsArticles)
    .where(and(eq(newsArticles.id, articleId), eq(newsArticles.editionId, editionContext.id)))
    .limit(1);
  if (!article) {
    throw new Error("Artikel berita tidak ditemukan pada edisi ini");
  }
  const rows = await database
    .select()
    .from(contentRevisions)
    .where(and(eq(contentRevisions.resourceType, "newsArticle"), eq(contentRevisions.resourceId, articleId)))
    .orderBy(desc(contentRevisions.version));

  return rows.map((r) => ({
    id: r.id,
    version: r.version,
    reason: r.reason,
    authorUserId: r.authorUserId,
    createdAt: r.createdAt.toISOString(),
    snapshotJson: r.snapshotJson,
  }));
}
