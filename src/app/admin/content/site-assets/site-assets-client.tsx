"use client";

import { CheckCircle2, CircleAlert, Image as ImageIcon, Trash2, Video } from "lucide-react";
import Image from "next/image";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminInput,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SITE_ASSET_GROUPS,
  type SiteAssetSlotDefinition,
} from "@/server/cms/site-asset-manifest";
import type { SiteAssetBindingRow } from "@/server/db/schema";
import { bindSiteAssetAction, unbindSiteAssetAction } from "./actions";

export type SiteAssetSlotWithData = {
  definition: SiteAssetSlotDefinition;
  binding: SiteAssetBindingRow | null;
  mediaAsset: MediaAssetSummary | null;
};

export type SiteAssetsClientProps = {
  edition: {
    id: string;
    year: number;
    name: string;
    lifecycle: string;
  };
  slotsData: SiteAssetSlotWithData[];
  canManageContent?: boolean;
};

function StatusTag({ ready, label }: { ready: boolean; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold",
        ready
          ? "border-success-200 bg-success-50 text-success-700"
          : "border-warning-200 bg-warning-50 text-warning-800",
      )}
    >
      {ready ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}
      {label ?? (ready ? "Siap" : "Kosong")}
    </span>
  );
}

function mediaTypeLabel(acceptType: SiteAssetSlotDefinition["acceptType"]) {
  return acceptType === "video" ? "Video" : "Gambar";
}

function SlotPreview({
  definition,
  asset,
  focalX,
  focalY,
}: {
  definition: SiteAssetSlotDefinition;
  asset: MediaAssetSummary | null;
  focalX: number;
  focalY: number;
}) {
  const isImage = Boolean(asset?.mimeType.startsWith("image/"));

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border border-border", definition.darkPreview ? "bg-brand-900" : "bg-muted/30")}
      style={{ aspectRatio: definition.aspectRatio.replace(":", " /") }}
      aria-label={`Pratinjau ${definition.label}`}
    >
      {isImage && asset ? (
        <Image
          src={asset.url}
          alt={asset.alt ?? definition.label}
          fill
          unoptimized={asset.mimeType === "image/svg+xml"}
          sizes="(max-width: 640px) 100vw, 45vw"
          className={definition.fit === "contain" ? "object-contain p-4" : "object-cover"}
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
        />
      ) : asset ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-highlight-50 px-4 text-center text-highlight-800">
          <Video className="size-7" />
          <span className="max-w-full truncate text-xs font-semibold">{asset.filename}</span>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
          {definition.acceptType === "video" ? <Video className="size-7" /> : <ImageIcon className="size-7" />}
          <span className="text-xs">Belum ada media</span>
          <span className="text-xs">Rasio {definition.aspectRatio}</span>
        </div>
      )}
    </div>
  );
}

