import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublicVotingCategoryBySlug } from '@/server/cms/public-readers';

type PageProps = Readonly<{ params: Promise<{ name: string; category: string }> }>;

export async function generateMetadata({ params }: PageProps) {
  const { name, category: categorySlug } = await params;
  const category = await getPublicVotingCategoryBySlug(categorySlug);
  const candidate = category?.candidates.find((item) => item.slug === name);
  if (!category || !candidate) return { title: 'Profil peserta tidak ditemukan' };

  return {
    title: 'Profil ' + candidate.name + ' · ' + category.name + ' ' + category.editionYear,
    description: candidate.bio || 'Profil peserta kategori ' + category.name + ' pada edisi ' + category.editionYear + '.',
    openGraph: candidate.imageUrl ? { images: [candidate.imageUrl] } : undefined,
  };
}

export default async function VotingCandidatePage({ params }: PageProps) {
  const { name, category: categorySlug } = await params;
  const category = await getPublicVotingCategoryBySlug(categorySlug);
  const candidate = category?.candidates.find((item) => item.slug === name);
  if (!category || !category.campaign || !candidate) notFound();

  const price = category.campaign.pricePerPoint > 0
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(category.campaign.pricePerPoint)
    : 'Belum ditetapkan';

  return (
    <main className="min-h-screen bg-dgb-900 px-5 pb-16 pt-24 text-white md:px-10 md:pt-28">
      <article className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-xl border border-white/15 bg-white/8 md:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <div className="relative min-h-[50vh] bg-dgb-800 md:min-h-[78vh]">
          {candidate.imageUrl ? (
            <Image src={candidate.imageUrl} alt={candidate.name} fill priority sizes="(max-width: 768px) 100vw, 55vw" className="object-cover object-top" />
          ) : (
            <div role="img" aria-label={'Foto ' + candidate.name + ' belum tersedia'} className="grid size-full min-h-[50vh] place-items-center bg-linear-to-br from-dgb-700 to-dgb-900 md:min-h-[78vh]">
              <span aria-hidden="true" className="font-montserrat text-7xl font-semibold">{candidate.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 p-6 md:p-9">
          <header>
            <p className="font-montserrat text-xs font-bold uppercase tracking-[0.18em] text-fb">{category.name} · {category.editionYear}</p>
            <h1 className="mt-3 font-montserrat text-3xl font-semibold md:text-4xl">{candidate.name}</h1>
            <p className="mt-2 text-sm text-white/70">{category.code}-{String(candidate.number).padStart(2, '0')}</p>
          </header>

          <section aria-label="Profil peserta">
            <h2 className="font-montserrat text-lg font-semibold">Profil</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-white/80">{candidate.bio || 'Deskripsi peserta belum tersedia.'}</p>
            {candidate.achievements.length ? (
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-6 text-white/80">
                {candidate.achievements.map((achievement, index) => <li key={candidate.id + '-' + index}>{achievement}</li>)}
              </ul>
            ) : null}
          </section>

          {candidate.profileVideoUrl ? (
            <section aria-label="Video profil">
              <h2 className="mb-2 font-montserrat text-lg font-semibold">Video profil</h2>
              <video controls playsInline preload="metadata" className="w-full rounded-lg bg-black">
                <source src={candidate.profileVideoUrl} />
              </video>
            </section>
          ) : null}

          <section className="mt-auto rounded-xl border border-white/15 bg-dgb-900/50 p-5">
            <h2 className="font-montserrat text-lg font-semibold">QR voting</h2>
            {candidate.qrImageUrl ? (
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                <Image src={candidate.qrImageUrl} alt={'QR voting ' + candidate.name} width={192} height={192} className="aspect-square rounded-lg bg-white object-contain p-2" />
                <div>
                  <p className="text-sm leading-6 text-white/80">Pindai kode untuk membuka kanal voting peserta.</p>
                  <p className="mt-2 text-sm font-semibold">Biaya per poin: {price}</p>
                  <a href={candidate.qrImageUrl} download={'qr-' + candidate.slug} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-fb px-4 py-2 text-sm font-semibold text-dgb-900">Unduh QR</a>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/75">QR voting belum tersedia.</p>
            )}
          </section>
        </div>
      </article>
    </main>
  );
}
