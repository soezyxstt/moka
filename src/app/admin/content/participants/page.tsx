import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";

import { AdminBadge, AdminButton, AdminCard, AdminEmptyState, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import {
  categories,
  mediaAssets,
  participantAchievements,
  participantMedia,
  participantSocialLinks,
  participantStageEntries,
  participantTitleAssignments,
  participants,
  selectionStages,
} from "@/server/db/schema";
import { ParticipantDirectory, type DirectoryParticipant } from "./participant-directory";
import { repair2025StageNumbersAction } from "./selection-actions";

export const metadata = { title: "Mojang Jajaka" };

export default async function ParticipantsPage() {
  const { effectivePermissions } = await requirePermission("content.view");
  const canEdit = effectivePermissions.has("participants.manage");

  const currentEdition = await getAdminEditionContext();

  if (!currentEdition) {
    return (
      <AdminPage
        eyebrow="Peserta"
        title="Mojang Jajaka"
      >
        <AdminCard padding="none">
          <div className="p-8">
            <AdminEmptyState
              icon="users"
              title="Belum ada edisi dipilih"
              description="Pilih edisi di bagian atas untuk melihat peserta."
            />
          </div>
        </AdminCard>
      </AdminPage>
    );
  }

  // Fetch categories of the current edition
  const categoryRows = await database
    .select({
      id: categories.id,
      code: categories.code,
      label: categories.label,
    })
    .from(categories)
    .where(eq(categories.editionId, currentEdition.id))
    .orderBy(asc(categories.displayOrder));

  const stageRows = await database
    .select({ id: selectionStages.id, name: selectionStages.name })
    .from(selectionStages)
    .where(eq(selectionStages.editionId, currentEdition.id))
    .orderBy(asc(selectionStages.displayOrder));

  const incompleteStageNumbers = currentEdition.year === 2025 && canEdit
    ? await database.select({ id: participantStageEntries.id })
      .from(participantStageEntries)
      .innerJoin(participants, eq(participantStageEntries.participantId, participants.id))
      .where(and(
        eq(participants.editionId, currentEdition.id),
        or(isNull(participantStageEntries.number), isNull(participantStageEntries.displayOrder)),
      ))
      .limit(1)
    : [];

  // Fetch participants with joined category and selectionStages
  const participantRows = await database
    .select({
      id: participants.id,
      categoryId: participants.categoryId,
      categoryCode: categories.code,
      categoryLabel: categories.label,
      number: participants.number,
      name: participants.name,
      currentStageId: participants.currentStageId,
      currentStageName: selectionStages.name,
      selectionStatus: participants.selectionStatus,
      portraitMediaId: participants.portraitMediaId,
      qrisMediaId: participants.qrisMediaId,
      active: participants.active,
      version: participants.version,
    })
    .from(participants)
    .innerJoin(categories, eq(participants.categoryId, categories.id))
    .leftJoin(selectionStages, eq(participants.currentStageId, selectionStages.id))
    .where(eq(participants.editionId, currentEdition.id))
    .orderBy(asc(participants.displayOrder), asc(participants.number));

  const participantIds = participantRows.map((p) => p.id);

  // Fetch media assets for portraits
  const portraitMediaIds = participantRows.map((p) => p.portraitMediaId).filter(Boolean) as string[];
  const mediaMap = new Map<string, { url: string; alt: string | null }>();
  if (portraitMediaIds.length > 0) {
    const assets = await database
      .select({ id: mediaAssets.id, url: mediaAssets.url, alt: mediaAssets.alt })
      .from(mediaAssets)
      .where(inArray(mediaAssets.id, portraitMediaIds));
    for (const a of assets) {
      mediaMap.set(a.id, { url: a.url, alt: a.alt });
    }
  }

  // Fetch count of achievements, social links, and media per participant
  const achievementsCounts = new Map<string, number>();
  const socialLinksCounts = new Map<string, number>();
  const mediaCounts = new Map<string, number>();
  const titleCounts = new Map<string, number>();
  const closeupMap = new Map<string, boolean>();

  if (participantIds.length > 0) {
    const [achievements, socialLinks, mediaItems, titleAssignments] = await Promise.all([
      database
        .select({ id: participantAchievements.id, participantId: participantAchievements.participantId })
        .from(participantAchievements)
        .where(inArray(participantAchievements.participantId, participantIds)),
      database
        .select({ id: participantSocialLinks.id, participantId: participantSocialLinks.participantId })
        .from(participantSocialLinks)
        .where(inArray(participantSocialLinks.participantId, participantIds)),
      database
        .select({ id: participantMedia.id, participantId: participantMedia.participantId, role: participantMedia.role })
        .from(participantMedia)
        .where(inArray(participantMedia.participantId, participantIds)),
      database
        .select({ participantId: participantTitleAssignments.participantId })
        .from(participantTitleAssignments)
        .where(inArray(participantTitleAssignments.participantId, participantIds)),
    ]);

    for (const a of achievements) {
      achievementsCounts.set(a.participantId, (achievementsCounts.get(a.participantId) ?? 0) + 1);
    }
    for (const s of socialLinks) {
      socialLinksCounts.set(s.participantId, (socialLinksCounts.get(s.participantId) ?? 0) + 1);
    }
    for (const m of mediaItems) {
      mediaCounts.set(m.participantId, (mediaCounts.get(m.participantId) ?? 0) + 1);
      if (m.role === "closeup") {
        closeupMap.set(m.participantId, true);
      }
    }
    for (const assignment of titleAssignments) {
      titleCounts.set(assignment.participantId, (titleCounts.get(assignment.participantId) ?? 0) + 1);
    }
  }

  const initialParticipants: DirectoryParticipant[] = participantRows.map((row) => {
    const portraitAsset = row.portraitMediaId ? mediaMap.get(row.portraitMediaId) : null;
    const hasCloseup = closeupMap.get(row.id) ?? Boolean(row.portraitMediaId);

    return {
      id: row.id,
      categoryId: row.categoryId,
      categoryCode: row.categoryCode,
      categoryLabel: row.categoryLabel,
      number: row.number,
      name: row.name,
      currentStageId: row.currentStageId,
      currentStageName: row.currentStageName,
      selectionStatus: row.selectionStatus,
      portraitUrl: portraitAsset?.url ?? null,
      portraitAlt: portraitAsset?.alt ?? null,
      qrisMediaId: row.qrisMediaId,
      active: row.active,
      version: row.version,
      achievementsCount: achievementsCounts.get(row.id) ?? 0,
      socialLinksCount: socialLinksCounts.get(row.id) ?? 0,
      mediaCount: mediaCounts.get(row.id) ?? 0,
      titleCount: titleCounts.get(row.id) ?? 0,
      hasCloseup,
    };
  });

  return (
    <AdminPage
      eyebrow="Peserta"
      title="Mojang Jajaka"
      action={<AdminBadge value={currentEdition.lifecycle} />}
    >
      {incompleteStageNumbers.length ? (
        <AdminCard className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Nomor dan urutan semifinalis belum lengkap.</p>
          <form action={repair2025StageNumbersAction}>
            <AdminButton type="submit" variant="secondary">Perbaiki nomor tahap 2025</AdminButton>
          </form>
        </AdminCard>
      ) : null}
      <ParticipantDirectory
        key={`${currentEdition.id}:${initialParticipants.map((participant) => `${participant.id}:${participant.version}`).join(",")}`}
        categories={categoryRows}
        stages={stageRows}
        initialParticipants={initialParticipants}
        canEdit={canEdit}
      />
    </AdminPage>
  );
}
