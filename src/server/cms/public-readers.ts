import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { connection } from 'next/server';
import { cache } from 'react';
import { getSlotsByGroup } from '@/server/cms/site-asset-manifest';
import { parseCategory, categories as dbCategories, editions, editionPrograms, events, galleries, galleryItems, mediaAssets, newsArticles, organizationMemberships, organizationPeriods, organizationUnits, pageSections, participantAchievements, participantMedia, participants, people, siteAssetBindings, sponsors as dbSponsors, voteDailyTallies, votingCampaignParticipants, votingCampaigns } from '@/server/db/schema';
import { database } from '@/server/db/client';
import { getFinalistsWithIncome } from '@/server/db/queries';

export type PublicParticipant = {
  id: string;
  number: number;
  name: string;
  slug: string;
  bio: string;
  imageUrl: string;
  paymentUrl: string | null;
  achievements: string[];
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  abrev: ReturnType<typeof parseCategory>;
  list: PublicParticipant[];
  finalist: PublicParticipant[];
};

export type PublicEvent = {
  slug: string;
  label: string;
  desc: string;
  heroImageUrl: string | null;
  images: string[];
};

export type PublicPageSection = {
  title: string | null;
  eyebrow: string | null;
  body: string | null;
  presentationJson?: string;
  actionLabel?: string | null;
  actionHref?: string | null;
};

export type PublicSiteAsset = {
  url: string;
  alt: string | null;
  mimeType: string;
};

export type PublicGalleryAlbum = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  ownerType: 'standalone' | 'event';
  coverUrl: string | null;
  coverAlt: string | null;
  items: {
    id: string;
    imageUrl: string | null;
    imageAlt: string | null;
    youtubeId: string | null;
    caption: string | null;
  }[];
};

export type PublicHomeContent = {
  sections: Record<string, PublicPageSection>;
  assets: Record<string, PublicSiteAsset>;
  programs: { title: string; description: string | null }[];
};

export type PublicSponsor = {
  name: string;
  src: string;
};

export type PublicNewsItem = {
  slug: string;
  isInternal: boolean;
  title: string;
  description: string;
  imageUrl: string | null;
  date: Date;
  link: string;
  type: 'file' | 'link';
};

export type PublicNewsArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  bodyJson: string | null;
  publishedAt: Date;
  sourceUrl: string | null;
  kind: string;
  coverUrl: string | null;
  coverAlt: string | null;
};

type PublicPerson = {
  imageUrl: string | null;
  name: string;
  position: string;
  gender?: 'L' | 'P';
};

export type PublicAboutContent = {
  vision: string | null;
  mission: string[];
  sections: Record<string, PublicPageSection>;
  assets: Record<string, PublicSiteAsset>;
  galleries: PublicGalleryAlbum[];
  organizationPeriodLabel: string | null;
  pengurus: PublicPerson[];
  history: PublicOrganizationPeriod[];
};

export type PublicOrganizationPeriod = {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  vision: string | null;
  mission: string[];
  members: (PublicPerson & { id: string })[];
};

export type PublicVotingCampaign = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  pricePerPoint: number;
  resultVisibility: string;
};

export type PublicVotingCandidate = {
  id: string;
  number: number;
  name: string;
  slug: string;
  bio: string;
  imageUrl: string | null;
  qrImageUrl: string | null;
  profileVideoUrl: string | null;
  achievements: string[];
};

export type PublicVotingCategory = {
  id: string;
  name: string;
  slug: string;
  code: ReturnType<typeof parseCategory>;
  editionYear: number;
  campaign: PublicVotingCampaign | null;
  poster: PublicSiteAsset | null;
  video: PublicSiteAsset | null;
  candidates: PublicVotingCandidate[];
};

export type PublicVotingResults = {
  categoryName: string;
  categorySlug: string;
  editionYear: number;
  campaign: PublicVotingCampaign | null;
  visible: boolean;
  totalAmount: number;
  candidates: { id: string; name: string; amount: number; percentage: number }[];
};

export type PublicEdition = {
  id: string;
  year: number;
  slug: string;
  name: string;
  lifecycle: string;
  organizationPeriodId: string | null;
  logoUrl: string | null;
  logoAlt: string | null;
  slogan: string | null;
};

export const FALLBACK_GALLERY_VIDEO_IDS = [
  '5w0ORZ0XUkE',
  'PEx2wVwReX4',
  'Str4439U-OM',
  'f6rmvU8o6CI',
  'I-R_T7cULcI',
  '05GxYCSbhg4',
  'qG8qy-QUxKY',
  'pWTQEm_gCaY',
  'S4NanSPqf00',
] as const;

