"use client";

import { ArrowDown, ArrowUp, ImageIcon, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { MediaAssetSummary } from "@/components/admin/media-picker";
import { AdminBadge, AdminButton, AdminCard, AdminEmptyState, AdminLinkButton } from "@/components/admin/primitives";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteEventAction, reorderEventsAction } from "./actions";

export type EventDirectoryItem = {
  id: string;
  label: string;
  slug: string;
  description: string | null;
  heroMedia: MediaAssetSummary | null;
  displayOrder: number;
  active: boolean;
  version: number;
  galleryCount: number;
};

export function EventsDirectory({ initialEvents, canEdit }: { initialEvents: EventDirectoryItem[]; canEdit: boolean }) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<EventDirectoryItem | null>(null);

  function reorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= events.length) return;
    const reordered = [...events];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    startTransition(async () => {
      try {
        await reorderEventsAction({ items: reordered.map((item) => ({ id: item.id, expectedVersion: item.version })) });
        setEvents(reordered.map((item, displayOrder) => ({ ...item, displayOrder: displayOrder + 1, version: item.version + 1 })));
        toast.success("Urutan acara disimpan");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Urutan gagal disimpan");
      }
    });
  }

  function removeEvent() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteEventAction({ id: deleteTarget.id, expectedVersion: deleteTarget.version });
        setEvents((items) => items.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast.success("Acara dihapus");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Acara gagal dihapus");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{events.length} acara</p>
        {canEdit ? <AdminLinkButton href="/admin/content/events/new"><Plus className="size-4" />Tambah acara</AdminLinkButton> : null}
      </div>
      {events.length === 0 ? <AdminCard padding="none"><AdminEmptyState icon="gallery" title="Belum ada acara" description="Tambahkan acara pertama." /></AdminCard> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event, index) => (
            <AdminCard key={event.id} padding="none" className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {event.heroMedia ? <Image src={event.heroMedia.url} alt={event.heroMedia.alt || event.label} fill className="object-cover" sizes="(max-width: 768px) 100vw, 420px" /> : <div className="grid h-full place-items-center text-muted-foreground"><ImageIcon className="size-8" /></div>}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2"><AdminBadge value={event.active ? "Aktif" : "Nonaktif"} /><AdminBadge value={`${event.galleryCount} album`} /></div>
                <div><h2 className="font-manrope text-lg font-semibold text-brand-900">{event.label}</h2>{event.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p> : null}</div>
                <div className="flex flex-wrap gap-2">
                  <AdminLinkButton href={`/admin/content/events/${event.id}`} variant="secondary">Detail</AdminLinkButton>
                  <AdminLinkButton href={`/admin/content/galleries?eventId=${event.id}`} variant="secondary">Galeri</AdminLinkButton>
                  {canEdit ? <div className="flex rounded-md border border-border"><Button type="button" variant="ghost" size="icon" className="size-10 rounded-none rounded-l-md" onClick={() => reorder(index, "up")} disabled={index === 0 || pending} aria-label={`Naikkan ${event.label}`}><ArrowUp className="size-4" /></Button><Button type="button" variant="ghost" size="icon" className="size-10 rounded-none rounded-r-md" onClick={() => reorder(index, "down")} disabled={index === events.length - 1 || pending} aria-label={`Turunkan ${event.label}`}><ArrowDown className="size-4" /></Button></div> : null}
                  {canEdit ? <AdminButton variant="danger" onClick={() => setDeleteTarget(event)} disabled={pending || event.galleryCount > 0}><Trash2 className="size-4" /><span className="sr-only">Hapus {event.label}</span></AdminButton> : null}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus acara</AlertDialogTitle><AlertDialogDescription>Acara {deleteTarget?.label} akan dihapus. Acara dengan album tidak dapat dihapus.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel><AdminButton variant="danger" onClick={removeEvent} disabled={pending}>Hapus acara</AdminButton></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
