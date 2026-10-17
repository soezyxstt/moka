import { and, eq, inArray, ne } from "drizzle-orm";

import { calculateVotesFromAmount, formatLocalDate } from "@/lib/voting";
import { appendAuditLog } from "@/server/auth/audit";
import type { Database } from "@/server/db/queries";
import {
  mediaAssets,
  participants,
  selectionStages,
  voteDailyTallies,
  votingCampaignParticipants,
  votingCampaigns,
} from "@/server/db/schema";

type AuditActor = { userId: string; label: string };
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

const staleCampaignMessage = "Kampanye telah diubah. Muat ulang halaman.";

async function requireCampaign(tx: Transaction, editionId: string, campaignId: string) {
  const [campaign] = await tx
    .select()
    .from(votingCampaigns)
    .where(
      and(eq(votingCampaigns.id, campaignId), eq(votingCampaigns.editionId, editionId)),
    )
    .limit(1);
  if (!campaign) throw new Error("Kampanye tidak ditemukan pada edisi aktif");
  return campaign;
}

async function requireStage(tx: Transaction, editionId: string, stageId: string) {
  const [stage] = await tx
    .select()
    .from(selectionStages)
    .where(and(eq(selectionStages.id, stageId), eq(selectionStages.editionId, editionId)))
    .limit(1);
  if (!stage) throw new Error("Tahap sumber tidak ditemukan pada edisi aktif");
  return stage;
}

function requireReason(reason: string) {
  const value = reason.trim();
  if (!value) throw new Error("Alasan tindakan wajib diisi");
  return value;
}

function requireExpectedVersion(actual: number, expected: number) {
  if (!Number.isInteger(expected) || actual !== expected) {
    throw new Error(staleCampaignMessage);
  }
}

function requireLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Tanggal lokal tidak valid");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error("Tanggal lokal tidak valid");
  }
}

export async function createVotingCampaign(
  db: Database,
  editionId: string,
  input: {
    name: string;
    slug: string;
    description?: string | null;
    eligibilityStageId: string;
    startsAt: Date;
    endsAt: Date;
    pricePerPoint: number;
  },
  actor: AuditActor,
  now: Date,
) {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const description = input.description?.trim() || null;
  if (
    !name ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    Number.isNaN(input.startsAt.valueOf()) ||
    Number.isNaN(input.endsAt.valueOf()) ||
    input.startsAt >= input.endsAt ||
    !Number.isSafeInteger(input.pricePerPoint) ||
    input.pricePerPoint <= 0
  ) {
    throw new Error("Kampanye voting tidak valid");
  }

  return db.transaction(async (tx) => {
    const stage = await requireStage(tx, editionId, input.eligibilityStageId);
    const [duplicate] = await tx
      .select({ id: votingCampaigns.id })
      .from(votingCampaigns)
      .where(eq(votingCampaigns.slug, slug))
      .limit(1);
    if (duplicate) throw new Error("Slug kampanye sudah digunakan");

    const id = crypto.randomUUID();
    await tx.insert(votingCampaigns).values({
      id,
      editionId,
      eligibilityStageId: stage.id,
      name,
      slug,
      description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      pricePerPoint: input.pricePerPoint,
      status: "draft",
      resultVisibility: "hidden",
      showResultUpdatedAt: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "voting.campaign.create",
      resourceType: "votingCampaign",
      resourceId: id,
      resourceLabel: name,
      after: {
        editionId,
        eligibilityStageId: stage.id,
        name,
        slug,
        description,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        pricePerPoint: input.pricePerPoint,
        status: "draft",
        resultVisibility: "hidden",
        showResultUpdatedAt: true,
        version: 1,
      },
      changedFields: [
        "editionId",
        "eligibilityStageId",
        "name",
        "slug",
        ...(description ? ["description"] : []),
        "startsAt",
        "endsAt",
        "pricePerPoint",
        "status",
        "resultVisibility",
        "version",
      ],
      source: "admin-voting",
    });
    return { id, version: 1 };
  });
}

