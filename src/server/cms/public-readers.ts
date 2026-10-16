import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { connection } from 'next/server';
import { cache } from 'react';
import { readEditionPalette } from '@/server/cms/edition-palette';
import type { SiteAssetGroup } from '@/server/cms/site-asset-manifest';
import { readEditionSiteAssets } from '@/server/cms/site-assets';
import { contactHref, organizationCopy, type SiteContact } from '@/server/cms/site-copy';
import { getPreviewEditionId } from '@/server/cms/preview';
import { readFallbackEditionIds } from '@/server/cms/edition-fallback';
import { getPublicParticipantStage } from '@/server/cms/participant-stage';
import { contentDrafts } from '@/server/db/schema';
import { contentRevisions } from '@/server/db/schema';
import { archivedIdentity } from '@/server/organization/profile-history';
import { parsePublicDocument, publicPdfUrl } from '@/server/cms/public-document';
import { parseCategory, categories as dbCategories, editions, editionPrograms, events, galleries, galleryItems, mediaAssets, newsArticles, organizationMemberships, organizationPeriods, organizationUnits, pageSections, participantAchievements, participantMedia, participants, people, sponsors as dbSponsors, voteDailyTallies, votingCampaignParticipants, votingCampaigns } from '@/server/db/schema';
import { database } from '@/server/db/client';
import { REGISTRATION_SECTIONS, registrationEditionEligible, registrationVisible } from '@/server/cms/registration';


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
  legalDocument: { url: string; title: string } | null;
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
  description: string | null;
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
  logoMimeType: string | null;
  slogan: string | null;
};

const getContentEditionIds = cache((editionId: string) => readFallbackEditionIds(database, editionId));

async function firstAvailableList<T>(editionIds: string[], read: (editionId: string) => Promise<T[]>) {
  for (const editionId of editionIds) {
    const rows = await read(editionId);
    if (rows.length) return rows;
  }
  return [];
}

async function getPublishedPageSections(editionId: string, pageKey: string, sectionKeys: string[]) {
  if (pageKey === 'pendaftaran') return readPageSections(editionId, pageKey, sectionKeys);
  const editionIds = await getContentEditionIds(editionId);
  const sections = await Promise.all(editionIds.map((id) => readPageSections(id, pageKey, id === editionId ? sectionKeys : sectionKeys.filter((key) => pageKey !== 'site' || key !== 'identity'))));
  return Object.assign({}, ...sections.reverse()) as Record<string, PublicPageSection>;
}

