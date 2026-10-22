import type { MetadataRoute } from 'next';
import { env } from '@/env';
import { getPublicGalleryAlbums, getPublicNavigation, getPublicNews } from '@/server/cms/public-readers';
import { getPublicParticipantCategory } from '@/server/cms/public-participant-readers';
import { getPreviewEditionId } from '@/server/cms/preview';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A signed-in preview must not expose draft edition URLs through the sitemap.
  if (await getPreviewEditionId()) return [];
  const baseUrl = new URL(env.BASE_URL).origin;
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
    const categorySlug = encodeURIComponent(category.slug);
    return [
      ...(finalists?.participants.length ? [
        { url: baseUrl + '/profil-finalis/' + categorySlug, changeFrequency: 'weekly' as const, priority: 0.9 },
        ...finalists.participants.map((participant) => ({
          url: baseUrl + '/profil-finalis/' + categorySlug + '/' + encodeURIComponent(participant.slug),
          changeFrequency: 'weekly' as const,
          priority: 0.85,
        })),
      ] : []),
      ...(semifinalists?.participants.length ? [
        { url: baseUrl + '/profil-semifinalis/' + categorySlug, changeFrequency: 'weekly' as const, priority: 0.9 },
        ...semifinalists.participants.map((participant) => ({
          url: baseUrl + '/profil-semifinalis/' + categorySlug + '/' + encodeURIComponent(participant.slug),
          changeFrequency: 'weekly' as const,
          priority: 0.85,
        })),
      ] : []),
    ];
  }));

  const staticRoutes = [
    ...(navigation.registrationVisible ? [{ url: baseUrl + '/pendaftaran', changeFrequency: 'weekly' as const, priority: 0.9 }] : []),
    { url: baseUrl + '/', changeFrequency: 'monthly' as const, priority: 1.0 },
    { url: baseUrl + '/tentang', changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: baseUrl + '/voting', changeFrequency: 'weekly' as const, priority: 0.95 },
    { url: baseUrl + '/galeri', changeFrequency: galleries.length ? 'weekly' as const : 'monthly' as const, priority: 0.8 },
    { url: baseUrl + '/berita', changeFrequency: 'weekly' as const, priority: 0.8 },
  ];
  const eventRoutes = navigation.events.map((event) => ({
    url: baseUrl + '/rangkaian-kegiatan/' + encodeURIComponent(event.slug),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));
  const newsRoutes = news.filter((article) => article.isInternal).map((article) => ({
    url: baseUrl + '/berita/' + encodeURIComponent(article.slug),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...staticRoutes, ...eventRoutes, ...participantRoutes.flat(), ...newsRoutes];
}