export async function updateVotingCampaign(
  db: Database,
  editionId: string,
  input: {
    campaignId: string;
    expectedVersion: number;
    name: string;
    slug: string;
    description?: string | null;
    eligibilityStageId?: string;
    startsAt: Date;
    endsAt: Date;
    pricePerPoint: number;
  },
  actor: AuditActor,
  now: Date,
) {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (
    !name ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    Number.isNaN(input.startsAt.valueOf()) ||
    Number.isNaN(input.endsAt.valueOf()) ||
    input.startsAt >= input.endsAt ||
    !Number.isSafeInteger(input.pricePerPoint) ||
    input.pricePerPoint <= 0
  ) {
    throw new Error("Data kampanye voting tidak valid");
  }

  return db.transaction(async (tx) => {
    const campaign = await requireCampaign(tx, editionId, input.campaignId);
    requireExpectedVersion(campaign.version, input.expectedVersion);
    const description = input.description !== undefined ? input.description?.trim() || null : campaign.description;

    const [duplicate] = await tx
      .select({ id: votingCampaigns.id })
      .from(votingCampaigns)
      .where(and(eq(votingCampaigns.slug, slug), ne(votingCampaigns.id, campaign.id)))
      .limit(1);
    if (duplicate) throw new Error("Slug kampanye sudah digunakan");

    let targetStageId = campaign.eligibilityStageId;
    if (input.eligibilityStageId && input.eligibilityStageId !== campaign.eligibilityStageId) {
      if (campaign.status !== "draft") {
        throw new Error("Tahap sumber hanya dapat diubah saat kampanye masih draf");
      }
      const [snapshot] = await tx
        .select({ participantId: votingCampaignParticipants.participantId })
        .from(votingCampaignParticipants)
        .where(eq(votingCampaignParticipants.campaignId, campaign.id))
        .limit(1);
      if (snapshot) throw new Error("Tahap sumber tidak dapat diubah setelah snapshot dibuat");

      const stage = await requireStage(tx, editionId, input.eligibilityStageId);
      targetStageId = stage.id;
    }

    const tallies = await tx
      .select({ localDate: voteDailyTallies.localDate })
      .from(voteDailyTallies)
      .where(eq(voteDailyTallies.campaignId, campaign.id));
    if (tallies.length > 0) {
      const dates = tallies.map((t) => t.localDate).sort();
      const minLocalDate = dates[0]!;
      const maxLocalDate = dates[dates.length - 1]!;
      const newFirstDate = formatLocalDate(input.startsAt, campaign.timezone);
      const newLastDate = formatLocalDate(input.endsAt, campaign.timezone);
      if (newFirstDate > minLocalDate || newLastDate < maxLocalDate) {
        throw new Error("Rentang tanggal kampanye tidak boleh mengecualikan tally yang sudah ada");
      }
    }

    const nextVersion = campaign.version + 1;
    const [updated] = await tx
      .update(votingCampaigns)
      .set({
        name,
        slug,
        description,
        eligibilityStageId: targetStageId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        pricePerPoint: input.pricePerPoint,
        version: nextVersion,
        updatedAt: now,
      })
      .where(
        and(
          eq(votingCampaigns.id, campaign.id),
          eq(votingCampaigns.editionId, editionId),
          eq(votingCampaigns.version, input.expectedVersion),
        ),
      )
      .returning({ id: votingCampaigns.id });
    if (!updated) throw new Error(staleCampaignMessage);

    const changedFields: string[] = [];
    if (campaign.name !== name) changedFields.push("name");
    if (campaign.slug !== slug) changedFields.push("slug");
    if (campaign.description !== description) changedFields.push("description");
    if (campaign.eligibilityStageId !== targetStageId) changedFields.push("eligibilityStageId");
    if (campaign.startsAt.valueOf() !== input.startsAt.valueOf()) changedFields.push("startsAt");
    if (campaign.endsAt.valueOf() !== input.endsAt.valueOf()) changedFields.push("endsAt");
    if (campaign.pricePerPoint !== input.pricePerPoint) changedFields.push("pricePerPoint");
    changedFields.push("version");

    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "voting.campaign.update",
      resourceType: "votingCampaign",
      resourceId: campaign.id,
      resourceLabel: name,
      before: {
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        eligibilityStageId: campaign.eligibilityStageId,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
        pricePerPoint: campaign.pricePerPoint,
        version: campaign.version,
      },
      after: {
        name,
        slug,
        description,
        eligibilityStageId: targetStageId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        pricePerPoint: input.pricePerPoint,
        version: nextVersion,
      },
      changedFields,
      source: "admin-voting",
    });

    return { id: campaign.id, version: nextVersion };
  });
}

