import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { publishPageSection, savePageSectionDraft } from "../cms/page-sections";
import { registrationEditionEligible, registrationLines, registrationRows, registrationVisible } from "../cms/registration";
import * as schema from "./schema";

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "moka-registration-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: resolve("drizzle") });
  await db.insert(schema.authUsers).values({ id: "actor", name: "Admin", email: "admin@example.com" });
  await db.insert(schema.editions).values([
    { id: "old", year: 2025, slug: "2025", name: "2025", lifecycle: "active" },
    { id: "new", year: 2026, slug: "2026", name: "2026" },
    { id: "future", year: 2027, slug: "2027", name: "2027" },
    { id: "archive", year: 2028, slug: "2028", name: "2028", lifecycle: "archived" },
  ]);
  const actor = { actorUserId: "actor", actorLabel: "admin@example.com", editionId: "new" };
  return { db, client, actor };
}

const hero = { title: "Pendaftaran", eyebrow: null, body: "Siapkan langkahmu.", actionLabel: "Daftar", actionHref: "https://example.com/form" };

test("pendaftaran mengikuti tahun edisi dan hanya tampil dengan pengantar lengkap", () => {
  assert.equal(registrationEditionEligible(2025), false);
  assert.equal(registrationEditionEligible(2026), true);
  assert.equal(registrationEditionEligible(2027), true);
  assert.equal(registrationEditionEligible(2026.5), false);
  assert.equal(registrationEditionEligible(Number.NaN), false);
  assert.equal(registrationVisible(2025, hero), false);
  assert.equal(registrationVisible(2026, hero), true);
  assert.equal(registrationVisible(2027, hero), true);
  assert.equal(registrationVisible(2026, undefined), false);
  assert.equal(registrationVisible(2026, { title: " ", body: "Isi" }), false);
  assert.equal(registrationVisible(2026, { title: "Judul", body: null }), false);
  assert.deepEqual(registrationLines(" Satu \r\n\n Dua "), ["Satu", "Dua"]);
  assert.deepEqual(registrationRows("11 September | Pembukaan\n11 Oktober | Audisi | Hadir langsung\nTidak valid\n| Kosong\nA|B|C|D"), [
    { label: "11 September", title: "Pembukaan", detail: null },
    { label: "11 Oktober", title: "Audisi", detail: "Hadir langsung" },
  ]);
});

test("draf pendaftaran terisolasi, terbit dengan revisi dan audit, serta menolak versi lama", async () => {
  const { db, client, actor } = await fixture();
  try {
    const saved = await savePageSectionDraft({ ...actor, slotKey: "pendaftaran/hero", baseVersion: null, patch: hero }, db);
    const [unpublished] = await db.select().from(schema.pageSections);
    assert.equal(unpublished.editionId, "new");
    assert.equal(unpublished.status, "draft");
    assert.equal(unpublished.title, null);
    assert.equal(registrationVisible(2026, unpublished), false);
    await publishPageSection({ ...actor, slotKey: "pendaftaran/hero" }, db);
    const [published] = await db.select().from(schema.pageSections);
    assert.equal(published.status, "published");
    assert.equal(published.version, saved.version + 1);
    assert.equal(registrationVisible(2026, published), true);
    assert.deepEqual(JSON.parse(published.presentationJson), { actionLabel: "Daftar", actionHref: "https://example.com/form" });
    assert.equal((await db.select().from(schema.contentDrafts)).length, 0);
    assert.equal((await db.select().from(schema.contentRevisions)).length, 1);
    assert.equal((await db.select().from(schema.auditLogs)).length, 2);
    await assert.rejects(savePageSectionDraft({ ...actor, slotKey: "pendaftaran/hero", baseVersion: saved.version, patch: hero }, db), /berubah/);
    await savePageSectionDraft({ ...actor, slotKey: "pendaftaran/hero", baseVersion: published.version, patch: { ...hero, title: "Draf baru" } }, db);
    assert.equal((await db.select().from(schema.pageSections))[0].title, "Pendaftaran");
    await savePageSectionDraft({ ...actor, editionId: "future", slotKey: "pendaftaran/hero", baseVersion: null, patch: { ...hero, title: "Tahun berikutnya" } }, db);
    const rows = await db.select().from(schema.pageSections);
    assert.deepEqual(rows.map((row) => row.editionId).sort(), ["future", "new"]);
    assert.equal(rows.find((row) => row.editionId === "new")?.title, "Pendaftaran");
    assert.equal((await db.select().from(schema.editions).where(eq(schema.editions.id, "old")))[0].lifecycle, "active");
  } finally { client.close(); }
});

