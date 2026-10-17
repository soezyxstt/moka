import { createClient } from "@libsql/client/node";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  closeVotingCampaign,
  createVotingCampaign,
  deleteVotingCampaign,
  saveVotingTalliesBatch,
  saveVotingTally,
  setVotingResultVisibility,
  startVotingCampaign,
  updateVotingCampaign,
  updateVotingCampaignStage,
} from "../voting-operations";
import * as schema from "./schema";
import {
  auditLogs,
  authUsers,
  categories,
  editions,
  mediaAssets,
  participants,
  selectionStages,
  voteDailyTallies,
  votingCampaignParticipants,
  votingCampaigns,
} from "./schema";

const actor = { userId: "voting-actor", label: "voting@example.com" };
const now = new Date("2026-09-06T03:00:00.000Z");

async function createTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "moka-voting-operations-test-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: resolve("drizzle") });
  await db.insert(authUsers).values({
    id: actor.userId,
    name: "Voting Actor",
    email: actor.label,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(editions).values([
    { id: "edition-a", year: 2033, slug: "2033-voting", name: "Edisi A", lifecycle: "active", createdAt: now, updatedAt: now },
    { id: "edition-b", year: 2034, slug: "2034-voting", name: "Edisi B", lifecycle: "draft", createdAt: now, updatedAt: now },
  ]);
  await db.insert(categories).values([
    { id: "category-a", editionId: "edition-a", code: "JD", slug: "jd-voting-a", label: "JD", displayOrder: 1, active: true, createdAt: now, updatedAt: now },
    { id: "category-b", editionId: "edition-b", code: "JD", slug: "jd-voting-b", label: "JD", displayOrder: 1, active: true, createdAt: now, updatedAt: now },
  ]);
  await db.insert(selectionStages).values([
    { id: "stage-a-early", editionId: "edition-a", name: "Semifinal", slug: "semifinal", displayOrder: 1, targetParticipantCount: 3, lifecycle: "closed", finalStage: false, createdAt: now, updatedAt: now },
    { id: "stage-a-final", editionId: "edition-a", name: "Final", slug: "final", displayOrder: 2, targetParticipantCount: 2, lifecycle: "active", finalStage: true, createdAt: now, updatedAt: now },
    { id: "stage-b-final", editionId: "edition-b", name: "Final", slug: "final", displayOrder: 1, targetParticipantCount: 1, lifecycle: "active", finalStage: true, createdAt: now, updatedAt: now },
  ]);
  await db.insert(mediaAssets).values([
    {
      id: "qris-a",
      provider: "uploadthing",
      url: "https://utfs.io/f/qris-a.png",
      filename: "qris-a.png",
      mimeType: "image/png",
      bytes: 100,
      lifecycle: "ready",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "qris-pdf",
      provider: "uploadthing",
      url: "https://utfs.io/f/qris.pdf",
      filename: "qris.pdf",
      mimeType: "application/pdf",
      bytes: 100,
      lifecycle: "ready",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  await db.insert(participants).values([
    { id: "participant-a", editionId: "edition-a", categoryId: "category-a", stage: "final", currentStageId: "stage-a-final", selectionStatus: "active", number: 1, name: "Peserta A", slug: "peserta-a", qrisMediaId: "qris-a", active: true, createdAt: now, updatedAt: now },
    { id: "participant-a-no-qris", editionId: "edition-a", categoryId: "category-a", stage: "final", currentStageId: "stage-a-final", selectionStatus: "active", number: 2, name: "Peserta Tanpa QRIS", slug: "peserta-tanpa-qris", active: true, createdAt: now, updatedAt: now },
    { id: "participant-a-eliminated", editionId: "edition-a", categoryId: "category-a", stage: "final", currentStageId: "stage-a-final", selectionStatus: "eliminated", number: 4, name: "Peserta Tereliminasi", slug: "peserta-tereliminasi", active: true, createdAt: now, updatedAt: now },
    { id: "participant-a-pdf", editionId: "edition-a", categoryId: "category-a", stage: "final", currentStageId: "stage-a-final", selectionStatus: "active", number: 5, name: "Peserta QRIS PDF", slug: "peserta-qris-pdf", qrisMediaId: "qris-pdf", active: true, createdAt: now, updatedAt: now },
    { id: "participant-a-early", editionId: "edition-a", categoryId: "category-a", stage: "semifinal", currentStageId: "stage-a-early", selectionStatus: "active", number: 3, name: "Peserta Awal", slug: "peserta-awal", active: true, createdAt: now, updatedAt: now },
    { id: "participant-b", editionId: "edition-b", categoryId: "category-b", stage: "final", currentStageId: "stage-b-final", selectionStatus: "active", number: 1, name: "Peserta B", slug: "peserta-b", active: true, createdAt: now, updatedAt: now },
  ]);
  return { client, db };
}

test("kampanye membuat snapshot tahap dan hanya berubah melalui lifecycle manual", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const campaign = await createVotingCampaign(
      db,
      "edition-a",
      {
        name: "Voting Kameumeut 2033",
        slug: "voting-kameumeut-2033",
        eligibilityStageId: "stage-a-final",
        startsAt: new Date("2026-09-01T00:00:00+07:00"),
        endsAt: new Date("2026-09-30T23:59:00+07:00"),
        pricePerPoint: 2_000,
      },
      actor,
      now,
    );
    const [draft] = await db.select().from(votingCampaigns).where(eq(votingCampaigns.id, campaign.id));
    assert.equal(draft.status, "draft");
    assert.equal(draft.eligibilityStageId, "stage-a-final");

    await assert.rejects(
      updateVotingCampaignStage(
        db,
        "edition-a",
        { campaignId: campaign.id, stageId: "stage-b-final", expectedVersion: 1 },
        actor,
        now,
      ),
      /edisi aktif/,
    );
    await assert.rejects(
      startVotingCampaign(
        db,
        "edition-a",
        { campaignId: campaign.id, expectedVersion: 1, confirmation: "salah", reason: "Mulai sesuai keputusan panitia" },
        actor,
        now,
      ),
      /nama kampanye/,
    );
    await assert.rejects(
      startVotingCampaign(
        db,
        "edition-a",
        { campaignId: campaign.id, expectedVersion: 99, confirmation: "Voting Kameumeut 2033", reason: "Mulai" },
        actor,
        now,
      ),
      /telah diubah/,
    );

    const started = await startVotingCampaign(
      db,
      "edition-a",
      {
        campaignId: campaign.id,
        expectedVersion: 1,
        confirmation: "Voting Kameumeut 2033",
        reason: "Mulai sesuai keputusan panitia",
      },
      actor,
      now,
    );
    assert.equal(started.snapshotCount, 3);
    const snapshot = await db
      .select()
      .from(votingCampaignParticipants)
      .where(eq(votingCampaignParticipants.campaignId, campaign.id));
    assert.deepEqual(
      snapshot.map((row) => row.participantId).sort(),
      ["participant-a", "participant-a-no-qris", "participant-a-pdf"],
    );
    await db
      .update(participants)
      .set({ currentStageId: "stage-a-early", selectionStatus: "eliminated", active: false })
      .where(eq(participants.id, "participant-a"));
    const immutableSnapshot = await db
      .select()
      .from(votingCampaignParticipants)
      .where(eq(votingCampaignParticipants.campaignId, campaign.id));
    assert.equal(immutableSnapshot.length, 3);
    await assert.rejects(
      updateVotingCampaignStage(
        db,
        "edition-a",
        { campaignId: campaign.id, stageId: "stage-a-early", expectedVersion: 2 },
        actor,
        now,
      ),
      /masih draf/,
    );
    await assert.rejects(
      setVotingResultVisibility(
        db,
        "edition-a",
        {
          campaignId: campaign.id,
          expectedVersion: 2,
          visibility: "invalid" as "hidden",
          reason: "Nilai runtime tidak sah",
        },
        actor,
        now,
      ),
      /Visibilitas hasil tidak valid/,
    );

    await assert.rejects(
      setVotingResultVisibility(
        db,
        "edition-a",
        {
          campaignId: campaign.id,
          expectedVersion: 2,
          visibility: "invalid" as "hidden",
          reason: "Nilai runtime tidak sah",
        },
        actor,
        now,
      ),
      /Visibilitas hasil tidak valid/,
    );

    await assert.rejects(
      setVotingResultVisibility(
        db,
        "edition-a",
        {
          campaignId: campaign.id,
          expectedVersion: 2,
          visibility: "invalid" as "hidden",
          reason: "Nilai runtime tidak sah",
        },
        actor,
        now,
      ),
      /Visibilitas hasil tidak valid/,
    );

    const visible = await setVotingResultVisibility(
      db,
      "edition-a",
      { campaignId: campaign.id, expectedVersion: 2, visibility: "visible", reason: "Hasil siap ditampilkan" },
      actor,
      now,
    );
    assert.equal(visible.version, 3);
    const closed = await closeVotingCampaign(
      db,
      "edition-a",
      {
        campaignId: campaign.id,
        expectedVersion: 3,
        confirmation: "Voting Kameumeut 2033",
        reason: "Periode voting selesai",
      },
      actor,
      now,
    );
    assert.equal(closed.version, 4);
    const audits = await db.select().from(auditLogs).where(eq(auditLogs.source, "admin-voting"));
    assert.ok(audits.some((audit) => audit.action === "voting.campaign.start"));
    assert.ok(audits.some((audit) => audit.action === "voting.campaign.close"));
  } finally {
    client.close();
  }
});

test("tally hanya menerima peserta snapshot dengan gambar QRIS saat voting aktif", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const campaign = await createVotingCampaign(
      db,
      "edition-a",
      {
        name: "Voting Aman 2033",
        slug: "voting-aman-2033",
        eligibilityStageId: "stage-a-final",
        startsAt: new Date("2026-09-01T00:00:00+07:00"),
        endsAt: new Date("2026-09-30T23:59:00+07:00"),
        pricePerPoint: 2_000,
      },
      actor,
      now,
    );
    await startVotingCampaign(
      db,
      "edition-a",
      { campaignId: campaign.id, expectedVersion: 1, confirmation: "Voting Aman 2033", reason: "Mulai" },
      actor,
      now,
    );

    const saved = await saveVotingTally(
      db,
      "edition-a",
      { campaignId: campaign.id, participantId: "participant-a", localDate: "2026-09-06", amount: 10_000, expectedVersion: 0, reason: "Rekap merchant" },
      actor,
      now,
    );
    assert.equal(saved.version, 1);
    const [tally] = await db.select().from(voteDailyTallies).where(eq(voteDailyTallies.id, saved.id));
    assert.equal(tally.amount, 10_000);
    await assert.rejects(
      saveVotingTally(
        db,
        "edition-a",
        { campaignId: campaign.id, participantId: "participant-a-no-qris", localDate: "2026-09-06", amount: 2_000, expectedVersion: 0, reason: "Rekap" },
        actor,
        now,
      ),
      /gambar QRIS/,
    );
    const auditCountBeforePdf = (
      await db.select().from(auditLogs).where(eq(auditLogs.source, "admin-voting"))
    ).length;
    await assert.rejects(
      saveVotingTally(
        db,
        "edition-a",
        { campaignId: campaign.id, participantId: "participant-a-pdf", localDate: "2026-09-06", amount: 2_000, expectedVersion: 0, reason: "Rekap" },
        actor,
        now,
      ),
      /gambar QRIS/,
    );
    const auditCountAfterPdf = (
      await db.select().from(auditLogs).where(eq(auditLogs.source, "admin-voting"))
    ).length;
    assert.equal(auditCountAfterPdf, auditCountBeforePdf);
    await assert.rejects(
      saveVotingTally(
        db,
        "edition-a",
        { campaignId: campaign.id, participantId: "participant-a-early", localDate: "2026-09-06", amount: 2_000, expectedVersion: 0, reason: "Rekap" },
        actor,
        now,
      ),
      /snapshot/,
    );
    await assert.rejects(
      saveVotingTally(
        db,
        "edition-a",
        { campaignId: campaign.id, participantId: "participant-a", localDate: "2026-09-31", amount: 2_000, expectedVersion: 1, reason: "Rekap" },
        actor,
        now,
      ),
      /Tanggal lokal tidak valid/,
    );
    await assert.rejects(
      saveVotingTally(
        db,
        "edition-b",
        { campaignId: campaign.id, participantId: "participant-a", localDate: "2026-09-06", amount: 2_000, expectedVersion: 1, reason: "Rekap" },
        actor,
        now,
      ),
      /edisi aktif/,
    );
    await closeVotingCampaign(
      db,
      "edition-a",
      { campaignId: campaign.id, expectedVersion: 2, confirmation: "Voting Aman 2033", reason: "Selesai" },
      actor,
      now,
    );
    await assert.rejects(
      saveVotingTally(
        db,
        "edition-a",
        { campaignId: campaign.id, participantId: "participant-a", localDate: "2026-09-06", amount: 12_000, expectedVersion: 1, reason: "Rekap" },
        actor,
        now,
      ),
      /voting aktif/,
    );
  } finally {
    client.close();
  }
});

