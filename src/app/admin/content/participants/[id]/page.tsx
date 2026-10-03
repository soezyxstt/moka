import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AdminBadge, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import {
  categories,
  editionTitles,
  editions,
  mediaAssets,
  participantAchievements,
  participantMedia,
  participantSocialLinks,
  participantTitleAssignments,
  participants,
  selectionStages,
} from "@/server/db/schema";
import {
  ParticipantDetailWorkspace,
  type CategoryOption,
  type ParticipantDetail,
} from "./participant-detail-workspace";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = { title: "Profil Peserta | Mojang Jajaka" };

export default async function ParticipantDetailPage(props: Props) {
  const { effectivePermissions } = await requirePermission("content.view");
  const canEdit = effectivePermissions.has("participants.manage");
  const canManageMedia = effectivePermissions.has("media.manage");
  const currentEdition = await getAdminEditionContext();
  if (!currentEdition) notFound();

  const { id } = await props.params;

  // 1. Fetch participant
  const [participantRow] = await database
    .select({
      id: participants.id,
      editionId: participants.editionId,
      categoryId: participants.categoryId,
      number: participants.number,
      name: participants.name,
      slug: participants.slug,
      currentStageId: participants.currentStageId,
      currentStageName: selectionStages.name,
      selectionStatus: participants.selectionStatus,
      bio: participants.bio,
      portraitMediaId: participants.portraitMediaId,
      qrisMediaId: participants.qrisMediaId,
      displayOrder: participants.displayOrder,
      active: participants.active,
      version: participants.version,
    })
    .from(participants)
    .leftJoin(selectionStages, eq(selectionStages.id, participants.currentStageId))
    .where(and(eq(participants.id, id), eq(participants.editionId, currentEdition.id)))
    .limit(1);

  if (!participantRow) {
    notFound();
  }

  // 2. Fetch edition and categories
  const [editionRow, categoryRows] = await Promise.all([
    database
      .select({
        id: editions.id,
        year: editions.year,
        name: editions.name,
        lifecycle: editions.lifecycle,
      })
      .from(editions)
      .where(eq(editions.id, participantRow.editionId))
      .limit(1)
      .then((rows) => rows[0]),
    database
      .select({
        id: categories.id,
        code: categories.code,
        label: categories.label,
      })
      .from(categories)
      .where(eq(categories.editionId, participantRow.editionId))
      .orderBy(asc(categories.displayOrder)),
  ]);

  if (!editionRow) {
    notFound();
  }

  const categoryOptions: CategoryOption[] = categoryRows.map((c) => ({
    id: c.id,
    code: c.code,
    label: c.label,
  }));

  const selectedCategory = categoryOptions.find((c) => c.id === participantRow.categoryId);

  // 3. Fetch related achievements, social links, and media
  const [achievementsRows, socialLinksRows, mediaRows, titleRows] = await Promise.all([
    database
      .select({
        id: participantAchievements.id,
        text: participantAchievements.text,
        displayOrder: participantAchievements.displayOrder,
      })
      .from(participantAchievements)
      .where(eq(participantAchievements.participantId, id))
      .orderBy(asc(participantAchievements.displayOrder), asc(participantAchievements.createdAt)),

    database
      .select({
        id: participantSocialLinks.id,
        platform: participantSocialLinks.platform,
        label: participantSocialLinks.label,
        url: participantSocialLinks.url,
        displayOrder: participantSocialLinks.displayOrder,
      })
      .from(participantSocialLinks)
      .where(eq(participantSocialLinks.participantId, id))
      .orderBy(asc(participantSocialLinks.displayOrder), asc(participantSocialLinks.createdAt)),

    database
      .select({
        id: participantMedia.id,
        role: participantMedia.role,
        mediaId: participantMedia.mediaId,
        caption: participantMedia.caption,
        displayOrder: participantMedia.displayOrder,
        active: participantMedia.active,
        assetId: mediaAssets.id,
        assetUrl: mediaAssets.url,
        assetFilename: mediaAssets.filename,
        assetMimeType: mediaAssets.mimeType,
        assetBytes: mediaAssets.bytes,
        assetAlt: mediaAssets.alt,
        assetDecorative: mediaAssets.decorative,
      })
      .from(participantMedia)
      .leftJoin(mediaAssets, eq(participantMedia.mediaId, mediaAssets.id))
      .where(eq(participantMedia.participantId, id))
      .orderBy(asc(participantMedia.displayOrder), asc(participantMedia.createdAt)),
    database
      .select({ id: editionTitles.id, name: editionTitles.name })
      .from(participantTitleAssignments)
      .innerJoin(editionTitles, eq(editionTitles.id, participantTitleAssignments.editionTitleId))
      .where(and(
        eq(participantTitleAssignments.participantId, id),
        eq(editionTitles.editionId, currentEdition.id),
      ))
      .orderBy(asc(editionTitles.displayOrder), asc(editionTitles.name)),
  ]);

  // 4. Fetch joined portrait and QRIS assets
  let portraitAsset = null;
  if (participantRow.portraitMediaId) {
    const [asset] = await database
      .select({
        id: mediaAssets.id,
        url: mediaAssets.url,
        filename: mediaAssets.filename,
        mimeType: mediaAssets.mimeType,
        bytes: mediaAssets.bytes,
        alt: mediaAssets.alt,
        decorative: mediaAssets.decorative,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, participantRow.portraitMediaId))
      .limit(1);
    if (asset) portraitAsset = asset;
  }

  let qrisAsset = null;
  if (participantRow.qrisMediaId) {
    const [asset] = await database
      .select({
        id: mediaAssets.id,
        url: mediaAssets.url,
        filename: mediaAssets.filename,
        mimeType: mediaAssets.mimeType,
        bytes: mediaAssets.bytes,
        alt: mediaAssets.alt,
        decorative: mediaAssets.decorative,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, participantRow.qrisMediaId))
      .limit(1);
    if (asset) qrisAsset = asset;
  }

  const participantDetail: ParticipantDetail = {
    id: participantRow.id,
    editionId: participantRow.editionId,
    categoryId: participantRow.categoryId,
    categoryCode: selectedCategory?.code ?? "",
    categoryLabel: selectedCategory?.label ?? "",
    number: participantRow.number,
    name: participantRow.name,
    slug: participantRow.slug,
    currentStageId: participantRow.currentStageId,
    currentStageName: participantRow.currentStageName,
    selectionStatus: participantRow.selectionStatus,
    bio: participantRow.bio,
    portraitMediaId: participantRow.portraitMediaId,
    portraitAsset,
    qrisMediaId: participantRow.qrisMediaId,
    qrisAsset,
    displayOrder: participantRow.displayOrder,
    active: participantRow.active,
    version: participantRow.version,
    achievements: achievementsRows,
    socialLinks: socialLinksRows,
    titles: titleRows,
    media: mediaRows.map((m) => ({
      id: m.id,
      role: m.role,
      mediaId: m.mediaId,
      caption: m.caption,
      displayOrder: m.displayOrder,
      active: m.active,
      asset: m.assetId
        ? {
            id: m.assetId,
            url: m.assetUrl!,
            filename: m.assetFilename!,
            mimeType: m.assetMimeType!,
            bytes: m.assetBytes!,
            alt: m.assetAlt,
            decorative: m.assetDecorative ?? false,
          }
        : null,
    })),
  };

  return (
    <AdminPage
      eyebrow="Peserta"
      title={`Profil Peserta #${String(participantDetail.number).padStart(2, "0")}`}
      action={<AdminBadge value={editionRow.lifecycle} />}
    >
      <ParticipantDetailWorkspace
        edition={{
          id: editionRow.id,
          year: editionRow.year,
          name: editionRow.name,
          lifecycle: editionRow.lifecycle,
        }}
        categories={categoryOptions}
        participant={participantDetail}
        canEdit={canEdit}
        canManageMedia={canManageMedia}
      />
    </AdminPage>
  );
}
