import BG from '@/components/next-image-bg';
import { typography } from '@/components/custom/typography';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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

  return (
    <main className="relative min-h-screen px-5 pt-20 pb-14 text-on-media md:px-12 md:pt-24 md:pb-16">
      <BG />
      <div className="pointer-events-none fixed inset-0 z-0 bg-radial-[at_50%_50%] from-transparent to-90% to-brand-800" />

      <div className="relative z-1 mx-auto max-w-6xl">
        <Link
          href={`/profil-${kind}/${cmsParticipant.categorySlug}`}
          className="mb-3 inline-flex items-center gap-2 py-1 text-sm font-medium text-on-media/90 transition-colors hover:text-highlight-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-canvas"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Semua {kind} {categoryName}
        </Link>

        <article className="relative overflow-hidden rounded-2xl border border-canvas/15 bg-brand-900/90 text-on-media shadow-xl backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-brand-950/90 via-brand-900/85 via-55% to-brand-900/45" />

          <div className="relative grid md:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]">
            <div className="relative order-first h-80 sm:h-96 md:order-last md:h-auto md:min-h-[32rem]">
              {portraitUrl ? (
                <>
                  <Image
                    src={portraitUrl}
                    alt={`${participantName}, ${categoryName}`}
                    fill
                    preload
                    sizes="(min-width: 1280px) 460px, (min-width: 768px) 40vw, 100vw"
                    className="object-cover object-[50%_15%] mask-[var(--portrait-mask-mobile)] md:mask-[var(--portrait-mask-desktop)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand-950/20 via-transparent to-brand-900/90 md:bg-linear-to-t md:from-brand-900/80 md:via-transparent md:to-brand-950/25"
                  />
                </>
              ) : (
                <div
                  role="img"
                  aria-label={`Foto ${participantName} belum tersedia`}
                  className="flex h-full min-h-80 items-center justify-center bg-brand-800/60 font-manrope text-5xl font-semibold text-highlight-300 mask-[var(--portrait-mask-mobile)] md:mask-[var(--portrait-mask-desktop)]"
                >
                  {participantName
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </div>
              )}
            </div>

            <div className="relative z-1 min-w-0 space-y-6 px-6 pt-4 pb-8 sm:px-8 md:px-10 md:py-9 lg:px-12">
              <header className="border-b border-canvas/15 pb-5">
                <h1 className="font-manrope text-3xl leading-tight font-semibold wrap-break-word text-on-media sm:text-4xl md:text-5xl">
                  {participantName}
                </h1>
              </header>

              {bioParagraphs.length > 0 && (
                <section aria-labelledby="bio-heading" className="space-y-3">
                  <h2 id="bio-heading" className="font-manrope text-lg font-semibold text-on-media">
                    Tentang saya
                  </h2>
                  <div className="space-y-3.5">
                    {bioParagraphs.map((paragraph, index) => (
                      <typography.p
                        key={index}
                        className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-on-media/90 sm:text-base"
                      >
                        {paragraph}
                      </typography.p>
                    ))}
                  </div>
                </section>
              )}

              {achievements.length > 0 && (
                <section aria-labelledby="achievements-heading" className="border-t border-canvas/15 pt-5">
                  <h2 id="achievements-heading" className="mb-3 font-manrope text-lg font-semibold text-on-media">
                    Prestasi
                  </h2>
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-on-media/90 marker:text-highlight-300">
                    {achievements.map((achievement, index) => (
                      <li key={index}>{achievement}</li>
                    ))}
                  </ul>
                </section>
              )}

              {cmsParticipant.profileVideoUrl && (
                <section aria-labelledby="video-heading" className="border-t border-canvas/15 pt-5">
                  <h2 id="video-heading" className="mb-3 font-manrope text-lg font-semibold text-on-media">
                    Video profil
                  </h2>
                  <video controls playsInline preload="metadata" className="aspect-video w-full rounded-lg bg-ink">
                    <source src={cmsParticipant.profileVideoUrl} type={cmsParticipant.profileVideoMimeType ?? undefined} />
                  </video>
                </section>
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
