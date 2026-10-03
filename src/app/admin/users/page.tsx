import { eq } from "drizzle-orm";
import { Check, UserRound } from "lucide-react";
import { AdminBadge, AdminButton, AdminCard, AdminCardHeader, AdminEmptyState, AdminField, AdminInput, AdminListRow, AdminPage, AdminSelect } from "@/components/admin/primitives";
import { database } from "@/server/db/client";
import { accessRequests, authUsers } from "@/server/db/schema";
import { requireRoleAdministrator } from "@/server/auth/authorization";
import { roleTemplates } from "@/server/auth/permissions";
import { approveAction } from "./actions";

export default async function UsersPage() {
  await requireRoleAdministrator();
  const requests = await database.select({ request: accessRequests, email: authUsers.email, name: authUsers.name }).from(accessRequests).innerJoin(authUsers, eq(authUsers.id, accessRequests.userId)).orderBy(accessRequests.createdAt);
  const assignableRoles = Object.entries(roleTemplates).filter(([slug]) => slug !== "super_admin");
  return (
    <AdminPage eyebrow="Operasional" title="Permintaan akses" description="Tinjau alasan sebelum menetapkan peran.">
      <AdminCard>
        <AdminCardHeader title="Permintaan masuk" description={`${requests.filter(({ request }) => request.status === "open").length} permintaan terbuka.`} />
        <div className="space-y-4">{requests.length === 0 ? <AdminEmptyState icon="users" title="Inbox masih kosong" description="Belum ada pengguna yang menunggu persetujuan akses." /> : requests.map(({ request, email, name }) => <AdminListRow key={request.id} title={<span className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-dgb-50 text-dgb"><UserRound size={15} /></span>{name}</span>} meta={email} action={<AdminBadge value={request.status} />}>
          <p className="rounded-lg bg-muted px-3 py-3 text-sm leading-6 text-muted-foreground">{request.reason}</p>
          {request.status === "open" ? <form action={approveAction} className="mt-4 grid gap-3 border-l-2 border-dgb bg-dgb-50/40 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><input type="hidden" name="requestId" value={request.id} /><AdminField label="Peran"><AdminSelect name="roleSlug" options={assignableRoles.map(([slug, role]) => ({ value: slug, label: role.label }))} /></AdminField><AdminField label="Catatan" hint="Opsional"><AdminInput name="note" placeholder="Catatan persetujuan" /></AdminField><AdminButton type="submit" className="h-11"><Check size={15} /> Setujui</AdminButton></form> : null}
        </AdminListRow>)}</div>
      </AdminCard>
    </AdminPage>
  );
}
