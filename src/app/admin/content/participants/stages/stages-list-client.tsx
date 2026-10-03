"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminLinkButton,
  AdminTextarea,
} from "@/components/admin/primitives";
import {
  AlertDialog,
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
import {
  closeSelectionStageAction,
  createSelectionStageAction,
  deleteSelectionStageAction,
  openSelectionStageAction,
  reopenSelectionStageAction,
  reorderSelectionStagesAction,
  updateSelectionStageAction,
} from "../selection-actions";
import { categoryValues, type Category, type StageCategoryTargets } from "@/server/db/schema";

type CategoryTargetInputs = Record<Category, string>;

const EMPTY_TARGET_INPUTS: CategoryTargetInputs = { JD: "", MD: "", JR: "", MR: "" };
const DEFAULT_TARGET_INPUTS: CategoryTargetInputs = { JD: "5", MD: "5", JR: "5", MR: "5" };

function CategoryTargetFields({
  value,
  onChange,
  minimum = { JD: 0, MD: 0, JR: 0, MR: 0 },
}: {
  value: CategoryTargetInputs;
  onChange: (value: CategoryTargetInputs) => void;
  minimum?: StageCategoryTargets;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {categoryValues.map((code) => (
        <AdminField key={code} label={`Target ${code}`}>
          <AdminInput
            type="number"
            min={minimum[code]}
            step="1"
            value={value[code]}
            placeholder={String(minimum[code])}
            onChange={(event) => onChange({ ...value, [code]: event.target.value })}
            required
          />
        </AdminField>
      ))}
    </div>
  );
}

function readCategoryTargets(value: CategoryTargetInputs): StageCategoryTargets {
  const targets = {} as StageCategoryTargets;
  for (const code of categoryValues) {
    if (!/^\d+$/.test(value[code])) throw new Error(`Target ${code} harus berupa bilangan bulat nol atau lebih`);
    const parsed = Number(value[code]);
    if (!Number.isSafeInteger(parsed)) throw new Error(`Target ${code} tidak valid`);
    targets[code] = parsed;
  }
  if (categoryValues.every((code) => targets[code] === 0)) throw new Error("Jumlah target tahap minimal satu peserta");
  return targets;
}

function totalTargetInput(value: CategoryTargetInputs) {
  return categoryValues.reduce((total, code) => total + (/^\d+$/.test(value[code]) ? Number(value[code]) : 0), 0);
}

function setCategoryTargets(formData: FormData, targets: StageCategoryTargets) {
  for (const code of categoryValues) formData.set(`target${code}`, String(targets[code]));
}

function getQuotaDifference(advancedCount: number, advancedByCategory: StageCategoryTargets, target: StageListItem) {
  if (!target.categoryTargets) {
    return {
      over: advancedCount > target.targetParticipantCount,
      under: advancedCount < target.targetParticipantCount,
      overText: `Jumlah peserta lolos (${advancedCount}) melebihi target total (${target.targetParticipantCount})`,
      underText: `Jumlah peserta lolos (${advancedCount}) kurang dari target total (${target.targetParticipantCount})`,
    };
  }
  const over = categoryValues.filter((code) => advancedByCategory[code] > target.categoryTargets![code]);
  const under = categoryValues.filter((code) => advancedByCategory[code] < target.categoryTargets![code]);
  return {
    over: over.length > 0,
    under: under.length > 0,
    overText: over.map((code) => `${code} ${advancedByCategory[code]}/${target.categoryTargets![code]}`).join(", "),
    underText: under.map((code) => `${code} ${advancedByCategory[code]}/${target.categoryTargets![code]}`).join(", "),
  };
}

export type StageListItem = {
  id: string;
  editionId: string;
  name: string;
  slug: string;
  displayOrder: number;
  targetParticipantCount: number;
  categoryTargets: StageCategoryTargets | null;
  lifecycle: string;
  finalStage: boolean;
  version: number;
  stats: {
    total: number;
    pending: number;
    advanced: number;
    eliminated: number;
    advancedByCategory: StageCategoryTargets;
    totalByCategory: StageCategoryTargets;
  };
  hasEntries: boolean;
};

export function StagesListClient({
  initialStages,
  canEdit,
}: {
  initialStages: StageListItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [pending, startTransition] = useTransition();

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTargets, setCreateTargets] = useState<CategoryTargetInputs>(DEFAULT_TARGET_INPUTS);
  const [createFinal, setCreateFinal] = useState(false);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<StageListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editTargets, setEditTargets] = useState<CategoryTargetInputs>(EMPTY_TARGET_INPUTS);
  const [editFinal, setEditFinal] = useState(false);

  // Lifecycle modal states
  const [openTarget, setOpenTarget] = useState<StageListItem | null>(null);
  const [closeTarget, setCloseTarget] = useState<StageListItem | null>(null);
  const [closeAllowUnderTarget, setCloseAllowUnderTarget] = useState(false);
  const [closeReason, setCloseReason] = useState("");

  const [reopenTarget, setReopenTarget] = useState<StageListItem | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<StageListItem | null>(null);

  const hasAnyEntries = stages.some((s) => s.hasEntries);

  function resetCreateForm() {
    setCreateName("");
    setCreateTargets(DEFAULT_TARGET_INPUTS);
    setCreateFinal(false);
    setCreateOpen(false);
  }

  function handleCreateStage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = createName.trim();
    if (!name) {
      toast.error("Nama tahap wajib diisi");
      return;
    }
    let categoryTargets: StageCategoryTargets;
    try {
      categoryTargets = readCategoryTargets(createTargets);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Target kategori tidak valid");
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    setCategoryTargets(formData, categoryTargets);
    if (createFinal) formData.set("finalStage", "true");

    startTransition(async () => {
      try {
        await createSelectionStageAction(formData);
        toast.success("Tahap seleksi berhasil dibuat");
        resetCreateForm();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuat tahap");
      }
    });
  }

  function startEdit(stage: StageListItem) {
    setEditTarget(stage);
    setEditName(stage.name);
    setEditTargets(stage.categoryTargets
      ? Object.fromEntries(categoryValues.map((code) => [code, String(stage.categoryTargets![code])])) as CategoryTargetInputs
      : EMPTY_TARGET_INPUTS);
    setEditFinal(stage.finalStage);
  }

  function handleUpdateStage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget) return;

    const name = editName.trim();
    if (!name) {
      toast.error("Nama tahap wajib diisi");
      return;
    }
    let categoryTargets: StageCategoryTargets;
    try {
      categoryTargets = readCategoryTargets(editTargets);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Target kategori tidak valid");
      return;
    }
    const underfilled = categoryValues.filter((code) => categoryTargets[code] < editTarget.stats.totalByCategory[code]);
    if (underfilled.length) {
      toast.error(`Target ${underfilled.join(", ")} tidak boleh kurang dari peserta yang sudah masuk`);
      return;
    }

    const formData = new FormData();
    formData.set("stageId", editTarget.id);
    formData.set("expectedVersion", String(editTarget.version));
    formData.set("name", name);
    setCategoryTargets(formData, categoryTargets);
    if (editFinal) formData.set("finalStage", "true");

    startTransition(async () => {
      try {
        await updateSelectionStageAction(formData);
        toast.success("Tahap seleksi berhasil diperbarui");
        setEditTarget(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal memperbarui tahap");
      }
    });
  }

  function handleReorder(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const reordered = [...stages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const items = reordered.map((stage) => ({
      id: stage.id,
      expectedVersion: stage.version,
    }));

    startTransition(async () => {
      try {
        await reorderSelectionStagesAction(items);
        setStages(reordered);
        toast.success("Urutan tahap berhasil disimpan");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mengubah urutan");
      }
    });
  }

  function handleOpenStage() {
    if (!openTarget) return;
    const formData = new FormData();
    formData.set("stageId", openTarget.id);
    formData.set("expectedVersion", String(openTarget.version));

    startTransition(async () => {
      try {
        await openSelectionStageAction(formData);
        toast.success("Tahap seleksi berhasil dibuka");
        setOpenTarget(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuka tahap");
      }
    });
  }

  function handleCloseStage() {
    if (!closeTarget) return;

    const nextStage = stages.find((s) => s.displayOrder > closeTarget.displayOrder);
    const difference = nextStage
      ? getQuotaDifference(closeTarget.stats.advanced, closeTarget.stats.advancedByCategory, nextStage)
      : null;
    if (difference?.over) {
      toast.error(`Peserta lolos melebihi target tahap berikutnya: ${difference.overText}`);
      return;
    }
    if (difference?.under) {
      if (!closeAllowUnderTarget || closeReason.trim().length < 5) {
        toast.error("Konfirmasi dan alasan minimal 5 karakter diperlukan");
        return;
      }
    }

    const formData = new FormData();
    formData.set("stageId", closeTarget.id);
    formData.set("expectedVersion", String(closeTarget.version));
    if (closeAllowUnderTarget) formData.set("allowUnderTarget", "true");
    if (closeReason.trim()) formData.set("reason", closeReason.trim());

    startTransition(async () => {
      try {
        await closeSelectionStageAction(formData);
        toast.success("Tahap seleksi berhasil ditutup");
        setCloseTarget(null);
        setCloseAllowUnderTarget(false);
        setCloseReason("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menutup tahap");
      }
    });
  }

  function handleReopenStage() {
    if (!reopenTarget) return;
    if (reopenReason.trim().length < 5) {
      toast.error("Alasan buka kembali minimal 5 karakter");
      return;
    }

    const formData = new FormData();
    formData.set("stageId", reopenTarget.id);
    formData.set("expectedVersion", String(reopenTarget.version));
    formData.set("reason", reopenReason.trim());

    startTransition(async () => {
      try {
        await reopenSelectionStageAction(formData);
        toast.success("Tahap seleksi berhasil dibuka kembali");
        setReopenTarget(null);
        setReopenReason("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuka kembali tahap");
      }
    });
  }

  function handleDeleteStage() {
    if (!deleteTarget) return;
    const formData = new FormData();
    formData.set("stageId", deleteTarget.id);
    formData.set("expectedVersion", String(deleteTarget.version));

    startTransition(async () => {
      try {
        await deleteSelectionStageAction(formData);
        toast.success("Tahap seleksi berhasil dihapus");
        setDeleteTarget(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menghapus tahap");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-dgb-900">
            {stages.length} tahap terdaftar
          </p>
          <p className="text-xs text-muted-foreground">
            Alur linear seleksi dari tahap pertama hingga tahap akhir.
          </p>
        </div>
        {canEdit ? (
          <AdminButton onClick={() => setCreateOpen(true)} disabled={pending}>
            <Plus className="size-4" />
            Tambah tahap
          </AdminButton>
        ) : null}
      </div>

      {hasAnyEntries ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-800">
          <Lock className="size-4 shrink-0 text-amber-700" />
          <span>
            Urutan tahap terkunci karena sudah ada peserta yang masuk dalam alur seleksi.
          </span>
        </div>
      ) : null}

      {stages.length === 0 ? (
        <AdminCard padding="none">
          <AdminEmptyState
            icon="settings"
            title="Belum ada tahap seleksi"
            description="Tambahkan tahap seleksi pertama untuk memulai alur penerimaan peserta."
          />
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const nextStage = stages.find((s) => s.displayOrder > stage.displayOrder);
            const isFirst = index === 0;
            const isLast = index === stages.length - 1;

            return (
              <AdminCard key={stage.id} className="relative overflow-hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-md border border-dgb-200 bg-dgb-50 font-montserrat text-sm font-bold text-dgb">
                      {index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-montserrat text-base font-semibold text-dgb-900">
                          {stage.name}
                        </h2>
                        <AdminBadge
                          value={stage.lifecycle}
                          className={
                            stage.lifecycle === "active"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : stage.lifecycle === "closed"
                              ? "border-border bg-muted text-muted-foreground"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                          }
                        />
                        {stage.finalStage ? (
                          <AdminBadge
                            value="Tahap final"
                            className="border-fb-200 bg-fb-50 text-fb-700"
                          />
                        ) : null}
                        {stage.hasEntries ? (
                          <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <Lock className="size-3" />
                            Terkunci
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {stage.categoryTargets
                          ? `Target kategori: ${categoryValues.map((code) => `${code} ${stage.categoryTargets![code]}`).join(", ")} (total ${stage.targetParticipantCount})`
                          : `Target total: ${stage.targetParticipantCount} peserta; target kategori belum diatur`}
                        {nextStage
                          ? `; ${nextStage.name}: ${nextStage.categoryTargets
                            ? categoryValues.map((code) => `${code} ${nextStage.categoryTargets![code]}`).join(", ")
                            : `${nextStage.targetParticipantCount} total`}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <AdminLinkButton
                      href={`/admin/content/participants/stages/${stage.id}`}
                      variant="primary"
                    >
                      <ExternalLink className="size-4" />
                      Workspace keputusan
                    </AdminLinkButton>

                    {canEdit ? (
                      <>
                        <div className="flex items-center rounded-md border border-dgb-100">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReorder(index, "up")}
                            disabled={isFirst || hasAnyEntries || pending}
                            className="size-9 rounded-none rounded-l-md hover:bg-dgb-50"
                            aria-label={`Pindahkan tahap ${stage.name} ke atas`}
                          >
                            <ArrowUp className="size-4 text-dgb-700" />
                          </Button>
                          <div className="h-4 w-px bg-dgb-100" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReorder(index, "down")}
                            disabled={isLast || hasAnyEntries || pending}
                            className="size-9 rounded-none rounded-r-md hover:bg-dgb-50"
                            aria-label={`Pindahkan tahap ${stage.name} ke bawah`}
                          >
                            <ArrowDown className="size-4 text-dgb-700" />
                          </Button>
                        </div>

                        {stage.lifecycle === "draft" ? (
                          <AdminButton
                            variant="secondary"
                            onClick={() => setOpenTarget(stage)}
                            disabled={pending}
                          >
                            <CheckCircle2 className="size-4" />
                            Buka
                          </AdminButton>
                        ) : null}

                        {stage.lifecycle === "active" ? (
                          <AdminButton
                            variant="secondary"
                            onClick={() => {
                              setCloseTarget(stage);
                              setCloseAllowUnderTarget(false);
                              setCloseReason("");
                            }}
                            disabled={pending}
                          >
                            <XCircle className="size-4" />
                            Tutup
                          </AdminButton>
                        ) : null}

                        {stage.lifecycle === "closed" && !stage.finalStage ? (
                          <AdminButton
                            variant="secondary"
                            onClick={() => {
                              setReopenTarget(stage);
                              setReopenReason("");
                            }}
                            disabled={pending}
                          >
                            <RotateCcw className="size-4" />
                            Buka kembali
                          </AdminButton>
                        ) : null}

                        <AdminButton
                          variant="secondary"
                          onClick={() => startEdit(stage)}
                          disabled={pending}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit {stage.name}</span>
                        </AdminButton>

                        {!stage.hasEntries ? (
                          <AdminButton
                            variant="danger"
                            onClick={() => setDeleteTarget(stage)}
                            disabled={pending}
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Hapus {stage.name}</span>
                          </AdminButton>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dgb-100 pt-3 sm:grid-cols-4">
                  <div className="rounded-md border border-dgb-100 bg-dgb-50/40 p-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Total peserta</p>
                    <p className="font-montserrat text-lg font-semibold text-dgb-900">
                      {stage.stats.total}
                    </p>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-amber-50/40 p-2.5">
                    <p className="text-[11px] font-medium text-amber-700">Pending</p>
                    <p className="font-montserrat text-lg font-semibold text-amber-900">
                      {stage.stats.pending}
                    </p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-2.5">
                    <p className="text-[11px] font-medium text-emerald-700">Lolos</p>
                    <p className="font-montserrat text-lg font-semibold text-emerald-900">
                      {stage.stats.advanced}
                    </p>
                  </div>
                  <div className="rounded-md border border-red-200 bg-red-50/40 p-2.5">
                    <p className="text-[11px] font-medium text-red-700">Tidak lolos</p>
                    <p className="font-montserrat text-lg font-semibold text-red-900">
                      {stage.stats.eliminated}
                    </p>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {/* Dialog Tambah Tahap */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah tahap seleksi</DialogTitle>
            <DialogDescription>
              Tahap baru akan ditambahkan di akhir alur linear seleksi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStage} className="space-y-4">
            <AdminField label="Nama tahap" hint="Contoh: Seleksi Berkas, Semifinal, Final">
              <AdminInput
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Nama tahap"
                required
              />
            </AdminField>

            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-foreground">Target per kategori</p>
                <p className="text-xs leading-5 text-muted-foreground">Jumlah peserta yang dapat masuk ke tahap ini.</p>
              </div>
              <CategoryTargetFields value={createTargets} onChange={setCreateTargets} />
              <p className="pt-1 text-xs text-muted-foreground">Total target: {totalTargetInput(createTargets)} peserta</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <Checkbox
                checked={createFinal}
                onCheckedChange={(c) => setCreateFinal(Boolean(c))}
              />
              <span className="text-xs font-semibold text-foreground">
                Tandai sebagai tahap final edisi ini
              </span>
            </label>

            <DialogFooter className="pt-3">
              <AdminButton
                type="button"
                variant="secondary"
                onClick={resetCreateForm}
                disabled={pending}
              >
                Batal
              </AdminButton>
              <AdminButton type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Buat tahap"}
              </AdminButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Tahap */}
      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah tahap seleksi</DialogTitle>
            <DialogDescription>
              Perbarui nama, target peserta, atau status tahap final.
            </DialogDescription>
          </DialogHeader>

          {editTarget ? (
            <form onSubmit={handleUpdateStage} className="space-y-4">
              <AdminField label="Nama tahap">
                <AdminInput
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama tahap"
                  required
                />
              </AdminField>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Target per kategori</p>
                {editTarget.categoryTargets === null ? (
                  <p className="mb-2 text-xs text-muted-foreground">Tahap ini memakai target total lama. Isi target untuk setiap kategori.</p>
                ) : null}
                <CategoryTargetFields
                  value={editTargets}
                  onChange={setEditTargets}
                  minimum={editTarget.stats.totalByCategory}
                />
                <p className="pt-1 text-xs text-muted-foreground">
                  Total target: {totalTargetInput(editTargets)} peserta
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <Checkbox
                  checked={editFinal}
                  onCheckedChange={(c) => setEditFinal(Boolean(c))}
                />
                <span className="text-xs font-semibold text-foreground">
                  Tandai sebagai tahap final edisi ini
                </span>
              </label>

              <DialogFooter className="pt-3">
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => setEditTarget(null)}
                  disabled={pending}
                >
                  Batal
                </AdminButton>
                <AdminButton type="submit" disabled={pending}>
                  {pending ? "Menyimpan..." : "Simpan perubahan"}
                </AdminButton>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* AlertDialog Buka Tahap */}
      <AlertDialog
        open={Boolean(openTarget)}
        onOpenChange={(open) => {
          if (!open) setOpenTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buka tahap seleksi</AlertDialogTitle>
            <AlertDialogDescription>
              Buka tahap &quot;{openTarget?.name}&quot; menjadi aktif? Keputusan peserta dapat mulai
              ditetapkan setelah tahap dibuka.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AdminButton onClick={handleOpenStage} disabled={pending}>
              {pending ? "Membuka..." : "Buka tahap"}
            </AdminButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Tutup Tahap */}
      <AlertDialog
        open={Boolean(closeTarget)}
        onOpenChange={(open) => {
          if (!open) setCloseTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup tahap seleksi</AlertDialogTitle>
            <AlertDialogDescription>
              {closeTarget?.finalStage
                ? `Menutup tahap ${closeTarget.name} akan menyelesaikan proses seleksi.`
                : `Menutup tahap ${closeTarget?.name ?? "ini"} akan memajukan peserta yang lolos.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {closeTarget ? (
            <div className="space-y-3 py-2">
              {closeTarget.stats.pending > 0 ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  Masih ada {closeTarget.stats.pending} peserta dengan keputusan pending. Selesaikan
                  seluruh keputusan sebelum menutup tahap.
                </p>
              ) : null}

              {(() => {
                const next = stages.find((s) => s.displayOrder > closeTarget.displayOrder);
                if (!next) return null;
                const difference = getQuotaDifference(closeTarget.stats.advanced, closeTarget.stats.advancedByCategory, next);

                if (difference.over) {
                  return (
                    <p className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                      Peserta lolos melebihi target tahap berikutnya: {difference.overText}. Kurangi jumlah peserta lolos.
                    </p>
                  );
                }

                if (difference.under) {
                  return (
                    <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50/70 p-3">
                      <p className="text-xs text-amber-800">
                        Peserta lolos belum memenuhi target tahap berikutnya: {difference.underText}. Konfirmasi dan alasan diperlukan.
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={closeAllowUnderTarget}
                          onCheckedChange={(c) => setCloseAllowUnderTarget(Boolean(c))}
                        />
                        <span className="text-xs font-semibold text-amber-900">
                          Konfirmasi tutup tahap di bawah target
                        </span>
                      </label>
                      <AdminTextarea
                        value={closeReason}
                        onChange={(e) => setCloseReason(e.target.value)}
                        placeholder="Alasan penutupan di bawah target (minimal 5 karakter)..."
                        rows={2}
                      />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AdminButton
              onClick={handleCloseStage}
              disabled={
                pending ||
                (closeTarget?.stats.pending ?? 0) > 0 ||
                (() => {
                  if (!closeTarget) return true;
                  const next = stages.find((s) => s.displayOrder > closeTarget.displayOrder);
                  const difference = next
                    ? getQuotaDifference(closeTarget.stats.advanced, closeTarget.stats.advancedByCategory, next)
                    : null;
                  if (difference?.over) return true;
                  if (difference?.under) {
                    return !closeAllowUnderTarget || closeReason.trim().length < 5;
                  }
                  return false;
                })()
              }
            >
              {pending ? "Menutup..." : "Tutup tahap"}
            </AdminButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Buka Kembali Tahap */}
      <AlertDialog
        open={Boolean(reopenTarget)}
        onOpenChange={(open) => {
          if (!open) setReopenTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buka kembali tahap seleksi</AlertDialogTitle>
            <AlertDialogDescription>
              Membuka kembali tahap &quot;{reopenTarget?.name}&quot; akan mengembalikan peserta dari
              tahap berikutnya selama belum ada keputusan lanjutan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <AdminField label="Alasan buka kembali (minimal 5 karakter)">
              <AdminTextarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Tuliskan alasan membuka kembali tahap..."
                rows={3}
              />
            </AdminField>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AdminButton
              onClick={handleReopenStage}
              disabled={pending || reopenReason.trim().length < 5}
            >
              {pending ? "Memproses..." : "Buka kembali"}
            </AdminButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Hapus Tahap */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus tahap seleksi</AlertDialogTitle>
            <AlertDialogDescription>
              Tahap &quot;{deleteTarget?.name}&quot; akan dihapus secara permanen. Tindakan ini hanya
              dapat dilakukan jika tahap belum memiliki peserta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AdminButton
              variant="danger"
              onClick={handleDeleteStage}
              disabled={pending}
            >
              {pending ? "Menghapus..." : "Hapus tahap"}
            </AdminButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