async function getPublishedPageSections(editionId: string, pageKey: string, sectionKeys: string[]) {
  const rows = await database
    .select({ sectionKey: pageSections.sectionKey, title: pageSections.title, eyebrow: pageSections.eyebrow, body: pageSections.body, presentationJson: pageSections.presentationJson })
    .from(pageSections)
    .where(and(
      eq(pageSections.editionId, editionId),
      eq(pageSections.pageKey, pageKey),
      eq(pageSections.status, 'published'),
      inArray(pageSections.sectionKey, sectionKeys),
    ));

  return Object.fromEntries(rows.flatMap(({ sectionKey, title, eyebrow, body, presentationJson }) => {
    const action = pageKey === 'home' && sectionKey === 'ajakan' ? parsePublicActionPresentation(presentationJson) : null;
    const hasCopy = [title, eyebrow, body].some((value) => value?.trim());
    const hasAction = Boolean(action?.actionLabel && action.actionHref);
    return hasCopy || hasAction
      ? [[sectionKey, { title, eyebrow, body, presentationJson, ...(action ?? {}) }]]
      : [];
  }));
}

function isPublicActionHref(href: string) {
  if (!href || /[\\\u0000-\u001f\u007f]/.test(href)) return false;
  if (href.startsWith('/') && !href.startsWith('//')) return true;
  try {
    const url = new URL(href);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function parsePublicActionPresentation(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { actionLabel: null, actionHref: null };
    const fields = parsed as Record<string, unknown>;
    const actionLabel = typeof fields.actionLabel === 'string' ? fields.actionLabel.trim() : '';
    const actionHref = typeof fields.actionHref === 'string' ? fields.actionHref.trim() : '';
    if (!actionLabel || actionLabel.length > 120 || !isPublicActionHref(actionHref) || actionHref.length > 2_048) return { actionLabel: null, actionHref: null };
    return { actionLabel, actionHref };
  } catch {
    return { actionLabel: null, actionHref: null };
  }
}

async function getPublishedSiteAssets(editionId: string, group: 'home' | 'about' | 'category') {
  const slotKeys = getSlotsByGroup(group).map((slot) => slot.slotKey);
  const rows = await database
    .select({ slotKey: siteAssetBindings.slotKey, url: mediaAssets.url, alt: siteAssetBindings.altOverride, assetAlt: mediaAssets.alt, mimeType: mediaAssets.mimeType })
    .from(siteAssetBindings)
    .innerJoin(mediaAssets, eq(siteAssetBindings.mediaId, mediaAssets.id))
    .where(and(
      eq(siteAssetBindings.editionId, editionId),
      eq(mediaAssets.lifecycle, 'ready'),
      inArray(siteAssetBindings.slotKey, slotKeys),
    ));

  return Object.fromEntries(rows.flatMap(({ slotKey, url, alt, assetAlt, mimeType }) => {
    const remoteUrl = toRemoteUrl(url);
    return remoteUrl ? [[slotKey, { url: remoteUrl, alt: alt?.trim() || assetAlt, mimeType }]] : [];
  }));
}

export async function getPublicHomeContent(): Promise<PublicHomeContent> {
  const editionId = await getCurrentEditionId();
  const [sections, assets, programs] = await Promise.all([
    getPublishedPageSections(editionId, 'home', ['hero', 'program', 'berita', 'ajakan']),
    getPublishedSiteAssets(editionId, 'home'),
    database
      .select({ title: editionPrograms.title, description: editionPrograms.description })
      .from(editionPrograms)
      .where(and(eq(editionPrograms.editionId, editionId), eq(editionPrograms.active, true)))
      .orderBy(asc(editionPrograms.displayOrder), asc(editionPrograms.title)),
  ]);

  return { sections, assets, programs };
}

export const getCurrentEdition = cache(async (): Promise<PublicEdition> => {
  await connection();

  const editionSelection = {
    id: editions.id,
    year: editions.year,
    slug: editions.slug,
    name: editions.name,
    lifecycle: editions.lifecycle,
    organizationPeriodId: editions.organizationPeriodId,
    logoUrl: mediaAssets.url,
    logoAlt: mediaAssets.alt,
    logoLifecycle: mediaAssets.lifecycle,
    slogan: editions.slogan,
  };
  const [activeEdition] = await database
    .select(editionSelection)
    .from(editions)
    .leftJoin(mediaAssets, eq(editions.logoMediaId, mediaAssets.id))
    .where(eq(editions.lifecycle, 'active'))
    .orderBy(desc(editions.year))
    .limit(1);

  const toPublicEdition = (edition: typeof activeEdition): PublicEdition | null => edition ? ({
    id: edition.id,
    year: edition.year,
    slug: edition.slug,
    name: edition.name,
    lifecycle: edition.lifecycle,
    organizationPeriodId: edition.organizationPeriodId,
    logoUrl: edition.logoLifecycle === 'ready' ? toRemoteUrl(edition.logoUrl) : null,
    logoAlt: edition.logoLifecycle === 'ready' ? edition.logoAlt : null,
    slogan: edition.slogan?.trim() || null,
  }) : null;

  if (!activeEdition) throw new Error('No active Turso edition is configured');
  return toPublicEdition(activeEdition)!;
});

async function getCurrentEditionId() {
  return (await getCurrentEdition()).id;
}

function toRemoteUrl(url: string | null | undefined) {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

async function getPublicParticipants(editionId: string) {
  const rows = await database
    .select({
      participant: participants,
      categoryCode: dbCategories.code,
      categorySlug: dbCategories.slug,
      categoryName: dbCategories.label,
      categoryOrder: dbCategories.displayOrder,
      imageUrl: mediaAssets.url,
    })
    .from(participants)
    .innerJoin(dbCategories, eq(participants.categoryId, dbCategories.id))
    .leftJoin(mediaAssets, eq(participants.portraitMediaId, mediaAssets.id))
    .where(
      and(
        eq(participants.editionId, editionId),
        eq(participants.active, true),
        eq(dbCategories.active, true),
        inArray(participants.stage, ['semifinalis', 'finalis']),
      ),
    )
    .orderBy(
      asc(dbCategories.displayOrder),
      asc(participants.stage),
      asc(participants.displayOrder),
      asc(participants.number),
      asc(participants.name),
    );

  const participantIds = rows.map(({ participant }) => participant.id);
  const achievementRows = participantIds.length
    ? await database
      .select({
        participantId: participantAchievements.participantId,
        text: participantAchievements.text,
      })
      .from(participantAchievements)
      .where(inArray(participantAchievements.participantId, participantIds))
      .orderBy(asc(participantAchievements.displayOrder), asc(participantAchievements.text))
    : [];

  const achievementsByParticipant = new Map<string, string[]>();
  for (const achievement of achievementRows) {
    const current = achievementsByParticipant.get(achievement.participantId) ?? [];
    current.push(achievement.text);
    achievementsByParticipant.set(achievement.participantId, current);
  }

  return rows.map(({ participant, categoryCode, categorySlug, categoryName, categoryOrder, imageUrl }) => {
    const remoteImageUrl = toRemoteUrl(imageUrl);
    if (!remoteImageUrl) {
      throw new Error(`Turso participant ${participant.id} has no remote portrait`);
    }

    return {
      participant: {
        id: participant.id,
        number: participant.number,
        name: participant.name,
        slug: participant.slug,
        bio: participant.bio ?? '',
        imageUrl: remoteImageUrl,
        paymentUrl: participant.paymentUrl,
        achievements: achievementsByParticipant.get(participant.id) ?? [],
      } satisfies PublicParticipant,
      categoryCode: parseCategory(categoryCode),
      categorySlug,
      categoryName,
      categoryOrder,
      stage: participant.stage,
    };
  });
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  const editionId = await getCurrentEditionId();
  const rows = await getPublicParticipants(editionId);
  const categoryRows = await database
    .select({
      id: dbCategories.id,
      code: dbCategories.code,
      slug: dbCategories.slug,
      label: dbCategories.label,
    })
    .from(dbCategories)
    .where(and(eq(dbCategories.editionId, editionId), eq(dbCategories.active, true)))
    .orderBy(asc(dbCategories.displayOrder), asc(dbCategories.label));

  return categoryRows.map((category) => ({
    id: category.id,
    name: category.label,
    slug: category.slug,
    abrev: parseCategory(category.code),
    list: rows
      .filter((row) => row.categorySlug === category.slug && row.stage === 'semifinalis')
      .map((row) => row.participant),
    finalist: rows
      .filter((row) => row.categorySlug === category.slug && row.stage === 'finalis')
      .map((row) => row.participant),
  }));
}

export async function getPublicCategoryBySlug(slug: string) {
  const category = (await getPublicCategories()).find((item) => item.slug === slug);
  if (!category) {
    throw new Error(`Turso category not found: ${slug}`);
  }
  return category;
}

export async function getPublicNavigation() {
  const edition = await getCurrentEdition();
  const [categories, events, resultCampaign, aboutSections] = await Promise.all([
    database
      .select({ slug: dbCategories.slug, name: dbCategories.label })
      .from(dbCategories)
      .where(and(eq(dbCategories.editionId, edition.id), eq(dbCategories.active, true)))
      .orderBy(asc(dbCategories.displayOrder), asc(dbCategories.label)),
    getPublicEvents(),
    database
      .select({ resultVisibility: votingCampaigns.resultVisibility })
      .from(votingCampaigns)
      .where(and(
        eq(votingCampaigns.editionId, edition.id),
        inArray(votingCampaigns.status, ['active', 'closed']),
      ))
      .orderBy(desc(votingCampaigns.startsAt))
      .limit(1),
    getPublishedPageSections(edition.id, 'tentang', ['hero']),
  ]);
  return {
    categories,
    events,
    edition,
    resultsVisible: resultCampaign[0]?.resultVisibility === 'visible',
    aboutDescription: aboutSections.hero?.body?.trim() || null,
  };
}

export async function getPublicVotingCampaign(): Promise<PublicVotingCampaign | null> {
  const editionId = await getCurrentEditionId();
  const now = new Date();
  const [campaign] = await database
    .select()
    .from(votingCampaigns)
    .where(and(
      eq(votingCampaigns.editionId, editionId),
      eq(votingCampaigns.status, 'active'),
      lte(votingCampaigns.startsAt, now),
      gte(votingCampaigns.endsAt, now),
    ))
    .orderBy(desc(votingCampaigns.startsAt))
    .limit(1);
  return campaign ?? null;
}

export async function getPublicVotingCategories() {
  const edition = await getCurrentEdition();
  const categories = await database
    .select({ slug: dbCategories.slug, name: dbCategories.label })
    .from(dbCategories)
    .where(and(eq(dbCategories.editionId, edition.id), eq(dbCategories.active, true)))
    .orderBy(asc(dbCategories.displayOrder), asc(dbCategories.label));

  return { editionYear: edition.year, categories };
}

export async function getPublicVotingCategoryBySlug(slug: string): Promise<PublicVotingCategory | null> {
  const edition = await getCurrentEdition();
  const [category] = await database
    .select({ id: dbCategories.id, code: dbCategories.code, slug: dbCategories.slug, label: dbCategories.label })
    .from(dbCategories)
    .where(and(eq(dbCategories.editionId, edition.id), eq(dbCategories.slug, slug), eq(dbCategories.active, true)))
    .limit(1);
  if (!category) return null;

  const [campaign, assets] = await Promise.all([
    getPublicVotingCampaign(),
    getPublishedSiteAssets(edition.id, 'category'),
  ]);
  const prefix = `category.${category.code.toLowerCase()}`;
  const candidates = campaign
    ? await getPublicVotingCandidates(campaign.id, category.id)
    : [];

  return {
    id: category.id,
    name: category.label,
    slug: category.slug,
    code: parseCategory(category.code),
    editionYear: edition.year,
    campaign,
    poster: assets[`${prefix}.poster`]?.mimeType.startsWith('image/') ? assets[`${prefix}.poster`] : null,
    video: ['video/mp4', 'video/webm'].includes(assets[`${prefix}.video`]?.mimeType ?? '') ? assets[`${prefix}.video`] : null,
    candidates,
  };
}

async function getPublicVotingCandidates(campaignId: string, categoryId: string): Promise<PublicVotingCandidate[]> {
  const rows = await database
    .select({
      id: participants.id,
      number: participants.number,
      name: participants.name,
      slug: participants.slug,
      bio: participants.bio,
      portraitMediaId: participants.portraitMediaId,
      qrisMediaId: participants.qrisMediaId,
    })
    .from(votingCampaignParticipants)
    .innerJoin(participants, eq(votingCampaignParticipants.participantId, participants.id))
    .where(and(
      eq(votingCampaignParticipants.campaignId, campaignId),
      eq(participants.categoryId, categoryId),
    ))
    .orderBy(asc(participants.displayOrder), asc(participants.number), asc(participants.name));
  if (!rows.length) return [];

  const participantIds = rows.map((row) => row.id);
  const mediaIds = [...new Set(rows.flatMap((row) => [row.portraitMediaId, row.qrisMediaId]).filter((id): id is string => Boolean(id)))];
  const [mediaRows, achievements, videos] = await Promise.all([
    mediaIds.length
      ? database.select({ id: mediaAssets.id, url: mediaAssets.url }).from(mediaAssets).where(and(inArray(mediaAssets.id, mediaIds), eq(mediaAssets.lifecycle, 'ready')))
      : Promise.resolve([]),
    database
      .select({ participantId: participantAchievements.participantId, text: participantAchievements.text })
      .from(participantAchievements)
      .where(inArray(participantAchievements.participantId, participantIds))
      .orderBy(asc(participantAchievements.displayOrder), asc(participantAchievements.text)),
    database
      .select({ participantId: participantMedia.participantId, url: mediaAssets.url })
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

  const mediaById = new Map(mediaRows.map((row) => [row.id, row.url]));
  const achievementsByParticipant = new Map<string, string[]>();
  for (const achievement of achievements) {
    const current = achievementsByParticipant.get(achievement.participantId) ?? [];
    current.push(achievement.text);
    achievementsByParticipant.set(achievement.participantId, current);
  }
  const videosByParticipant = new Map<string, string>();
  for (const video of videos) {
    const url = toRemoteUrl(video.url);
    if (url && !videosByParticipant.has(video.participantId)) videosByParticipant.set(video.participantId, url);
  }

  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    name: row.name,
    slug: row.slug,
    bio: row.bio ?? '',
    imageUrl: toRemoteUrl(mediaById.get(row.portraitMediaId ?? '')),
    qrImageUrl: toRemoteUrl(mediaById.get(row.qrisMediaId ?? '')),
    profileVideoUrl: videosByParticipant.get(row.id) ?? null,
    achievements: achievementsByParticipant.get(row.id) ?? [],
  }));
}

export async function getPublicVotingResults(categorySlug: string): Promise<PublicVotingResults | null> {
  const edition = await getCurrentEdition();
  const [category] = await database
    .select({ id: dbCategories.id, slug: dbCategories.slug, label: dbCategories.label })
    .from(dbCategories)
    .where(and(eq(dbCategories.editionId, edition.id), eq(dbCategories.slug, categorySlug), eq(dbCategories.active, true)))
    .limit(1);
  if (!category) return null;

  const [campaign] = await database
    .select()
    .from(votingCampaigns)
    .where(and(eq(votingCampaigns.editionId, edition.id), inArray(votingCampaigns.status, ['active', 'closed'])))
    .orderBy(desc(votingCampaigns.startsAt))
    .limit(1);
  const visible = campaign?.resultVisibility === 'visible';
  if (!campaign || !visible) {
    return { categoryName: category.label, categorySlug: category.slug, editionYear: edition.year, campaign: campaign ?? null, visible: false, totalAmount: 0, candidates: [] };
  }

  const candidates = await database
    .select({ id: participants.id, name: participants.name })
    .from(votingCampaignParticipants)
    .innerJoin(participants, eq(votingCampaignParticipants.participantId, participants.id))
    .where(and(
      eq(votingCampaignParticipants.campaignId, campaign.id),
      eq(participants.categoryId, category.id),
    ))
    .orderBy(asc(participants.displayOrder), asc(participants.number), asc(participants.name));
  const tallies = candidates.length
    ? await database
      .select({ participantId: voteDailyTallies.participantId, amount: voteDailyTallies.amount })
      .from(voteDailyTallies)
      .where(and(eq(voteDailyTallies.campaignId, campaign.id), inArray(voteDailyTallies.participantId, candidates.map((row) => row.id))))
    : [];
  const amountByParticipant = new Map<string, number>();
  for (const tally of tallies) amountByParticipant.set(tally.participantId, (amountByParticipant.get(tally.participantId) ?? 0) + tally.amount);
  const totalAmount = candidates.reduce((total, candidate) => total + (amountByParticipant.get(candidate.id) ?? 0), 0);

  return {
    categoryName: category.label,
    categorySlug: category.slug,
    editionYear: edition.year,
    campaign,
    visible: true,
    totalAmount,
    candidates: candidates.map((candidate) => {
      const amount = amountByParticipant.get(candidate.id) ?? 0;
      return { ...candidate, amount, percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 10000) / 100 : 0 };
    }),
  };
}

