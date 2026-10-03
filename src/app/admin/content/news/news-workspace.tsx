"use client";

import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  Globe,
  History,
  LayoutGrid,
  Loader2,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AdminMediaField,
  type MediaAssetSummary,
} from "@/components/admin/media-picker";
import { adminNativeScrollbarClassName } from "@/components/admin/admin-scroll-area";
import { AdminBadge } from "@/components/admin/primitives";
import { TipTapEditor } from "@/components/admin/tiptap-editor";
import { TipTapRenderer } from "@/components/admin/tiptap-renderer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  archiveNewsArticleAction,
  deleteNewsArticleAction,
  publishNewsArticleAction,
  saveNewsDraftAction,
  unpublishNewsArticleAction,
} from "./actions";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function legacyBodyToTipTapDocument(body: string | null | undefined): Record<string, unknown> | null {
  if (!body || body.trim().length === 0) return null;
  return {
    type: "doc",
    content: body.split(/\n{2,}/).map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph }],
    })),
  };
}

function newsStatusLabel(status: string): string {
  if (status === "published") return "Terbit";
  if (status === "archived") return "Arsip";
  return "Draf";
}

export type NewsRevisionItem = {
  id: string;
  version: number;
  reason: string | null;
  authorUserId: string | null;
  createdAt: string;
  snapshotJson: string;
};

export type NewsArticleData = {
  id: string;
  editionId: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  bodyJson: string | null;
  kind: string;
  sourceUrl: string | null;
  coverMediaId: string | null;
  publishedAt: string | null;
  status: string;
  version: number;
  coverAsset?: MediaAssetSummary | null;
};

export type NewsWorkspaceProps = {
  initialArticle?: NewsArticleData | null;
  initialRevisions?: NewsRevisionItem[];
  editionName: string;
  activeEditionId: string;
  canPublish: boolean;
  canManage: boolean;
  canEdit: boolean;
};

type AutosaveState = "saved" | "saving" | "unsaved" | "error";

