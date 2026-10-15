"use client";

import { FileImage, FileText, UploadCloud, Video, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { mediaPolicy, type MediaUploadKind } from "@/server/media/policy";
import {
  mediaUploadAccept,
  mediaSizeLabel,
  parseUploadedMediaIdentity,
  validateMediaFiles,
  type UploadedMediaIdentity,
} from "@/server/media/upload-validation";

export type AdminMediaUploaderProps = {
  folderId: string | null;
  folderName?: string;
  acceptType?: "image" | "video" | "pdf" | "all";
  canManage?: boolean;
  variant?: "picker" | "library";
  onUploaded?: (assets: UploadedMediaIdentity[]) => void;
  className?: string;
};

const uploadKinds: MediaUploadKind[] = ["image", "video", "pdf"];

function uploadLabel(kind: MediaUploadKind) {
  if (kind === "image") return "Gambar";
  if (kind === "video") return "Video";
  return "PDF";
}

function uploadIcon(kind: MediaUploadKind) {
  if (kind === "image") return <FileImage size={15} />;
  if (kind === "video") return <Video size={15} />;
  return <FileText size={15} />;
}

export function AdminMediaUploader({
  folderId,
  folderName = "Root media",
  acceptType = "all",
  canManage = false,
  variant = "picker",
  onUploaded,
  className,
}: AdminMediaUploaderProps) {
  const allowedKinds = acceptType === "all" ? uploadKinds : [acceptType];
  const [selectedKind, setSelectedKind] = useState<MediaUploadKind>(allowedKinds[0] ?? "image");
  const uploadKind = allowedKinds.includes(selectedKind) ? selectedKind : (allowedKinds[0] ?? "image");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputAccept = mediaUploadAccept(uploadKind);
  const { startUpload, isUploading } = useUploadThing(uploadKind, {
    onClientUploadComplete: (responses) => {
      const identities = responses
        .map((response) => parseUploadedMediaIdentity(response.serverData))
        .filter((identity): identity is UploadedMediaIdentity => identity !== null);
      setFiles([]);
      onUploaded?.(identities);
      if (identities.length !== responses.length) {
        toast.error("Identitas upload belum lengkap. Periksa pustaka media.");
        return;
      }
      toast.success(`${identities.length} media berhasil diunggah`);
    },
    onUploadError: (error) => {
      toast.error(error.message || "Upload media gagal");
    },
  });

  if (!canManage) return null;

  const chooseFiles = (incoming: File[]) => {
    const result = validateMediaFiles(incoming, uploadKind);
    if (result.rejected.length > 0) {
      const hasSizeRejection = result.rejected.some((item) => item.reason === "size");
      const hasMimeRejection = result.rejected.some((item) => item.reason === "mime");
      if (hasSizeRejection) toast.error(`Ada file yang melebihi batas ${mediaSizeLabel(uploadKind)}.`);
      if (hasMimeRejection) toast.error(`Jenis file tidak sesuai. Gunakan ${mediaPolicy[uploadKind].allowedMimeTypes.join(", ")}.`);
    }
    if (result.truncated.length > 0) {
      toast.error(`Maksimal ${result.maxFileCount} file untuk tipe ${uploadLabel(uploadKind)}`);
    }
    setFiles(result.accepted as File[]);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isUploading) return;
    setIsDragging(false);
    chooseFiles(Array.from(event.dataTransfer.files));
  };

  const panelClass = variant === "library"
    ? "border-brand-100 bg-brand-50/20"
    : "border-brand-200 bg-brand-50/25";

  return (
    <div
      className={cn("rounded-lg border border-dashed p-3", panelClass, className)}
      aria-busy={isUploading}
      onDragEnter={() => { if (!isUploading) setIsDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); }}
      onDragLeave={() => { if (!isUploading) setIsDragging(false); }}
      onDrop={handleDrop}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand text-canvas">
            <UploadCloud size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-900">Unggah media</p>
            <p className="truncate text-xs text-muted-foreground">Folder tujuan: {folderName}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allowedKinds.length > 1 ? (
            <div className="flex rounded-md border border-border bg-canvas p-0.5" aria-label="Tipe upload">
              {allowedKinds.map((kind) => (
                <Button
                  key={kind}
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => {
                    setSelectedKind(kind);
                    setFiles([]);
                  }}
                  className={cn(
                    "h-auto rounded-sm px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
                    uploadKind === kind ? "bg-brand text-canvas" : "text-muted-foreground hover:text-brand",
                  )}
                >
                  {uploadLabel(kind)}
                </Button>
              ))}
            </div>
          ) : null}
          <input ref={inputRef} className="hidden" type="file" accept={inputAccept} multiple={mediaPolicy[uploadKind].maxFileCount > 1} disabled={isUploading} onChange={handleInput} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="h-8 border-brand-200 bg-canvas text-xs text-brand hover:bg-brand-50"
            onClick={() => inputRef.current?.click()}
          >
            {uploadIcon(uploadKind)} Pilih file
          </Button>
        </div>
      </div>

      <div className={cn("mt-3 rounded-md border border-dashed px-3 py-3 text-center transition-colors", isDragging ? "border-highlight-400 bg-highlight-50" : "border-brand-100 bg-canvas/70")}>
        <p className="text-xs text-muted-foreground">
          Tarik file ke area ini atau pilih dari perangkat. Maksimal {mediaPolicy[uploadKind].maxFileCount} file, {mediaSizeLabel(uploadKind)} per file.
        </p>
        {files.length > 0 ? (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {files.map((file) => (
              <span key={`${file.name}-${file.lastModified}`} className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-brand-100 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-800">
                {uploadIcon(uploadKind)}
                <span className="max-w-40 truncate">{file.name}</span>
                <Button type="button" variant="ghost" size="icon" disabled={isUploading} aria-label={`Hapus ${file.name}`} className="size-5 rounded-sm p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200" onClick={() => setFiles((current) => current.filter((item) => item !== file))}>
                  <X size={12} />
                </Button>
              </span>
            ))}
          </div>
        ) : null}
        <Button
          type="button"
          disabled={files.length === 0 || isUploading}
          className="mt-2 h-8 bg-brand px-3 text-xs text-canvas hover:bg-brand-600"
          onClick={() => void startUpload(files, { folderId })}
        >
          {isUploading ? "Mengunggah..." : files.length > 0 ? `Unggah ${files.length} file` : "Pilih file dahulu"}
        </Button>
      </div>
    </div>
  );
}