export async function updateVotingCampaignStage(
  db: Database,
  editionId: string,
  input: { campaignId: string; stageId: string; expectedVersion: number },
  actor: AuditActor,
  now: Date,
) {
  return db.transaction(async (tx) => {
    const campaign = await requireCampaign(tx, editionId, input.campaignId);
    requireExpectedVersion(campaign.version, input.expectedVersion);
    if (campaign.status !== "draft") {
      throw new Error("Tahap sumber hanya dapat diubah saat kampanye masih draf");
    }
    const stage = await requireStage(tx, editionId, input.stageId);
    const [snapshot] = await tx
      .select({ participantId: votingCampaignParticipants.participantId })
      .from(votingCampaignParticipants)
      .where(eq(votingCampaignParticipants.campaignId, campaign.id))
      .limit(1);
    if (snapshot) throw new Error("Tahap sumber tidak dapat diubah setelah snapshot dibuat");

    const [updated] = await tx
      .update(votingCampaigns)
      .set({ eligibilityStageId: stage.id, version: campaign.version + 1, updatedAt: now })
      .where(
        and(
          eq(votingCampaigns.id, campaign.id),
          eq(votingCampaigns.editionId, editionId),
          eq(votingCampaigns.version, input.expectedVersion),
        ),
      )
      .returning({ id: votingCampaigns.id });
    if (!updated) throw new Error(staleCampaignMessage);
    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "voting.campaign.stage.update",
      resourceType: "votingCampaign",
      resourceId: campaign.id,
      resourceLabel: campaign.name,
      before: { eligibilityStageId: campaign.eligibilityStageId, version: campaign.version },
      after: { eligibilityStageId: stage.id, version: campaign.version + 1 },
      changedFields: ["eligibilityStageId", "version"],
      source: "admin-voting",
    });
    return { version: campaign.version + 1 };
  });
}

export async function startVotingCampaign(
  db: Database,
  editionId: string,
  input: { campaignId: string; expectedVersion: number; confirmation: string; reason: string },
  actor: AuditActor,
  now: Date,
) {
  const reason = requireReason(input.reason);
  return db.transaction(async (tx) => {
    const campaign = await requireCampaign(tx, editionId, input.campaignId);
    requireExpectedVersion(campaign.version, input.expectedVersion);
    if (campaign.status !== "draft") throw new Error("Hanya kampanye draf yang dapat dimulai");
    if (input.confirmation.trim() !== campaign.name) {
      throw new Error("Ketik nama kampanye untuk mengonfirmasi");
    }
    if (!campaign.eligibilityStageId) throw new Error("Pilih tahap sumber sebelum memulai voting");
    await requireStage(tx, editionId, campaign.eligibilityStageId);

    const eligible = await tx
      .select({ participantId: participants.id })
      .from(participants)
      .where(
        and(
          eq(participants.editionId, editionId),
          eq(participants.currentStageId, campaign.eligibilityStageId),
          eq(participants.active, true),
          ne(participants.selectionStatus, "eliminated"),
        ),
      );
    if (eligible.length === 0) throw new Error("Tahap sumber belum memiliki peserta aktif");

    const existingSnapshot = await tx
      .select({ participantId: votingCampaignParticipants.participantId })
      .from(votingCampaignParticipants)
      .where(eq(votingCampaignParticipants.campaignId, campaign.id));
    if (existingSnapshot.length > 0) throw new Error("Snapshot kampanye sudah pernah dibuat");

    await tx.insert(votingCampaignParticipants).values(
      eligible.map((entry) => ({
        campaignId: campaign.id,
        participantId: entry.participantId,
        sourceStageId: campaign.eligibilityStageId,
        addedAt: now,
      })),
    );
    const [updated] = await tx
      .update(votingCampaigns)
      .set({ status: "active", startedAt: now, version: campaign.version + 1, updatedAt: now })
      .where(
        and(
          eq(votingCampaigns.id, campaign.id),
          eq(votingCampaigns.editionId, editionId),
          eq(votingCampaigns.version, input.expectedVersion),
        ),
      )
      .returning({ id: votingCampaigns.id });
    if (!updated) throw new Error(staleCampaignMessage);
    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "voting.campaign.start",
      resourceType: "votingCampaign",
      resourceId: campaign.id,
      resourceLabel: campaign.name,
      before: { status: campaign.status, version: campaign.version },
      after: {
        status: "active",
        startedAt: now,
        snapshotCount: eligible.length,
        sourceStageId: campaign.eligibilityStageId,
        version: campaign.version + 1,
      },
      changedFields: ["status", "startedAt", "snapshot", "version"],
      source: "admin-voting",
      reason,
    });
    return { version: campaign.version + 1, snapshotCount: eligible.length };
  });
}

