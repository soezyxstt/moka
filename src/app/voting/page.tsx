import Image from 'next/image';
import { Section } from '@/components/custom/section';
import { typography } from '@/components/custom/typography';
import { calculateVotesFromAmount } from '@/lib/voting';
import { VotingCategories } from './voting-categories';
import { VotingPanel, type VotingPanelProps } from './voting-panel';
import { getPublicVotingCategories, getPublicVotingCategoryBySlug, getPublicVotingResults, getPublicPageIntro, getPublicSiteIdentity, type PublicVotingCategory, type PublicVotingResults } from '@/server/cms/public-readers';

export const metadata = { title: 'Voting' };

export default async function VotingPage() {
  const [{ editionYear, categories }, intro, { assets }] = await Promise.all([
    getPublicVotingCategories(),
    getPublicPageIntro('voting'),
    getPublicSiteIdentity(),
  ]);
  const details = (await Promise.all(categories.map(async ({ slug }) => {
    const [category, results] = await Promise.all([getPublicVotingCategoryBySlug(slug), getPublicVotingResults(slug)]);
    return category && results ? { category, results } : null;
  }))).filter((item) => item !== null);
  const poster = assets['site.voting.bg'] ?? details.find(({ category }) => category.poster)?.category.poster;
  const now = new Date();
  return <main className="relative min-h-screen">
    <section className="relative overflow-hidden bg-brand-900 px-8 pb-12 pt-32 md:px-20 md:pb-16 md:pt-44">
      {poster ? <Image src={poster.url} alt={poster.alt ?? ""} fill preload sizes="100vw" className="object-cover object-center" /> : null}
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-brand-900/95 via-brand-900/80 to-brand-900/40" />
      <div className="relative mx-auto max-w-7xl">
        <h1 className="max-w-3xl font-manrope text-4xl font-semibold leading-tight text-canvas md:text-6xl">{intro?.title || 'Voting'}</h1>
        <typography.p className="mt-5 max-w-xl leading-7 text-canvas/85">{intro?.body || `Dukung peserta pilihanmu di Pasanggiri Mojang Jajaka Kabupaten Garut ${editionYear}.`}</typography.p>
      </div>
    </section>
    <Section className="bg-brand-50" contentClassName="mx-auto max-w-7xl">
      {details.length ? <VotingCategories categories={details.map(({ category, results }) => ({
        slug: category.slug, name: category.code,
        content: <VotingPanel {...toPanelProps(category, results, now)} />,
      }))} /> : <typography.p>Belum ada kategori voting untuk edisi ini.</typography.p>}
    </Section>
  </main>;
}

function toPanelProps(category: PublicVotingCategory, results: PublicVotingResults, now: Date): VotingPanelProps {
  const campaign = category.campaign ?? results.campaign;
  const price = campaign?.pricePerPoint ?? 0;
  const toVotes = (amount: number) => price > 0 && amount >= 0 ? calculateVotesFromAmount(amount, price) : 0;
  const ranked = results.candidates
    .map((candidate) => ({ id: candidate.id, name: candidate.name, votes: toVotes(candidate.amount) }))
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, 'id'));
  const byId = new Map(ranked.map((candidate, index) => [candidate.id, { votes: candidate.votes, rank: index + 1 }]));
  return {
    title: campaign?.name ?? `Voting ${category.code}`,
    period: campaign ? `${formatDate(campaign.startsAt, campaign.timezone)} sampai ${formatDate(campaign.endsAt, campaign.timezone)}` : null,
    status: category.campaign ? 'Voting sedang dibuka' : campaign && now < campaign.startsAt ? 'Voting belum dibuka' : campaign ? 'Voting sudah ditutup' : `Voting edisi ${category.editionYear} belum tersedia`,
    open: Boolean(category.campaign),
    pricePerVote: price,
    resultsVisible: results.visible,
    totalVotes: ranked.reduce((total, candidate) => total + candidate.votes, 0),
    results: ranked.map(({ name, votes }) => ({ name, votes })),
    candidates: category.candidates.map((candidate) => ({
      id: candidate.id,
      slug: candidate.slug,
      number: candidate.number,
      name: candidate.name,
      code: `${category.code}-${String(candidate.number).padStart(2, '0')}`,
      imageUrl: candidate.imageUrl,
      qrImageUrl: candidate.qrImageUrl,
      votes: byId.get(candidate.id)?.votes ?? null,
      rank: byId.get(candidate.id)?.rank ?? null,
    })),
  };
}

function formatDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date);
}
