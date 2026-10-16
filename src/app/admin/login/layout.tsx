import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth/config";

export default async function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/admin");
  return children;
}
