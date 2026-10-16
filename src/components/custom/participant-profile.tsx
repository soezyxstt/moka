import BG from '@/components/next-image-bg';
import { typography } from '@/components/custom/typography';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import type { PublicEditionParticipant, PublicParticipantKind } from '@/server/cms/public-participant-readers';

export default function ParticipantProfile({
  participant: cmsParticipant,
  kind,
}: {
  participant: PublicEditionParticipant;
  kind: PublicParticipantKind;
}) {
  const categoryName = cmsParticipant.categoryName;
  const participantName = cmsParticipant.name;
  const portraitUrl = cmsParticipant.imageUrl;
  const bio = cmsParticipant.bio.trim();
  const bioParagraphs = bio
    ? bio
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : [];
  const achievements = cmsParticipant.achievements;
  const participantNumber = `${cmsParticipant.categoryCode}-${String(cmsParticipant.number).padStart(2, '0')}`;

  return (
    <main className="relative min-h-screen bg-brand-950/60 px-5 pt-28 pb-16 text-on-media md:px-12 md:pt-32 md:pb-24">
      <BG />
      <div className="pointer-events-none fixed inset-0 z-0 bg-radial-[at_50%_50%] from-brand-900/40 to-90% to-brand-950/90" />

      <div className="relative z-1 mx-auto max-w-6xl">
        <Link
          href={`/profil-${kind}/${cmsParticipant.categorySlug}`}
          className="mb-5 inline-flex items-center gap-2 rounded-md py-1.5 text-sm font-medium text-on-media/85 transition-colors hover:text-highlight-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-canvas"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Semua {kind} {categoryName}
        </Link>

        <article className="relative overflow-hidden rounded-2xl border border-canvas/15 bg-brand-950/90 shadow-2xl backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-900/95 via-brand-950/90 to-brand-900/75" />

          <div className="relative grid md:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.95fr)]">
            <div className="relative order-first h-80 sm:h-96 md:order-last md:h-full md:min-h-[34rem] md:max-h-[44rem] md:self-start">
              {portraitUrl ? (
                <>
                  <Image
                    src={portraitUrl}
                    alt={`${participantName}, ${categoryName}`}
                    fill
                    preload
                    sizes="(min-width: 1280px) 480px, (min-width: 768px) 42vw, 100vw"
                    className="object-cover object-[50%_18%] mask-[var(--portrait-mask-mobile)] md:mask-[var(--portrait-mask-desktop)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand-950/25 via-transparent to-brand-950/90 md:bg-linear-to-r md:from-brand-950/95 md:via-transparent md:to-brand-950/20"
                  />
                </>
              ) : (
                <div
                  role="img"
                  aria-label={`Foto ${participantName} belum tersedia`}
                  className="flex h-full min-h-80 items-center justify-center bg-brand-900/60 font-manrope text-5xl font-semibold text-highlight-300 mask-[var(--portrait-mask-mobile)] md:mask-[var(--portrait-mask-desktop)]"
                >
                  {participantName
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </div>
              )}
            </div>

            <div className="relative z-1 min-w-0 space-y-8 px-6 pt-4 pb-8 sm:px-8 md:px-12 md:py-12">
              <header className="space-y-3 border-b border-canvas/15 pb-6">
                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                  <span className="rounded-md bg-highlight-400 px-2.5 py-0.5 font-manrope text-xs font-bold tracking-wide text-ink">
                    {participantNumber}
                  </span>
                  <span className="font-inter font-medium text-highlight-300">
                    {categoryName} · {cmsParticipant.editionYear}
                  </span>
                </div>
                <h1 className="font-manrope text-3xl leading-tight font-semibold wrap-break-word text-on-media sm:text-4xl md:text-5xl">
                  {participantName}
                </h1>
              </header>

              {bioParagraphs.length > 0 && (
                <section aria-labelledby="bio-heading" className="space-y-3">
                  <h2 id="bio-heading" className="font-manrope text-sm font-bold tracking-wider text-highlight-300 uppercase">
                    Tentang saya
                  </h2>
                  <div className="space-y-4">
                    {bioParagraphs.map((paragraph, index) => (
                      <typography.p
                        key={index}
                        className="max-w-2xl whitespace-pre-line text-base leading-relaxed text-on-media/90"
                      >
                        {paragraph}
                      </typography.p>
                    ))}
                  </div>
                </section>
              )}

              {achievements.length > 0 && (
                <section
                  aria-labelledby="achievements-heading"
                  className="rounded-xl border border-canvas/12 bg-canvas/[0.04] p-5 sm:p-6"
                >
                  <h2 id="achievements-heading" className="mb-3.5 font-manrope text-sm font-bold tracking-wider text-highlight-300 uppercase">
                    Prestasi
                  </h2>
                  <ul className="space-y-2.5 text-sm leading-relaxed text-on-media/90">
                    {achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-highlight-400"
                        />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {cmsParticipant.profileVideoUrl && (
                <section
                  aria-labelledby="video-heading"
                  className="rounded-xl border border-canvas/12 bg-canvas/[0.04] p-5 sm:p-6"
                >
                  <h2 id="video-heading" className="mb-3.5 font-manrope text-sm font-bold tracking-wider text-highlight-300 uppercase">
                    Video profil
                  </h2>
                  <video controls playsInline preload="metadata" className="aspect-video w-full rounded-lg bg-ink">
                    <source src={cmsParticipant.profileVideoUrl} type={cmsParticipant.profileVideoMimeType ?? undefined} />
                  </video>
                </section>
              )}

              {cmsParticipant.qrImageUrl && (
                <aside
                  aria-labelledby="qr-heading"
                  className="flex flex-col items-start gap-4 rounded-xl border border-canvas/12 bg-canvas/[0.04] p-5 sm:flex-row sm:items-center sm:p-6"
                >
                  <Image
                    src={cmsParticipant.qrImageUrl}
                    alt={`QR voting ${participantName}`}
                    width={144}
                    height={144}
                    loading="eager"
                    className="size-36 shrink-0 rounded-lg bg-canvas object-contain p-2.5"
                  />
                  <div className="min-w-0 space-y-2">
                    <h2 id="qr-heading" className="font-manrope text-lg font-semibold text-on-media">
                      Dukung {participantName}
                    </h2>
                    <typography.p className="max-w-md text-sm leading-relaxed text-on-media/85">
                      Pindai QR untuk voting. Dari ponsel, buka dan simpan gambar QR.
                    </typography.p>
                    <a
                      href={cmsParticipant.qrImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-highlight-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-canvas"
                    >
                      Buka gambar QR <ArrowUpRight className="size-4" aria-hidden="true" />
                      <span className="sr-only"> (tab baru)</span>
                    </a>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
