"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { AdminEditionContext } from "@/server/cms/context";
import { setAdminEditionCookie } from "@/server/cms/actions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminBadge } from "./primitives";
import { cn } from "@/lib/utils";

export type AdminEditionSelectorProps = {
  currentEdition: AdminEditionContext | null;
  editions: AdminEditionContext[];
  className?: string;
};

export function AdminEditionSelector({
  currentEdition,
  editions,
  className,
}: AdminEditionSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSelectEdition = (editionId: string) => {
    if (currentEdition?.id === editionId) {
      setOpen(false);
      return;
    }

    const toastId = toast.loading("Mengganti edisi aktif...");
    startTransition(async () => {
      try {
        await setAdminEditionCookie(editionId);
        setOpen(false);
        toast.success("Edisi aktif berhasil diganti", { id: toastId });
        router.refresh();
      } catch {
        toast.error("Edisi tidak dapat dipilih", {
          id: toastId,
          description: "Konteks edisi tetap seperti sebelumnya. Coba lagi.",
        });
      }
    });
  };

  return (
    <Select
      value={currentEdition?.id ?? ""}
      onValueChange={handleSelectEdition}
      open={open}
      onOpenChange={setOpen}
      disabled={isPending}
    >
      <SelectTrigger
        aria-label="Pilih edisi admin"
        className={cn(
          "group flex h-9 min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-md border border-brand-100 bg-canvas/80 px-2.5 py-1.5 text-left text-xs shadow-none transition-colors hover:border-brand-200 hover:bg-canvas focus-visible:border-brand-300 focus-visible:ring-brand-100 sm:h-10 sm:px-3",
          "[&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:flex-1",
          isPending && "cursor-wait opacity-60",
          className,
        )}
      >
        <SelectValue placeholder="Pilih edisi">
          <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {isPending ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-brand" />
            ) : (
              <Calendar className="size-3.5 shrink-0 text-brand" />
            )}
            <span className="block min-w-0 flex-1 truncate font-inter text-xs font-semibold text-brand-900">
              {currentEdition ? currentEdition.name : "Pilih edisi"}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>

      <SelectContent
        align="end"
        sideOffset={6}
        className="w-[max(var(--radix-select-trigger-width,0px),26rem)] max-w-[calc(100vw-1.5rem)] rounded-lg border border-brand-100 bg-canvas p-1.5 shadow-lg"
      >
        <SelectGroup>
          <SelectLabel className="border-b border-brand-50 px-2.5 py-2 text-xs font-medium text-muted-foreground">
            Pilih edisi
          </SelectLabel>
          {editions.length === 0 ? (
            <SelectItem value="__no-editions__" disabled>Belum ada edisi yang tersedia.</SelectItem>
          ) : (
            editions.map((edition) => {
              return (
                <SelectItem
                  key={edition.id}
                  value={edition.id}
                  className="gap-2 pl-2.5 pr-8 py-2 text-xs"
                >
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate font-inter text-xs font-semibold text-brand-900"
                        title={edition.name}
                      >
                        {edition.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Tahun {edition.year}
                      </span>
                    </span>
                    <AdminBadge value={edition.lifecycle} className="shrink-0 py-0 text-xs" />
                  </span>
                </SelectItem>
              );
            })
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
