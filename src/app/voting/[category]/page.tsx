import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { typography } from '@/components/custom/typography';
import { getPublicVotingCategoryBySlug } from '@/server/cms/public-readers';

type PageProps = Readonly<{ params: Promise<{ category: string }> }>;

export async function generateMetadata({ params }: PageProps) {
  const { category: slug } = await params;
  const category = await getPublicVotingCategoryBySlug(slug);
  if (!category) return { title: 'Kategori tidak ditemukan' };

  const title = category.campaign?.name ?? 'Voting ' + category.name;
  return {
    title: title + ' ' + category.editionYear,
    description: category.campaign
      ? category.campaign.name + ', voting peserta kategori ' + category.name + ' untuk edisi ' + category.editionYear + '.'
      : 'Informasi voting kategori ' + category.name + ' untuk edisi ' + category.editionYear + '.',
  };
}

export default async function VotingCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = await getPublicVotingCategoryBySlug(slug);
  if (!category) notFound();

  const campaign = category.campaign;
  const hasCandidates = category.candidates.length > 0;

  return (
    <main className="relative min-h-screen overflow-hidden pb-16">
      <section className="relative flex min-h-[90svh] items-center overflow-hidden bg-dgb-900 text-white">
        {category.poster ? (
          <Image src={category.poster.url} alt={category.poster.alt ?? ''} fill priority sizes="100vw" className="object-cover" />
        ) : null}
        {category.video && ['video/mp4', 'video/webm'].includes(category.video.mimeType) ? (
          <video autoPlay loop muted playsInline preload="metadata" className="absolute inset-0 size-full object-cover" aria-hidden="true">
            <source src={category.video.url} type={category.video.mimeType} />
          </video>
        ) : null}
        <div aria-hidden className="absolute inset-0 bg-linear-to-r from-dgb-900/90 via-dgb-900/65 to-dgb-900/35" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-12">
          <p className="font-montserrat text-xs font-bold uppercase tracking-[0.2em] text-fb">{category.editionYear} · {category.name}</p>
          <h1 className="mt-4 max-w-3xl font-montserrat text-4xl font-semibold text-white md:text-6xl">
            {campaign?.name ?? 'Voting ' + category.name}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
            Berikan dukungan kepada peserta kategori {category.name} pada edisi {category.editionYear}.
          </p>
          {campaign ? (
            <dl className="mt-8 grid max-w-xl gap-4 rounded-xl border border-white/20 bg-dgb-900/45 p-5 backdrop-blur-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/65">Periode voting</dt>
                <dd className="mt-1 text-sm font-semibold">{formatCampaignDate(campaign.startsAt, campaign.timezone)} sampai {formatCampaignDate(campaign.endsAt, campaign.timezone)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/65">Biaya per poin</dt>
                <dd className="mt-1 text-sm font-semibold">{campaign.pricePerPoint > 0 ? formatCurrency(campaign.pricePerPoint) : 'Belum ditetapkan'}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-8 inline-flex rounded-md border border-white/20 bg-dgb-900/45 px-4 py-3 text-sm text-white/80">
              Kampanye voting belum tersedia untuk edisi ini.
            </p>
          )}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 md:px-12 md:py-16">
        <header className="mb-8 text-center">
          <p className="font-montserrat text-xs font-bold uppercase tracking-[0.18em] text-fb">{category.editionYear}</p>
          <typography.h1 className="mt-2 text-3xl text-white md:text-5xl">{category.name}</typography.h1>
          <p className="mt-3 text-sm text-white/75">Peserta dalam kampanye voting ini</p>
        </header>
        {campaign && hasCandidates ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {category.candidates.map((candidate) => (
              <Link key={candidate.id} href={'/voting/' + category.slug + '/' + candidate.slug} className="group relative aspect-[3/3.2] overflow-hidden rounded-xl border border-white/15 bg-dgb-900">
                {candidate.imageUrl ? (
                  <Image src={candidate.imageUrl} alt={candidate.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div role="img" aria-label={'Foto ' + candidate.name + ' belum tersedia'} className="grid size-full place-items-center bg-linear-to-br from-dgb-700 to-dgb-900">
                    <span aria-hidden="true" className="font-montserrat text-6xl font-semibold">{getInitials(candidate.name)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fb">{category.code}-{String(candidate.number).padStart(2, '0')}</p>
                  <h2 className="mt-1 font-montserrat text-xl font-semibold">{candidate.name}</h2>
                  <p className="mt-2 text-sm text-white/75">Lihat profil dan QR voting</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/25 bg-dgb-900/35 px-6 py-12 text-center text-white/80">
            <h2 className="font-montserrat text-xl font-semibold text-white">{campaign ? 'Peserta voting belum tersedia' : 'Kampanye belum tersedia'}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6">
              {campaign
                ? 'Belum ada peserta yang tercatat untuk kategori ' + category.name + ' pada kampanye ini.'
                : 'Informasi kategori ' + category.name + ' akan ditampilkan setelah kampanye voting edisi ' + category.editionYear + ' tersedia.'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function formatCampaignDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(date);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function getInitials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join('');
}
