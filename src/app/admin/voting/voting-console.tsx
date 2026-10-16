"use client";

import {
  CalendarPlus,
  Check,
  Eye,
  EyeOff,
  Flag,
  LockKeyhole,
  QrCode,
  Search,
  Vote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { calculateVotesFromAmount } from "@/lib/voting";
import { cn } from "@/lib/utils";
import type { AdminEditionContext } from "@/server/cms/context";

import {
  closeCampaignAction,
  createCampaignAction,
  saveTallyAction,
  setResultVisibilityAction,
  startCampaignAction,
  updateCampaignStageAction,
} from "./actions";

export type VotingCampaignSummary = {
  id: string;
  editionId: string;
  editionName: string;
  year: number;
  name: string;
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

function statusLabel(value: string) {
  if (value === "active") return "Aktif";
  if (value === "closed") return "Ditutup";
  return "Draf";
}

export function VotingConsole({
  currentEdition,
  campaigns: initialCampaigns,
  stages,
  participants,
  tallies,
  canManage,
  canTally,
}: {
  currentEdition: AdminEditionContext;
  campaigns: VotingCampaignSummary[];
  stages: VotingStageSummary[];
  participants: VotingParticipantSummary[];
  tallies: VotingTallySummary[];
  canManage: boolean;
  canTally: boolean;
}) {
  const router = useRouter();
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
  const tallyReadyParticipants = snapshotParticipants.filter((participant) => participant.qrisReady);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const selectedParticipant =
    tallyReadyParticipants.find((participant) => participant.id === selectedParticipantId) ??
    tallyReadyParticipants[0];
  const [selectedDate, setSelectedDate] = useState(
    selectedCampaign ? localInputDate(selectedCampaign.startsAt) : "",
  );
  const [stageId, setStageId] = useState(selectedCampaign?.eligibilityStageId ?? "");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"start" | "close" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [visibilityReason, setVisibilityReason] = useState("");

  const campaignTallies = tallies.filter((tally) => tally.campaignId === selectedCampaign?.id);
  const participantTotals = new Map<string, number>();
  for (const tally of campaignTallies) {
    participantTotals.set(tally.participantId, (participantTotals.get(tally.participantId) ?? 0) + tally.amount);
  }
  const currentTally = campaignTallies.find(
    (tally) => tally.participantId === selectedParticipant?.id && tally.localDate === selectedDate,
  );
  const standings = snapshotParticipants
    .filter((participant) => participant.name.toLowerCase().includes(query.toLowerCase()))
    .map((participant) => {
      const amount = participantTotals.get(participant.id) ?? 0;
      return {
        ...participant,
        amount,
        votes: selectedCampaign
          ? calculateVotesFromAmount(amount, selectedCampaign.pricePerPoint)
          : 0,
      };
    })
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, "id"));

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
    setSelectedDate(campaign ? localInputDate(campaign.startsAt) : "");
    setQuery("");
  }

  async function createCampaign(formData: FormData) {
    setPending(true);
    try {
      await createCampaignAction(formData);
      toast.success("Kampanye draf dibuat");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kampanye gagal dibuat");
    } finally {
      setPending(false);
    }
  }

  async function saveStage() {
    if (!selectedCampaign || !stageId) return;
    setPending(true);
    try {
      const result = await updateCampaignStageAction({
        campaignId: selectedCampaign.id,
        stageId,
        expectedVersion: selectedCampaign.version,
      });
      const stage = stages.find((item) => item.id === stageId);
      replaceCampaign({ version: result.version, eligibilityStageId: stageId, stageName: stage?.name ?? null });
      toast.success("Tahap sumber disimpan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tahap sumber gagal disimpan");
    } finally {
      setPending(false);
    }
  }

  async function confirmLifecycle() {
    if (!selectedCampaign || !confirmMode) return;
    setPending(true);
    try {
      if (confirmMode === "start") {
        const result = await startCampaignAction({
          campaignId: selectedCampaign.id,
          expectedVersion: selectedCampaign.version,
          confirmation,
          reason,
        });
        replaceCampaign({ version: result.version, status: "active", startedAt: new Date().toISOString() });
        toast.success(`Voting dimulai untuk ${result.snapshotCount} peserta`);
      } else {
        const result = await closeCampaignAction({
          campaignId: selectedCampaign.id,
          expectedVersion: selectedCampaign.version,
          confirmation,
          reason,
        });
        replaceCampaign({ version: result.version, status: "closed", closedAt: new Date().toISOString() });
        toast.success("Voting ditutup");
      }
      setConfirmMode(null);
      setConfirmation("");
      setReason("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status voting gagal diubah");
    } finally {
      setPending(false);
    }
  }

  async function toggleVisibility() {
    if (!selectedCampaign) return;
    const currentVisibility = selectedCampaign.resultVisibility;
    const normalizeLegacyValue = currentVisibility !== "visible" && currentVisibility !== "hidden";
    const visibility = currentVisibility === "hidden" ? "visible" : "hidden";
    setPending(true);
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
            ? "Hasil ditampilkan"
            : "Hasil disembunyikan",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Visibilitas hasil gagal diubah");
    } finally {
      setPending(false);
    }
  }

  async function saveTally(formData: FormData) {
    setPending(true);
    try {
      await saveTallyAction(formData);
      toast.success("Tally disimpan");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tally gagal disimpan");
    } finally {
      setPending(false);
    }
  }

  const defaultStageId = stages.find((stage) => stage.finalStage)?.id ?? stages[0]?.id ?? "";

  return (
    <div className="space-y-6">
      {canManage ? (
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card">
          <AccordionItem value="create-campaign">
          <AccordionTrigger className="items-center p-4 font-manrope text-base font-semibold text-brand-900 hover:no-underline">
            <span className="flex items-center gap-2"><CalendarPlus className="size-5 text-brand" />Kampanye baru</span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
          <form action={createCampaign} className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminField label="Nama kampanye">
              <AdminInput name="name" placeholder={`Voting favorit ${currentEdition.year}`} required />
            </AdminField>
            <AdminField label="Slug">
              <AdminInput name="slug" placeholder={`voting-favorit-${currentEdition.year}`} required />
            </AdminField>
            <AdminField label="Tahap sumber">
              <AdminSelect
                name="eligibilityStageId"
                defaultValue={defaultStageId}
                required
                options={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
              />
            </AdminField>
            <AdminField label="Harga per vote">
              <AdminInput type="number" min="1" name="pricePerPoint" placeholder="2000" required />
            </AdminField>
            <AdminField label="Mulai, WIB">
              <AdminInput type="datetime-local" name="startsAt" required />
            </AdminField>
            <AdminField label="Selesai, WIB">
              <AdminInput type="datetime-local" name="endsAt" required />
            </AdminField>
            <AdminButton type="submit" disabled={pending || stages.length === 0} className="sm:col-span-2 xl:col-span-3">
              <CalendarPlus className="size-4" /> Buat draf
            </AdminButton>
          </form>
          </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      {selectedCampaign ? (
        <div className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
          <AdminCard className="h-fit p-3 sm:p-3">
            <p className="px-2 pb-2 font-manrope text-sm font-semibold">Kampanye</p>
            {campaigns.map((campaign) => (
              <Button
                key={campaign.id}
                type="button"
                variant="ghost"
                onClick={() => chooseCampaign(campaign.id)}
                className={cn(
                  "h-auto w-full justify-start rounded-md px-2 py-3 text-left",
                  campaign.id === selectedCampaign.id && "bg-brand-50 text-brand-900",
                )}
              >
                <span>
                  <span className="block font-manrope text-sm font-semibold">{campaign.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{statusLabel(campaign.status)}</span>
                </span>
              </Button>
            ))}
          </AdminCard>

          <div className="min-w-0 space-y-6">
            <AdminCard className="space-y-5 p-5 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-highlight-700">{selectedCampaign.stageName ?? "Tahap belum dipilih"}</p>
                  <h2 className="mt-1 font-manrope text-2xl font-semibold">{selectedCampaign.name}</h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {date.format(new Date(selectedCampaign.startsAt))} sampai {date.format(new Date(selectedCampaign.endsAt))}
                  </p>
                </div>
                <AdminBadge value={statusLabel(selectedCampaign.status)} />
              </div>

              <div className="grid gap-3 border-y border-border py-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Snapshot peserta</p>
                  <p className="mt-0.5 font-manrope text-xl font-semibold">{snapshotParticipants.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">QRIS siap</p>
                  <p className="mt-0.5 font-manrope text-xl font-semibold">{tallyReadyParticipants.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hasil</p>
                  <p className="mt-0.5 font-manrope text-sm font-semibold">
                    {selectedCampaign.resultVisibility === "visible"
                      ? "Ditampilkan"
                      : "Disembunyikan"}
                  </p>
                </div>
              </div>

              {canManage ? (
                <div className="grid gap-4 border-t border-border pt-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <AdminField label="Tahap sumber">
                      <AdminSelect
                        value={stageId}
                        onValueChange={setStageId}
                        disabled={selectedCampaign.status !== "draft" || pending}
                        options={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
                      />
                    </AdminField>
                    {selectedCampaign.status === "draft" ? (
                      <div className="flex gap-2">
                        <AdminButton type="button" variant="secondary" onClick={saveStage} disabled={pending || !stageId}>
                          <Check className="size-4" /> Simpan tahap
                        </AdminButton>
                        <AdminButton type="button" onClick={() => setConfirmMode("start")} disabled={pending}>
                          <Vote className="size-4" /> Mulai voting
                        </AdminButton>
                      </div>
                    ) : selectedCampaign.status === "active" ? (
                      <AdminButton type="button" variant="danger" onClick={() => setConfirmMode("close")} disabled={pending}>
                        <LockKeyhole className="size-4" /> Tutup voting
                      </AdminButton>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <AdminField label="Alasan visibilitas">
                      <AdminTextarea
                        value={visibilityReason}
                        onChange={(event) => setVisibilityReason(event.target.value)}
                        placeholder="Contoh: Hasil siap diumumkan"
                        disabled={pending}
                      />
                    </AdminField>
                    <AdminButton type="button" variant="secondary" onClick={toggleVisibility} disabled={pending || !visibilityReason.trim()}>
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
              ) : null}
            </AdminCard>

            {selectedCampaign.status === "active" && canTally && selectedParticipant ? (
              <AdminCard className="space-y-4 p-5 sm:p-5">
                <h3 className="font-manrope text-lg font-semibold">Tally harian</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Peserta">
                    <AdminSelect
                      value={selectedParticipant.id}
                      onValueChange={setSelectedParticipantId}
                      options={tallyReadyParticipants.map((participant) => ({
                        value: participant.id,
                        label: `${participant.categoryCode} ${participant.number}, ${participant.name}`,
                      }))}
                    />
                  </AdminField>
                  <AdminField label="Tanggal">
                    <AdminInput
                      type="date"
                      min={localInputDate(selectedCampaign.startsAt)}
                      max={localInputDate(selectedCampaign.endsAt)}
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                    />
                  </AdminField>
                </div>
                <form
                  key={`${selectedCampaign.id}:${selectedParticipant.id}:${selectedDate}:${currentTally?.version ?? 0}`}
                  action={saveTally}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <input type="hidden" name="campaignId" value={selectedCampaign.id} />
                  <input type="hidden" name="participantId" value={selectedParticipant.id} />
                  <input type="hidden" name="localDate" value={selectedDate} />
                  <input type="hidden" name="version" value={currentTally?.version ?? 0} />
                  <AdminField label="Nominal pemasukan">
                    <AdminInput name="amount" type="number" min="0" step="1" defaultValue={currentTally?.amount ?? 0} required />
                  </AdminField>
                  <AdminField label="Alasan perubahan">
                    <AdminTextarea name="reason" placeholder="Contoh: Rekap merchant pukul 16.00 WIB" required />
                  </AdminField>
                  <AdminButton type="submit" disabled={pending} className="sm:col-span-2">
                    <Check className="size-4" /> Simpan tally
                  </AdminButton>
                </form>
              </AdminCard>
            ) : selectedCampaign.status === "active" && canTally ? (
              <AdminEmptyState icon="gallery" title="QRIS belum siap" />
            ) : null}

            <AdminCard className="space-y-4 p-5 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="font-manrope text-lg font-semibold">Rekap peserta</h3>
                </div>
                <label className="relative block w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <AdminInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari peserta" className="pl-9" />
                </label>
              </div>
              {standings.length === 0 ? (
                <AdminEmptyState icon="users" title="Belum ada peserta" />
              ) : (
                <div className="divide-y divide-border">
                  {standings.map((participant, index) => (
                    <div key={participant.id} className="grid gap-2 py-3 sm:grid-cols-[2rem_minmax(0,1fr)_auto_auto] sm:items-center">
                      <span className="text-xs font-semibold text-highlight-700">{index + 1}</span>
                      <div>
                        <p className="font-manrope text-sm font-semibold">{participant.name}</p>
                        <p className="text-xs text-muted-foreground">{participant.categoryCode} {participant.number}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <QrCode className={cn("size-4", participant.qrisReady ? "text-brand" : "text-destructive")} />
                        {participant.qrisReady ? "Siap" : "Belum"}
                      </span>
                      <div className="sm:text-right">
                        <p className="font-manrope text-base font-semibold">{participant.votes.toLocaleString("id-ID")}</p>
                        <p className="text-xs text-muted-foreground">{currency.format(participant.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          </div>
        </div>
      ) : (
        <AdminEmptyState icon="calendar" title="Belum ada kampanye" />
      )}

      <AlertDialog open={confirmMode !== null} onOpenChange={(open) => !open && setConfirmMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmMode === "start" ? "Mulai voting" : "Tutup voting"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMode === "start"
                ? "Snapshot peserta dibuat sekali dan tidak berubah."
                : "Tally tidak dapat diubah setelah voting ditutup."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AdminField label={`Ketik ${selectedCampaign?.name ?? "nama kampanye"}`}>
            <AdminInput value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
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
              className={cn(confirmMode === "close" && "bg-destructive text-destructive-foreground")}
            >
              {confirmMode === "start" ? <Vote className="size-4" /> : <Flag className="size-4" />}
              {confirmMode === "start" ? "Mulai" : "Tutup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
