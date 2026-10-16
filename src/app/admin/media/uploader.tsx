"use client";

import {
  ArrowUpRight,
  Check,
  Clipboard,
  FileImage,
  Folder,
  FolderOpen,
  FolderPlus,
  Grid2X2,
  List,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type DragEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AdminButton, AdminInput, AdminSelect } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import {
  createMediaFolderAction,
  moveMediaAssetAction,
  renameMediaFolderAction,
  updateMediaAssetMetadataAction,
} from "./actions";

export type MediaAssetRecord = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  bytes: number;
  alt: string | null;
  decorative: boolean;
  lifecycle: string;
  folderId: string | null;
  createdAt: string;
};

export type MediaFolderRecord = {
  id: string;
  parentId: string | null;
  editionId: string | null;
  name: string;
  slug: string;
  createdAt: string;
};

export type EditionRecord = {
  id: string;
  year: number;
  name: string;
};

type ViewMode = "grid" | "list";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFolderPath(folders: MediaFolderRecord[], folderId: string | null) {
  const path: MediaFolderRecord[] = [];
  let current = folderId ? folders.find((folder) => folder.id === folderId) : undefined;
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    path.unshift(current);
    visited.add(current.id);
    current = current.parentId ? folders.find((folder) => folder.id === current?.parentId) : undefined;
  }
  return path;
}

function getDescendantIds(folders: MediaFolderRecord[], folderId: string) {
  const ids = new Set([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        changed = true;
      }
    }
  }
  return ids;
}

function flattenFolders(folders: MediaFolderRecord[], parentId: string | null = null, depth = 0): Array<MediaFolderRecord & { depth: number }> {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
    .flatMap((folder) => [{ ...folder, depth }, ...flattenFolders(folders, folder.id, depth + 1)]);
}

