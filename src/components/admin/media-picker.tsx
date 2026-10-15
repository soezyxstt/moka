"use client";

import {
  ArrowUpRight,
  Check,
  FileIcon,
  FileText,
  Folder,
  FolderOpen,
  Grid2X2,
  Image as ImageIcon,
  List,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import Image from "next/image";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
import { getMediaAssetsAction } from "@/app/admin/media/actions";
import { adminNativeScrollbarClassName } from "@/components/admin/admin-scroll-area";
import { AdminMediaUploader } from "@/components/admin/media-uploader";
import { cn } from "@/lib/utils";
import type { UploadedMediaIdentity } from "@/server/media/upload-validation";

export type MediaAssetSummary = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  bytes: number;
  alt: string | null;
  decorative: boolean;
  lifecycle: string;
  folderId: string | null;
  provider?: string;
  providerKey?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
};

export type MediaFolderSummary = {
  id: string;
  parentId: string | null;
  editionId: string | null;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string | null;
};

export type EditionSummary = {
  id: string;
  year: number;
  name: string;
};

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getMimeBadge(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    const ext = mimeType.replace("image/", "").toUpperCase();
    return { label: ext, color: "border-brand-200 bg-brand-50 text-brand-800" };
  }
  if (mimeType.startsWith("video/")) {
    return { label: "VIDEO", color: "border-highlight-200 bg-highlight-50 text-highlight-800" };
  }
  if (mimeType === "application/pdf") {
    return { label: "PDF", color: "border-danger-200 bg-danger-50 text-danger-800" };
  }
  return { label: "FILE", color: "border-border bg-muted text-muted-foreground" };
}