test("kampanye voting mendukung pembaruan data dan audit log", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const campaign = await createVotingCampaign(
      db,
      "edition-a",
      {
        name: "Voting Favorit 2033",
        slug: "voting-favorit-2033",
        description: "Dukung peserta favorit Anda",
        eligibilityStageId: "stage-a-early",
        startsAt: new Date("2026-09-01T00:00:00+07:00"),
        endsAt: new Date("2026-09-15T23:59:00+07:00"),
        pricePerPoint: 2_000,
      },
      actor,
      now,
    );

    const updated = await updateVotingCampaign(
      db,
      "edition-a",
      {
        campaignId: campaign.id,
        expectedVersion: 1,
        name: "Voting Favorit 2033 Diperbarui",
        slug: "voting-favorit-2033-baru",
        description: "Deskripsi favorit diperbarui",
        eligibilityStageId: "stage-a-final",
        startsAt: new Date("2026-09-02T00:00:00+07:00"),
        endsAt: new Date("2026-09-20T23:59:00+07:00"),
        pricePerPoint: 2_500,
      },
      actor,
      now,
    );
    assert.equal(updated.version, 2);

    const [row] = await db.select().from(votingCampaigns).where(eq(votingCampaigns.id, campaign.id));
    assert.equal(row.name, "Voting Favorit 2033 Diperbarui");
    assert.equal(row.slug, "voting-favorit-2033-baru");
    assert.equal(row.description, "Deskripsi favorit diperbarui");
    assert.equal(row.eligibilityStageId, "stage-a-final");
    assert.equal(row.pricePerPoint, 2_500);
    assert.equal(row.version, 2);

    const [audit] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "voting.campaign.update"));
    assert.equal(audit.resourceId, campaign.id);
    assert.deepEqual(
      JSON.parse(audit.changedFieldsJson).sort(),
      ["description", "eligibilityStageId", "endsAt", "name", "pricePerPoint", "slug", "startsAt", "version"].sort(),
    );

    const campaign2 = await createVotingCampaign(
      db,
      "edition-a",
      {
        name: "Voting Kedua 2033",
        slug: "voting-kedua-2033",
        eligibilityStageId: "stage-a-final",
        startsAt: new Date("2026-09-01T00:00:00+07:00"),
        endsAt: new Date("2026-09-15T23:59:00+07:00"),
        pricePerPoint: 2_000,
      },
      actor,
      now,
    );
    await assert.rejects(
      updateVotingCampaign(
        db,
        "edition-a",
        {
          campaignId: campaign2.id,
          expectedVersion: 1,
          name: "Voting Kedua",
          slug: "voting-favorit-2033-baru",
          startsAt: new Date("2026-09-01T00:00:00+07:00"),
          endsAt: new Date("2026-09-15T23:59:00+07:00"),
          pricePerPoint: 2_000,
        },
        actor,
        now,
      ),
      /Slug kampanye sudah digunakan/,
    );

    await assert.rejects(
      updateVotingCampaign(
        db,
        "edition-a",
        {
          campaignId: campaign.id,
          expectedVersion: 1,
          name: "Stale",
          slug: "stale-slug",
          startsAt: new Date("2026-09-01T00:00:00+07:00"),
          endsAt: new Date("2026-09-15T23:59:00+07:00"),
          pricePerPoint: 2_000,
        },
        actor,
        now,
      ),
      /telah diubah/,
    );

    await startVotingCampaign(
      db,
      "edition-a",
      {
        campaignId: campaign.id,
        expectedVersion: 2,
        confirmation: "Voting Favorit 2033 Diperbarui",
        reason: "Mulai voting",
      },
      actor,
      now,
    );
    await saveVotingTally(
      db,
      "edition-a",
      {
        campaignId: campaign.id,
        participantId: "participant-a",
        localDate: "2026-09-05",
        amount: 5_000,
        expectedVersion: 0,
        reason: "Tally awal",
      },
      actor,
      now,
    );

    await assert.rejects(
      updateVotingCampaign(
        db,
        "edition-a",
        {
          campaignId: campaign.id,
          expectedVersion: 3,
          name: "Voting Favorit 2033 Diperbarui",
          slug: "voting-favorit-2033-baru",
          eligibilityStageId: "stage-a-early",
          startsAt: new Date("2026-09-02T00:00:00+07:00"),
          endsAt: new Date("2026-09-20T23:59:00+07:00"),
          pricePerPoint: 2_500,
        },
        actor,
        now,
      ),
      /hanya dapat diubah saat kampanye masih draf/,
    );

    await assert.rejects(
      updateVotingCampaign(
        db,
        "edition-a",
        {
          campaignId: campaign.id,
          expectedVersion: 3,
          name: "Voting Favorit 2033 Diperbarui",
          slug: "voting-favorit-2033-baru",
          startsAt: new Date("2026-09-10T00:00:00+07:00"),
          endsAt: new Date("2026-09-20T23:59:00+07:00"),
          pricePerPoint: 2_500,
        },
        actor,
        now,
      ),
      /mengecualikan tally/,
    );
  } finally {
    client.close();
  }
});