export async function closeVotingCampaign(
  db: Database,
  editionId: string,
  input: { campaignId: string; expectedVersion: number; confirmation: string; reason: string },
  actor: AuditActor,
  now: Date,
) {
  const reason = requireReason(input.reason);
  return db.transaction(async (tx) => {
    const campaign = await requireCampaign(tx, editionId, input.campaignId);
    requireExpectedVersion(campaign.version, input.expectedVersion);
    if (campaign.status !== "active") throw new Error("Hanya kampanye aktif yang dapat ditutup");
    if (input.confirmation.trim() !== campaign.name) {
      throw new Error("Ketik nama kampanye untuk mengonfirmasi");
    }
    const [updated] = await tx
      .update(votingCampaigns)
      .set({ status: "closed", closedAt: now, version: campaign.version + 1, updatedAt: now })
      .where(
        and(
          eq(votingCampaigns.id, campaign.id),
          eq(votingCampaigns.editionId, editionId),
          eq(votingCampaigns.version, input.expectedVersion),
        ),
      )
      .returning({ id: votingCampaigns.id });
    if (!updated) throw new Error(staleCampaignMessage);
    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "voting.campaign.close",
      resourceType: "votingCampaign",
      resourceId: campaign.id,
      resourceLabel: campaign.name,
      before: { status: campaign.status, version: campaign.version },
      after: { status: "closed", closedAt: now, version: campaign.version + 1 },
      changedFields: ["status", "closedAt", "version"],
      source: "admin-voting",
      reason,
    });
    return { version: campaign.version + 1 };
  });
}

export async function deleteVotingCampaign(
  db: Database,
  editionId: string,
  input: { campaignId: string; expectedVersion: number; confirmation: string; reason: string },
  actor: AuditActor,
) {
  const reason = requireReason(input.reason);
  return db.transaction(async (tx) => {
    const campaign = await requireCampaign(tx, editionId, input.campaignId);
    requireExpectedVersion(campaign.version, input.expectedVersion);
    if (input.confirmation.trim() !== campaign.name) {
      throw new Error("Ketik nama kampanye untuk mengonfirmasi");
    }

    await tx.delete(voteDailyTallies).where(eq(voteDailyTallies.campaignId, campaign.id));
    await tx.delete(votingCampaignParticipants).where(eq(votingCampaignParticipants.campaignId, campaign.id));

    const [deleted] = await tx
      .delete(votingCampaigns)
      .where(
        and(
          eq(votingCampaigns.id, campaign.id),
          eq(votingCampaigns.editionId, editionId),
          eq(votingCampaigns.version, input.expectedVersion),
        ),
      )
      .returning({ id: votingCampaigns.id });
    if (!deleted) throw new Error(staleCampaignMessage);

    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "voting.campaign.delete",
      resourceType: "votingCampaign",
      resourceId: campaign.id,
      resourceLabel: campaign.name,
      before: {
        editionId: campaign.editionId,
        name: campaign.name,
        slug: campaign.slug,
        status: campaign.status,
        eligibilityStageId: campaign.eligibilityStageId,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
        pricePerPoint: campaign.pricePerPoint,
        resultVisibility: campaign.resultVisibility,
        version: campaign.version,
      },
      after: null,
      changedFields: ["deleted"],
      source: "admin-voting",
      reason,
    });

    return { id: campaign.id };
  });
}

