import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import {
  categories,
  categoryValues,
  participantStageEntries,
  participants,
  selectionStages,
  type StageCategoryTargets,
} from "@/server/db/schema";
import { StageSelectionWorkspace } from "./stage-selection-workspace";

export const metadata = { title: "Workspace Keputusan Seleksi" };

export default async function StageWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: stageId } = await params;
  const { effectivePermissions } = await requirePermission("content.view");
  const canEdit = effectivePermissions.has("participants.manage");

  const currentEdition = await getAdminEditionContext();
  if (!currentEdition) {
    notFound();
  }

  // Verify stage belongs to current active edition
  const [stage] = await database
    .select()
    .from(selectionStages)
    .where(
      and(
        eq(selectionStages.id, stageId),
        eq(selectionStages.editionId, currentEdition.id)
      )
    )
    .limit(1);

  if (!stage) {
    notFound();
  }

  // Load all stages in edition to find previous and next stage
  const allStages = await database
    .select({
      id: selectionStages.id,
      name: selectionStages.name,
      displayOrder: selectionStages.displayOrder,
      targetParticipantCount: selectionStages.targetParticipantCount,
      targetJDCount: selectionStages.targetJDCount,
      targetMDCount: selectionStages.targetMDCount,
      targetJRCount: selectionStages.targetJRCount,
      targetMRCount: selectionStages.targetMRCount,
      lifecycle: selectionStages.lifecycle,
      finalStage: selectionStages.finalStage,
    })
    .from(selectionStages)
    .where(eq(selectionStages.editionId, currentEdition.id))
    .orderBy(asc(selectionStages.displayOrder), asc(selectionStages.id));

  const stageTargets = (row: typeof allStages[number]): StageCategoryTargets | null => {
    const values = [row.targetJDCount, row.targetMDCount, row.targetJRCount, row.targetMRCount];
    if (values.every((value) => value === null)) return null;
    if (values.some((value) => value === null)) throw new Error("Target kategori tahap tidak lengkap");
    return Object.fromEntries(categoryValues.map((code, index) => [code, values[index]!])) as StageCategoryTargets;
  };

  const nextStageRow = allStages.find((s) => s.displayOrder > stage.displayOrder) ?? null;
  const nextStage = nextStageRow ? { ...nextStageRow, categoryTargets: stageTargets(nextStageRow) } : null;
  const previousStage =
    [...allStages].reverse().find((s) => s.displayOrder < stage.displayOrder) ?? null;

  // Load categories of the edition for filter
  const categoryRows = await database
    .select({
      id: categories.id,
      code: categories.code,
      label: categories.label,
    })
    .from(categories)
    .where(eq(categories.editionId, currentEdition.id))
    .orderBy(asc(categories.displayOrder));

  // Load entries join participants and categories
  const entryRows = await database
    .select({
      id: participantStageEntries.id,
      participantId: participantStageEntries.participantId,
      stageId: participantStageEntries.stageId,
      decision: participantStageEntries.decision,
      decidedAt: participantStageEntries.decidedAt,
      reason: participantStageEntries.reason,
      version: participantStageEntries.version,
      participantNumber: participants.number,
      participantName: participants.name,
      participantSlug: participants.slug,
      participantActive: participants.active,
      categoryCode: categories.code,
      categoryLabel: categories.label,
      categoryId: categories.id,
    })
    .from(participantStageEntries)
    .innerJoin(participants, eq(participants.id, participantStageEntries.participantId))
    .innerJoin(categories, eq(categories.id, participants.categoryId))
    .where(eq(participantStageEntries.stageId, stage.id))
    .orderBy(asc(participants.number), asc(participants.name));

  return (
    <StageSelectionWorkspace
      key={`${stage.id}:${stage.version}:${entryRows.map((entry) => `${entry.id}:${entry.version}`).join(",")}`}
      stage={stage}
      nextStage={nextStage}
      previousStage={previousStage}
      categories={categoryRows}
      initialEntries={entryRows}
      canEdit={canEdit}
    />
  );
}