test("kampanye voting mendukung penghapusan kampanye dan cascade data terkait", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const draft = await createVotingCampaign(
      db,
      "edition-a",
      {
        name: "Voting Draf 2033",
        slug: "voting-draf-2033",
        eligibilityStageId: "stage-a-final",
        startsAt: new Date("2026-09-01T00:00:00+07:00"),
        endsAt: new Date("2026-09-15T23:59:00+07:00"),
        pricePerPoint: 2_000,
      },
      actor,
      now,
    );

    await assert.rejects(
      deleteVotingCampaign(
        db,
        "edition-a",
        { campaignId: draft.id, expectedVersion: 1, confirmation: "salah", reason: "Hapus draf" },
        actor,
      ),
      /nama kampanye/,
    );
    await assert.rejects(
      deleteVotingCampaign(
        db,
        "edition-a",
        { campaignId: draft.id, expectedVersion: 1, confirmation: "Voting Draf 2033", reason: " " },
        actor,
      ),
      /Alasan tindakan wajib diisi/,
    );

    await deleteVotingCampaign(
      db,
      "edition-a",
      { campaignId: draft.id, expectedVersion: 1, confirmation: "Voting Draf 2033", reason: "Salah buat draf" },
      actor,
    );
    const [deletedDraft] = await db.select().from(votingCampaigns).where(eq(votingCampaigns.id, draft.id));
    assert.equal(deletedDraft, undefined);

    const active = await createVotingCampaign(
      db,
      "edition-a",
      {
        name: "Voting Aktif 2033",
        slug: "voting-aktif-2033",
        eligibilityStageId: "stage-a-final",
        startsAt: new Date("2026-09-01T00:00:00+07:00"),
        endsAt: new Date("2026-09-15T23:59:00+07:00"),
        pricePerPoint: 2_000,
      },
      actor,
      now,
    );
    await startVotingCampaign(
      db,
      "edition-a",
      { campaignId: active.id, expectedVersion: 1, confirmation: "Voting Aktif 2033", reason: "Mulai" },
      actor,
      now,
    );
    await saveVotingTally(
      db,
      "edition-a",
      {
        campaignId: active.id,
        participantId: "participant-a",
        localDate: "2026-09-05",
        amount: 10_000,
        expectedVersion: 0,
        reason: "Tally",
      },
      actor,
      now,
    );

    const talliesBefore = await db.select().from(voteDailyTallies).where(eq(voteDailyTallies.campaignId, active.id));
    const participantsBefore = await db.select().from(votingCampaignParticipants).where(eq(votingCampaignParticipants.campaignId, active.id));
    assert.equal(talliesBefore.length, 1);
    assert.equal(participantsBefore.length, 3);

    await deleteVotingCampaign(
      db,
      "edition-a",
      { campaignId: active.id, expectedVersion: 2, confirmation: "Voting Aktif 2033", reason: "Reset seluruh kampanye" },
      actor,
    );

    const [deletedActive] = await db.select().from(votingCampaigns).where(eq(votingCampaigns.id, active.id));
    assert.equal(deletedActive, undefined);
    const talliesAfter = await db.select().from(voteDailyTallies).where(eq(voteDailyTallies.campaignId, active.id));
    assert.equal(talliesAfter.length, 0);
    const participantsAfter = await db.select().from(votingCampaignParticipants).where(eq(votingCampaignParticipants.campaignId, active.id));
    assert.equal(participantsAfter.length, 0);

    const deleteAudits = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "voting.campaign.delete"));
    assert.equal(deleteAudits.length, 2);
  } finally {
    client.close();
  }
});

