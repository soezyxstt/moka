import { createClient } from "@libsql/client/node";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  closeSelectionStage,
  createApplicant,
  createSelectionStage,
  deleteSelectionStage,
  openSelectionStage,
  reopenSelectionStage,
  reorderSelectionStages,
  rollbackStageDecision,
  setStageDecisions,
  updateSelectionStage,
} from "../selection/operations";
import * as schema from "./schema";
import {
  auditLogs,
  authUsers,
  categories,
  editions,
  participants,
  participantStageEntries,
  selectionStages,
} from "./schema";

const actor = { userId: "selection-actor", label: "selection@example.com" };
const now = new Date("2026-09-05T02:00:00.000Z");

async function createTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "moka-selection-test-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: resolve("drizzle") });
  await db.insert(authUsers).values({ id: actor.userId, name: "Selection Actor", email: actor.label, emailVerified: true, createdAt: now, updatedAt: now });
  await db.insert(editions).values([
    { id: "edition-a", year: 2031, slug: "2031", name: "Edisi A", lifecycle: "active", createdAt: now, updatedAt: now },
    { id: "edition-b", year: 2032, slug: "2032", name: "Edisi B", lifecycle: "draft", createdAt: now, updatedAt: now },
  ]);
  await db.insert(categories).values([
    { id: "category-a", editionId: "edition-a", code: "JD", slug: "jd-a", label: "JD", displayOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: "category-b", editionId: "edition-b", code: "JD", slug: "jd-b", label: "JD", displayOrder: 1, active: true, createdAt: now, updatedAt: now },
  ]);
  return { client, db };
}

test("pendaftar manual wajib memakai tahap pertama dan kategori edisi aktif", async () => {
  const { client, db } = await createTestDatabase();
  try {
    await assert.rejects(
      createApplicant(db, "edition-a", { categoryId: "category-a", name: "Peserta Tanpa Tahap", number: 1 }, actor, now),
      /Buat tahap pertama/,
    );
    const first = await createSelectionStage(db, "edition-a", { name: "Pendaftaran", targetParticipantCount: 4, finalStage: false }, actor, now);
    await assert.rejects(
      createApplicant(db, "edition-a", { categoryId: "category-b", name: "Lintas Edisi", number: 1 }, actor, now),
      /Kategori harus berasal/,
    );
    const created = await createApplicant(db, "edition-a", { categoryId: "category-a", name: "Peserta Satu", number: 1, bio: "Data dari Google Form" }, actor, now);

    const [participant] = await db.select().from(participants).where(eq(participants.id, created.id)).limit(1);
    const [entry] = await db.select().from(participantStageEntries).where(eq(participantStageEntries.participantId, created.id)).limit(1);
    assert.equal(participant.currentStageId, first.id);
    assert.equal(participant.selectionStatus, "registered");
    assert.equal(participant.stage, "pendaftaran");
    assert.equal(entry.stageId, first.id);
    assert.equal(entry.decision, "pending");
    assert.equal(participant.paymentUrl, null);
  } finally {
    client.close();
  }
});

test("tahap linear menjaga final tunggal, versi, urutan, dan penghapusan", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const first = await createSelectionStage(db, "edition-a", { name: "Audisi", targetParticipantCount: 4, finalStage: false }, actor, now);
    const final = await createSelectionStage(db, "edition-a", { name: "Final", targetParticipantCount: 2, finalStage: true }, actor, now);
    await assert.rejects(
      createSelectionStage(db, "edition-a", { name: "Final Kedua", targetParticipantCount: 1, finalStage: true }, actor, now),
      /sudah memiliki tahap final/,
    );
    await assert.rejects(
      updateSelectionStage(db, "edition-a", { stageId: first.id, expectedVersion: 99, name: "Audisi", targetParticipantCount: 4, finalStage: false }, actor, now),
      /telah diubah/,
    );
    await reorderSelectionStages(db, "edition-a", [{ id: final.id, expectedVersion: 1 }, { id: first.id, expectedVersion: 1 }], actor, now);
    const reordered = await db.select().from(selectionStages).where(eq(selectionStages.editionId, "edition-a")).orderBy(asc(selectionStages.displayOrder));
    assert.deepEqual(reordered.map((stage) => stage.id), [final.id, first.id]);

    const unused = await createSelectionStage(db, "edition-b", { name: "Tahap Kosong", targetParticipantCount: 1, finalStage: false }, actor, now);
    await deleteSelectionStage(db, "edition-b", { stageId: unused.id, expectedVersion: 1 }, actor, now);
    assert.equal((await db.select().from(selectionStages).where(eq(selectionStages.editionId, "edition-b"))).length, 0);

    const audits = await db.select().from(auditLogs).where(eq(auditLogs.source, "admin-selection"));
    assert.ok(audits.some((audit) => audit.action === "selection_stage.reorder"));
    assert.ok(audits.some((audit) => audit.action === "selection_stage.delete"));
  } finally {
    client.close();
  }
});

