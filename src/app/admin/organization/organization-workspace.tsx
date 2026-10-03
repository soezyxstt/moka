"use client";

import {
  Calendar,
  ChevronRight,
  Edit2,
  Layers,
  Link2,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { AdminMediaField, type MediaAssetSummary } from "@/components/admin/media-picker";
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
import { adminNativeScrollbarClassName } from "@/components/admin/admin-scroll-area";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  createPeriodAction,
  deletePeriodAction,
  deletePersonAction,
  mapLegacyAssignmentAction,
  savePersonAction,
  updatePeriodAction,
} from "./actions";
import type { PeriodLifecycle, SocialPlatform } from "@/server/db/schema";

export type PeriodItem = {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  vision: string | null;
  missionJson: string;
  lifecycle: PeriodLifecycle;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  connectedEditionsCount: number;
  unitCount: number;
  memberCount: number;
};

export type SocialLinkItem = {
  id: string;
  platform: SocialPlatform;
  label: string | null;
  url: string;
  displayOrder: number;
};

export type PersonItem = {
  id: string;
  name: string;
  slug: string;
  shortBio: string | null;
  portraitMediaId: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  portraitAsset: MediaAssetSummary | null;
  socialLinks: SocialLinkItem[];
  membershipCount: number;
};

export type LegacyAssignmentItem = {
  id: string;
  editionId: string | null;
  personId: string;
  personName: string;
  title: string;
  group: string;
  termLabel: string | null;
  displayOrder: number;
  active: boolean;
  isMapped: boolean;
};

export type UnitOption = {
  id: string;
  periodId: string;
  name: string;
};

export type OrganizationWorkspaceProps = {
  periods: PeriodItem[];
  peopleList: PersonItem[];
  legacyAssignments: LegacyAssignmentItem[];
  allUnits: UnitOption[];
  canEdit?: boolean;
  canManageMedia?: boolean;
};

const SOCIAL_PLATFORMS_LIST: { value: SocialPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X / Twitter" },
  { value: "website", label: "Website" },
  { value: "other", label: "Lainnya" },
];

