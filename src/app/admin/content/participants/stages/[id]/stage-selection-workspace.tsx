"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Search,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { adminNativeScrollbarClassName } from "@/components/admin/admin-scroll-area";
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminLinkButton,
  AdminPage,
  AdminSelect,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { categoryValues, type Category, type SelectionStageRow, type StageCategoryTargets } from "@/server/db/schema";
import {
  closeSelectionStageAction,
  openSelectionStageAction,
  reopenSelectionStageAction,
  rollbackStageDecisionAction,
  setStageDecisionsAction,
} from "../../selection-actions";

export type WorkspaceEntry = {
  id: string;
  participantId: string;
  stageId: string;
  decision: "pending" | "advanced" | "eliminated";
  decidedAt: Date | null;
  reason: string | null;
  version: number;
  participantNumber: number;
  participantName: string;
  participantSlug: string;
  participantActive: boolean;
  categoryCode: string;
  categoryLabel: string;
  categoryId: string;
};

type StageSummary = {
  id: string;
  name: string;
  displayOrder: number;
  targetParticipantCount: number;
  categoryTargets: StageCategoryTargets | null;
  lifecycle: string;
  finalStage: boolean;
};

const decisionFilterLabels: Record<string, string> = {
  pending: "Pending",
  advanced: "Lolos",
  eliminated: "Tidak lolos",
};

