import Image from "next/image";
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/custom/button';
import { typography } from '@/components/custom/typography';
import { formatCategoryName } from '@/components/footer';
import { resolveBrandLogos } from '@/server/cms/brand-assets';
import { getPublicHomeContent, getPublicNavigation, getPublicNews, getPublicSiteIdentity } from '@/server/cms/public-readers';

function cssBackground(url?: string) {
  return url ? `url(${JSON.stringify(url)})` : undefined;
}

function parseProgramItem(item: string | { title: string; description: string | null }) {
  const rawTitle = typeof item === 'string' ? item.trim() : item.title.trim();
  const rawDesc = typeof item === 'string' ? '' : (item.description?.trim() ?? '');

  const colonIndex = rawTitle.indexOf(':');
  if (colonIndex > 0) {
    const title = rawTitle.slice(0, colonIndex).trim();
    const extractedDesc = rawTitle.slice(colonIndex + 1).trim();
    return {
      title,
      description: rawDesc || extractedDesc,
    };
  }

  const cleanTitle = rawTitle.replace(/\.$/, '').trim();
  return {
    title: cleanTitle,
    description: rawDesc || 'Ajang pemilihan dan pembinaan duta budaya, pariwisata, serta generasi muda Kabupaten Garut.',
  };
}

function resolvePhilosophyCards(title: string | null | undefined, body: string | null | undefined) {
  const parts = (title ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const firstTitle = parts[0] || 'Niti Harti';
  const secondTitle = parts[1] || 'Nanjeur Bukti';
  const isNitiHarti = /niti\s+harti/i.test(firstTitle) || /nanjeur\s+bukti/i.test(secondTitle);

  if (isNitiHarti) {
    return [
      {
        title: firstTitle,
        description:
          'Menapaki setiap langkah dengan ilmu pengetahuan, pemahaman karakter, serta keluhuran budi pekerti Sunda yang berakar kuat.',
      },
      {
        title: secondTitle,
        description:
          'Menegakkan bukti konkret melalui prestasi, keteladanan generasi muda, dan kontribusi berdampak bagi kemajuan Kabupaten Garut.',
      },
    ];
  }

  const sentences = (body ?? '')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return [
    {
      title: firstTitle,
      description:
        sentences[0] ||
        'Menjaga jati diri generasi muda Kabupaten Garut yang berwawasan luas, berbudaya, dan berdaya saing.',
    },
    {
      title: secondTitle,
      description:
        sentences.slice(1).join(' ') ||
        'Mewujudkan gagasan menjadi aksi kolaboratif yang memberi manfaat nyata bagi pariwisata, budaya, dan masyarakat.',
    },
  ];
}

function formatNewsDate(date: Date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

function isPressReleaseItem(title: string, type: 'file' | 'link') {
  return type === 'file' || /press\s*release|siaran\s*pers|pengumuman|semifinalis|finalis/i.test(title);
}

function GununganOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 180"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M60 8L108 116C113 128 104 142 91 142H29C16 142 7 128 12 116L60 8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M60 28L94 108C98 117 91 128 81 128H39C29 128 22 117 26 108L60 28Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <path
        d="M60 48L78 96H42L60 48Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="60" cy="112" r="6" fill="currentColor" fillOpacity="0.25" />
      <path d="M24 156H96M36 168H84" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function Home() {
  const [home, newsItems, navigation, identity] = await Promise.all([
    getPublicHomeContent(),
    getPublicNews(),
    getPublicNavigation(),
    getPublicSiteIdentity(),
  ]);
  const logos = resolveBrandLogos(identity.assets, identity.edition);
  const bannerLogo = logos.footer ?? logos.desktop;
  const hero = home.sections.hero;
  const program = home.sections.program;
  const news = home.sections.berita;
  const cta = home.sections.ajakan;
  const ctaAction = cta?.actionLabel && cta.actionHref ? { label: cta.actionLabel, href: cta.actionHref } : null;
  const textPrograms = program?.body?.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) ?? [];
  const rawPrograms = home.programs.length ? home.programs : textPrograms;
  const programItems = rawPrograms.map(parseProgramItem);
  const heroImage = home.assets['home.hero.fg'] ?? home.assets['home.hero.placeholder'];
  const collage = [
    'home.programs.collage.1',
    'home.programs.collage.2',
    'home.programs.collage.3',
    'home.programs.collage.4',
  ].flatMap((slot) => {
    const asset = home.assets[slot];
    return asset ? [asset] : [];
  });

  const hasHero = Boolean(hero?.title?.trim() || hero?.body?.trim() || home.assets['home.hero.bg'] || heroImage);
  const hasProgram = Boolean(program?.title?.trim() || programItems.length || home.assets['home.programs.bg'] || collage.length);
  const hasNews = Boolean(news?.title?.trim() || news?.body?.trim() || newsItems.length || home.assets['home.news.bg']);
  const hasCta = Boolean(cta?.title?.trim() || cta?.body?.trim() || ctaAction || home.assets['home.cta.bg'] || home.assets['home.cta.image']);
  const hasEvents = navigation.events.length > 0;

  if (!hasHero && !hasProgram && !hasNews && !hasCta) {
    return (
      <main className="grid min-h-screen place-items-center px-8">
        <p className="font-inter text-sm text-muted-foreground">Konten beranda belum diterbitkan untuk edisi ini.</p>
      </main>
    );
  }

  const participantRoleLabel = navigation.participantKind === 'semifinalis' ? 'Semifinalis' : 'Finalis';
  const primaryCategory = navigation.categories[0];
  const participantProfileHref = primaryCategory
    ? `/profil-${navigation.participantKind}/${primaryCategory.slug}`
    : '/voting';
  const philosophyHeading = cta?.title?.trim() || navigation.edition.slogan || 'Niti Harti, Nanjeur Bukti';
  const philosophyCards = resolvePhilosophyCards(philosophyHeading, cta?.body);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* 1. HERO SECTION */}
      {hasHero ? (
        <section
          className="relative grid min-h-[75svh] place-items-center overflow-hidden bg-brand-900 bg-cover bg-center px-8 pb-16 pt-28 md:min-h-screen md:px-20 md:py-28"
          id="hero"
          style={{ backgroundImage: cssBackground(home.assets['home.hero.bg']?.url) }}
        >
          <div aria-hidden className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent to-90% to-brand-800" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-brand-950/60 to-transparent" />
          <div className={`relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 md:gap-12 ${heroImage ? 'md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)]' : ''}`}>
            {hero?.title?.trim() || hero?.body?.trim() ? (
              <div className="text-canvas">
                {hero.title?.trim() ? (
                  <h1 data-reveal="" className="max-w-2xl font-manrope !text-3xl font-semibold leading-tight sm:!text-4xl md:!text-5xl">
                    {hero.title.trim()}
                  </h1>
                ) : null}
                {hero.body?.trim() ? (
                  <p data-reveal="" className="mt-4 max-w-xl text-left text-base italic text-canvas/90 sm:text-lg md:text-2xl">
                    {hero.body.trim()}
                  </p>
                ) : null}
                <div data-reveal="" className="mt-8 flex flex-wrap items-center gap-3.5">
                  {navigation.registrationVisible ? (
                    <Button asChild size="lg" className="bg-highlight-400 font-semibold text-neutral-950 hover:bg-highlight-300">
                      <Link href="/pendaftaran">
                        Daftar Pasanggiri <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="bg-highlight-400 font-semibold text-neutral-950 hover:bg-highlight-300">
                      <Link href="/voting">
                        Voting Sekarang <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-canvas/35 bg-canvas/10 text-canvas backdrop-blur-xs hover:border-highlight-300 hover:bg-canvas/20 hover:text-canvas"
                  >
                    <Link href={participantProfileHref}>
                      Lihat Profil {participantRoleLabel}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
            {heroImage ? (
              <div data-reveal="" className="mx-auto w-full max-w-2xl">
                <Image
                  src={heroImage.url}
                  alt={heroImage.alt ?? ''}
                  width={1600}
                  height={900}
                  className="h-auto max-h-[65svh] w-full object-contain translate-y-[10vh]"
                  preload
                  sizes="(max-width: 768px) calc(100vw - 64px), (max-width: 1280px) 50vw, 672px"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 2. THEME PHILOSOPHY ("Niti Harti, Nanjeur Bukti") */}
      {hasCta ? (
        <section
          id="filosofi-tema"
          className="relative isolate overflow-hidden border-b border-neutral-200/70 bg-neutral-50 px-8 py-16 md:px-20 md:py-24"
        >
          <div className="mx-auto max-w-5xl">
            <div className="relative flex flex-col items-center">
              <GununganOrnament className="pointer-events-none absolute -left-8 top-0 hidden h-40 w-24 text-brand-700/12 lg:block" />
              <GununganOrnament className="pointer-events-none absolute -right-8 top-0 hidden h-40 w-24 text-brand-700/12 lg:block" />

              <div className="max-w-3xl text-center">
                <typography.h1 className="text-3xl text-brand-900 md:text-5xl">
                  {philosophyHeading}
                </typography.h1>
              </div>

              {cta?.body?.trim() ? (
                <div className="mt-6 w-full max-w-prose">
                  <typography.p className="text-left leading-relaxed text-body">
                    {cta.body.trim()}
                  </typography.p>
                </div>
              ) : null}

              <div className="mt-12 grid w-full grid-cols-1 divide-y divide-neutral-200 border-y border-neutral-200 md:grid-cols-2 md:divide-x md:divide-y-0">
                {philosophyCards.map((card, index) => (
                  <div
                    key={card.title}
                    data-reveal=""
                    className={`py-6 md:py-8 ${index === 0 ? 'md:pr-10' : 'md:pl-10'}`}
                  >
                    <h3 className="font-manrope text-xl font-semibold text-brand-900 md:text-2xl">
                      {card.title}
                    </h3>
                    <p className="mt-2.5 text-left font-inter text-sm leading-relaxed text-neutral-600 md:text-base">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>

              {ctaAction ? (
                <div className="mt-8 flex justify-center">
                  <Button data-reveal="" asChild size="lg">
                    <Link
                      href={ctaAction.href}
                      target={/^https?:\/\//i.test(ctaAction.href) ? "_blank" : undefined}
                      rel={/^https?:\/\//i.test(ctaAction.href) ? "noopener noreferrer" : undefined}
                    >
                      {ctaAction.label} <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* 3. RANGKAIAN KEGIATAN / TIMELINE */}
      {hasEvents ? (
        <section
          id="rangkaian-kegiatan"
          className="relative border-b border-neutral-200/70 bg-background px-8 py-16 md:px-20 md:py-24"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
              <div>
                <typography.h1 className="text-brand-900">Rangkaian Kegiatan</typography.h1>
                <typography.p className="mt-2 max-w-2xl text-left text-neutral-600">
                  Tahapan seleksi, pembekalan, hingga malam puncak Pasanggiri Mojang Jajaka Kabupaten Garut.
                </typography.p>
              </div>
              <Link
                href={`/rangkaian-kegiatan/${navigation.events[0].slug}`}
                className="inline-flex w-fit items-center gap-2 font-inter text-sm font-semibold text-brand transition-colors hover:text-highlight-700"
              >
                Jelajahi tahapan <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="divide-y divide-neutral-200 border-y border-neutral-200">
              {navigation.events.map((event) => (
                <Link
                  key={event.slug}
                  href={`/rangkaian-kegiatan/${event.slug}`}
                  data-reveal=""
                  className="group grid grid-cols-1 gap-2 py-5 transition-colors hover:bg-neutral-50/80 md:grid-cols-12 md:items-baseline md:gap-8 md:px-4"
                >
                  <h3 className="font-manrope text-lg font-semibold capitalize text-brand-900 transition-colors group-hover:text-brand md:col-span-4">
                    {event.label}
                  </h3>
                  <p className="line-clamp-2 text-left font-inter text-sm leading-relaxed text-neutral-600 md:col-span-7">
                    {event.desc || `Dokumentasi dan informasi lengkap mengenai rangkaian kegiatan ${event.label}.`}
                  </p>
                  <div className="mt-1 inline-flex items-center gap-1.5 font-inter text-sm font-medium text-brand group-hover:text-highlight-700 md:col-span-1 md:mt-0 md:justify-end">
                    <span className="md:sr-only">Lihat kegiatan</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. PROGRAM UNGGULAN SECTION */}
      {hasProgram ? (
        <section
          id="section-1"
          className="relative border-b border-neutral-200/70 bg-neutral-50 px-8 py-16 md:px-20 md:py-24"
        >
          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {collage.length ? (
              <div data-reveal="" className="grid grid-cols-2 gap-4 lg:col-span-5">
                {collage.map((asset, index) => (
                  <div
                    key={asset.url}
                    className={`relative overflow-hidden rounded-2xl bg-canvas shadow-md ${
                      collage.length === 1 ? 'col-span-2 aspect-video' : 'aspect-[4/5]'
                    }`}
                  >
                    <Image
                      src={asset.url}
                      alt={asset.alt?.trim() || `Dokumentasi program unggulan ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      sizes="(max-width: 768px) 45vw, (max-width: 1280px) 22vw, 280px"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className={collage.length ? 'lg:col-span-7' : 'lg:col-span-12'}>
              {program?.title?.trim() ? (
                <div className="mb-8">
                  <typography.h1 className="text-brand-900">
                    {program.title.trim()}
                  </typography.h1>
                </div>
              ) : null}

              {programItems.length ? (
                <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
                  {programItems.map((item) => (
                    <div
                      key={item.title}
                      data-reveal=""
                      className="border-t border-neutral-200 pt-4"
                    >
                      <h3 className="font-manrope text-base font-semibold text-brand-900 md:text-lg">
                        {item.title}
                      </h3>
                      {item.description ? (
                        <p className="mt-1 text-left font-inter text-sm leading-relaxed text-neutral-600">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. BERITA DAN UPDATE SECTION */}
      {hasNews ? (
        <section
          id="section-2"
          className="relative border-b border-neutral-200/70 bg-background px-8 py-16 md:px-20 md:py-24"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
              <div>
                {news?.title?.trim() ? (
                  <typography.h1 className="text-brand-900">
                    {news.title.trim()}
                  </typography.h1>
                ) : null}
                {news?.body?.trim() ? (
                  <typography.p className="mt-2 max-w-2xl text-left text-neutral-600">
                    {news.body.trim()}
                  </typography.p>
                ) : null}
              </div>
              {newsItems.length ? (
                <Link
                  href="/berita"
                  className="inline-flex w-fit shrink-0 items-center gap-2 font-inter text-sm font-semibold text-brand transition-colors hover:text-highlight-700"
                >
                  Lihat Semua Berita <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            {newsItems.length === 0 ? (
              <p className="font-inter text-sm text-muted-foreground">Belum ada berita terbit untuk edisi ini.</p>
            ) : newsItems.length <= 2 ? (
              <div className="space-y-6">
                {newsItems.map((item) => {
                  const isPressRelease = isPressReleaseItem(item.title, item.type);
                  const formattedDate = formatNewsDate(item.date);
                  const isExternal = !item.isInternal && /^https?:\/\//i.test(item.link);
                  return (
                    <article
                      data-reveal=""
                      key={item.link + item.title}
                      className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200/90 bg-canvas shadow-xs transition-all hover:border-brand-300 hover:shadow-md md:grid-cols-12"
                    >
                      <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-linear-to-br from-brand-800 via-brand-700 to-brand-950 p-6 text-canvas md:col-span-5 md:p-8">
                        {!isPressRelease && item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-102"
                            sizes="(max-width: 768px) 100vw, 480px"
                          />
                        ) : null}
                        <div className="pointer-events-none absolute inset-0 bg-radial-[at_85%_15%] from-highlight-400/20 to-transparent" />

                        <div className="relative z-10">
                          {bannerLogo?.url ? (
                            <Image
                              src={bannerLogo.url}
                              alt={bannerLogo.alt || 'MOKA Garut'}
                              unoptimized={bannerLogo.mimeType === 'image/svg+xml' || bannerLogo.url.endsWith('.svg')}
                              width={220}
                              height={80}
                              className="h-12 w-auto object-contain object-left md:h-14"
                            />
                          ) : (
                            <p className="font-manrope text-xl font-bold text-canvas">MOKA Garut</p>
                          )}
                        </div>

                        <div className="relative z-10 mt-8">
                          <p className="font-manrope text-lg font-semibold leading-snug text-canvas md:text-xl">
                            Siaran Pers & Informasi Resmi PAMOKA Garut
                          </p>
                          {formattedDate ? (
                            <p className="mt-1.5 font-inter text-xs text-canvas/75">
                              Diterbitkan {formattedDate}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between p-6 md:col-span-7 md:p-8">
                        <div>
                          {formattedDate ? (
                            <p className="mb-2 font-inter text-xs font-medium text-neutral-500">
                              {formattedDate}
                            </p>
                          ) : null}
                          <h3 className="font-manrope text-xl font-bold leading-snug text-brand-900 md:text-2xl">
                            <Link
                              href={item.link}
                              target={isExternal ? '_blank' : undefined}
                              rel={isExternal ? 'noopener noreferrer' : undefined}
                              className="transition-colors hover:text-brand"
                            >
                              {item.title}
                            </Link>
                          </h3>
                          <p className="mt-3 text-left font-inter text-sm leading-relaxed text-neutral-600 md:text-base">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-4 pt-2">
                          <Button asChild>
                            <Link
                              href={item.link}
                              target={isExternal ? '_blank' : undefined}
                              rel={isExternal ? 'noopener noreferrer' : undefined}
                            >
                              Baca Selengkapnya <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                            </Link>
                          </Button>
                          <Link
                            href={participantProfileHref}
                            className="inline-flex min-h-9 items-center gap-1.5 font-inter text-sm font-semibold text-brand transition-colors hover:text-highlight-700"
                          >
                            Lihat daftar {participantRoleLabel.toLowerCase()} <ArrowRight className="size-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                {newsItems.map((item) => {
                  const formattedDate = formatNewsDate(item.date);
                  const isExternal = !item.isInternal && /^https?:\/\//i.test(item.link);
                  return (
                    <article
                      data-reveal=""
                      key={item.link + item.title}
                      className="group grid grid-cols-1 gap-4 py-6 md:grid-cols-12 md:items-baseline md:gap-8"
                    >
                      <div className="md:col-span-3">
                        {formattedDate ? (
                          <p className="font-inter text-xs font-medium text-neutral-500">{formattedDate}</p>
                        ) : null}
                      </div>
                      <div className="md:col-span-7">
                        <h3 className="font-manrope text-lg font-bold text-brand-900">
                          <Link
                            href={item.link}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            className="transition-colors hover:text-brand"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-left font-inter text-sm leading-relaxed text-neutral-600">
                          {item.description}
                        </p>
                      </div>
                      <div className="md:col-span-2 md:flex md:justify-end">
                        <Link
                          href={item.link}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          className="inline-flex items-center gap-1.5 font-inter text-sm font-semibold text-brand transition-colors hover:text-highlight-700"
                        >
                          Baca <ArrowRight aria-hidden="true" size={16} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 6. DEDICATED CONVERSION SECTION (VOTING / PENDAFTARAN / PROFIL) */}
      <section
        id="partisipasi"
        className="relative bg-neutral-50 px-8 py-16 md:px-20 md:py-24"
      >
        <div className="mx-auto grid w-full max-w-7xl items-start gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <typography.h1 className="text-brand-900">
              Kenali Para {participantRoleLabel} & Berikan Dukungan Anda
            </typography.h1>
            <p className="mt-3 max-w-xl text-left font-inter text-base leading-relaxed text-neutral-600">
              Telusuri profil lengkap peserta di setiap kategori atau berikan dukungan suara Anda secara langsung melalui halaman voting resmi Pasanggiri Mojang Jajaka Kabupaten Garut.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <Button asChild size="lg">
                <Link href="/voting">
                  Buka Halaman Voting <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              {navigation.registrationVisible ? (
                <Button asChild size="lg" variant="outline">
                  <Link href="/pendaftaran">
                    Informasi Pendaftaran
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {navigation.categories.length ? (
            <div className="divide-y divide-neutral-200 border-y border-neutral-200 lg:col-span-6">
              {navigation.categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/profil-${navigation.participantKind}/${category.slug}`}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:text-brand md:px-2"
                >
                  <span className="font-manrope text-lg font-semibold text-brand-900 transition-colors group-hover:text-brand">
                    Profil {participantRoleLabel} {formatCategoryName(category)}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