test("setiap proses pencatatan voting direkam pada audit log beserta jumlah vote dan perubahan nominal", async () => {
  const { client, db } = await createTestDatabase();
  try {
    const campaign = await createVotingCampaign(
      db,
      "edition-a",
      {
        name: "Voting Audit 2033",
        slug: "voting-audit-2033",
        eligibilityStageId: "stage-a-final",
        startsAt: new Date("2026-09-01T00:00:00+07:00"),
        endsAt: new Date("2026-09-15T23:59:00+07:00"),
        pricePerPoint: 2_000,
      },
      actor,
      now,
    );
    await startVotingCampaign(
      db,
      "edition-a",
      {
        campaignId: campaign.id,
        expectedVersion: 1,
        confirmation: "Voting Audit 2033",
        reason: "Mulai voting",
      },
      actor,
      now,
    );

    const created = await saveVotingTally(
      db,
      "edition-a",
      {
        campaignId: campaign.id,
        participantId: "participant-a",
        localDate: "2026-09-06",
        amount: 6_000,
        expectedVersion: 0,
        reason: "Input awal 3 vote",
      },
      actor,
      now,
    );

    const [createAudit] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "voting.tally.create"));
    assert.ok(createAudit);
    assert.equal(createAudit.resourceId, created.id);
    assert.equal(createAudit.resourceLabel, "Peserta A");
    assert.equal(createAudit.reason, "Input awal 3 vote");
    assert.equal(JSON.parse(createAudit.beforeJson!), null);
    assert.deepEqual(JSON.parse(createAudit.afterJson!), {
      campaignId: campaign.id,
      participantId: "participant-a",
      localDate: "2026-09-06",
      amount: 6_000,
      votes: 3,
      version: 1,
    });

    await saveVotingTally(
      db,
      "edition-a",
      {
        campaignId: campaign.id,
        participantId: "participant-a",
        localDate: "2026-09-06",
        amount: 14_000,
        expectedVersion: 1,
        reason: "Tambah 4 vote dari QRIS",
      },
      actor,
      now,
    );

    const [correctAudit] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "voting.tally.correct"));
    assert.ok(correctAudit);
    assert.equal(correctAudit.resourceId, created.id);
    assert.equal(correctAudit.reason, "Tambah 4 vote dari QRIS");
    assert.deepEqual(JSON.parse(correctAudit.beforeJson!), {
      campaignId: campaign.id,
      participantId: "participant-a",
      localDate: "2026-09-06",
      amount: 6_000,
      votes: 3,
      version: 1,
    });
    assert.deepEqual(JSON.parse(correctAudit.afterJson!), {
      campaignId: campaign.id,
      participantId: "participant-a",
      localDate: "2026-09-06",
      amount: 14_000,
      votes: 7,
      version: 2,
    });

    const addedWithoutReason = await saveVotingTalliesBatch(
      db,
      "edition-a",
      {
        campaignId: campaign.id,
        entries: [{ participantId: "participant-a", votes: 2, mode: "add" }],
        canManageTally: true,
      },
      actor,
      now,
    );
    assert.equal(addedWithoutReason.updatedCount, 1);

    await assert.rejects(
      saveVotingTalliesBatch(
        db,
        "edition-a",
        {
          campaignId: campaign.id,
          entries: [{ participantId: "participant-a", votes: 5, mode: "set" }],
          canManageTally: true,
        },
        actor,
        now,
      ),
      /Alasan tindakan wajib diisi/,
    );
  } finally {
    client.close();
  }
});

