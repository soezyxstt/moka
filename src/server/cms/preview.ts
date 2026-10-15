import { cookies, draftMode, headers } from "next/headers";
import { cache } from "react";
import { getEffectivePermissions } from "@/server/auth/authorization";
import { auth } from "@/server/auth/config";

export const PREVIEW_EDITION_COOKIE = "pamoka_preview_edition";
export const getPreviewEditionId = cache(async () => {
  if (!(await draftMode()).isEnabled) return null;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await getEffectivePermissions(session.user.id)).has("content.view")) return null;
  return (await cookies()).get(PREVIEW_EDITION_COOKIE)?.value ?? null;
});
