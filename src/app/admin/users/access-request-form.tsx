"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { AdminButton, AdminField, AdminInput } from "@/components/admin/primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { approveAction } from "./actions";

export function AccessRequestForm({
  requestId,
  assignableRoles,
}: {
  requestId: string;
  assignableRoles: [string, { label: string }][];
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading("Menyetujui permintaan akses...");

    startTransition(async () => {
      try {
        await approveAction(formData);
        toast.success("Permintaan akses disetujui", { id: toastId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyetujui permintaan akses", { id: toastId });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-4 border-l-2 border-brand bg-brand-50/40 p-4"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <fieldset className="space-y-2" disabled={pending}>
        <legend className="text-sm font-semibold text-foreground">Peran</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {assignableRoles.map(([slug, role], idx) => (
            <label
              key={slug}
              htmlFor={`req-${requestId}-${slug}`}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-brand-100 bg-canvas px-3 py-2 text-sm text-foreground transition-colors has-[[data-state=checked]]:border-brand-300 has-[[data-state=checked]]:bg-brand-50"
            >
              <Checkbox
                id={`req-${requestId}-${slug}`}
                name="roleSlugs"
                value={slug}
                defaultChecked={idx === 0}
                disabled={pending}
              />
              <span>{role.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <AdminField label="Catatan">
          <AdminInput name="note" placeholder="Catatan persetujuan (opsional)" disabled={pending} />
        </AdminField>
        <AdminButton type="submit" loading={pending} disabled={pending}>
          <Check size={15} /> Setujui
        </AdminButton>
      </div>
    </form>
  );
}
