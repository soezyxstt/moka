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
import { DEFAULT_CATEGORIES, getEditionReadiness } from "../cms/edition-readiness";
import { contactHref, organizationCopy } from "../cms/site-copy";
import { archivedIdentity, preserveArchivedProfile } from "../organization/profile-history";
import { PageSectionValidationError, publishPageSection, savePageSectionDraft } from "../cms/page-sections";

test("kontak menolak protokol aktif dan kredensial; periode mengalahkan teks edisi lama", () => {
  assert.equal(contactHref("instagram", "javascript:alert(1)"), null);
  assert.equal(contactHref("youtube", "https://user:pass@example.com/"), null);
  assert.equal(contactHref("email", "a@example.com\r\nbcc:x@example.com"), null);
  assert.equal(contactHref("email", "admin@example.com"), "mailto:admin@example.com");
  assert.equal(contactHref("instagram", "https://example.com/new"), "https://example.com/new");
  assert.deepEqual(organizationCopy({ vision: "Visi baru", missionJson: '["Misi baru"]' }, { vision: "Lama", mission: ["Lama"] }), { vision: "Visi baru", mission: ["Misi baru"] });
  assert.deepEqual(organizationCopy({ vision: null, missionJson: "invalid" }, { vision: "Lama", mission: ["Lama"] }), { vision: null, mission: [] });
});

