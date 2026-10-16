"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  FileEdit,
  ImageIcon,
  LayoutGrid,
  Save,
  Trash2,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  AdminMediaField,
  AdminMediaPicker,
  type MediaAssetSummary,
} from "@/components/admin/media-picker";
import {
  AdminBadge,
  AdminCard,
  AdminCardHeader,
  AdminEmptyState,
  AdminSelect,
} from "@/components/admin/primitives";
import { adminNativeScrollbarClassName } from "@/components/admin/admin-scroll-area";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  addGalleryItemsAction,
  deleteGalleryItemAction,
  reorderGalleryItemsAction,
  updateGalleryAction,
  updateGalleryItemAction,
} from "../actions";

export type GalleryItemDetail = {
  id: string;
  galleryId: string;
  mediaId: string | null;
  youtubeId: string | null;
  caption: string | null;
  displayOrder: number;
  active: boolean;
  media: MediaAssetSummary | null;
};

export type GalleryDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  ownerType: "standalone" | "event";
  ownerId: string;
  displayOrder: number;
  status: string;
  active: boolean;
  version: number;
  coverMediaId: string | null;
  coverAsset: MediaAssetSummary | null;
};

export type SiblingGallery = {
  id: string;
  title: string;
  slug: string;
  displayOrder: number;
  itemCount: number;
};

