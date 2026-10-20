import Image from 'next/image';
import { CalendarDays } from 'lucide-react';
import { Section } from '@/components/custom/section';
import { typography } from '@/components/custom/typography';
import { calculateVotesFromAmount } from '@/lib/voting';
import { VotingCategories, type CategoryTab } from './voting-categories';
import { VotingPanel } from './voting-panel';
import {
  getPublicVotingCategories,
  getPublicVotingCategoryBySlug,
  getPublicVotingResults,
  getPublicPageIntro,
  getPublicSiteIdentity,
  getPublicVotingCampaign,
} from '@/server/cms/public-readers';

export async function generateMetadata() {
  const campaign = await getPublicVotingCampaign();
  return {
    title: campaign?.name ?? 'Voting',
  };
}

export default async function VotingPage() {
  const [{ editionYear, categories }, intro, { assets }, activeCampaign] = await Promise.all([
    getPublicVotingCategories(),
    getPublicPageIntro('voting'),
    getPublicSiteIdentity(),
    getPublicVotingCampaign(),
  ]);
  const details = (await Promise.all(categories.map(async ({ slug }) => {
    const [category, results] = await Promise.all([getPublicVotingCategoryBySlug(slug), getPublicVotingResults(slug)]);
    return category && results ? { category, results } : null;
  }))).filter((item) => item !== null);
  const poster = assets['site.voting.bg'] ?? details.find(({ category }) => category.poster)?.category.poster;

  const campaign = activeCampaign
    ?? details.find(({ category }) => category.campaign)?.category.campaign
    ?? details.find(({ results }) => results.campaign)?.results.campaign
    ?? null;

  const campaignTitle = campaign?.name || intro?.title || 'Voting';
  const campaignDescription = campaign?.description?.trim()
    || intro?.body
    || `Dukung peserta pilihanmu di Pasanggiri Mojang Jajaka Kabupaten Garut ${editionYear}.`;
  const periodText = campaign
    ? formatCampaignPeriod(campaign.startsAt, campaign.endsAt, campaign.timezone)
    : null;
  const campaignEnded = details.some(({ results }) => results.ended);

  const rumajaCount = details.reduce((total, { category }) => {
    return category.code === 'JR' || category.code === 'MR'
      ? total + category.candidates.length
      : total;
  }, 0);

  const categoryTabs: CategoryTab[] = details.map(({ category, results }) => {
    const isDewasa = category.code === 'JD' || category.code === 'MD';
    const candidateNumberOffset = isDewasa ? rumajaCount : 0;
    const catCampaign = category.campaign ?? results.campaign ?? campaign;
    const price = catCampaign?.pricePerPoint ?? 0;
    const toVotes = (amount: number) => price > 0 && amount >= 0 ? calculateVotesFromAmount(amount, price) : 0;
    const totalVotes = results.candidates.reduce((total, candidate) => total + toVotes(candidate.amount), 0);
    const ranked = results.candidates
      .map((candidate) => {
        const votes = toVotes(candidate.amount);
        const percentage = candidate.percentage ?? (totalVotes > 0 ? Math.round((votes / totalVotes) * 10000) / 100 : 0);
        return { id: candidate.id, name: candidate.name, votes, percentage };
      })
      .sort((a, b) => b.percentage - a.percentage || b.votes - a.votes || a.name.localeCompare(b.name, 'id'));
    const byId = new Map(ranked.map((candidate, index) => [candidate.id, { votes: candidate.votes, percentage: candidate.percentage, rank: index + 1 }]));

    return {
      slug: category.slug,
      name: category.code,
      open: Boolean(category.campaign),
      ended: campaignEnded,
      pricePerVote: price,
      resultsVisible: results.visible,
      candidateNumberOffset,
      candidates: category.candidates.map((candidate) => ({
        id: candidate.id,
        slug: candidate.slug,
        number: candidate.number,
        name: candidate.name,
        code: `${category.code}-${String(candidate.number).padStart(2, '0')}`,
        imageUrl: candidate.imageUrl,
        qrImageUrl: candidate.qrImageUrl,
        votes: byId.get(candidate.id)?.votes ?? null,
        percentage: byId.get(candidate.id)?.percentage ?? null,
        rank: byId.get(candidate.id)?.rank ?? null,
      })),
      content: (
        <VotingPanel
          resultsVisible={results.visible}
          totalVotes={totalVotes}
          results={ranked.map(({ name, percentage }) => ({ name, percentage }))}
          updatedAt={results.resultUpdatedAt}
          ended={campaignEnded}
        />
      ),
    };
  });

  return <main className="relative min-h-screen">
    <section className="relative overflow-hidden bg-brand-900 px-8 pb-12 pt-32 md:px-20 md:pb-16 md:pt-44">
      {poster ? <Image src={poster.url} alt={poster.alt ?? ""} fill preload sizes="100vw" className="object-cover object-center" /> : null}
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-brand-900/95 via-brand-900/80 to-brand-900/40" />
      <div className="relative mx-auto max-w-7xl">
        <h1 className="max-w-3xl font-manrope text-4xl font-semibold leading-tight text-canvas md:text-6xl">{campaignTitle}</h1>
        {periodText ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-canvas/80 md:text-base">
            <CalendarDays className="size-4 shrink-0 text-highlight-400" aria-hidden />
            <span>{periodText}</span>
          </p>
        ) : null}
        <typography.p className="mt-4 max-w-2xl leading-7 text-canvas/85">{campaignDescription}</typography.p>
      </div>
    </section>
    <Section className="bg-brand-50" contentClassName="mx-auto max-w-7xl">
      {categoryTabs.length ? (
        <VotingCategories categories={categoryTabs} />
      ) : (
        <typography.p>Belum ada kategori voting untuk edisi ini.</typography.p>
      )}
    </Section>
  </main>;
}

function formatCampaignPeriod(startsAt: Date, endsAt: Date, timeZone: string) {
  const startDay = new Intl.DateTimeFormat('id-ID', { day: 'numeric', timeZone }).format(startsAt);
  const startMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone }).format(startsAt);
  const startYear = new Intl.DateTimeFormat('id-ID', { year: 'numeric', timeZone }).format(startsAt);

  const endDay = new Intl.DateTimeFormat('id-ID', { day: 'numeric', timeZone }).format(endsAt);
  const endMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone }).format(endsAt);
  const endYear = new Intl.DateTimeFormat('id-ID', { year: 'numeric', timeZone }).format(endsAt);

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      if (startDay === endDay) {
        return `${startDay} ${startMonth} ${startYear}`;
      }
      return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  }
  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}
