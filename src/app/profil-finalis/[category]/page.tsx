// app/profil/[category]/page.tsx
import { typography } from '@/components/custom/typography';
import Link from 'next/link';
import Image from 'next/image';
import BG from '@/components/next-image-bg';
import HeroVideo from './hero-video';
import HeroTextWrapper from './hero-text';
import { getPublicParticipantCategory } from '@/server/cms/public-participant-readers';
import { notFound } from 'next/navigation';

// Make sure your FinalisCard component is also properly typed for TSX
interface FinalisCardProps {
  src?: string;
  name: string;
  no: string;
  catt: string;
  href: string;
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ category: string }> }>) {
  const { category: catt } = await params;
  const cmsCategory = await getPublicParticipantCategory(catt, 'finalis');
  if (!cmsCategory) {
    return {
      title: "Kategori Tidak Ditemukan",
      description: "Kategori yang Anda cari tidak ditemukan.",
    };
  }
  return {
    title: `Profil Finalis - ${cmsCategory.name} ${cmsCategory.editionYear}`,
    description: `Profil Finalis Pasanggiri Mojang Jajaka Kabupaten Garut ${cmsCategory.editionYear} pada kategori ${cmsCategory.name}.`,
  };
}

export default async function ProfilFinalisPage({ params }: Readonly<{ params: Promise<{ category: string }> }>) {
  const { category: catt } = await params;
  const cmsCategory = await getPublicParticipantCategory(catt, 'finalis');
  if (!cmsCategory) notFound();

  return (
    <main className="min-h-screen overflow-hidden relative">
      <BG />
      <div className='w-full h-[100lvh] fixed pointer-events-none z-0 bg-radial-[at_50%_50%] from-transparent to-90% to-dgb-800 backdrop-blur-sm' />
      <HeroVideo
        fallbackImageSrc={cmsCategory.posterUrl}
        videoWebMSrc={cmsCategory.videoMimeType === 'video/webm' ? cmsCategory.videoUrl : null}
        videoMp4Src={cmsCategory.videoMimeType === 'video/mp4' ? cmsCategory.videoUrl : null}
      >
        <HeroTextWrapper>
          <h1 className='text-4xl font-semibold font-montserrat capitalize max-w-xl text-3xl md:text-5xl'>Profil Finalis {cmsCategory.name} {cmsCategory.editionYear}</h1>
        </HeroTextWrapper>
      </HeroVideo>

      <section className="md:px-20 md:py-20 relative px-8 py-8">
        <typography.h1 className='text-center md:mb-12 mb-8 text-white text-3xl md:text-5xl'>Pasanggiri Mojang Jajaka {cmsCategory.editionYear} Mempersembahkan</typography.h1>
        <div className="grid md:gap-6 gap-3 grid-cols-1 md:grid-cols-3">
          {cmsCategory.participants.length
            ? cmsCategory.participants.map((participant) => (
              <FinalisCard
                key={participant.id}
                name={participant.name}
                catt={cmsCategory.code}
                no={String(participant.number)}
                href={`/profil-finalis/${cmsCategory.slug}/${participant.slug}`}
                src={participant.imageUrl ?? undefined}
              />
            ))
            : <p className="col-span-full rounded-xl border border-white/20 bg-white/10 px-6 py-12 text-center font-inter text-white/80">Belum ada finalis untuk edisi {cmsCategory.editionYear}.</p>}
        </div>
      </section>
    </main>
  );
}

function FinalisCard({ src, name, catt, no, href }: FinalisCardProps) { // Use the defined interface
  return (
    <Link href={href} className="aspect-[3/3] relative rounded-md overflow-hidden group">
      {src
        ? <Image src={src} alt={name} className='object-cover w-full h-full object-center transition-all group-hover:scale-102 duration-500' width={300} height={400} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" />
        : <div role="img" aria-label={`Foto ${name} belum tersedia`} className="flex h-full w-full items-center justify-center bg-linear-to-br from-dgb-700 to-dgb-900 text-white">
          <span aria-hidden="true" className="font-montserrat text-5xl font-semibold">{name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
        </div>}
      <div className="absolute bottom-0 w-full text-white transition-all duration-500 group-hover:opacity-0">
        <div className="leading-tight p-6 bg-gradient-to-t from-black/90 to-transparent z-0">
          <div className="flex justify-between font-bold text-2xl">
            <p className="">{catt}</p>
            <p className="">{name.split(" ")[0]}</p>
          </div>
          <div className="flex justify-between text-2xl">
            <p className="">{no}</p>
            <p className="">{name.split(" ")[1]}</p>
          </div>
        </div>
        <div className="h-6 w-full bg-gradient-to-r from-fb to-fb via-fb-200 px-4 text-[10px] flex items-center gap-10 justify-center text-black z-10">
          <p className="">mokagarut</p>
          <p className="">#nyundaturnyakola</p>
          <p className="">#kayakarya</p>
        </div>
      </div>
    </Link>
  );
}
