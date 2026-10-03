import EventCarousel from './event-carousel';
import { getPublicEventBySlug, getPublicSponsors } from '@/server/cms/public-readers';
import SponsorItem from './sponsor';
import BG from '@/components/next-image-bg';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ event: string }>;
}>) {
  const { event } = await params;
  const cmsEvent = await getPublicEventBySlug(event);
  if (!cmsEvent) notFound();

  const sponsors = await getPublicSponsors();
  const images = cmsEvent.images.length
    ? cmsEvent.images
    : cmsEvent.heroImageUrl
      ? [cmsEvent.heroImageUrl]
      : [];
  const backgroundImage = cmsEvent.heroImageUrl ?? images[0];

  return (
    <main className="relative text-white max-sm:overflow-x-hidden">
      {backgroundImage ? <BG src={backgroundImage} /> : null}
      <div className='w-full h-[100lvh] fixed pointer-events-none z-0 bg-radial-[at_50%_50%] from-transparent to-90% to-dgb-800 backdrop-blur-sm' />
      <section className='relative h-[90vh] text-white font-montserrat'>
        {images.length ? (
          <EventCarousel event={event} title={cmsEvent.label} description={cmsEvent.desc} images={images} />
        ) : (
          <div className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-4 px-8 md:px-20">
            <h1 className="text-5xl font-semibold capitalize">{cmsEvent.label}</h1>
            {cmsEvent.desc ? <p>{cmsEvent.desc}</p> : null}
            <p>Foto kegiatan belum tersedia.</p>
          </div>
        )}
      </section>

      <section className="md:px-20 md:py-20 px-6 py-8 isolate">
        <h2 className="uppercase font-semibold text-3xl md:text-6xl font-montserrat mb-8 md:mb-16 md:place-self-center">Sponsor Kami</h2>
        <div className="w-full flex flex-wrap gap-6 md:gap-12 justify-center">
          {sponsors.length ? sponsors.map((sponsor) => (
            <SponsorItem key={sponsor.name} title={sponsor.name} src={sponsor.src} size='lg' />
          )) : <p>Sponsor belum tersedia.</p>}
        </div>
      </section>
    </main>
  )
}