test("teks dan PDF melewati draf, validasi ulang, revisi, audit, dan konflik versi", async () => {
  const directory = await mkdtemp(join(tmpdir(), "moka-copy-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: resolve("drizzle") });
    await db.insert(schema.authUsers).values({ id: "actor", name: "Admin", email: "admin@example.com" });
    await db.insert(schema.editions).values({ id: "edition", year: 2026, slug: "2026", name: "2026" });
    await db.insert(schema.mediaAssets).values({ id: "pdf", provider: "uploadthing", filename: "legal.pdf", url: "https://example.com/legal.pdf", mimeType: "application/pdf", bytes: 10 });
    const actor = { editionId: "edition", actorUserId: "actor", actorLabel: "admin@example.com" };
    const patch = { title: "Legalitas", eyebrow: null, body: "Keterangan", documentMediaId: "pdf", documentTitle: "SK organisasi" };
    const saved = await savePageSectionDraft({ ...actor, slotKey: "tentang/legalitas", baseVersion: null, patch }, db);
    const [unpublished] = await db.select().from(schema.pageSections);
    assert.equal(unpublished.status, "draft");
    assert.equal(unpublished.title, null);
    await db.update(schema.mediaAssets).set({ lifecycle: "deleted" }).where(eq(schema.mediaAssets.id, "pdf"));
    await assert.rejects(publishPageSection({ ...actor, slotKey: "tentang/legalitas" }, db), /PDF/);
    await db.update(schema.mediaAssets).set({ lifecycle: "ready" }).where(eq(schema.mediaAssets.id, "pdf"));
    await publishPageSection({ ...actor, slotKey: "tentang/legalitas" }, db);
    const [published] = await db.select().from(schema.pageSections);
    assert.equal(published.status, "published");
    assert.equal(JSON.parse(published.presentationJson).documentMediaId, "pdf");
    assert.equal((await db.select().from(schema.contentRevisions)).length, 1);
    assert.equal((await db.select().from(schema.auditLogs)).length, 2);
    await savePageSectionDraft({ ...actor, slotKey: "tentang/legalitas", baseVersion: published.version, patch: { title: "Judul baru", eyebrow: null, body: "Keterangan baru" } }, db);
    const [legacyDraft] = await db.select().from(schema.contentDrafts);
    assert.equal(JSON.parse(JSON.parse(legacyDraft.snapshotJson).presentationJson).documentMediaId, "pdf");
    await assert.rejects(savePageSectionDraft({ ...actor, slotKey: "tentang/legalitas", baseVersion: saved.version, patch }, db), /berubah/);
    await assert.rejects(savePageSectionDraft({ ...actor, slotKey: "site/instagram", baseVersion: null, patch: { title: "Instagram", eyebrow: null, body: "javascript:alert(1)" } }, db), (error: unknown) => error instanceof PageSectionValidationError && /kontak/.test(error.message));
    await savePageSectionDraft({ ...actor, slotKey: "tentang/legalitas", baseVersion: published.version, patch: { ...patch, documentMediaId: null } }, db);
    await publishPageSection({ ...actor, slotKey: "tentang/legalitas" }, db);
    const [cleared] = await db.select().from(schema.pageSections);
    assert.equal(JSON.parse(cleared.presentationJson).documentMediaId, null);
  } finally { client.close(); }
});

test("kesiapan terisolasi per edisi dan menolak aset tak siap serta periode tak sesuai", async () => {
  const directory = await mkdtemp(join(tmpdir(), "moka-readiness-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: resolve("drizzle") });
    await db.insert(schema.organizationPeriods).values({ id: "period", label: "2026-2028", startYear: 2026, endYear: 2028, lifecycle: "active" });
    await db.insert(schema.mediaAssets).values({ id: "image", provider: "uploadthing", url: "https://example.com/image.png", filename: "image.png", mimeType: "image/png", bytes: 10 });
    await db.insert(schema.editions).values([{ id: "new", year: 2026, slug: "2026", name: "2026", logoMediaId: "image", slogan: "Slogan", organizationPeriodId: "period" }, { id: "old", year: 2025, slug: "2025", name: "2025", lifecycle: "active" }]);
    await db.insert(schema.categories).values(DEFAULT_CATEGORIES.map((item) => ({ ...item, editionId: "new" })));
    await db.insert(schema.pageSections).values(["home/hero", "tentang/hero", "site/identity"].map((key) => ({ editionId: "new", pageKey: key.split("/")[0], sectionKey: key.split("/")[1], title: "Judul", body: "Isi", status: "published" })));
    await db.insert(schema.siteAssetBindings).values(["home.hero.bg", "about.hero.bg"].map((slotKey) => ({ editionId: "new", slotKey, mediaId: "image" })));
    assert.ok((await getEditionReadiness(db, "new")).every((item) => item.ready));
    assert.ok((await getEditionReadiness(db, "old")).every((item) => !item.ready));
    await db.update(schema.mediaAssets).set({ lifecycle: "deleted" }).where(eq(schema.mediaAssets.id, "image"));
    assert.equal((await getEditionReadiness(db, "new")).filter((item) => !item.ready).length, 3);
    await db.update(schema.organizationPeriods).set({ endYear: 2025 }).where(eq(schema.organizationPeriods.id, "period"));
    assert.equal((await getEditionReadiness(db, "new")).find((item) => item.label === "Periode kepengurusan")?.ready, false);
    await assert.rejects(getEditionReadiness(db, "missing"), /tidak ditemukan/);
  } finally { client.close(); }
});

test("pembaruan profil menjaga foto dan nama arsip pertama tanpa membekukan profil terbaru", async () => {
  const directory = await mkdtemp(join(tmpdir(), "moka-history-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: resolve("drizzle") });
    await db.insert(schema.authUsers).values({ id: "actor", name: "Admin", email: "admin@example.com" });
    await db.insert(schema.organizationPeriods).values({ id: "archive", label: "Arsip", startYear: 2023, endYear: 2025, lifecycle: "archived" });
    await db.insert(schema.organizationUnits).values({ id: "unit", periodId: "archive", name: "Pengurus" });
    await db.insert(schema.mediaAssets).values({ id: "portrait", provider: "uploadthing", url: "https://example.com/old.png", filename: "old.png", mimeType: "image/png", bytes: 10 });
    const [person] = await db.insert(schema.people).values({ id: "person", name: "Nama lama", slug: "person", portraitMediaId: "portrait" }).returning();
    await db.insert(schema.organizationMemberships).values({ id: "member", personId: person.id, periodId: "archive", unitId: "unit", title: "Ketua" });
    await db.transaction(async (tx) => {
      await preserveArchivedProfile(tx, person, "actor");
      await tx.update(schema.people).set({ name: "Nama baru", portraitMediaId: null }).where(eq(schema.people.id, person.id));
    });
    const [updated] = await db.select().from(schema.people);
    await preserveArchivedProfile(db, updated, "actor");
    const snapshots = await db.select().from(schema.contentRevisions);
    assert.equal(snapshots.length, 1);
    assert.equal(updated.name, "Nama baru");
    assert.deepEqual(archivedIdentity(snapshots[0].snapshotJson, { name: updated.name, imageUrl: null }), { name: "Nama lama", imageUrl: "https://example.com/old.png" });
  } finally { client.close(); }
});
