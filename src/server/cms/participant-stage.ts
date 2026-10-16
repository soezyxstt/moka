import { and, asc, eq } from 'drizzle-orm';
import type { Database } from '../db/queries';
import { participants, participantStageEntries, selectionStages } from '../db/schema';

export async function getPublicParticipantStage(
  db: Database,
  editionId: string,
  kind: 'semifinalis' | 'finalis',
) {
  const stages = await db
    .select({ id: selectionStages.id, slug: selectionStages.slug, finalStage: selectionStages.finalStage, lifecycle: selectionStages.lifecycle })
    .from(selectionStages)
    .where(eq(selectionStages.editionId, editionId))
    .orderBy(asc(selectionStages.displayOrder), asc(selectionStages.id));
  const finalIndex = stages.findIndex((stage) => stage.finalStage);
  const targetStage = kind === 'finalis'
    ? stages[finalIndex]
    : finalIndex >= 0
      ? stages[finalIndex - 1]
      : stages.find((stage) => ['semifinal', 'semifinalis'].includes(stage.slug));
  if (!targetStage || targetStage.lifecycle === 'draft') return undefined;
  if (kind === 'finalis') {
    if (stages.slice(0, finalIndex).some((stage) => stage.lifecycle === 'active')) return undefined;
    const [entry] = await db.select({ id: participants.id }).from(participantStageEntries)
      .innerJoin(participants, eq(participantStageEntries.participantId, participants.id))
      .where(and(eq(participantStageEntries.stageId, targetStage.id), eq(participants.editionId, editionId), eq(participants.active, true)))
      .limit(1);
    if (!entry) return undefined;
  }
  return targetStage;
}
