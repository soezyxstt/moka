import { eq } from "drizzle-orm";
import { Check } from "lucide-react";
import { AdminBadge, AdminButton, AdminEmptyState, AdminField, AdminInput, AdminListRow, AdminPage, AdminSelect } from "@/components/admin/primitives";
import { database } from "@/server/db/client";
import { accessRequests, authUsers } from "@/server/db/schema";
import { requireRoleAdministrator } from "@/server/auth/authorization";
import { roleTemplates } from "@/server/auth/permissions";
import { approveAction } from "./actions";

export default async function UsersPage() {
  await requireRoleAdministrator();
  const requests = await database
    .select({ request: accessRequests, email: authUsers.email, name: authUsers.name })
    .from(accessRequests)
    .innerJoin(authUsers, eq(authUsers.id, accessRequests.userId))
    .orderBy(accessRequests.createdAt);
  const assignableRoles = Object.entries(roleTemplates).filter(([slug]) => slug !== "super_admin");
  const openCount = requests.filter(({ request }) => request.status === "open").length;

  return (
    <AdminPage
      title="Permintaan akses"
      action={openCount > 0 ? <span className="text-sm text-muted-foreground">{openCount} terbuka</span> : null}
    >
      <div className="divide-y divide-brand-100 rounded-xl border border-brand-100 bg-card p-4 sm:p-6">
        {requests.length === 0 ? (
          <AdminEmptyState icon="users" title="Belum ada permintaan" />
        ) : (
          requests.map(({ request, email, name }) => (
            <AdminListRow
              key={request.id}
              title={name}
              meta={email}
              action={<AdminBadge value={request.status} />}
            >
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{request.reason}</p>
              {request.status === "open" ? (
                <form
                  action={approveAction}
                  className="mt-3 grid gap-3 border-l-2 border-brand bg-brand-50/40 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
                >
                  <input type="hidden" name="requestId" value={request.id} />
                  <AdminField label="Peran">
                    <AdminSelect
                      name="roleSlug"
                      options={assignableRoles.map(([slug, role]) => ({ value: slug, label: role.label }))}
                    />
                  </AdminField>
                  <AdminField label="Catatan">
                    <AdminInput name="note" placeholder="Catatan persetujuan (opsional)" />
                  </AdminField>
                  <AdminButton type="submit">
                    <Check size={15} /> Setujui
                  </AdminButton>
                </form>
              ) : null}
            </AdminListRow>
          ))
        )}
      </div>
    </AdminPage>
  );
}
