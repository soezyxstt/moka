"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { AdminButton, AdminCard, AdminField, AdminInput, AdminMediaField, AdminSelect, AdminTextarea } from "@/components/admin/primitives";
import type { MediaAssetSummary } from "@/components/admin/media-picker";
import { createEventAction, updateEventAction } from "./actions";

export type EventFormValue = {
  id: string;
  label: string;
  slug: string;
  description: string | null;
  heroMediaId: string | null;
  heroMedia: MediaAssetSummary | null;
  displayOrder: number;
  active: boolean;
  version: number;
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function EventForm({ editionId, initialValue, canEdit, canManageMedia }: {
  editionId: string;
  initialValue: EventFormValue | null;
  canEdit: boolean;
  canManageMedia: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(initialValue?.label ?? "");
  const [slug, setSlug] = useState(initialValue?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialValue));
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [heroMediaId, setHeroMediaId] = useState<string | null>(initialValue?.heroMediaId ?? null);
  const [heroMedia, setHeroMedia] = useState<MediaAssetSummary | null>(initialValue?.heroMedia ?? null);
  const [displayOrder, setDisplayOrder] = useState(String(initialValue?.displayOrder ?? 1));
  const [active, setActive] = useState(initialValue?.active ?? true);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const finalSlug = slugify(slug || label);
    const order = Number(displayOrder);
    if (label.trim().length < 2) return toast.error("Nama acara minimal 2 karakter");
    if (!finalSlug) return toast.error("Slug acara tidak valid");
    if (!Number.isInteger(order) || order < 0) return toast.error("Urutan acara tidak valid");
    startTransition(async () => {
      try {
        if (initialValue) {
          await updateEventAction({
            id: initialValue.id,
            expectedVersion: initialValue.version,
            label: label.trim(),
            slug: finalSlug,
            description: description.trim() || null,
            heroMediaId,
            displayOrder: order,
            active,
          });
          toast.success("Acara diperbarui");
          router.refresh();
        } else {
          const result = await createEventAction({ label: label.trim(), slug: finalSlug, description: description.trim() || null, heroMediaId, displayOrder: order, active });
          toast.success("Acara dibuat");
          router.push(`/admin/content/events/${result.eventId}`);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Acara gagal disimpan");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <AdminCard className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Nama acara" className="sm:col-span-2">
          <AdminInput value={label} onChange={(event) => { const value = event.target.value; setLabel(value); if (!slugEdited) setSlug(slugify(value)); }} required disabled={!canEdit} />
        </AdminField>
        <AdminField label="Slug">
          <AdminInput value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value)); }} required disabled={!canEdit} />
        </AdminField>
        <AdminField label="Urutan">
          <AdminInput type="number" min="0" step="1" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} required disabled={!canEdit} />
        </AdminField>
        <AdminField label="Deskripsi" className="sm:col-span-2">
          <AdminTextarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} disabled={!canEdit} />
        </AdminField>
        <AdminField label="Status">
          <AdminSelect value={active ? "active" : "inactive"} onValueChange={(value) => setActive(value === "active")} disabled={!canEdit} options={[{ value: "active", label: "Aktif" }, { value: "inactive", label: "Nonaktif" }]} />
        </AdminField>
      </AdminCard>

      <AdminCard>
        <AdminMediaField
          name="heroMediaId"
          label="Foto hero"
          hint="Pilih gambar siap pakai dari pustaka media."
          value={heroMediaId}
          initialAsset={heroMedia}
          onChange={(asset) => { setHeroMediaId(asset?.id ?? null); setHeroMedia(asset); }}
          activeEditionId={editionId}
          canManageMedia={canManageMedia}
          acceptType="image"
        />
      </AdminCard>

      {canEdit ? <div className="flex justify-end"><AdminButton type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan acara"}</AdminButton></div> : null}
    </form>
  );
}
