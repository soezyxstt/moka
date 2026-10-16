"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { AdminButton, AdminCard, AdminCardHeader, AdminField, AdminInput } from "@/components/admin/primitives";
import { saveEditionPaletteAction } from "./actions";

export function EditionPaletteForm({ editionId, year, version, palette, canEdit }: {
  editionId: string; year: number; version: number | null; palette: { dark: string; light: string } | null; canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(saveEditionPaletteAction, { message: "", error: false });
  const toastIdRef = useRef<string | number | null>(null);

  const handleSubmit = (formData: FormData) => {
    toastIdRef.current = toast.loading("Menyimpan palet...");
    action(formData);
  };

  useEffect(() => {
    if (toastIdRef.current && state.message) {
      if (state.error) {
        toast.error(state.message, { id: toastIdRef.current });
      } else {
        toast.success(state.message, { id: toastIdRef.current });
      }
      toastIdRef.current = null;
    }
  }, [state]);

  return <AdminCard className="mt-6">
    <AdminCardHeader title={`Palet ${year}`} />
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="editionId" value={editionId} />
      <input type="hidden" name="version" value={version ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Warna gelap"><AdminInput name="dark" defaultValue={palette?.dark ?? ""} placeholder="Kode hex enam digit" pattern="#[0-9a-fA-F]{6}" maxLength={7} required disabled={!canEdit || pending} /></AdminField>
        <AdminField label="Warna terang"><AdminInput name="light" defaultValue={palette?.light ?? ""} placeholder="Kode hex enam digit" pattern="#[0-9a-fA-F]{6}" maxLength={7} required disabled={!canEdit || pending} /></AdminField>
      </div>
      <p className="text-sm text-muted-foreground">Teks putih pada warna gelap dan teks gelap pada warna terang harus memiliki kontras minimal 4.5:1.</p>
      <p aria-live="polite" className={state.error ? "text-sm text-destructive" : "text-sm text-success"}>{state.message}</p>
      {canEdit ? <AdminButton type="submit" loading={pending} disabled={pending}>Simpan palet</AdminButton> : null}
    </form>
  </AdminCard>;
}