export function AdminMediaPreview({
  asset,
  aspectRatioHint,
  className,
}: {
  asset: MediaAssetSummary;
  aspectRatioHint?: string;
  className?: string;
}) {
  const isImage = asset.mimeType.startsWith("image/");
  const isVideo = asset.mimeType.startsWith("video/");
  const badge = getMimeBadge(asset.mimeType);

  return (
    <div className={cn("relative flex items-center gap-3.5 rounded-lg border border-brand-100 bg-canvas p-3 shadow-xs", className)}>
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        {isImage ? (
          <Image
            src={asset.url}
            unoptimized={asset.mimeType === "image/svg+xml"}
            alt={asset.alt ?? asset.filename}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : isVideo ? (
          <div className="grid size-full place-items-center bg-highlight-50 text-highlight-700">
            <Video size={22} />
          </div>
        ) : (
          <div className="grid size-full place-items-center bg-brand-50 text-brand">
            <FileText size={22} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-sm border px-1.5 py-0.2 text-xs font-bold uppercase", badge.color)}>
            {badge.label}
          </span>
          {asset.decorative ? (
            <span className="rounded-sm border border-warning-200 bg-warning-50 px-1.5 py-0.2 text-xs font-semibold text-warning-800">
              Dekoratif
            </span>
          ) : asset.alt ? (
            <span className="max-w-44 truncate rounded-sm border border-brand-100 bg-brand-50/50 px-1.5 py-0.2 text-xs font-medium text-brand-800">
              Alt: {asset.alt}
            </span>
          ) : null}
          {aspectRatioHint ? (
            <span className="rounded-sm border border-border bg-muted px-1.5 py-0.2 text-xs text-muted-foreground">
              Rasio {aspectRatioHint}
            </span>
          ) : null}
        </div>
        <p className="truncate font-inter text-xs font-semibold text-brand-900" title={asset.filename}>
          {asset.filename}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(asset.bytes)} · {asset.lifecycle === "ready" ? "Siap" : asset.lifecycle}
        </p>
      </div>

      <a
        href={asset.url}
        target="_blank"
        rel="noreferrer"
        className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand"
        title="Lihat file asli"
        aria-label="Lihat file asli"
      >
        <ArrowUpRight size={14} />
      </a>
    </div>
  );
}

type AdminMediaPickerCommonProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acceptType?: "image" | "video" | "pdf" | "all";
  title?: string;
  description?: string;
  canManageMedia?: boolean;
  initialAssets?: MediaAssetSummary[];
  initialFolders?: MediaFolderSummary[];
  activeEditionId?: string | null;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export type AdminMediaPickerProps = AdminMediaPickerCommonProps & {
  multiple?: boolean;
  mode?: "single" | "multiple";
  onSelect?: (asset: MediaAssetSummary) => void;
  selectedAssetId?: string | null;
  selectedAssetIds?: string[];
  initialSelectedAssetIds?: string[];
  onSelectMany?: (assets: MediaAssetSummary[]) => void;
};

function normalizeAssetIds(assetIds: readonly string[] | undefined) {
  return [...new Set((assetIds ?? []).filter((assetId) => assetId.trim().length > 0))];
}

export function AdminMediaPicker({
  open,
  onOpenChange,
  multiple,
  mode = "single",
  onSelect,
  selectedAssetId,
  selectedAssetIds,
  initialSelectedAssetIds,
  onSelectMany,
  acceptType = "all",
  title = "Pilih media",
  description = "Pilih aset dari pustaka atau unggah file baru.",
  canManageMedia = false,
  initialAssets = [],
  initialFolders = [],
  activeEditionId = null,
  returnFocusRef,
}: AdminMediaPickerProps) {
  const isMultiple = multiple ?? mode === "multiple";
  const initialSelectionIds = normalizeAssetIds(selectedAssetIds ?? initialSelectedAssetIds);
  const [assets, setAssets] = useState<MediaAssetSummary[]>(initialAssets);
  const [assetCache, setAssetCache] = useState<Record<string, MediaAssetSummary>>(() =>
    Object.fromEntries(initialAssets.map((asset) => [asset.id, asset]))
  );
  const [folders, setFolders] = useState<MediaFolderSummary[]>(initialFolders);
  const [editions, setEditions] = useState<EditionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null | "all">("all");
  const [selectedFolderScope, setSelectedFolderScope] = useState<"all" | "edition" | "global">(() =>
    activeEditionId && initialFolders.some((folder) => folder.editionId === activeEditionId) ? "edition" : "all"
  );
  const [typeFilter, setTypeFilter] = useState<"image" | "video" | "pdf" | "all">(acceptType);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    isMultiple ? initialSelectionIds.at(-1) ?? null : selectedAssetId ?? null
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() => (isMultiple ? initialSelectionIds : []));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [previousFilterKey, setPreviousFilterKey] = useState("");
  const [previousOpen, setPreviousOpen] = useState(open);
  const selectedIdRef = useRef(selectedId);
  const selectedIdsRef = useRef(selectedIds);
  const previousSelectionKeyRef = useRef(initialSelectionIds.join("|"));
  const requestKeyRef = useRef(0);
  const folderScopeTouchedRef = useRef(false);
  const editionScopeDefaultedRef = useRef(
    Boolean(activeEditionId && initialFolders.some((folder) => folder.editionId === activeEditionId))
  );
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    if (!isMultiple) return;
    const selectionKey = initialSelectionIds.join("|");
    if (selectionKey === previousSelectionKeyRef.current) return;
    previousSelectionKeyRef.current = selectionKey;
    setSelectedIds(initialSelectionIds);
    selectedIdsRef.current = initialSelectionIds;
    setSelectedId(initialSelectionIds.at(-1) ?? null);
  }, [initialSelectionIds, isMultiple]);

  const loadData = useCallback(async (assetIds: readonly string[] = []) => {
    const requestKey = requestKeyRef.current + 1;
    requestKeyRef.current = requestKey;
    setIsLoading(true);
    try {
      const res = await getMediaAssetsAction({
        type: typeFilter,
        folderId: currentFolderId === "all" ? "all" : currentFolderId,
        folderScope: selectedFolderScope,
        editionId: activeEditionId,
        search: query.trim() || undefined,
        page,
        limit: pageSize,
        assetIds:
          assetIds.length > 0
            ? assetIds
            : isMultiple
              ? selectedIdsRef.current
              : selectedIdRef.current
                ? [selectedIdRef.current]
                : [],
      });
      if (requestKey !== requestKeyRef.current) return null;
      setAssets(res.assets);
      setAssetCache((current) => ({
        ...current,
        ...Object.fromEntries([...res.assets, ...res.selectedAssets].map((asset) => [asset.id, asset])),
      }));
      setFolders(res.folders);
      setEditions(res.editions);
      setPage(res.page);
      setPageSize(res.limit);
      setTotal(res.total);
      setHasMore(res.hasMore);

      if (
        !folderScopeTouchedRef.current &&
        !editionScopeDefaultedRef.current &&
        selectedFolderScope === "all" &&
        activeEditionId &&
        res.folders.some((folder) => folder.editionId === activeEditionId)
      ) {
        editionScopeDefaultedRef.current = true;
        setSelectedFolderScope("edition");
      }
      return res;
    } catch {
      if (requestKey === requestKeyRef.current) toast.error("Gagal memuat pustaka media");
      return null;
    } finally {
      if (requestKey === requestKeyRef.current) setIsLoading(false);
    }
  }, [activeEditionId, currentFolderId, isMultiple, page, pageSize, query, selectedFolderScope, typeFilter]);

  const handleUploaded = useCallback(async (identities: UploadedMediaIdentity[]) => {
    const uploadedIds = normalizeAssetIds(identities.map((identity) => identity.mediaAssetId));
    const res = await loadData(uploadedIds);
    if (uploadedIds.length === 0) return;

    const uploadedAssets = uploadedIds.flatMap((uploadedId) => {
      const asset = res?.selectedAssets.find((candidate) => candidate.id === uploadedId);
      return asset ? [asset] : [];
    });

    if (isMultiple) {
      setSelectedIds((current) => {
        const next = [...current];
        for (const asset of uploadedAssets) {
          if (!next.includes(asset.id)) next.push(asset.id);
        }
        selectedIdsRef.current = next;
        return next;
      });
      if (uploadedAssets.length > 0) setSelectedId(uploadedAssets[uploadedAssets.length - 1]!.id);
      return;
    }

    const uploadedAsset = uploadedAssets[0];
    if (uploadedAsset) setSelectedId(uploadedAsset.id);
  }, [isMultiple, loadData]);

  const [prevSelectedAssetId, setPrevSelectedAssetId] = useState(selectedAssetId);
  if (selectedAssetId !== prevSelectedAssetId) {
    setPrevSelectedAssetId(selectedAssetId);
    if (!isMultiple) setSelectedId(selectedAssetId ?? null);
  }

  const filterKey = [
    typeFilter,
    currentFolderId ?? "root",
    selectedFolderScope,
    activeEditionId ?? "",
    query,
  ].join("|");
  if (filterKey !== previousFilterKey) {
    setPreviousFilterKey(filterKey);
    setPage(0);
  }

  if (open !== previousOpen) {
    setPreviousOpen(open);
    if (open) {
      if (isMultiple) {
        const nextSelection = normalizeAssetIds(selectedAssetIds ?? initialSelectedAssetIds);
        setSelectedIds(nextSelection);
        setSelectedId(nextSelection.at(-1) ?? null);
      } else {
        setSelectedId(selectedAssetId ?? null);
      }
      setPage(0);
    }
  }

  useEffect(() => {
    if (!open) return;
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, query.trim() ? 180 : 0);
    return () => {
      window.clearTimeout(timeoutId);
      requestKeyRef.current += 1;
    };
  }, [open, loadData, query]);

  const handleFolderScopeChange = useCallback((scope: "all" | "edition" | "global") => {
    folderScopeTouchedRef.current = true;
    setSelectedFolderScope(scope);
    setCurrentFolderId("all");
  }, []);

  const activeEdition = useMemo(
    () => editions.find((e) => e.id === activeEditionId),
    [editions, activeEditionId]
  );

  const scopedFolders = useMemo(() => {
    if (selectedFolderScope === "edition" && activeEditionId) {
      return folders.filter((f) => f.editionId === activeEditionId);
    }
    if (selectedFolderScope === "global") {
      return folders.filter((f) => !f.editionId);
    }
    return folders;
  }, [folders, selectedFolderScope, activeEditionId]);

  const activeSelectedAsset = useMemo(
    () => (selectedId ? assetCache[selectedId] ?? assets.find((asset) => asset.id === selectedId) ?? null : null),
    [assetCache, assets, selectedId]
  );

  const selectedAssetList = useMemo(
    () =>
      selectedIds.flatMap((assetId) => {
        const asset = assetCache[assetId] ?? assets.find((candidate) => candidate.id === assetId);
        return asset ? [asset] : [];
      }),
    [assetCache, assets, selectedIds]
  );

  const handleAssetClick = (asset: MediaAssetSummary) => {
    if (!isMultiple) {
      setSelectedId(asset.id);
      return;
    }

    setSelectedId(asset.id);
    setSelectedIds((current) => {
      const next = current.includes(asset.id)
        ? current.filter((assetId) => assetId !== asset.id)
        : [...current, asset.id];
      selectedIdsRef.current = next;
      return next;
    });
  };

  const handleConfirmSelect = () => {
    if (isMultiple) {
      if (selectedAssetList.length !== selectedIds.length) return;
      if (!onSelectMany) return;
      onSelectMany(selectedAssetList);
    } else {
      if (!activeSelectedAsset) return;
      if (!onSelect) return;
      onSelect(activeSelectedAsset);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[calc(100%-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-4xl"
        onCloseAutoFocus={(event) => {
          if (!returnFocusRef?.current) return;
          event.preventDefault();
          returnFocusRef.current.focus();
        }}
      >
        <DialogHeader className="border-b border-brand-100 bg-background px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle className="font-manrope text-lg font-semibold text-brand-900">{title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isMultiple ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-highlight-200 bg-highlight-50 px-2.5 py-1 text-xs font-semibold text-highlight-800">
                  {selectedIds.length} dipilih
                </span>
              ) : null}
              {activeEdition ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand">
                  Edisi: {activeEdition.name} ({activeEdition.year})
                </span>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden lg:grid-cols-[200px_minmax(0,1fr)_260px] lg:grid-rows-none">
          {/* Left Sidebar: Folder Browser & Scope */}
          <aside className={cn("hidden border-b border-border bg-brand-50/25 p-3.5 lg:block lg:border-b-0 lg:border-r lg:overflow-y-auto", adminNativeScrollbarClassName)}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-800">Cakupan Folder</p>
            <div className="mt-2 space-y-1">
              <Button
                variant="ghost"
                type="button"
                onClick={() => handleFolderScopeChange("all")}
                className={cn(
                  "h-auto flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                  selectedFolderScope === "all" && currentFolderId === "all"
                    ? "bg-brand text-canvas"
                    : "text-brand-900 hover:bg-brand-50"
                )}
              >
                <FolderOpen size={14} /> Semua media
              </Button>
              {activeEditionId ? (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => handleFolderScopeChange("edition")}
                  className={cn(
                    "h-auto flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                    selectedFolderScope === "edition" ? "bg-brand text-canvas" : "text-brand-900 hover:bg-brand-50"
                  )}
                >
                  <Folder size={14} /> Folder edisi ini
                </Button>
              ) : null}
              <Button
                variant="ghost"
                type="button"
                onClick={() => handleFolderScopeChange("global")}
                className={cn(
                  "h-auto flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                  selectedFolderScope === "global" ? "bg-brand text-canvas" : "text-brand-900 hover:bg-brand-50"
                )}
              >
                <Folder size={14} /> Folder global
              </Button>
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-800">Daftar Folder</p>
            <div className="mt-2 space-y-0.5">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  folderScopeTouchedRef.current = true;
                  setCurrentFolderId(null);
                }}
                className={cn(
                  "h-auto flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                  currentFolderId === null ? "bg-canvas font-semibold text-brand shadow-xs" : "text-brand-900/80 hover:bg-canvas/70"
                )}
              >
                <Folder size={13} /> Root media
              </Button>
              {scopedFolders.map((folder) => (
                <Button
                  variant="ghost"
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    folderScopeTouchedRef.current = true;
                    setCurrentFolderId(folder.id);
                  }}
                  className={cn(
                    "h-auto flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                    currentFolderId === folder.id ? "bg-canvas font-semibold text-brand shadow-xs" : "text-brand-900/80 hover:bg-canvas/70"
                  )}
                >
                  <Folder size={13} />
                  <span className="truncate">{folder.name}</span>
                </Button>
              ))}
            </div>
          </aside>

          {/* Center: Search, Upload panel, Asset Grid */}
          <section className={cn("flex min-h-0 min-w-0 flex-col overflow-y-auto p-4", adminNativeScrollbarClassName)}>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama file atau teks alternatif"
                  aria-label="Cari media"
                  className="h-9 pl-8 text-xs rounded-md"
                />
              </div>

              <div className="flex items-center gap-2">
                {acceptType === "all" ? (
                  <div className="flex rounded-md border border-border bg-muted p-0.5">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setTypeFilter("all")}
                      className={cn("h-auto px-2 py-1 text-xs font-medium rounded-xs", typeFilter === "all" ? "bg-canvas text-brand shadow-xs" : "text-muted-foreground")}
                    >
                      Semua
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setTypeFilter("image")}
                      className={cn("h-auto px-2 py-1 text-xs font-medium rounded-xs", typeFilter === "image" ? "bg-canvas text-brand shadow-xs" : "text-muted-foreground")}
                    >
                      Gambar
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setTypeFilter("video")}
                      className={cn("h-auto px-2 py-1 text-xs font-medium rounded-xs", typeFilter === "video" ? "bg-canvas text-brand shadow-xs" : "text-muted-foreground")}
                    >
                      Video
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setTypeFilter("pdf")}
                      className={cn("h-auto px-2 py-1 text-xs font-medium rounded-xs", typeFilter === "pdf" ? "bg-canvas text-brand shadow-xs" : "text-muted-foreground")}
                    >
                      PDF
                    </Button>
                  </div>
                ) : null}

                <div className="flex rounded-md border border-border bg-muted p-0.5">
                  <Button
                    variant="ghost"
                    type="button"
                    aria-label="Tampilan kisi"
                    onClick={() => setViewMode("grid")}
                    className={cn("grid size-7 h-7 w-7 place-items-center rounded-xs p-0", viewMode === "grid" ? "bg-canvas text-brand shadow-xs" : "text-muted-foreground")}
                  >
                    <Grid2X2 size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    aria-label="Tampilan daftar"
                    onClick={() => setViewMode("list")}
                    className={cn("grid size-7 h-7 w-7 place-items-center rounded-xs p-0", viewMode === "list" ? "bg-canvas text-brand shadow-xs" : "text-muted-foreground")}
                  >
                    <List size={13} />
                  </Button>
                </div>
              </div>
            </div>

            <AdminMediaUploader
              folderId={typeof currentFolderId === "string" && currentFolderId !== "all" ? currentFolderId : null}
              folderName={
                currentFolderId === "all" || currentFolderId === null
                  ? "Tanpa folder"
                  : folders.find((folder) => folder.id === currentFolderId)?.name ?? "Folder media"
              }
              acceptType={typeFilter}
              canManage={canManageMedia}
              variant="picker"
              onUploaded={(identities) => void handleUploaded(identities)}
            />

            {/* Asset List */}
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center py-12 text-xs text-muted-foreground">
                Memuat aset...
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <span className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">
                  <FileIcon size={18} />
                </span>
                <p className="mt-2 font-manrope text-sm font-semibold text-brand-900">Tidak ada file yang sesuai</p>
                <p className="text-xs text-muted-foreground">Coba ubah filter atau unggah media baru.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2 md:grid-cols-4">
                {assets.map((asset) => {
                  const isImg = asset.mimeType.startsWith("image/");
                  const isVid = asset.mimeType.startsWith("video/");
                  const isSelected = isMultiple ? selectedIds.includes(asset.id) : selectedId === asset.id;

                  return (
                    <Button
                      variant="ghost"
                      key={asset.id}
                      type="button"
                      onClick={() => handleAssetClick(asset)}
                      className={cn(
                        "group relative flex h-auto flex-col overflow-hidden rounded-lg border p-0 text-left transition-all",
                        isSelected
                          ? "border-highlight-400 bg-highlight-50/30 ring-2 ring-highlight-300"
                          : "border-border bg-canvas hover:border-brand-200"
                      )}
                    >
                      <div className="relative aspect-square w-full bg-muted">
                        {isImg ? (
                          <Image
                            src={asset.url}
                            unoptimized={asset.mimeType === "image/svg+xml"}
                            alt={asset.alt ?? asset.filename}
                            fill
                            sizes="(max-width: 640px) 50vw, 160px"
                            className="object-cover transition-transform duration-200 group-hover:scale-102"
                          />
                        ) : isVid ? (
                          <div className="grid size-full place-items-center bg-highlight-50 text-highlight-700">
                            <Video size={24} />
                          </div>
                        ) : (
                          <div className="grid size-full place-items-center bg-brand-50 text-brand">
                            <FileText size={24} />
                          </div>
                        )}
                        {isSelected ? (
                          <div className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-highlight text-ink shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : null}
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-semibold text-brand-900" title={asset.filename}>
                          {asset.filename}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatBytes(asset.bytes)}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5 pt-2">
                {assets.map((asset) => {
                  const isImg = asset.mimeType.startsWith("image/");
                  const isSelected = isMultiple ? selectedIds.includes(asset.id) : selectedId === asset.id;

                  return (
                    <Button
                      variant="ghost"
                      key={asset.id}
                      type="button"
                      onClick={() => handleAssetClick(asset)}
                      className={cn(
                        "flex h-auto w-full items-center gap-3 rounded-md border p-2 text-left transition-colors",
                        isSelected
                          ? "border-highlight-400 bg-highlight-50/40 ring-1 ring-highlight-300"
                          : "border-border bg-canvas hover:border-brand-200"
                      )}
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {isImg ? (
                          <Image src={asset.url} unoptimized={asset.mimeType === "image/svg+xml"} alt="" fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="grid size-full place-items-center text-muted-foreground">
                            <FileText size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-brand-900">{asset.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(asset.bytes)} · {asset.mimeType}
                        </p>
                      </div>
                      {isSelected ? <Check size={15} className="mr-1 text-highlight-700" /> : null}
                    </Button>
                  );
                })}
              </div>
            )}

            {total > 0 ? (
              <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">
                  Menampilkan {page * pageSize + 1} sampai {Math.min((page + 1) * pageSize, total)} dari {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading || page === 0}
                    onClick={() => setPage((current) => Math.max(current - 1, 0))}
                    className="h-8 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLoading || !hasMore}
                    onClick={() => setPage((current) => current + 1)}
                    className="h-8 text-xs"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          {/* Right Sidebar: Selected Asset Inspector & Confirmation */}
          <aside className={cn("border-t border-border bg-muted/20 p-4 lg:border-l lg:border-t-0 flex flex-col justify-between overflow-y-auto", adminNativeScrollbarClassName)}>
            {activeSelectedAsset ? (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-highlight-700">Detail Terpilih</p>
                <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                  {activeSelectedAsset.mimeType.startsWith("image/") ? (
                    <Image
                      src={activeSelectedAsset.url}
                      unoptimized={activeSelectedAsset.mimeType === "image/svg+xml"}
                      alt={activeSelectedAsset.alt ?? activeSelectedAsset.filename}
                      fill
                      sizes="240px"
                      className="object-cover"
                    />
                  ) : activeSelectedAsset.mimeType.startsWith("video/") ? (
                    <div className="grid size-full place-items-center bg-highlight-50 text-highlight-700">
                      <Video size={30} />
                    </div>
                  ) : (
                    <div className="grid size-full place-items-center bg-brand-50 text-brand">
                      <FileText size={30} />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="break-words font-manrope text-xs font-semibold text-brand-900">
                    {activeSelectedAsset.filename}
                  </h4>
                  <dl className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ukuran</dt>
                      <dd className="font-medium text-foreground">{formatBytes(activeSelectedAsset.bytes)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Format</dt>
                      <dd className="max-w-28 truncate font-medium text-foreground">{activeSelectedAsset.mimeType}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Teks alternatif</dt>
                      <dd className="max-w-28 truncate font-medium text-foreground">
                        {activeSelectedAsset.decorative ? "(Dekoratif)" : activeSelectedAsset.alt ?? "Belum diisi"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <p className="font-medium">Belum ada aset dipilih</p>
                <p className="mt-1 text-xs">Klik salah satu aset pada daftar untuk memilih.</p>
              </div>
            )}

            <div className="mt-4 space-y-2 border-t border-border pt-3">
              {isMultiple ? (
                <p className="text-center text-xs font-medium text-muted-foreground">
                  {selectedIds.length} media dipilih
                </p>
              ) : null}
              <Button
                type="button"
                disabled={isMultiple ? selectedIds.length === 0 || selectedAssetList.length !== selectedIds.length : !activeSelectedAsset}
                onClick={handleConfirmSelect}
                className="w-full h-9 bg-brand text-xs font-semibold text-canvas hover:bg-brand-600"
              >
                {isMultiple ? `Pilih ${selectedIds.length} media` : "Gunakan media ini"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-9 text-xs"
              >
                Batal
              </Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type AdminMediaFieldProps = {
  name: string;
  label?: string;
  hint?: string;
  aspectRatioHint?: string;
  value?: string | null;
  initialAsset?: MediaAssetSummary | null;
  acceptType?: "image" | "video" | "pdf" | "all";
  canManageMedia?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (asset: MediaAssetSummary | null) => void;
  activeEditionId?: string | null;
};

export function AdminMediaField({
  name,
  label,
  hint,
  aspectRatioHint,
  value,
  initialAsset = null,
  acceptType = "image",
  canManageMedia = false,
  required = false,
  className,
  onChange,
  activeEditionId = null,
}: AdminMediaFieldProps) {
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetSummary | null>(() =>
    value === undefined || (value !== null && value !== "" && initialAsset?.id === value) ? initialAsset : null
  );
  const [isLocallyCleared, setIsLocallyCleared] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setIsLocallyCleared(false);
    setSelectedAsset(
      value === undefined
        ? initialAsset
        : value && initialAsset?.id === value
          ? initialAsset
          : selectedAsset?.id === value
            ? selectedAsset
            : null
    );
  }

 const [prevInitialAsset, setPrevInitialAsset] = useState(initialAsset);
 if (initialAsset !== prevInitialAsset) {
   setPrevInitialAsset(initialAsset);
    const initialAssetIdChanged = (initialAsset?.id ?? null) !== (prevInitialAsset?.id ?? null);
    if (!isLocallyCleared || (value === undefined && initialAssetIdChanged)) {
      if (value === undefined && initialAssetIdChanged) setIsLocallyCleared(false);
     setSelectedAsset(
       value === undefined
         ? initialAsset
         : value && initialAsset?.id === value
           ? initialAsset
           : selectedAsset?.id === value
             ? selectedAsset
             : null
     );
   }
 }

  const handleSelect = (asset: MediaAssetSummary) => {
    setSelectedAsset(asset);
    setIsLocallyCleared(false);
    onChange?.(asset);
  };

  const handleRemove = () => {
    setSelectedAsset(null);
    setIsLocallyCleared(true);
    onChange?.(null);
    setConfirmRemoveOpen(false);
  };

  const effectiveAssetId = isLocallyCleared ? "" : selectedAsset?.id ?? value ?? "";

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-center justify-between">
          <span className="block text-xs font-semibold text-foreground">
            {label} {required ? <span className="text-destructive">*</span> : null}
          </span>
          {aspectRatioHint ? (
            <span className="text-xs text-muted-foreground">Rasio {aspectRatioHint}</span>
          ) : null}
        </div>
      ) : null}

      <input type="hidden" name={name} value={effectiveAssetId} />

      {selectedAsset ? (
        <div className="space-y-2">
          <AdminMediaPreview asset={selectedAsset} aspectRatioHint={aspectRatioHint} />
          <div className="flex items-center gap-2">
            <Button
              ref={triggerRef}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs border-brand-200 bg-canvas text-brand hover:bg-brand-50"
              onClick={() => setPickerOpen(true)}
            >
              Ganti media
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs border-danger-200 text-destructive hover:bg-danger-50"
              onClick={() => setConfirmRemoveOpen(true)}
            >
              <Trash2 size={13} className="mr-1" /> Lepas media
            </Button>
          </div>
        </div>
      ) : (
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="default"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen(true)}
          className="flex h-auto w-full cursor-pointer flex-col items-center justify-center gap-0 rounded-lg border border-dashed border-brand-200 bg-brand-50/20 px-4 py-6 text-center whitespace-normal transition-colors hover:border-highlight-300 hover:bg-highlight-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
        >
          <span className="grid size-10 place-items-center rounded-md bg-canvas border border-brand-100 text-brand shadow-xs">
            {acceptType === "video" ? (
              <Video size={18} />
            ) : acceptType === "pdf" ? (
              <FileText size={18} />
            ) : (
              <ImageIcon size={18} />
            )}
          </span>
          <p className="mt-2 text-xs font-semibold text-brand-900">Pilih media</p>
          {aspectRatioHint ? <p className="mt-0.5 text-xs text-muted-foreground">Rasio {aspectRatioHint}</p> : null}
        </Button>
      )}

      {hint ? <p className="text-xs leading-4 text-muted-foreground">{hint}</p> : null}

      <AdminMediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
        selectedAssetId={effectiveAssetId || null}
        acceptType={acceptType}
        canManageMedia={canManageMedia}
        activeEditionId={activeEditionId}
        initialAssets={selectedAsset ? [selectedAsset] : []}
        returnFocusRef={triggerRef}
      />

      <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-manrope">Lepas media terpilih?</AlertDialogTitle>
            <AlertDialogDescription>
              Aset media tidak akan terhapus dari pustaka, hanya dilepas dari input formulir ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-canvas hover:bg-destructive/90">
              Lepas media
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
