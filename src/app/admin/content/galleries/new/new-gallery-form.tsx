"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AdminMediaField,
  type MediaAssetSummary,
} from "@/components/admin/media-picker";
import { AdminCard, AdminSelect } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createGalleryAction } from "../actions";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewGalleryForm({
  editionName,
  editionId,
  eventsList,
  initialEventId,
}: {
  editionName: string;
  editionId: string;
  eventsList: { id: string; label: string }[];
  initialEventId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [description, setDescription] = useState("");
  const validInitialEventId = eventsList.some((event) => event.id === initialEventId)
    ? initialEventId
    : undefined;
  const [ownerType, setOwnerType] = useState<"standalone" | "event">(
    validInitialEventId ? "event" : "standalone",
  );
  const [ownerId, setOwnerId] = useState<string>(
    validInitialEventId ?? eventsList[0]?.id ?? "",
  );
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [coverAsset, setCoverAsset] = useState<MediaAssetSummary | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isSlugCustomized || slug.trim() === "") {
      setSlug(slugify(newTitle));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (ownerType === "event" && !ownerId) {
      toast.error("Silakan pilih acara yang terkait");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Membuat album baru...");
    try {
      const res = await createGalleryAction({
        title: title.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        coverMediaId,
        ownerType,
        ownerId: ownerType === "event" ? ownerId : editionId,
        status,
      });

      if (res.galleryId) {
        toast.success("Album baru berhasil dibuat", { id: toastId });
        router.push(`/admin/content/galleries/${res.galleryId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat album";
      toast.error(msg, { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <AdminCard className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Link
            href="/admin/content/galleries"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} className="mr-1" /> Kembali ke daftar album
          </Link>
          <span className="text-xs font-semibold text-highlight-700">{editionName}</span>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-album-title" className="text-xs font-medium">Judul album *</label>
          <Input
            id="new-album-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={`Dokumentasi ${editionName}`}
            className="text-xs"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-album-slug" className="text-xs font-medium">Alamat album *</label>
          <Input
            id="new-album-slug"
            value={slug}
            onChange={(e) => {
              setIsSlugCustomized(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder={`dokumentasi-${slugify(editionName)}`}
            className="text-xs font-inter"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-album-description" className="text-xs font-medium">Deskripsi album</label>
          <Textarea
            id="new-album-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kumpulan momen dokumentasi kegiatan..."
            className="text-xs min-h-[70px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="new-album-type" className="text-xs font-medium">Tipe album</label>
            <AdminSelect
              id="new-album-type"
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

          {ownerType === "event" && (
            <div className="space-y-1.5">
              <label htmlFor="new-album-event" className="text-xs font-medium">Acara *</label>
              <AdminSelect
                id="new-album-event"
                aria-label="Pilih acara"
                value={ownerId}
                onValueChange={setOwnerId}
                required
                className="h-9 w-full text-xs"
                options={eventsList.map((ev) => ({ value: ev.id, label: ev.label }))}
              />
            </div>
          )}

          {ownerType === "standalone" && (
            <div className="space-y-1.5">
              <label htmlFor="new-album-status" className="text-xs font-medium">Status publikasi</label>
              <AdminSelect
                id="new-album-status"
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
            canManageMedia={true}
            hint="Pilih foto sampul utama yang merepresentasikan album ini."
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button asChild variant="outline" className="text-xs">
            <Link href="/admin/content/galleries">
              Batal
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-brand/90 text-canvas text-xs"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Save size={14} className="mr-1.5" />
            )}
            {isSubmitting ? "Menyimpan..." : "Buat album"}
          </Button>
        </div>
      </AdminCard>
    </form>
  );
}