async function readPageSections(editionId: string, pageKey: string, sectionKeys: string[]) {
  if (!sectionKeys.length) return {};
  const preview = (await getPreviewEditionId()) === editionId;
  const rows = await database
    .select({ id: pageSections.id, sectionKey: pageSections.sectionKey, title: pageSections.title, eyebrow: pageSections.eyebrow, body: pageSections.body, presentationJson: pageSections.presentationJson })
    .from(pageSections)
    .where(and(
      eq(pageSections.editionId, editionId),
      eq(pageSections.pageKey, pageKey),
      preview ? undefined : eq(pageSections.status, 'published'),
      inArray(pageSections.sectionKey, sectionKeys),
    ));
  if (preview && rows.length) {
    const drafts = await database.select().from(contentDrafts).where(and(eq(contentDrafts.resourceType, 'pageSection'), inArray(contentDrafts.resourceId, rows.map((row) => row.id))));
    for (const row of rows) {
      const draft = drafts.find((item) => item.resourceId === row.id);
      if (!draft) continue;
      try {
        const value: unknown = JSON.parse(draft.snapshotJson);
        if (typeof value !== 'object' || value === null) continue;
        const copy = value as Record<string, unknown>;
        for (const key of ['title', 'eyebrow', 'body'] as const) if (typeof copy[key] === 'string' || copy[key] === null) row[key] = copy[key];
        if (typeof copy.presentationJson === 'string') row.presentationJson = copy.presentationJson;
      } catch { /* Malformed legacy drafts do not replace published copy. */ }
    }
  }

  return Object.fromEntries(rows.flatMap(({ sectionKey, title, eyebrow, body, presentationJson }) => {
    const action = (pageKey === 'home' && sectionKey === 'ajakan') || (pageKey === 'pendaftaran' && sectionKey === 'hero') ? parsePublicActionPresentation(presentationJson) : null;
    const hasCopy = [title, eyebrow, body].some((value) => value?.trim());
    const hasAction = Boolean(action?.actionLabel && action.actionHref);
    const hasDocument = pageKey === 'tentang' && sectionKey === 'legalitas' && Boolean(parsePublicDocument(presentationJson));
    return (pageKey === 'site' && sectionKey === 'identity') || hasCopy || hasAction || hasDocument
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

async function getPublishedSiteAssets(editionId: string, group: SiteAssetGroup) {
  if (!['home', 'about', 'site', 'brand'].includes(group)) return readEditionSiteAssets(database, editionId, group);
  const assets = await Promise.all((await getContentEditionIds(editionId)).map((id) => readEditionSiteAssets(database, id, group)));
  return Object.assign({}, ...assets.reverse()) as Record<string, PublicSiteAsset>;
}

export async function getPublicHomeContent(): Promise<PublicHomeContent> {
  const editionId = await getCurrentEditionId();
  const [sections, assets, programs] = await Promise.all([
    getPublishedPageSections(editionId, 'home', ['hero', 'program', 'berita', 'ajakan']),
    getPublishedSiteAssets(editionId, 'home'),
    firstAvailableList(await getContentEditionIds(editionId), (id) => database
      .select({ title: editionPrograms.title, description: editionPrograms.description })
      .from(editionPrograms)
      .where(and(eq(editionPrograms.editionId, id), eq(editionPrograms.active, true)))
      .orderBy(asc(editionPrograms.displayOrder), asc(editionPrograms.title))),
  ]);

  return { sections, assets, programs };
}

export async function getPublicPageIntro(page: 'galeri' | 'voting') {
  const sections = await getPublishedPageSections(await getCurrentEditionId(), page, ['hero']);
  return sections.hero ?? null;
}

export const getPublicRegistration = cache(async () => {
  const edition = await getCurrentEdition();
  if (!registrationEditionEligible(edition.year)) return null;
  const sections = await getPublishedPageSections(edition.id, 'pendaftaran', [...REGISTRATION_SECTIONS]);
  return registrationVisible(edition.year, sections.hero) ? { edition, sections } : null;
});

export const getPublicSiteIdentity = cache(async () => {
  const edition = await getCurrentEdition();
  const [sections, siteAssets, brandAssets, storedPalette] = await Promise.all([
    getPublishedPageSections(edition.id, 'site', ['identity', 'instagram', 'youtube', 'email']),
    getPublishedSiteAssets(edition.id, 'site'),
    getPublishedSiteAssets(edition.id, 'brand'),
    readEditionPalette(database, edition.id),
  ]);
  const contacts: SiteContact[] = [];
  for (const kind of ['instagram', 'youtube', 'email'] as const) {
    const section = sections[kind];
    const href = contactHref(kind, section?.body);
    if (href) contacts.push({ kind, href, label: section?.title || kind });
  }
  const identity = sections.identity;
  return { title: identity?.title || 'PAMOKA Garut', description: identity?.body || '', signature: identity?.eyebrow || '', contacts, edition, palette: storedPalette.palette, assets: { ...siteAssets, ...brandAssets } };
});

export async function getPublicEventSharingMetadata() {
  const { assets } = await getPublicSiteIdentity();
  const image = assets['brand.social.event'] ?? assets['site.social.image'];
  return { openGraph: { images: image ? [image.url] : [] }, twitter: { card: 'summary_large_image' as const, images: image ? [image.url] : [] } };
}

export const getCurrentEdition = cache(async (): Promise<PublicEdition> => {
  await connection();
  const previewEditionId = await getPreviewEditionId();

  const editionSelection = {
    id: editions.id,
    year: editions.year,
    slug: editions.slug,
    name: editions.name,
    lifecycle: editions.lifecycle,
    organizationPeriodId: editions.organizationPeriodId,
    logoUrl: mediaAssets.url,
    logoAlt: mediaAssets.alt,
    logoMimeType: mediaAssets.mimeType,
    logoLifecycle: mediaAssets.lifecycle,
    slogan: editions.slogan,
  };
  const [activeEdition] = await database
    .select(editionSelection)
    .from(editions)
    .leftJoin(mediaAssets, eq(editions.logoMediaId, mediaAssets.id))
    .where(previewEditionId ? eq(editions.id, previewEditionId) : eq(editions.lifecycle, 'active'))
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
    logoMimeType: edition.logoLifecycle === 'ready' ? edition.logoMimeType : null,
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


export async function getPublicNavigation() {
  const edition = await getCurrentEdition();
  const registration = await getPublicRegistration();
  const [categories, events, resultCampaign, aboutSections, finalStage, semifinalStage] = await Promise.all([
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
    getPublicParticipantStage(database, edition.id, 'finalis'),
    getPublicParticipantStage(database, edition.id, 'semifinalis'),
  ]);
  return {
    categories,
    events,
    edition,
    participantKind: !finalStage && semifinalStage ? 'semifinalis' as const : 'finalis' as const,
    registrationVisible: Boolean(registration),
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
    ? await getPublicVotingCandidates(campaign.id, category.id, edition.id)
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

async function getPublicVotingCandidates(campaignId: string, categoryId: string, editionId: string): Promise<PublicVotingCandidate[]> {
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
      eq(participants.editionId, editionId),
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
      eq(participants.editionId, edition.id),
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

async function readPublicEvents() {
  const editionIds = await getContentEditionIds(await getCurrentEditionId());
  const rows = await database
    .select({ id: events.id, editionId: events.editionId, slug: events.slug, label: events.label, description: events.description, heroImageUrl: mediaAssets.url, heroLifecycle: mediaAssets.lifecycle })
    .from(events)
    .leftJoin(mediaAssets, eq(events.heroMediaId, mediaAssets.id))
    .where(and(inArray(events.editionId, editionIds), eq(events.active, true)))
    .orderBy(asc(events.displayOrder), asc(events.label));
  return editionIds.flatMap((id) => rows.filter((row) => row.editionId === id));
}

function publicEvent(rows: Awaited<ReturnType<typeof readPublicEvents>>): PublicEvent {
  const event = rows[0];
  return {
    slug: event.slug,
    label: event.label,
    desc: event.description ?? '',
    heroImageUrl: rows.map((row) => row.heroLifecycle === 'ready' ? toRemoteUrl(row.heroImageUrl) : null).find(Boolean) ?? null,
    images: [],
  };
}

export async function getPublicEvents(): Promise<PublicEvent[]> {
  const rows = await readPublicEvents();
  return [...new Set(rows.map((row) => row.slug))].map((slug) => publicEvent(rows.filter((row) => row.slug === slug)));
}

export async function getPublicEventBySlug(slug: string): Promise<PublicEvent | null> {
  const eventRows = (await readPublicEvents()).filter((row) => row.slug === slug);
  if (!eventRows.length) return null;

  const images = await firstAvailableList(eventRows.map((row) => row.id), async (eventId) => {
    const eventRow = eventRows.find((row) => row.id === eventId)!;
    const imageRows = await database
    .select({ url: mediaAssets.url, lifecycle: mediaAssets.lifecycle })
    .from(galleries)
    .innerJoin(galleryItems, eq(galleryItems.galleryId, galleries.id))
    .innerJoin(mediaAssets, eq(galleryItems.mediaId, mediaAssets.id))
    .where(and(
      eq(galleries.editionId, eventRow.editionId),
      eq(galleries.ownerType, 'event'),
      eq(galleries.ownerId, eventId),
      eq(galleries.status, 'published'),
      eq(galleries.active, true),
      eq(galleryItems.active, true),
      eq(mediaAssets.lifecycle, 'ready'),
    ))
    .orderBy(asc(galleryItems.displayOrder));

    return imageRows.map((item) => item.lifecycle === 'ready' ? toRemoteUrl(item.url) : null).filter((item): item is string => Boolean(item));
  });
  return { ...publicEvent(eventRows), images };
}

export async function getPublicGalleryAlbums(editionId?: string): Promise<PublicGalleryAlbum[]> {
  const currentEditionId = editionId ?? await getCurrentEditionId();
  const albums = await Promise.all((await getContentEditionIds(currentEditionId)).map(readGalleryAlbums));
  const bySlug = new Map<string, PublicGalleryAlbum>();
  for (const list of albums) for (const album of list) if (!bySlug.has(album.slug)) bySlug.set(album.slug, album);
  return [...bySlug.values()];
}

async function readGalleryAlbums(currentEditionId: string): Promise<PublicGalleryAlbum[]> {
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
  return firstAvailableList(await getContentEditionIds(editionId), async (id) => {
  const rows = await database
    .select({ name: dbSponsors.name, imageUrl: mediaAssets.url })
    .from(dbSponsors)
    .leftJoin(mediaAssets, eq(dbSponsors.logoMediaId, mediaAssets.id))
    .where(and(eq(dbSponsors.editionId, id), eq(dbSponsors.active, true), eq(mediaAssets.lifecycle, 'ready')))
    .orderBy(asc(dbSponsors.displayOrder), asc(dbSponsors.name));

  return rows.flatMap((sponsor) => {
    const src = toRemoteUrl(sponsor.imageUrl);
    if (!src) {
      return [];
    }
    return [{ name: sponsor.name, src }];
  });
  });
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
  const document = parsePublicDocument(sections.legalitas?.presentationJson);
  const [documentMedia] = document
    ? await database.select({ url: mediaAssets.url, mimeType: mediaAssets.mimeType, lifecycle: mediaAssets.lifecycle })
      .from(mediaAssets).where(eq(mediaAssets.id, document.documentMediaId)).limit(1)
    : [];
  const documentUrl = publicPdfUrl(documentMedia);
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

  const historicIds = membershipRows.filter((row) => historyPeriods.some((period) => period.id === row.periodId)).map((row) => row.id);
  const snapshots = historicIds.length ? await database.select().from(contentRevisions).where(and(eq(contentRevisions.resourceType, 'organizationPerson'), inArray(contentRevisions.resourceId, historicIds))) : [];
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
        ...archivedIdentity(snapshots.find((snapshot) => snapshot.resourceId === row.id)?.snapshotJson, { imageUrl: row.imageLifecycle === 'ready' ? toRemoteUrl(row.imageUrl) : null, name: row.name }),
        position: row.position,
      })),
  }));

  return {
    vision: organizationCopy(activePeriod, { vision: sectionVision || periodVision || null, mission }).vision,
    legalDocument: document && documentUrl ? { url: documentUrl, title: document.documentTitle } : null,
    mission: organizationCopy(activePeriod, { vision: sectionVision || periodVision || null, mission }).mission,
    sections,
    assets,
    galleries,
    organizationPeriodLabel: activePeriod?.label ?? null,
    pengurus: membershipRows.filter((row) => row.periodId === activePeriod?.id).map((row) => ({
      ...archivedIdentity(snapshots.find((snapshot) => snapshot.resourceId === row.id)?.snapshotJson, { imageUrl: row.imageLifecycle === 'ready' ? toRemoteUrl(row.imageUrl) : null, name: row.name }),
      position: row.position,
    })),
    history,
  };
}

const getNewsEditionId = cache(async () => {
  const editionIds = await getContentEditionIds(await getCurrentEditionId());
  const rows = await database.selectDistinct({ editionId: newsArticles.editionId }).from(newsArticles)
    .where(and(inArray(newsArticles.editionId, editionIds), eq(newsArticles.status, 'published')));
  return editionIds.find((id) => rows.some((row) => row.editionId === id)) ?? null;
});

export async function getPublicNews(): Promise<PublicNewsItem[]> {
  const editionId = await getNewsEditionId();
  if (!editionId) return [];
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
  const editionId = await getNewsEditionId();
  if (!editionId) return null;
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