export function OrganizationWorkspace({
  periods,
  peopleList,
  legacyAssignments,
  allUnits,
  canEdit = false,
  canManageMedia = false,
}: OrganizationWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"periods" | "people" | "legacy">("periods");
  const [isPending, startTransition] = useTransition();

  // -------------------------------------------------------------------------
  // State: Periode Kepengurusan
  // -------------------------------------------------------------------------
  const [isPeriodSheetOpen, setIsPeriodSheetOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodItem | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<PeriodItem | null>(null);

  const [periodLabel, setPeriodLabel] = useState("");
  const [periodStartYear, setPeriodStartYear] = useState(new Date().getFullYear());
  const [periodEndYear, setPeriodEndYear] = useState(new Date().getFullYear() + 3);
  const [periodVision, setPeriodVision] = useState("");
  const [periodMissions, setPeriodMissions] = useState<string[]>([""]);
  const [periodLifecycle, setPeriodLifecycle] = useState<PeriodLifecycle>("draft");

  const openCreatePeriod = () => {
    setEditingPeriod(null);
    setPeriodLabel(`Periode ${new Date().getFullYear()} - ${new Date().getFullYear() + 3}`);
    setPeriodStartYear(new Date().getFullYear());
    setPeriodEndYear(new Date().getFullYear() + 3);
    setPeriodVision("");
    setPeriodMissions([""]);
    setPeriodLifecycle("draft");
    setIsPeriodSheetOpen(true);
  };

  const openEditPeriod = (period: PeriodItem) => {
    if (period.lifecycle === "archived") return;
    setEditingPeriod(period);
    setPeriodLabel(period.label);
    setPeriodStartYear(period.startYear);
    setPeriodEndYear(period.endYear);
    setPeriodVision(period.vision ?? "");
    try {
      const parsed = JSON.parse(period.missionJson);
      setPeriodMissions(Array.isArray(parsed) && parsed.length > 0 ? parsed : [""]);
    } catch {
      setPeriodMissions([""]);
    }
    setPeriodLifecycle(period.lifecycle);
    setIsPeriodSheetOpen(true);
  };

  const handleSavePeriod = () => {
    if (!periodLabel.trim()) {
      toast.error("Label periode wajib diisi");
      return;
    }
    if (periodStartYear > periodEndYear) {
      toast.error("Tahun mulai tidak boleh melebihi tahun selesai");
      return;
    }

    const cleanedMissions = periodMissions.map((m) => m.trim()).filter(Boolean);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("label", periodLabel.trim());
        formData.append("startYear", String(periodStartYear));
        formData.append("endYear", String(periodEndYear));
        formData.append("vision", periodVision.trim());
        formData.append("missionJson", JSON.stringify(cleanedMissions));
        formData.append("lifecycle", periodLifecycle);

        if (editingPeriod) {
          formData.append("id", editingPeriod.id);
          formData.append("version", String(editingPeriod.version));
          await updatePeriodAction(formData);
          toast.success("Periode kepengurusan berhasil diperbarui");
        } else {
          await createPeriodAction(formData);
          toast.success("Periode kepengurusan baru berhasil dibuat");
        }
        setIsPeriodSheetOpen(false);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan periode");
      }
    });
  };

  const handleDeletePeriod = () => {
    if (!deletingPeriod) return;
    if (deletingPeriod.lifecycle !== "draft") {
      toast.error("Periode aktif atau arsip tidak dapat dihapus");
      return;
    }
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", deletingPeriod.id);
        formData.append("version", String(deletingPeriod.version));
        await deletePeriodAction(formData);
        toast.success("Periode kepengurusan berhasil dihapus");
        setDeletingPeriod(null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus periode");
      }
    });
  };

  // -------------------------------------------------------------------------
  // State: Direktori Profil
  // -------------------------------------------------------------------------
  const [peopleSearch, setPeopleSearch] = useState("");
  const [isPersonSheetOpen, setIsPersonSheetOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonItem | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<PersonItem | null>(null);

  const [personName, setPersonName] = useState("");
  const [personSlug, setPersonSlug] = useState("");
  const [personShortBio, setPersonShortBio] = useState("");
  const [personPortraitAsset, setPersonPortraitAsset] = useState<MediaAssetSummary | null>(null);
  const [personSocials, setPersonSocials] = useState<
    { platform: SocialPlatform; label: string; url: string }[]
  >([]);

  const filteredPeople = useMemo(() => {
    const q = peopleSearch.toLowerCase().trim();
    if (!q) return peopleList;
    return peopleList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.shortBio && p.shortBio.toLowerCase().includes(q))
    );
  }, [peopleList, peopleSearch]);

  const openCreatePerson = () => {
    setEditingPerson(null);
    setPersonName("");
    setPersonSlug("");
    setPersonShortBio("");
    setPersonPortraitAsset(null);
    setPersonSocials([]);
    setIsPersonSheetOpen(true);
  };

  const openEditPerson = (person: PersonItem) => {
    setEditingPerson(person);
    setPersonName(person.name);
    setPersonSlug(person.slug);
    setPersonShortBio(person.shortBio ?? "");
    setPersonPortraitAsset(person.portraitAsset);
    setPersonSocials(
      person.socialLinks.map((s) => ({
        platform: s.platform,
        label: s.label ?? "",
        url: s.url,
      }))
    );
    setIsPersonSheetOpen(true);
  };

  const handleSavePerson = () => {
    if (!personName.trim()) {
      toast.error("Nama lengkap profil wajib diisi");
      return;
    }

    // Validate social links
    for (const s of personSocials) {
      const trimmedUrl = s.url.trim();
      if (trimmedUrl) {
        if (!trimmedUrl.startsWith("https://")) {
          toast.error("Tautan sosial media harus diawali dengan https://");
          return;
        }
        if (s.platform === "other" && !s.label.trim()) {
          toast.error("Label platform lainnya wajib diisi");
          return;
        }
      }
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", personName.trim());
        if (personSlug.trim()) formData.append("slug", personSlug.trim());
        if (personShortBio.trim()) formData.append("shortBio", personShortBio.trim());
        formData.append("portraitMediaId", personPortraitAsset?.id ?? "");

        const validSocials = personSocials
          .filter((s) => s.url.trim().length > 0)
          .map((s, idx) => ({
            platform: s.platform,
            label: s.label.trim() || null,
            url: s.url.trim(),
            displayOrder: idx,
          }));

        formData.append("socialLinks", JSON.stringify(validSocials));

        if (editingPerson) {
          formData.append("id", editingPerson.id);
          formData.append("version", String(editingPerson.version));
        }

        await savePersonAction(formData);
        toast.success(editingPerson ? "Profil berhasil diperbarui" : "Profil baru berhasil ditambahkan");
        setIsPersonSheetOpen(false);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan profil");
      }
    });
  };

  const handleDeletePerson = () => {
    if (!deletingPerson) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", deletingPerson.id);
        formData.append("version", String(deletingPerson.version));
        await deletePersonAction(formData);
        toast.success("Profil berhasil dihapus dari direktori");
        setDeletingPerson(null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus profil");
      }
    });
  };

  // -------------------------------------------------------------------------
  // State: Pemetaan Data Legacy
  // -------------------------------------------------------------------------
  const [mappingAssignment, setMappingAssignment] = useState<LegacyAssignmentItem | null>(null);
  const [mapTargetPeriodId, setMapTargetPeriodId] = useState<string>("");
  const [mapTargetUnitId, setMapTargetUnitId] = useState<string>("");
  const [mapTargetTitle, setMapTargetTitle] = useState<string>("");

  const unmappedCount = useMemo(() => {
    return legacyAssignments.filter((l) => !l.isMapped).length;
  }, [legacyAssignments]);

  const availableUnitsForPeriod = useMemo(() => {
    if (!mapTargetPeriodId) return [];
    return allUnits.filter((u) => u.periodId === mapTargetPeriodId);
  }, [allUnits, mapTargetPeriodId]);

  const openMapDialog = (legacy: LegacyAssignmentItem) => {
    setMappingAssignment(legacy);
    setMapTargetTitle(legacy.title);
    if (periods.length > 0) {
      setMapTargetPeriodId(periods[0].id);
      const units = allUnits.filter((u) => u.periodId === periods[0].id);
      if (units.length > 0) {
        setMapTargetUnitId(units[0].id);
      } else {
        setMapTargetUnitId("");
      }
    }
  };

  const handleConfirmMap = () => {
    if (!mappingAssignment || !mapTargetPeriodId || !mapTargetUnitId) {
      toast.error("Periode dan unit tujuan wajib dipilih");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("legacyAssignmentId", mappingAssignment.id);
        formData.append("periodId", mapTargetPeriodId);
        formData.append("unitId", mapTargetUnitId);
        formData.append("personId", mappingAssignment.personId);
        formData.append("title", mapTargetTitle.trim() || mappingAssignment.title);

        await mapLegacyAssignmentAction(formData);
        toast.success(`Berhasil memetakan "${mappingAssignment.title}" ke kepengurusan modern`);
        setMappingAssignment(null);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal memetakan penugasan");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-2">
        <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Bagian kepengurusan">
          <Button
            type="button"
            variant="ghost"
            size="default"
            role="tab"
            aria-selected={activeTab === "periods"}
            onClick={() => setActiveTab("periods")}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:px-4",
              activeTab === "periods"
                ? "bg-dgb text-white shadow-xs"
                : "text-muted-foreground hover:bg-dgb-50 hover:text-dgb-900"
            )}
          >
            <Calendar size={16} />
            <span>Periode kepengurusan</span>
            <span className={cn("ml-1 rounded-sm px-2 py-0.5 text-xs font-bold", activeTab === "periods" ? "bg-white/20 text-white" : "bg-muted text-foreground")}>
              {periods.length}
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="default"
            role="tab"
            aria-selected={activeTab === "people"}
            onClick={() => setActiveTab("people")}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:px-4",
              activeTab === "people"
                ? "bg-dgb text-white shadow-xs"
                : "text-muted-foreground hover:bg-dgb-50 hover:text-dgb-900"
            )}
          >
            <Users size={16} />
            <span>Direktori profil</span>
            <span className={cn("ml-1 rounded-sm px-2 py-0.5 text-xs font-bold", activeTab === "people" ? "bg-white/20 text-white" : "bg-muted text-foreground")}>
              {peopleList.length}
            </span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="default"
            role="tab"
            aria-selected={activeTab === "legacy"}
            onClick={() => setActiveTab("legacy")}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:px-4",
              activeTab === "legacy"
                ? "bg-dgb text-white shadow-xs"
                : "text-muted-foreground hover:bg-dgb-50 hover:text-dgb-900"
            )}
          >
            <Layers size={16} />
            <span>Perlu dipetakan</span>
            {unmappedCount > 0 ? (
              <span className={cn("ml-1 rounded-sm px-2 py-0.5 text-xs font-bold", activeTab === "legacy" ? "bg-fb text-white" : "bg-fb-100 text-fb-800")}>
                {unmappedCount}
              </span>
            ) : null}
          </Button>
        </div>

        {activeTab === "periods" && canEdit ? (
          <AdminButton onClick={openCreatePeriod} className="gap-1.5 text-xs">
            <Plus size={14} /> Tambah periode
          </AdminButton>
        ) : activeTab === "people" && canEdit ? (
          <AdminButton onClick={openCreatePerson} className="gap-1.5 text-xs">
            <UserPlus size={14} /> Tambah profil
          </AdminButton>
        ) : null}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERIODE KEPENGURUSAN */}
      {/* ========================================================================= */}
      {activeTab === "periods" && (
        <div className="space-y-4">
          {periods.length === 0 ? (
            <AdminCard padding="none">
              <div className="p-8">
                <AdminEmptyState
                  icon="building"
                  title="Belum ada periode kepengurusan"
                  description="Buat periode pertama untuk mulai menyusun kepengurusan."
                />
                {canEdit ? (
                  <div className="mt-4 flex justify-center">
                    <AdminButton onClick={openCreatePeriod} className="gap-2">
                      <Plus size={15} /> Buat periode pertama
                    </AdminButton>
                  </div>
                ) : null}
              </div>
            </AdminCard>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {periods.map((p) => {
                const canEditPeriod = canEdit && p.lifecycle !== "archived";
                const canDeletePeriod = canEdit && p.lifecycle === "draft";
                return (
                  <AdminCard
                    key={p.id}
                    className="flex flex-col justify-between transition-shadow hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <AdminBadge value={p.lifecycle} />
                          <h3 className="mt-2.5 font-montserrat text-lg font-bold text-dgb-900">
                            {p.label}
                          </h3>
                          <p className="text-xs font-semibold text-fb-700">
                            Tahun {p.startYear} - {p.endYear}
                          </p>
                          {p.lifecycle === "archived" ? (
                            <p className="mt-1 text-xs text-muted-foreground">Periode arsip hanya dapat dilihat.</p>
                          ) : null}
                        </div>
                        {canEditPeriod || canDeletePeriod ? (
                          <div className="flex items-center gap-1">
                            {canEditPeriod ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditPeriod(p)}
                                className="size-7 rounded-md p-0 text-muted-foreground hover:bg-dgb-50 hover:text-dgb-900"
                                title="Edit metadata periode"
                              >
                                <Edit2 size={14} />
                              </Button>
                            ) : null}
                            {canDeletePeriod ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingPeriod(p)}
                                className="size-7 rounded-md p-0 text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                                title="Hapus periode draft"
                              >
                                <Trash2 size={14} />
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      {p.vision ? (
                        <div className="mt-3.5 rounded-lg bg-dgb-50/40 p-3 text-xs text-dgb-900">
                          <p className="font-semibold text-dgb">Visi:</p>
                          <p className="mt-1 line-clamp-2 text-muted-foreground">{p.vision}</p>
                        </div>
                      ) : null}

                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-xs">
                        <div className="rounded-md bg-muted/40 p-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Unit</p>
                          <p className="font-montserrat text-sm font-bold text-dgb-900">{p.unitCount}</p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pengurus</p>
                          <p className="font-montserrat text-sm font-bold text-dgb-900">{p.memberCount}</p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Edisi</p>
                          <p className="font-montserrat text-sm font-bold text-dgb-900">{p.connectedEditionsCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-border pt-3">
                      <Button
                        asChild
                        className="h-auto w-full justify-between rounded-md bg-dgb px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-dgb-600"
                      >
                        <Link href={`/admin/organization/periods/${p.id}`}>
                          <span>Kelola struktur unit dan pengurus</span>
                          <ChevronRight size={14} />
                        </Link>
                      </Button>
                    </div>
                  </AdminCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DIREKTORI PROFIL */}
      {/* ========================================================================= */}
      {activeTab === "people" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <AdminInput
                placeholder="Cari nama atau bio profil..."
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Menampilkan {filteredPeople.length} dari {peopleList.length} profil
            </p>
          </div>

          {filteredPeople.length === 0 ? (
            <AdminCard padding="none">
              <div className="p-8">
                <AdminEmptyState
                  icon="users"
                  title="Profil tidak ditemukan"
                  description="Tidak ada profil orang yang sesuai dengan kata kunci pencarian."
                />
              </div>
            </AdminCard>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredPeople.map((person) => (
                <AdminCard
                  key={person.id}
                  className="flex flex-col justify-between p-4 transition-shadow hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-dgb-200 bg-muted">
                        {person.portraitAsset ? (
                          <Image
                            src={person.portraitAsset.url}
                            alt={person.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="grid size-full place-items-center bg-dgb-50 text-dgb-700">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-montserrat text-sm font-bold text-dgb-900" title={person.name}>
                          {person.name}
                        </h4>
                        <p className="truncate text-[11px] text-muted-foreground font-mono">@{person.slug}</p>
                        {person.membershipCount > 0 ? (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-sm bg-dgb-50 px-1.5 py-0.5 text-[10px] font-semibold text-dgb-800">
                            <UserCheck size={11} /> {person.membershipCount} jabatan
                          </span>
                        ) : (
                          <span className="mt-1 inline-block text-[10px] text-muted-foreground">
                            Belum bertugas
                          </span>
                        )}
                      </div>
                    </div>

                    {person.shortBio ? (
                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {person.shortBio}
                      </p>
                    ) : null}

                    {person.socialLinks.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {person.socialLinks.map((s) => (
                          <a
                            key={s.id}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground transition-colors hover:border-dgb-300 hover:bg-dgb-50 hover:text-dgb-900"
                          >
                            <Link2 size={10} />
                            <span>{s.label || s.platform}</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {canEdit ? (
                    <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-border pt-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditPerson(person)}
                        className="h-7 px-2.5 text-xs border-dgb-200 text-dgb hover:bg-dgb-50"
                      >
                        <Edit2 size={12} className="mr-1" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingPerson(person)}
                        className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ) : null}
                </AdminCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DATA PERLU DIPETAKAN (LEGACY) */}
      {/* ========================================================================= */}
      {activeTab === "legacy" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
            <p className="font-semibold">Pemetaan data lama</p>
            <p className="mt-1 leading-relaxed">
              Hubungkan penugasan lama ke periode dan unit tanpa menghapus riwayatnya.
            </p>
          </div>

          {legacyAssignments.length === 0 ? (
            <AdminCard padding="none">
              <div className="p-8">
                <AdminEmptyState
                  icon="building"
                  title="Tidak ada data lama"
                  description="Semua penugasan sudah dipetakan."
                />
              </div>
            </AdminCard>
          ) : (
            <AdminCard padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Nama pengurus</TableHead>
                      <TableHead>Jabatan lama</TableHead>
                      <TableHead>Kelompok</TableHead>
                      <TableHead>Masa jabatan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {legacyAssignments.map((legacy) => (
                      <TableRow key={legacy.id}>
                        <TableCell className="font-semibold text-dgb-900">{legacy.personName}</TableCell>
                        <TableCell className="font-medium text-foreground">{legacy.title}</TableCell>
                        <TableCell className="text-muted-foreground">{legacy.group}</TableCell>
                        <TableCell className="text-muted-foreground">{legacy.termLabel || "-"}</TableCell>
                        <TableCell>
                          {legacy.isMapped ? (
                            <Badge variant="outline" className="gap-1 rounded-md border-emerald-200 bg-emerald-50 text-emerald-800">
                              <UserCheck size={12} /> Sudah dipetakan
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="rounded-md border-amber-200 bg-amber-50 text-amber-800">
                              Perlu dipetakan
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit ? (
                            <AdminButton
                              onClick={() => openMapDialog(legacy)}
                              className="h-7 px-3 text-xs"
                            >
                              Petakan
                            </AdminButton>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AdminCard>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHEET: BUAT / EDIT PERIODE */}
      {/* ========================================================================= */}
      <Sheet open={isPeriodSheetOpen} onOpenChange={setIsPeriodSheetOpen}>
        <SheetContent side="right" className={cn("w-full sm:max-w-lg overflow-y-auto", adminNativeScrollbarClassName)}>
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="font-montserrat text-lg font-bold text-dgb-900">
              {editingPeriod ? "Edit Periode Kepengurusan" : "Buat Periode Baru"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Atur masa bakti dan arah organisasi.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <AdminField label="Label periode" hint="Contoh: Periode 2024 - 2027">
              <AdminInput
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="Periode 2024 - 2027"
              />
            </AdminField>

            <div className="grid grid-cols-2 gap-3">
              <AdminField label="Tahun mulai">
                <AdminInput
                  type="number"
                  value={periodStartYear}
                  onChange={(e) => setPeriodStartYear(Number(e.target.value))}
                />
              </AdminField>
              <AdminField label="Tahun selesai">
                <AdminInput
                  type="number"
                  value={periodEndYear}
                  onChange={(e) => setPeriodEndYear(Number(e.target.value))}
                />
              </AdminField>
            </div>

            <AdminField label="Status siklus periode">
              <AdminSelect
                value={periodLifecycle}
                onValueChange={(nextLifecycle) => setPeriodLifecycle(nextLifecycle as PeriodLifecycle)}
                options={[
                  { value: "draft", label: "Draft (Konseptual)" },
                  { value: "active", label: "Active (Sedang Berjalan)" },
                  { value: "archived", label: "Archived (Arsip / Demisioner)" },
                ]}
              />
            </AdminField>

            <AdminField label="Visi organisasi">
              <AdminTextarea
                value={periodVision}
                onChange={(e) => setPeriodVision(e.target.value)}
                placeholder="Tuliskan visi kepengurusan pada periode ini..."
                className="min-h-20"
              />
            </AdminField>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Daftar Misi Organisasi</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPeriodMissions([...periodMissions, ""])}
                  className="h-auto rounded-none px-0 py-0 text-xs font-semibold text-dgb hover:underline"
                >
                  <Plus size={13} /> Tambah misi
                </Button>
              </div>
              <div className="space-y-2">
                {periodMissions.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-dgb-50 text-[11px] font-bold text-dgb">
                      {idx + 1}
                    </span>
                    <AdminInput
                      value={m}
                      onChange={(e) => {
                        const updated = [...periodMissions];
                        updated[idx] = e.target.value;
                        setPeriodMissions(updated);
                      }}
                      placeholder={`Poin misi ke-${idx + 1}`}
                      className="text-xs"
                    />
                    {periodMissions.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPeriodMissions(periodMissions.filter((_, i) => i !== idx))}
                        className="size-7 rounded-md p-0 text-muted-foreground hover:text-rose-600"
                        title="Hapus poin misi"
                      >
                        <Trash2 size={14} />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPeriodSheetOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <AdminButton disabled={isPending} onClick={handleSavePeriod} className="text-xs">
              {isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {editingPeriod ? "Simpan perubahan" : "Buat periode"}
            </AdminButton>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* SHEET: BUAT / EDIT PROFIL ORANG */}
      {/* ========================================================================= */}
      <Sheet open={isPersonSheetOpen} onOpenChange={setIsPersonSheetOpen}>
        <SheetContent side="right" className={cn("w-full sm:max-w-lg overflow-y-auto", adminNativeScrollbarClassName)}>
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="font-montserrat text-lg font-bold text-dgb-900">
              {editingPerson ? "Edit Profil Orang" : "Tambah Profil Baru"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Profil yang tersimpan di sini dapat ditugaskan ke kepengurusan global dan kepanitiaan edisi.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <AdminField label="Nama lengkap">
              <AdminInput
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Contoh: Rian Hardiansyah, S.Pd."
              />
            </AdminField>

            <AdminField label="Slug URL (Opsional)" hint="Dibuat otomatis dari nama jika dikosongkan">
              <AdminInput
                value={personSlug}
                onChange={(e) => setPersonSlug(e.target.value)}
                placeholder="rian-hardiansyah"
              />
            </AdminField>

            <AdminField label="Foto portrait profil">
              <AdminMediaField
                name="portraitMediaId"
                acceptType="image"
                aspectRatioHint="3:4 atau 1:1"
                initialAsset={personPortraitAsset}
                canManageMedia={canManageMedia}
                onChange={(asset) => setPersonPortraitAsset(asset)}
              />
            </AdminField>

            <AdminField label="Bio singkat">
              <AdminTextarea
                value={personShortBio}
                onChange={(e) => setPersonShortBio(e.target.value)}
                placeholder="Tuliskan latar belakang, profesi, atau catatan singkat..."
                className="min-h-20"
              />
            </AdminField>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Tautan Sosial Media</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPersonSocials([
                      ...personSocials,
                      { platform: "instagram", label: "", url: "" },
                    ])
                  }
                  className="h-auto rounded-none px-0 py-0 text-xs font-semibold text-dgb hover:underline"
                >
                  <Plus size={13} /> Tambah sosmed
                </Button>
              </div>

              {personSocials.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">Belum ada akun sosial media ditambahkan.</p>
              ) : (
                <div className="space-y-2">
                  {personSocials.map((s, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <AdminSelect
                          aria-label="Platform sosial"
                          value={s.platform}
                          onValueChange={(value) => {
                            const updated = [...personSocials];
                            updated[idx].platform = value as SocialPlatform;
                            setPersonSocials(updated);
                          }}
                          className="h-8 w-auto min-w-[8rem] px-2 text-xs data-[size=default]:h-8"
                          options={SOCIAL_PLATFORMS_LIST.map((opt) => ({
                            value: opt.value,
                            label: opt.label,
                          }))}
                        />

                        {s.platform === "other" ? (
                          <AdminInput
                            placeholder="Label (wajib)"
                            value={s.label}
                            onChange={(e) => {
                              const updated = [...personSocials];
                              updated[idx].label = e.target.value;
                              setPersonSocials(updated);
                            }}
                            className="h-8 text-xs flex-1"
                          />
                        ) : null}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPersonSocials(personSocials.filter((_, i) => i !== idx))}
                          className="size-7 rounded-md p-0 text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>

                      <AdminInput
                        placeholder="https://..."
                        value={s.url}
                        onChange={(e) => {
                          const updated = [...personSocials];
                          updated[idx].url = e.target.value;
                          setPersonSocials(updated);
                        }}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPersonSheetOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <AdminButton disabled={isPending} onClick={handleSavePerson} className="text-xs">
              {isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {editingPerson ? "Simpan perubahan" : "Simpan profil"}
            </AdminButton>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ========================================================================= */}
      {/* DIALOG: PEMETAAN DATA LEGACY */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(mappingAssignment)} onOpenChange={(open) => !open && setMappingAssignment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-montserrat text-base font-bold text-dgb-900">
              Petakan Jabatan ke Organisasi Modern
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tentukan periode kepengurusan dan unit kerja tujuan untuk penugasan ini.
            </DialogDescription>
          </DialogHeader>

          {mappingAssignment ? (
            <div className="space-y-3.5 py-2">
              <div className="rounded-md bg-muted/40 p-3 text-xs">
                <p className="font-semibold text-foreground">{mappingAssignment.personName}</p>
                <p className="text-muted-foreground">Jabatan lama: {mappingAssignment.title} ({mappingAssignment.group})</p>
              </div>

              <AdminField label="Periode tujuan">
                <AdminSelect
                  value={mapTargetPeriodId}
                  onValueChange={(nextPeriodId) => {
                    setMapTargetPeriodId(nextPeriodId);
                    const units = allUnits.filter((u) => u.periodId === nextPeriodId);
                    setMapTargetUnitId(units.length > 0 ? units[0].id : "");
                  }}
                  options={periods.map((p) => ({
                    value: p.id,
                    label: `${p.label} (${p.startYear} - ${p.endYear})`,
                  }))}
                />
              </AdminField>

              <AdminField label="Unit kerja tujuan">
                {availableUnitsForPeriod.length === 0 ? (
                  <p className="text-xs text-rose-600">
                    Periode ini belum memiliki unit kerja. Silakan buat unit di detail periode terlebih dahulu.
                  </p>
                ) : (
                  <AdminSelect
                    value={mapTargetUnitId}
                    onValueChange={setMapTargetUnitId}
                    options={availableUnitsForPeriod.map((u) => ({ value: u.id, label: u.name }))}
                  />
                )}
              </AdminField>

              <AdminField label="Nama jabatan baru">
                <AdminInput
                  value={mapTargetTitle}
                  onChange={(e) => setMapTargetTitle(e.target.value)}
                  placeholder="Contoh: Ketua Bidang Hubungan Masyarakat"
                />
              </AdminField>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMappingAssignment(null)}
              className="text-xs"
            >
              Batal
            </Button>
            <AdminButton
              disabled={isPending || !mapTargetPeriodId || !mapTargetUnitId}
              onClick={handleConfirmMap}
              className="text-xs"
            >
              {isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Konfirmasi Pemetaan
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ALERT DIALOG: HAPUS PERIODE */}
      {/* ========================================================================= */}
      <AlertDialog open={Boolean(deletingPeriod)} onOpenChange={(open) => !open && setDeletingPeriod(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-montserrat text-base font-bold text-destructive">
              Hapus Periode Kepengurusan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Tindakan ini akan menghapus periode <strong>{deletingPeriod?.label}</strong> beserta seluruh struktur unit dan penugasan pengurus di dalamnya. Profil orang tidak akan terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePeriod}
              className="bg-destructive text-xs text-white hover:bg-destructive/90"
            >
              Hapus periode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================================= */}
      {/* ALERT DIALOG: HAPUS PROFIL */}
      {/* ========================================================================= */}
      <AlertDialog open={Boolean(deletingPerson)} onOpenChange={(open) => !open && setDeletingPerson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-montserrat text-base font-bold text-destructive">
              Hapus Profil Orang?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Tindakan ini akan menghapus profil <strong>{deletingPerson?.name}</strong> dari direktori serta seluruh penugasan jabatan pengurus terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              className="bg-destructive text-xs text-white hover:bg-destructive/90"
            >
              Hapus profil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
