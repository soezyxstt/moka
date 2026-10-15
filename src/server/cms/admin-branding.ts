import { eq } from "drizzle-orm";
import { database } from "@/server/db/client";
import { editions, mediaAssets } from "@/server/db/schema";
import { readEditionSiteAssets } from "./site-assets";
import { resolveBrandLogos } from "./brand-assets";
import type { AdminBranding } from "@/components/admin/branding";

export async function getAdminBranding(editionId: string): Promise<AdminBranding> {
  const [edition] = await database.select({ name: editions.name, slogan: editions.slogan, logoUrl: mediaAssets.url, logoAlt: mediaAssets.alt, logoLifecycle: mediaAssets.lifecycle }).from(editions).leftJoin(mediaAssets, eq(editions.logoMediaId, mediaAssets.id)).where(eq(editions.id, editionId)).limit(1);
  if (!edition) throw new Error("Edisi tidak ditemukan");
  const [brand, site] = await Promise.all([readEditionSiteAssets(database, editionId, "brand"), readEditionSiteAssets(database, editionId, "site")]);
  return { title: edition.name, slogan: edition.slogan, logo: resolveBrandLogos(brand, { logoUrl: edition.logoLifecycle === "ready" ? edition.logoUrl : null, logoAlt: edition.logoAlt }).mobile, background: site["site.profile.bg"]?.url ?? null };
}
