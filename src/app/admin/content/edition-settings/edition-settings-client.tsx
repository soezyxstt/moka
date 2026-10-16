"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleAlert,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import {
  AdminButton,
  AdminCard,
  AdminCardHeader,
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/primitives";
import { AdminMediaField, type MediaAssetSummary } from "@/components/admin/media-picker";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { EditionProgramRow } from "@/server/db/schema";
import {
  deleteEditionProgramAction,
  reorderEditionProgramsAction,
  saveEditionProgramAction,
  updateEditionSettingsAction,
} from "./actions";

export type EditionSettingsClientProps = {
  edition: {
    id: string;
    year: number;
    name: string;
    lifecycle: string;
    slogan: string | null;
    logoMediaId: string | null;
    version: number;
  };
  initialLogoAsset: MediaAssetSummary | null;
  initialPrograms: EditionProgramRow[];
  canManageContent?: boolean;
};

function StatusTag({ ready, label }: { ready: boolean; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-xs font-medium before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
        ready ? "text-brand-700 before:bg-brand" : "text-highlight-800 before:bg-highlight-500",
      )}
    >
      {label ?? (ready ? "Siap" : "Perlu dilengkapi")}
    </span>
  );
}

export function EditionSettingsClient({
  edition,
  initialLogoAsset,
  initialPrograms,
  canManageContent = true,
}: EditionSettingsClientProps) {
  const [isPending, startTransition] = useTransition();

  const [slogan, setSlogan] = useState(edition.slogan ?? "");
  const [editionName, setEditionName] = useState(edition.name);
  const [logoAsset, setLogoAsset] = useState<MediaAssetSummary | null>(initialLogoAsset);
  const [programs, setPrograms] = useState<EditionProgramRow[]>(initialPrograms);
  const [editingProgram, setEditingProgram] = useState<EditionProgramRow | null>(null);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState<EditionProgramRow | null>(null);
  const [programTitle, setProgramTitle] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [programActive, setProgramActive] = useState(true);

  const handleIdentitySubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageContent) return;

    const formData = new FormData();
    formData.set("editionId", edition.id);
    formData.set("name", editionName.trim());
    formData.set("logoMediaId", logoAsset?.id ?? "");
    formData.set("slogan", slogan.trim());
    formData.set("version", String(edition.version));

    const toastId = toast.loading("Menyimpan identitas edisi...");
    startTransition(async () => {
      try {
        await updateEditionSettingsAction(formData);
        toast.success("Identitas edisi disimpan", { id: toastId });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Identitas edisi gagal disimpan", { id: toastId });
      }
    });
  };

  const openAddProgramDialog = () => {
    setEditingProgram(null);
    setProgramTitle("");
    setProgramDescription("");
    setProgramActive(true);
    setIsProgramDialogOpen(true);
  };

  const openEditProgramDialog = (program: EditionProgramRow) => {
    setEditingProgram(program);
    setProgramTitle(program.title);
    setProgramDescription(program.description ?? "");
    setProgramActive(program.active);
    setIsProgramDialogOpen(true);
  };

  const handleSaveProgram = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageContent) return;

    const title = programTitle.trim();
    const description = programDescription.trim();
    if (!title) {
      toast.error("Judul program wajib diisi");
      return;
    }

    const formData = new FormData();
    if (editingProgram) {
      formData.set("id", editingProgram.id);
      formData.set("displayOrder", String(editingProgram.displayOrder));
    } else {
      formData.set("displayOrder", String(programs.length));
    }
    formData.set("title", title);
    formData.set("description", description);
    formData.set("active", programActive ? "true" : "false");

    const toastId = toast.loading(editingProgram ? "Memperbarui program..." : "Menambahkan program...");
    startTransition(async () => {
      try {
        await saveEditionProgramAction(formData);
        if (editingProgram) {
          setPrograms((current) => current.map((program) => (
            program.id === editingProgram.id
              ? { ...program, title, description: description || null, active: programActive }
              : program
          )));
        }
        setIsProgramDialogOpen(false);
        toast.success(editingProgram ? "Program diperbarui" : "Program ditambahkan", { id: toastId });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Program gagal disimpan", { id: toastId });
      }
    });
  };

  const handleDeleteProgram = () => {
    if (!deletingProgram || !canManageContent) return;

    const program = deletingProgram;
    const formData = new FormData();
    formData.set("id", program.id);

    const toastId = toast.loading("Menghapus program...");
    startTransition(async () => {
      try {
        await deleteEditionProgramAction(formData);
        setPrograms((current) => current.filter((item) => item.id !== program.id));
        setDeletingProgram(null);
        toast.success("Program dihapus", { id: toastId });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Program gagal dihapus", { id: toastId });
      }
    });
  };

  const handleMoveProgram = (index: number, direction: "up" | "down") => {
    if (!canManageContent) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= programs.length) return;

    const previous = programs;
    const reordered = [...programs];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);
    setPrograms(reordered);

    const idList = reordered.map((p) => p.id);

    const toastId = toast.loading("Memperbarui urutan program...");
    startTransition(async () => {
      try {
        await reorderEditionProgramsAction(idList);
        toast.success("Urutan program diperbarui", { id: toastId });
      } catch (err) {
        setPrograms(previous);
        toast.error(err instanceof Error ? err.message : "Urutan program gagal diperbarui", { id: toastId });
      }
    });
  };

  const isLogoSet = Boolean(logoAsset?.id);
  const isSloganSet = slogan.trim().length > 0;
  const activeProgramsCount = programs.filter((program) => program.active).length;
  const completionItems = [
    { label: "Logo edisi", ready: isLogoSet, detail: isLogoSet ? "Terpasang" : "Belum dipilih" },
    { label: "Slogan", ready: isSloganSet, detail: isSloganSet ? "Terisi" : "Belum diisi" },
    {
      label: "Program aktif",
      ready: activeProgramsCount > 0,
      detail: `${activeProgramsCount} aktif dari ${programs.length}`,
    },
  ];
  const completedItems = completionItems.filter((item) => item.ready).length;
  const isComplete = completedItems === completionItems.length;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <AdminCard padding="none" className="overflow-hidden">
          <div className="border-b border-border/70 px-5 py-4 sm:px-6">
            <AdminCardHeader title="Logo dan slogan" />
          </div>
          <form onSubmit={handleIdentitySubmit} className="space-y-5 p-5 sm:p-6">
              <AdminField label="Nama edisi"><AdminInput value={editionName} onChange={(event) => setEditionName(event.target.value)} maxLength={200} required disabled={!canManageContent || isPending} /></AdminField>
              <AdminMediaField
                name="logoMediaId"
                label="Logo resmi"
                aspectRatioHint="1:1"
                acceptType="image"
                initialAsset={logoAsset}
                onChange={setLogoAsset}
                canManageMedia={canManageContent}
                activeEditionId={edition.id}
              />

              <AdminField label="Slogan">
                <AdminInput
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Contoh: Nu Nyunda Tur Nyakola"
                  maxLength={160}
                  disabled={!canManageContent || isPending}
                />
              </AdminField>

              <div className="flex justify-end border-t border-border/70 pt-4">
                <AdminButton type="submit" disabled={!canManageContent || isPending}>
                  {isPending ? "Menyimpan..." : "Simpan perubahan"}
                </AdminButton>
              </div>
            </form>
        </AdminCard>

        <AdminCard padding="none" className="overflow-hidden">
          <div className="border-b border-border/70 px-5 py-4 sm:px-6">
            <AdminCardHeader title="Kelengkapan identitas" />
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Siap digunakan</p>
                <p className="mt-1 font-manrope text-3xl font-semibold tracking-[-0.04em] text-brand-900">
                  {completedItems}/{completionItems.length}
                </p>
              </div>
              <StatusTag ready={isComplete} />
            </div>

            <div className="space-y-2" aria-label="Daftar pemeriksaan identitas">
              {completionItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    {item.ready ? <CheckCircle2 className="size-4 shrink-0 text-brand" /> : <CircleAlert className="size-4 shrink-0 text-highlight-600" />}
                    <span className="truncate text-xs font-semibold text-foreground">{item.label}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.detail}</span>
                </div>
              ))}
            </div>

            <p className="border-l-2 border-highlight bg-highlight-50/50 px-3 py-2.5 text-xs leading-5 text-foreground">
              {isComplete
                ? "Identitas sudah lengkap untuk ditinjau."
                : "Lengkapi bagian yang belum siap sebelum ditinjau."}
            </p>
          </div>
        </AdminCard>
      </div>

      <AdminCard padding="none" className="overflow-hidden">
        <div className="border-b border-border/70 px-5 py-4 sm:px-6">
          <AdminCardHeader
            title="Program unggulan"
            action={
              canManageContent ? (
                <AdminButton type="button" onClick={openAddProgramDialog}>
                  <Plus className="size-4" />
                  Tambah program
                </AdminButton>
              ) : null
            }
          />
        </div>

        {programs.length === 0 ? (
          <div className="p-5 sm:p-6">
            <AdminEmptyState
              icon="award"
              title="Belum ada program"
            />
          </div>
        ) : (
          <ol className="divide-y divide-border/70" aria-label="Urutan program unggulan">
            {programs.map((program, index) => (
              <li key={program.id} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-brand-100 bg-brand-50 text-xs font-bold text-brand-800">
                    {index + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-manrope text-sm font-semibold text-brand-900">{program.title}</h3>
                      <StatusTag ready={program.active} label={program.active ? "Aktif" : "Tidak aktif"} />
                    </div>
                    {program.description ? <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{program.description}</p> : null}
                  </div>
                </div>

                {canManageContent ? (
                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === 0 || isPending}
                      onClick={() => handleMoveProgram(index, "up")}
                      aria-label={`Naikkan ${program.title}`}
                      title="Naikkan urutan"
                      className="size-8 text-muted-foreground"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={index === programs.length - 1 || isPending}
                      onClick={() => handleMoveProgram(index, "down")}
                      aria-label={`Turunkan ${program.title}`}
                      title="Turunkan urutan"
                      className="size-8 text-muted-foreground"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isPending}
                      onClick={() => openEditProgramDialog(program)}
                      aria-label={`Edit ${program.title}`}
                      title="Edit program"
                      className="size-8 border-brand-200 text-brand hover:bg-brand-50"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isPending}
                      onClick={() => setDeletingProgram(program)}
                      aria-label={`Hapus ${program.title}`}
                      title="Hapus program"
                      className="size-8 border-danger-200 text-destructive hover:bg-danger-50"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </AdminCard>

      <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-manrope text-lg font-semibold text-brand-900">
              {editingProgram ? "Edit program unggulan" : "Tambah program unggulan"}
            </DialogTitle>
            <DialogDescription className="text-xs">Isi judul, ringkasan, dan status program.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProgram} className="space-y-4 pt-2">
            <AdminField label="Judul program">
              <AdminInput
                value={programTitle}
                onChange={(e) => setProgramTitle(e.target.value)}
                placeholder="Contoh: Pasanggiri Mojang Jajaka"
                maxLength={160}
                required
                autoFocus
                disabled={isPending}
              />
            </AdminField>

            <AdminField label="Deskripsi singkat">
              <AdminTextarea
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                placeholder="Tuliskan ringkasan program"
                maxLength={500}
                rows={3}
                disabled={isPending}
              />
            </AdminField>

            <div className="flex items-start gap-2">
              <Checkbox
                id="programActiveCheckbox"
                checked={programActive}
                onCheckedChange={(checked) => setProgramActive(checked === true)}
                disabled={isPending}
              />
              <label htmlFor="programActiveCheckbox" className="text-xs font-medium leading-4 text-foreground">
                Tampilkan sebagai program aktif
              </label>
            </div>

            <DialogFooter className="border-t border-border/70 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProgramDialogOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending || !programTitle.trim()}
                className="bg-brand text-canvas hover:bg-brand-600"
              >
                {isPending ? "Menyimpan..." : "Simpan program"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingProgram)}
        onOpenChange={(open) => !open && setDeletingProgram(null)}
      >
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-manrope">
              Hapus program unggulan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Program &quot;{deletingProgram?.title}&quot; akan dihapus dari daftar edisi ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProgram} disabled={isPending} className="bg-destructive text-canvas hover:bg-destructive/90">
              Hapus program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
