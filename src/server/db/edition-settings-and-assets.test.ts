import { createClient } from "@libsql/client/node";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  getSlotDefinition,
  getSlotsByGroup,
  isValidSlotKey,
  SITE_ASSET_GROUPS,
  SITE_ASSET_SLOTS,
} from "../cms/site-asset-manifest";
import * as schema from "./schema";
import {
  editionPrograms,
  editions,
  mediaAssets,
  siteAssetBindings,
} from "./schema";

async function createTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "moka-edition-settings-test-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: resolve("drizzle") });
  return { client, db };
}

test("manifest aset situs mendefinisikan seluruh slot tetap dengan metadata lengkap", () => {
  assert.equal(SITE_ASSET_SLOTS.length, 48);
  assert.equal(SITE_ASSET_GROUPS.length, 5);
  assert.equal(getSlotsByGroup("site").length, 2);
  assert.equal(getSlotsByGroup("brand").length, 22);

  const homeSlots = getSlotsByGroup("home");
  const aboutSlots = getSlotsByGroup("about");
  const categorySlots = getSlotsByGroup("category");

  assert.equal(homeSlots.length, 11);
  assert.equal(aboutSlots.length, 5);
  assert.equal(categorySlots.length, 8);

  // Validasi seluruh slot memiliki atribut wajib
  for (const slot of SITE_ASSET_SLOTS) {
    assert.ok(slot.slotKey);
    assert.ok(slot.label);
    assert.ok(slot.description);
    assert.ok(slot.pageRoute);
    assert.ok(slot.aspectRatio);
    assert.ok(slot.acceptType === "image" || slot.acceptType === "video");
    assert.equal(isValidSlotKey(slot.slotKey), true);
    assert.ok(getSlotDefinition(slot.slotKey));
  }

  // Validasi slot kunci spesifik
  assert.equal(isValidSlotKey("home.hero.bg"), true);
  assert.equal(isValidSlotKey("home.hero.fg"), true);
  assert.equal(isValidSlotKey("home.programs.collage.1"), true);
  assert.equal(isValidSlotKey("about.hero.bg"), true);
  assert.equal(isValidSlotKey("site.voting.bg"), true);
  assert.equal(isValidSlotKey("category.jd.poster"), true);
  assert.equal(isValidSlotKey("category.md.video"), true);

  // Validasi penolakan kunci slot yang tidak terdaftar
  assert.equal(isValidSlotKey("random.custom.slot"), false);
  assert.equal(isValidSlotKey("home.unknown.section"), false);
});

