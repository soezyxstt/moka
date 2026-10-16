"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { AdminButton, AdminField, AdminInput } from "@/components/admin/primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { updateUserRolesAction } from "./actions";

export function UserRolesForm({
  userId,
  initialRoleSlugs,
  assignableRoles,
}: {
  userId: string;
  initialRoleSlugs: string[];
  assignableRoles: [string, { label: string }][];
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading("Menyimpan perubahan peran...");

    startTransition(async () => {
      try {
        await updateUserRolesAction(formData);
        toast.success("Perubahan peran berhasil disimpan", { id: toastId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyimpan perubahan peran", { id: toastId });
      }
    });
  }

  const currentSlugs = new Set(initialRoleSlugs);

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-4 rounded-md border border-brand-100 bg-brand-50/25 p-4"
    >
      <input type="hidden" name="userId" value={userId} />
      <fieldset className="space-y-2" disabled={pending}>
        <legend className="text-sm font-semibold text-foreground">Peran pengguna</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {assignableRoles.map(([slug, role]) => (
            <label
              key={slug}
              htmlFor={`user-${userId}-${slug}`}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-brand-100 bg-canvas px-3 py-2 text-sm text-foreground transition-colors has-[[data-state=checked]]:border-brand-300 has-[[data-state=checked]]:bg-brand-50"
            >
              <Checkbox
                id={`user-${userId}-${slug}`}
                name="roleSlugs"
                value={slug}
                defaultChecked={currentSlugs.has(slug)}
                disabled={pending}
              />
              <span>{role.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <AdminField label="Alasan perubahan">
          <AdminInput name="reason" placeholder="Alasan pembaruan peran (opsional)" disabled={pending} />
        </AdminField>
        <AdminButton type="submit" variant="secondary" loading={pending} disabled={pending}>
          Simpan peran
        </AdminButton>
      </div>
    </form>
  );
}
