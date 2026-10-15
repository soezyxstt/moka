import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Vote } from 'lucide-react';
import { Section } from '@/components/custom/section';
import { typography } from '@/components/custom/typography';
import { Button } from '@/components/ui/button';
import { VotingCategories } from './voting-categories';
import { getPublicVotingCategories, getPublicVotingCategoryBySlug, getPublicPageIntro } from '@/server/cms/public-readers';

export const metadata = { title: 'Voting' };

export default async function VotingPage() {
  const [{ editionYear, categories }, intro] = await Promise.all([getPublicVotingCategories(), getPublicPageIntro('voting')]);
  const details = (await Promise.all(categories.map(({ slug }) => getPublicVotingCategoryBySlug(slug)))).filter((category) => category !== null);
  const poster = details.find((category) => category.poster)?.poster;
  return <main className="relative min-h-screen">
    <section className="relative overflow-hidden bg-brand-900 px-8 pb-12 pt-32 md:px-20 md:pb-16 md:pt-44">
      {poster ? <Image src={poster.url} alt="" fill preload sizes="100vw" className="object-cover object-center" /> : null}
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-brand-900/95 via-brand-900/80 to-brand-900/40" />
      <div className="relative mx-auto max-w-7xl">
        <h1 className="max-w-3xl font-manrope text-4xl font-semibold leading-tight text-canvas md:text-6xl">{intro?.title || 'Voting'}</h1>
        <typography.p className="mt-5 max-w-xl leading-7 text-canvas/85">{intro?.body || `Dukung peserta pilihanmu di Pasanggiri Mojang Jajaka Kabupaten Garut ${editionYear}.`}</typography.p>
      </div>
    </section>
    <Section className="bg-brand-50" contentClassName="mx-auto max-w-7xl">
      {details.length ? <VotingCategories categories={details.map((category) => ({
        slug: category.slug, name: category.code,
        content: <div className="mt-8">
          <div className="flex flex-col gap-6 border-b border-brand-200 pb-8 md:flex-row md:items-start md:justify-between">
            <div>
              <typography.h1 className="text-2xl text-brand-900 md:text-3xl">{category.campaign?.name ?? `Voting ${category.code}`}</typography.h1>
              <typography.p className="mt-3 max-w-xl leading-7">{category.campaign ? `Pilih peserta kategori ${category.code} untuk melihat profil dan QR voting.` : `Voting edisi ${editionYear} belum dibuka. Kamu tetap dapat mengenal finalis kategori ${category.code}.`}</typography.p>
            </div>
            <Button asChild variant="outline" className="h-11 border-brand bg-transparent text-brand hover:bg-brand hover:text-canvas"><Link href={`/profil-finalis/${category.slug}`}>Lihat finalis {category.code}<ArrowUpRight aria-hidden /></Link></Button>
          </div>
          {category.campaign ? <>
            <dl className="my-8 grid gap-6 sm:grid-cols-2">
              <div><dt className="text-sm text-muted-foreground">Periode voting</dt><dd className="mt-2 font-medium text-brand-900">{formatDate(category.campaign.startsAt, category.campaign.timezone)} sampai {formatDate(category.campaign.endsAt, category.campaign.timezone)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Biaya per poin</dt><dd className="mt-2 font-medium text-brand-900">{category.campaign.pricePerPoint > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(category.campaign.pricePerPoint) : 'Belum ditetapkan'}</dd></div>
            </dl>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {category.candidates.map((candidate) => <Link key={candidate.id} href={`/voting/${category.slug}/${candidate.slug}`} className="group overflow-hidden rounded-lg bg-canvas focus-visible:outline-2 focus-visible:outline-brand">
                {candidate.imageUrl ? <div className="relative aspect-[4/5]"><Image src={candidate.imageUrl} alt={candidate.name} fill sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 30vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" /></div> : null}
                <div className="p-5"><p className="text-sm font-medium text-highlight-700">{category.code}-{String(candidate.number).padStart(2, '0')}</p><h3 className="mt-2 font-manrope text-xl font-semibold text-brand-900">{candidate.name}</h3><p className="mt-3 text-sm text-muted-foreground">Lihat profil dan QR voting</p></div>
              </Link>)}
            </div>
            {!category.candidates.length ? <p className="mt-8 text-muted-foreground">Peserta voting belum tersedia untuk kategori ini.</p> : null}
          </> : <div className="flex items-start gap-4 py-8 text-brand-800"><Vote className="mt-1 size-6 shrink-0" aria-hidden /><div><h3 className="font-manrope text-lg font-semibold">Kampanye belum tersedia</h3><p className="mt-2 max-w-xl text-sm leading-6">Jadwal dan QR voting akan tampil setelah kampanye tersedia.</p></div></div>}
        </div>,
      }))} /> : <typography.p>Belum ada kategori voting untuk edisi ini.</typography.p>}
    </Section>
  </main>;
}
function formatDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date);
}