export async function setVotingResultVisibility(
  db: Database,
  editionId: string,
  input: {
    campaignId: string;
    expectedVersion: number;
    visibility: "hidden" | "visible";
    reason: string;
  },
  actor: AuditActor,
  now: Date,
) {
  const reason = requireReason(input.reason);
  if (!(input.visibility === "hidden" || input.visibility === "visible")) {
    throw new Error("Visibilitas hasil tidak valid");
  }
  return db.transaction(async (tx) => {
    const campaign = await requireCampaign(tx, editionId, input.campaignId);
    requireExpectedVersion(campaign.version, input.expectedVersion);
    if (input.visibility === "visible" && campaign.status === "draft") {
      throw new Error("Hasil kampanye draf belum dapat ditampilkan");
    }
    const [updated] = await tx
      .update(votingCampaigns)
      .set({
        resultVisibility: input.visibility,
        version: campaign.version + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(votingCampaigns.id, campaign.id),
          eq(votingCampaigns.editionId, editionId),
          eq(votingCampaigns.version, input.expectedVersion),
        ),
      )
      .returning({ id: votingCampaigns.id });
    if (!updated) throw new Error(staleCampaignMessage);
    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "voting.campaign.visibility.update",
      resourceType: "votingCampaign",
      resourceId: campaign.id,
      resourceLabel: campaign.name,
      before: { resultVisibility: campaign.resultVisibility, version: campaign.version },
      after: { resultVisibility: input.visibility, version: campaign.version + 1 },
      changedFields: ["resultVisibility", "version"],
      source: "admin-voting",
      reason,
    });
    return { version: campaign.version + 1 };
  });
}

export async function setVotingShowResultUpdatedAt(
  db: Database,
  editionId: string,
  input: {
    campaignId: string;
    expectedVersion: number;
    showResultUpdatedAt: boolean;
    reason: string;
  },
  actor: AuditActor,
  now: Date,
) {
  const reason = requireReason(input.reason);
  if (typeof input.showResultUpdatedAt !== "boolean") {
    throw new Error("Pilihan tampilan waktu pembaruan tidak valid");
  }
  return db.transaction(async (tx) => {
    const campaign = await requireCampaign(tx, editionId, input.campaignId);
    requireExpectedVersion(campaign.version, input.expectedVersion);
    const [updated] = await tx
      .update(votingCampaigns)
      .set({
        showResultUpdatedAt: input.showResultUpdatedAt,
        version: campaign.version + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(votingCampaigns.id, campaign.id),
          eq(votingCampaigns.editionId, editionId),
          eq(votingCampaigns.version, input.expectedVersion),
        ),
      )
      .returning({ id: votingCampaigns.id });
    if (!updated) throw new Error(staleCampaignMessage);
    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "voting.campaign.resultUpdatedAt.update",
      resourceType: "votingCampaign",
      resourceId: campaign.id,
      resourceLabel: campaign.name,
      before: { showResultUpdatedAt: campaign.showResultUpdatedAt, version: campaign.version },
      after: { showResultUpdatedAt: input.showResultUpdatedAt, version: campaign.version + 1 },
      changedFields: ["showResultUpdatedAt", "version"],
      source: "admin-voting",
      reason,
    });
    return { version: campaign.version + 1 };
  });
}

