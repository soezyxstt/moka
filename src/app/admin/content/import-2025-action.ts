"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/server/auth/authorization";
import { import2025ContentTransaction } from "@/server/cms/import-2025";

export async function import2025ContentAction() {
  if (process.env.NODE_ENV === "production" || process.env.TURSO_DATABASE_URL !== "file:local.db") {
    throw new Error("Import 2025 tersedia hanya untuk database lokal file:local.db.");
  }

  const actor = await requirePermission("settings.manage");
  const result = await import2025ContentTransaction({
    userId: actor.session.user.id,
    label: actor.session.user.email,
  });

  for (const path of [
    "/", "/tentang", "/galeri", "/rangkaian-kegiatan/[event]", "/profil-finalis/[category]",
    "/profil-semifinalis/[category]", "/voting/[category]", "/voting/hasil/[category]", "/berita/[slug]",
    "/sitemap.xml", "/admin/content", "/admin/content/editions", "/admin/content/pages",
    "/admin/content/events", "/admin/content/galleries", "/admin/content/news", "/admin/organization",
  ]) {
    revalidatePath(path, path.includes("[") ? "page" : undefined);
  }

  return result;
}
