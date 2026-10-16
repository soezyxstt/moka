"use client";

import { useTransition } from "react";
import { Clock3, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminButton, AdminField, AdminTextarea } from "@/components/admin/primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { requestAccessAction } from "./actions";

export function RequestAccessForm() {
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading("Mengirim permintaan akses...");

    startTransition(async () => {
      try {
        await requestAccessAction(formData);
        toast.success("Permintaan akses berhasil dikirim", { id: toastId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mengirim permintaan akses", { id: toastId });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AdminField label="Alasan kebutuhan akses">
        <AdminTextarea
          name="reason"
          required
          minLength={10}
          maxLength={500}
          placeholder="Jelaskan kebutuhan akses Anda..."
          disabled={pending}
        />
      </AdminField>
      <fieldset className="space-y-3" disabled={pending}>
        <legend className="text-xs font-semibold text-foreground">Area yang diperlukan</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["content", "Konten"],
            ["voting", "Voting"],
            ["users", "Pengguna"],
          ].map(([value, label]) => (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-canvas px-3 py-3 text-sm text-foreground transition-colors has-[[data-state=checked]]:border-highlight-300 has-[[data-state=checked]]:bg-highlight-50"
              htmlFor={`area-${value}`}
              key={value}
            >
              <Checkbox
                id={`area-${value}`}
                name="areas"
                value={value}
                disabled={pending}
                className="border-highlight-300 data-[state=checked]:border-highlight data-[state=checked]:bg-highlight data-[state=checked]:text-ink"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <AdminButton type="submit" loading={pending} disabled={pending} className="w-full">
        <Send size={16} /> Kirim permintaan akses
      </AdminButton>
      <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Clock3 size={15} className="mt-0.5 shrink-0 text-highlight-500" />
        Anda dapat masuk ke admin setelah permintaan disetujui.
      </div>
    </form>
  );
}