export async function saveVotingTally(
  db: Database,
  editionId: string,
  input: {
    campaignId: string;
    participantId: string;
    localDate: string;
    amount: number;
    expectedVersion: number;
    reason: string;
  },
  actor: AuditActor,
  now: Date,
) {
  const reason = requireReason(input.reason);
  requireLocalDate(input.localDate);
  if (
    !Number.isSafeInteger(input.amount) ||
    input.amount < 0 ||
    !Number.isSafeInteger(input.expectedVersion) ||
    input.expectedVersion < 0
  ) {
    throw new Error("Tally tidak valid");
  }

  return db.transaction(async (tx) => {
    const campaign = await requireCampaign(tx, editionId, input.campaignId);
    if (campaign.status !== "active") throw new Error("Tally hanya dapat diubah saat voting aktif");
    const [snapshot] = await tx
      .select({
        participantId: votingCampaignParticipants.participantId,
        name: participants.name,
        qrisMediaId: participants.qrisMediaId,
        mimeType: mediaAssets.mimeType,
        lifecycle: mediaAssets.lifecycle,
      })
      .from(votingCampaignParticipants)
      .innerJoin(participants, eq(participants.id, votingCampaignParticipants.participantId))
      .leftJoin(mediaAssets, eq(mediaAssets.id, participants.qrisMediaId))
      .where(
        and(
          eq(votingCampaignParticipants.campaignId, campaign.id),
          eq(votingCampaignParticipants.participantId, input.participantId),
          eq(participants.editionId, editionId),
        ),
      )
      .limit(1);
    if (!snapshot) throw new Error("Peserta tidak ada pada snapshot kampanye");
    if (
      !snapshot.qrisMediaId ||
      snapshot.lifecycle !== "ready" ||
      !snapshot.mimeType?.startsWith("image/")
    ) {
      throw new Error("Peserta belum memiliki gambar QRIS yang siap");
    }

    const firstDate = formatLocalDate(campaign.startsAt, campaign.timezone);
    const lastDate = formatLocalDate(campaign.endsAt, campaign.timezone);
    if (input.localDate < firstDate || input.localDate > lastDate) {
      throw new Error("Tanggal tally berada di luar periode kampanye");
    }

    const [before] = await tx
      .select()
      .from(voteDailyTallies)
      .where(
        and(
          eq(voteDailyTallies.campaignId, campaign.id),
          eq(voteDailyTallies.participantId, input.participantId),
          eq(voteDailyTallies.localDate, input.localDate),
        ),
      )
      .limit(1);
    if ((before?.version ?? 0) !== input.expectedVersion) {
      throw new Error("Tally telah diubah. Muat ulang halaman.");
    }

    const id = before?.id ?? crypto.randomUUID();
    const nextVersion = (before?.version ?? 0) + 1;
    if (before) {
      const [updated] = await tx
        .update(voteDailyTallies)
        .set({ amount: input.amount, version: nextVersion, updatedAt: now })
        .where(
          and(
            eq(voteDailyTallies.id, before.id),
            eq(voteDailyTallies.version, input.expectedVersion),
          ),
        )
        .returning({ id: voteDailyTallies.id });
      if (!updated) throw new Error("Tally telah diubah. Muat ulang halaman.");
    } else {
      await tx.insert(voteDailyTallies).values({
        id,
        campaignId: campaign.id,
        participantId: input.participantId,
        localDate: input.localDate,
        amount: input.amount,
        version: nextVersion,
        createdAt: now,
        updatedAt: now,
      });
    }
    const votes = calculateVotesFromAmount(input.amount, campaign.pricePerPoint);
    const beforeVotes = before
      ? calculateVotesFromAmount(before.amount, campaign.pricePerPoint)
      : null;
    await appendAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: before ? "voting.tally.correct" : "voting.tally.create",
      resourceType: "voteDailyTally",
      resourceId: id,
      resourceLabel: snapshot.name,
      before: before
        ? {
            campaignId: campaign.id,
            participantId: input.participantId,
            localDate: input.localDate,
            amount: before.amount,
            votes: beforeVotes,
            version: before.version,
          }
        : null,
      after: {
        campaignId: campaign.id,
        participantId: input.participantId,
        localDate: input.localDate,
        amount: input.amount,
        votes,
        version: nextVersion,
      },
      changedFields: before
        ? ["amount", "votes", "version"]
        : ["campaignId", "participantId", "localDate", "amount", "votes", "version"],
      source: "admin-voting",
      reason,
    });
    return { id, version: nextVersion };
  });
}

