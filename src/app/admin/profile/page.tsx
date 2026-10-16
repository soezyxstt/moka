import { Mail, ShieldCheck, UserRound } from "lucide-react";
import Image from "next/image";

import { AdminPage } from "@/components/admin/primitives";
import { ensurePendingAdminProfile, getEffectivePermissions, requireSession } from "@/server/auth/authorization";
import { permissionCatalog } from "@/server/auth/permissions";

export default async function ProfilePage() {
  const session = await requireSession();
  await ensurePendingAdminProfile(session.user.id);
  const permissions = await getEffectivePermissions(session.user.id);
  return (
    <AdminPage title="Profil admin">
      <div className="max-w-2xl divide-y divide-brand-100 rounded-xl border border-brand-100 bg-card p-6">
        <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-brand text-lg font-semibold text-canvas">
            {session.user.image ? <Image className="h-full w-full object-cover" src={session.user.image} alt={`Foto ${session.user.name}`} width={64} height={64} /> : <UserRound size={24} />}
          </div>
          <div>
            <h2 className="font-manrope text-lg font-semibold text-brand-900">{session.user.name}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail size={14} />
              {session.user.email}
            </p>
          </div>
        </div>
        <div className="pt-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand" />
            <h3 className="text-sm font-semibold text-brand-900">Hak akses</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...permissions].map((permission) => (
              <span
                key={permission}
                className="rounded-md border border-brand-100 bg-brand-50/50 px-2.5 py-1 text-xs font-medium text-brand-800"
              >
                {permissionCatalog[permission]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
