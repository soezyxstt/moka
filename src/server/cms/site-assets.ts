import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { appendAuditLog } from "@/server/auth/audit";
import type { Database } from "@/server/db/queries";
import { contentRevisions, editions, mediaAssets, siteAssetBindings } from "@/server/db/schema";
import { getSlotDefinition, getSlotsByGroup, type SiteAssetGroup, type SiteAssetSlotDefinition } from "./site-asset-manifest";

export type PublicSiteAsset = { url: string; alt: string | null; mimeType: string };
export type PublicSiteAssets = Record<string, PublicSiteAsset>;

export function acceptsSiteAsset(slot: SiteAssetSlotDefinition, mimeType: string) {
  return slot.mimeTypes ? slot.mimeTypes.includes(mimeType) : mimeType.startsWith(`${slot.acceptType}/`);
}

export async function readEditionSiteAssets(db: Pick<Database, "select">, editionId: string, group: SiteAssetGroup): Promise<PublicSiteAssets> {
  const slots = getSlotsByGroup(group);
  const rows = await db.select({ key: siteAssetBindings.slotKey, url: mediaAssets.url, alt: siteAssetBindings.altOverride, assetAlt: mediaAssets.alt, mimeType: mediaAssets.mimeType })
    .from(siteAssetBindings).innerJoin(mediaAssets, eq(siteAssetBindings.mediaId, mediaAssets.id))
    .where(and(eq(siteAssetBindings.editionId, editionId), eq(mediaAssets.lifecycle, "ready"), inArray(siteAssetBindings.slotKey, slots.map((slot) => slot.slotKey))));
  return Object.fromEntries(rows.filter((row) => /^https:\/\//i.test(row.url) && acceptsSiteAsset(getSlotDefinition(row.key)!, row.mimeType))
    .map((row) => [row.key, { url: row.url, alt: row.alt?.trim() || row.assetAlt, mimeType: row.mimeType }]));
}

const bindingSchema = z.object({
  editionId: z.string().min(1), slotKey: z.string().min(1), mediaId: z.string().min(1).nullable(),
  version: z.number().int().min(0), altOverride: z.string().max(500).nullable(),
  focalX: z.number().finite().min(0).max(100).nullable(), focalY: z.number().finite().min(0).max(100).nullable(),
});

export async function saveSiteAssetBinding(db: Database, input: z.input<typeof bindingSchema>, actor: { actorUserId: string; actorLabel: string }) {
  const patch = bindingSchema.parse(input);
  const slot = getSlotDefinition(patch.slotKey);
  if (!slot) throw new Error("Slot aset tidak terdaftar");
  return db.transaction(async (tx) => {
    const [edition] = await tx.select().from(editions).where(eq(editions.id, patch.editionId)).limit(1);
    if (!edition || edition.lifecycle === "archived") throw new Error("Aset edisi arsip hanya dapat dibaca");
    const [previous] = await tx.select().from(siteAssetBindings).where(and(eq(siteAssetBindings.editionId, patch.editionId), eq(siteAssetBindings.slotKey, patch.slotKey))).limit(1);
    if ((previous?.version ?? 0) !== patch.version) throw new Error("Aset berubah. Muat ulang halaman.");
    if (patch.mediaId) {
      const [asset] = await tx.select().from(mediaAssets).where(eq(mediaAssets.id, patch.mediaId)).limit(1);
      if (!asset || asset.lifecycle !== "ready" || !/^https:\/\//i.test(asset.url) || !acceptsSiteAsset(slot, asset.mimeType)) throw new Error("Media belum siap atau formatnya tidak sesuai slot");
    }
    if (previous) await tx.insert(contentRevisions).values({ resourceType: "siteAssetBinding", resourceId: previous.id, version: previous.version, snapshotJson: JSON.stringify(previous), authorUserId: actor.actorUserId, reason: "Penggantian aset edisi" });
    const after = { editionId: patch.editionId, slotKey: patch.slotKey, mediaId: patch.mediaId, altOverride: patch.mediaId ? patch.altOverride : null, focalX: patch.mediaId ? patch.focalX : null, focalY: patch.mediaId ? patch.focalY : null, version: patch.version + 1, updatedAt: new Date() };
    const [saved] = previous
      ? await tx.update(siteAssetBindings).set(after).where(and(eq(siteAssetBindings.id, previous.id), eq(siteAssetBindings.version, patch.version))).returning()
      : await tx.insert(siteAssetBindings).values(after).returning();
    if (!saved) throw new Error("Aset berubah. Muat ulang halaman.");
    await appendAuditLog(tx, { ...actor, action: patch.mediaId ? "site_asset.bind" : "site_asset.unbind", resourceType: "siteAssetBinding", resourceId: saved.id, resourceLabel: `${edition.name}: ${slot.label}`, before: previous, after: saved, changedFields: ["mediaId", "altOverride", "focalX", "focalY", "version"], source: "admin-content" });
    return saved;
  });
}