export type GalleryWorkspaceProps = {
  gallery: GalleryDetail;
  initialItems: GalleryItemDetail[];
  siblingGalleries: SiblingGallery[];
  eventsList: { id: string; label: string }[];
  editionName: string;
  editionId: string;
  canEdit: boolean;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function GalleryWorkspace({
  gallery,
  initialItems,
  siblingGalleries,
  eventsList,
  editionName,
  editionId,
  canEdit,
}: GalleryWorkspaceProps) {
  // Metadata state
  const [title, setTitle] = useState(gallery.title);
  const [slug, setSlug] = useState(gallery.slug);
  const [description, setDescription] = useState(gallery.description ?? "");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(gallery.coverMediaId);
  const [coverAsset, setCoverAsset] = useState<MediaAssetSummary | null>(gallery.coverAsset);
  const [ownerType, setOwnerType] = useState<"standalone" | "event">(gallery.ownerType);
  const [ownerId, setOwnerId] = useState<string>(gallery.ownerId);
  const [status, setStatus] = useState<"draft" | "published">(gallery.status as "draft" | "published");
  const [version, setVersion] = useState(gallery.version);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const mutationPendingRef = useRef(false);
  const [isMutating, setIsMutating] = useState(false);

  // Items state
  const [items, setItems] = useState<GalleryItemDetail[]>(initialItems);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [youtubeInput, setYoutubeInput] = useState("");
  const [youtubeCaption, setYoutubeCaption] = useState("");
  const [deleteItemTarget, setDeleteItemTarget] = useState<GalleryItemDetail | null>(null);
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});

  // View state
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");

  const beginMutation = () => {
    if (mutationPendingRef.current) {
      toast.info("Tunggu perubahan sebelumnya selesai");
      return false;
    }
    mutationPendingRef.current = true;
    setIsMutating(true);
    return true;
  };

  const endMutation = () => {
    mutationPendingRef.current = false;
    setIsMutating(false);
  };

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 2) {
      toast.error("Judul album minimal 2 karakter");
      return;
    }
    const finalSlug = slug.trim() || slugify(title);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
      toast.error("Format slug tidak valid");
      return;
    }
    if (!beginMutation()) return;

    setIsSavingMeta(true);
    const toastId = toast.loading("Menyimpan detail album...");
    try {
      const result = await updateGalleryAction({
        id: gallery.id,
        title: title.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        coverMediaId,
        ownerType,
        ownerId: ownerType === "event" ? ownerId : editionId,
        status,
        version,
      });
      setVersion(result.version);
      toast.success("Detail album disimpan", { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan metadata";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSavingMeta(false);
      endMutation();
    }
  };

  const handleBatchSelectMedia = async (selectedAssets: MediaAssetSummary[]) => {
    if (!selectedAssets || selectedAssets.length === 0) return;
    const existingMediaIds = new Set(items.flatMap((item) => (item.mediaId ? [item.mediaId] : [])));
    const uniqueAssets = selectedAssets.filter(
      (asset, index, assets) =>
        !existingMediaIds.has(asset.id) && assets.findIndex((candidate) => candidate.id === asset.id) === index
    );
    if (uniqueAssets.length === 0) {
      toast.info("Semua media sudah ada di album");
      return;
    }
    const mediaIds = uniqueAssets.map((asset) => asset.id);
    if (!beginMutation()) return;
    const toastId = toast.loading("Menambahkan media ke album...");
    try {
      const result = await addGalleryItemsAction({
        galleryId: gallery.id,
        expectedGalleryVersion: version,
        mediaIds,
      });

      const assetMap = new Map(uniqueAssets.map((asset) => [asset.id, asset]));
      const newItems: GalleryItemDetail[] = result.items.map((item) => ({
        ...item,
        galleryId: gallery.id,
        active: true,
        media: item.mediaId ? assetMap.get(item.mediaId) ?? null : null,
      }));
      setItems((prev) => [...prev, ...newItems]);
      setVersion(result.version);
      toast.success(`${uniqueAssets.length} foto berhasil ditambahkan ke album`, { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan foto";
      toast.error(msg, { id: toastId });
    } finally {
      endMutation();
    }
  };

  const handleAddYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeInput.trim()) {
      toast.error("Masukkan ID atau tautan YouTube");
      return;
    }

    let ytId = youtubeInput.trim();
    // Parse YouTube URL if full URL is given
    const urlMatch = ytId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (urlMatch && urlMatch[1]) {
      ytId = urlMatch[1];
    }

    if (!/^[\w-]{11}$/.test(ytId)) {
      toast.error("Format ID YouTube tidak valid");
      return;
    }
    if (!beginMutation()) return;

    const toastId = toast.loading("Menambahkan video YouTube...");
    try {
      const result = await addGalleryItemsAction({
        galleryId: gallery.id,
        expectedGalleryVersion: version,
        youtubeId: ytId,
        caption: youtubeCaption.trim() || null,
      });

      const createdItem = result.items[0];
      if (!createdItem) throw new Error("Item video tidak berhasil dibuat");
      const newItem: GalleryItemDetail = {
        ...createdItem,
        galleryId: gallery.id,
        active: true,
        media: null,
      };
      setItems((prev) => [...prev, newItem]);
      setVersion(result.version);
      toast.success("Video YouTube berhasil ditambahkan", { id: toastId });
      setYoutubeDialogOpen(false);
      setYoutubeInput("");
      setYoutubeCaption("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan video YouTube";
      toast.error(msg, { id: toastId });
    } finally {
      endMutation();
    }
  };

  const handleMoveItem = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    // Reassign order
    const updated = newItems.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    if (!beginMutation()) return;
    const toastId = toast.loading("Memperbarui urutan item...");
    try {
      const result = await reorderGalleryItemsAction({
        galleryId: gallery.id,
        itemIds: updated.map((i) => i.id),
        expectedGalleryVersion: version,
      });
      setItems(updated);
      setVersion(result.version);
      toast.success("Urutan item berhasil disimpan", { id: toastId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan urutan item";
      toast.error(message, { id: toastId });
    } finally {
      endMutation();
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemTarget) return;
    if (!beginMutation()) return;
    const toastId = toast.loading("Menghapus item dari album...");
    try {
      const result = await deleteGalleryItemAction({
        itemId: deleteItemTarget.id,
        expectedGalleryVersion: version,
      });
      setItems((prev) => prev.filter((i) => i.id !== deleteItemTarget.id));
      setVersion(result.version);
      toast.success("Item berhasil dihapus dari album", { id: toastId });
      setDeleteItemTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus item";
      toast.error(msg, { id: toastId });
    } finally {
      endMutation();
    }
  };

  const handleUpdateItemCaption = async (item: GalleryItemDetail, newCaption: string) => {
    if (!beginMutation()) {
      setCaptionDrafts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      return;
    }
    const toastId = toast.loading("Menyimpan keterangan item...");
    try {
      const result = await updateGalleryItemAction({
        itemId: item.id,
        expectedGalleryVersion: version,
        caption: newCaption,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, caption: newCaption } : i)),
      );
      setCaptionDrafts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      setVersion(result.version);
      toast.success("Keterangan item disimpan", { id: toastId });
    } catch (err: unknown) {
      setCaptionDrafts((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      const message = err instanceof Error ? err.message : "Gagal menyimpan keterangan";
      toast.error(message, { id: toastId });
    } finally {
      endMutation();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs">
            <Link href="/admin/content/galleries">
              <ArrowLeft size={14} className="mr-1" /> Daftar album
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-manrope text-sm font-semibold text-foreground">
                {title || "Album galeri"}
              </h2>
              <AdminBadge value={status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {editionName} &bull; /{slug} &bull; {items.length} item tersimpan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 p-1" role="group" aria-label="Tampilan album">
          <Button
            size="sm"
            variant={viewMode === "editor" ? "default" : "ghost"}
            onClick={() => setViewMode("editor")}
            aria-pressed={viewMode === "editor"}
            className="h-7 text-xs px-2.5"
          >
            <FileEdit size={13} className="mr-1" /> Editor
          </Button>
          <Button
            size="sm"
            variant={viewMode === "split" ? "default" : "ghost"}
            onClick={() => setViewMode("split")}
            aria-pressed={viewMode === "split"}
            className="h-7 text-xs px-2.5 hidden lg:inline-flex"
          >
            <LayoutGrid size={13} className="mr-1" /> Keduanya
          </Button>
          <Button
            size="sm"
            variant={viewMode === "preview" ? "default" : "ghost"}
            onClick={() => setViewMode("preview")}
            aria-pressed={viewMode === "preview"}
            className="h-7 text-xs px-2.5"
          >
            <Eye size={13} className="mr-1" /> Pratinjau
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className={`grid grid-cols-1 gap-6 ${viewMode === "split" ? "lg:grid-cols-12" : ""}`}>
        {/* Editor Column */}
        {(viewMode === "editor" || viewMode === "split") && (
          <div className={`${viewMode === "split" ? "lg:col-span-7" : "max-w-4xl mx-auto w-full"} min-w-0 space-y-6`}>
            {/* Metadata Card */}
            <AdminCard className="space-y-4 p-5 sm:p-5">
              <AdminCardHeader
                title="Detail album"

              />

              <form onSubmit={handleSaveMeta} className="space-y-4">
              <fieldset disabled={!canEdit} className="min-w-0 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="album-title" className="text-xs font-medium">Judul album *</label>
                  <Input
                    id="album-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="album-slug" className="text-xs font-medium">Alamat album *</label>
                  <Input
                    id="album-slug"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="text-xs font-inter"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="album-description" className="text-xs font-medium">Deskripsi album</label>
                  <Textarea
                    id="album-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-xs min-h-[60px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="album-type" className="text-xs font-medium">Tipe album</label>
                    <AdminSelect
                      id="album-type"
                      aria-label="Tipe album"
                      value={ownerType}
                      onValueChange={(value) => setOwnerType(value as "standalone" | "event")}
                      className="h-9 w-full text-xs"
                      options={[
                        { value: "standalone", label: "Umum" },
                        { value: "event", label: "Terkait acara" },
                      ]}
                    />
                  </div>

                  {ownerType === "event" ? (
                    <div className="space-y-1.5">
                      <label htmlFor="album-event" className="text-xs font-medium">Acara *</label>
                      <AdminSelect
                        id="album-event"
                        aria-label="Pilih acara"
                        value={ownerId}
                        onValueChange={setOwnerId}
                        required
                        className="h-9 w-full text-xs"
                        options={eventsList.map((ev) => ({ value: ev.id, label: ev.label }))}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label htmlFor="album-status" className="text-xs font-medium">Status publikasi</label>
                      <AdminSelect
                        id="album-status"
                        aria-label="Status publikasi album"
                        value={status}
                        onValueChange={(value) => setStatus(value as "published" | "draft")}
                        className="h-9 w-full text-xs"
                        options={[
                          { value: "published", label: "Terbit" },
                          { value: "draft", label: "Draf" },
                        ]}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2">
                  <AdminMediaField
                    name="coverMediaId"
                    label="Foto sampul"
                    value={coverMediaId}
                    initialAsset={coverAsset}
                    onChange={(asset) => {
                      setCoverMediaId(asset?.id ?? null);
                      setCoverAsset(asset);
                    }}
                    activeEditionId={editionId}
                    canManageMedia={canEdit}
                  />
                </div>

                <div className="flex justify-end border-t border-border pt-3">
                  <Button
                    type="submit"
                    disabled={isSavingMeta || isMutating}
                    className="bg-brand hover:bg-brand/90 text-canvas text-xs h-8"
                  >
                    <Save size={13} className="mr-1.5" />
                    {isSavingMeta ? "Menyimpan..." : "Simpan detail"}
                  </Button>
                </div>
                </fieldset>
              </form>
            </AdminCard>

            {/* Items Management Card */}
            <AdminCard className="space-y-4 p-5 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="font-manrope text-sm font-semibold text-foreground">
                    Foto dan video ({items.length})
                  </h3>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={isMutating}
                      onClick={() => setBatchPickerOpen(true)}
                      className="bg-brand hover:bg-brand/90 text-canvas text-xs h-8"
                    >
                      <ImageIcon size={13} className="mr-1.5" /> Pilih foto
                    </Button>
                    <Button
                      disabled={isMutating}
                      onClick={() => setYoutubeDialogOpen(true)}
                      variant="outline"
                      className="text-xs h-8"
                    >
                      <Video size={13} className="mr-1.5" /> Tambah YouTube
                    </Button>
                  </div>
                )}
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <AdminEmptyState
                  icon="gallery"
                  title="Album masih kosong"
                />
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-2xs hover:border-highlight/40 transition-colors"
                    >
                      {/* Left: Preview & Type */}
                      <div className="flex items-center gap-3 min-w-[200px] flex-1">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                          {item.media ? (
                            <Image
                              src={item.media.url}
                              alt={item.media.alt || `Item ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : item.youtubeId ? (
                            <div className="relative h-full w-full bg-ink/80 flex items-center justify-center">
                              <Image
                                src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
                                alt="Pratinjau YouTube"
                                fill
                                className="object-cover opacity-80"
                                sizes="80px"
                              />
                              <Video size={18} className="absolute text-canvas drop-shadow-md" />
                            </div>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-inter text-xs font-bold text-muted-foreground">
                              #{idx + 1}
                            </span>
                            {item.youtubeId ? (
                              <span className="inline-flex items-center gap-1 rounded bg-danger-600/10 px-1.5 py-0.5 text-xs font-semibold text-danger-600">
                                <Video size={10} /> YouTube: {item.youtubeId}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-success-600/10 px-1.5 py-0.5 text-xs font-semibold text-success-600">
                                <ImageIcon size={10} /> Foto
                              </span>
                            )}
                          </div>
                          <Input
                            disabled={!canEdit || isMutating}
                            value={captionDrafts[item.id] ?? item.caption ?? ""}
                            onChange={(event) =>
                              setCaptionDrafts((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                            onBlur={(e) => {
                              if (e.target.value !== (item.caption ?? "")) {
                                handleUpdateItemCaption(item, e.target.value);
                              }
                            }}
                            placeholder="Tambah caption item..."
                            className="h-7 text-xs max-w-sm"
                          />
                        </div>
                      </div>

                      {/* Right: Reorder & Delete */}
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isMutating || idx === 0}
                              onClick={() => handleMoveItem(idx, "up")}
                              className="h-7 w-7 p-0"
                              title="Pindahkan ke atas"
                            >
                              <ArrowUp size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isMutating || idx === items.length - 1}
                              onClick={() => handleMoveItem(idx, "down")}
                              className="h-7 w-7 p-0"
                              title="Pindahkan ke bawah"
                            >
                              <ArrowDown size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteItemTarget(item)}
                              disabled={isMutating}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Hapus item"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>
        )}

        {/* Live Split Preview Column */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={`${viewMode === "split" ? "lg:col-span-5" : "max-w-4xl mx-auto w-full"} space-y-4`}>
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs sticky top-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-manrope text-xs font-semibold text-foreground">
                  Pratinjau publik
                </span>
                <span className="text-xs text-muted-foreground font-inter">
                  {editionName}
                </span>
              </div>

              {/* Simulated Public Layout with Album Index & Content */}
              <div className="grid grid-cols-12 gap-3 min-h-[420px] rounded-lg border border-border/60 bg-background p-3">
                {/* Left Mini Sidebar Index */}
                <div className="col-span-4 border-r border-border/60 pr-2 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Daftar album
                  </p>
                  <div className="space-y-1">
                    {siblingGalleries.map((sib) => {
                      const isCurrent = sib.id === gallery.id;
                      return (
                        <div
                          key={sib.id}
                          className={`rounded-md p-1.5 text-xs transition-colors ${
                            isCurrent
                              ? "bg-highlight/10 font-semibold text-highlight-700 border-l-2 border-highlight"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="line-clamp-1">{sib.title}</span>
                            <span className="text-xs opacity-70">
                              {isCurrent ? items.length : sib.itemCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Album Gallery Grid Section */}
                <div className={cn("col-span-8 pl-1 space-y-3 overflow-y-auto max-h-[500px]", adminNativeScrollbarClassName)}>
                  <div>
                    <h4 className="font-manrope text-sm font-bold text-foreground">
                      {title || "Judul Album"}
                    </h4>
                    {description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {description}
                      </p>
                    )}
                  </div>

                  {/* Grid of items */}
                  {items.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground/60 italic">
                      Album belum memiliki foto atau video.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((item, i) => (
                        <div
                          key={item.id}
                          className="group relative aspect-square overflow-hidden rounded-md border border-border/80 bg-muted"
                        >
                          {item.media ? (
                            <Image
                              src={item.media.url}
                              alt={item.caption || item.media.alt || `Item ${i + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="160px"
                            />
                          ) : item.youtubeId ? (
                            <div className="relative h-full w-full bg-ink flex items-center justify-center">
                              <Image
                                src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
                                alt="Pratinjau YouTube"
                                fill
                                className="object-cover opacity-80"
                                sizes="160px"
                              />
                              <Video size={20} className="absolute text-canvas drop-shadow-md" />
                            </div>
                          ) : null}

                          {item.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/80 to-transparent p-1.5 pt-4">
                              <p className="text-xs text-canvas line-clamp-1 font-inter">
                                {item.caption}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Batch Media Picker Dialog */}
      <AdminMediaPicker
        open={batchPickerOpen}
        onOpenChange={setBatchPickerOpen}
        multiple
        onSelectMany={(assets) => void handleBatchSelectMedia(assets)}
        canManageMedia={canEdit}
        activeEditionId={editionId}
      />

      {/* Add YouTube Video Dialog */}
      <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-manrope text-base">
              Tambah Video YouTube
            </DialogTitle>
            <DialogDescription className="font-inter text-xs">
              Masukkan ID video atau URL lengkap YouTube.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddYoutube} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="youtube-url" className="text-xs font-medium">URL atau ID YouTube *</label>
              <Input
                id="youtube-url"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ atau dQw4w9WgXcQ"
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="youtube-caption" className="text-xs font-medium">Keterangan video (opsional)</label>
              <Input
                id="youtube-caption"
                value={youtubeCaption}
                onChange={(e) => setYoutubeCaption(e.target.value)}
                placeholder="Malam penobatan grand final"
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setYoutubeDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" className="bg-brand hover:bg-brand/90 text-canvas text-xs">
                Tambahkan ke Album
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog open={!!deleteItemTarget} onOpenChange={(open) => !open && setDeleteItemTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-manrope">Hapus Item Galeri</AlertDialogTitle>
            <AlertDialogDescription className="font-inter text-xs">
              Apakah Anda yakin ingin menghapus item ini dari album? Tindakan ini tidak menghapus file media asli di perpustakaan media.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              Hapus Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