export async function getPublicEvents(): Promise<PublicEvent[]> {
  const editionId = await getCurrentEditionId();
  const rows = await database
    .select({ slug: events.slug, label: events.label, description: events.description, heroImageUrl: mediaAssets.url, heroLifecycle: mediaAssets.lifecycle })
    .from(events)
    .leftJoin(mediaAssets, eq(events.heroMediaId, mediaAssets.id))
    .where(and(eq(events.editionId, editionId), eq(events.active, true)))
    .orderBy(asc(events.displayOrder), asc(events.label));

  return rows.map((event) => ({
    slug: event.slug,
    label: event.label,
    desc: event.description ?? '',
    heroImageUrl: event.heroLifecycle === 'ready' ? toRemoteUrl(event.heroImageUrl) : null,
    images: [],
  }));
}

export async function getPublicEventBySlug(slug: string): Promise<PublicEvent | null> {
  const editionId = await getCurrentEditionId();
  const [eventRow] = await database
    .select({ id: events.id, slug: events.slug, label: events.label, description: events.description, heroImageUrl: mediaAssets.url, heroLifecycle: mediaAssets.lifecycle })
    .from(events)
    .leftJoin(mediaAssets, eq(events.heroMediaId, mediaAssets.id))
    .where(and(eq(events.editionId, editionId), eq(events.slug, slug), eq(events.active, true)))
    .limit(1);

  if (!eventRow) return null;

  const imageRows = await database
    .select({ url: mediaAssets.url, lifecycle: mediaAssets.lifecycle })
    .from(galleries)
    .innerJoin(galleryItems, eq(galleryItems.galleryId, galleries.id))
    .innerJoin(mediaAssets, eq(galleryItems.mediaId, mediaAssets.id))
    .where(and(
      eq(galleries.editionId, editionId),
      eq(galleries.ownerType, 'event'),
      eq(galleries.ownerId, eventRow.id),
      eq(galleries.status, 'published'),
      eq(galleries.active, true),
      eq(galleryItems.active, true),
      eq(mediaAssets.lifecycle, 'ready'),
    ))
    .orderBy(asc(galleryItems.displayOrder));

  const images = imageRows.map((item) => item.lifecycle === 'ready' ? toRemoteUrl(item.url) : null).filter((item): item is string => Boolean(item));

  const event = {
    slug: eventRow.slug,
    label: eventRow.label,
    desc: eventRow.description ?? '',
    heroImageUrl: eventRow.heroLifecycle === 'ready' ? toRemoteUrl(eventRow.heroImageUrl) : null,
    images,
  } satisfies PublicEvent;
  return event;
}

