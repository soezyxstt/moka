import { eq } from "drizzle-orm";
import { Check } from "lucide-react";
import { AdminBadge, AdminButton, AdminEmptyState, AdminField, AdminInput, AdminListRow, AdminPage, AdminSection } from "@/components/admin/primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { database } from "@/server/db/client";
import { accessRequests, adminProfiles, authUsers, roles, userRoles } from "@/server/db/schema";
import { requireRoleAdministrator } from "@/server/auth/authorization";
import { roleTemplates } from "@/server/auth/permissions";
import { approveAction, updateUserRolesAction } from "./actions";

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
                    <form
                      action={approveAction}
                      className="mt-3 space-y-4 border-l-2 border-brand bg-brand-50/40 p-4"
                    >
                      <input type="hidden" name="requestId" value={request.id} />
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-semibold text-foreground">Peran</legend>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {assignableRoles.map(([slug, role], idx) => (
                            <label
                              key={slug}
                              htmlFor={`req-${request.id}-${slug}`}
                              className="flex cursor-pointer items-center gap-2 rounded-md border border-brand-100 bg-canvas px-3 py-2 text-sm text-foreground transition-colors has-[[data-state=checked]]:border-brand-300 has-[[data-state=checked]]:bg-brand-50"
                            >
                              <Checkbox id={`req-${request.id}-${slug}`} name="roleSlugs" value={slug} defaultChecked={idx === 0} />
                              <span>{role.label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                        <AdminField label="Catatan">
                          <AdminInput name="note" placeholder="Catatan persetujuan (opsional)" />
                        </AdminField>
                        <AdminButton type="submit">
                          <Check size={15} /> Setujui
                        </AdminButton>
                      </div>
                    </form>
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
                    <form
                      action={updateUserRolesAction}
                      className="mt-3 space-y-4 rounded-md border border-brand-100 bg-brand-50/25 p-4"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <fieldset className="space-y-2">
                        <legend className="text-sm font-semibold text-foreground">Peran pengguna</legend>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {assignableRoles.map(([slug, role]) => (
                            <label
                              key={slug}
                              htmlFor={`user-${user.id}-${slug}`}
                              className="flex cursor-pointer items-center gap-2 rounded-md border border-brand-100 bg-canvas px-3 py-2 text-sm text-foreground transition-colors has-[[data-state=checked]]:border-brand-300 has-[[data-state=checked]]:bg-brand-50"
                            >
                              <Checkbox
                                id={`user-${user.id}-${slug}`}
                                name="roleSlugs"
                                value={slug}
                                defaultChecked={currentSlugs.has(slug)}
                              />
                              <span>{role.label}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                        <AdminField label="Alasan perubahan">
                          <AdminInput name="reason" placeholder="Alasan pembaruan peran (opsional)" />
                        </AdminField>
                        <AdminButton type="submit" variant="secondary">
                          Simpan peran
                        </AdminButton>
                      </div>
                    </form>
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

