import { and, eq } from "drizzle-orm";
import type { Database } from "@/server/db/queries";
import { categories, categoryValues, editions, mediaAssets, organizationPeriods, pageSections, siteAssetBindings } from "@/server/db/schema";
import { SITE_ASSET_SLOTS } from "./site-asset-manifest";

export const DEFAULT_CATEGORIES = [
  { code: "JD", label: "JD", slug: "jajaka-dewasa" },
  { code: "MD", label: "MD", slug: "mojang-dewasa" },
  { code: "JR", label: "JR", slug: "jajaka-remaja" },
  { code: "MR", label: "MR", slug: "mojang-remaja" },
] as const;

export async function getEditionReadiness(db: Pick<Database, "select">, editionId: string) {
  const [edition] = await db.select().from(editions).where(eq(editions.id, editionId)).limit(1);
  if (!edition) throw new Error("Edisi tidak ditemukan");
  const [categoryRows, sections, bindings, logoRows, periods] = await Promise.all([
    db.select().from(categories).where(and(eq(categories.editionId, editionId), eq(categories.active, true))),
    db.select().from(pageSections).where(and(eq(pageSections.editionId, editionId), eq(pageSections.status, "published"))),
    db.select({ key: siteAssetBindings.slotKey, mimeType: mediaAssets.mimeType, lifecycle: mediaAssets.lifecycle, url: mediaAssets.url }).from(siteAssetBindings).innerJoin(mediaAssets, eq(siteAssetBindings.mediaId, mediaAssets.id)).where(eq(siteAssetBindings.editionId, editionId)),
    edition.logoMediaId ? db.select().from(mediaAssets).where(eq(mediaAssets.id, edition.logoMediaId)) : Promise.resolve([]),
    edition.organizationPeriodId ? db.select().from(organizationPeriods).where(eq(organizationPeriods.id, edition.organizationPeriodId)) : Promise.resolve([]),
  ]);
  const period = periods[0];
  const logo = logoRows[0];
  return [
    { label: "Empat kategori peserta", href: "/admin/content/editions", ready: categoryRows.length === 4 && categoryValues.every((code) => categoryRows.some((row) => row.code === code)) },
    { label: "Logo dan slogan", href: "/admin/content/edition-settings", ready: Boolean(edition.slogan?.trim() && logo?.lifecycle === "ready" && logo.mimeType.startsWith("image/") && /^https:\/\//.test(logo.url)) },
    { label: "Periode kepengurusan", href: "/admin/organization", ready: Boolean(period && period.lifecycle !== "draft" && period.startYear <= edition.year && period.endYear >= edition.year) },
    ...["home/hero", "tentang/hero", "site/identity"].map((key) => ({ label: { "home/hero": "Teks hero beranda", "tentang/hero": "Teks pengantar Tentang", "site/identity": "Identitas dan deskripsi situs" }[key]!, href: "/admin/content/pages", ready: sections.some((section) => `${section.pageKey}/${section.sectionKey}` === key && Boolean(section.title?.trim() && section.body?.trim())) })),
    ...SITE_ASSET_SLOTS.filter((slot) => slot.required).map((slot) => ({ label: slot.label, href: "/admin/content/site-assets", ready: bindings.some((binding) => binding.key === slot.slotKey && binding.lifecycle === "ready" && binding.mimeType.startsWith(`${slot.acceptType}/`) && /^https:\/\//.test(binding.url)) })),
  ];
}