export async function getPublicGalleryAlbums(editionId?: string): Promise<PublicGalleryAlbum[]> {
  const currentEditionId = editionId ?? await getCurrentEditionId();
  const galleryRows = await database
    .select({
      id: galleries.id,
      slug: galleries.slug,
      title: galleries.title,
      description: galleries.description,
      ownerType: galleries.ownerType,
      coverUrl: mediaAssets.url,
      coverAlt: mediaAssets.alt,
      coverLifecycle: mediaAssets.lifecycle,
    })
    .from(galleries)
    .leftJoin(mediaAssets, eq(galleries.coverMediaId, mediaAssets.id))
    .where(and(
      eq(galleries.editionId, currentEditionId),
      eq(galleries.status, 'published'),
      eq(galleries.active, true),
    ))
    .orderBy(asc(galleries.displayOrder), asc(galleries.title));

  if (!galleryRows.length) return [];
  const itemRows = await database
    .select({
      id: galleryItems.id,
      galleryId: galleryItems.galleryId,
      imageUrl: mediaAssets.url,
      imageAlt: mediaAssets.alt,
      imageLifecycle: mediaAssets.lifecycle,
      youtubeId: galleryItems.youtubeId,
      caption: galleryItems.caption,
    })
    .from(galleryItems)
    .leftJoin(mediaAssets, eq(galleryItems.mediaId, mediaAssets.id))
    .where(and(inArray(galleryItems.galleryId, galleryRows.map((row) => row.id)), eq(galleryItems.active, true)))
    .orderBy(asc(galleryItems.displayOrder), asc(galleryItems.id));

  const itemsByGallery = new Map<string, PublicGalleryAlbum['items']>();
  for (const row of itemRows) {
    const imageUrl = row.imageLifecycle === 'ready' ? toRemoteUrl(row.imageUrl) : null;
    const candidateYoutubeId = row.youtubeId?.trim() ?? '';
    const youtubeId = /^[A-Za-z0-9_-]{11}$/.test(candidateYoutubeId) ? candidateYoutubeId : null;
    if (!imageUrl && !youtubeId) continue;
    const items = itemsByGallery.get(row.galleryId) ?? [];
    items.push({ id: row.id, imageUrl, imageAlt: row.imageAlt, youtubeId, caption: row.caption });
    itemsByGallery.set(row.galleryId, items);
  }

  return galleryRows.flatMap((row) => {
    const items = itemsByGallery.get(row.id) ?? [];
    const coverUrl = row.coverLifecycle === 'ready' ? toRemoteUrl(row.coverUrl) : null;
    if (!coverUrl && !items.length) return [];
    return [{
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      ownerType: row.ownerType,
      coverUrl: coverUrl ?? items.find((item) => item.imageUrl)?.imageUrl ?? null,
      coverAlt: row.coverAlt,
      items,
    }];
  });
}

