import type { MetadataRoute } from 'next';
import { env } from '@/env';
import { getPublicGalleryAlbums, getPublicNavigation, getPublicNews, getPublicVotingCategoryBySlug, getPublicVotingResults } from '@/server/cms/public-readers';
import { getPublicParticipantCategory } from '@/server/cms/public-participant-readers';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.BASE_URL.replace(/\/$/, '');
  const [navigation, galleries, news] = await Promise.all([
    getPublicNavigation(),
    getPublicGalleryAlbums(),
    getPublicNews(),
  ]);
  const categories = navigation.categories;
  const participantRoutes = await Promise.all(categories.map(async (category) => {
    const [finalists, semifinalists] = await Promise.all([
      getPublicParticipantCategory(category.slug, 'finalis'),
      getPublicParticipantCategory(category.slug, 'semifinalis'),
    ]);
    return [
      { url: baseUrl + '/profil-finalis/' + category.slug, changeFrequency: 'weekly' as const, priority: 0.9 },
      ...(finalists?.participants.map((participant) => ({
        url: baseUrl + '/profil-finalis/' + category.slug + '/' + participant.slug,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      })) ?? []),
      { url: baseUrl + '/profil-semifinalis/' + category.slug, changeFrequency: 'weekly' as const, priority: 0.9 },
      ...(semifinalists?.participants.map((participant) => ({
        url: baseUrl + '/profil-semifinalis/' + category.slug + '/' + participant.slug,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      })) ?? []),
    ];
  }));

  const votingRoutes = await Promise.all(categories.map(async (category) => {
    const [voting, results] = await Promise.all([
      getPublicVotingCategoryBySlug(category.slug),
      getPublicVotingResults(category.slug),
    ]);
    return [
      ...(voting?.campaign ? [
        { url: baseUrl + '/voting/' + category.slug, changeFrequency: 'weekly' as const, priority: 0.95 },
        ...voting.candidates.map((candidate) => ({
          url: baseUrl + '/voting/' + category.slug + '/' + candidate.slug,
          changeFrequency: 'weekly' as const,
          priority: 0.85,
        })),
      ] : []),
      ...(results?.visible ? [
        { url: baseUrl + '/voting/hasil/' + category.slug, changeFrequency: 'weekly' as const, priority: 0.9 },
      ] : []),
    ];
  }));

  const staticRoutes = [
    { url: baseUrl + '/', changeFrequency: 'monthly' as const, priority: 1.0 },
    { url: baseUrl + '/tentang', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: baseUrl + '/galeri', changeFrequency: galleries.length ? 'weekly' as const : 'monthly' as const, priority: 0.8 },
  ];
  const eventRoutes = navigation.events.map((event) => ({
    url: baseUrl + '/rangkaian-kegiatan/' + event.slug,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));
  const newsRoutes = news.filter((article) => article.isInternal).map((article) => ({
    url: baseUrl + '/berita/' + article.slug,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...staticRoutes, ...eventRoutes, ...participantRoutes.flat(), ...votingRoutes.flat(), ...newsRoutes]
    .map((entry) => ({ ...entry, lastModified: new Date() }));
}
