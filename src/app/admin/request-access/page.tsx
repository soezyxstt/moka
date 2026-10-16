import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminAuthShell } from "@/components/admin/admin-shell";
import { auth } from "@/server/auth/config";
import { ensurePendingAdminProfile } from "@/server/auth/authorization";
import { RequestAccessForm } from "./request-access-form";

export default async function RequestAccessPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/admin/login");
  await ensurePendingAdminProfile(session.user.id);

  return (
    <AdminAuthShell title="Minta akses">
      <RequestAccessForm />
    </AdminAuthShell>
  );
}
