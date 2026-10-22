import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/custom/button';
import { typography } from '@/components/custom/typography';
import { resolveBrandLogos } from '@/server/cms/brand-assets';
import {
  getPublicHomeContent,
  getPublicNavigation,
  getPublicNews,
  getPublicSiteIdentity,
} from '@/server/cms/public-readers';

export const metadata: Metadata = {
  title: 'Berita',
  description: 'Siaran pers, pengumuman resmi, dan kabar terbaru kegiatan Paguyuban Mojang Jajaka Kabupaten Garut.',
  alternates: { canonical: '/berita' },
};

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

export default async function NewsPage() {
  const [home, newsItems, navigation, identity] = await Promise.all([
    getPublicHomeContent(),
    getPublicNews(),
    getPublicNavigation(),
    getPublicSiteIdentity(),
  ]);

  const logos = resolveBrandLogos(identity.assets, identity.edition);
  const bannerLogo = logos.footer ?? logos.desktop;
  const newsSection = home.sections.berita;
  const heading = newsSection?.title?.trim() || 'Berita & Informasi Resmi';
  const subtitle =
    newsSection?.body?.trim() ||
    'Siaran pers, pengumuman resmi, dan kabar terbaru kegiatan Paguyuban Mojang Jajaka Kabupaten Garut.';

  const participantRoleLabel = navigation.participantKind === 'semifinalis' ? 'Semifinalis' : 'Finalis';
  const primaryCategory = navigation.categories[0];
  const participantProfileHref = primaryCategory
    ? `/profil-${navigation.participantKind}/${primaryCategory.slug}`
    : '/voting';

  const [featuredItem, ...otherItems] = newsItems;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-neutral-200/70 bg-neutral-50 px-8 pb-12 pt-28 md:px-20 md:pb-16 md:pt-36">
        <div className="mx-auto w-full max-w-7xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 font-inter text-sm font-medium text-brand transition-colors hover:text-highlight-700"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke beranda
          </Link>
          <h1 className="max-w-3xl font-manrope text-3xl font-semibold leading-tight text-brand-900 md:text-5xl">
            {heading}
          </h1>
          <typography.p className="mt-3 max-w-2xl text-left text-neutral-600">
            {subtitle}
          </typography.p>
        </div>
      </section>

      <section className="px-8 py-16 md:px-20 md:py-24">
        <div className="mx-auto w-full max-w-7xl">
          {!featuredItem ? (
            <p className="font-inter text-sm text-muted-foreground">
              Belum ada berita terbit untuk edisi ini.
            </p>
          ) : (
            <div className="space-y-14">
              {(() => {
                const isPressRelease = isPressReleaseItem(featuredItem.title, featuredItem.type);
                const formattedDate = formatNewsDate(featuredItem.date);
                const isExternal = !featuredItem.isInternal && /^https?:\/\//i.test(featuredItem.link);

                return (
                  <article
                    data-reveal=""
                    className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200/90 bg-canvas shadow-xs transition-all hover:border-brand-300 hover:shadow-md md:grid-cols-12"
                  >
                    <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-linear-to-br from-brand-800 via-brand-700 to-brand-950 p-6 text-canvas md:col-span-5 md:p-8">
                      {!isPressRelease && featuredItem.imageUrl ? (
                        <Image
                          src={featuredItem.imageUrl}
                          alt={featuredItem.title}
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
                        <h2 className="font-manrope text-xl font-bold leading-snug text-brand-900 md:text-2xl">
                          <Link
                            href={featuredItem.link}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            className="transition-colors hover:text-brand"
                          >
                            {featuredItem.title}
                          </Link>
                        </h2>
                        <p className="mt-3 text-left font-inter text-sm leading-relaxed text-neutral-600 md:text-base">
                          {featuredItem.description}
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-4 pt-2">
                        <Button asChild>
                          <Link
                            href={featuredItem.link}
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
              })()}

              {otherItems.length > 0 ? (
                <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                  {otherItems.map((item) => {
                    const formattedDate = formatNewsDate(item.date);
                    const isExternal = !item.isInternal && /^https?:\/\//i.test(item.link);
                    const isPressRelease = isPressReleaseItem(item.title, item.type);

                    return (
                      <article
                        data-reveal=""
                        key={item.link + item.title}
                        className="group grid grid-cols-1 gap-4 py-6 md:grid-cols-12 md:items-center md:gap-8"
                      >
                        <div className="md:col-span-3">
                          {formattedDate ? (
                            <p className="font-inter text-xs font-medium text-neutral-500">
                              {formattedDate}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-start gap-4 md:col-span-7">
                          {!isPressRelease && item.imageUrl ? (
                            <div className="relative hidden aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:block">
                              <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="128px"
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0">
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
                            {item.description ? (
                              <p className="mt-1.5 line-clamp-2 text-left font-inter text-sm leading-relaxed text-neutral-600">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="md:col-span-2 md:flex md:justify-end">
                          <Link
                            href={item.link}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            className="inline-flex items-center gap-1.5 font-inter text-sm font-semibold text-brand transition-colors hover:text-highlight-700"
                          >
                            Baca <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
