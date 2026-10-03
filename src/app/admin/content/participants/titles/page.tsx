import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";

import { AdminCard, AdminEmptyState, AdminLinkButton, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import {
  categories,
  editionTitles,
  participantTitleAssignments,
  participants,
  selectionStages,
} from "@/server/db/schema";
import { TitleWorkspace, type FinalistItem, type TitleItem } from "./title-workspace";

export const metadata = { title: "Gelar Pasanggiri" };

export default async function ParticipantTitlesPage() {
  const { effectivePermissions } = await requirePermission("content.view");
  const canEdit = effectivePermissions.has("participants.manage");
  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    return (
      <AdminPage eyebrow="Peserta" title="Gelar Pasanggiri">
        <AdminCard padding="none">
          <AdminEmptyState icon="award" title="Belum ada edisi dipilih" description="Pilih edisi pada header." />
        </AdminCard>
      </AdminPage>
    );
  }

  const [finalStage] = await database
    .select({ id: selectionStages.id, name: selectionStages.name })
    .from(selectionStages)
    .where(and(eq(selectionStages.editionId, currentEdition.id), eq(selectionStages.finalStage, true)))
    .limit(1);

  const titleRows = await database
    .select()
    .from(editionTitles)
    .where(eq(editionTitles.editionId, currentEdition.id))
    .orderBy(asc(editionTitles.displayOrder), asc(editionTitles.id));

  const assignmentRows = await database
    .select({ titleId: participantTitleAssignments.editionTitleId, participantId: participantTitleAssignments.participantId })
    .from(participantTitleAssignments)
    .innerJoin(editionTitles, eq(editionTitles.id, participantTitleAssignments.editionTitleId))
    .where(eq(editionTitles.editionId, currentEdition.id));

  const finalistRows: FinalistItem[] = finalStage
    ? await database
        .select({ id: participants.id, number: participants.number, name: participants.name, categoryCode: categories.code })
        .from(participants)
        .innerJoin(categories, eq(categories.id, participants.categoryId))
        .where(and(eq(participants.editionId, currentEdition.id), eq(participants.currentStageId, finalStage.id)))
        .orderBy(asc(categories.displayOrder), asc(participants.number), asc(participants.name))
    : [];

  const titleItems: TitleItem[] = titleRows.map((title) => ({
    id: title.id,
    name: title.name,
    description: title.description,
    capacity: title.capacity,
    displayOrder: title.displayOrder,
    active: title.active,
    version: title.version,
    participantIds: assignmentRows.filter((assignment) => assignment.titleId === title.id).map((assignment) => assignment.participantId),
  }));
  const participantsWithTitle = new Set(assignmentRows.map((assignment) => assignment.participantId));

  return (
    <AdminPage
      eyebrow="Peserta"
      title="Gelar Pasanggiri"
      action={<AdminLinkButton href="/admin/content/participants" variant="secondary"><ArrowLeft className="size-4" />Kembali ke peserta</AdminLinkButton>}
    >
      <TitleWorkspace
        key={`${currentEdition.id}:${titleItems.map((title) => `${title.id}:${title.version}`).join(",")}`}
        finalStage={finalStage ?? null}
        finalists={finalistRows}
        initialTitles={titleItems}
        finalistsWithoutTitle={finalistRows.filter((participant) => !participantsWithTitle.has(participant.id)).length}
        canEdit={canEdit}
      />
    </AdminPage>
  );
}
