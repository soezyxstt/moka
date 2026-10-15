import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import test from "node:test";
import * as schema from "./schema";
import { editionPaletteSchema, parseEditionPalette, readEditionPalette, saveEditionPalette } from "../cms/edition-palette";

const css = readFileSync("src/app/globals.css", "utf8");
const scope = css.match(/:root\[data-edition-year="2026"\]\s*\{([^}]+)\}/)![1];
const palette = { dark: scope.match(/--palette-dark:\s*([^;]+);/)![1], light: scope.match(/--palette-light:\s*([^;]+);/)![1] };

test("palette validates color inputs, order, contrast and ignores invalid stored values", () => {
  assert.deepEqual(parseEditionPalette(JSON.stringify(palette)), palette);
  for (const input of [null, "{", JSON.stringify({ ...palette, dark: "url(example)" }), JSON.stringify({ dark: palette.light, light: palette.dark }), JSON.stringify({ dark: palette.light, light: palette.light })]) assert.equal(parseEditionPalette(input), null);
  assert.equal(editionPaletteSchema.safeParse({ ...palette, injected: true }).success, false);
});

test("palette publishing isolates editions, checks versions and archives, and rolls back failed audit", async () => {
  const directory = await mkdtemp(join(tmpdir(), "moka-palette-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  const actor = { actorUserId: "actor", actorLabel: "operator@example.com" };
  const input = { editionId: "2026", expectedVersion: null, palette, ...actor };
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    await db.insert(schema.authUsers).values({ id: "actor", name: "Operator", email: actor.actorLabel });
    await db.insert(schema.editions).values([{ id: "2025", year: 2025, slug: "2025", name: "2025", lifecycle: "active" }, { id: "2026", year: 2026, slug: "2026", name: "2026" }]);
    const historical = await db.select().from(schema.editions).where(eq(schema.editions.id, "2025"));
    await saveEditionPalette(db, input);
    assert.deepEqual(await readEditionPalette(db, "2026"), { palette, version: 1 });
    assert.deepEqual(await readEditionPalette(db, "2025"), { palette: null, version: null });
    assert.deepEqual(await db.select().from(schema.editions).where(eq(schema.editions.id, "2025")), historical);
    await assert.rejects(saveEditionPalette(db, input), /berubah/);
    await client.execute("CREATE TRIGGER fail_palette_audit BEFORE INSERT ON auditLog BEGIN SELECT RAISE(ABORT, 'audit failed'); END");
    await assert.rejects(saveEditionPalette(db, { ...input, expectedVersion: 1 }));
    assert.equal((await readEditionPalette(db, "2026")).version, 1);
    assert.equal((await db.select().from(schema.contentRevisions)).length, 1);
    await client.execute("DROP TRIGGER fail_palette_audit");
    await saveEditionPalette(db, { ...input, expectedVersion: 1 });
    assert.equal((await readEditionPalette(db, "2026")).version, 2);
    const row = (await db.select().from(schema.pageSections))[0];
    await db.insert(schema.contentDrafts).values({ resourceType: "pageSection", resourceId: row.id, baseVersion: 2, snapshotJson: "{}", authorUserId: actor.actorUserId });
    await assert.rejects(saveEditionPalette(db, { ...input, expectedVersion: 2 }), /draf/);
    await db.update(schema.editions).set({ lifecycle: "archived" }).where(eq(schema.editions.id, "2026"));
    await assert.rejects(saveEditionPalette(db, { ...input, expectedVersion: 2 }), /arsip/);
    assert.equal((await db.select().from(schema.auditLogs)).length, 2);
  } finally { client.close(); }
});
