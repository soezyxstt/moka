import Image from "next/image";
import Link from 'next/link';
import { ArrowRight, Calendar, Compass, FileText, Vote } from 'lucide-react';
import { Button } from '@/components/custom/button';
import { typography } from '@/components/custom/typography';
import { formatCategoryName } from '@/components/footer';
import { getPublicHomeContent, getPublicNavigation, getPublicNews } from '@/server/cms/public-readers';

function cssBackground(url?: string) {
  return url ? `url(${JSON.stringify(url)})` : undefined;
}

function parseProgramItem(item: string | { title: string; description: string | null }) {
  if (typeof item !== 'string') {
    return {
      title: item.title.trim(),
      description: item.description?.trim() || 'Program pengembangan kapasitas, budaya, dan kolaborasi sosial Paguyuban Mojang Jajaka Kabupaten Garut.',
    };
  }
  const colonIndex = item.indexOf(':');
  if (colonIndex > 0) {
    return {
      title: item.slice(0, colonIndex).trim(),
      description: item.slice(colonIndex + 1).trim(),
    };
  }
  return {
    title: item.trim(),
    description: 'Program kerja dan pengabdian masyarakat Paguyuban Mojang Jajaka Kabupaten Garut.',
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
        badge: 'Pilar Pertama',
        title: firstTitle,
        subtitle: 'Landasan Makna & Kebijaksanaan',
        description:
          'Menapaki setiap langkah dengan ilmu pengetahuan, pemahaman karakter, serta keluhuran budi pekerti Sunda yang berakar kuat.',
      },
      {
        badge: 'Pilar Kedua',
        title: secondTitle,
        subtitle: 'Wujud Karya & Pengabdian Nyata',
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
      badge: 'Pilar Pertama',
      title: firstTitle,
      subtitle: 'Nilai Dasar & Pemahaman',
      description:
        sentences[0] ||
        'Menjaga jati diri generasi muda Kabupaten Garut yang berwawasan luas, berbudaya, dan berdaya saing.',
    },
    {
      badge: 'Pilar Kedua',
      title: secondTitle,
      subtitle: 'Implementasi & Kontribusi',
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
  const [home, newsItems, navigation] = await Promise.all([
    getPublicHomeContent(),
    getPublicNews(),
    getPublicNavigation(),
  ]);
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
  const allNewsHref = newsItems[0]?.link ?? '#section-2';
  const allNewsExternal = /^https?:\/\//i.test(allNewsHref);

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
                <p data-reveal="" className="mb-3 inline-flex items-center gap-2 rounded-md border border-highlight-400/40 bg-brand-950/40 px-3 py-1 font-manrope text-xs font-bold uppercase tracking-wider text-highlight-300 backdrop-blur-xs">
                  {hero?.eyebrow?.trim() || `Pasanggiri Mojang Jajaka Kabupaten Garut ${navigation.edition.year}`}
                </p>
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
                        <Vote className="mr-2 size-4" aria-hidden="true" />
                        Voting Sekarang
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
                  {navigation.registrationVisible ? (
                    <Link
                      href="/voting"
                      className="inline-flex min-h-10 items-center gap-1.5 px-2 font-inter text-sm font-medium text-highlight-300 underline-offset-4 hover:underline"
                    >
                      Halaman Voting <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  ) : null}
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
                  className="h-auto max-h-[65svh] w-full object-contain"
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
          className="relative isolate overflow-hidden border-b border-neutral-200/60 bg-linear-to-b from-neutral-50 via-background to-neutral-50 px-8 py-16 md:px-20 md:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="relative flex flex-col items-center">
              <GununganOrnament className="pointer-events-none absolute -left-6 top-0 hidden h-44 w-28 text-brand-700/15 lg:block" />
              <GununganOrnament className="pointer-events-none absolute -right-6 top-0 hidden h-44 w-28 text-brand-700/15 lg:block" />

              <div className="max-w-3xl text-center">
                <typography.t1 className="text-brand-600">
                  {cta?.eyebrow?.trim() || `Filosofi Tema Pasanggiri ${navigation.edition.year}`}
                </typography.t1>
                <typography.h1 className="mt-2 text-3xl text-brand-900 md:text-5xl">
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

              <div className="mt-10 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                {philosophyCards.map((card) => (
                  <div
                    key={card.title}
                    data-reveal=""
                    className="group relative overflow-hidden rounded-2xl border border-brand-200/60 bg-canvas/90 p-6 shadow-xs backdrop-blur-xs transition-all hover:border-highlight-400 hover:shadow-md md:p-8"
                  >
                    <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-highlight-100/40 transition-transform duration-500 group-hover:scale-125" />
                    <span className="inline-flex items-center rounded-md bg-brand-50 px-2.5 py-1 font-manrope text-xs font-bold uppercase tracking-wider text-brand-700">
                      {card.badge}
                    </span>
                    <h3 className="mt-3 font-manrope text-2xl font-bold text-brand-900">
                      {card.title}
                    </h3>
                    <p className="mt-1 font-manrope text-sm font-semibold text-highlight-700">
                      {card.subtitle}
                    </p>
                    <p className="mt-3 text-left font-inter text-sm leading-relaxed text-neutral-600">
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
          className="relative border-b border-neutral-200/60 bg-background px-8 py-16 md:px-20 md:py-24"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
              <div>
                <typography.t1 className="text-brand-600">Alur Pelaksanaan</typography.t1>
                <typography.h1 className="mt-1 text-brand-900">Rangkaian Kegiatan</typography.h1>
                <typography.p className="mt-2 max-w-2xl text-left text-neutral-600">
                  Ikuti setiap tahapan seleksi, pembekalan, hingga malam puncak Pasanggiri Mojang Jajaka Kabupaten Garut.
                </typography.p>
              </div>
              <Link
                href={`/rangkaian-kegiatan/${navigation.events[0].slug}`}
                className="inline-flex w-fit items-center gap-2 font-inter text-sm font-semibold text-brand transition-colors hover:text-highlight-700"
              >
                Jelajahi tahapan <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {navigation.events.map((event, index) => (
                <Link
                  key={event.slug}
                  href={`/rangkaian-kegiatan/${event.slug}`}
                  data-reveal=""
                  className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-6 transition-all hover:border-highlight-400 hover:bg-canvas hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-200/80 bg-brand-50 px-2.5 py-1 font-manrope text-xs font-bold text-brand-800">
                        <Calendar className="size-3.5 text-brand-600" aria-hidden="true" />
                        Tahap {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-manrope text-xs font-semibold text-neutral-500 group-hover:text-brand">
                        Detail kegiatan
                      </span>
                    </div>
                    <h3 className="mt-4 font-manrope text-lg font-bold capitalize text-brand-900 transition-colors group-hover:text-brand">
                      {event.label}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-left font-inter text-sm leading-relaxed text-neutral-600">
                      {event.desc || `Dokumentasi dan informasi lengkap mengenai rangkaian kegiatan ${event.label}.`}
                    </p>
                  </div>
                  <div className="mt-5 inline-flex items-center gap-1.5 font-inter text-xs font-semibold text-brand group-hover:text-highlight-700">
                    Lihat dokumentasi <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
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
          className="relative border-b border-neutral-200/60 bg-neutral-50 px-8 py-16 md:px-20 md:py-24"
        >
          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {collage.length ? (
              <div data-reveal="" className="grid grid-cols-2 gap-4 lg:col-span-5">
                {collage.map((asset, index) => (
                  <div
                    key={asset.url}
                    className={`relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-canvas shadow-md ${
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
              <div className="mb-8">
                <typography.t1 className="text-brand-600">
                  {program?.eyebrow?.trim() || 'Inisiatif & Aksi Paguyuban'}
                </typography.t1>
                {program?.title?.trim() ? (
                  <typography.h1 className="mt-1 text-brand-900">
                    {program.title.trim()}
                  </typography.h1>
                ) : null}
                <typography.p className="mt-2 max-w-2xl text-left text-neutral-600">
                  Berbagai program kolaboratif Mojang Jajaka Kabupaten Garut dalam pengembangan pemuda, pariwisata, budaya, dan kepedulian sosial.
                </typography.p>
              </div>

              {programItems.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {programItems.map((item, idx) => (
                    <div
                      key={item.title}
                      data-reveal=""
                      className="flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-canvas p-5 shadow-xs transition-all hover:border-highlight-400 hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center rounded-md bg-brand-900 px-2.5 py-1 font-manrope text-xs font-bold tracking-wide text-canvas">
                            {item.title}
                          </span>
                          <span className="font-manrope text-xs font-bold text-neutral-400">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <p className="mt-3 text-left font-inter text-sm leading-relaxed text-neutral-600">
                          {item.description}
                        </p>
                      </div>
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
          className="relative border-b border-neutral-200/60 bg-background px-8 py-16 md:px-20 md:py-24"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
              <div>
                <typography.t1 className="text-brand-600">
                  {news?.eyebrow?.trim() || 'Publikasi Resmi'}
                </typography.t1>
                {news?.title?.trim() ? (
                  <typography.h1 className="mt-1 text-brand-900">
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
                  href={allNewsHref}
                  target={allNewsExternal ? '_blank' : undefined}
                  rel={allNewsExternal ? 'noopener noreferrer' : undefined}
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
                      className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50 shadow-xs transition-all hover:border-highlight-400 hover:shadow-md md:grid-cols-12"
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
                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-highlight-400 px-3 py-1 font-manrope text-xs font-bold uppercase tracking-wider text-neutral-950">
                            <FileText className="size-3.5" aria-hidden="true" />
                            {isPressRelease ? 'PRESS RELEASE' : 'BERITA RESMI'}
                          </span>
                          {formattedDate ? (
                            <span className="font-inter text-xs font-medium text-canvas/80">
                              {formattedDate}
                            </span>
                          ) : null}
                        </div>

                        <div className="relative z-10 my-6 flex items-center gap-4">
                          {navigation.edition.logoUrl ? (
                            <Image
                              src={navigation.edition.logoUrl}
                              alt={navigation.edition.logoAlt || 'Logo MOKA Garut'}
                              width={88}
                              height={88}
                              className="size-16 shrink-0 object-contain md:size-20"
                            />
                          ) : null}
                          <div>
                            <p className="font-manrope text-xs font-semibold uppercase tracking-widest text-highlight-300">
                              Paguyuban Mojang Jajaka
                            </p>
                            <p className="mt-1 font-manrope text-lg font-bold leading-snug text-canvas">
                              Siaran Pers & Informasi Resmi Kabupaten Garut
                            </p>
                          </div>
                        </div>

                        <p className="relative z-10 font-inter text-xs text-canvas/75">
                          Dokumen publikasi resmi PAMOKA Garut
                        </p>
                      </div>

                      <div className="flex flex-col justify-between p-6 md:col-span-7 md:p-8">
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500">
                            <span className="font-semibold text-brand-700">Publikasi PAMOKA Garut</span>
                            {formattedDate ? <span>• {formattedDate}</span> : null}
                          </div>
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {newsItems.map((item) => {
                  const isPressRelease = isPressReleaseItem(item.title, item.type);
                  const formattedDate = formatNewsDate(item.date);
                  const isExternal = !item.isInternal && /^https?:\/\//i.test(item.link);
                  return (
                    <article
                      data-reveal=""
                      key={item.link + item.title}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50 transition-all hover:border-highlight-400 hover:bg-canvas hover:shadow-md"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-linear-to-br from-brand-800 to-brand-950 p-5 text-canvas">
                        {!isPressRelease && item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-102"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                          />
                        ) : (
                          <div className="flex h-full flex-col justify-between">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-highlight-400 px-2.5 py-1 font-manrope text-[11px] font-bold uppercase tracking-wider text-neutral-950">
                              {isPressRelease ? 'PRESS RELEASE' : 'BERITA'}
                            </span>
                            <p className="font-manrope text-base font-bold text-canvas">
                              Siaran Pers Resmi PAMOKA Garut
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        {formattedDate ? (
                          <p className="mb-1.5 font-inter text-xs text-neutral-500">{formattedDate}</p>
                        ) : null}
                        <h3 className="mb-2.5 line-clamp-2 font-manrope text-lg font-bold text-brand-900">
                          <Link
                            href={item.link}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            className="transition-colors hover:text-brand"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <p className="line-clamp-3 flex-grow text-left font-inter text-sm leading-relaxed text-neutral-600">
                          {item.description}
                        </p>
                        <Link
                          href={item.link}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          className="mt-4 inline-flex min-h-8 w-fit items-center gap-2 font-inter text-sm font-semibold text-brand transition-colors hover:text-highlight-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
                          Baca berita <ArrowRight aria-hidden="true" size={16} />
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

      {/* 6. DEDICATED CONVERSION CTA BANNER (VOTING / PENDAFTARAN / PROFIL) */}
      <section
        id="partisipasi"
        className="relative bg-neutral-50 px-8 py-16 md:px-20 md:py-24"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative overflow-hidden rounded-2xl border border-brand-700/40 bg-linear-to-br from-brand-900 via-brand-800 to-brand-950 p-8 text-canvas shadow-xl md:p-12">
            <div className="pointer-events-none absolute inset-0 bg-radial-[at_90%_10%] from-highlight-400/20 to-transparent" />
            <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-7">
                <p className="inline-flex items-center gap-2 rounded-md border border-highlight-400/40 bg-brand-950/50 px-3 py-1 font-manrope text-xs font-bold uppercase tracking-wider text-highlight-300">
                  <Compass className="size-3.5" aria-hidden="true" />
                  Partisipasi Publik
                </p>
                <h2 className="mt-3 font-manrope text-2xl font-bold leading-tight text-canvas sm:text-3xl md:text-4xl">
                  Kenali Para {participantRoleLabel} & Berikan Dukungan Terbaik Anda
                </h2>
                <p className="mt-3 max-w-xl text-left font-inter text-sm leading-relaxed text-canvas/85 md:text-base">
                  Telusuri profil lengkap peserta di setiap kategori atau berikan dukungan suara Anda secara langsung melalui halaman voting resmi Pasanggiri Mojang Jajaka Kabupaten Garut.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3.5">
                  <Button asChild size="lg" className="bg-highlight-400 font-semibold text-neutral-950 hover:bg-highlight-300">
                    <Link href="/voting">
                      <Vote className="mr-2 size-4" aria-hidden="true" />
                      Buka Halaman Voting
                    </Link>
                  </Button>
                  {navigation.registrationVisible ? (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-canvas/35 bg-canvas/10 text-canvas hover:border-highlight-300 hover:bg-canvas/20 hover:text-canvas"
                    >
                      <Link href="/pendaftaran">
                        Informasi Pendaftaran
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              {navigation.categories.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-5">
                  {navigation.categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/profil-${navigation.participantKind}/${category.slug}`}
                      className="group flex flex-col justify-between rounded-xl border border-canvas/15 bg-canvas/8 p-4 backdrop-blur-xs transition-all hover:border-highlight-300/70 hover:bg-canvas/14"
                    >
                      <span className="font-manrope text-xs font-bold uppercase tracking-wider text-highlight-300">
                        Profil {participantRoleLabel}
                      </span>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-manrope text-base font-bold text-canvas">
                          {formatCategoryName(category)}
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-highlight-300 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
