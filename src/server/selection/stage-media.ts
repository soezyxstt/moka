import { and, eq, sql } from "drizzle-orm";

import type { Database } from "@/server/db/queries";
import { participants, participantStageEntries } from "@/server/db/schema";

export const stagePortraitMediaId = sql<string | null>`case when ${participantStageEntries.mediaInitialized} = 1 then ${participantStageEntries.portraitMediaId} else ${participants.portraitMediaId} end`;
export const stageQrisMediaId = sql<string | null>`case when ${participantStageEntries.mediaInitialized} = 1 then ${participantStageEntries.qrisMediaId} else ${participants.qrisMediaId} end`;

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function initializeParticipantStageMedia(
  tx: Transaction,
  participant: { id: string; portraitMediaId: string | null; qrisMediaId: string | null },
  now: Date,
) {
  await tx.update(participantStageEntries).set({
    portraitMediaId: participant.portraitMediaId,
    qrisMediaId: participant.qrisMediaId,
    mediaInitialized: true,
    version: sql`${participantStageEntries.version} + 1`,
    updatedAt: now,
  }).where(and(eq(participantStageEntries.participantId, participant.id), eq(participantStageEntries.mediaInitialized, false)));
}