export async function getPublicSponsors(): Promise<PublicSponsor[]> {
  const editionId = await getCurrentEditionId();
  const rows = await database
    .select({ name: dbSponsors.name, imageUrl: mediaAssets.url })
    .from(dbSponsors)
    .leftJoin(mediaAssets, eq(dbSponsors.logoMediaId, mediaAssets.id))
    .where(and(eq(dbSponsors.editionId, editionId), eq(dbSponsors.active, true)))
    .orderBy(asc(dbSponsors.displayOrder), asc(dbSponsors.name));

  return rows.map((sponsor) => {
    const src = toRemoteUrl(sponsor.imageUrl);
    if (!src) {
      throw new Error(`Turso sponsor ${sponsor.name} has no remote logo`);
    }
    return { name: sponsor.name, src };
  });
}

export async function getPublicLegacyPageData() {
  const [finalistRows, sponsorRows] = await Promise.all([
    getFinalistsWithIncome(),
    getPublicSponsors(),
  ]);

  return {
    finalists: finalistRows.map((finalist) => ({
      id: finalist.id,
      name: finalist.name,
      title: `Finalis ${finalist.category}`,
    })),
    sponsors: sponsorRows,
  };
}

function parsePresentationItems(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
    if (typeof parsed === 'object' && parsed !== null && 'items' in parsed) {
      const items = (parsed as { items?: unknown }).items;
      return Array.isArray(items) ? items.filter((item): item is string => typeof item === 'string') : [];
    }
  } catch {
    return [];
  }
  return [];
}

