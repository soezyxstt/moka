import { typography } from '@/components/custom/typography';
import Link from 'next/link';
import Image from 'next/image';
import BG from '@/components/next-image-bg';
import HeroVideo from '../../profil-finalis/[category]/hero-video';
import HeroTextWrapper from '../../profil-finalis/[category]/hero-text';
import { getPublicParticipantCategory } from '@/server/cms/public-participant-readers';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ category: string }> }>) {
  const { category: catt } = await params;
  const cmsCategory = await getPublicParticipantCategory(catt, 'semifinalis');
  if (!cmsCategory) {
    return {
      title: "Kategori Tidak Ditemukan",
      description: "Kategori yang Anda cari tidak ditemukan.",
    };
  }
  return {
    title: `Profil Semifinalis - ${cmsCategory.name} ${cmsCategory.editionYear}`,
    description: `Profil Semifinalis Pasanggiri Mojang Jajaka Kabupaten Garut ${cmsCategory.editionYear} pada kategori ${cmsCategory.name}.`,
    alternates: { canonical: `/profil-semifinalis/${encodeURIComponent(cmsCategory.slug)}` },
  };
}

export default async function ProfilSemifinalisPage({ params }: Readonly<{ params: Promise<{ category: string }> }>) {
  const { category: catt } = await params;
  const cmsCategory = await getPublicParticipantCategory(catt, 'semifinalis');
  if (!cmsCategory) notFound();

  return (
    <main className="min-h-screen overflow-hidden relative">
      <BG />
      <div className='w-full h-[100lvh] fixed pointer-events-none z-0 bg-radial-[at_50%_50%] from-transparent to-90% to-brand-800 backdrop-blur-sm' />
      <HeroVideo
        fallbackImageSrc={cmsCategory.posterUrl}
        videoWebMSrc={cmsCategory.videoMimeType === 'video/webm' ? cmsCategory.videoUrl : null}
        videoMp4Src={cmsCategory.videoMimeType === 'video/mp4' ? cmsCategory.videoUrl : null}
      >
        <HeroTextWrapper>
          <h1 className='font-semibold font-manrope capitalize max-w-xl text-3xl md:text-5xl'>Profil Semifinalis {cmsCategory.name} {cmsCategory.editionYear}</h1>
        </HeroTextWrapper>
      </HeroVideo>
      <section className="md:px-20 md:py-16 relative px-8 py-12">
        {cmsCategory.slogan ? <typography.h1 className='text-center md:mb-12 mb-8 text-canvas text-3xl md:text-5xl'>{cmsCategory.slogan}</typography.h1> : null}
        <div className="grid md:gap-6 gap-3 grid-cols-1 md:grid-cols-3">
          {cmsCategory.participants.length
            ? cmsCategory.participants.map((participant) => (
              <Link key={participant.id} href={`/profil-semifinalis/${cmsCategory.slug}/${participant.slug}`} className="bg-brand-50 w-full aspect-square object-cover bg-cover rounded-2xl overflow-hidden relative flex flex-col group hover:shadow-[inset_0_0_0_500px] hover:shadow-brand/50 transition-all duration-400">
                <div className="w-full h-[calc(100%-24px)] flex overflow-hidden">
                  {participant.imageUrl
                    ? <Image src={participant.imageUrl} alt={`Semifinalis ${participant.name}`} width={300} height={500} sizes="(max-width: 768px) 60vw, (max-width: 1280px) 30vw, 20vw" className='w-3/5 object-cover object-top mt-4 group-hover:scale-105 transition-all duration-500' />
                    : <div role="img" aria-label={`Foto ${participant.name} belum tersedia`} className="mt-4 flex w-3/5 items-center justify-center bg-brand-50 text-3xl font-semibold text-brand-900">
                      {participant.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                    </div>}
                  <div className="w-2/5 h-full flex flex-col">
                    <div className="pr-10 flex justify-end">
                      <div style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 90%, 0 100%)',
                        textOrientation: 'upright',
                        writingMode: 'vertical-rl',
                      }} className="bg-highlight-400 text-ink w-10 h-32 flex items-center text-sm font-semibold pt-2">{`${cmsCategory.code}-${String(participant.number).padStart(2, "0")}`}</div>
                    </div>
                    <div className="flex items-center md:pl-4 text-ink flex-1 font-medium">
                      <p className="font-manrope pr-6 group-hover:text-canvas transition duration-500 font-semibold leading-snug">{participant.name}</p>
                    </div>
                  </div>
                </div>
                {cmsCategory.signature ? <div className="min-h-6 w-full bg-brand-300 px-4 py-1 text-center text-[10px] leading-4 text-brand-900"><p>{cmsCategory.signature}</p></div> : null}
              </Link>
            ))
            : <p className="col-span-full rounded-xl border border-canvas/20 bg-canvas/10 px-6 py-12 text-center font-inter text-canvas/80">Belum ada semifinalis untuk edisi {cmsCategory.editionYear}.</p>}
        </div>
      </section>
    </main>
  )
}