export function NewsWorkspace({
  initialArticle,
  initialRevisions = [],
  editionName,
  activeEditionId,
  canPublish,
  canManage,
  canEdit,
}: NewsWorkspaceProps) {
  const router = useRouter();

  const [articleId, setArticleId] = useState<string | null>(initialArticle?.id ?? null);
  const [version, setVersion] = useState<number>(initialArticle?.version ?? 1);
  const [status, setStatus] = useState<string>(initialArticle?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(initialArticle?.publishedAt ?? null);

  const [title, setTitle] = useState<string>(initialArticle?.title ?? "");
  const [slug, setSlug] = useState<string>(initialArticle?.slug ?? "");
  const [isSlugCustomized, setIsSlugCustomized] = useState<boolean>(!!initialArticle?.slug);
  const [excerpt, setExcerpt] = useState<string>(initialArticle?.excerpt ?? "");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(initialArticle?.coverMediaId ?? null);
  const [coverAsset, setCoverAsset] = useState<MediaAssetSummary | null>(initialArticle?.coverAsset ?? null);
  const [bodyJson, setBodyJson] = useState<Record<string, unknown> | null>(
    initialArticle?.bodyJson
      ? (() => {
          try {
            return JSON.parse(initialArticle.bodyJson) as Record<string, unknown>;
          } catch {
            return legacyBodyToTipTapDocument(initialArticle?.body);
          }
        })()
      : legacyBodyToTipTapDocument(initialArticle?.body),
  );

  // View Layout Modes
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Autosave & Dirty State
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [revisions] = useState<NewsRevisionItem[]>(initialRevisions);
  const [selectedRevision, setSelectedRevision] = useState<NewsRevisionItem | null>(null);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

  // Leave Confirmation
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const articleIdRef = useRef(articleId);
  const versionRef = useRef(version);
  const dirtyRevisionRef = useRef(0);
  const isDirtyRef = useRef(isDirty);

  const markDirty = useCallback(() => {
    dirtyRevisionRef.current += 1;
    isDirtyRef.current = true;
    setIsDirty(true);
    setAutosaveState("unsaved");
  }, []);

  useEffect(() => {
    articleIdRef.current = articleId;
  }, [articleId]);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Track unsaved changes before leaving window
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Handle Title change -> auto-update slug if not manually customized
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    markDirty();
    if (!isSlugCustomized || slug.trim() === "") {
      setSlug(slugify(newTitle));
    }
  };

  const handleSlugChange = (newSlug: string) => {
    setIsSlugCustomized(true);
    setSlug(slugify(newSlug));
    markDirty();
  };

  // Save Draft logic
  const performSaveDraft = useCallback(
    async (isAutosave = false) => {
      if (!canEdit) return null;
      if (!title.trim() || title.trim().length < 3) {
        if (!isAutosave) {
          toast.error("Judul minimal 3 karakter untuk disimpan");
        }
        return null;
      }

      const activeSlug = slug.trim() || slugify(title);
      if (!/^[a-z0-9-]+$/.test(activeSlug)) {
        if (!isAutosave) {
          toast.error("Slug hanya boleh berisi huruf kecil, angka, dan minus (-)");
        }
        return null;
      }

      setAutosaveState("saving");
      const saveRevision = dirtyRevisionRef.current;
      const saveArticleId = articleIdRef.current;
      const saveVersion = versionRef.current;

      try {
        const bodyJsonString = bodyJson ? JSON.stringify(bodyJson) : null;
        const res = await saveNewsDraftAction({
          id: saveArticleId,
          title: title.trim(),
          slug: activeSlug,
          excerpt: excerpt.trim() || null,
          coverMediaId: coverMediaId || null,
          bodyJson: bodyJsonString,
          baseVersion: saveArticleId ? saveVersion : undefined,
        });

        if (res.success) {
          articleIdRef.current = res.articleId;
          versionRef.current = res.version;
          setArticleId(res.articleId);
          setVersion(res.version);
          if (dirtyRevisionRef.current === saveRevision) {
            isDirtyRef.current = false;
            setIsDirty(false);
            setAutosaveState("saved");
          } else {
            isDirtyRef.current = true;
            setIsDirty(true);
            setAutosaveState("unsaved");
          }
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
          setLastSavedTime(timeString);

          if (!isAutosave) {
            toast.success("Draft artikel berhasil disimpan");
          }

          if (res.isNew) {
            // Update URL without full refresh
            window.history.replaceState(null, "", `/admin/content/news/${res.articleId}`);
          }

          return res;
        }
      } catch (err: unknown) {
        if (dirtyRevisionRef.current === saveRevision) {
          setAutosaveState("error");
        } else {
          setAutosaveState("unsaved");
        }
        if (!isAutosave) {
          const msg = err instanceof Error ? err.message : "Gagal menyimpan draft berita";
          toast.error(msg);
        }
      }
      return null;
    },
    [bodyJson, canEdit, coverMediaId, excerpt, slug, title],
  );

  // Debounce autosave 1.5s on content changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isDirty) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (title.trim().length >= 3) {
        void performSaveDraft(true);
      }
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, slug, excerpt, coverMediaId, bodyJson, canEdit, isDirty, performSaveDraft]);

  // Publish Action
  const handlePublish = async () => {
    if (!canEdit || !canPublish) return;
    if (autosaveState === "saving") {
      toast.error("Tunggu hingga penyimpanan selesai sebelum menerbitkan");
      return;
    }

    const currentArticleId = articleIdRef.current;
    if (!currentArticleId) {
      toast.error("Simpan draft terlebih dahulu sebelum menerbitkan");
      return;
    }

    if (!title || title.trim().length < 3) {
      toast.error("Judul artikel minimal 3 karakter");
      return;
    }

    if (!excerpt || excerpt.trim().length < 10) {
      toast.error("Ringkasan artikel minimal 10 karakter untuk dipublikasikan");
      return;
    }

    if (!coverMediaId) {
      toast.error("Foto sampul berita wajib dipilih sebelum publikasi");
      return;
    }

    const bodyContent = Array.isArray(bodyJson?.content) ? bodyJson.content : [];
    if (!bodyJson || bodyContent.length === 0) {
      toast.error("Isi artikel berita tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure draft is saved first
      const saved = await performSaveDraft(true);
      if (!saved) return;

      const res = await publishNewsArticleAction({
        id: saved.articleId,
        version: saved.version,
      });

      if (res.success) {
        toast.success("Berita berhasil diterbitkan");
        setStatus("published");
        setPublishedAt(res.publishedAt);
        versionRef.current = res.version;
        setVersion(res.version);
        isDirtyRef.current = false;
        setIsDirty(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menerbitkan artikel";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unpublish Action
  const handleUnpublish = async () => {
    const currentArticleId = articleIdRef.current;
    if (!currentArticleId) return;
    setIsSubmitting(true);
    try {
      const res = await unpublishNewsArticleAction({
        id: currentArticleId,
        version: versionRef.current,
      });
      if (res.success) {
        toast.success("Artikel ditarik kembali menjadi draft");
        setStatus("draft");
        versionRef.current = res.version;
        setVersion(res.version);
        setUnpublishDialogOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menarik artikel";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Archive Action
  const handleArchive = async () => {
    const currentArticleId = articleIdRef.current;
    if (!currentArticleId) return;
    setIsSubmitting(true);
    try {
      const res = await archiveNewsArticleAction({
        id: currentArticleId,
        version: versionRef.current,
      });
      if (res.success) {
        toast.success("Artikel berhasil diarsipkan");
        setStatus("archived");
        versionRef.current = res.version;
        setVersion(res.version);
        setArchiveDialogOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengarsipkan artikel";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!articleId) return;
    setIsSubmitting(true);
    try {
      const res = await deleteNewsArticleAction({ id: articleId });
      if (res.success) {
        toast.success("Artikel berita berhasil dihapus");
        router.push("/admin/content/news");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus artikel";
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  // Restore revision
  const handleRestoreRevision = (rev: NewsRevisionItem) => {
    try {
      const snapshot = JSON.parse(rev.snapshotJson) as Record<string, unknown>;
      if (typeof snapshot.title === "string") setTitle(snapshot.title);
      if (typeof snapshot.slug === "string") setSlug(snapshot.slug);
      if ("excerpt" in snapshot) {
        setExcerpt(typeof snapshot.excerpt === "string" ? snapshot.excerpt : "");
      }
      if ("coverMediaId" in snapshot) {
        const restoredCoverId = typeof snapshot.coverMediaId === "string" ? snapshot.coverMediaId : null;
        setCoverMediaId(restoredCoverId);
        if (!restoredCoverId) setCoverAsset(null);
      }
      if (typeof snapshot.bodyJson === "string" && snapshot.bodyJson.trim()) {
        try {
          setBodyJson(JSON.parse(snapshot.bodyJson));
        } catch {
          setBodyJson(null);
        }
      } else if ("bodyJson" in snapshot) {
        setBodyJson(null);
      }
      markDirty();
      setConfirmRestoreOpen(false);
      setRevisionsOpen(false);
      toast.success(`Konten dari versi ${rev.version} berhasil dipulihkan ke editor`);
    } catch {
      toast.error("Gagal membaca data revisi");
    }
  };

  const handleBackClick = () => {
    if (isDirty) {
      setConfirmLeaveOpen(true);
    } else {
      router.push("/admin/content/news");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBackClick}
            className="h-8 gap-1.5 border-border text-xs"
          >
            <ArrowLeft size={14} /> Daftar berita
          </Button>

          <div className="hidden h-5 w-px bg-border sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-montserrat text-sm font-bold text-dgb-900">
              {articleId ? "Edit Berita" : "Tulis Berita Baru"}
            </span>
            <AdminBadge value={newsStatusLabel(status)} />
            <span className="hidden rounded bg-dgb-50 px-2 py-0.5 text-[11px] font-semibold text-dgb-800 md:inline-block">
              {editionName}
            </span>
          </div>
        </div>

        {/* Action Buttons & Autosave Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Autosave Indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {autosaveState === "saving" && (
              <span className="flex items-center gap-1 text-sky-600">
                <Loader2 size={13} className="animate-spin" /> Menyimpan...
              </span>
            )}
            {autosaveState === "saved" && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={13} />
                <span className="hidden sm:inline">Tersimpan</span>
                {lastSavedTime ? ` (${lastSavedTime})` : ""}
              </span>
            )}
            {autosaveState === "unsaved" && (
              <span className="flex items-center gap-1 text-amber-600">
                <Clock size={13} /> Belum disimpan
              </span>
            )}
            {autosaveState === "error" && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertCircle size={13} /> Gagal menyimpan
              </span>
            )}
          </div>

          {/* Revisions Button */}
          {articleId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevisionsOpen(true)}
              className="h-8 gap-1 border-border text-xs"
              title="Riwayat revisi"
            >
              <History size={13} />
              <span className="hidden md:inline">Revisi</span> ({revisions.length || 1})
            </Button>
          )}

          {/* Save Draft Button */}
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void performSaveDraft(false)}
              disabled={isSubmitting || autosaveState === "saving"}
              className="h-8 gap-1.5 border-dgb-200 bg-white text-xs font-semibold text-dgb hover:bg-dgb-50"
            >
              <Save size={13} /> Simpan draft
            </Button>
          )}

          {/* Publish / Unpublish Buttons */}
          {status === "published" ? (
            canPublish && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUnpublishDialogOpen(true)}
                disabled={isSubmitting || autosaveState === "saving"}
                className="h-8 gap-1.5 border-amber-200 text-xs font-semibold text-amber-800 hover:bg-amber-50"
              >
                <RotateCcw size={13} /> Tarik ke draft
              </Button>
            )
          ) : (
            canEdit && canPublish && (
              <Button
                type="button"
                size="sm"
                onClick={handlePublish}
                disabled={isSubmitting || autosaveState === "saving"}
                className="h-8 gap-1.5 bg-dgb text-xs font-semibold text-white hover:bg-dgb-600"
              >
                <Send size={13} /> Terbitkan
              </Button>
            )
          )}

          {/* Archive / Delete Options */}
          {articleId && canEdit && (
            <>
              {status !== "archived" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setArchiveDialogOpen(true)}
                  disabled={isSubmitting}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  title="Arsipkan berita"
                >
                  <Archive size={14} />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isSubmitting}
                className="h-8 px-2 text-xs text-destructive hover:bg-rose-50"
                title="Hapus berita"
              >
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metadata & Cover Panel */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Left: Title, Slug, Excerpt */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Judul berita <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={!canEdit}
                placeholder="Tulis judul berita yang menarik..."
                className="font-montserrat text-base font-semibold"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Alamat berita <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  /berita/{slug || "judul-berita"}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={!canEdit}
                  placeholder="slug-artikel-berita"
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSlug(slugify(title));
                    setIsSlugCustomized(false);
                    markDirty();
                  }}
                  disabled={!canEdit}
                  className="h-9 shrink-0 text-xs"
                  title="Sinkronkan kembali dari judul"
                >
                  Auto slug
                </Button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Ringkasan <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  markDirty();
                }}
                disabled={!canEdit}
                rows={3}
                placeholder="Tulis ringkasan singkat berita (1-2 kalimat) untuk kartu dan cuplikan media sosial..."
                className="text-xs leading-relaxed"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Minimal 10 karakter; tampil pada feed kartu berita dan meta deskripsi.
              </p>
            </div>
          </div>

          {/* Right: Cover Image Picker */}
          <div>
            <AdminMediaField
              name="coverMediaId"
              label="Foto sampul"
              hint="Gunakan gambar lanskap 16:9."
              aspectRatioHint="16:9"
              value={coverMediaId}
              initialAsset={coverAsset}
              acceptType="image"
              canManageMedia={canManage}
              activeEditionId={activeEditionId}
              required
              className={cn(!canEdit && "pointer-events-none opacity-80")}
              onChange={(asset) => {
                setCoverMediaId(asset?.id ?? null);
                setCoverAsset(asset);
                markDirty();
              }}
            />
          </div>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
        <div
          role="tablist"
          aria-label="Tampilan ruang kerja berita"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-1"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            role="tab"
            aria-selected={viewMode === "editor"}
            onClick={() => setViewMode("editor")}
            className={cn(
              "h-7 px-3 text-xs font-medium",
              viewMode === "editor" && "bg-white font-semibold text-dgb shadow-xs",
            )}
          >
            <FileEdit size={13} className="mr-1.5" /> Editor
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            role="tab"
            aria-selected={viewMode === "split"}
            onClick={() => setViewMode("split")}
            className={cn(
              "h-7 px-3 text-xs font-medium max-sm:hidden",
              viewMode === "split" && "bg-white font-semibold text-dgb shadow-xs",
            )}
          >
            <LayoutGrid size={13} className="mr-1.5" /> Keduanya
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            role="tab"
            aria-selected={viewMode === "preview"}
            onClick={() => setViewMode("preview")}
            className={cn(
              "h-7 px-3 text-xs font-medium",
              viewMode === "preview" && "bg-white font-semibold text-dgb shadow-xs",
            )}
          >
            <Eye size={13} className="mr-1.5" /> Pratinjau
          </Button>
        </div>

        {/* Device preview mode (active in split or preview mode) */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDevice("desktop")}
              className={cn(
                "h-7 px-2.5 text-xs font-medium",
                previewDevice === "desktop" && "bg-white font-semibold text-dgb shadow-xs",
              )}
            >
              <Globe size={13} className="mr-1" /> Desktop
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDevice("mobile")}
              className={cn(
                "h-7 px-2.5 text-xs font-medium",
                previewDevice === "mobile" && "bg-white font-semibold text-dgb shadow-xs",
              )}
            >
              <Smartphone size={13} className="mr-1" /> Mobile (380px)
            </Button>
          </div>
        )}
      </div>

      {/* Main Workspace Area: Editor & Live Preview */}
      <div
        className={cn(
          "grid gap-6",
          viewMode === "split" ? "lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        {/* Editor Area */}
        {(viewMode === "editor" || viewMode === "split") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-foreground">Isi berita</span>
              <span className="text-[11px] text-muted-foreground">Isi terstruktur</span>
            </div>
            <TipTapEditor
              content={bodyJson}
              editable={canEdit}
              onChange={(json) => {
                setBodyJson(json);
                markDirty();
              }}
              canManageMedia={canManage}
              activeEditionId={activeEditionId}
              placeholder="Tulis artikel berita secara terstruktur di sini..."
            />
          </div>
        )}

        {/* Live Preview Area */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={cn("space-y-2", viewMode === "split" && "max-sm:hidden")}>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-foreground">Pratinjau langsung</span>
              <span className="text-[11px] text-muted-foreground">
                {previewDevice === "mobile" ? "Layar 380 px" : "Desktop"}
              </span>
            </div>

            <div
              className={cn(
                "mx-auto overflow-hidden rounded-xl border border-border bg-white shadow-xs",
                previewDevice === "mobile"
                  ? "w-full max-w-[380px] p-4 ring-8 ring-dgb-50"
                  : "w-full p-6 md:p-8",
              )}
            >
              {/* Article Preview Header */}
              <article className="space-y-6">
                <header className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-fb">
                    <span>{editionName}</span>
                    <span>·</span>
                    <span className="text-muted-foreground">
                      {publishedAt
                        ? new Date(publishedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Draft Publikasi"}
                    </span>
                  </div>

                  <h1
                    className={cn(
                      "font-montserrat font-bold text-dgb-900",
                      previewDevice === "mobile" ? "text-xl leading-tight" : "text-2xl md:text-4xl",
                    )}
                  >
                    {title || "Judul Artikel Berita"}
                  </h1>

                  {excerpt ? (
                    <p className="font-inter text-sm italic leading-relaxed text-muted-foreground">
                      {excerpt}
                    </p>
                  ) : null}
                </header>

                {/* Cover Photo */}
                {coverAsset?.url ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={coverAsset.url}
                      alt={coverAsset.alt || title || "Foto sampul"}
                      fill
                      sizes="(max-width: 768px) 100vw, 800px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
                    Belum ada foto sampul berita
                  </div>
                )}

                {/* Article Body Content */}
                <div className="pt-2">
                  <TipTapRenderer content={bodyJson} fallbackText={initialArticle?.body} />
                </div>
              </article>
            </div>
          </div>
        )}
      </div>

      {/* Unsaved Changes Leave Dialog */}
      <AlertDialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-montserrat">
              Perubahan belum disimpan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Terdapat perubahan pada artikel berita yang belum tersimpan ke server. Yakin ingin keluar dari halaman ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tetap di sini</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDirty(false);
                router.push("/admin/content/news");
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Tinggalkan halaman
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-montserrat">Tarik Publikasi Artikel?</AlertDialogTitle>
            <AlertDialogDescription>
              Artikel akan dialihkan kembali menjadi draft dan tidak dapat diakses publik hingga diterbitkan ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Tarik ke draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-montserrat">Arsipkan Berita?</AlertDialogTitle>
            <AlertDialogDescription>
              Artikel akan disimpan sebagai arsip dan dapat diaktifkan kembali sewaktu-waktu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-slate-700 text-white hover:bg-slate-800"
            >
              Arsipkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-montserrat">Hapus Berita Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus artikel berita beserta draft dan riwayat revisinya. Tindakan tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Hapus berita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revisions Sheet / Dialog */}
      <Dialog open={revisionsOpen} onOpenChange={setRevisionsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-montserrat">Riwayat Revisi Artikel</DialogTitle>
            <DialogDescription>
              Daftar versi tersimpan untuk artikel ini. Anda dapat melihat snapshot atau memulihkannya ke editor.
            </DialogDescription>
          </DialogHeader>

          <div className={cn("max-h-[380px] space-y-2.5 overflow-y-auto pr-1", adminNativeScrollbarClassName)}>
            {revisions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Belum ada data revisi tambahan.
              </p>
            ) : (
              revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-dgb-50 px-2 py-0.5 font-mono text-xs font-bold text-dgb">
                        Versi {rev.version}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {rev.reason || "Revisi tersimpan"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(rev.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRevision(rev);
                      setConfirmRestoreOpen(true);
                    }}
                    className="h-7 text-xs"
                  >
                    Pulihkan
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Restore Dialog */}
      <AlertDialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-montserrat">
              Pulihkan Revisi Versi {selectedRevision?.version}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Konten di editor saat ini akan digantikan oleh snapshot dari versi {selectedRevision?.version}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRevision) {
                  handleRestoreRevision(selectedRevision);
                }
              }}
              className="bg-dgb text-white hover:bg-dgb-600"
            >
              Pulihkan ke editor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
