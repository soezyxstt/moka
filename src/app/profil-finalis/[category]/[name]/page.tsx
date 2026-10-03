import BG from '@/components/next-image-bg';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ImageMaskFade from './image-mask';
import Image from 'next/image';
import { getPublicParticipantBySlug } from '@/server/cms/public-participant-readers';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ name: string, category: string }> }>) {
  const { name: name_, category: catt } = await params;
  const participant = await getPublicParticipantBySlug(catt, name_, 'finalis');
  if (!participant) {
    return {
      title: "Profil Finalis Tidak Ditemukan",
      description: "Profil finalis yang Anda cari tidak ditemukan pada edisi aktif.",
    };
  }

  return {
    title: `Profil ${participant.name} - ${participant.categoryName} ${participant.editionYear}`,
    ...(participant.imageUrl ? { openGraph: { images: [participant.imageUrl] } } : {}),
    description: `Profil finalis ${participant.name} pada kategori ${participant.categoryName} di Pasanggiri Mojang Jajaka Kabupaten Garut ${participant.editionYear}.`,
  };
}

export default async function DetailProfilPage({
  params,
}: Readonly<{
  params: Promise<{ name: string, category: string }>;
}>) {

  const { name, category: catt } = await params;
  const cmsParticipant = await getPublicParticipantBySlug(catt, name, 'finalis');
  if (!cmsParticipant) notFound();

  const categoryName = cmsParticipant.categoryName;
  const participantName = cmsParticipant.name;
  const portraitUrl = cmsParticipant.imageUrl;
  const bio = cmsParticipant.bio;
  const achievements = cmsParticipant.achievements;

  return (
    <main className="h-screen max-sm:h-auto min-h-screen overflow-hidden relative">
      <BG />
      <div className='w-full h-[100lvh] pointer-events-none z-0 bg-radial-[at_50%_50%] fixed top-0 left-0 from-transparent to-90% to-dgb-800' />
      <div className="relative z-1 bg-white/50 backdrop-blur-[2px] md:h-3/4 min-h-[80vh] mx-6 rounded-3xl top-28 md:top-28 md:mx-20 md:rounded-[64px] overflow-hidden mb-36">
        <div className="absolute top-0 -z-1 bg-linear-120 from-black/50 via-black/50 to-fb-300/40 via-60% w-full h-full"></div>
        <div className="md:flex md:flex-row-reverse justify-end md:pl-20 lg:pl-24 max-h-full max-sm:space-y-4 max-sm:pb-8">
          {portraitUrl
            ? <ImageMaskFade src={portraitUrl} alt={`Finalis ${participantName}, ${categoryName}`} width={400} height={1000} className='object-top md:h-max max-sm:max-h-84 md:mx-auto' />
            : <div role="img" aria-label={`Foto ${participantName} belum tersedia`} className="relative z-0 flex h-[min(70vh,40rem)] w-full max-w-[25rem] items-center justify-center bg-dgb-50 text-5xl font-semibold text-dgb-900 md:mx-auto">
              {participantName.split(' ').map((part) => part[0]).slice(0, 2).join('')}
            </div>}
          <div className="text-white md:max-w-lg lg:max-w-xl space-y-2 md:space-y-4 mt-auto md:pb-20 max-sm:px-6 max-sm:text-sm relative z-1">
            <div className="flex gap-6 items-center">
              <div className="flex flex-col justify-center gap-1.5">
                <div className="">
                  <p className="font-montserrat text-[#DCDCDC] capitalize">{categoryName}</p>
                  <h1 className="capitalize md:text-5xl text-xl font-semibold mb-1.5">{participantName}</h1>
                  <Separator className='bg-white'/>
                </div>
              </div>
            </div>
            <div className="flex max-sm:flex-col w-full justify-between gap-8 items-center md:mt-8 mt-6">
              <ScrollArea className="space-y-4 md:h-[35vh] h-[30vh]">
                <p className="font-montserrat text-sm">{bio}</p>
                <ul className='list-decimal list-inside font-montserrat mb-8 mt-4'>
                  {achievements.map((achievement, index) => (
                    <li key={index} className='text-sm text-justify'>{" " + achievement}</li>
                  ))}
                </ul>
              </ScrollArea>
              {cmsParticipant && (cmsParticipant.profileVideoUrl || cmsParticipant.qrImageUrl) && (
                <aside className="flex w-full flex-col items-center justify-center gap-4 md:min-w-40 md:w-auto">
                  {cmsParticipant.profileVideoUrl && (
                    <div className="w-56 max-w-full space-y-2">
                      <p className="font-montserrat text-sm">Video profil</p>
                      <video controls playsInline preload="metadata" className="aspect-video w-full rounded-lg bg-black">
                        <source src={cmsParticipant.profileVideoUrl} type={cmsParticipant.profileVideoMimeType ?? undefined} />
                      </video>
                    </div>
                  )}
                  {cmsParticipant.qrImageUrl && (
                    <figure className="flex flex-col items-center gap-2">
                      <Image src={cmsParticipant.qrImageUrl} alt={`QR voting ${participantName}`} width={160} height={160} className="size-40 rounded-lg bg-white object-contain p-2" />
                      <figcaption className="text-center font-montserrat text-sm">Pindai QR untuk voting</figcaption>
                    </figure>
                  )}
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
