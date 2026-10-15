import { asc, eq } from 'drizzle-orm';
import type { Database } from '../db/queries';
import { selectionStages } from '../db/schema';

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
  return targetStage?.lifecycle !== 'draft' ? targetStage : undefined;
}
