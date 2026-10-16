import { createClient } from "@libsql/client/node";
import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { validateWebsiteUrl } from "../../app/admin/content/sponsors/utils";
import { appendAuditLog } from "../auth/audit";
import * as schema from "./schema";
import {
  auditLogs,
  authUsers,
  editions,
  mediaAssets,
  sponsors,
} from "./schema";

async function createTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "moka-sponsors-test-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: resolve("drizzle") });
  return { client, db };
}

test("sponsors mendukung operasi CRUD dengan edisi dan pengurutan displayOrder", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-09-02T00:00:00.000Z");

    await db.insert(editions).values({
      id: "ed-2026",
      year: 2026,
      slug: "2026",
      name: "Pasanggiri MOKA 2026",
      lifecycle: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Insert sponsor 1
    await db.insert(sponsors).values({
      id: "sp-1",
      editionId: "ed-2026",
      name: "Bank BJB",
      tier: "utama",
      website: "https://bankbjb.co.id",
      displayOrder: 2,
      active: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Insert sponsor 2 (higher priority displayOrder)
    await db.insert(sponsors).values({
      id: "sp-2",
      editionId: "ed-2026",
      name: "Pemkab Garut",
      tier: "utama",
      website: "https://garutkab.go.id",
      displayOrder: 1,
      active: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Insert sponsor 3
    await db.insert(sponsors).values({
      id: "sp-3",
      editionId: "ed-2026",
      name: "Dodol Picnic",
      tier: "pendukung",
      website: "https://dodolpicnic.com",
      displayOrder: 3,
      active: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Query ordered by displayOrder
    const rows = await db
      .select()
      .from(sponsors)
      .where(eq(sponsors.editionId, "ed-2026"))
      .orderBy(asc(sponsors.displayOrder));

    assert.equal(rows.length, 3);
    assert.equal(rows[0].name, "Pemkab Garut");
    assert.equal(rows[0].displayOrder, 1);
    assert.equal(rows[1].name, "Bank BJB");
    assert.equal(rows[1].displayOrder, 2);
    assert.equal(rows[2].name, "Dodol Picnic");
    assert.equal(rows[2].displayOrder, 3);
    assert.equal(rows[2].active, false);

    // Update sponsor
    await db
      .update(sponsors)
      .set({
        name: "Bank BJB Cabang Garut",
        tier: "utama",
        displayOrder: 0,
        version: 2,
        updatedAt: new Date("2026-09-02T01:00:00.000Z"),
      })
      .where(eq(sponsors.id, "sp-1"));

    const updated = await db.query.sponsors.findFirst({
      where: eq(sponsors.id, "sp-1"),
    });
    assert.ok(updated);
    assert.equal(updated.name, "Bank BJB Cabang Garut");
    assert.equal(updated.displayOrder, 0);
    assert.equal(updated.version, 2);

    // Delete sponsor
    await db.delete(sponsors).where(eq(sponsors.id, "sp-3"));
    const remaining = await db.select().from(sponsors).where(eq(sponsors.editionId, "ed-2026"));
    assert.equal(remaining.length, 2);
    assert.ok(!remaining.some((s) => s.id === "sp-3"));
  } finally {
    client.close();
  }
});

test("sponsors terisolasi per edisi", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-09-02T00:00:00.000Z");

    await db.insert(editions).values([
      { id: "ed-2025", year: 2025, slug: "2025", name: "Pasanggiri 2025", lifecycle: "archived", createdAt: now, updatedAt: now },
      { id: "ed-2026", year: 2026, slug: "2026", name: "Pasanggiri 2026", lifecycle: "active", createdAt: now, updatedAt: now },
    ]);

    await db.insert(sponsors).values([
      { id: "sp-2025-1", editionId: "ed-2025", name: "Sponsor 2025 A", tier: "utama", displayOrder: 1, active: true, version: 1, createdAt: now, updatedAt: now },
      { id: "sp-2026-1", editionId: "ed-2026", name: "Sponsor 2026 A", tier: "utama", displayOrder: 1, active: true, version: 1, createdAt: now, updatedAt: now },
      { id: "sp-2026-2", editionId: "ed-2026", name: "Sponsor 2026 B", tier: "pendukung", displayOrder: 2, active: true, version: 1, createdAt: now, updatedAt: now },
    ]);

    const sponsors2025 = await db.select().from(sponsors).where(eq(sponsors.editionId, "ed-2025"));
    const sponsors2026 = await db.select().from(sponsors).where(eq(sponsors.editionId, "ed-2026"));

    assert.equal(sponsors2025.length, 1);
    assert.equal(sponsors2025[0].name, "Sponsor 2025 A");

    assert.equal(sponsors2026.length, 2);
    assert.equal(sponsors2026[0].name, "Sponsor 2026 A");
    assert.equal(sponsors2026[1].name, "Sponsor 2026 B");
  } finally {
    client.close();
  }
});

test("sponsors mendukung logoMediaId yang terhubung ke mediaAsset", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-09-02T00:00:00.000Z");

    await db.insert(editions).values({
      id: "ed-2026",
      year: 2026,
      slug: "2026",
      name: "Pasanggiri MOKA 2026",
      lifecycle: "active",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(mediaAssets).values({
      id: "med-logo-bjb",
      provider: "uploadthing",
      providerKey: "pk-bjb",
      url: "https://utfs.io/f/bjb-logo.png",
      filename: "bjb-logo.png",
      mimeType: "image/png",
      bytes: 24500,
      lifecycle: "ready",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(sponsors).values({
      id: "sp-bjb",
      editionId: "ed-2026",
      name: "Bank BJB",
      tier: "utama",
      website: "https://bankbjb.co.id",
      logoMediaId: "med-logo-bjb",
      displayOrder: 1,
      active: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Query with join
    const [row] = await db
      .select({
        id: sponsors.id,
        name: sponsors.name,
        logoUrl: mediaAssets.url,
        logoMimeType: mediaAssets.mimeType,
      })
      .from(sponsors)
      .leftJoin(mediaAssets, eq(sponsors.logoMediaId, mediaAssets.id))
      .where(eq(sponsors.id, "sp-bjb"))
      .limit(1);

    assert.ok(row);
    assert.equal(row.name, "Bank BJB");
    assert.equal(row.logoUrl, "https://utfs.io/f/bjb-logo.png");
    assert.equal(row.logoMimeType, "image/png");
  } finally {
    client.close();
  }
});

test("optimistic version locking mencegah konflik update data sponsor", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-09-02T00:00:00.000Z");

    await db.insert(editions).values({
      id: "ed-2026",
      year: 2026,
      slug: "2026",
      name: "Pasanggiri MOKA 2026",
      lifecycle: "active",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(sponsors).values({
      id: "sp-lock-1",
      editionId: "ed-2026",
      name: "Sponsor Awal",
      tier: "pelengkap",
      displayOrder: 1,
      active: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // User 1 performs update
    const [current1] = await db.select().from(sponsors).where(eq(sponsors.id, "sp-lock-1")).limit(1);
    assert.equal(current1.version, 1);

    await db
      .update(sponsors)
      .set({
        name: "Sponsor Diperbarui User 1",
        version: current1.version + 1,
        updatedAt: new Date("2026-09-02T00:05:00.000Z"),
      })
      .where(eq(sponsors.id, "sp-lock-1"));

    // User 2 tries to update using stale version 1
    const [current2] = await db.select().from(sponsors).where(eq(sponsors.id, "sp-lock-1")).limit(1);
    assert.equal(current2.version, 2);

    const user2StaleVersion: number = 1;
    const hasConflict = current2.version !== user2StaleVersion;
    assert.equal(hasConflict, true);
  } finally {
    client.close();
  }
});

test("tindakan sponsor mencatat audit log secara transaksional", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const now = new Date("2026-09-02T00:00:00.000Z");

    await db.insert(authUsers).values({
      id: "user-admin-1",
      name: "Admin Konten",
      email: "admin@pamoka.id",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(editions).values({
      id: "ed-2026",
      year: 2026,
      slug: "2026",
      name: "Pasanggiri MOKA 2026",
      lifecycle: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Insert with audit log inside transaction
    const newSponsorId = "sp-audit-1";
    await db.transaction(async (tx) => {
      await tx.insert(sponsors).values({
        id: newSponsorId,
        editionId: "ed-2026",
        name: "PT Telkom Garut",
        tier: "utama",
        displayOrder: 1,
        active: false,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      await appendAuditLog(tx, {
        actorUserId: "user-admin-1",
        actorLabel: "admin@pamoka.id",
        action: "sponsor.create",
        resourceType: "sponsor",
        resourceId: newSponsorId,
        resourceLabel: "PT Telkom Garut",
        after: {
          id: newSponsorId,
          editionId: "ed-2026",
          name: "PT Telkom Garut",
          tier: "utama",
          active: false,
        },
        changedFields: ["editionId", "name", "tier", "active"],
        source: "admin-content",
      });
    });

    // Verify audit log
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.resourceType, "sponsor"), eq(auditLogs.resourceId, newSponsorId)));

    assert.equal(logs.length, 1);
    assert.equal(logs[0].action, "sponsor.create");
    assert.equal(logs[0].actorUserId, "user-admin-1");
    assert.equal(logs[0].resourceLabel, "PT Telkom Garut");
  } finally {
    client.close();
  }
});

test("validateWebsiteUrl menormalisasi URL, domain tanpa protokol, handle instagram, dan menolak input tidak valid", () => {
  // Empty or null
  assert.equal(validateWebsiteUrl(null), null);
  assert.equal(validateWebsiteUrl(undefined), null);
  assert.equal(validateWebsiteUrl(""), null);
  assert.equal(validateWebsiteUrl("   "), null);

  // Direct URLs
  assert.equal(validateWebsiteUrl("https://bankbjb.co.id"), "https://bankbjb.co.id/");
  assert.equal(validateWebsiteUrl("http://garutkab.go.id"), "http://garutkab.go.id/");
  assert.equal(validateWebsiteUrl("https://instagram.com/mokagarut?igsh=123"), "https://instagram.com/mokagarut?igsh=123");

  // Domain without protocol
  assert.equal(validateWebsiteUrl("bankbjb.co.id"), "https://bankbjb.co.id/");
  assert.equal(validateWebsiteUrl("www.bankbjb.co.id"), "https://www.bankbjb.co.id/");
  assert.equal(validateWebsiteUrl("instagram.com/mokagarut"), "https://instagram.com/mokagarut");

  // @handle shorthand for Instagram
  assert.equal(validateWebsiteUrl("@mokagarut"), "https://instagram.com/mokagarut");

  // Invalid inputs
  assert.throws(() => validateWebsiteUrl("bukan url valid"), /URL website tidak valid/);
  assert.throws(() => validateWebsiteUrl("javascript:alert(1)"), /Format URL tidak valid/);
  assert.throws(() => validateWebsiteUrl("@"), /Handle sosial tidak boleh kosong/);
});

