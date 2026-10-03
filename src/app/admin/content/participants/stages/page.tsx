import { asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";

import {
  AdminCard,
  AdminEmptyState,
  AdminLinkButton,
  AdminPage,
} from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import { categories, participantStageEntries, participants, selectionStages, categoryValues, parseCategory, type StageCategoryTargets } from "@/server/db/schema";
import { StagesListClient, type StageListItem } from "./stages-list-client";

export const metadata = { title: "Tahap Seleksi | Mojang Jajaka" };

export default async function SelectionStagesPage() {
  const { effectivePermissions } = await requirePermission("content.view");
  const canEdit = effectivePermissions.has("participants.manage");
  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    return (
      <AdminPage
        eyebrow="Peserta"
        title="Tahap seleksi"
      >
        <AdminCard padding="none">
          <div className="p-8">
            <AdminEmptyState
              icon="settings"
              title="Belum ada edisi dipilih"
              description="Pilih edisi aktif pada header untuk mengelola tahap seleksi."
            />
          </div>
        </AdminCard>
      </AdminPage>
    );
  }

  // Load stages in linear order
  const stages = await database
    .select()
    .from(selectionStages)
    .where(eq(selectionStages.editionId, currentEdition.id))
    .orderBy(asc(selectionStages.displayOrder), asc(selectionStages.id));

  // Load entries stats per stage
  const stageEntries = await database
    .select({
      stageId: participantStageEntries.stageId,
      decision: participantStageEntries.decision,
      categoryCode: categories.code,
    })
    .from(participantStageEntries)
    .innerJoin(selectionStages, eq(selectionStages.id, participantStageEntries.stageId))
    .innerJoin(participants, eq(participants.id, participantStageEntries.participantId))
    .innerJoin(categories, eq(categories.id, participants.categoryId))
    .where(eq(selectionStages.editionId, currentEdition.id));

  // Aggregate stats per stageId
  const statsMap = new Map<string, { total: number; pending: number; advanced: number; eliminated: number; advancedByCategory: StageCategoryTargets; totalByCategory: StageCategoryTargets }>();
  for (const entry of stageEntries) {
    const stat = statsMap.get(entry.stageId) ?? {
      total: 0,
      pending: 0,
      advanced: 0,
      eliminated: 0,
      advancedByCategory: { JD: 0, MD: 0, JR: 0, MR: 0 },
      totalByCategory: { JD: 0, MD: 0, JR: 0, MR: 0 },
    };
    stat.total += 1;
    stat.totalByCategory[parseCategory(entry.categoryCode)] += 1;
    if (entry.decision === "pending") stat.pending += 1;
    else if (entry.decision === "advanced") {
      stat.advanced += 1;
      stat.advancedByCategory[parseCategory(entry.categoryCode)] += 1;
    }
    else if (entry.decision === "eliminated") stat.eliminated += 1;
    statsMap.set(entry.stageId, stat);
  }

  const stageItems: StageListItem[] = stages.map((stage) => {
    const stat = statsMap.get(stage.id) ?? {
      total: 0,
      pending: 0,
      advanced: 0,
      eliminated: 0,
      advancedByCategory: { JD: 0, MD: 0, JR: 0, MR: 0 },
      totalByCategory: { JD: 0, MD: 0, JR: 0, MR: 0 },
    };
    const targetValues = [stage.targetJDCount, stage.targetMDCount, stage.targetJRCount, stage.targetMRCount];
    const legacyTargets = targetValues.every((value) => value === null);
    if (!legacyTargets && targetValues.some((value) => value === null)) throw new Error("Target kategori tahap tidak lengkap");
    const categoryTargets = legacyTargets
      ? null
      : Object.fromEntries(categoryValues.map((code, index) => [code, targetValues[index]!])) as StageCategoryTargets;
    return {
      id: stage.id,
      editionId: stage.editionId,
      name: stage.name,
      slug: stage.slug,
      displayOrder: stage.displayOrder,
      targetParticipantCount: stage.targetParticipantCount,
      categoryTargets,
      lifecycle: stage.lifecycle,
      finalStage: stage.finalStage,
      version: stage.version,
      stats: stat,
      hasEntries: stat.total > 0,
    };
  });

  return (
    <AdminPage
      eyebrow="Peserta"
      title="Tahap seleksi"
      action={
        <AdminLinkButton href="/admin/content/participants" variant="secondary">
          <ArrowLeft className="size-4" />
          Kembali ke peserta
        </AdminLinkButton>
      }
    >
      <StagesListClient
        key={`${currentEdition.id}:${stageItems.map((stage) => `${stage.id}:${stage.version}`).join(",")}`}
        initialStages={stageItems}
        canEdit={canEdit}
      />
    </AdminPage>
  );
}