test("keputusan massal, rollback, kuota, dan penutupan tahap berjalan transaksional", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const first = await createSelectionStage(db, "edition-a", { name: "Seleksi Awal", targetParticipantCount: 3, finalStage: false }, actor, now);
    const final = await createSelectionStage(db, "edition-a", { name: "Final", targetParticipantCount: 2, finalStage: true }, actor, now);
    const participantOne = await createApplicant(db, "edition-a", { categoryId: "category-a", name: "Peserta Satu", number: 1 }, actor, now);
    const participantTwo = await createApplicant(db, "edition-a", { categoryId: "category-a", name: "Peserta Dua", number: 2 }, actor, now);
    const participantThree = await createApplicant(db, "edition-a", { categoryId: "category-a", name: "Peserta Tiga", number: 3 }, actor, now);
    await db.insert(schema.mediaAssets).values([
      { id: "portrait-old", provider: "uploadthing", url: "https://utfs.io/portrait", filename: "portrait.png", mimeType: "image/png", bytes: 100, createdAt: now, updatedAt: now },
      { id: "qris-old", provider: "uploadthing", url: "https://utfs.io/qris", filename: "qris.png", mimeType: "image/png", bytes: 100, createdAt: now, updatedAt: now },
    ]);
    await db.update(participants).set({ portraitMediaId: "portrait-old", qrisMediaId: "qris-old" }).where(eq(participants.id, participantOne.id));
    await assert.rejects(
      reorderSelectionStages(db, "edition-a", [{ id: first.id, expectedVersion: 1 }, { id: final.id, expectedVersion: 1 }], actor, now),
      /sudah dipakai/,
    );
    await openSelectionStage(db, "edition-a", { stageId: first.id, expectedVersion: 1 }, actor, now);
    const entries = await db.select().from(participantStageEntries).where(eq(participantStageEntries.stageId, first.id)).orderBy(asc(participantStageEntries.participantId));
    const entryOne = entries.find((entry) => entry.participantId === participantOne.id)!;
    const entryTwo = entries.find((entry) => entry.participantId === participantTwo.id)!;
    const entryThree = entries.find((entry) => entry.participantId === participantThree.id)!;

    await assert.rejects(
      setStageDecisions(db, "edition-a", { stageId: first.id, decision: "advanced", entries: entries.map((entry) => ({ id: entry.id, expectedVersion: entry.version })) }, actor, now),
      /melebihi target/,
    );
    await setStageDecisions(db, "edition-a", { stageId: first.id, decision: "advanced", entries: [{ id: entryOne.id, expectedVersion: 1 }, { id: entryTwo.id, expectedVersion: 1 }] }, actor, now);
    await assert.rejects(
      rollbackStageDecision(db, "edition-a", { entryId: entryOne.id, expectedVersion: 1, reason: "Koreksi admin" }, actor, now),
      /telah berubah/,
    );
    await rollbackStageDecision(db, "edition-a", { entryId: entryOne.id, expectedVersion: 2, reason: "Koreksi admin" }, actor, now);
    await setStageDecisions(db, "edition-a", { stageId: first.id, decision: "advanced", entries: [{ id: entryOne.id, expectedVersion: 3 }] }, actor, now);
    await setStageDecisions(db, "edition-a", { stageId: first.id, decision: "eliminated", entries: [{ id: entryThree.id, expectedVersion: 1 }] }, actor, now);
    await closeSelectionStage(db, "edition-a", { stageId: first.id, expectedVersion: 2, allowUnderTarget: false }, actor, now);

    const promotedEntries = await db.select().from(participantStageEntries).where(eq(participantStageEntries.stageId, final.id));
    const promotedParticipants = await db.select().from(participants).where(eq(participants.currentStageId, final.id));
    assert.equal(promotedEntries.length, 2);
    assert.equal(promotedParticipants.length, 2);
    assert.ok(promotedEntries.every((entry) => entry.decision === "pending"));
    assert.ok(promotedParticipants.every((participant) => participant.stage === "seleksi-awal"));
    const promotedOne = promotedEntries.find((entry) => entry.participantId === participantOne.id)!;
    assert.equal(promotedOne.portraitMediaId, "portrait-old");
    assert.equal(promotedOne.qrisMediaId, "qris-old");
    assert.equal(promotedOne.mediaInitialized, true);
    const [oldEntry] = await db.select().from(participantStageEntries).where(eq(participantStageEntries.id, entryOne.id));
    assert.equal(oldEntry.portraitMediaId, "portrait-old");
    assert.equal(oldEntry.qrisMediaId, "qris-old");

    await db.update(participantStageEntries).set({ qrisMediaId: null, version: 2 }).where(eq(participantStageEntries.id, promotedOne.id));
    await assert.rejects(reopenSelectionStage(db, "edition-a", { stageId: first.id, expectedVersion: 3, reason: "Koreksi hasil seleksi" }, actor, now), /Data peserta pada tahap berikutnya telah diubah/);
    const [preserved] = await db.select().from(participantStageEntries).where(eq(participantStageEntries.id, promotedOne.id));
    assert.equal(preserved.qrisMediaId, null);
    await db.update(participantStageEntries).set({ qrisMediaId: "qris-old", version: 1 }).where(eq(participantStageEntries.id, promotedOne.id));

    await reopenSelectionStage(db, "edition-a", { stageId: first.id, expectedVersion: 3, reason: "Koreksi hasil seleksi" }, actor, now);
    assert.equal((await db.select().from(participantStageEntries).where(eq(participantStageEntries.stageId, final.id))).length, 0);
    assert.equal((await db.select().from(participants).where(eq(participants.currentStageId, first.id))).length, 3);
    const [reopenedFirst] = await db.select().from(selectionStages).where(eq(selectionStages.id, first.id)).limit(1);
    const [resetFinal] = await db.select().from(selectionStages).where(eq(selectionStages.id, final.id)).limit(1);
    assert.equal(reopenedFirst.lifecycle, "active");
    assert.equal(resetFinal.lifecycle, "draft");

    await rollbackStageDecision(db, "edition-a", { entryId: entryOne.id, expectedVersion: oldEntry.version, reason: "Tinjau ulang peserta" }, actor, now);
  } finally {
    client.close();
  }
});
