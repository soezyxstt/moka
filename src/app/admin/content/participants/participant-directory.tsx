"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Settings2, Trash2, UserRoundCheck, UserRoundX } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { AdminBadge, AdminButton, AdminCard, AdminEmptyState, AdminInput, AdminLinkButton, AdminSelect, AdminTextarea } from "@/components/admin/primitives";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteParticipantAction, toggleParticipantActiveAction } from "./actions";

export type DirectoryParticipant = {
  id: string;
  categoryId: string;
  categoryCode: string;
  categoryLabel: string;
  number: number;
  name: string;
  currentStageId: string | null;
  currentStageName: string | null;
  selectionStatus: "registered" | "active" | "eliminated" | "completed";
  portraitUrl: string | null;
  portraitAlt: string | null;
  qrisMediaId: string | null;
  active: boolean;
  version: number;
  achievementsCount: number;
  socialLinksCount: number;
  mediaCount: number;
  titleCount: number;
  hasCloseup: boolean;
};

const statusLabels = { registered: "Terdaftar", active: "Aktif", eliminated: "Tidak lolos", completed: "Selesai" } as const;

export function ParticipantDirectory({
  categories,
  stages,
  initialParticipants,
  canEdit,
}: {
  categories: Array<{ id: string; code: string; label: string }>;
  stages: Array<{ id: string; name: string }>;
  initialParticipants: DirectoryParticipant[];
  canEdit: boolean;
}) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stageId, setStageId] = useState("");
  const [status, setStatus] = useState("");
  const [photoFilter, setPhotoFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [qrisFilter, setQrisFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DirectoryParticipant | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return participants.filter((participant) =>
      (!needle || participant.name.toLowerCase().includes(needle) || String(participant.number).includes(needle)) &&
      (!categoryId || participant.categoryId === categoryId) &&
      (!stageId || participant.currentStageId === stageId) &&
      (!status || participant.selectionStatus === status) &&
      (!photoFilter || (photoFilter === "ready" ? participant.hasCloseup : !participant.hasCloseup)) &&
      (!titleFilter || (titleFilter === "ready" ? participant.titleCount > 0 : participant.titleCount === 0)) &&
      (!qrisFilter || (qrisFilter === "ready" ? Boolean(participant.qrisMediaId) : !participant.qrisMediaId)),
    );
  }, [participants, search, categoryId, stageId, status, photoFilter, titleFilter, qrisFilter]);

  function toggleActive(participant: DirectoryParticipant) {
    startTransition(async () => {
      try {
        const result = await toggleParticipantActiveAction({ participantId: participant.id, expectedVersion: participant.version });
        setParticipants((items) => items.map((item) => item.id === participant.id ? { ...item, active: result.active, version: result.version } : item));
        toast.success(result.active ? "Peserta diaktifkan" : "Peserta dinonaktifkan");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Status gagal diubah");
      }
    });
  }

  function removeParticipant() {
    if (!deleteTarget) return;
    const toastId = toast.loading("Menghapus pendaftar...");
    startTransition(async () => {
      try {
        await deleteParticipantAction({ participantId: deleteTarget.id, expectedVersion: deleteTarget.version, reason: deleteReason.trim() || undefined });
        setParticipants((items) => items.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
        setDeleteReason("");
        toast.success("Pendaftar dihapus", { id: toastId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Pendaftar gagal dihapus", { id: toastId });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {canEdit ? <AdminLinkButton href="/admin/content/participants/new">Tambah pendaftar</AdminLinkButton> : null}
        <AdminLinkButton href="/admin/content/participants/stages" variant="secondary">Atur tahap</AdminLinkButton>
        <AdminLinkButton href="/admin/content/participants/titles" variant="secondary">Atur gelar</AdminLinkButton>
      </div>
      <AdminCard className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <AdminInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau nomor" className="pl-9" aria-label="Cari peserta" />
        </label>
        <AdminSelect value={categoryId} onValueChange={setCategoryId} aria-label="Filter kategori" options={[{ value: "", label: "Semua kategori" }, ...categories.map((category) => ({ value: category.id, label: category.code }))]} />
        <AdminSelect value={stageId} onValueChange={setStageId} aria-label="Filter tahap" options={[{ value: "", label: "Semua tahap" }, ...stages.map((stage) => ({ value: stage.id, label: stage.name }))]} />
        <AdminSelect value={status} onValueChange={setStatus} aria-label="Filter status" options={[{ value: "", label: "Semua status" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]} />
        <AdminSelect value={photoFilter} onValueChange={setPhotoFilter} aria-label="Filter foto" options={[{ value: "", label: "Semua foto" }, { value: "ready", label: "Foto siap" }, { value: "missing", label: "Foto belum ada" }]} />
        <AdminSelect value={titleFilter} onValueChange={setTitleFilter} aria-label="Filter gelar" options={[{ value: "", label: "Semua gelar" }, { value: "ready", label: "Sudah bergelar" }, { value: "missing", label: "Belum bergelar" }]} />
        <AdminSelect value={qrisFilter} onValueChange={setQrisFilter} aria-label="Filter QRIS" options={[{ value: "", label: "Semua QRIS" }, { value: "ready", label: "QRIS siap" }, { value: "missing", label: "QRIS belum ada" }]} />
      </AdminCard>

      <p className="text-sm text-muted-foreground">{filtered.length} dari {participants.length} peserta</p>
      {filtered.length === 0 ? (
        <AdminEmptyState icon="users" title="Tidak ada peserta" />
      ) : (
        <AdminCard padding="none" className="overflow-hidden">
          <div className="divide-y divide-brand-100">
            {filtered.map((participant) => {
              const completeness = [participant.hasCloseup, participant.achievementsCount > 0, participant.socialLinksCount > 0, Boolean(participant.qrisMediaId), participant.titleCount > 0].filter(Boolean).length;
              return (
                <article key={participant.id} className="grid gap-4 p-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center sm:p-5">
                  <div className="relative size-16 overflow-hidden rounded-lg bg-brand-50">
                    {participant.portraitUrl ? <Image src={participant.portraitUrl} alt={participant.portraitAlt || participant.name} fill sizes="64px" className="object-cover" /> : <div className="grid h-full place-items-center font-manrope text-sm font-semibold text-brand">{participant.categoryCode}</div>}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/content/participants/${participant.id}`}
                      className="font-manrope font-semibold text-brand-900 hover:text-brand"
                    >
                      {participant.number}. {participant.name}
                    </Link>
                      <AdminBadge value={participant.categoryCode} />
                      <AdminBadge value={statusLabels[participant.selectionStatus]} className={participant.selectionStatus === "eliminated" ? "border-danger-200 bg-danger-50 text-danger-700" : undefined} />
                      {!participant.active ? <AdminBadge value="Nonaktif" /> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{participant.currentStageName ?? "Tahap belum terhubung"} · Profil {completeness}/5 · {participant.titleCount} gelar</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <AdminLinkButton href={`/admin/content/participants/${participant.id}`} variant="secondary">
                      <Settings2 className="size-4" />
                      Detail
                    </AdminLinkButton>
                    {canEdit ? <AdminButton variant="secondary" onClick={() => toggleActive(participant)} disabled={pending}>{participant.active ? <UserRoundX className="size-4" /> : <UserRoundCheck className="size-4" />}<span className="sr-only">Ubah status {participant.name}</span></AdminButton> : null}
                    {canEdit ? <AdminButton variant="danger" onClick={() => setDeleteTarget(participant)} disabled={pending}><Trash2 className="size-4" /><span className="sr-only">Hapus {participant.name}</span></AdminButton> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </AdminCard>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Hapus pendaftar</AlertDialogTitle><AlertDialogDescription>Hanya pendaftar yang belum diproses dapat dihapus.</AlertDialogDescription></AlertDialogHeader>
          <AdminTextarea value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Alasan, opsional" aria-label="Alasan menghapus pendaftar" />
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AdminButton variant="danger" onClick={removeParticipant} disabled={pending}>Hapus</AdminButton></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
