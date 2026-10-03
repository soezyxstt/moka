"use client";

import { ArrowLeft, Save } from "lucide-react";
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
        toast.success("Album baru berhasil dibuat");
        router.push(`/admin/content/galleries/${res.galleryId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat album";
      toast.error(msg);
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
          <span className="text-xs font-semibold text-fb">{editionName}</span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Judul Album Galeri *</label>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Contoh: Behind the Scenes Pasanggiri 2025"
            className="text-xs"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Slug URL *</label>
          <Input
            value={slug}
            onChange={(e) => {
              setIsSlugCustomized(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="behind-the-scenes-2025"
            className="text-xs font-mono"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Deskripsi Singkat Album</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kumpulan momen dokumentasi kegiatan..."
            className="text-xs min-h-[70px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Tipe Album</label>
            <AdminSelect
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
              <label className="text-xs font-medium">Pilih Acara *</label>
              <AdminSelect
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
              <label className="text-xs font-medium">Status Publikasi</label>
              <AdminSelect
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
            label="Foto Sampul / Cover Album"
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
          <Link href="/admin/content/galleries">
            <Button type="button" variant="outline" className="text-xs">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-dgb hover:bg-dgb/90 text-white text-xs"
          >
            <Save size={14} className="mr-1.5" />
            {isSubmitting ? "Menyimpan..." : "Buat album"}
          </Button>
        </div>
      </AdminCard>
    </form>
  );
}