export async function saveVotingTalliesBatch(
  db: Database,
  editionId: string,
  input: {
    campaignId: string;
    entries: Array<{
      participantId: string;
      votes: number;
      mode?: "add" | "set";
      expectedVersion?: number;
    }>;
    reason?: string;
    canManageTally?: boolean;
  },
  actor: AuditActor,
  now: Date,
) {
  if (!Array.isArray(input.entries) || input.entries.length === 0) {
    throw new Error("Tidak ada data peserta yang akan diperbarui");
  }
  const hasSetMode = input.entries.some((entry) => entry.mode === "set");
  const reason = hasSetMode
    ? requireReason(input.reason ?? "")
    : input.reason?.trim() || "Tambah vote";

  return db.transaction(async (tx) => {
    const campaign = await requireCampaign(tx, editionId, input.campaignId);
    if (campaign.status !== "active") throw new Error("Tally hanya dapat diubah saat voting aktif");

    const localDate = formatLocalDate(now, campaign.timezone);
    const firstDate = formatLocalDate(campaign.startsAt, campaign.timezone);
    const lastDate = formatLocalDate(campaign.endsAt, campaign.timezone);
    if (localDate < firstDate || localDate > lastDate) {
      throw new Error("Tanggal hari ini berada di luar periode kampanye");
    }

    const validEntries = input.entries.filter((entry) => {
      const mode = entry.mode ?? "add";
      if (!Number.isSafeInteger(entry.votes)) return false;
      if (!input.canManageTally && (mode === "set" || entry.votes <= 0)) {
        throw new Error("Izin voting.tally.manage diperlukan untuk mengatur atau mengurangi vote");
      }
      if (mode === "add" && entry.votes === 0) return false;
      if (mode === "set" && entry.votes < 0) return false;
      return true;
    });

    if (validEntries.length === 0) {
      throw new Error("Masukkan jumlah vote untuk setidaknya satu peserta");
    }

    const participantIds = validEntries.map((e) => e.participantId);

    const snapshots = await tx
      .select({
        participantId: votingCampaignParticipants.participantId,
        name: participants.name,
        qrisMediaId: participants.qrisMediaId,
        mimeType: mediaAssets.mimeType,
        lifecycle: mediaAssets.lifecycle,
      })
      .from(votingCampaignParticipants)
      .innerJoin(participants, eq(participants.id, votingCampaignParticipants.participantId))
      .leftJoin(mediaAssets, eq(mediaAssets.id, participants.qrisMediaId))
      .where(
        and(
          eq(votingCampaignParticipants.campaignId, campaign.id),
          inArray(votingCampaignParticipants.participantId, participantIds),
          eq(participants.editionId, editionId),
        ),
      );

    const snapshotMap = new Map(snapshots.map((s) => [s.participantId, s]));

    const allExistingTallies = await tx
      .select()
      .from(voteDailyTallies)
      .where(
        and(
          eq(voteDailyTallies.campaignId, campaign.id),
          inArray(voteDailyTallies.participantId, participantIds),
        ),
      );

    const todayTallyMap = new Map<string, typeof voteDailyTallies.$inferSelect>();
    const otherDaysAmountMap = new Map<string, number>();

    for (const tally of allExistingTallies) {
      if (tally.localDate === localDate) {
        todayTallyMap.set(tally.participantId, tally);
      } else {
        otherDaysAmountMap.set(
          tally.participantId,
          (otherDaysAmountMap.get(tally.participantId) ?? 0) + tally.amount,
        );
      }
    }

    const results = [];

    for (const entry of validEntries) {
      const snapshot = snapshotMap.get(entry.participantId);
      if (!snapshot) throw new Error("Peserta tidak ada pada snapshot kampanye");
      if (
        !snapshot.qrisMediaId ||
        snapshot.lifecycle !== "ready" ||
        !snapshot.mimeType?.startsWith("image/")
      ) {
        throw new Error(`Peserta ${snapshot.name} belum memiliki gambar QRIS yang siap`);
      }

      const before = todayTallyMap.get(entry.participantId);
      if (
        entry.expectedVersion !== undefined &&
        (before?.version ?? 0) !== entry.expectedVersion
      ) {
        throw new Error(`Data tally untuk ${snapshot.name} telah diubah. Muat ulang halaman.`);
      }

      const otherDaysAmount = otherDaysAmountMap.get(entry.participantId) ?? 0;
      const currentTotalAmount = otherDaysAmount + (before?.amount ?? 0);
      const mode = entry.mode ?? "add";

      let targetTodayAmount: number;
      let targetTotalAmount: number;

      if (mode === "set") {
        if (!input.canManageTally) {
          throw new Error("Izin voting.tally.manage diperlukan untuk mengatur total vote");
        }
        targetTotalAmount = entry.votes * campaign.pricePerPoint;
        targetTodayAmount = targetTotalAmount - otherDaysAmount;
      } else {
        const delta = entry.votes * campaign.pricePerPoint;
        if (!input.canManageTally && delta < 0) {
          throw new Error("Izin voting.tally.manage diperlukan untuk mengurangi vote");
        }
        targetTotalAmount = currentTotalAmount + delta;
        targetTodayAmount = (before?.amount ?? 0) + delta;
      }

      if (!Number.isSafeInteger(targetTotalAmount) || targetTotalAmount < 0) {
        throw new Error(`Total vote untuk ${snapshot.name} tidak boleh kurang dari 0`);
      }

      // If target today amount is negative (e.g. setting total lower than votes from previous days),
      // set today to 0 and deduct the difference from other days' tallies.
      if (targetTodayAmount < 0) {
        let deficit = -targetTodayAmount;
        targetTodayAmount = 0;

        const otherTallies = allExistingTallies
          .filter((t) => t.participantId === entry.participantId && t.localDate !== localDate)
          .sort((a, b) => b.localDate.localeCompare(a.localDate));

        for (const prevTally of otherTallies) {
          if (deficit <= 0) break;
          const reduction = Math.min(prevTally.amount, deficit);
          const newAmount = prevTally.amount - reduction;
          deficit -= reduction;

          await tx
            .update(voteDailyTallies)
            .set({ amount: newAmount, version: prevTally.version + 1, updatedAt: now })
            .where(
              and(
                eq(voteDailyTallies.id, prevTally.id),
                eq(voteDailyTallies.version, prevTally.version),
              ),
            );
        }
      }

      const id = before?.id ?? crypto.randomUUID();
      const nextVersion = (before?.version ?? 0) + 1;

      if (before) {
        const [updated] = await tx
          .update(voteDailyTallies)
          .set({ amount: targetTodayAmount, version: nextVersion, updatedAt: now })
          .where(
            and(
              eq(voteDailyTallies.id, before.id),
              eq(voteDailyTallies.version, before.version),
            ),
          )
          .returning({ id: voteDailyTallies.id });
        if (!updated) {
          throw new Error(`Data tally untuk ${snapshot.name} telah diubah. Muat ulang halaman.`);
        }
      } else {
        await tx.insert(voteDailyTallies).values({
          id,
          campaignId: campaign.id,
          participantId: entry.participantId,
          localDate,
          amount: targetTodayAmount,
          version: nextVersion,
          createdAt: now,
          updatedAt: now,
        });
      }

      const finalTotalVotes = calculateVotesFromAmount(targetTotalAmount, campaign.pricePerPoint);
      const beforeTotalVotes = calculateVotesFromAmount(currentTotalAmount, campaign.pricePerPoint);

      await appendAuditLog(tx, {
        actorUserId: actor.userId,
        actorLabel: actor.label,
        action: before ? "voting.tally.correct" : "voting.tally.create",
        resourceType: "voteDailyTally",
        resourceId: id,
        resourceLabel: snapshot.name,
        before: {
          campaignId: campaign.id,
          participantId: entry.participantId,
          localDate,
          amount: before?.amount ?? 0,
          totalAmount: currentTotalAmount,
          votes: beforeTotalVotes,
          version: before?.version ?? 0,
        },
        after: {
          campaignId: campaign.id,
          participantId: entry.participantId,
          localDate,
          amount: targetTodayAmount,
          totalAmount: targetTotalAmount,
          votes: finalTotalVotes,
          version: nextVersion,
        },
        changedFields: ["amount", "votes", "version"],
        source: "admin-voting",
        reason,
      });

      results.push({ id, participantId: entry.participantId, version: nextVersion });
    }

    return { updatedCount: results.length, localDate, results };
  });
}

