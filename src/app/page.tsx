import Image from "next/image";
import Link from 'next/link';
import { Button } from '@/components/custom/button';
import { typography } from '@/components/custom/typography';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
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
  const programItems = textPrograms.length ? textPrograms : home.programs;
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
  const hasHero = Boolean(hero?.title?.trim() || hero?.eyebrow?.trim() || hero?.body?.trim() || home.assets['home.hero.bg'] || heroImage);
  const hasProgram = Boolean(program?.title?.trim() || program?.eyebrow?.trim() || programItems.length || home.assets['home.programs.bg'] || collage.length);
  const hasNews = Boolean(news?.title?.trim() || news?.eyebrow?.trim() || news?.body?.trim() || newsItems.length || home.assets['home.news.bg']);
  const hasCta = Boolean(cta?.title?.trim() || cta?.eyebrow?.trim() || cta?.body?.trim() || ctaAction || home.assets['home.cta.bg'] || home.assets['home.cta.image']);

  if (!hasHero && !hasProgram && !hasNews && !hasCta) {
    return <main className="grid min-h-screen place-items-center px-8"><p className="font-inter text-sm text-muted-foreground">Konten beranda belum diterbitkan untuk edisi ini.</p></main>;
  }

  return (
    <main className="min-h-screen">
      {hasHero ? (
        <section className="relative grid min-h-[70svh] place-items-center overflow-hidden bg-dgb-900 bg-cover bg-center md:min-h-screen" id="hero" style={{ backgroundImage: cssBackground(home.assets['home.hero.bg']?.url) }}>
          <div aria-hidden className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent to-90% to-dgb-800" />
          {heroImage ? <div className="absolute bottom-4 right-0 h-auto w-4/5 md:right-8 md:h-[60vh] md:w-[60vh]"><Image src={heroImage.url} alt={heroImage.alt ?? ''} width={1000} height={1000} className="h-full w-full object-cover" preload sizes="(max-width: 768px) 80vw, 60vh" /></div> : null}
          {hero?.title?.trim() || hero?.eyebrow?.trim() || hero?.body?.trim() ? (
            <div className="relative z-10 mx-auto w-full max-w-7xl px-8 text-white md:px-20">
              {hero.eyebrow?.trim() ? <p className="mb-2 font-inter text-sm font-semibold uppercase tracking-wide text-white/85">{hero.eyebrow.trim()}</p> : null}
              {hero.title?.trim() ? <h1 className="max-w-2xl font-montserrat !text-3xl font-semibold leading-tight sm:!text-4xl md:!text-5xl">{hero.title.trim()}</h1> : null}
              {hero.body?.trim() ? <p className="mt-3 text-base italic sm:text-lg md:text-2xl">{hero.body.trim()}</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {hasProgram ? (
        <section id="section-1" className="relative grid min-h-screen place-items-center bg-dgb-50 bg-cover px-8 py-12 md:px-32" style={{ backgroundImage: cssBackground(home.assets['home.programs.bg']?.url) }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-dgb-50/90" />
          <div className={`relative isolate flex w-full flex-col-reverse gap-8 md:flex-row md:items-center md:gap-24 ${collage.length ? '' : 'md:justify-center'}`}>
            {collage.length ? <div className="relative aspect-square md:min-w-[45%] md:max-w-[45%]">
              <div className="aspect-square rounded-full border border-fb-400 p-12"><div className="aspect-square rounded-full border border-fb-400/90 p-12"><div className="aspect-square rounded-full border border-fb-400/80 p-12" /></div></div>
              {collage.map((asset) => <Image key={asset.url} src={asset.url} alt={asset.alt ?? ''} width={300} height={500} className={asset.className} />)}
            </div> : null}
            <div className="space-y-6">
              {program?.eyebrow?.trim() ? <typography.t1>{program.eyebrow.trim()}</typography.t1> : null}
              {program?.title?.trim() ? <typography.h1 className="md:max-w-[calc(16*24px)]">{program.title.trim()}</typography.h1> : null}
              {programItems.length ? <ul className="list-outside list-disc space-y-2 pl-6 font-inter text-[#505050]">{programItems.map((item) => <li key={typeof item === 'string' ? item : item.title}>{typeof item === 'string' ? item : item.description?.trim() ? `${item.title}: ${item.description.trim()}` : item.title}</li>)}</ul> : null}
            </div>
          </div>
        </section>
      ) : null}

      {hasNews ? (
        <section id="section-2" className="relative min-h-screen bg-fb-50 bg-cover bg-center px-8 py-12 md:px-24 md:py-16" style={{ backgroundImage: cssBackground(home.assets['home.news.bg']?.url) }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-fb-50/90" />
          <div className="relative isolate mb-12 flex flex-col gap-y-4 md:flex-row">
            <div className="min-w-1/5 md:w-min">{news?.eyebrow?.trim() ? <typography.t1>{news.eyebrow.trim()}</typography.t1> : null}{news?.title?.trim() ? <typography.h1>{news.title.trim()}</typography.h1> : null}</div>
            {news?.body?.trim() ? <typography.p className="max-w-2xl">{news.body.trim()}</typography.p> : null}
          </div>
          <div className="relative isolate flex w-full flex-col items-center gap-8">
            {newsItems.length ? <Carousel className="w-full" opts={{ align: 'start' }}><CarouselContent className="md:-ml-10">
              {newsItems.map((item) => <CarouselItem key={item.link + item.title} className="md:basis-1/4 md:pl-10"><article className="flex h-full flex-col overflow-hidden rounded-xl bg-white/75 p-4">
                {item.imageUrl ? <div className="relative mb-4 aspect-[16/9]"><Image src={item.imageUrl} alt={item.title} fill className="rounded-lg object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" /></div> : null}
                <h3 className="mb-3 line-clamp-2 font-montserrat font-medium text-dgb-900"><Link href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</Link></h3>
                <p className="line-clamp-4 flex-grow font-inter text-xs text-[#505050]">{item.description}</p>
              </article></CarouselItem>)}
            </CarouselContent><CarouselPrevious aria-label="Berita sebelumnya" className="left-2 border-dgb bg-dgb text-white hover:bg-dgb/90 hover:text-white md:hidden" /><CarouselNext aria-label="Berita berikutnya" className="right-2 border-dgb bg-dgb text-white hover:bg-dgb/90 hover:text-white md:hidden" /></Carousel> : <p className="font-inter text-sm text-muted-foreground">Belum ada berita terbit untuk edisi ini.</p>}
          </div>
        </section>
      ) : null}

      {hasCta ? <section className="grid min-h-screen place-items-center bg-dgb-50 bg-cover bg-center px-8 py-16 md:px-20" style={{ backgroundImage: cssBackground(home.assets['home.cta.bg']?.url) }}>
        <div className="flex w-full items-center justify-between gap-12 max-sm:flex-col">
          {home.assets['home.cta.image'] ? <div className="w-3/4 max-w-md md:w-1/2"><Image src={home.assets['home.cta.image'].url} alt={home.assets['home.cta.image'].alt ?? ''} width={1000} height={1000} className="h-auto w-full rounded-bl-[65%] object-cover" /></div> : null}
          <div className="space-y-6 md:w-9/20">
            {cta?.eyebrow?.trim() ? <typography.t1>{cta.eyebrow.trim()}</typography.t1> : null}
            {cta?.title?.trim() ? <typography.h1>{cta.title.trim()}</typography.h1> : null}
            {cta?.body?.trim() ? <typography.p className="text-justify">{cta.body.trim()}</typography.p> : null}
            {ctaAction ? <Link href={ctaAction.href} target={/^https?:\/\//i.test(ctaAction.href) ? "_blank" : undefined} rel={/^https?:\/\//i.test(ctaAction.href) ? "noopener noreferrer" : undefined}><Button>{ctaAction.label}</Button></Link> : null}
          </div>
        </div>
      </section> : null}
    </main>
  );
}
