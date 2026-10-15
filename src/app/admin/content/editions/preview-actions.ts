"use server";

import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { editions } from "@/server/db/schema";
import { PREVIEW_EDITION_COOKIE } from "@/server/cms/preview";

export async function previewEditionAction(formData: FormData) {
  await requirePermission("content.view");
  const id = String(formData.get("editionId") ?? "");
  const [edition] = await database.select({ id: editions.id }).from(editions).where(eq(editions.id, id)).limit(1);
  if (!edition) throw new Error("Edisi tidak ditemukan");
  (await cookies()).set(PREVIEW_EDITION_COOKIE, edition.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 3600 });
  (await draftMode()).enable();
  redirect("/");
}

export async function stopPreviewAction() {
  (await draftMode()).disable();
  (await cookies()).delete(PREVIEW_EDITION_COOKIE);
  redirect("/admin/content/editions");
}
