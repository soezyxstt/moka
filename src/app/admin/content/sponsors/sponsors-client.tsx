"use client";

import {
  Building2,
  ExternalLink,
  Globe,
  Handshake,
  Loader2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { adminNativeScrollbarClassName } from "@/components/admin/admin-scroll-area";
import { AdminMediaField, type MediaAssetSummary } from "@/components/admin/media-picker";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminSelect,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { createSponsorAction, deleteSponsorAction, toggleSponsorActiveAction, updateSponsorAction } from "./actions";
import { SPONSOR_TIERS, type SponsorTier } from "./constants";

const sponsorTierLabels: Record<SponsorTier, string> = {
  utama: "Utama",
  pendukung: "Pendukung",
  pendamping: "Pendamping",
  pelengkap: "Pelengkap",
};

export type SponsorWithAsset = {
  id: string;
  editionId: string;
  name: string;
  tier: SponsorTier;
  website: string | null;
  logoMediaId: string | null;
  displayOrder: number;
  active: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date | null;
  logoAsset: MediaAssetSummary | null;
};

export type SponsorsClientProps = {
  edition: {
    id: string;
    year: number;
    name: string;
    lifecycle: string;
  };
  initialSponsors: SponsorWithAsset[];
  canEdit?: boolean;
  canPublish?: boolean;
  canManageMedia?: boolean;
};

export function getSponsorTierLabel(tier: SponsorTier) {
  return sponsorTierLabels[tier];
}

export function getTierBadgeStyle(tier: SponsorTier) {
  switch (tier) {
    case "utama":
      return "border-warning-400 bg-warning-50 text-warning-900";
    case "pendukung":
      return "border-success-400 bg-success-50 text-success-900";
    case "pendamping":
      return "border-info-400 bg-info-50 text-info-900";
    case "pelengkap":
      return "border-neutral-400 bg-neutral-100 text-neutral-800";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function websiteLabel(website: string) {
  return website.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function SponsorsClient({
  edition,
  initialSponsors,
  canEdit = false,
  canPublish = false,
  canManageMedia = false,
}: SponsorsClientProps) {
  const [sponsors, setSponsors] = useState<SponsorWithAsset[]>(initialSponsors);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorWithAsset | null>(null);
  const [formName, setFormName] = useState("");
  const [formTier, setFormTier] = useState<SponsorTier>("utama");
  const [formWebsite, setFormWebsite] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formActive, setFormActive] = useState(false);
  const [formLogoAsset, setFormLogoAsset] = useState<MediaAssetSummary | null>(null);
  const [deletingSponsor, setDeletingSponsor] = useState<SponsorWithAsset | null>(null);

  const [previousInitialSponsors, setPreviousInitialSponsors] = useState(initialSponsors);
  if (initialSponsors !== previousInitialSponsors) {
    setPreviousInitialSponsors(initialSponsors);
    setSponsors(initialSponsors);
  }

  const filteredSponsors = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return sponsors.filter((s) => {
      const matchesSearch = normalizedSearch.length === 0 || s.name.toLowerCase().includes(normalizedSearch);
      const matchesTier = tierFilter === "semua" || s.tier === tierFilter;
      const matchesStatus =
        statusFilter === "semua" ||
        (statusFilter === "aktif" && s.active) ||
        (statusFilter === "nonaktif" && !s.active);
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [sponsors, searchQuery, tierFilter, statusFilter]);

  const openCreateSheet = () => {
    setEditingSponsor(null);
    setFormName("");
    setFormTier("utama");
    setFormWebsite("");
    setFormDisplayOrder(sponsors.length > 0 ? Math.max(...sponsors.map((s) => s.displayOrder)) + 1 : 0);
    setFormActive(false);
    setFormLogoAsset(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (sponsor: SponsorWithAsset) => {
    setEditingSponsor(sponsor);
    setFormName(sponsor.name);
    setFormTier(sponsor.tier);
    setFormWebsite(sponsor.website ?? "");
    setFormDisplayOrder(sponsor.displayOrder);
    setFormActive(sponsor.active);
    setFormLogoAsset(sponsor.logoAsset);
    setIsSheetOpen(true);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = formName.trim();
    if (!name) {
      toast.error("Nama sponsor wajib diisi");
      return;
    }

    if (!Number.isInteger(formDisplayOrder) || formDisplayOrder < 0) {
      toast.error("Urutan harus berupa angka nol atau lebih");
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("tier", formTier);
    formData.set("website", formWebsite.trim());
    formData.set("logoMediaId", formLogoAsset?.id ?? "");
    formData.set("displayOrder", String(formDisplayOrder));
    formData.set("active", editingSponsor ? String(formActive) : "false");

    if (editingSponsor) {
      formData.set("id", editingSponsor.id);
      formData.set("version", String(editingSponsor.version));
      startTransition(async () => {
        try {
          await updateSponsorAction(formData);
          toast.success(`Sponsor "${name}" diperbarui`);
          setIsSheetOpen(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Perubahan sponsor gagal disimpan");
        }
      });
    } else {
      startTransition(async () => {
        try {
          await createSponsorAction(formData);
          toast.success(`Sponsor "${name}" ditambahkan sebagai nonaktif`);
          setIsSheetOpen(false);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Sponsor gagal disimpan");
        }
      });
    }
  };

  const handleToggleActive = (sponsor: SponsorWithAsset) => {
    if (!canEdit || (!sponsor.active && !canPublish)) {
      toast.error("Izin penerbitan diperlukan untuk mengaktifkan sponsor");
      return;
    }

    const formData = new FormData();
    formData.set("id", sponsor.id);

    startTransition(async () => {
      try {
        await toggleSponsorActiveAction(formData);
        toast.success(
          `Sponsor "${sponsor.name}" ${sponsor.active ? "dinonaktifkan" : "diaktifkan"}`,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Status sponsor gagal diubah");
      }
    });
  };

  const handleDelete = () => {
    if (!deletingSponsor) return;
    const sponsorToDelete = deletingSponsor;

    const formData = new FormData();
    formData.set("id", sponsorToDelete.id);

    startTransition(async () => {
      try {
        await deleteSponsorAction(formData);
        toast.success(`Sponsor "${sponsorToDelete.name}" dihapus`);
        setDeletingSponsor(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sponsor gagal dihapus");
      }
    });
  };

  return (
    <div className="space-y-5">
      <AdminCard padding="none">
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-manrope text-lg font-semibold text-brand-900">Daftar sponsor</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filteredSponsors.length} dari {sponsors.length} sponsor tampil
              </p>
            </div>
            {canEdit ? (
              <AdminButton type="button" onClick={openCreateSheet} className="w-full sm:w-auto">
                <Plus size={16} /> Tambah sponsor
              </AdminButton>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(9rem,0.75fr)_minmax(9rem,0.75fr)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <AdminInput
                type="search"
                aria-label="Cari nama sponsor"
                placeholder="Cari nama sponsor"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <AdminSelect
              aria-label="Filter tingkat sponsor"
              value={tierFilter}
              onValueChange={setTierFilter}
              options={[
                { value: "semua", label: "Semua tingkat" },
                ...SPONSOR_TIERS.map((tier) => ({ value: tier, label: getSponsorTierLabel(tier) })),
              ]}
            />
            <AdminSelect
              aria-label="Filter status sponsor"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: "semua", label: "Semua status" },
                { value: "aktif", label: "Aktif" },
                { value: "nonaktif", label: "Nonaktif" },
              ]}
            />
          </div>
        </div>
      </AdminCard>

      {filteredSponsors.length === 0 ? (
        <AdminCard padding="none">
          <AdminEmptyState
            icon="handshake"
            title={sponsors.length === 0 ? "Belum ada sponsor" : "Sponsor tidak ditemukan"}
          />
        </AdminCard>
      ) : (
        <AdminCard padding="none">
          <div className="hidden border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground lg:grid lg:grid-cols-[4.5rem_minmax(12rem,1.6fr)_minmax(6.5rem,0.8fr)_minmax(10rem,1fr)_4rem_6rem_auto] lg:items-center lg:gap-3 sm:px-5">
            <span>Logo</span>
            <span>Nama</span>
            <span>Tingkat</span>
            <span>Website</span>
            <span className="text-center">Urutan</span>
            <span className="text-center">Status</span>
            <span className="text-right">Aksi</span>
          </div>

          <div role="list" aria-label="Daftar sponsor" className="divide-y divide-border">
            {filteredSponsors.map((sponsor) => {
              const canToggle = canEdit && (sponsor.active || canPublish);
              return (
                <article
                  key={sponsor.id}
                  role="listitem"
                  className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 gap-y-3 p-4 transition-colors hover:bg-brand-50/25 sm:p-5 lg:grid-cols-[4.5rem_minmax(12rem,1.6fr)_minmax(6.5rem,0.8fr)_minmax(10rem,1fr)_4rem_6rem_auto] lg:items-center lg:gap-3"
                >
                  <div className="col-span-2 flex items-center gap-3 lg:contents">
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-100 bg-canvas p-1.5">
                      {sponsor.logoAsset?.url ? (
                        <Image
                          src={sponsor.logoAsset.url}
                          alt={sponsor.logoAsset.alt || sponsor.name}
                          width={52}
                          height={52}
                          className="size-full object-contain"
                        />
                      ) : (
                        <Building2 className="size-5 text-brand-300" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-manrope text-sm font-semibold text-brand-900">{sponsor.name}</h3>
                      {!sponsor.logoAsset ? <p className="mt-0.5 text-xs text-muted-foreground">Belum ada logo</p> : null}
                    </div>
                  </div>

                  <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs lg:contents">
                    <span className={cn("inline-flex w-fit rounded-md border-l-2 px-2 py-1 font-medium", getTierBadgeStyle(sponsor.tier))}>
                      {getSponsorTierLabel(sponsor.tier)}
                    </span>
                    <div className="min-w-0 max-w-full lg:max-w-[14rem]">
                      {sponsor.website ? (
                        <a
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 text-brand hover:underline"
                          title={sponsor.website}
                        >
                          <Globe className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{websiteLabel(sponsor.website)}</span>
                          <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Belum diisi</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span>Urutan</span>
                      <span className="font-semibold text-foreground">{sponsor.displayOrder}</span>
                    </div>
                    <span
                      className={cn(
                        "inline-flex w-fit rounded-md border-l-2 px-2 py-1 font-medium",
                        sponsor.active
                          ? "border-success-500 bg-success-50 text-success-800"
                          : "border-neutral-400 bg-neutral-100 text-neutral-700",
                      )}
                    >
                      {sponsor.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3 lg:col-span-1 lg:border-t-0 lg:pt-0">
                    {canEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditSheet(sponsor)}
                        disabled={isPending}
                        className="h-8 border-brand-100 px-2.5 text-xs text-brand-800 hover:bg-brand-50"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" /> Ubah
                      </Button>
                    ) : null}
                    {canToggle ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(sponsor)}
                        disabled={isPending}
                        className={cn(
                          "h-8 px-2.5 text-xs",
                          sponsor.active
                            ? "border-warning-200 text-warning-800 hover:bg-warning-50"
                            : "border-success-200 text-success-800 hover:bg-success-50",
                        )}
                      >
                        {sponsor.active ? (
                          <>
                            <PowerOff className="size-3.5" aria-hidden="true" /> Nonaktifkan
                          </>
                        ) : (
                          <>
                            <Power className="size-3.5" aria-hidden="true" /> Aktifkan
                          </>
                        )}
                      </Button>
                    ) : null}
                    {canEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setDeletingSponsor(sponsor)}
                        disabled={isPending}
                        aria-label={`Hapus sponsor ${sponsor.name}`}
                        className="size-8 border-danger-200 text-destructive hover:bg-danger-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </AdminCard>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex w-[min(100%,34rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-border bg-brand-50/35 px-5 py-5 pr-14">
            <SheetTitle className="font-manrope text-lg font-semibold text-brand-900">
              {editingSponsor ? "Ubah sponsor" : "Tambah sponsor"}
            </SheetTitle>
            <SheetDescription className="text-xs leading-5 text-muted-foreground">
              Isi data singkat dan pratinjau kartu sponsor.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5", adminNativeScrollbarClassName)}>
              <div className="space-y-5">
                <AdminField label="Nama sponsor">
                  <AdminInput
                    name="name"
                    placeholder="Contoh: Bank BJB Cabang Garut"
                    value={formName}
                    onChange={(event) => setFormName(event.target.value)}
                    required
                  />
                </AdminField>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  <AdminField label="Tingkat sponsor">
                    <AdminSelect
                      name="tier"
                      value={formTier}
                      onValueChange={(value) => setFormTier(value as SponsorTier)}
                      options={SPONSOR_TIERS.map((tier) => ({ value: tier, label: getSponsorTierLabel(tier) }))}
                    />
                  </AdminField>
                  <AdminField label="Urutan">
                    <AdminInput
                      name="displayOrder"
                      type="number"
                      min={0}
                      step={1}
                      value={formDisplayOrder}
                      onChange={(event) => setFormDisplayOrder(Number(event.target.value))}
                    />
                  </AdminField>
                </div>

                <AdminField label="Logo sponsor">
                  <AdminMediaField
                    name="logoMediaId"
                    acceptType="image"
                    aspectRatioHint="Bebas"
                    initialAsset={formLogoAsset}
                    onChange={setFormLogoAsset}
                    activeEditionId={edition.id}
                    canManageMedia={canManageMedia}
                  />
                </AdminField>

                <AdminField label="Website (opsional)">
                  <AdminInput
                    name="website"
                    type="url"
                    placeholder="https://contoh.co.id"
                    value={formWebsite}
                    onChange={(event) => setFormWebsite(event.target.value)}
                  />
                </AdminField>

                <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      name="active"
                      checked={formActive}
                      onCheckedChange={(checked) => setFormActive(checked === true)}
                      disabled={!editingSponsor || !canPublish}
                      aria-label="Aktifkan sponsor"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-900">Aktif</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {editingSponsor
                          ? canPublish
                            ? "Sponsor aktif dapat ditampilkan di situs."
                            : "Hanya penerbit yang dapat mengaktifkan sponsor."
                          : "Sponsor baru disimpan nonaktif. Aktifkan setelah tersimpan."}
                      </p>
                    </div>
                  </div>
                </div>

                <section className="space-y-2 border-t border-border pt-5" aria-labelledby="sponsor-preview-title">
                  <div className="flex items-center justify-between gap-3">
                    <h3 id="sponsor-preview-title" className="text-xs font-semibold text-muted-foreground">
                      Pratinjau kartu
                    </h3>
                    <span className={cn("rounded-md border-l-2 px-2 py-1 text-xs font-medium", getTierBadgeStyle(formTier))}>
                      {getSponsorTierLabel(formTier)}
                    </span>
                  </div>

                  <div className="rounded-lg border border-brand-100 bg-canvas/80 p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-100 bg-canvas p-2">
                        {formLogoAsset?.url ? (
                          <Image
                            src={formLogoAsset.url}
                            alt={formLogoAsset.alt || formName || "Logo sponsor"}
                            width={64}
                            height={64}
                            className="size-full object-contain"
                          />
                        ) : (
                          <Handshake className="size-6 text-brand-300" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-manrope text-sm font-semibold text-brand-900">
                          {formName.trim() || "Nama sponsor"}
                        </p>
                        {formWebsite.trim() ? (
                          <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-brand">
                            <Globe className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{websiteLabel(formWebsite.trim())}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <SheetFooter className="border-t border-border bg-background px-5 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={isPending}>
                Batal
              </Button>
              <AdminButton type="submit" disabled={isPending || !formName.trim()}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Menyimpan
                  </>
                ) : editingSponsor ? (
                  "Simpan perubahan"
                ) : (
                  "Simpan sponsor"
                )}
              </AdminButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(deletingSponsor)} onOpenChange={(open) => !open && setDeletingSponsor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-manrope">Hapus sponsor {deletingSponsor?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Data sponsor dihapus permanen. Logo tetap tersimpan di pustaka media.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-canvas hover:bg-destructive/90"
            >
              {isPending ? "Menghapus" : "Hapus sponsor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
