import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminEmptyState, AdminPage } from "@/components/admin/primitives";
import { getEffectivePermissions } from "@/server/auth/authorization";
import { auth } from "@/server/auth/config";
import { database } from "@/server/db/client";
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
} from "@/server/db/schema";
import { getAdminEditionContext } from "@/server/cms/context";
import { createAuditUserLookup } from "@/lib/audit-format";

import { VotingConsole, type VotingAuditEntry } from "./voting-console";

export const metadata = { title: "Voting tahunan" };

function parseAuditPayload(raw: string | null): {
  campaignId?: string;
  participantId?: string;
  localDate?: string;
  amount?: number;
  votes?: number;
} | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      campaignId: typeof parsed.campaignId === "string" ? parsed.campaignId : undefined,
      participantId: typeof parsed.participantId === "string" ? parsed.participantId : undefined,
      localDate: typeof parsed.localDate === "string" ? parsed.localDate : undefined,
      amount: typeof parsed.amount === "number" ? parsed.amount : undefined,
      votes: typeof parsed.votes === "number" ? parsed.votes : undefined,
    };
  } catch {
    return null;
  }
}

export default async function VotingAdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/admin/login");

  const effectivePermissions = await getEffectivePermissions(session.user.id);
  if (!effectivePermissions.has("voting.view")) redirect("/admin/request-access");

  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    return (
      <AdminPage title="Voting">
        <AdminEmptyState
          icon="calendar"
          title="Pilih edisi terlebih dahulu"
        />
      </AdminPage>
    );
  }

  const [campaignRows, stageRows] = await Promise.all([
    database
      .select({
        id: votingCampaigns.id,
        editionId: votingCampaigns.editionId,
        editionName: editions.name,
        year: editions.year,
        name: votingCampaigns.name,
        slug: votingCampaigns.slug,
        description: votingCampaigns.description,
        status: votingCampaigns.status,
        pricePerPoint: votingCampaigns.pricePerPoint,
        startsAt: votingCampaigns.startsAt,
        endsAt: votingCampaigns.endsAt,
        eligibilityStageId: votingCampaigns.eligibilityStageId,
        stageName: selectionStages.name,
        resultVisibility: votingCampaigns.resultVisibility,
        startedAt: votingCampaigns.startedAt,
        closedAt: votingCampaigns.closedAt,
        version: votingCampaigns.version,
      })
      .from(votingCampaigns)
      .innerJoin(editions, eq(votingCampaigns.editionId, editions.id))
      .leftJoin(selectionStages, eq(selectionStages.id, votingCampaigns.eligibilityStageId))
      .where(eq(votingCampaigns.editionId, currentEdition.id))
      .orderBy(desc(votingCampaigns.startsAt)),

    database
      .select({
        id: selectionStages.id,
        name: selectionStages.name,
        displayOrder: selectionStages.displayOrder,
        finalStage: selectionStages.finalStage,
        lifecycle: selectionStages.lifecycle,
      })
      .from(selectionStages)
      .where(eq(selectionStages.editionId, currentEdition.id))
      .orderBy(asc(selectionStages.displayOrder), asc(selectionStages.id)),
  ]);

  const campaignIds = campaignRows.map((c) => c.id);
  const campaignIdSet = new Set(campaignIds);
  const [participantRows, tallyRows, rawAuditRows, users] = campaignIds.length
    ? await Promise.all([
        database
          .select({
            campaignId: votingCampaignParticipants.campaignId,
            id: participants.id,
            editionId: participants.editionId,
            name: participants.name,
            number: participants.number,
            categoryCode: categories.code,
            categoryLabel: categories.label,
            qrisMediaId: participants.qrisMediaId,
            qrisMimeType: mediaAssets.mimeType,
            qrisLifecycle: mediaAssets.lifecycle,
          })
          .from(votingCampaignParticipants)
          .innerJoin(participants, eq(participants.id, votingCampaignParticipants.participantId))
          .innerJoin(categories, eq(participants.categoryId, categories.id))
          .leftJoin(mediaAssets, eq(mediaAssets.id, participants.qrisMediaId))
          .where(
            and(
              inArray(votingCampaignParticipants.campaignId, campaignIds),
              eq(participants.editionId, currentEdition.id),
            ),
          )
          .orderBy(categories.displayOrder, participants.displayOrder),
        database
          .select({
            id: voteDailyTallies.id,
            campaignId: voteDailyTallies.campaignId,
            participantId: voteDailyTallies.participantId,
            localDate: voteDailyTallies.localDate,
            amount: voteDailyTallies.amount,
            version: voteDailyTallies.version,
            updatedAt: voteDailyTallies.updatedAt,
          })
          .from(voteDailyTallies)
          .where(inArray(voteDailyTallies.campaignId, campaignIds))
          .orderBy(desc(voteDailyTallies.localDate)),
        database
          .select({
            id: auditLogs.id,
            actorUserId: auditLogs.actorUserId,
            actorLabel: auditLogs.actorLabel,
            action: auditLogs.action,
            resourceId: auditLogs.resourceId,
            resourceLabel: auditLogs.resourceLabel,
            beforeJson: auditLogs.beforeJson,
            afterJson: auditLogs.afterJson,
            reason: auditLogs.reason,
            createdAt: auditLogs.createdAt,
          })
          .from(auditLogs)
          .where(
            and(
              eq(auditLogs.source, "admin-voting"),
              eq(auditLogs.resourceType, "voteDailyTally"),
            ),
          )
          .orderBy(desc(auditLogs.createdAt))
          .limit(60),
        database.select({ id: authUsers.id, name: authUsers.name, email: authUsers.email }).from(authUsers),
      ])
    : [[], [], [], []];

  const auditLookup = createAuditUserLookup(users);
  const tallyById = new Map(tallyRows.map((row) => [row.id, row]));
  const auditEntries: VotingAuditEntry[] = [];
  for (const row of rawAuditRows) {
    const before = parseAuditPayload(row.beforeJson);
    const after = parseAuditPayload(row.afterJson);
    const linkedTally = tallyById.get(row.resourceId);
    const campaignId = after?.campaignId ?? before?.campaignId ?? linkedTally?.campaignId;
    if (!campaignId || !campaignIdSet.has(campaignId)) continue;
    const actor = auditLookup.resolveActor(row);
    auditEntries.push({
      id: row.id,
      campaignId,
      participantId: after?.participantId ?? before?.participantId ?? linkedTally?.participantId ?? null,
      participantName: row.resourceLabel ?? "Peserta",
      localDate: after?.localDate ?? before?.localDate ?? linkedTally?.localDate ?? "",
      actorLabel: actor.name,
      action: row.action,
      beforeAmount: before?.amount ?? null,
      afterAmount: after?.amount ?? linkedTally?.amount ?? 0,
      reason: row.reason ?? "",
      createdAt: row.createdAt.toISOString(),
    });
  }

  return (
    <AdminPage>
      <VotingConsole
        key={`${currentEdition.id}:${campaignRows.map((campaign) => `${campaign.id}:${campaign.version}`).join(",")}`}
        currentEdition={currentEdition}
        campaigns={campaignRows.map((campaign) => ({
          ...campaign,
          startsAt: campaign.startsAt.toISOString(),
          endsAt: campaign.endsAt.toISOString(),
          startedAt: campaign.startedAt?.toISOString() ?? null,
          closedAt: campaign.closedAt?.toISOString() ?? null,
        }))}
        stages={stageRows}
        participants={participantRows.map((participant) => ({
          ...participant,
          qrisReady: Boolean(
            participant.qrisMediaId &&
              participant.qrisLifecycle === "ready" &&
              participant.qrisMimeType?.startsWith("image/"),
          ),
        }))}
        tallies={tallyRows.map((tally) => ({
          ...tally,
          updatedAt: tally.updatedAt.toISOString(),
        }))}
        auditEntries={auditEntries}
        canManage={effectivePermissions.has("voting.manage")}
        canTally={effectivePermissions.has("voting.tally")}
        canManageTally={
          effectivePermissions.has("voting.tally.manage") ||
          effectivePermissions.has("voting.manage")
        }
      />
    </AdminPage>
  );
}