function MediaUploader({ folderId, folderName }: { folderId: string | null; folderName: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { startUpload, isUploading } = useUploadThing("image", {
    onClientUploadComplete: () => {
      setFiles([]);
      toast.success("Media berhasil diunggah");
      router.refresh();
    },
    onUploadError: (error) => {
      toast.error(error.message || "Media gagal diunggah");
    },
  });

  const addFiles = (incoming: File[]) => {
    const images = incoming.filter((file) => file.type.startsWith("image/"));
    if (images.length !== incoming.length) toast.error("Hanya file gambar yang dapat diunggah di sini");
    setFiles(images);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => addFiles(Array.from(event.target.files ?? []));
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <Accordion type="single" collapsible className="border-y border-border bg-card">
      <AccordionItem value="upload">
      <AccordionTrigger className="items-center px-4 py-3.5 hover:no-underline sm:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand text-canvas">
          <UploadCloud size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-manrope text-sm font-semibold text-brand-900">Unggah media</span>
          <span className="block truncate text-xs text-muted-foreground">Folder tujuan: {folderName}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
      <div className="grid gap-4 border-t border-brand-100 bg-[linear-gradient(120deg,var(--color-brand-50),var(--canvas)_60%,var(--color-highlight-50))] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] lg:items-center">
        <div>
          <h2 className="mt-1 font-manrope text-base font-semibold text-brand-900">Tambahkan ke {folderName}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">JPEG, PNG, WebP, atau AVIF. Maksimal 20 MB per gambar.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 h-9 rounded-md border-brand-200 bg-canvas text-brand-700 hover:bg-brand-50"
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={15} /> Pilih file
          </Button>
        </div>
        <div
          onDragEnter={() => setIsDragging(true)}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "rounded-lg border border-dashed px-4 py-4 text-center transition-colors",
            isDragging ? "border-highlight-400 bg-highlight-50" : "border-brand-200 bg-canvas/70"
          )}
        >
          <input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleInput} />
          <UploadCloud size={20} className="mx-auto text-brand" />
          <p className="mt-2 text-sm font-semibold text-brand-900">Tarik gambar ke area ini</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {files.length ? `${files.length} file siap diunggah` : "File baru akan masuk ke folder aktif"}
          </p>
          {files.length ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {files.map((file) => (
                <span
                  key={`${file.name}-${file.lastModified}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-md bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700"
                >
                  <FileImage size={13} />
                  <span className="max-w-36 truncate">{file.name}</span>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Hapus ${file.name}`} className="size-5 rounded-sm p-0" onClick={() => setFiles((current) => current.filter((item) => item !== file))}>
                    <X size={13} />
                  </Button>
                </span>
              ))}
            </div>
          ) : null}
          <Button
            type="button"
            disabled={!files.length || isUploading}
            className="mt-3 h-9 rounded-md bg-brand px-4 text-xs hover:bg-brand-600"
            onClick={() => startUpload(files, { folderId })}
          >
            {isUploading ? "Mengunggah..." : files.length ? `Unggah ${files.length} file` : "Pilih file dahulu"}
          </Button>
        </div>
      </div>
      </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function MediaExplorer({
  assets,
  folders,
  editions = [],
  canManage = true,
  activeEditionId = null,
}: {
  assets: MediaAssetRecord[];
  folders: MediaFolderRecord[];
  editions?: EditionRecord[];
  canManage?: boolean;
  activeEditionId?: string | null;
}) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [folderScope, setFolderScope] = useState<"all" | "edition" | "global">("all");

  const currentFolder = folders.find((folder) => folder.id === currentFolderId) ?? null;
  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? null;

  const scopedFolders = useMemo(() => {
    if (folderScope === "edition" && activeEditionId) {
      return folders.filter((f) => f.editionId === activeEditionId);
    }
    if (folderScope === "global") {
      return folders.filter((f) => !f.editionId);
    }
    return folders;
  }, [folders, folderScope, activeEditionId]);

  const flatFolders = useMemo(() => flattenFolders(scopedFolders), [scopedFolders]);
  const folderPath = useMemo(() => getFolderPath(folders, currentFolderId), [folders, currentFolderId]);
  const childFolders = useMemo(
    () => scopedFolders.filter((folder) => folder.parentId === currentFolderId).sort((a, b) => a.name.localeCompare(b.name, "id")),
    [scopedFolders, currentFolderId]
  );

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const folder of folders) {
      const descendants = getDescendantIds(folders, folder.id);
      counts.set(folder.id, assets.filter((asset) => asset.folderId && descendants.has(asset.folderId)).length);
    }
    return counts;
  }, [assets, folders]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleAssets = useMemo(() => {
    const pool = normalizedQuery ? assets : assets.filter((asset) => asset.folderId === currentFolderId);
    return pool.filter((asset) => `${asset.filename} ${asset.alt ?? ""}`.toLowerCase().includes(normalizedQuery));
  }, [assets, currentFolderId, normalizedQuery]);

  const folderCount = (folderId: string) => folderCounts.get(folderId) ?? 0;

  const openFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedId(null);
    setQuery("");
  };

  const copyUrl = async () => {
    if (!selectedAsset) return;
    await navigator.clipboard.writeText(selectedAsset.url);
    toast.success("URL media disalin");
  };

  return (
    <div className="space-y-5">
      {canManage ? (
        <MediaUploader folderId={currentFolderId} folderName={currentFolder?.name ?? "Root media"} />
      ) : null}

      <div className="grid min-h-[38rem] overflow-hidden border-y border-brand-100 bg-card xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <aside className="border-b border-border bg-brand-50/35 p-3 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between px-2 py-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Folder media</p>
            <FolderOpen size={15} className="text-highlight-600" />
          </div>

          <div className="mb-2 flex rounded-md border border-border bg-canvas p-0.5 text-xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFolderScope("all")}
              className={cn("h-auto flex-1 rounded-xs px-2 py-1 font-medium text-center", folderScope === "all" ? "bg-brand text-canvas" : "text-muted-foreground hover:text-foreground")}
            >
              Semua
            </Button>
            {activeEditionId ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFolderScope("edition")}
                className={cn("h-auto flex-1 rounded-xs px-2 py-1 font-medium text-center", folderScope === "edition" ? "bg-brand text-canvas" : "text-muted-foreground hover:text-foreground")}
              >
                Edisi
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFolderScope("global")}
              className={cn("h-auto flex-1 rounded-xs px-2 py-1 font-medium text-center", folderScope === "global" ? "bg-brand text-canvas" : "text-muted-foreground hover:text-foreground")}
            >
              Global
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={() => openFolder(null)}
            className={cn(
              "mt-1 flex h-auto w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
              currentFolderId === null ? "bg-brand text-canvas" : "text-brand-800 hover:bg-brand-50"
            )}
          >
            <FolderOpen size={16} /> Root media <span className="ml-auto text-xs opacity-65">{assets.length}</span>
          </Button>
          <div className="mt-1 space-y-0.5">
            {flatFolders.map((folder) => {
              const folderEdition = editions.find((e) => e.id === folder.editionId);
              return (
                <Button
                  key={folder.id}
                  type="button"
                  variant="ghost"
                  size="default"
                  onClick={() => openFolder(folder.id)}
                  className={cn(
                    "flex h-auto w-full items-center gap-2 rounded-md py-2 pr-2 text-left text-sm transition-colors",
                    currentFolderId === folder.id ? "bg-canvas font-semibold text-brand shadow-sm" : "text-brand-800/75 hover:bg-canvas/75 hover:text-brand",
                    folder.depth === 0 ? "pl-3" : folder.depth === 1 ? "pl-7" : "pl-10"
                  )}
                >
                  <Folder size={15} className="shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  {folderEdition ? (
                    <span className="rounded-xs border border-brand-200 bg-brand-50 px-1 text-xs font-semibold text-brand">
                      {folderEdition.year}
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs opacity-55">{folderCount(folder.id)}</span>
                </Button>
              );
            })}
          </div>
          {folders.length === 0 ? (
            <p className="px-3 py-5 text-xs leading-5 text-muted-foreground">
              Belum ada folder. Buat struktur pertama dari area file.
            </p>
          ) : null}
        </aside>

        <section className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-col gap-4 border-b border-border pb-4">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Button type="button" variant="ghost" size="sm" className="h-auto rounded-none px-0 py-0 font-semibold text-brand hover:underline" onClick={() => openFolder(null)}>
                Media
              </Button>
              {folderPath.map((folder) => (
                <span key={folder.id} className="flex items-center gap-1.5">
                  <span>/</span>
                  <Button type="button" variant="ghost" size="sm" className="h-auto rounded-none px-0 py-0 hover:text-brand hover:underline" onClick={() => openFolder(folder.id)}>
                    {folder.name}
                  </Button>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-manrope text-xl font-semibold text-brand-900">{currentFolder?.name ?? "Root media"}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {normalizedQuery
                    ? `${visibleAssets.length} hasil pencarian`
                    : `${visibleAssets.length} file dan ${childFolders.length} folder`}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative sm:w-56">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari seluruh media"
                    className="h-10 rounded-md border-input pl-9 text-sm"
                  />
                </div>
                <div className="flex h-10 rounded-md border border-border bg-muted p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Tampilan grid"
                    className={cn("size-8 rounded-sm p-0", viewMode === "grid" ? "bg-canvas text-brand shadow-sm" : "text-muted-foreground")}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid2X2 size={15} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Tampilan list"
                    className={cn("size-8 rounded-sm p-0", viewMode === "list" ? "bg-canvas text-brand shadow-sm" : "text-muted-foreground")}
                    onClick={() => setViewMode("list")}
                  >
                    <List size={15} />
                  </Button>
                </div>
              </div>
            </div>
            {canManage ? (
              <form action={createMediaFolderAction} className="flex flex-col gap-2 rounded-lg border border-dashed border-brand-200 bg-brand-50/35 p-3 sm:flex-row sm:items-center">
                <input type="hidden" name="parentId" value={currentFolderId ?? ""} />
                <AdminInput name="name" required maxLength={80} placeholder={currentFolder ? `Folder baru di ${currentFolder.name}` : "Nama folder baru"} className="flex-1" />
                <AdminSelect
                  aria-label="Edisi folder"
                  name="editionId"
                  defaultValue={activeEditionId ?? ""}
                  className="sm:w-44"
                  options={[
                    { value: "", label: "Folder global" },
                    ...editions.map((ed) => ({ value: ed.id, label: `Edisi ${ed.year}` })),
                  ]}
                />
                <AdminButton type="submit" variant="secondary" className="shrink-0">
                  <FolderPlus size={15} /> Buat folder
                </AdminButton>
              </form>
            ) : null}
          </div>

          {!normalizedQuery && childFolders.length ? (
            <div className="grid gap-2 border-b border-border py-4 sm:grid-cols-2 lg:grid-cols-3">
              {childFolders.map((folder) => {
                const folderEdition = editions.find((e) => e.id === folder.editionId);
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    size="default"
                    key={folder.id}
                    onClick={() => openFolder(folder.id)}
                    className="flex h-auto w-full items-center gap-3 rounded-lg border border-border p-3 text-left whitespace-normal transition-colors hover:border-highlight-300 hover:bg-highlight-50"
                  >
                    <span className="grid size-9 place-items-center rounded-md bg-highlight-50 text-highlight-700">
                      <Folder size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-brand-900">{folder.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {folderCount(folder.id)} file {folderEdition ? `· Edisi ${folderEdition.year}` : "· Global"}
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : null}

          {visibleAssets.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-md bg-muted text-muted-foreground">
                <FileImage size={19} />
              </span>
              <h3 className="mt-3 font-manrope text-base font-semibold text-brand-900">File tidak ditemukan</h3>
              <p className="mt-1 text-sm text-muted-foreground">Unggah file atau pilih folder lain.</p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2 pt-4"}>
              {visibleAssets.map((asset) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="default"
                  key={asset.id}
                  onClick={() => setSelectedId(asset.id)}
                  className={
                    viewMode === "grid"
                      ? cn(
                          "group flex h-auto w-full flex-col items-stretch gap-0 overflow-hidden rounded-lg border p-0 text-left whitespace-normal transition-colors",
                          selectedId === asset.id
                            ? "border-highlight-400 bg-highlight-50/45 ring-2 ring-highlight-100"
                            : "border-border bg-canvas hover:border-brand-200"
                        )
                      : cn(
                          "flex h-auto w-full items-center gap-3 rounded-md border p-2 text-left whitespace-normal transition-colors",
                          selectedId === asset.id ? "border-highlight-400 bg-highlight-50/45" : "border-border hover:border-brand-200"
                        )
                  }
                >
                  {viewMode === "grid" ? (
                    <>
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {asset.mimeType.startsWith("image/") ? (
                          <Image
                            src={asset.url}
                            unoptimized={asset.mimeType === "image/svg+xml"}
                            alt={asset.alt ?? asset.filename}
                            fill
                            sizes="(max-width: 640px) 100vw, 260px"
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <FileImage size={26} className="absolute inset-0 m-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-semibold text-brand-900">{asset.filename}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatBytes(asset.bytes)} · {asset.lifecycle}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                        {asset.mimeType.startsWith("image/") ? (
                          <Image src={asset.url} unoptimized={asset.mimeType === "image/svg+xml"} alt="" fill sizes="44px" className="object-cover" />
                        ) : (
                          <FileImage size={17} className="absolute inset-0 m-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-brand-900">{asset.filename}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatBytes(asset.bytes)} · {asset.lifecycle}
                        </p>
                      </div>
                      {selectedId === asset.id ? <Check size={15} className="mr-2 text-highlight-600" /> : null}
                    </>
                  )}
                </Button>
              ))}
            </div>
          )}
        </section>

        <aside className="border-t border-border bg-muted/35 p-4 xl:border-l xl:border-t-0 space-y-5">
          {selectedAsset ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-highlight-700">Detail file</p>
              <div className="relative mt-3 aspect-square overflow-hidden rounded-lg bg-muted border border-border">
                {selectedAsset.mimeType.startsWith("image/") ? (
                  <Image
                    src={selectedAsset.url}
                    unoptimized={selectedAsset.mimeType === "image/svg+xml"}
                    alt={selectedAsset.alt ?? selectedAsset.filename}
                    fill
                    sizes="280px"
                    className="object-cover"
                  />
                ) : (
                  <FileImage size={28} className="absolute inset-0 m-auto text-muted-foreground" />
                )}
              </div>
              <h3 className="mt-4 break-words font-manrope text-base font-semibold text-brand-900">{selectedAsset.filename}</h3>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Ukuran</dt>
                  <dd className="font-medium text-foreground">{formatBytes(selectedAsset.bytes)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tipe</dt>
                  <dd className="max-w-40 truncate font-medium text-foreground">{selectedAsset.mimeType}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium text-success-700">{selectedAsset.lifecycle}</dd>
                </div>
              </dl>

              {/* Metadata Edit (alt & decorative) */}
              {canManage ? (
                <form action={updateMediaAssetMetadataAction} className="mt-4 space-y-2.5 border-t border-border pt-4">
                  <input type="hidden" name="assetId" value={selectedAsset.id} />
                  <p className="text-xs font-semibold text-foreground">Metadata aset</p>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <Checkbox
                      name="decorative"
                      value="true"
                      defaultChecked={selectedAsset.decorative}
                    />
                    Tandai sebagai dekoratif
                  </label>
                  <label className="block text-xs text-muted-foreground" htmlFor="asset-alt">
                    Teks alternatif (Alt)
                  </label>
                  <AdminInput
                    id="asset-alt"
                    name="alt"
                    defaultValue={selectedAsset.alt ?? ""}
                    placeholder="Deskripsi untuk pembaca layar"
                  />
                  <AdminButton type="submit" variant="secondary" className="w-full">
                    Simpan metadata
                  </AdminButton>
                </form>
              ) : null}

              {canManage ? (
                <form action={moveMediaAssetAction} className="mt-4 space-y-2 border-t border-border pt-4">
                  <input type="hidden" name="assetId" value={selectedAsset.id} />
                  <label className="text-xs font-semibold text-foreground" htmlFor="move-folder">
                    Pindahkan ke
                  </label>
                  <AdminSelect
                    id="move-folder"
                    aria-label="Folder tujuan"
                    name="folderId"
                    defaultValue={selectedAsset.folderId ?? ""}
                    options={[
                      { value: "", label: "Root media" },
                      ...flatFolders.map((folder) => ({ value: folder.id, label: `${"  ".repeat(folder.depth)}${folder.name}` })),
                    ]}
                  />
                  <AdminButton type="submit" className="w-full">
                    Pindahkan file
                  </AdminButton>
                </form>
              ) : null}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="h-9 rounded-md text-xs" onClick={copyUrl}>
                  <Clipboard size={14} /> Salin URL
                </Button>
                <Button asChild className="h-9 rounded-md bg-brand text-xs hover:bg-brand-600">
                  <a href={selectedAsset.url} target="_blank" rel="noreferrer">
                    Buka <ArrowUpRight size={14} />
                  </a>
                </Button>
              </div>
            </div>
          ) : currentFolder ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-highlight-700">Detail folder</p>
              <span className="mt-4 grid size-12 place-items-center rounded-md bg-highlight-50 text-highlight-700">
                <FolderOpen size={21} />
              </span>
              <h3 className="mt-3 font-manrope text-lg font-semibold text-brand-900">{currentFolder.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{folderCount(currentFolder.id)} file di dalam struktur ini</p>
              {canManage ? (
                <form action={renameMediaFolderAction} className="mt-5 space-y-2 border-t border-border pt-4">
                  <input type="hidden" name="folderId" value={currentFolder.id} />
                  <label className="text-xs font-semibold" htmlFor="rename-folder">
                    Ubah nama folder
                  </label>
                  <AdminInput id="rename-folder" name="name" defaultValue={currentFolder.name} required maxLength={80} />
                  <AdminSelect
                    aria-label="Edisi folder"
                    name="editionId"
                    defaultValue={currentFolder.editionId ?? ""}
                    options={[
                      { value: "", label: "Folder global" },
                      ...editions.map((ed) => ({ value: ed.id, label: `Edisi ${ed.year}` })),
                    ]}
                  />
                  <AdminButton type="submit" variant="secondary" className="w-full">
                    Simpan perubahan
                  </AdminButton>
                </form>
              ) : null}
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-highlight-700">Informasi</p>
              <span className="mt-4 grid size-12 place-items-center rounded-md bg-brand-50 text-brand">
                <FolderOpen size={21} />
              </span>
              <h3 className="mt-3 font-manrope text-base font-semibold text-brand-900">Pilih file atau folder</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Detail dan tindakan pengelolaan akan tersedia di panel ini.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