export function StageSelectionWorkspace({
  stage,
  nextStage,
  previousStage,
  categories,
  initialEntries,
  canEdit,
}: {
  stage: SelectionStageRow;
  nextStage: StageSummary | null;
  previousStage: { id: string; name: string } | null;
  categories: Array<{ id: string; code: string; label: string }>;
  initialEntries: WorkspaceEntry[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<WorkspaceEntry[]>(initialEntries);
  const [pending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [decision, setDecision] = useState("");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk decision confirm modal
  const [bulkDecisionType, setBulkDecisionType] = useState<"advanced" | "eliminated" | null>(null);
  const [bulkReason, setBulkReason] = useState("");

  // Single rollback modal
  const [rollbackTarget, setRollbackTarget] = useState<WorkspaceEntry | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");

  // Stage close modal
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeAllowUnderTarget, setCloseAllowUnderTarget] = useState(false);
  const [closeReason, setCloseReason] = useState("");

  // Stage reopen modal
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  // Stage open modal
  const [openModalOpen, setOpenModalOpen] = useState(false);

  // Statistics
  const totalCount = entries.length;
  const pendingCount = entries.filter((e) => e.decision === "pending").length;
  const advancedCount = entries.filter((e) => e.decision === "advanced").length;
  const eliminatedCount = entries.filter((e) => e.decision === "eliminated").length;
  const advancedByCategory = entries.reduce<StageCategoryTargets>((counts, entry) => {
    if (entry.decision === "advanced" && categoryValues.includes(entry.categoryCode as Category)) {
      counts[entry.categoryCode as Category] += 1;
    }
    return counts;
  }, { JD: 0, MD: 0, JR: 0, MR: 0 });

  const stageTargets = [stage.targetJDCount, stage.targetMDCount, stage.targetJRCount, stage.targetMRCount];
  const legacyStageTargets = stageTargets.every((value) => value === null);
  if (!legacyStageTargets && stageTargets.some((value) => value === null)) throw new Error("Target kategori tahap tidak lengkap");
  const categoryTargets = legacyStageTargets
    ? null
    : Object.fromEntries(categoryValues.map((code, index) => [code, stageTargets[index]!])) as StageCategoryTargets;

  const compareQuota = (target: StageSummary) => {
    if (!target.categoryTargets) {
      return {
        over: advancedCount > target.targetParticipantCount,
        under: advancedCount < target.targetParticipantCount,
        overText: `Jumlah peserta lolos ${advancedCount}/${target.targetParticipantCount}`,
        underText: `Jumlah peserta lolos ${advancedCount}/${target.targetParticipantCount}`,
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
  };
  const nextStageDifference = nextStage ? compareQuota(nextStage) : null;

  const filteredEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesSearch =
        !needle ||
        entry.participantName.toLowerCase().includes(needle) ||
        String(entry.participantNumber).includes(needle);
      const matchesCategory = !categoryId || entry.categoryId === categoryId;
      const matchesDecision = !decision || entry.decision === decision;
      return matchesSearch && matchesCategory && matchesDecision;
    });
  }, [entries, search, categoryId, decision]);

  const filteredIds = useMemo(() => new Set(filteredEntries.map((e) => e.id)), [filteredEntries]);
  const allFilteredSelected =
    filteredEntries.length > 0 && filteredEntries.every((e) => selectedIds.has(e.id));
  const someFilteredSelected =
    filteredEntries.some((e) => selectedIds.has(e.id)) && !allFilteredSelected;

  function handleToggleAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of filteredIds) next.delete(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of filteredIds) next.add(id);
        return next;
      });
    }
  }

  function handleToggleRow(entryId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }

  function handleStartBulkDecision(decisionType: "advanced" | "eliminated") {
    if (selectedIds.size === 0) {
      toast.error("Pilih setidaknya satu peserta");
      return;
    }

    if (decisionType === "advanced" && nextStage) {
      const selectedEntries = entries.filter((e) => selectedIds.has(e.id));
      const alreadyAdvanced = selectedEntries.filter((e) => e.decision === "advanced").length;
      const proposedAdvanced = advancedCount - alreadyAdvanced + selectedEntries.length;
      const proposedByCategory = { ...advancedByCategory };
      for (const entry of selectedEntries) {
        if (categoryValues.includes(entry.categoryCode as Category)) {
          if (entry.decision === "advanced") proposedByCategory[entry.categoryCode as Category] -= 1;
          proposedByCategory[entry.categoryCode as Category] += 1;
        }
      }
      const exceeded = nextStage.categoryTargets
        ? categoryValues.filter((code) => proposedByCategory[code] > nextStage.categoryTargets![code])
        : [];
      if (nextStage.categoryTargets && exceeded.length > 0) {
        toast.error(`Target terlampaui: ${exceeded.map((code) => `${code} ${proposedByCategory[code]}/${nextStage.categoryTargets![code]}`).join(", ")}`);
        return;
      }
      if (!nextStage.categoryTargets && proposedAdvanced > nextStage.targetParticipantCount) {
        toast.error(
          `Jumlah peserta lolos (${proposedAdvanced}) melebihi target tahap berikutnya (${nextStage.targetParticipantCount})`
        );
        return;
      }
    }

    setBulkDecisionType(decisionType);
    setBulkReason("");
  }

  function handleConfirmBulkDecision() {
    if (!bulkDecisionType || selectedIds.size === 0) return;

    const selectedEntries = entries.filter((e) => selectedIds.has(e.id));
    const items = selectedEntries.map((e) => ({ id: e.id, expectedVersion: e.version }));

    startTransition(async () => {
      try {
        await setStageDecisionsAction({
          stageId: stage.id,
          decision: bulkDecisionType,
          entries: items,
          reason: bulkReason.trim() || undefined,
        });

        setEntries((prev) =>
          prev.map((entry) =>
            selectedIds.has(entry.id)
              ? {
                  ...entry,
                  decision: bulkDecisionType,
                  version: entry.version + 1,
                  decidedAt: new Date(),
                  reason: bulkReason.trim() || null,
                }
              : entry
          )
        );
        setSelectedIds(new Set());
        setBulkDecisionType(null);
        setBulkReason("");
        toast.success(
          `Keputusan ${bulkDecisionType === "advanced" ? "lolos" : "tidak lolos"} berhasil disimpan`
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menetapkan keputusan");
      }
    });
  }

  function handleRollback() {
    if (!rollbackTarget) return;
    if (rollbackReason.trim().length < 5) {
      toast.error("Alasan rollback minimal 5 karakter");
      return;
    }

    const formData = new FormData();
    formData.set("entryId", rollbackTarget.id);
    formData.set("stageId", stage.id);
    formData.set("expectedVersion", String(rollbackTarget.version));
    formData.set("reason", rollbackReason.trim());

    startTransition(async () => {
      try {
        const result = await rollbackStageDecisionAction(formData);
        setEntries((prev) =>
          prev.map((e) =>
            e.id === rollbackTarget.id
              ? {
                  ...e,
                  decision: "pending",
                  version: result.version,
                  decidedAt: null,
                  reason: rollbackReason.trim(),
                }
              : e
          )
        );
        setRollbackTarget(null);
        setRollbackReason("");
        toast.success("Keputusan berhasil dikembalikan ke pending");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal rollback keputusan");
      }
    });
  }

  function handleCloseStage() {
    const difference = nextStage ? compareQuota(nextStage) : null;
    if (difference?.under) {
      if (!closeAllowUnderTarget || closeReason.trim().length < 5) {
        toast.error("Konfirmasi dan alasan minimal 5 karakter diperlukan");
        return;
      }
    }

    const formData = new FormData();
    formData.set("stageId", stage.id);
    formData.set("expectedVersion", String(stage.version));
    if (closeAllowUnderTarget) formData.set("allowUnderTarget", "true");
    if (closeReason.trim()) formData.set("reason", closeReason.trim());

    startTransition(async () => {
      try {
        await closeSelectionStageAction(formData);
        toast.success("Tahap seleksi berhasil ditutup");
        setCloseOpen(false);
        setCloseAllowUnderTarget(false);
        setCloseReason("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menutup tahap");
      }
    });
  }

  function handleOpenStage() {
    const formData = new FormData();
    formData.set("stageId", stage.id);
    formData.set("expectedVersion", String(stage.version));

    startTransition(async () => {
      try {
        await openSelectionStageAction(formData);
        toast.success("Tahap seleksi berhasil dibuka");
        setOpenModalOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuka tahap");
      }
    });
  }

  function handleReopenStage() {
    if (reopenReason.trim().length < 5) {
      toast.error("Alasan buka kembali minimal 5 karakter");
      return;
    }

    const formData = new FormData();
    formData.set("stageId", stage.id);
    formData.set("expectedVersion", String(stage.version));
    formData.set("reason", reopenReason.trim());

    startTransition(async () => {
      try {
        await reopenSelectionStageAction(formData);
        toast.success("Tahap seleksi berhasil dibuka kembali");
        setReopenOpen(false);
        setReopenReason("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuka kembali tahap");
      }
    });
  }

  return (
    <AdminPage
      eyebrow="Seleksi"
      title={stage.name}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <AdminLinkButton href="/admin/content/participants/stages" variant="secondary">
            <ArrowLeft className="size-4" />
            Daftar tahap
          </AdminLinkButton>

          {canEdit && stage.lifecycle === "draft" ? (
            <AdminButton onClick={() => setOpenModalOpen(true)} disabled={pending}>
              <CheckCircle2 className="size-4" />
              Buka tahap
            </AdminButton>
          ) : null}

          {canEdit && stage.lifecycle === "active" ? (
            <AdminButton
              variant="secondary"
              onClick={() => {
                setCloseOpen(true);
                setCloseAllowUnderTarget(false);
                setCloseReason("");
              }}
              disabled={pending}
            >
              <XCircle className="size-4" />
              Tutup tahap
            </AdminButton>
          ) : null}

          {canEdit && stage.lifecycle === "closed" && !stage.finalStage ? (
            <AdminButton
              variant="secondary"
              onClick={() => {
                setReopenOpen(true);
                setReopenReason("");
              }}
              disabled={pending}
            >
              <RotateCcw className="size-4" />
              Buka kembali
            </AdminButton>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stage Status Header Badges */}
        <div className="flex flex-wrap items-center gap-2">
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
            <AdminBadge value="Tahap final" className="border-fb-200 bg-fb-50 text-fb-700" />
          ) : null}
          {nextStage ? (
            <span className="text-xs text-muted-foreground">
              Tahap berikutnya: {nextStage.name} ({nextStage.categoryTargets
                ? categoryValues.map((code) => `${code} ${nextStage.categoryTargets![code]}`).join(", ")
                : `${nextStage.targetParticipantCount} total`})
            </span>
          ) : previousStage ? (
            <span className="text-xs text-muted-foreground">
              Tahap sebelumnya: {previousStage.name}
            </span>
          ) : null}
        </div>

        {/* Statistics Banner */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-dgb-100 bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Target kategori</p>
            <p className="mt-1 text-sm font-semibold text-dgb-900">
              {categoryTargets
                ? categoryValues.map((code) => `${code} ${categoryTargets[code]}`).join(" · ")
                : `${stage.targetParticipantCount} total; kuota kategori belum diatur`}
            </p>
          </div>
          <div className="rounded-xl border border-dgb-100 bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Total peserta</p>
            <p className="mt-1 font-montserrat text-2xl font-semibold text-dgb-900">{totalCount}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <p className="text-xs font-medium text-amber-700">Pending</p>
            <p className="mt-1 font-montserrat text-2xl font-semibold text-amber-900">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <p className="text-xs font-medium text-emerald-700">Lolos</p>
            <p className="mt-1 font-montserrat text-2xl font-semibold text-emerald-900">{advancedCount}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
            <p className="text-xs font-medium text-red-700">Tidak lolos</p>
            <p className="mt-1 font-montserrat text-2xl font-semibold text-red-900">{eliminatedCount}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <AdminCard className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_repeat(2,minmax(10rem,0.45fr))]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
            <AdminInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau nomor peserta"
              className="pl-9"
              aria-label="Cari peserta"
            />
          </label>
          <AdminSelect
            value={categoryId}
            onValueChange={setCategoryId}
            aria-label="Filter kategori"
            options={[
              { value: "", label: "Semua kategori" },
              ...categories.map((c) => ({ value: c.id, label: `${c.code} (${c.label})` })),
            ]}
          />
          <AdminSelect
            value={decision}
            onValueChange={setDecision}
            aria-label="Filter keputusan"
            options={[
              { value: "", label: "Semua keputusan" },
              ...Object.entries(decisionFilterLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
        </AdminCard>

        {/* Bulk Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dgb-100 bg-dgb-50/40 p-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                onCheckedChange={handleToggleAll}
                aria-label="Pilih semua hasil filter"
              />
              <span className="text-xs font-semibold text-dgb-900">
                Pilih semua ({filteredEntries.length})
              </span>
            </label>
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} peserta dipilih
            </span>
          </div>

          {canEdit && stage.lifecycle === "active" ? (
            <div className="flex flex-wrap items-center gap-2">
              <AdminButton
                variant="primary"
                onClick={() => handleStartBulkDecision("advanced")}
                disabled={selectedIds.size === 0 || pending}
              >
                <CheckCircle2 className="size-4" />
                Loloskan ({selectedIds.size})
              </AdminButton>
              <AdminButton
                variant="danger"
                onClick={() => handleStartBulkDecision("eliminated")}
                disabled={selectedIds.size === 0 || pending}
              >
                <XCircle className="size-4" />
                Gugurkan ({selectedIds.size})
              </AdminButton>
            </div>
          ) : null}
        </div>

        {/* Table of Entries */}
        {filteredEntries.length === 0 ? (
          <AdminCard padding="none">
            <AdminEmptyState
              icon="users"
              title="Tidak ada peserta"
              description="Ubah filter pencarian atau pastikan peserta sudah masuk ke tahap ini."
            />
          </AdminCard>
        ) : (
          <div
            className={cn(
              "relative w-full overflow-x-auto rounded-xl border border-dgb-100 bg-card",
              adminNativeScrollbarClassName
            )}
          >
            <Table>
              <TableHeader className="bg-dgb-50/60">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={
                        allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false
                      }
                      onCheckedChange={handleToggleAll}
                      aria-label="Pilih semua baris"
                    />
                  </TableHead>
                  <TableHead className="w-16">No</TableHead>
                  <TableHead>Nama peserta</TableHead>
                  <TableHead className="w-24">Kategori</TableHead>
                  <TableHead className="w-32">Keputusan</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="w-32 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => {
                  const isSelected = selectedIds.has(entry.id);
                  return (
                    <TableRow
                      key={entry.id}
                      className={cn(isSelected && "bg-dgb-50/30", "transition-colors")}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleRow(entry.id)}
                          aria-label={`Pilih ${entry.participantName}`}
                        />
                      </TableCell>
                      <TableCell className="font-montserrat font-semibold text-dgb-900">
                        {entry.participantNumber}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/content/participants/${entry.participantId}`}
                          className="font-montserrat text-sm font-semibold text-dgb-900 hover:text-dgb"
                        >
                          {entry.participantName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <AdminBadge value={entry.categoryCode} />
                      </TableCell>
                      <TableCell>
                        <AdminBadge
                          value={decisionFilterLabels[entry.decision] ?? entry.decision}
                          className={
                            entry.decision === "advanced"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : entry.decision === "eliminated"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.reason ? (
                          <span>{entry.reason}</span>
                        ) : entry.decidedAt ? (
                          <span>
                            Diputuskan {new Date(entry.decidedAt).toLocaleDateString("id-ID")}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/60">Menunggu keputusan</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && stage.lifecycle === "active" && entry.decision !== "pending" ? (
                            <AdminButton
                              variant="secondary"
                              onClick={() => {
                                setRollbackTarget(entry);
                                setRollbackReason("");
                              }}
                              disabled={pending}
                              title="Rollback status ke pending"
                            >
                              <Undo2 className="size-4" />
                              <span className="sr-only">Rollback {entry.participantName}</span>
                            </AdminButton>
                          ) : null}
                          <AdminLinkButton
                            href={`/admin/content/participants/${entry.participantId}`}
                            variant="secondary"
                          >
                            <ExternalLink className="size-4" />
                            <span className="sr-only">Detail {entry.participantName}</span>
                          </AdminLinkButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* AlertDialog Keputusan Massal */}
      <AlertDialog
        open={Boolean(bulkDecisionType)}
        onOpenChange={(open) => {
          if (!open) setBulkDecisionType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tetapkan keputusan {bulkDecisionType === "advanced" ? "lolos" : "tidak lolos"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tetapkan status {bulkDecisionType === "advanced" ? "lolos" : "tidak lolos"} untuk{" "}
              {selectedIds.size} peserta yang dipilih.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <AdminField label="Catatan keputusan (opsional)">
              <AdminTextarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Catatan tambahan untuk keputusan ini..."
                rows={2}
              />
            </AdminField>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AdminButton
              variant={bulkDecisionType === "eliminated" ? "danger" : "primary"}
              onClick={handleConfirmBulkDecision}
              disabled={pending}
            >
              {pending ? "Menyimpan..." : "Konfirmasi keputusan"}
            </AdminButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Rollback Keputusan Per Peserta */}
      <AlertDialog
        open={Boolean(rollbackTarget)}
        onOpenChange={(open) => {
          if (!open) setRollbackTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback keputusan peserta</AlertDialogTitle>
            <AlertDialogDescription>
              Kembalikan status &quot;{rollbackTarget?.participantName}&quot; ke pending. Alasan
              diperlukan minimal 5 karakter.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <AdminField label="Alasan rollback (minimal 5 karakter)">
              <AdminTextarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder="Tulis alasan pembatalan keputusan..."
                rows={3}
              />
            </AdminField>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AdminButton
              onClick={handleRollback}
              disabled={pending || rollbackReason.trim().length < 5}
            >
              {pending ? "Memproses..." : "Rollback keputusan"}
            </AdminButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Tutup Tahap */}
      <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup tahap seleksi</AlertDialogTitle>
            <AlertDialogDescription>
              Menutup tahap &quot;{stage.name}&quot; akan memajukan seluruh peserta lolos ke tahap
              berikutnya dan mengunci keputusan tahap ini.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2">
            {pendingCount > 0 ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                Masih ada {pendingCount} peserta berstatus pending. Selesaikan seluruh keputusan
                sebelum menutup tahap.
              </p>
            ) : null}

            {nextStageDifference?.over ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                Peserta lolos melebihi target tahap berikutnya: {nextStageDifference.overText}. Kurangi peserta lolos sebelum menutup tahap.
              </p>
            ) : null}

            {nextStageDifference?.under ? (
              <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50/70 p-3">
                <p className="text-xs text-amber-800">
                  Peserta lolos belum memenuhi target tahap berikutnya: {nextStageDifference.underText}. Konfirmasi dan alasan tertulis diperlukan.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={closeAllowUnderTarget}
                    onCheckedChange={(c) => setCloseAllowUnderTarget(Boolean(c))}
                  />
                  <span className="text-xs font-semibold text-amber-900">
                    Konfirmasi menutup tahap di bawah target
                  </span>
                </label>
                <AdminTextarea
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="Alasan penutupan di bawah target (minimal 5 karakter)..."
                  rows={2}
                />
              </div>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AdminButton
              onClick={handleCloseStage}
              disabled={
                pending ||
                pendingCount > 0 ||
                Boolean(nextStageDifference?.over) ||
                Boolean(
                  nextStageDifference?.under &&
                    (!closeAllowUnderTarget || closeReason.trim().length < 5)
                )
              }
            >
              {pending ? "Menutup..." : "Tutup tahap"}
            </AdminButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Buka Tahap */}
      <AlertDialog open={openModalOpen} onOpenChange={setOpenModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buka tahap seleksi</AlertDialogTitle>
            <AlertDialogDescription>
              Buka tahap &quot;{stage.name}&quot; menjadi aktif? Peserta dapat diputuskan lolos atau
              tidak lolos setelah tahap aktif.
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

      {/* AlertDialog Buka Kembali Tahap */}
      <AlertDialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buka kembali tahap seleksi</AlertDialogTitle>
            <AlertDialogDescription>
              Membuka kembali tahap &quot;{stage.name}&quot; akan mengembalikan peserta dari tahap
              berikutnya jika belum ada proses lanjutan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <AdminField label="Alasan buka kembali (minimal 5 karakter)">
              <AdminTextarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Tulis alasan membuka kembali tahap..."
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
    </AdminPage>
  );
}
