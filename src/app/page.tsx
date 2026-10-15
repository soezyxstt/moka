import Image from "next/image";
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/custom/button';
import { typography } from '@/components/custom/typography';
import { getPublicHomeContent, getPublicNews } from '@/server/cms/public-readers';

function cssBackground(url?: string) {
  return url ? `url(${JSON.stringify(url)})` : undefined;
}

export default async function Home() {
  const [home, newsItems] = await Promise.all([getPublicHomeContent(), getPublicNews()]);
  const hero = home.sections.hero;
  const program = home.sections.program;
  const news = home.sections.berita;
  const cta = home.sections.ajakan;
  const ctaAction = cta?.actionLabel && cta.actionHref ? { label: cta.actionLabel, href: cta.actionHref } : null;
  const textPrograms = program?.body?.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) ?? [];
  const programItems = home.programs.length ? home.programs : textPrograms;
  const heroImage = home.assets['home.hero.fg'] ?? home.assets['home.hero.placeholder'];
  const collage = [
    { slot: 'home.programs.collage.1', className: 'absolute left-6 top-6 h-1/2 w-7/20 rounded-b-full object-cover' },
    { slot: 'home.programs.collage.2', className: 'absolute right-6 top-6 aspect-square w-7/20 rounded-bl-full rounded-t-full object-cover' },
    { slot: 'home.programs.collage.3', className: 'absolute bottom-6 right-6 h-1/2 w-7/20 rounded-t-full object-cover' },
    { slot: 'home.programs.collage.4', className: 'absolute bottom-6 left-6 h-7/20 w-9/20 rounded-r-full object-cover' },
  ].flatMap(({ slot, className }) => {
    const asset = home.assets[slot];
    return asset ? [{ ...asset, className }] : [];
  });
  const hasHero = Boolean(hero?.title?.trim() || hero?.body?.trim() || home.assets['home.hero.bg'] || heroImage);
  const hasProgram = Boolean(program?.title?.trim() || programItems.length || home.assets['home.programs.bg'] || collage.length);
  const hasNews = Boolean(news?.title?.trim() || news?.body?.trim() || newsItems.length || home.assets['home.news.bg']);
  const hasCta = Boolean(cta?.title?.trim() || cta?.body?.trim() || ctaAction || home.assets['home.cta.bg'] || home.assets['home.cta.image']);

  if (!hasHero && !hasProgram && !hasNews && !hasCta) {
    return <main className="grid min-h-screen place-items-center px-8"><p className="font-inter text-sm text-muted-foreground">Konten beranda belum diterbitkan untuk edisi ini.</p></main>;
  }

  return (
    <main className="min-h-screen">
      {hasHero ? (
        <section className="relative grid min-h-[70svh] place-items-center overflow-hidden bg-brand-900 bg-cover bg-center px-8 pb-12 pt-28 md:min-h-screen md:px-20 md:py-28" id="hero" style={{ backgroundImage: cssBackground(home.assets['home.hero.bg']?.url) }}>
          <div aria-hidden className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent to-90% to-brand-800" />
          <div className={`relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 md:gap-12 ${heroImage ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]' : ''}`}>
          {hero?.title?.trim() || hero?.body?.trim() ? (
            <div className="text-canvas">
              {hero.title?.trim() ? <h1 className="max-w-2xl font-manrope !text-3xl font-semibold leading-tight sm:!text-4xl md:!text-5xl">{hero.title.trim()}</h1> : null}
              {hero.body?.trim() ? <p className="mt-3 text-base italic sm:text-lg md:text-2xl">{hero.body.trim()}</p> : null}
            </div>
          ) : null}
          {heroImage ? <div className="mx-auto w-full max-w-2xl"><Image src={heroImage.url} alt={heroImage.alt ?? ''} width={1600} height={900} className="h-auto max-h-[65svh] w-full object-contain" preload sizes="(max-width: 768px) calc(100vw - 64px), (max-width: 1280px) 50vw, 672px" /></div> : null}
          </div>
        </section>
      ) : null}

      {hasProgram ? (
        <section id="section-1" className="relative grid min-h-screen place-items-center bg-brand-50 bg-cover px-8 py-12 md:px-32" style={{ backgroundImage: cssBackground(home.assets['home.programs.bg']?.url) }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-brand-50/90" />
          <div className={`relative isolate flex w-full flex-col-reverse gap-8 md:flex-row md:items-center md:gap-24 ${collage.length ? '' : 'md:justify-center'}`}>
            {collage.length ? <div className="relative aspect-square md:min-w-[45%] md:max-w-[45%]">
              <div className="aspect-square rounded-full border border-highlight-400 p-12"><div className="aspect-square rounded-full border border-highlight-400/90 p-12"><div className="aspect-square rounded-full border border-highlight-400/80 p-12" /></div></div>
              {collage.map((asset) => <Image key={asset.url} src={asset.url} alt={asset.alt ?? ''} width={300} height={500} className={asset.className} />)}
            </div> : null}
            <div className="space-y-6">
              {program?.title?.trim() ? <typography.h1 className="md:max-w-[calc(16*24px)]">{program.title.trim()}</typography.h1> : null}
              {programItems.length ? <ul className="list-outside list-disc space-y-2 pl-6 font-inter text-body">{programItems.map((item) => <li key={typeof item === 'string' ? item : item.title}>{typeof item === 'string' ? item : item.description?.trim() ? `${item.title}: ${item.description.trim()}` : item.title}</li>)}</ul> : null}
            </div>
          </div>
        </section>
      ) : null}

      {hasNews ? (
        <section id="section-2" className="relative bg-highlight-50 bg-cover bg-center px-8 py-16 md:px-24 md:py-20" style={{ backgroundImage: cssBackground(home.assets['home.news.bg']?.url) }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-highlight-50/90" />
          <div className="relative isolate mx-auto mb-10 grid w-full max-w-7xl gap-4 md:mb-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-end md:gap-12">
            {news?.title?.trim() ? <typography.h1>{news.title.trim()}</typography.h1> : null}
            {news?.body?.trim() ? <typography.p className="max-w-2xl md:pb-1">{news.body.trim()}</typography.p> : null}
          </div>
          <div className="relative isolate mx-auto w-full max-w-7xl">
            {newsItems.length ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {newsItems.map((item) => <article key={item.link + item.title} className="group flex h-full flex-col overflow-hidden rounded-xl border border-brand-900/10 bg-canvas/80 transition-colors hover:border-highlight-400">
                {item.imageUrl ? <div className="relative mb-4 aspect-[16/9] overflow-hidden bg-canvas/60">
                  <Image src={item.imageUrl} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-102" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1279px) 33vw, 320px" />
                </div> : null}
                <div className="flex flex-1 flex-col px-4 pb-4">
                  <h3 className="mb-3 line-clamp-2 font-manrope font-medium text-brand-900"><Link href={item.link} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-highlight-700">{item.title}</Link></h3>
                  <p className="line-clamp-4 flex-grow font-inter text-sm leading-relaxed text-body">{item.description}</p>
                  <Link href={item.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-8 w-fit items-center gap-2 font-inter text-sm font-semibold text-brand transition-colors hover:text-highlight-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                    Baca berita <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </div>
              </article>)}
            </div> : <p className="font-inter text-sm text-muted-foreground">Belum ada berita terbit untuk edisi ini.</p>}
          </div>
        </section>
      ) : null}

      {hasCta ? <section className="relative isolate grid min-h-screen place-items-center bg-brand-50 bg-cover bg-center px-8 py-16 md:px-20" style={{ backgroundImage: cssBackground(home.assets['home.cta.bg']?.url) }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-brand-50/90" />
        <div className="relative flex w-full items-center justify-between gap-12 max-sm:flex-col">
          {home.assets['home.cta.image'] ? <div className="w-3/4 max-w-md md:w-1/2"><Image src={home.assets['home.cta.image'].url} alt={home.assets['home.cta.image'].alt ?? ''} width={1000} height={1000} className="h-auto w-full object-contain" /></div> : null}
          <div className="space-y-6 md:w-9/20">
            {cta?.title?.trim() ? <typography.h1>{cta.title.trim()}</typography.h1> : null}
            {cta?.body?.trim() ? <typography.p className="text-justify">{cta.body.trim()}</typography.p> : null}
            {ctaAction ? <Button asChild><Link href={ctaAction.href} target={/^https?:\/\//i.test(ctaAction.href) ? "_blank" : undefined} rel={/^https?:\/\//i.test(ctaAction.href) ? "noopener noreferrer" : undefined}>{ctaAction.label}</Link></Button> : null}
          </div>
        </div>
      </section> : null}
    </main>
  );
}
