import { eq } from "drizzle-orm";
import { AdminBadge, AdminEmptyState, AdminListRow, AdminPage, AdminSection } from "@/components/admin/primitives";
import { database } from "@/server/db/client";
import { accessRequests, adminProfiles, authUsers, roles, userRoles } from "@/server/db/schema";
import { requireRoleAdministrator } from "@/server/auth/authorization";
import { roleTemplates } from "@/server/auth/permissions";
import { AccessRequestForm } from "./access-request-form";
import { UserRolesForm } from "./user-roles-form";

export default async function UsersPage() {
  await requireRoleAdministrator();

  const [requests, usersRows, assignedRows] = await Promise.all([
    database
      .select({ request: accessRequests, email: authUsers.email, name: authUsers.name })
      .from(accessRequests)
      .innerJoin(authUsers, eq(authUsers.id, accessRequests.userId))
      .orderBy(accessRequests.createdAt),
    database
      .select({ user: authUsers, profile: adminProfiles })
      .from(authUsers)
      .leftJoin(adminProfiles, eq(adminProfiles.userId, authUsers.id))
      .orderBy(authUsers.name),
    database
      .select({ userId: userRoles.userId, slug: roles.slug })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId)),
  ]);

  const rolesByUser = new Map<string, Set<string>>();
  for (const row of assignedRows) {
    const set = rolesByUser.get(row.userId) ?? new Set<string>();
    set.add(row.slug);
    rolesByUser.set(row.userId, set);
  }

  const assignableRoles = Object.entries(roleTemplates).filter(([slug]) => slug !== "super_admin");
  const openCount = requests.filter(({ request }) => request.status === "open").length;

  return (
    <AdminPage
      title="Pengguna dan akses"
      action={openCount > 0 ? <span className="text-sm text-muted-foreground">{openCount} permintaan terbuka</span> : null}
    >
      <div className="space-y-8">
        <AdminSection title="Permintaan akses" className="border-t-0 pt-0">
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
                    <AccessRequestForm requestId={request.id} assignableRoles={assignableRoles} />
                  ) : null}
                </AdminListRow>
              ))
            )}
          </div>
        </AdminSection>

        <AdminSection title="Daftar pengguna">
          <div className="divide-y divide-brand-100 rounded-xl border border-brand-100 bg-card p-4 sm:p-6">
            {usersRows.length === 0 ? (
              <AdminEmptyState icon="users" title="Belum ada pengguna" />
            ) : (
              usersRows.map(({ user, profile }) => {
                const currentSlugs = rolesByUser.get(user.id) ?? new Set<string>();
                const isSuperAdmin = currentSlugs.has("super_admin");
                const status = profile?.status ?? "pending";

                return (
                  <AdminListRow
                    key={user.id}
                    title={user.name}
                    meta={user.email}
                    action={<AdminBadge value={status} />}
                  >
                    {isSuperAdmin ? (
                      <p className="mt-2 text-xs font-medium text-brand-700">
                        Super Admin aktif (ditetapkan melalui runbook database).
                      </p>
                    ) : null}
                    <UserRolesForm
                      userId={user.id}
                      initialRoleSlugs={[...currentSlugs]}
                      assignableRoles={assignableRoles}
                    />
                  </AdminListRow>
                );
              })
            )}
          </div>
        </AdminSection>
      </div>
    </AdminPage>
  );
}

