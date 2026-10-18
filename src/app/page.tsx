import Image from "next/image";
import Link from 'next/link';
import { registrationRows } from "@/server/cms/registration";
import { ArrowRight, Images } from 'lucide-react';
import { Section } from '@/components/custom/section';
import { Button } from '@/components/custom/button';
import { typography } from '@/components/custom/typography';
import { formatCategoryName } from '@/components/footer';
import { resolveBrandLogos } from '@/server/cms/brand-assets';
import { getPublicAboutContent, getPublicHomeContent, getPublicNavigation, getPublicNews, getPublicSiteIdentity, type PublicGalleryAlbum } from '@/server/cms/public-readers';

function cssBackground(url?: string) {
  return url ? `url(${JSON.stringify(url)})` : undefined;
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

export default async function Home() {
  const [home, newsItems, navigation, identity, about] = await Promise.all([
    getPublicHomeContent(),
    getPublicNews(),
    getPublicNavigation(),
    getPublicSiteIdentity(),
    getPublicAboutContent(),
  ]);
  const programs = (home.programs.length ? home.programs : (home.sections.program?.body ?? "")
    .split(/\r?\n/).map((title) => title.trim()).filter(Boolean).map((title) => ({ title, description: null })))
    .map((item) => {
      const colon = item.title.indexOf(":");
      return {
        title: (colon > 0 ? item.title.slice(0, colon) : item.title).trim().replace(/\.$/, ''),
        description: item.description?.trim() || (colon > 0 ? item.title.slice(colon + 1).trim() : null),
      };
    });
  const logos = resolveBrandLogos(identity.assets, identity.edition);
  const bannerLogo = logos.footer ?? logos.desktop;
  const hero = home.sections.hero;
  const agenda = registrationRows(home.sections.agenda?.body);
  const program = home.sections.program;
  const news = home.sections.berita;
  const participantImage = home.assets["home.cta.image"];
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
  const hasProgram = Boolean(program?.title?.trim() || home.programs.length || home.assets['home.programs.bg'] || collage.length);
  const hasNews = Boolean(news?.title?.trim() || news?.body?.trim() || newsItems.length || home.assets['home.news.bg']);
  const hasEvents = navigation.events.length > 0;

  if (!hasHero && !hasProgram && !hasNews) {
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
                {home.sections.pengantar?.body ? <typography.p className="mt-5 max-w-xl text-on-media/85">{home.sections.pengantar.body}</typography.p> : null}
                <div data-reveal="" className="mt-8 flex flex-wrap items-center gap-3.5">
                  <Button asChild size="lg"><Link href={participantProfileHref}>Lihat {participantRoleLabel.toLowerCase()}<ArrowRight className="ml-2 size-4" aria-hidden /></Link></Button>
                  {hasEvents ? <Link href="#rangkaian-kegiatan" className="inline-flex min-h-11 items-center text-canvas underline underline-offset-4">Lihat rangkaian kegiatan</Link> : null}
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
                  className="h-auto max-h-[65svh] w-full object-contain md:translate-y-[10vh]"
                  preload
                  sizes="(max-width: 768px) calc(100vw - 64px), (max-width: 1280px) 50vw, 672px"
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 6. DEDICATED CONVERSION SECTION (VOTING / PENDAFTARAN / PROFIL) */}
      <section
        id="partisipasi"
        className="relative border-b border-neutral-200/70 bg-background px-8 py-12 md:px-20 md:py-16"
      >
        <div className={`mx-auto grid w-full max-w-7xl items-center gap-8 lg:gap-16 ${participantImage ? "lg:grid-cols-[0.85fr_1.15fr]" : "lg:grid-cols-2"}`}>
          {participantImage ? <div className="relative order-2 aspect-square overflow-hidden rounded-2xl bg-brand-50 lg:order-none">
            <Image src={participantImage.url} alt={participantImage.alt ?? "Mojang Jajaka Garut"} fill className="object-cover" sizes="(max-width: 1023px) 85vw, 40vw" />
          </div> : null}
          <div>
          <div>
            <typography.h1 className="text-brand-900">
              Kenali {participantRoleLabel.toLowerCase()}
            </typography.h1>
            <p className="mt-3 max-w-xl text-left font-inter text-base leading-relaxed text-neutral-600">
              Lihat profil dan kategori peserta Pasanggiri {navigation.edition.year}.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <Button asChild size="lg">
                <Link href="/voting">
                  Lihat informasi voting <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              {navigation.registrationVisible ? (
                <Button asChild size="lg" variant="outline">
                  <Link href="/pendaftaran">
                    Informasi pendaftaran
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {navigation.categories.length ? (
            <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
              {navigation.categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/profil-${navigation.participantKind}/${category.slug}`}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:text-brand md:px-2"
                >
                  <span className="font-manrope text-lg font-semibold text-brand-900 transition-colors group-hover:text-brand">
                    {formatCategoryName(category)}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : null}
          </div>
        </div>
      </section>

      {programs.length || collage.length ? <Section id="program" className="border-b border-neutral-200/70 bg-neutral-50 py-16 md:py-24" contentClassName="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl"><typography.h1 className="text-brand-900">{program?.title || 'Program PAMOKA'}</typography.h1><typography.p className="mt-4">{navigation.aboutDescription || 'Paguyuban Mojang Jajaka Kabupaten Garut mendukung pengembangan diri dan peran generasi muda dalam pariwisata, kebudayaan, serta ekonomi kreatif daerah.'}</typography.p></div>
          <Link href="/tentang" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-brand">Kenali PAMOKA<ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        <div className={collage.length ? 'grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14' : ''}>
          {collage.length ? <div className="grid grid-cols-2 gap-4">{collage.slice(0, 3).map((asset, index) => <div key={asset.url} className={`relative overflow-hidden rounded-2xl ${index === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-[3/2]'}`}><Image src={asset.url} alt={asset.alt ?? ''} fill className="object-cover" sizes={index === 0 ? '(max-width: 1023px) 90vw, 40vw' : '(max-width: 1023px) 44vw, 20vw'} /></div>)}</div> : null}
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">{programs.map((item) => <div key={item.title} className="border-t border-neutral-200 pt-4"><h3 className="font-manrope text-lg font-semibold text-brand-900">{item.title}</h3>{item.description ? <typography.p className="mt-2 text-sm">{item.description}</typography.p> : null}</div>)}</div>
        </div>
      </Section> : null}

      {agenda.length ? <section id="rangkaian-kegiatan" className="border-b border-neutral-200/70 bg-background px-8 py-16 md:px-20 md:py-24"><div className="mx-auto max-w-7xl">
        <typography.h1 className="text-brand-900">{home.sections.agenda.title || 'Agenda terdekat'}</typography.h1>
        <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">{agenda.map((item) => <div key={item.label + item.title} className="grid gap-2 py-5 md:grid-cols-[14rem_1fr]"><p className="font-medium text-brand">{item.label}</p><h3 className="font-manrope text-lg font-semibold text-brand-900">{item.title}</h3></div>)}</div>
        {hasEvents ? <Link href={navigation.registrationVisible ? "/pendaftaran#timeline" : `/rangkaian-kegiatan/${navigation.events[0].slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-brand">Lihat seluruh rangkaian<ArrowRight className="size-4" aria-hidden /></Link> : null}
      </div></section> : null}
      {/* 3. RANGKAIAN KEGIATAN / TIMELINE */}
      {hasEvents && !agenda.length ? (
        <section
          id="rangkaian-kegiatan"
          className="relative border-b border-neutral-200/70 bg-background px-8 py-16 md:px-20 md:py-24"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
              <div>
                <typography.h1 className="text-brand-900">Rangkaian kegiatan</typography.h1>
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

      <Section id="gallery" className="border-b border-neutral-200/70 bg-background py-16 md:py-24" contentClassName="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <typography.h1 className="text-3xl text-brand-900 md:text-4xl">Kegiatan kami</typography.h1>
          <Link href="/galeri" className="inline-flex min-h-11 w-fit items-center gap-2 border-b border-brand/40 text-sm font-medium text-brand transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Lihat semua galeri<ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        {about.galleries.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr]">
          {about.galleries.slice(0, 3).map((album, index) => <AlbumPreview key={album.id} album={album} featured={index === 0} />)}
        </div> : <typography.p className="mt-8">Belum ada album terbit untuk edisi ini.</typography.p>}
      </Section>

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
                  Lihat semua berita <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            {newsItems.length === 0 ? (
              <p className="font-inter text-sm text-muted-foreground">Belum ada berita terbit untuk edisi ini.</p>
            ) : newsItems.length <= 2 ? (
              <div className="space-y-6">
                {newsItems.map((item) => {
                  const formattedDate = formatNewsDate(item.date);
                  const isExternal = !item.isInternal && /^https?:\/\//i.test(item.link);
                  return (
                    <article
                      data-reveal=""
                      key={item.link + item.title}
                      className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200/90 bg-canvas shadow-xs transition-all hover:border-brand-300 hover:shadow-md md:grid-cols-12"
                    >
                      <div className="relative grid min-h-64 place-items-center overflow-hidden bg-brand-900 p-6 md:col-span-5 md:p-8">
                        {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 480px" /> : bannerLogo ? <Image src={bannerLogo.url} alt={bannerLogo.alt || 'MOKA Garut'} unoptimized={bannerLogo.mimeType === 'image/svg+xml' || bannerLogo.url.endsWith('.svg')} width={220} height={80} className="h-auto w-48 object-contain" /> : <p className="font-manrope text-xl text-on-media">MOKA Garut</p>}
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
                              Baca berita <ArrowRight className="ml-2 size-4" aria-hidden="true" />
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




    </main>
  );
}

function AlbumPreview({ album, featured }: { album: PublicGalleryAlbum; featured: boolean }) {
  const firstVideo = album.items.find((item) => item.youtubeId)?.youtubeId;
  const imageUrl = album.coverUrl ?? (firstVideo ? `https://img.youtube.com/vi/${firstVideo}/hqdefault.jpg` : null);
  return (
    <Link href={`/galeri#${album.slug}`} className={`group flex min-w-0 flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight-400 ${featured ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}`}>
      <div className={`relative overflow-hidden rounded-lg bg-brand-100 ${featured ? "aspect-[4/3] lg:aspect-auto lg:min-h-[26rem] lg:flex-1" : "aspect-[16/9]"}`}>
        {imageUrl ? <Image src={imageUrl} alt={album.coverAlt ?? album.title} fill className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.02]" sizes={featured ? "(max-width: 1023px) 90vw, 55vw" : "(max-width: 639px) 90vw, 40vw"} /> : <Images className="absolute inset-0 m-auto size-8 text-brand" aria-hidden />}
      </div>
      <div className="flex items-start justify-between gap-3 text-brand-900">
        <div>
          <h3 className="font-manrope text-lg font-medium leading-7">{album.title}</h3>
          {album.description?.trim() ? <typography.p className="mt-1 leading-7">{album.description.trim()}</typography.p> : null}
          <p className="mt-2 text-sm font-medium text-brand">Lihat dokumentasi</p>
        </div>
        <ArrowRight className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
      </div>
    </Link>
  );
}
