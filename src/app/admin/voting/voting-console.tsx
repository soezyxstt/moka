"use client";

import {
  CalendarPlus,
  Check,
  Eye,
  EyeOff,
  Flag,
  History,
  LockKeyhole,
  Plus,
  QrCode,
  Search,
  Settings2,
  Trash2,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "@/components/admin/primitives";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTabUrl } from "@/hooks/use-tab-url";
import { cn } from "@/lib/utils";
import { calculateVotesFromAmount } from "@/lib/voting";
import type { AdminEditionContext } from "@/server/cms/context";

import {
  closeCampaignAction,
  createCampaignAction,
  deleteCampaignAction,
  saveTallyAction,
  setResultVisibilityAction,
  startCampaignAction,
  updateCampaignAction,
  updateCampaignStageAction,
} from "./actions";

export type VotingCampaignSummary = {
  id: string;
  editionId: string;
  editionName: string;
  year: number;
  name: string;
  slug: string;
  status: string;
  pricePerPoint: number;
  startsAt: string;
  endsAt: string;
  eligibilityStageId: string | null;
  stageName: string | null;
  resultVisibility: string;
  startedAt: string | null;
  closedAt: string | null;
  version: number;
};

export type VotingStageSummary = {
  id: string;
  name: string;
  displayOrder: number;
  finalStage: boolean;
  lifecycle: string;
};

export type VotingParticipantSummary = {
  campaignId: string;
  id: string;
  editionId: string;
  name: string;
  number: number;
  categoryCode: string;
  categoryLabel: string;
  qrisReady: boolean;
};

export type VotingTallySummary = {
  id: string;
  campaignId: string;
  participantId: string;
  localDate: string;
  amount: number;
  version: number;
  updatedAt: string;
};

export type VotingAuditEntry = {
  id: string;
  campaignId: string;
  participantId: string | null;
  participantName: string;
  localDate: string;
  actorLabel: string;
  action: string;
  beforeAmount: number | null;
  afterAmount: number;
  reason: string;
  createdAt: string;
};

const VOTING_TABS = ["input", "rekap", "hasil", "pengaturan"] as const;
type VotingTab = (typeof VOTING_TABS)[number];

const TAB_ITEMS: { id: VotingTab; label: string; icon: typeof Vote }[] = [
  { id: "input", label: "Input", icon: Vote },
  { id: "rekap", label: "Rekap peserta", icon: Users },
  { id: "hasil", label: "Hasil", icon: Trophy },
  { id: "pengaturan", label: "Pengaturan", icon: Settings2 },
];

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const date = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const dateTime = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

function localInputDate(iso: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function defaultCampaignDate(startsAtIso: string, endsAtIso: string) {
  const minDate = localInputDate(startsAtIso);
  const maxDate = localInputDate(endsAtIso);
  const today = localInputDate(new Date().toISOString());
  if (today < minDate) return minDate;
  if (today > maxDate) return maxDate;
  return today;
}

function localInputDateTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(d)
      .map((part) => [part.type, part.value]),
  );
  const hour = values.hour === "24" ? "00" : values.hour;
  return `${values.year}-${values.month}-${values.day}T${hour}:${values.minute}`;
}

function statusLabel(value: string) {
  if (value === "active") return "Aktif";
  if (value === "closed") return "Nonaktif (Ditutup)";
  return "Draf";
}

function formatParticipantCode(categoryCode: string, number: number) {
  return `${categoryCode}-${String(number).padStart(2, "0")}`;
}

type VotingConsoleProps = {
  currentEdition: AdminEditionContext;
  campaigns: VotingCampaignSummary[];
  stages: VotingStageSummary[];
  participants: VotingParticipantSummary[];
  tallies: VotingTallySummary[];
  auditEntries?: VotingAuditEntry[];
  canManage: boolean;
  canTally: boolean;
};

export function VotingConsole(props: VotingConsoleProps) {
  return (
    <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Memuat halaman voting...</div>}>
      <VotingConsoleInner {...props} />
    </Suspense>
  );
}