export function SiteAssetsClient({
  edition,
  slotsData,
  canManageContent = true,
}: SiteAssetsClientProps) {
  const totalSlots = slotsData.length;
  const filledSlots = slotsData.filter((slot) => Boolean(slot.binding?.mediaId && slot.mediaAsset)).length;
  const requiredSlots = slotsData.filter((s) => s.definition.required);
  const requiredFilled = requiredSlots.filter((slot) => Boolean(slot.binding?.mediaId && slot.mediaAsset)).length;

  return (
    <div className="space-y-7">
      <p className="text-sm text-muted-foreground">Aset Pasanggiri {edition.year}. {edition.lifecycle === "archived" ? "Arsip hanya dapat dibaca." : "Penggantian berlaku untuk edisi ini. Media sebelumnya tetap tersimpan."}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminCard padding="none" className="overflow-hidden">
          <div className="border-l-2 border-brand px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Slot manifest</p>
            <p className="mt-1 font-manrope text-2xl font-semibold text-brand-900">{totalSlots}</p>
            <p className="mt-1 text-xs text-muted-foreground">Slot tetap yang tersedia</p>
          </div>
        </AdminCard>

        <AdminCard padding="none" className="overflow-hidden">
          <div className="border-l-2 border-brand px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Terpasang</p>
            <p className="mt-1 font-manrope text-2xl font-semibold text-brand-900">{filledSlots}/{totalSlots}</p>
            <p className="mt-1 text-xs text-muted-foreground">Media siap pada slot</p>
          </div>
        </AdminCard>

        <AdminCard padding="none" className="overflow-hidden">
          <div className="border-l-2 border-highlight px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Slot wajib</p>
                <p className="mt-1 font-manrope text-2xl font-semibold text-brand-900">{requiredFilled}/{requiredSlots.length}</p>
              </div>
              <StatusTag ready={requiredFilled === requiredSlots.length} label={requiredFilled === requiredSlots.length ? "Lengkap" : "Perlu diisi"} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Kebutuhan minimum publikasi</p>
          </div>
        </AdminCard>
      </div>

      <Accordion type="single" collapsible defaultValue="brand" className="space-y-3">
        {SITE_ASSET_GROUPS.map((group) => {
          const groupSlots = slotsData.filter((slot) => slot.definition.group === group.key);
          const groupFilled = groupSlots.filter((slot) => Boolean(slot.binding?.mediaId && slot.mediaAsset)).length;

          return (
            <AccordionItem key={group.key} value={group.key} className="overflow-hidden rounded-xl border border-border bg-card px-4 sm:px-5">
              <AccordionTrigger className="hover:no-underline">
                <div className="min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-manrope text-base font-semibold text-brand-900">{group.label}</span>
                    <StatusTag ready={groupFilled === groupSlots.length} label={`${groupFilled}/${groupSlots.length}`} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs font-normal text-muted-foreground">{group.description}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/70 pt-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  {groupSlots.map((item) => (
                    <SiteAssetSlotCard
                      key={`${edition.id}-${item.definition.slotKey}`}
                      item={item}
                      editionId={edition.id}
                      canManageContent={canManageContent}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function SiteAssetSlotCard({
  item,
  editionId,
  canManageContent,
}: {
  item: SiteAssetSlotWithData;
  editionId: string;
  canManageContent: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetSummary | null>(item.mediaAsset);
  const [altOverride, setAltOverride] = useState(item.binding?.altOverride ?? "");
  const [focalX, setFocalX] = useState<number>(item.binding?.focalX ?? 50);
  const [focalY, setFocalY] = useState<number>(item.binding?.focalY ?? 50);
  const [isBound, setIsBound] = useState(Boolean(item.binding?.mediaId && item.mediaAsset));
  const [isConfirmUnbindOpen, setIsConfirmUnbindOpen] = useState(false);
  const [version, setVersion] = useState(item.binding?.version ?? 0);

  const { definition } = item;

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageContent) return;

    if (!selectedAsset?.id) {
      toast.error("Pilih media terlebih dahulu");
      return;
    }

    const formData = new FormData();
    formData.set("editionId", editionId);
    formData.set("version", String(version));
    formData.set("slotKey", definition.slotKey);
    formData.set("mediaId", selectedAsset.id);
    formData.set("altOverride", altOverride.trim());
    formData.set("focalX", String(focalX));
    formData.set("focalY", String(focalY));

    startTransition(async () => {
      try {
        const saved = await bindSiteAssetAction(formData);
        setVersion(saved.version);
        setIsBound(true);
        toast.success(`${definition.label} disimpan`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan aset");
      }
    });
  };

  const handleUnbind = () => {
    if (!canManageContent) return;

    const formData = new FormData();
    formData.set("editionId", editionId);
    formData.set("version", String(version));
    formData.set("slotKey", definition.slotKey);

    startTransition(async () => {
      try {
        const saved = await unbindSiteAssetAction(formData);
        setVersion(saved.version);
        setSelectedAsset(null);
        setAltOverride("");
        setIsBound(false);
        setIsConfirmUnbindOpen(false);
        toast.success(`${definition.label} dilepas`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal melepas media");
      }
    });
  };

  const formId = `form-${definition.slotKey}`;

  return (
    <AdminCard padding="none" className="overflow-hidden">
      <div className="border-b border-border/70 bg-muted/15 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md border border-brand-100 bg-brand-50/60 px-2 py-1 text-xs font-semibold text-brand-800">
                {mediaTypeLabel(definition.acceptType)}
              </span>
              <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                Rasio {definition.aspectRatio}
              </span>
              {definition.required ? (
                <span className="rounded-md border border-warning-200 bg-warning-50 px-2 py-1 text-xs font-semibold text-warning-800">
                  Wajib
                </span>
              ) : null}
            </div>
            <h3 className="font-manrope text-sm font-semibold text-brand-900">{definition.label}</h3>
            <p className="text-xs leading-5 text-muted-foreground">{definition.description}</p>
          </div>
          <StatusTag ready={isBound} label={isBound ? "Terpasang" : "Kosong"} />
        </div>
      </div>

      <form id={formId} onSubmit={handleSave} className="space-y-4 p-4 sm:p-5">
        <SlotPreview definition={definition} asset={selectedAsset} focalX={focalX} focalY={focalY} />

        <AdminMediaField
          name={`media-${definition.slotKey}`}
          label="Media"
          hint={`Format ${mediaTypeLabel(definition.acceptType).toLowerCase()} yang sesuai rasio slot.`}
          aspectRatioHint={definition.aspectRatio}
          acceptType={definition.acceptType}
          initialAsset={selectedAsset}
          onChange={setSelectedAsset}
          canManageMedia={canManageContent}
          activeEditionId={editionId}
        />

        {selectedAsset ? (
          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
            <AdminField label="Alt khusus slot" hint="Kosongkan untuk memakai alt media.">
              <AdminInput
                value={altOverride}
                onChange={(e) => setAltOverride(e.target.value)}
                placeholder={selectedAsset.alt ?? "Tulis teks alternatif"}
                maxLength={200}
                disabled={!canManageContent || isPending}
              />
            </AdminField>

            {definition.acceptType === "image" && definition.fit !== "contain" ? (
              <div className="grid grid-cols-2 gap-3">
                <AdminField label="Fokus X (%)" hint="0 sampai 100.">
                  <AdminInput
                    type="number"
                    min={0}
                    max={100}
                    value={focalX}
                    onChange={(e) => setFocalX(Number(e.target.value))}
                    disabled={!canManageContent || isPending}
                  />
                </AdminField>
                <AdminField label="Fokus Y (%)" hint="0 sampai 100.">
                  <AdminInput
                    type="number"
                    min={0}
                    max={100}
                    value={focalY}
                    onChange={(e) => setFocalY(Number(e.target.value))}
                    disabled={!canManageContent || isPending}
                  />
                </AdminField>
              </div>
            ) : null}
          </div>
        ) : null}
      </form>

      <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-muted/10 p-3 sm:flex-row sm:items-center sm:justify-between">
        {isBound && canManageContent ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setIsConfirmUnbindOpen(true)}
            className="border-danger-200 text-xs text-destructive hover:bg-danger-50"
          >
            <Trash2 className="size-3.5" />
            Lepas media
          </Button>
        ) : <span aria-hidden="true" />}

        <AdminButton type="submit" form={formId} disabled={!canManageContent || !selectedAsset || isPending}>
          {isPending ? "Menyimpan..." : isBound ? "Simpan perubahan" : "Pasang media"}
        </AdminButton>
      </div>

      <AlertDialog open={isConfirmUnbindOpen} onOpenChange={setIsConfirmUnbindOpen}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-manrope">Lepas media dari slot?</AlertDialogTitle>
            <AlertDialogDescription>
              Media tetap tersimpan di pustaka. Slot &quot;{definition.label}&quot; akan menjadi kosong.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnbind} disabled={isPending} className="bg-destructive text-canvas hover:bg-destructive/90">
              Lepas media
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminCard>
  );
}
