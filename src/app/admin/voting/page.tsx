import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { AdminBadge, AdminCard, AdminEmptyState, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import {
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

import { VotingConsole } from "./voting-console";

export const metadata = { title: "Voting tahunan" };

export default async function VotingAdminPage() {
  const { effectivePermissions } = await requirePermission("voting.view");
  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    return (
      <AdminPage
        eyebrow="Operasional"
        title="Voting tahunan"
      >
        <AdminCard>
          <AdminEmptyState
            icon="calendar"
            title="Belum ada edisi aktif"
            description="Pilih edisi di bagian atas untuk mulai."
          />
        </AdminCard>
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
  const [participantRows, tallyRows] = campaignIds.length
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
      ])
    : [[], []];

  return (
    <AdminPage
      eyebrow="Operasional"
      title={`Voting ${currentEdition.name}`}
      action={<AdminBadge value={currentEdition.lifecycle} />}
    >
      <VotingConsole
        key={`${currentEdition.id}:${campaignRows.map((campaign) => `${campaign.id}:${campaign.version}`).join(",")}:${tallyRows.map((tally) => `${tally.id}:${tally.version}`).join(",")}`}
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
        canManage={effectivePermissions.has("voting.manage")}
        canTally={effectivePermissions.has("voting.tally")}
      />
    </AdminPage>
  );
}