test("editions mendukung logoMediaId, slogan, organizationPeriodId, dan version", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-09-02T00:00:00.000Z");

    // Insert dummy media asset
    await db.insert(mediaAssets).values({
      id: "med-logo-1",
      provider: "uploadthing",
      providerKey: "pk-1",
      url: "https://example.com/logo-2026.png",
      filename: "logo-2026.png",
      mimeType: "image/png",
      bytes: 10240,
      createdAt: now,
      updatedAt: now,
    });

    // Insert edition with identity
    await db.insert(editions).values({
      id: "ed-2026",
      year: 2026,
      slug: "2026",
      name: "Pasanggiri MOKA 2026",
      slogan: "Nu Nyunda Tur Nyakola",
      logoMediaId: "med-logo-1",
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    const [saved] = await db
      .select()
      .from(editions)
      .where(eq(editions.id, "ed-2026"))
      .limit(1);

    assert.ok(saved);
    assert.equal(saved.slogan, "Nu Nyunda Tur Nyakola");
    assert.equal(saved.logoMediaId, "med-logo-1");
    assert.equal(saved.version, 1);

    // Update edition identity & increment version
    await db
      .update(editions)
      .set({
        slogan: "Garut Bangkit",
        version: saved.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(editions.id, "ed-2026"));

    const [updated] = await db
      .select()
      .from(editions)
      .where(eq(editions.id, "ed-2026"))
      .limit(1);

    assert.equal(updated.slogan, "Garut Bangkit");
    assert.equal(updated.version, 2);
  } finally {
    client.close();
  }
});

test("editionPrograms mendukung operasi CRUD, pengurutan, dan cascade delete pada edisi", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-09-02T00:00:00.000Z");

    await db.insert(editions).values({
      id: "ed-prog-test",
      year: 2026,
      slug: "2026-prog",
      name: "Pasanggiri 2026",
      createdAt: now,
      updatedAt: now,
    });

    // 1. Create programs
    await db.insert(editionPrograms).values([
      {
        id: "prog-1",
        editionId: "ed-prog-test",
        title: "Karantina & Pembekalan",
        description: "Materi kebudayaan dan etika",
        displayOrder: 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "prog-2",
        editionId: "ed-prog-test",
        title: "Unjuk Kabisa",
        description: "Penampilan bakat seni daerah",
        displayOrder: 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "prog-3",
        editionId: "ed-prog-test",
        title: "Malam Grand Final",
        description: "Penobatan Mojang Jajaka",
        displayOrder: 2,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const progs = await db
      .select()
      .from(editionPrograms)
      .where(eq(editionPrograms.editionId, "ed-prog-test"))
      .orderBy(asc(editionPrograms.displayOrder));

    assert.equal(progs.length, 3);
    assert.equal(progs[0].title, "Karantina & Pembekalan");
    assert.equal(progs[1].title, "Unjuk Kabisa");
    assert.equal(progs[2].title, "Malam Grand Final");

    // 2. Update program
    await db
      .update(editionPrograms)
      .set({
        title: "Karantina Budaya",
        active: false,
      })
      .where(eq(editionPrograms.id, "prog-1"));

    const [prog1Updated] = await db
      .select()
      .from(editionPrograms)
      .where(eq(editionPrograms.id, "prog-1"))
      .limit(1);

    assert.equal(prog1Updated.title, "Karantina Budaya");
    assert.equal(prog1Updated.active, false);

    // 3. Reorder
    await db
      .update(editionPrograms)
      .set({ displayOrder: 2 })
      .where(eq(editionPrograms.id, "prog-1"));
    await db
      .update(editionPrograms)
      .set({ displayOrder: 0 })
      .where(eq(editionPrograms.id, "prog-2"));

    const reordered = await db
      .select()
      .from(editionPrograms)
      .where(eq(editionPrograms.editionId, "ed-prog-test"))
      .orderBy(asc(editionPrograms.displayOrder));

    assert.equal(reordered[0].id, "prog-2");

    // 4. Delete individual program
    await db.delete(editionPrograms).where(eq(editionPrograms.id, "prog-3"));
    const remaining = await db
      .select()
      .from(editionPrograms)
      .where(eq(editionPrograms.editionId, "ed-prog-test"));
    assert.equal(remaining.length, 2);

    // 5. Cascade delete when edition is deleted
    await db.delete(editions).where(eq(editions.id, "ed-prog-test"));
    const afterEditionDelete = await db
      .select()
      .from(editionPrograms)
      .where(eq(editionPrograms.editionId, "ed-prog-test"));
    assert.equal(afterEditionDelete.length, 0);
  } finally {
    client.close();
  }
});

test("siteAssetBindings mendukung binding, altOverride, focal point, unique slot constraint, dan cascade delete", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-09-02T00:00:00.000Z");

    await db.insert(editions).values({
      id: "ed-asset-test",
      year: 2026,
      slug: "2026-asset",
      name: "Pasanggiri 2026",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(mediaAssets).values([
      {
        id: "med-hero-bg",
        provider: "uploadthing",
        providerKey: "pk-hero-bg",
        url: "https://example.com/hero.jpg",
        filename: "hero.jpg",
        mimeType: "image/jpeg",
        bytes: 50000,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "med-video-jd",
        provider: "uploadthing",
        providerKey: "pk-video-jd",
        url: "https://example.com/jd.mp4",
        filename: "jd.mp4",
        mimeType: "video/mp4",
        bytes: 1500000,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // 1. Insert site asset binding
    await db.insert(siteAssetBindings).values({
      id: "bind-1",
      editionId: "ed-asset-test",
      slotKey: "home.hero.bg",
      mediaId: "med-hero-bg",
      altOverride: "Pemandangan Garut Latar Hero",
      focalX: 50,
      focalY: 40,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    const [bind1] = await db
      .select()
      .from(siteAssetBindings)
      .where(
        and(
          eq(siteAssetBindings.editionId, "ed-asset-test"),
          eq(siteAssetBindings.slotKey, "home.hero.bg")
        )
      )
      .limit(1);

    assert.ok(bind1);
    assert.equal(bind1.mediaId, "med-hero-bg");
    assert.equal(bind1.altOverride, "Pemandangan Garut Latar Hero");
    assert.equal(bind1.focalX, 50);
    assert.equal(bind1.focalY, 40);

    // 2. Enforce unique index on (editionId, slotKey)
    await assert.rejects(
      async () => {
        await db.insert(siteAssetBindings).values({
          id: "bind-duplicate",
          editionId: "ed-asset-test",
          slotKey: "home.hero.bg",
          mediaId: "med-hero-bg",
          version: 1,
          createdAt: now,
          updatedAt: now,
        });
      },
      (err: unknown) => {
        const errorString = String(err);
        return errorString.includes("UNIQUE") || errorString.includes("Failed query") || errorString.includes("constraint");
      }
    );

    // 3. Update binding & unbind media
    await db
      .update(siteAssetBindings)
      .set({
        mediaId: null,
        altOverride: null,
        version: bind1.version + 1,
      })
      .where(eq(siteAssetBindings.id, "bind-1"));

    const [unbinded] = await db
      .select()
      .from(siteAssetBindings)
      .where(eq(siteAssetBindings.id, "bind-1"))
      .limit(1);

    assert.equal(unbinded.mediaId, null);
    assert.equal(unbinded.version, 2);

    // 4. Cascade delete when edition is deleted
    await db.delete(editions).where(eq(editions.id, "ed-asset-test"));
    const afterEditionDelete = await db
      .select()
      .from(siteAssetBindings)
      .where(eq(siteAssetBindings.editionId, "ed-asset-test"));
    assert.equal(afterEditionDelete.length, 0);
  } finally {
    client.close();
  }
});
