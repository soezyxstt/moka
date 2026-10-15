"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { saveSiteAssetBinding } from "@/server/cms/site-assets";
import { database } from "@/server/db/client";

async function saveBinding(formData: FormData, remove: boolean) {
  const actor = await requirePermission("content.edit");
  const edition = await getAdminEditionContext();
  const editionId = String(formData.get("editionId") ?? "");
  if (!edition || edition.id !== editionId) throw new Error("Edisi pilihan berubah. Muat ulang halaman sebelum menyimpan.");
  const coordinate = (key: string) => {
    const value = formData.get(key);
    return value === null || value === "" ? null : Number(value);
  };
  const saved = await saveSiteAssetBinding(database, {
    editionId, slotKey: String(formData.get("slotKey") ?? "").trim(),
    mediaId: remove ? null : String(formData.get("mediaId") ?? "").trim() || null,
    version: Number(formData.get("version")),
    altOverride: String(formData.get("altOverride") ?? "").trim() || null,
    focalX: remove ? null : coordinate("focalX"), focalY: remove ? null : coordinate("focalY"),
  }, { actorUserId: actor.session.user.id, actorLabel: actor.session.user.email });
  revalidatePath("/admin/content/site-assets");
  revalidatePath("/", "layout");
  return { version: saved.version };
}

export async function bindSiteAssetAction(formData: FormData) {
  return saveBinding(formData, false);
}

export async function unbindSiteAssetAction(formData: FormData) {
  return saveBinding(formData, true);
}