function VotingConsoleInner({
  currentEdition,
  campaigns: initialCampaigns,
  stages,
  participants,
  tallies,
  auditEntries = [],
  canManage,
  canTally,
}: VotingConsoleProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useTabUrl(VOTING_TABS, "input");
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [selectedCampaignId, setSelectedCampaignId] = useState(initialCampaigns[0]?.id ?? "");
  const selectedCampaign =
    campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0];

  const selectedResultIsVisible = selectedCampaign?.resultVisibility === "visible";
  const selectedResultVisibilityIsLegacy =
    selectedCampaign !== undefined &&
    selectedCampaign.resultVisibility !== "hidden" &&
    !selectedResultIsVisible;

  const snapshotParticipants = useMemo(
    () => participants.filter((participant) => participant.campaignId === selectedCampaign?.id),
    [participants, selectedCampaign?.id],
  );
  const tallyReadyParticipants = useMemo(
    () => snapshotParticipants.filter((participant) => participant.qrisReady),
    [snapshotParticipants],
  );

  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const selectedParticipant =
    tallyReadyParticipants.find((participant) => participant.id === selectedParticipantId) ??
    tallyReadyParticipants[0];

  const [selectedDate, setSelectedDate] = useState(
    selectedCampaign
      ? defaultCampaignDate(selectedCampaign.startsAt, selectedCampaign.endsAt)
      : "",
  );
  const [inputMode, setInputMode] = useState<"add" | "set">("add");
  const [voteInput, setVoteInput] = useState("1");
  const [customAmountInput, setCustomAmountInput] = useState("");
  const [inputReason, setInputReason] = useState("");

  const [stageId, setStageId] = useState(selectedCampaign?.eligibilityStageId ?? "");
  const [query, setQuery] = useState("");
  const [rekapCategory, setRekapCategory] = useState("ALL");
  const [hasilCategory, setHasilCategory] = useState("ALL");

  const [pending, setPending] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"start" | "close" | "delete" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [visibilityReason, setVisibilityReason] = useState("");

  const campaignTallies = useMemo(
    () => tallies.filter((tally) => tally.campaignId === selectedCampaign?.id),
    [tallies, selectedCampaign?.id],
  );
  const campaignAuditEntries = useMemo(
    () => auditEntries.filter((entry) => entry.campaignId === selectedCampaign?.id),
    [auditEntries, selectedCampaign?.id],
  );

  const participantTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tally of campaignTallies) {
      totals.set(tally.participantId, (totals.get(tally.participantId) ?? 0) + tally.amount);
    }
    return totals;
  }, [campaignTallies]);

  const currentTally = campaignTallies.find(
    (tally) => tally.participantId === selectedParticipant?.id && tally.localDate === selectedDate,
  );

  const availableCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of snapshotParticipants) {
      if (!seen.has(p.categoryCode)) {
        seen.set(p.categoryCode, p.categoryLabel);
      }
    }
    return Array.from(seen.entries()).map(([code, label]) => ({ code, label }));
  }, [snapshotParticipants]);

  const allStandings = useMemo(() => {
    return snapshotParticipants
      .map((participant) => {
        const amount = participantTotals.get(participant.id) ?? 0;
        return {
          ...participant,
          code: formatParticipantCode(participant.categoryCode, participant.number),
          amount,
          votes: selectedCampaign
            ? calculateVotesFromAmount(amount, selectedCampaign.pricePerPoint)
            : 0,
        };
      })
      .sort((a, b) => b.votes - a.votes || a.number - b.number || a.name.localeCompare(b.name, "id"));
  }, [snapshotParticipants, participantTotals, selectedCampaign]);

  const filteredRekap = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allStandings.filter((participant) => {
      if (rekapCategory !== "ALL" && participant.categoryCode !== rekapCategory) return false;
      if (!q) return true;
      return `${participant.name} ${participant.code} ${participant.categoryCode} ${participant.number}`
        .toLowerCase()
        .includes(q);
    });
  }, [allStandings, query, rekapCategory]);

  const hasilStandings = useMemo(() => {
    return allStandings.filter(
      (participant) => hasilCategory === "ALL" || participant.categoryCode === hasilCategory,
    );
  }, [allStandings, hasilCategory]);

  const totalCampaignVotes = useMemo(
    () => allStandings.reduce((sum, item) => sum + item.votes, 0),
    [allStandings],
  );
  const totalCampaignAmount = useMemo(
    () => allStandings.reduce((sum, item) => sum + item.amount, 0),
    [allStandings],
  );

  const pricePerVote = selectedCampaign?.pricePerPoint ?? 0;
  const existingDateAmount = currentTally?.amount ?? 0;
  const existingDateVotes =
    pricePerVote > 0 ? calculateVotesFromAmount(existingDateAmount, pricePerVote) : 0;
  const selectedParticipantTotalAmount = selectedParticipant
    ? (participantTotals.get(selectedParticipant.id) ?? 0)
    : 0;
  const selectedParticipantTotalVotes =
    pricePerVote > 0
      ? calculateVotesFromAmount(selectedParticipantTotalAmount, pricePerVote)
      : 0;

  const parsedVoteInput = Number.parseInt(voteInput.trim(), 10);
  const validVoteCount =
    Number.isSafeInteger(parsedVoteInput) && parsedVoteInput >= 0 ? parsedVoteInput : 0;
  const deltaOrTargetAmount =
    customAmountInput.trim() !== ""
      ? Math.max(0, Number.parseInt(customAmountInput.trim(), 10) || 0)
      : validVoteCount * pricePerVote;
  const nextDateAmount =
    inputMode === "add" ? existingDateAmount + deltaOrTargetAmount : deltaOrTargetAmount;
  const nextDateVotes =
    pricePerVote > 0 ? calculateVotesFromAmount(nextDateAmount, pricePerVote) : 0;

  function replaceCampaign(patch: Partial<VotingCampaignSummary>) {
    if (!selectedCampaign) return;
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === selectedCampaign.id ? { ...campaign, ...patch } : campaign,
      ),
    );
  }

  function chooseCampaign(id: string) {
    const campaign = campaigns.find((item) => item.id === id);
    setSelectedCampaignId(id);
    setSelectedParticipantId("");
    setStageId(campaign?.eligibilityStageId ?? "");
    setSelectedDate(
      campaign ? defaultCampaignDate(campaign.startsAt, campaign.endsAt) : "",
    );
    setQuery("");
  }

  function jumpToParticipantInput(participantId: string) {
    setSelectedParticipantId(participantId);
    setActiveTab("input");
  }

  async function createCampaign(formData: FormData) {
    setPending(true);
    const toastId = toast.loading("Membuat kampanye voting...");
    try {
      await createCampaignAction(formData);
      setIsCreateOpen(false);
      toast.success("Kampanye draf dibuat", { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kampanye gagal dibuat", { id: toastId });
    } finally {
      setPending(false);
    }
  }

  async function saveStage() {
    if (!selectedCampaign || !stageId) return;
    setPending(true);
    const toastId = toast.loading("Menyimpan tahap sumber...");
    try {
      const result = await updateCampaignStageAction({
        campaignId: selectedCampaign.id,
        stageId,
        expectedVersion: selectedCampaign.version,
      });
      const stage = stages.find((item) => item.id === stageId);
      replaceCampaign({
        version: result.version,
        eligibilityStageId: stageId,
        stageName: stage?.name ?? null,
      });
      toast.success("Tahap sumber disimpan", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tahap sumber gagal disimpan", { id: toastId });
    } finally {
      setPending(false);
    }
  }

  async function updateCampaign(formData: FormData) {
    if (!selectedCampaign) return;
    setPending(true);
    const toastId = toast.loading("Memperbarui pengaturan kampanye...");
    try {
      const result = await updateCampaignAction(formData);
      const name = String(formData.get("name") ?? "");
      const slug = String(formData.get("slug") ?? "");
      const rawStage = formData.get("eligibilityStageId");
      const nextStageId = rawStage ? String(rawStage) : selectedCampaign.eligibilityStageId;
      const stage = stages.find((item) => item.id === nextStageId);
      const pricePerPoint = Number(formData.get("pricePerPoint"));
      const rawStartsAt = formData.get("startsAt");
      const rawEndsAt = formData.get("endsAt");

      replaceCampaign({
        version: result.version,
        name,
        slug,
        eligibilityStageId: nextStageId,
        stageName: stage?.name ?? selectedCampaign.stageName,
        pricePerPoint,
        startsAt:
          typeof rawStartsAt === "string" ? `${rawStartsAt}:00+07:00` : selectedCampaign.startsAt,
        endsAt:
          typeof rawEndsAt === "string" ? `${rawEndsAt}:00+07:00` : selectedCampaign.endsAt,
      });
      toast.success("Pengaturan kampanye diperbarui", { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kampanye gagal diperbarui", { id: toastId });
    } finally {
      setPending(false);
    }
  }

  async function confirmLifecycle() {
    if (!selectedCampaign || !confirmMode) return;
    setPending(true);
    const loadingLabel =
      confirmMode === "start"
        ? "Mengaktifkan voting..."
        : confirmMode === "close"
          ? "Menonaktifkan voting..."
          : "Menghapus kampanye...";
    const toastId = toast.loading(loadingLabel);
    try {
      if (confirmMode === "start") {
        const result = await startCampaignAction({
          campaignId: selectedCampaign.id,
          expectedVersion: selectedCampaign.version,
          confirmation,
          reason,
        });
        replaceCampaign({
          version: result.version,
          status: "active",
          startedAt: new Date().toISOString(),
        });
        toast.success(`Voting diaktifkan untuk ${result.snapshotCount} peserta`, { id: toastId });
      } else if (confirmMode === "close") {
        const result = await closeCampaignAction({
          campaignId: selectedCampaign.id,
          expectedVersion: selectedCampaign.version,
          confirmation,
          reason,
        });
        replaceCampaign({
          version: result.version,
          status: "closed",
          closedAt: new Date().toISOString(),
        });
        toast.success("Voting dinonaktifkan", { id: toastId });
      } else if (confirmMode === "delete") {
        await deleteCampaignAction({
          campaignId: selectedCampaign.id,
          expectedVersion: selectedCampaign.version,
          confirmation,
          reason,
        });
        const remaining = campaigns.filter((item) => item.id !== selectedCampaign.id);
        setCampaigns(remaining);
        if (remaining.length > 0) {
          chooseCampaign(remaining[0]!.id);
        } else {
          setSelectedCampaignId("");
        }
        toast.success("Kampanye berhasil dihapus", { id: toastId });
      }
      setConfirmMode(null);
      setConfirmation("");
      setReason("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tindakan voting gagal diproses", { id: toastId });
    } finally {
      setPending(false);
    }
  }

  async function toggleVisibility() {
    if (!selectedCampaign) return;
    const currentVisibility = selectedCampaign.resultVisibility;
    const normalizeLegacyValue =
      currentVisibility !== "visible" && currentVisibility !== "hidden";
    const visibility = currentVisibility === "hidden" ? "visible" : "hidden";
    setPending(true);
    const toastId = toast.loading("Mengubah visibilitas hasil...");
    try {
      const result = await setResultVisibilityAction({
        campaignId: selectedCampaign.id,
        expectedVersion: selectedCampaign.version,
        visibility,
        reason: visibilityReason,
      });
      replaceCampaign({ version: result.version, resultVisibility: visibility });
      setVisibilityReason("");
      toast.success(
        normalizeLegacyValue
          ? "Nilai lama dinormalkan menjadi tersembunyi"
          : visibility === "visible"
            ? "Hasil ditampilkan ke publik"
            : "Hasil disembunyikan dari publik",
        { id: toastId },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Visibilitas hasil gagal diubah", { id: toastId });
    } finally {
      setPending(false);
    }
  }

  async function saveVotingInput(formData: FormData) {
    setPending(true);
    const toastId = toast.loading("Menyimpan perolehan voting...");
    try {
      await saveTallyAction(formData);
      toast.success("Data voting disimpan dan dicatat ke audit", { id: toastId });
      setInputReason("");
      if (inputMode === "add") {
        setVoteInput("1");
        setCustomAmountInput("");
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Data voting gagal disimpan", { id: toastId });
    } finally {
      setPending(false);
    }
  }

  const defaultStageId = stages.find((stage) => stage.finalStage)?.id ?? stages[0]?.id ?? "";

  return (
    <div className="space-y-5">
      {/* Top Bar: Campaign Selector + Kampanye Baru Button */}
      <div className="flex flex-col gap-3 rounded-xl border border-brand-100 bg-card p-3.5 sm:flex-row sm:items-end sm:justify-between sm:p-4">
        <div className="min-w-0 flex-1">
          {campaigns.length > 0 && selectedCampaign ? (
            <AdminField label="Pilih kampanye">
              <AdminSelect
                value={selectedCampaign.id}
                onValueChange={chooseCampaign}
                options={campaigns.map((campaign) => ({
                  value: campaign.id,
                  label: `${campaign.name} (${statusLabel(campaign.status)})`,
                }))}
              />
            </AdminField>
          ) : (
            <p className="text-sm text-muted-foreground">
              Belum ada kampanye voting pada edisi {currentEdition.year}.
            </p>
          )}
        </div>
        {canManage ? (
          <AdminButton
            type="button"
            onClick={() => setIsCreateOpen(true)}
            disabled={pending || stages.length === 0}
            className="w-full shrink-0 sm:w-auto"
          >
            <CalendarPlus className="size-4" /> Kampanye baru
          </AdminButton>
        ) : null}
      </div>

      {selectedCampaign ? (
        <div className="space-y-4">
          {/* Compact Campaign Overview + Horizontal Tabs */}
          <div className="overflow-hidden rounded-xl border border-brand-100 bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-manrope text-lg font-semibold text-brand-900 sm:text-xl">
                    {selectedCampaign.name}
                  </h2>
                  <AdminBadge value={selectedCampaign.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selectedCampaign.stageName ?? "Tahap belum dipilih"} ·{" "}
                  {date.format(new Date(selectedCampaign.startsAt))} sampai{" "}
                  {date.format(new Date(selectedCampaign.endsAt))} ·{" "}
                  {currency.format(selectedCampaign.pricePerPoint)}/vote
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <strong className="font-manrope text-sm font-semibold text-brand-900">
                    {totalCampaignVotes.toLocaleString("id-ID")}
                  </strong>{" "}
                  vote
                </span>
                <span>
                  <strong className="font-manrope text-sm font-semibold text-brand-900">
                    {tallyReadyParticipants.length}/{snapshotParticipants.length}
                  </strong>{" "}
                  QRIS siap
                </span>
                <span>
                  Hasil:{" "}
                  <strong className="font-semibold text-brand-900">
                    {selectedResultIsVisible ? "Ditampilkan" : "Disembunyikan"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Horizontal Tabs */}
            <div
              role="tablist"
              aria-label="Menu kampanye voting"
              className="grid grid-cols-4 border-t border-brand-100 bg-brand-50/40"
            >
              {TAB_ITEMS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-xs font-semibold transition-colors sm:px-4 sm:py-3 sm:text-sm",
                      isSelected
                        ? "border-brand bg-card text-brand-900"
                        : "border-transparent text-muted-foreground hover:bg-brand-50/70 hover:text-brand-900",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0 sm:size-4" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: INPUT VOTING */}
          {activeTab === "input" ? (
            <div className="space-y-4">
              {!canTally ? (
                <AdminEmptyState
                  icon="shield"
                  title="Akses input voting terbatas"
                  description="Akun Anda hanya memiliki izin melihat data voting."
                />
              ) : selectedCampaign.status !== "active" ? (
                <AdminEmptyState
                  icon="calendar"
                  title="Kampanye voting belum aktif"
                  description="Buka tab Pengaturan untuk mengaktifkan kampanye sebelum menambahkan voting peserta."
                />
              ) : tallyReadyParticipants.length === 0 || !selectedParticipant ? (
                <AdminEmptyState
                  icon="gallery"
                  title="QRIS peserta belum siap"
                  description="Pastikan peserta pada kampanye ini memiliki gambar QRIS yang siap."
                />
              ) : (
                <AdminCard className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-manrope text-base font-semibold text-brand-900">
                        Input voting peserta
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Setiap perubahan otomatis tercatat pada log audit beserta alasan dan pelaku.
                      </p>
                    </div>
                    <div className="inline-flex rounded-md border border-brand-100 bg-brand-50/50 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setInputMode("add");
                          setVoteInput("1");
                          setCustomAmountInput("");
                        }}
                        className={cn(
                          "rounded px-2.5 py-1 text-xs font-semibold transition-colors",
                          inputMode === "add"
                            ? "bg-brand text-canvas"
                            : "text-brand-800 hover:bg-brand-100/60",
                        )}
                      >
                        Tambah vote
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInputMode("set");
                          setVoteInput(String(existingDateVotes));
                          setCustomAmountInput(String(existingDateAmount));
                        }}
                        className={cn(
                          "rounded px-2.5 py-1 text-xs font-semibold transition-colors",
                          inputMode === "set"
                            ? "bg-brand text-canvas"
                            : "text-brand-800 hover:bg-brand-100/60",
                        )}
                      >
                        Atur total tanggal
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <AdminField label="Peserta">
                      <AdminSelect
                        value={selectedParticipant.id}
                        onValueChange={(nextId) => {
                          setSelectedParticipantId(nextId);
                          if (inputMode === "set") {
                            const nextTally = campaignTallies.find(
                              (t) => t.participantId === nextId && t.localDate === selectedDate,
                            );
                            const amt = nextTally?.amount ?? 0;
                            setCustomAmountInput(String(amt));
                            setVoteInput(
                              String(
                                pricePerVote > 0 ? calculateVotesFromAmount(amt, pricePerVote) : 0,
                              ),
                            );
                          }
                        }}
                        options={tallyReadyParticipants.map((participant) => ({
                          value: participant.id,
                          label: `${formatParticipantCode(participant.categoryCode, participant.number)} · ${participant.name}`,
                        }))}
                      />
                    </AdminField>
                    <AdminField label="Tanggal pencatatan">
                      <AdminInput
                        type="date"
                        min={localInputDate(selectedCampaign.startsAt)}
                        max={localInputDate(selectedCampaign.endsAt)}
                        value={selectedDate}
                        onChange={(event) => {
                          const nextDate = event.target.value;
                          setSelectedDate(nextDate);
                          if (inputMode === "set" && selectedParticipant) {
                            const nextTally = campaignTallies.find(
                              (t) =>
                                t.participantId === selectedParticipant.id &&
                                t.localDate === nextDate,
                            );
                            const amt = nextTally?.amount ?? 0;
                            setCustomAmountInput(String(amt));
                            setVoteInput(
                              String(
                                pricePerVote > 0 ? calculateVotesFromAmount(amt, pricePerVote) : 0,
                              ),
                            );
                          }
                        }}
                      />
                    </AdminField>
                  </div>

                  {/* Current stats strip for selected participant */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-brand-100 bg-brand-50/40 p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Tercatat ({selectedDate})</span>
                      <p className="mt-0.5 font-manrope text-sm font-semibold text-brand-900">
                        {existingDateVotes.toLocaleString("id-ID")} vote
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {currency.format(existingDateAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Setelah disimpan</span>
                      <p className="mt-0.5 font-manrope text-sm font-semibold text-brand">
                        {nextDateVotes.toLocaleString("id-ID")} vote
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {currency.format(nextDateAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total akumulasi</span>
                      <p className="mt-0.5 font-manrope text-sm font-semibold text-brand-900">
                        {selectedParticipantTotalVotes.toLocaleString("id-ID")} vote
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {currency.format(selectedParticipantTotalAmount)}
                      </p>
                    </div>
                  </div>

                  <form
                    key={`${selectedCampaign.id}:${selectedParticipant.id}:${selectedDate}:${currentTally?.version ?? 0}:${inputMode}`}
                    action={saveVotingInput}
                    className="space-y-3.5"
                  >
                    <input type="hidden" name="campaignId" value={selectedCampaign.id} />
                    <input type="hidden" name="participantId" value={selectedParticipant.id} />
                    <input type="hidden" name="localDate" value={selectedDate} />
                    <input type="hidden" name="version" value={currentTally?.version ?? 0} />
                    <input type="hidden" name="amount" value={nextDateAmount} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <AdminField
                          label={
                            inputMode === "add"
                              ? "Jumlah vote ditambahkan"
                              : "Target jumlah vote tanggal ini"
                          }
                        >
                          <AdminInput
                            type="number"
                            min="0"
                            step="1"
                            value={voteInput}
                            onChange={(event) => {
                              const val = event.target.value;
                              setVoteInput(val);
                              const num = Number.parseInt(val, 10);
                              if (Number.isSafeInteger(num) && num >= 0 && pricePerVote > 0) {
                                setCustomAmountInput(String(num * pricePerVote));
                              } else {
                                setCustomAmountInput("");
                              }
                            }}
                          />
                        </AdminField>
                        <div className="flex flex-wrap gap-1.5">
                          {[1, 5, 10, 25, 50].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => {
                                const nextVotes = validVoteCount + step;
                                setVoteInput(String(nextVotes));
                                setCustomAmountInput(String(nextVotes * pricePerVote));
                              }}
                              className="rounded-md border border-brand-200 bg-background px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                            >
                              +{step} vote
                            </button>
                          ))}
                        </div>
                      </div>

                      <AdminField
                        label={
                          inputMode === "add"
                            ? "Nominal tambahan (Rp)"
                            : "Nominal tanggal ini (Rp)"
                        }
                        hint={`Konversi otomatis: Rp ${pricePerVote.toLocaleString("id-ID")} per vote`}
                      >
                        <AdminInput
                          type="number"
                          min="0"
                          step="1"
                          value={
                            customAmountInput !== ""
                              ? customAmountInput
                              : String(validVoteCount * pricePerVote)
                          }
                          onChange={(event) => {
                            const val = event.target.value;
                            setCustomAmountInput(val);
                            const num = Number.parseInt(val, 10);
                            if (Number.isSafeInteger(num) && num >= 0 && pricePerVote > 0) {
                              setVoteInput(String(calculateVotesFromAmount(num, pricePerVote)));
                            }
                          }}
                        />
                      </AdminField>
                    </div>

                    <AdminField label="Catatan audit (wajib)">
                      <AdminInput
                        name="reason"
                        value={inputReason}
                        onChange={(event) => setInputReason(event.target.value)}
                        placeholder="Contoh: Pembayaran QRIS terverifikasi pukul 16.00 WIB"
                        required
                      />
                    </AdminField>

                    <AdminButton
                      type="submit"
                      disabled={pending || !inputReason.trim()}
                      className="w-full sm:w-auto"
                    >
                      <Check className="size-4" /> Simpan voting
                    </AdminButton>
                  </form>
                </AdminCard>
              )}

              {/* Riwayat Audit Input Voting */}
              <AdminCard className="space-y-3 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-brand" />
                    <h3 className="font-manrope text-sm font-semibold text-brand-900">
                      Riwayat audit input voting
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {campaignAuditEntries.length} catatan terakhir
                  </span>
                </div>

                {campaignAuditEntries.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Belum ada riwayat input voting pada kampanye ini.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {campaignAuditEntries.slice(0, 20).map((entry) => {
                      const beforeVotes =
                        entry.beforeAmount !== null && pricePerVote > 0
                          ? calculateVotesFromAmount(entry.beforeAmount, pricePerVote)
                          : 0;
                      const afterVotes =
                        pricePerVote > 0
                          ? calculateVotesFromAmount(entry.afterAmount, pricePerVote)
                          : 0;
                      const diffVotes = afterVotes - beforeVotes;
                      return (
                        <div
                          key={entry.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-manrope font-semibold text-brand-900">
                                {entry.participantName}
                              </span>
                              {entry.localDate ? (
                                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-800">
                                  {entry.localDate}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 truncate text-muted-foreground">
                              {entry.reason || "Tanpa catatan"} · oleh {entry.actorLabel} ·{" "}
                              {dateTime.format(new Date(entry.createdAt))}
                            </p>
                          </div>
                          <div className="shrink-0 text-right tabular-nums">
                            <p className="font-manrope font-semibold text-brand-900">
                              {beforeVotes.toLocaleString("id-ID")} →{" "}
                              {afterVotes.toLocaleString("id-ID")} vote{" "}
                              <span
                                className={cn(
                                  "text-[11px]",
                                  diffVotes >= 0 ? "text-brand" : "text-destructive",
                                )}
                              >
                                ({diffVotes >= 0 ? `+${diffVotes}` : diffVotes})
                              </span>
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {currency.format(entry.afterAmount)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AdminCard>
            </div>
          ) : null}

          {/* TAB 2: REKAP PESERTA (COMPACT) */}
          {activeTab === "rekap" ? (
            <AdminCard className="space-y-3 p-4 sm:p-5">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRekapCategory("ALL")}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                      rekapCategory === "ALL"
                        ? "bg-brand text-canvas"
                        : "border border-brand-100 bg-background text-brand-800 hover:bg-brand-50",
                    )}
                  >
                    Semua ({allStandings.length})
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => setRekapCategory(cat.code)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                        rekapCategory === cat.code
                          ? "bg-brand text-canvas"
                          : "border border-brand-100 bg-background text-brand-800 hover:bg-brand-50",
                      )}
                    >
                      {cat.code}
                    </button>
                  ))}
                </div>
                <label className="relative block w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <AdminInput
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari nama atau kode..."
                    className="h-9 pl-9 text-xs"
                  />
                </label>
              </div>

              {filteredRekap.length === 0 ? (
                <AdminEmptyState icon="users" title="Tidak ada peserta yang cocok" />
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {filteredRekap.map((participant, index) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-brand-50/30"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span className="w-5 shrink-0 font-manrope text-xs font-semibold text-muted-foreground tabular-nums">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-manrope text-sm font-semibold text-brand-900">
                              {participant.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-medium text-brand-800">{participant.code}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <QrCode
                                className={cn(
                                  "size-3",
                                  participant.qrisReady ? "text-brand" : "text-destructive",
                                )}
                              />
                              {participant.qrisReady ? "QRIS siap" : "Tanpa QRIS"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2.5">
                        <div className="text-right tabular-nums">
                          <p className="font-manrope text-sm font-semibold text-brand-900">
                            {participant.votes.toLocaleString("id-ID")} vote
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {currency.format(participant.amount)}
                          </p>
                        </div>
                        {selectedCampaign.status === "active" &&
                        canTally &&
                        participant.qrisReady ? (
                          <button
                            type="button"
                            onClick={() => jumpToParticipantInput(participant.id)}
                            title={`Tambah vote untuk ${participant.name}`}
                            className="inline-flex size-7 items-center justify-center rounded-md border border-brand-200 bg-brand-50 text-brand-900 transition-colors hover:bg-brand hover:text-canvas"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          ) : null}

          {/* TAB 3: HASIL (PODIUM RANK) */}
          {activeTab === "hasil" ? (
            <div className="space-y-4">
              <AdminCard className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-manrope text-base font-semibold text-brand-900">
                      Podium peringkat voting
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Total suara terkumpul: {totalCampaignVotes.toLocaleString("id-ID")} vote (
                      {currency.format(totalCampaignAmount)})
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHasilCategory("ALL")}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                        hasilCategory === "ALL"
                          ? "bg-brand text-canvas"
                          : "border border-brand-100 bg-background text-brand-800 hover:bg-brand-50",
                      )}
                    >
                      Semua
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat.code}
                        type="button"
                        onClick={() => setHasilCategory(cat.code)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                          hasilCategory === cat.code
                            ? "bg-brand text-canvas"
                            : "border border-brand-100 bg-background text-brand-800 hover:bg-brand-50",
                        )}
                      >
                        {cat.code}
                      </button>
                    ))}
                  </div>
                </div>

                {hasilStandings.length === 0 ? (
                  <AdminEmptyState icon="users" title="Belum ada peserta pada kategori ini" />
                ) : (
                  <>
                    {/* Top 3 Podium Cards */}
                    <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
                      {[
                        { rank: 1, item: hasilStandings[0], orderClass: "sm:order-2" },
                        { rank: 2, item: hasilStandings[1], orderClass: "sm:order-1" },
                        { rank: 3, item: hasilStandings[2], orderClass: "sm:order-3" },
                      ]
                        .filter((slot) => slot.item !== undefined)
                        .map(({ rank, item, orderClass }) => {
                          const p = item!;
                          const isFirst = rank === 1;
                          return (
                            <div
                              key={p.id}
                              className={cn(
                                "flex flex-col justify-between rounded-xl border p-4 transition-colors",
                                orderClass,
                                isFirst
                                  ? "border-highlight-400 bg-brand-900 text-canvas sm:py-6"
                                  : "border-brand-100 bg-brand-50/50 text-brand-900",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-manrope text-xs font-bold",
                                    isFirst
                                      ? "bg-highlight-400 text-neutral-950"
                                      : "bg-brand-100 text-brand-900",
                                  )}
                                >
                                  <Trophy className="size-3" /> Peringkat {rank}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs font-semibold",
                                    isFirst ? "text-canvas/80" : "text-muted-foreground",
                                  )}
                                >
                                  {p.code}
                                </span>
                              </div>
                              <div className="mt-3">
                                <p
                                  className={cn(
                                    " truncate font-manrope text-base font-semibold",
                                    isFirst ? "text-canvas sm:text-lg" : "text-brand-900",
                                  )}
                                >
                                  {p.name}
                                </p>
                              </div>
                              <div className="mt-3 border-t border-current/10 pt-2.5 tabular-nums">
                                <p
                                  className={cn(
                                    "font-manrope text-xl font-bold",
                                    isFirst ? "text-highlight-300 sm:text-2xl" : "text-brand-900",
                                  )}
                                >
                                  {p.votes.toLocaleString("id-ID")}{" "}
                                  <span className="text-xs font-normal">vote</span>
                                </p>
                                <p
                                  className={cn(
                                    "text-[11px]",
                                    isFirst ? "text-canvas/75" : "text-muted-foreground",
                                  )}
                                >
                                  {currency.format(p.amount)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Remaining Standings (#4+) */}
                    {hasilStandings.length > 3 ? (
                      <div className="divide-y divide-border rounded-lg border border-border">
                        {hasilStandings.slice(3).map((participant, idx) => {
                          const rank = idx + 4;
                          const maxVotes = hasilStandings[0]?.votes || 1;
                          const pct =
                            maxVotes > 0
                              ? Math.min(100, Math.round((participant.votes / maxVotes) * 100))
                              : 0;
                          return (
                            <div
                              key={participant.id}
                              className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                <span className="w-6 shrink-0 font-manrope font-semibold text-muted-foreground tabular-nums">
                                  #{rank}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate font-manrope text-sm font-semibold text-brand-900">
                                      {participant.name}
                                    </span>
                                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                                      ({participant.code})
                                    </span>
                                  </div>
                                  {participant.votes > 0 ? (
                                    <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-brand-50">
                                      <div
                                        className="h-full bg-brand"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="shrink-0 text-right tabular-nums">
                                <span className="font-manrope text-sm font-semibold text-brand-900">
                                  {participant.votes.toLocaleString("id-ID")} vote
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </>
                )}
              </AdminCard>
            </div>
          ) : null}

          {/* TAB 4: PENGATURAN (EDIT TANGGAL, AKTIF/NONAKTIF, VISIBILITAS, HAPUS) */}
          {activeTab === "pengaturan" ? (
            <div className="space-y-4">
              {!canManage ? (
                <AdminEmptyState
                  icon="shield"
                  title="Akses pengaturan terbatas"
                  description="Akun Anda tidak memiliki izin mengelola pengaturan kampanye voting."
                />
              ) : (
                <>
                  {/* Status Aktif/Nonaktif & Visibilitas Hasil */}
                  <AdminCard className="space-y-4 p-4 sm:p-5">
                    <h3 className="font-manrope text-base font-semibold text-brand-900">
                      Status kampanye dan visibilitas hasil
                    </h3>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3 rounded-lg border border-brand-100 bg-brand-50/30 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-brand-900">Status voting</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedCampaign.status === "draft"
                                ? "Kampanye masih draf. Aktifkan untuk membuat snapshot peserta dan membuka input voting."
                                : selectedCampaign.status === "active"
                                  ? "Kampanye sedang aktif. Nonaktifkan jika periode voting telah selesai."
                                  : "Kampanye telah ditutup secara permanen."}
                            </p>
                          </div>
                          <AdminBadge value={selectedCampaign.status} />
                        </div>

                        {selectedCampaign.status === "draft" ? (
                          <div className="space-y-2.5 border-t border-brand-100 pt-3">
                            <AdminField label="Tahap sumber peserta">
                              <AdminSelect
                                value={stageId}
                                onValueChange={setStageId}
                                disabled={pending}
                                options={stages.map((stage) => ({
                                  value: stage.id,
                                  label: stage.name,
                                }))}
                              />
                            </AdminField>
                            <div className="flex flex-wrap gap-2">
                              <AdminButton
                                type="button"
                                variant="secondary"
                                onClick={saveStage}
                                disabled={pending || !stageId}
                              >
                                <Check className="size-4" /> Simpan tahap
                              </AdminButton>
                              <AdminButton
                                type="button"
                                onClick={() => {
                                  setConfirmation("");
                                  setReason("");
                                  setConfirmMode("start");
                                }}
                                disabled={pending}
                              >
                                <Vote className="size-4" /> Aktifkan voting
                              </AdminButton>
                            </div>
                          </div>
                        ) : selectedCampaign.status === "active" ? (
                          <div className="border-t border-brand-100 pt-3">
                            <AdminButton
                              type="button"
                              variant="danger"
                              onClick={() => {
                                setConfirmation("");
                                setReason("");
                                setConfirmMode("close");
                              }}
                              disabled={pending}
                            >
                              <LockKeyhole className="size-4" /> Nonaktifkan voting
                            </AdminButton>
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-3 rounded-lg border border-brand-100 bg-brand-50/30 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-brand-900">
                              Visibilitas hasil publik
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Saat ini:{" "}
                              <strong>
                                {selectedResultIsVisible ? "Ditampilkan" : "Disembunyikan"}
                              </strong>
                            </p>
                          </div>
                        </div>
                        <AdminField label="Alasan perubahan visibilitas">
                          <AdminInput
                            value={visibilityReason}
                            onChange={(event) => setVisibilityReason(event.target.value)}
                            placeholder="Contoh: Hasil siap diumumkan"
                            disabled={pending}
                          />
                        </AdminField>
                        <AdminButton
                          type="button"
                          variant="secondary"
                          onClick={toggleVisibility}
                          disabled={pending || !visibilityReason.trim()}
                        >
                          {selectedResultIsVisible || selectedResultVisibilityIsLegacy ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                          {selectedResultIsVisible
                            ? "Sembunyikan hasil"
                            : selectedCampaign.resultVisibility === "hidden"
                              ? "Tampilkan hasil"
                              : "Tetapkan hasil ke tersembunyi"}
                        </AdminButton>
                      </div>
                    </div>
                  </AdminCard>

                  {/* Edit Tanggal, Nama, Slug, Harga per Vote */}
                  <AdminCard className="space-y-4 p-4 sm:p-5">
                    <div>
                      <h3 className="font-manrope text-base font-semibold text-brand-900">
                        Detail dan jadwal kampanye
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Ubah nama, slug, harga per vote, atau rentang tanggal buka voting (WIB).
                      </p>
                    </div>
                    <form
                      key={`${selectedCampaign.id}:${selectedCampaign.version}`}
                      action={updateCampaign}
                      className="space-y-4"
                    >
                      <input type="hidden" name="campaignId" value={selectedCampaign.id} />
                      <input
                        type="hidden"
                        name="expectedVersion"
                        value={selectedCampaign.version}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <AdminField label="Nama kampanye">
                          <AdminInput name="name" defaultValue={selectedCampaign.name} required />
                        </AdminField>
                        <AdminField label="Slug">
                          <AdminInput name="slug" defaultValue={selectedCampaign.slug} required />
                        </AdminField>
                        <AdminField
                          label="Tahap sumber"
                          hint={
                            selectedCampaign.status !== "draft"
                              ? "Terkunci karena voting sudah dimulai"
                              : undefined
                          }
                        >
                          {selectedCampaign.status === "draft" ? (
                            <AdminSelect
                              name="eligibilityStageId"
                              defaultValue={selectedCampaign.eligibilityStageId ?? defaultStageId}
                              required
                              options={stages.map((stage) => ({
                                value: stage.id,
                                label: stage.name,
                              }))}
                            />
                          ) : (
                            <>
                              <input
                                type="hidden"
                                name="eligibilityStageId"
                                value={selectedCampaign.eligibilityStageId ?? ""}
                              />
                              <AdminInput
                                value={selectedCampaign.stageName ?? "Tahap belum dipilih"}
                                disabled
                              />
                            </>
                          )}
                        </AdminField>
                        <AdminField label="Harga per vote (Rp)">
                          <AdminInput
                            type="number"
                            min="1"
                            name="pricePerPoint"
                            defaultValue={selectedCampaign.pricePerPoint}
                            required
                          />
                        </AdminField>
                        <AdminField label="Mulai (WIB)">
                          <AdminInput
                            type="datetime-local"
                            name="startsAt"
                            defaultValue={localInputDateTime(selectedCampaign.startsAt)}
                            required
                          />
                        </AdminField>
                        <AdminField label="Selesai (WIB)">
                          <AdminInput
                            type="datetime-local"
                            name="endsAt"
                            defaultValue={localInputDateTime(selectedCampaign.endsAt)}
                            required
                          />
                        </AdminField>
                      </div>
                      <AdminButton type="submit" disabled={pending}>
                        <Check className="size-4" /> Simpan perubahan
                      </AdminButton>
                    </form>
                  </AdminCard>

                  {/* Hapus Kampanye */}
                  <AdminCard className="flex flex-col justify-between gap-3 border-destructive/30 p-4 sm:flex-row sm:items-center sm:p-5">
                    <div>
                      <h3 className="font-manrope text-base font-semibold text-destructive">
                        Hapus kampanye
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Menghapus kampanye akan menghapus snapshot peserta dan seluruh data voting
                        pada kampanye ini secara permanen.
                      </p>
                    </div>
                    <AdminButton
                      type="button"
                      variant="danger"
                      onClick={() => {
                        setConfirmation("");
                        setReason("");
                        setConfirmMode("delete");
                      }}
                      disabled={pending}
                      className="shrink-0"
                    >
                      <Trash2 className="size-4" /> Hapus kampanye
                    </AdminButton>
                  </AdminCard>
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <AdminEmptyState icon="calendar" title="Belum ada kampanye" />
      )}

      {/* Dialog: Kampanye Baru */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-manrope text-lg font-semibold text-brand-900">
              Kampanye baru
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Buat draf kampanye voting baru untuk edisi {currentEdition.year}.
            </DialogDescription>
          </DialogHeader>
          <form action={createCampaign} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label="Nama kampanye">
                <AdminInput
                  name="name"
                  placeholder={`STAR Voting ${currentEdition.year}`}
                  required
                />
              </AdminField>
              <AdminField label="Slug">
                <AdminInput
                  name="slug"
                  placeholder={`star-voting-${currentEdition.year}`}
                  required
                />
              </AdminField>
              <AdminField label="Tahap sumber">
                <AdminSelect
                  name="eligibilityStageId"
                  defaultValue={defaultStageId}
                  required
                  options={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
                />
              </AdminField>
              <AdminField label="Harga per vote (Rp)">
                <AdminInput type="number" min="1" name="pricePerPoint" placeholder="2000" required />
              </AdminField>
              <AdminField label="Mulai (WIB)">
                <AdminInput type="datetime-local" name="startsAt" required />
              </AdminField>
              <AdminField label="Selesai (WIB)">
                <AdminInput type="datetime-local" name="endsAt" required />
              </AdminField>
            </div>
            <DialogFooter className="gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <AdminButton type="submit" disabled={pending || stages.length === 0}>
                <CalendarPlus className="size-4" /> Buat draf
              </AdminButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Konfirmasi Mulai / Tutup / Hapus */}
      <AlertDialog open={confirmMode !== null} onOpenChange={(open) => !open && setConfirmMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmMode === "start"
                ? "Aktifkan voting"
                : confirmMode === "close"
                  ? "Nonaktifkan voting"
                  : "Hapus kampanye"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMode === "start"
                ? "Snapshot peserta dibuat sekali dan tidak berubah."
                : confirmMode === "close"
                  ? "Data voting tidak dapat diubah setelah voting dinonaktifkan."
                  : "Kampanye beserta data terkait akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AdminField label={`Ketik ${selectedCampaign?.name ?? "nama kampanye"}`}>
            <AdminInput
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </AdminField>
          <AdminField label="Alasan">
            <AdminTextarea value={reason} onChange={(event) => setReason(event.target.value)} />
          </AdminField>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmLifecycle();
              }}
              disabled={pending || !reason.trim() || confirmation !== selectedCampaign?.name}
              className={cn(
                (confirmMode === "close" || confirmMode === "delete") &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
            >
              {confirmMode === "start" ? (
                <Vote className="size-4" />
              ) : confirmMode === "close" ? (
                <Flag className="size-4" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {confirmMode === "start"
                ? "Aktifkan"
                : confirmMode === "close"
                  ? "Nonaktifkan"
                  : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
