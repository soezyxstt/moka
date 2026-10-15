import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { readFallbackEditionIds } from "../cms/edition-fallback";
import * as schema from "./schema";

test("fallback mendahulukan edisi terpilih dan hanya mengambil edisi lama yang pernah terbit", async () => {
  const directory = await mkdtemp(join(tmpdir(), "moka-edition-fallback-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: resolve("drizzle") });
    await db.insert(schema.editions).values([
      { id: "current", year: 2026, lifecycle: "draft" },
      { id: "oldest", year: 2022, lifecycle: "archived" },
      { id: "active", year: 2025, lifecycle: "active" },
      { id: "older-draft", year: 2024, lifecycle: "draft" },
      { id: "archived", year: 2023, lifecycle: "archived" },
      { id: "future", year: 2027, lifecycle: "archived" },
    ].map((edition) => ({ ...edition, slug: edition.id, name: edition.id })));
    const before = await db.select().from(schema.editions);
    assert.deepEqual(await readFallbackEditionIds(db, "current"), ["current", "active", "archived", "oldest"]);
    assert.deepEqual(await readFallbackEditionIds(db, "active"), ["active", "archived", "oldest"]);
    assert.deepEqual(await readFallbackEditionIds(db, "oldest"), ["oldest"]);
    await assert.rejects(readFallbackEditionIds(db, "missing"), /Edisi tidak ditemukan/);
    assert.deepEqual(await db.select().from(schema.editions), before);
  } finally { client.close(); }
});