export async function getPublicAboutContent(): Promise<PublicAboutContent> {
  const edition = await getCurrentEdition();
  const [sections, assets, periodRows, galleries] = await Promise.all([
    getPublishedPageSections(edition.id, 'tentang', ['hero', 'visi', 'misi', 'legalitas', 'organisasi']),
    getPublishedSiteAssets(edition.id, 'about'),
    database
      .select({
        id: organizationPeriods.id,
        label: organizationPeriods.label,
        startYear: organizationPeriods.startYear,
        endYear: organizationPeriods.endYear,
        lifecycle: organizationPeriods.lifecycle,
        vision: organizationPeriods.vision,
        missionJson: organizationPeriods.missionJson,
      })
      .from(organizationPeriods)
      .where(inArray(organizationPeriods.lifecycle, ['active', 'archived']))
      .orderBy(desc(organizationPeriods.startYear), asc(organizationPeriods.label)),
    getPublicGalleryAlbums(edition.id),
  ]);

  const activePeriod = edition.organizationPeriodId
    ? periodRows.find((period) => period.id === edition.organizationPeriodId) ?? null
    : null;
  const historyPeriods = periodRows.filter((period) => period.lifecycle === 'archived');
  const periodIds = [...new Set([activePeriod?.id, ...historyPeriods.map((period) => period.id)].filter((id): id is string => Boolean(id)))];
  const membershipRows = periodIds.length
    ? await database
      .select({
        id: organizationMemberships.id,
        periodId: organizationMemberships.periodId,
        name: people.name,
        position: organizationMemberships.title,
        imageUrl: mediaAssets.url,
        imageLifecycle: mediaAssets.lifecycle,
      })
      .from(organizationMemberships)
      .innerJoin(organizationUnits, eq(organizationMemberships.unitId, organizationUnits.id))
      .innerJoin(people, eq(organizationMemberships.personId, people.id))
      .leftJoin(mediaAssets, eq(people.portraitMediaId, mediaAssets.id))
      .where(and(
        inArray(organizationMemberships.periodId, periodIds),
        eq(organizationMemberships.active, true),
        eq(organizationUnits.active, true),
      ))
      .orderBy(asc(organizationUnits.displayOrder), asc(organizationMemberships.displayOrder), asc(people.name))
    : [];

  const publishedMission = parsePresentationItems(sections.misi?.presentationJson);
  const sectionMission = parsePresentationItems(sections.misi?.body);
  const periodMission = parsePresentationItems(activePeriod?.missionJson);
  const useActivePeriod = Boolean(activePeriod);
  const mission = publishedMission.length
    ? publishedMission
    : sectionMission.length
      ? sectionMission
      : sections.misi?.body?.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).length
        ? sections.misi.body.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
      : useActivePeriod ? periodMission : [];
  const sectionVision = sections.visi?.body?.trim();
  const periodVision = activePeriod?.vision?.trim();

  const history = historyPeriods.map((period) => ({
    id: period.id,
    label: period.label,
    startYear: period.startYear,
    endYear: period.endYear,
    vision: period.vision?.trim() || null,
    mission: parsePresentationItems(period.missionJson),
    members: membershipRows
      .filter((row) => row.periodId === period.id)
      .map((row) => ({
        id: row.id,
        imageUrl: row.imageLifecycle === 'ready' ? toRemoteUrl(row.imageUrl) : null,
        name: row.name,
        position: row.position,
      })),
  }));

  return {
    vision: sectionVision || (useActivePeriod ? periodVision : null) || null,
    mission,
    sections,
    assets,
    galleries,
    organizationPeriodLabel: activePeriod?.label ?? null,
    pengurus: membershipRows.filter((row) => row.periodId === activePeriod?.id).map((row) => ({
      imageUrl: row.imageLifecycle === 'ready' ? toRemoteUrl(row.imageUrl) : null,
      name: row.name,
      position: row.position,
    })),
    history,
  };
}