test("edisi lama dan arsip ditolak pada simpan maupun terbit tanpa mutasi parsial", async () => {
  const { db, client, actor } = await fixture();
  try {
    for (const editionId of ["old", "archive"]) {
      await assert.rejects(savePageSectionDraft({ ...actor, editionId, slotKey: "pendaftaran/hero", baseVersion: null, patch: hero }, db), /2026/);
      await assert.rejects(publishPageSection({ ...actor, editionId, slotKey: "pendaftaran/hero" }, db), /2026/);
    }
    assert.equal((await db.select().from(schema.pageSections)).length, 0);
    assert.equal((await db.select().from(schema.auditLogs)).length, 0);
    await savePageSectionDraft({ ...actor, slotKey: "pendaftaran/hero", baseVersion: null, patch: hero }, db);
    await db.update(schema.editions).set({ lifecycle: "archived" }).where(eq(schema.editions.id, "new"));
    await assert.rejects(publishPageSection({ ...actor, slotKey: "pendaftaran/hero" }, db), /2026/);
    assert.equal((await db.select().from(schema.pageSections))[0].status, "draft");
    assert.equal((await db.select().from(schema.contentDrafts)).length, 1);
    assert.equal((await db.select().from(schema.contentRevisions)).length, 0);
    assert.equal((await db.select().from(schema.auditLogs)).length, 1);
  } finally { client.close(); }
});

test("tautan dan baris terstruktur divalidasi saat simpan dan terbit", async () => {
  const { db, client, actor } = await fixture();
  try {
    for (const actionHref of ["javascript:alert(1)", "//example.com/form", "https://user:pass@example.com/form"]) {
      await assert.rejects(savePageSectionDraft({ ...actor, slotKey: "pendaftaran/hero", baseVersion: null, patch: { ...hero, actionHref } }, db));
    }
    await assert.rejects(savePageSectionDraft({ ...actor, slotKey: "pendaftaran/hero", baseVersion: null, patch: { ...hero, actionLabel: null } }, db));
    for (const slotKey of ["pendaftaran/timeline", "pendaftaran/usia"]) {
      for (const body of ["Tanpa pemisah", "| Judul", "Tanggal | ", "A | B | C | D", Array(51).fill("Tanggal | Acara").join("\n")]) {
        await assert.rejects(savePageSectionDraft({ ...actor, slotKey, baseVersion: null, patch: { title: "Judul", eyebrow: null, body } }, db), /format/);
      }
    }
    assert.equal((await db.select().from(schema.pageSections)).length, 0);
    assert.equal((await db.select().from(schema.auditLogs)).length, 0);
    const saved = await savePageSectionDraft({ ...actor, slotKey: "pendaftaran/timeline", baseVersion: null, patch: { title: "Timeline", eyebrow: null, body: "11 September | Pembukaan\n11 Oktober | Audisi | Hadir langsung" } }, db);
    await db.update(schema.contentDrafts).set({ snapshotJson: JSON.stringify({ title: "Timeline", eyebrow: null, body: "Draf rusak" }) }).where(eq(schema.contentDrafts.resourceId, saved.sectionId));
    await assert.rejects(publishPageSection({ ...actor, slotKey: "pendaftaran/timeline" }, db), /format/);
    assert.equal((await db.select().from(schema.contentRevisions)).length, 0);
    await savePageSectionDraft({ ...actor, slotKey: "pendaftaran/hero", baseVersion: null, patch: hero }, db);
    const draft = (await db.select().from(schema.contentDrafts)).find((row) => row.resourceId !== saved.sectionId)!;
    const snapshot = JSON.parse(draft.snapshotJson);
    await db.update(schema.contentDrafts).set({ snapshotJson: JSON.stringify({ ...snapshot, presentationJson: JSON.stringify({ actionLabel: "Daftar", actionHref: "javascript:alert(1)" }) }) }).where(eq(schema.contentDrafts.id, draft.id));
    await assert.rejects(publishPageSection({ ...actor, slotKey: "pendaftaran/hero" }, db));
    assert.equal((await db.select().from(schema.contentRevisions)).length, 0);
  } finally { client.close(); }
});

test("new editorial sections keep drafts separate and validate row content before saving", async () => {
  const { db, client, actor } = await fixture();
  try {
    for (const slotKey of ["home/agenda", "tentang/peran", "tentang/nilai", "pendaftaran/jalur", "pendaftaran/langkah", "pendaftaran/faq"]) {
      await assert.rejects(savePageSectionDraft({ ...actor, slotKey, baseVersion: null, patch: { title: "Judul", eyebrow: null, body: "Baris tanpa pemisah" } }, db), /format/);
      const saved = await savePageSectionDraft({ ...actor, slotKey, baseVersion: null, patch: { title: "Judul", eyebrow: null, body: "Nama | Penjelasan" } }, db);
      const row = (await db.select().from(schema.pageSections).where(eq(schema.pageSections.id, saved.sectionId)))[0];
      assert.equal(row.status, "draft");
      assert.equal(row.body, null);
      await publishPageSection({ ...actor, slotKey }, db);
      const published = (await db.select().from(schema.pageSections).where(eq(schema.pageSections.id, saved.sectionId)))[0];
      assert.equal(published.body, "Nama | Penjelasan");
      assert.equal(published.version, 2);
    }
    assert.equal((await db.select().from(schema.auditLogs)).length, 12);
    assert.equal((await db.select().from(schema.contentRevisions)).length, 6);
  } finally { client.close(); }
});
