import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { connection } from 'next/server';
import { cache } from 'react';

import { database } from '@/server/db/client';
import {
  categories,
  editions,
  mediaAssets,
  participantAchievements,
  participantMedia,
  participantStageEntries,
  participants,
  parseCategory,
  selectionStages,
  siteAssetBindings,
  type Category,
} from '@/server/db/schema';

export type PublicParticipantKind = 'semifinalis' | 'finalis';

export type PublicEditionParticipant = {
  id: string;
  number: number;
  name: string;
  slug: string;
  categoryCode: Category;
  categoryName: string;
  categorySlug: string;
  editionYear: number;
  bio: string;
  imageUrl: string | null;
  qrImageUrl: string | null;
  profileVideoUrl: string | null;
  profileVideoMimeType: string | null;
  paymentUrl: string | null;
  achievements: string[];
};

export type PublicParticipantCategory = {
  name: string;
  slug: string;
  code: Category;
  editionYear: number;
  posterUrl: string | null;
  videoUrl: string | null;
  videoMimeType: string | null;
  participants: PublicEditionParticipant[];
};

function toRemoteUrl(url: string | null | undefined) {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

export const getPublicParticipantCategory = cache(async (
  categorySlug: string,
  kind: PublicParticipantKind,
): Promise<PublicParticipantCategory | null> => {
  await connection();
  const [resolvedEdition] = await database
    .select({ id: editions.id, year: editions.year })
    .from(editions)
    .where(eq(editions.lifecycle, 'active'))
    .orderBy(desc(editions.year))
    .limit(1);
  if (!resolvedEdition) return null;

  const [category] = await database
    .select({ id: categories.id, code: categories.code, slug: categories.slug, label: categories.label })
    .from(categories)
    .where(and(
      eq(categories.editionId, resolvedEdition.id),
      eq(categories.slug, categorySlug),
      eq(categories.active, true),
  ))
    .limit(1);
  if (!category) return null;

  const categoryCode = parseCategory(category.code);
  const posterSlot = `category.${categoryCode.toLowerCase()}.poster`;
  const videoSlot = `category.${categoryCode.toLowerCase()}.video`;
  const categoryAssets = await database
    .select({ slotKey: siteAssetBindings.slotKey, url: mediaAssets.url, mimeType: mediaAssets.mimeType })
    .from(siteAssetBindings)
    .innerJoin(mediaAssets, eq(siteAssetBindings.mediaId, mediaAssets.id))
    .where(and(
      eq(siteAssetBindings.editionId, resolvedEdition.id),
      inArray(siteAssetBindings.slotKey, [posterSlot, videoSlot]),
      eq(mediaAssets.lifecycle, 'ready'),
    ));
  const poster = categoryAssets.find((asset) => asset.slotKey === posterSlot && asset.mimeType.startsWith('image/'));
  const video = categoryAssets.find((asset) => asset.slotKey === videoSlot && ['video/mp4', 'video/webm'].includes(asset.mimeType));
  const publicCategory: PublicParticipantCategory = {
    name: category.label,
    slug: category.slug,
    code: categoryCode,
    editionYear: resolvedEdition.year,
    posterUrl: toRemoteUrl(poster?.url),
    videoUrl: toRemoteUrl(video?.url),
    videoMimeType: video?.mimeType ?? null,
    participants: [],
  };

  const stages = await database
    .select({ id: selectionStages.id, finalStage: selectionStages.finalStage, lifecycle: selectionStages.lifecycle })
    .from(selectionStages)
    .where(eq(selectionStages.editionId, resolvedEdition.id))
    .orderBy(asc(selectionStages.displayOrder), asc(selectionStages.id));
  const finalIndex = stages.findIndex((stage) => stage.finalStage);
  const targetStage = kind === 'finalis'
    ? stages[finalIndex]
    : finalIndex > 0 ? stages[finalIndex - 1] : undefined;
  if (!targetStage || targetStage.lifecycle === 'draft') return publicCategory;

  const rows = await database
    .select({
      participant: participants,
      stageNumber: participantStageEntries.number,
      categoryCode: categories.code,
      categoryName: categories.label,
      categorySlug: categories.slug,
    })
    .from(participantStageEntries)
    .innerJoin(participants, eq(participantStageEntries.participantId, participants.id))
    .innerJoin(categories, eq(participants.categoryId, categories.id))
    .where(and(
      eq(participantStageEntries.stageId, targetStage.id),
      eq(participants.editionId, resolvedEdition.id),
      eq(participants.categoryId, category.id),
      eq(participants.active, true),
      eq(categories.active, true),
    ))
    .orderBy(
      asc(sql`coalesce(${participantStageEntries.displayOrder}, ${participants.displayOrder})`),
      asc(sql`coalesce(${participantStageEntries.number}, ${participants.number})`),
      asc(participants.name),
    );
  if (!rows.length) return publicCategory;

  const participantIds = rows.map(({ participant }) => participant.id);
  const mediaIds = [...new Set(rows.flatMap(({ participant }) => [participant.portraitMediaId, participant.qrisMediaId]).filter((id): id is string => Boolean(id)))];
  const [mediaRows, achievementRows, videoRows] = await Promise.all([
    mediaIds.length
      ? database.select({ id: mediaAssets.id, url: mediaAssets.url, mimeType: mediaAssets.mimeType }).from(mediaAssets).where(and(inArray(mediaAssets.id, mediaIds), eq(mediaAssets.lifecycle, 'ready')))
      : Promise.resolve([]),
    database
      .select({ participantId: participantAchievements.participantId, text: participantAchievements.text })
      .from(participantAchievements)
      .where(inArray(participantAchievements.participantId, participantIds))
      .orderBy(asc(participantAchievements.displayOrder), asc(participantAchievements.text)),
    database
      .select({ participantId: participantMedia.participantId, url: mediaAssets.url, mimeType: mediaAssets.mimeType })
      .from(participantMedia)
      .innerJoin(mediaAssets, eq(participantMedia.mediaId, mediaAssets.id))
      .where(and(
        inArray(participantMedia.participantId, participantIds),
        eq(participantMedia.role, 'profile_video'),
        eq(participantMedia.active, true),
        eq(mediaAssets.lifecycle, 'ready'),
      ))
      .orderBy(asc(participantMedia.displayOrder), asc(participantMedia.id)),
  ]);

  const mediaById = new Map(mediaRows
    .filter((media) => media.mimeType.startsWith('image/'))
    .map((media) => [media.id, media.url]));
  const videosByParticipant = new Map<string, { url: string; mimeType: string }>();
  for (const video of videoRows) {
    if (!videosByParticipant.has(video.participantId) && ['video/mp4', 'video/webm'].includes(video.mimeType)) {
      const url = toRemoteUrl(video.url);
      if (url) videosByParticipant.set(video.participantId, { url, mimeType: video.mimeType });
    }
  }
  const achievementsByParticipant = new Map<string, string[]>();
  for (const achievement of achievementRows) {
    const current = achievementsByParticipant.get(achievement.participantId) ?? [];
    current.push(achievement.text);
    achievementsByParticipant.set(achievement.participantId, current);
  }

  return {
    ...publicCategory,
    participants: rows.map(({ participant, stageNumber, categoryCode, categoryName, categorySlug: rowCategorySlug }) => ({
      id: participant.id,
      number: stageNumber ?? participant.number,
      name: participant.name,
      slug: participant.slug,
      categoryCode: parseCategory(categoryCode),
      categoryName,
      categorySlug: rowCategorySlug,
      editionYear: resolvedEdition.year,
      bio: participant.bio ?? '',
      imageUrl: toRemoteUrl(mediaById.get(participant.portraitMediaId ?? '')),
      qrImageUrl: toRemoteUrl(mediaById.get(participant.qrisMediaId ?? '')),
      profileVideoUrl: videosByParticipant.get(participant.id)?.url ?? null,
      profileVideoMimeType: videosByParticipant.get(participant.id)?.mimeType ?? null,
      paymentUrl: participant.paymentUrl,
      achievements: achievementsByParticipant.get(participant.id) ?? [],
    })),
  };
});

export const getPublicParticipantBySlug = cache(async (
  categorySlug: string,
  participantSlug: string,
  kind: PublicParticipantKind,
) => {
  const category = await getPublicParticipantCategory(categorySlug, kind);
  return category?.participants.find((participant) => participant.slug === participantSlug) ?? null;
});