export async function getPublicNews(): Promise<PublicNewsItem[]> {
  const editionId = await getCurrentEditionId();
  const rows = await database
    .select({
      slug: newsArticles.slug,
      title: newsArticles.title,
      excerpt: newsArticles.excerpt,
      sourceUrl: newsArticles.sourceUrl,
      kind: newsArticles.kind,
      coverUrl: mediaAssets.url,
      coverLifecycle: mediaAssets.lifecycle,
      publishedAt: newsArticles.publishedAt,
      createdAt: newsArticles.createdAt,
    })
    .from(newsArticles)
    .leftJoin(mediaAssets, eq(newsArticles.coverMediaId, mediaAssets.id))
    .where(and(eq(newsArticles.editionId, editionId), eq(newsArticles.status, 'published')))
    .orderBy(desc(newsArticles.publishedAt), desc(newsArticles.createdAt));

  return rows.map((article) => ({
    slug: article.slug,
    isInternal: article.kind === 'internal',
    title: article.title,
    description: article.excerpt ?? '',
    imageUrl: article.coverLifecycle === 'ready' ? toRemoteUrl(article.coverUrl) : null,
    date: article.publishedAt ?? article.createdAt,
    link: article.kind === 'internal' ? `/berita/${article.slug}` : article.sourceUrl ?? '#',
    type: article.kind === 'file' ? 'file' : 'link',
  }));
}

