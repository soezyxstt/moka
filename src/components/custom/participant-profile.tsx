import BG from '@/components/next-image-bg';
import { typography } from '@/components/custom/typography';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import type { PublicEditionParticipant, PublicParticipantKind } from '@/server/cms/public-participant-readers';

export default function ParticipantProfile({ participant: cmsParticipant, kind }: {
  participant: PublicEditionParticipant;
  kind: PublicParticipantKind;
}) {
  const categoryName = cmsParticipant.categoryName;
  const participantName = cmsParticipant.name;
  const portraitUrl = cmsParticipant.imageUrl;
  const bio = cmsParticipant.bio;
  const achievements = cmsParticipant.achievements;

  return (
    <main className="relative min-h-screen px-5 pt-28 pb-12 md:px-12 md:pt-32 md:pb-20">
      <BG />
      <div className="pointer-events-none fixed inset-0 z-0 bg-radial-[at_50%_50%] from-transparent to-90% to-brand-800" />
      <article className="relative z-1 mx-auto max-w-6xl overflow-hidden rounded-3xl border border-canvas/15 bg-canvas/10 text-canvas backdrop-blur-[2px] md:rounded-[48px]">
        <div className="pointer-events-none absolute inset-0 bg-brand-900/85 md:bg-transparent md:bg-linear-to-r md:from-brand-900/95 md:via-brand-900/85 md:via-60% md:to-brand-900/35" />
        <div className="relative grid md:grid-cols-[1.2fr_1fr]">
          <header className="min-w-0 px-6 pt-8 pb-6 md:px-12 md:pt-12 md:pb-8">
            <Link href={`/profil-${kind}/${cmsParticipant.categorySlug}`} className="mb-8 inline-flex items-center gap-2 text-sm text-canvas/90 transition-colors hover:text-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-canvas">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Semua {kind}
            </Link>
            <p className="mb-3 font-inter text-sm text-highlight-300">{categoryName} · {cmsParticipant.editionYear}</p>
            <h1 className="font-manrope text-4xl leading-tight font-semibold wrap-break-word md:text-5xl">{participantName}</h1>
            {cmsParticipant.qrImageUrl && (
              <aside aria-labelledby="qr-heading" className="mt-6 flex flex-col items-start gap-4 border-t border-canvas/20 pt-6 sm:flex-row sm:items-center">
                <Image src={cmsParticipant.qrImageUrl} alt={`QR voting ${participantName}`} width={160} height={160} loading="eager" className="size-40 shrink-0 rounded-lg bg-canvas object-contain p-3" />
                <div className="min-w-0 space-y-3">
                  <h2 id="qr-heading" className="font-manrope text-xl font-semibold">Dukung {participantName}</h2>
                  <typography.p className="max-w-md text-sm leading-relaxed text-canvas/90">Pindai QR untuk voting. Dari ponsel, buka dan simpan gambar QR.</typography.p>
                  <a href={cmsParticipant.qrImageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-highlight-300 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-canvas">
                    Buka gambar QR <ArrowUpRight className="size-4" aria-hidden="true" /><span className="sr-only"> (tab baru)</span>
                  </a>
                </div>
              </aside>
            )}
          </header>
          <div className="relative min-h-80 md:col-start-2 md:row-span-2 md:row-start-1 md:min-h-[36rem]">
            {portraitUrl ? (
              <Image src={portraitUrl} alt={`${participantName}, ${categoryName}`} fill preload sizes="(min-width: 1280px) 520px, (min-width: 768px) 45vw, 100vw" className="object-cover object-top mask-[var(--portrait-mask-mobile)] md:mask-[var(--portrait-mask-desktop)]" />
            ) : (
              <div role="img" aria-label={`Foto ${participantName} belum tersedia`} className="flex h-full min-h-80 items-center justify-center bg-brand-50 font-manrope text-5xl font-semibold text-brand-900">
                {participantName.split(' ').map((part) => part[0]).slice(0, 2).join('')}
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-8 px-6 py-8 md:px-12 md:pt-0 md:pb-12">
            {bio && (
              <section aria-labelledby="bio-heading">
                <h2 id="bio-heading" className="mb-4 font-manrope text-lg font-semibold">Tentang saya</h2>
                <typography.p className="whitespace-pre-line leading-relaxed text-canvas/85">{bio}</typography.p>
              </section>
            )}
            {achievements.length > 0 && (
              <section aria-labelledby="achievements-heading" className="border-t border-canvas/15 pt-6">
                <h2 id="achievements-heading" className="mb-4 font-manrope text-lg font-semibold">Prestasi</h2>
                <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-canvas/85 marker:text-highlight-300">
                  {achievements.map((achievement, index) => <li key={index}>{achievement}</li>)}
                </ul>
              </section>
            )}
            {cmsParticipant.profileVideoUrl && (
              <section aria-labelledby="video-heading" className="border-t border-canvas/15 pt-6">
                <h2 id="video-heading" className="mb-4 font-manrope text-lg font-semibold">Video profil</h2>
                <video controls playsInline preload="metadata" className="aspect-video w-full rounded-lg bg-ink">
                  <source src={cmsParticipant.profileVideoUrl} type={cmsParticipant.profileVideoMimeType ?? undefined} />
                </video>
              </section>
            )}
          </div>
        </div>

      </article>
    </main>
  );
}
