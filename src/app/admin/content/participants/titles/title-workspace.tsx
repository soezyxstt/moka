"use client";

import { ArrowDown, ArrowUp, Award, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { adminNativeScrollbarClassName } from "@/components/admin/admin-scroll-area";
import { AdminBadge, AdminButton, AdminCard, AdminEmptyState, AdminField, AdminInput, AdminTextarea } from "@/components/admin/primitives";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  assignEditionTitleAction,
  createEditionTitleAction,
  deleteEditionTitleAction,
  reorderEditionTitlesAction,
  setEditionTitleActiveAction,
  unassignEditionTitleAction,
  updateEditionTitleAction,
} from "../title-actions";

export type FinalistItem = { id: string; number: number; name: string; categoryCode: string };
export type TitleItem = {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  displayOrder: number;
  active: boolean;
  version: number;
  participantIds: string[];
};

export function TitleWorkspace({ finalStage, finalists, initialTitles, finalistsWithoutTitle, canEdit }: {
  finalStage: { id: string; name: string } | null;
  finalists: FinalistItem[];
  initialTitles: TitleItem[];
  finalistsWithoutTitle: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [titles, setTitles] = useState(initialTitles);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TitleItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [deleteTarget, setDeleteTarget] = useState<TitleItem | null>(null);

  function openCreate() {
    setEditTarget(null);
    setName("");
    setDescription("");
    setCapacity("1");
    setSheetOpen(true);
  }

  function openEdit(title: TitleItem) {
    setEditTarget(title);
    setName(title.name);
    setDescription(title.description ?? "");
    setCapacity(String(title.capacity));
    setSheetOpen(true);
  }

  function submitTitle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedCapacity = Number(capacity);
    if (!name.trim()) return toast.error("Nama gelar wajib diisi");
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) return toast.error("Jumlah slot tidak valid");
    if (editTarget && parsedCapacity < editTarget.participantIds.length) return toast.error("Jumlah slot kurang dari gelar yang sudah terisi");
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("description", description.trim());
    formData.set("capacity", String(parsedCapacity));
    if (editTarget) {
      formData.set("titleId", editTarget.id);
      formData.set("expectedVersion", String(editTarget.version));
    }
    startTransition(async () => {
      try {
        if (editTarget) await updateEditionTitleAction(formData);
        else await createEditionTitleAction(formData);
        toast.success(editTarget ? "Gelar diperbarui" : "Gelar dibuat");
        setSheetOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gelar gagal disimpan");
      }
    });
  }

  function reorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= titles.length) return;
    const reordered = [...titles];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    startTransition(async () => {
      try {
        await reorderEditionTitlesAction(reordered.map((title) => ({ id: title.id, expectedVersion: title.version })));
        setTitles(reordered.map((title, displayOrder) => ({ ...title, displayOrder, version: title.version + 1 })));
        toast.success("Urutan gelar disimpan");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Urutan gagal disimpan");
      }
    });
  }

  function toggleActive(title: TitleItem) {
    const formData = new FormData();
    formData.set("titleId", title.id);
    formData.set("expectedVersion", String(title.version));
    formData.set("active", String(!title.active));
    startTransition(async () => {
      try {
        const result = await setEditionTitleActiveAction(formData);
        setTitles((items) => items.map((item) => item.id === title.id ? { ...item, active: !item.active, version: result.version } : item));
        toast.success(title.active ? "Gelar dinonaktifkan" : "Gelar diaktifkan");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Status gelar gagal diubah");
      }
    });
  }

  function toggleAssignment(title: TitleItem, participantId: string, checked: boolean) {
    const formData = new FormData();
    formData.set("titleId", title.id);
    formData.set("participantId", participantId);
    formData.set("expectedTitleVersion", String(title.version));
    startTransition(async () => {
      try {
        const result = checked ? await assignEditionTitleAction(formData) : await unassignEditionTitleAction(formData);
        setTitles((items) => items.map((item) => item.id === title.id ? {
          ...item,
          version: result.version,
          participantIds: checked ? [...item.participantIds, participantId] : item.participantIds.filter((id) => id !== participantId),
        } : item));
        toast.success(checked ? "Gelar diberikan" : "Gelar dilepas");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Penyematan gelar gagal");
      }
    });
  }

  function removeTitle() {
    if (!deleteTarget) return;
    const formData = new FormData();
    formData.set("titleId", deleteTarget.id);
    formData.set("expectedVersion", String(deleteTarget.version));
    startTransition(async () => {
      try {
        await deleteEditionTitleAction(formData);
        setTitles((items) => items.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast.success("Gelar dihapus");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gelar gagal dihapus");
      }
    });
  }

  if (!finalStage) {
    return <AdminCard padding="none"><AdminEmptyState icon="award" title="Tahap final belum ditetapkan" description="Tandai satu tahap sebagai final sebelum mengelola gelar." /></AdminCard>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminCard><p className="text-xs text-muted-foreground">Tahap final</p><p className="mt-1 font-manrope text-lg font-semibold text-brand-900">{finalStage.name}</p></AdminCard>
        <AdminCard><p className="text-xs text-muted-foreground">Peserta final</p><p className="mt-1 font-manrope text-2xl font-semibold text-brand-900">{finalists.length}</p></AdminCard>
        <AdminCard><p className="text-xs text-muted-foreground">Belum menerima gelar</p><p className="mt-1 font-manrope text-2xl font-semibold text-highlight-700">{finalistsWithoutTitle}</p></AdminCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{titles.length} gelar</p>
        {canEdit ? <AdminButton onClick={openCreate} disabled={pending}><Plus className="size-4" />Tambah gelar</AdminButton> : null}
      </div>

      {titles.length === 0 ? (
        <AdminCard padding="none"><AdminEmptyState icon="award" title="Belum ada gelar" description="Tambahkan gelar untuk peserta tahap final." /></AdminCard>
      ) : (
        <div className="space-y-4">
          {titles.map((title, index) => {
            const full = title.participantIds.length >= title.capacity;
            return (
              <AdminCard key={title.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-md bg-brand-50 text-brand"><Award className="size-4" /></span>
                      <h2 className="font-manrope text-lg font-semibold text-brand-900">{title.name}</h2>
                      <AdminBadge value={title.active ? "Aktif" : "Nonaktif"} />
                      <AdminBadge value={`${title.participantIds.length}/${title.capacity} terisi`} />
                    </div>
                    {title.description ? <p className="text-sm text-muted-foreground">{title.description}</p> : null}
                  </div>
                  {canEdit ? (
                    <div className="flex flex-wrap gap-2">
                      <div className="flex rounded-md border border-border">
                        <Button type="button" variant="ghost" size="icon" onClick={() => reorder(index, "up")} disabled={index === 0 || pending} className="size-9 rounded-none rounded-l-md" aria-label={`Naikkan ${title.name}`}><ArrowUp className="size-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => reorder(index, "down")} disabled={index === titles.length - 1 || pending} className="size-9 rounded-none rounded-r-md" aria-label={`Turunkan ${title.name}`}><ArrowDown className="size-4" /></Button>
                      </div>
                      <AdminButton variant="secondary" onClick={() => toggleActive(title)} disabled={pending}><Power className="size-4" /><span className="sr-only">Ubah status {title.name}</span></AdminButton>
                      <AdminButton variant="secondary" onClick={() => openEdit(title)} disabled={pending}><Pencil className="size-4" /><span className="sr-only">Edit {title.name}</span></AdminButton>
                      <AdminButton variant="danger" onClick={() => setDeleteTarget(title)} disabled={pending || title.participantIds.length > 0}><Trash2 className="size-4" /><span className="sr-only">Hapus {title.name}</span></AdminButton>
                    </div>
                  ) : null}
                </div>

                <div className={`mt-4 max-h-72 space-y-1 overflow-y-auto border-t border-border pt-3 ${adminNativeScrollbarClassName}`}>
                  {finalists.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Belum ada peserta pada tahap final.</p> : finalists.map((participant) => {
                    const checked = title.participantIds.includes(participant.id);
                    return (
                      <label key={participant.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-brand-50/60">
                        <Checkbox checked={checked} onCheckedChange={(value) => toggleAssignment(title, participant.id, Boolean(value))} disabled={!canEdit || pending || (!checked && (!title.active || full))} />
                        <span className="min-w-0 flex-1 text-sm text-foreground">{participant.number}. {participant.name}</span>
                        <span className="text-xs font-semibold text-brand-700">{participant.categoryCode}</span>
                      </label>
                    );
                  })}
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{editTarget ? "Edit gelar" : "Tambah gelar"}</SheetTitle><SheetDescription>Nama dan jumlah slot gelar.</SheetDescription></SheetHeader>
          <form onSubmit={submitTitle} className="space-y-5 px-4 pb-6">
            <AdminField label="Nama gelar"><AdminInput value={name} onChange={(event) => setName(event.target.value)} required /></AdminField>
            <AdminField label="Deskripsi (opsional)"><AdminTextarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></AdminField>
            <AdminField label="Jumlah slot"><AdminInput type="number" min="1" step="1" value={capacity} onChange={(event) => setCapacity(event.target.value)} required /></AdminField>
            <SheetFooter><AdminButton type="button" variant="secondary" onClick={() => setSheetOpen(false)} disabled={pending}>Batal</AdminButton><AdminButton type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan gelar"}</AdminButton></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus gelar</AlertDialogTitle><AlertDialogDescription>Gelar {deleteTarget?.name} akan dihapus.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel><AdminButton variant="danger" onClick={removeTitle} disabled={pending}>Hapus gelar</AdminButton></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