export async function getPublicNewsBySlug(slug: string): Promise<PublicNewsArticle | null> {
  const editionId = await getCurrentEditionId();
  const [article] = await database
    .select({
      id: newsArticles.id,
      slug: newsArticles.slug,
      title: newsArticles.title,
      excerpt: newsArticles.excerpt,
      body: newsArticles.body,
      bodyJson: newsArticles.bodyJson,
      publishedAt: newsArticles.publishedAt,
      createdAt: newsArticles.createdAt,
      sourceUrl: newsArticles.sourceUrl,
      kind: newsArticles.kind,
      coverUrl: mediaAssets.url,
      coverAlt: mediaAssets.alt,
      coverLifecycle: mediaAssets.lifecycle,
    })
    .from(newsArticles)
    .leftJoin(mediaAssets, eq(newsArticles.coverMediaId, mediaAssets.id))
    .where(and(
      eq(newsArticles.editionId, editionId),
      eq(newsArticles.slug, slug),
      eq(newsArticles.status, 'published'),
      eq(newsArticles.kind, 'internal'),
    ))
    .limit(1);

  if (!article) return null;

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    bodyJson: article.bodyJson,
    publishedAt: article.publishedAt ?? article.createdAt,
    sourceUrl: article.sourceUrl,
    kind: article.kind,
    coverUrl: article.coverLifecycle === 'ready' ? toRemoteUrl(article.coverUrl) : null,
    coverAlt: article.coverLifecycle === 'ready' ? article.coverAlt : null,
  };
}
