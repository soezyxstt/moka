import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import * as schema from "./schema";
import { acceptsSiteAsset, readEditionSiteAssets, saveSiteAssetBinding } from "../cms/site-assets";
import { getSlotDefinition } from "../cms/site-asset-manifest";
import { brandManifestIcons, brandMetadata, resolveBrandLogos } from "../cms/brand-assets";
import { assertStaticSvg } from "../media/static-svg";
import { validateMediaFiles } from "../media/upload-validation";

test("SVG hanya menerima vektor statis; format ikon dan OG terpisah", () => {
  assert.doesNotThrow(() => assertStaticSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g fill="currentColor"><path d="M0 0L10 10" /></g></svg>'));
  for (const unsafe of ['<svg><script>alert(1)</script></svg>', '<svg onload="alert(1)"/>', '<svg><image href="https://example.com/a"/></svg>', '<svg><path style="fill:currentColor"/></svg>', '<svg><path fill="url(https://example.com/a)"/></svg>', '<!DOCTYPE svg><svg/>', '<html/>']) assert.throws(() => assertStaticSvg(unsafe), /SVG/);
  assert.throws(() => assertStaticSvg('<?xml-stylesheet href="https://example.com/style.css"?><svg/>'), /SVG/);
  assert.throws(() => assertStaticSvg('<svg><path fill="u\\72l(https://example.com/a)"/></svg>'), /SVG/);
  assert.equal(validateMediaFiles([{ name: "logo.svg", type: "image/svg+xml", size: 100 }], "image").accepted.length, 1);
  assert.equal(acceptsSiteAsset(getSlotDefinition("brand.logo.dark")!, "image/svg+xml"), true);
  assert.equal(acceptsSiteAsset(getSlotDefinition("site.social.image")!, "image/svg+xml"), false);
  assert.equal(acceptsSiteAsset(getSlotDefinition("brand.apple")!, "image/svg+xml"), false);
});

test("metadata dan logo menggunakan varian edisi; tanpa fallback lintas tahun", () => {
  const navy = { url: "https://example.com/navy.svg", alt: "Navy", mimeType: "image/svg+xml" };
  const gold = { ...navy, url: "https://example.com/gold.svg" };
  const assets = { "brand.logo.light": navy, "brand.logo.dark": gold, "brand.favicon": navy, "site.social.image": { ...navy, url: "https://example.com/og.png", mimeType: "image/png" }, "brand.icon192": { ...navy, url: "https://example.com/192.png", mimeType: "image/png" }, "brand.maskable": { ...navy, url: "https://example.com/maskable.png", mimeType: "image/png" } };
  assert.deepEqual(resolveBrandLogos(assets, { logoUrl: "https://example.com/legacy.png", logoAlt: "Legacy" }), { desktop: gold, mobile: navy, footer: gold });
  assert.deepEqual(resolveBrandLogos({}, { logoUrl: null, logoAlt: null }), { desktop: null, mobile: null, footer: null });
  assert.deepEqual(brandMetadata({}).icons, { icon: [], apple: [] });
  assert.deepEqual(brandMetadata(assets).icons, { icon: [{ url: navy.url, type: navy.mimeType }], apple: [] });
  assert.deepEqual(brandManifestIcons(assets).map((icon) => icon.purpose), ["any", "maskable"]);
  assert.equal(brandMetadata(assets).manifest, "/manifest.webmanifest");
});

test("penggantian 2026 menjaga binding/media 2025, revisi, audit, konflik, dan arsip", async () => {
  const directory = await mkdtemp(join(tmpdir(), "moka-brand-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  const actor = { actorUserId: "actor", actorLabel: "admin@example.com" };
  try {
    await migrate(db, { migrationsFolder: resolve("drizzle") });
    await db.insert(schema.authUsers).values({ id: "actor", name: "Admin", email: actor.actorLabel });
    await db.insert(schema.mediaAssets).values(["old", "new", "replacement"].map((id) => ({ id, provider: "uploadthing", url: `https://example.com/${id}.png`, filename: `${id}.png`, mimeType: "image/png", bytes: 10 })));
    await db.insert(schema.editions).values([{ id: "2025", year: 2025, slug: "2025", name: "2025", lifecycle: "active", logoMediaId: "old" }, { id: "2026", year: 2026, slug: "2026", name: "2026" }]);
    await db.insert(schema.siteAssetBindings).values({ id: "historical", editionId: "2025", slotKey: "brand.logo.dark", mediaId: "old" });
    const historical = await db.select().from(schema.siteAssetBindings).where(eq(schema.siteAssetBindings.editionId, "2025"));
    const oldMedia = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, "old"));
    const patch = { editionId: "2026", slotKey: "brand.logo.dark", mediaId: "new", version: 0, altOverride: "2026", focalX: null, focalY: null };
    await saveSiteAssetBinding(db, patch, actor);
    await saveSiteAssetBinding(db, { ...patch, mediaId: "replacement", version: 1 }, actor);
    assert.deepEqual(await db.select().from(schema.siteAssetBindings).where(eq(schema.siteAssetBindings.editionId, "2025")), historical);
    assert.deepEqual(await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, "old")), oldMedia);
    assert.equal((await readEditionSiteAssets(db, "2025", "brand"))[patch.slotKey].url, "https://example.com/old.png");
    assert.equal((await readEditionSiteAssets(db, "2026", "brand"))[patch.slotKey].url, "https://example.com/replacement.png");
    const revisions = await db.select().from(schema.contentRevisions);
    assert.equal(revisions.length, 1);
    assert.equal(JSON.parse(revisions[0].snapshotJson).mediaId, "new");
    await assert.rejects(saveSiteAssetBinding(db, { ...patch, version: 1 }, actor), /berubah/);
    await saveSiteAssetBinding(db, { ...patch, mediaId: null, version: 2 }, actor);
    assert.deepEqual(await readEditionSiteAssets(db, "2026", "brand"), {});
    assert.equal((await db.select().from(schema.mediaAssets)).length, 3);
    await db.update(schema.editions).set({ lifecycle: "archived" }).where(eq(schema.editions.id, "2025"));
    await assert.rejects(saveSiteAssetBinding(db, { ...patch, editionId: "2025", version: 1 }, actor), /arsip/);
    assert.equal((await db.select().from(schema.auditLogs)).length, 3);
    await db.update(schema.mediaAssets).set({ mimeType: "image/svg+xml" }).where(eq(schema.mediaAssets.id, "new"));
    await assert.rejects(saveSiteAssetBinding(db, { ...patch, slotKey: "site.social.image" }, actor), /format/);
    await db.update(schema.mediaAssets).set({ lifecycle: "deleted" }).where(eq(schema.mediaAssets.id, "new"));
    await assert.rejects(saveSiteAssetBinding(db, { ...patch, version: 3 }, actor), /belum siap/);
    assert.equal((await db.select().from(schema.auditLogs)).length, 3);
  } finally { client.close(); }
});
