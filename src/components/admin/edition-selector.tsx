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

    startTransition(async () => {
      try {
        await setAdminEditionCookie(editionId);
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Edisi tidak dapat dipilih", {
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
          "group flex h-10 min-w-0 max-w-[calc(100vw-7rem)] items-center gap-2 rounded-md border border-dgb-100 bg-white/80 px-2.5 py-1.5 text-left text-xs shadow-none transition-colors hover:border-dgb-200 hover:bg-white focus-visible:border-dgb-300 focus-visible:ring-dgb-100 sm:max-w-none sm:px-3 sm:py-2",
          isPending && "cursor-wait opacity-60",
          className,
        )}
      >
        <SelectValue placeholder="Pilih edisi">
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded bg-dgb-50 text-dgb">
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Calendar className="size-3.5" />}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-center gap-1.5">
                <span className="min-w-0 truncate font-montserrat text-xs font-semibold text-dgb-900">
                  {currentEdition ? currentEdition.name : "Pilih edisi"}
                </span>
                {currentEdition ? <AdminBadge value={currentEdition.lifecycle} className="hidden py-0 text-[9px] sm:inline-flex" /> : null}
              </span>
              {currentEdition ? (
                <span className="block text-[10px] text-muted-foreground sm:hidden">
                  {currentEdition.year} · {currentEdition.lifecycle === "active" ? "Aktif" : currentEdition.lifecycle === "draft" ? "Draf" : "Arsip"}
                </span>
              ) : null}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>

      <SelectContent
        align="end"
        sideOffset={6}
        className="w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border border-dgb-100 bg-white p-1.5 shadow-lg"
      >
        <SelectGroup>
          <SelectLabel className="border-b border-dgb-50 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Konteks edisi aktif
          </SelectLabel>
          {editions.length === 0 ? (
            <SelectItem value="__no-editions__" disabled>Belum ada edisi yang tersedia.</SelectItem>
          ) : (
            editions.map((edition) => {
              return (
                <SelectItem
                  key={edition.id}
                  value={edition.id}
                  className="gap-2 px-2.5 py-2 text-xs"
                >
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate font-montserrat text-xs font-semibold text-dgb-900">
                        {edition.name}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        Tahun {edition.year}
                      </span>
                    </span>
                    <AdminBadge value={edition.lifecycle} className="shrink-0 py-0 text-[9px]" />
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
