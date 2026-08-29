import { ScrollArea } from '@/components/ui/scroll-area';
import { categories } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ name: string, category: string }>;
}>) {

  const { name, category: catt } = await params;
  const category = categories.find(cat => cat.slug === catt);

  if (!category) {
    return <main className="bg-cover min-h-screen bg-center bg-[url(/gf-1.png)] grid place-items-center md:px-20 py-16 px-8 font-montserrat">Kategori tidak ditemukan</main>;
  }

  const finalist = category.list.find(f => f.name.split(" ").join("-").toLowerCase() === name);

  if (!finalist) {
    return <main className="bg-cover min-h-screen bg-center bg-[url(/gf-1.png)] grid place-items-center md:px-20 py-16 px-8 font-montserrat">Peserta tidak ditemukan</main>;
  }

  const qrPath = `/qr/${category.abrev}/${finalist.name.split(" ").join("_")}.jpg`;

  return (
    <main className="h-screen max-sm:h-auto min-h-screen overflow-hidden relative">
      <div className="fixed w-full h-full top-0 left-0 -z-1 bg-[url(/babancong.png)] bg-fixed bg-size-[auto_100lvh] bg-center"></div>
      <div className='w-full h-full pointer-events-none z-0 bg-radial-[at_50%_50%] fixed top-0 left-0 from-transparent to-90% to-dgb-800' />
      <div className="relative z-1 bg-white/50 backdrop-blur-[2px] md:h-3/4 min-h-[80vh] mx-6 rounded-3xl top-28 md:top-28 md:mx-20 md:rounded-[64px] overflow-hidden mb-36">
        <div className="absolute top-0 -z-1 bg-linear-120 from-black/50 via-black/50 to-fb-300/40 via-60% w-full h-full"></div>
        <div className="md:flex md:flex-row-reverse justify-end md:pl-20 lg:pl-24 max-h-full space-y-8 max-sm:pb-8">
          <Image src={`/peserta/${category?.abrev}/${category?.abrev}${String(finalist.no).padStart(2, "0")}_${finalist.name.split(" ").join("_")}/default.png`} alt='' width={400} height={1000} className='object-top object-cover md:max-h-full max-h-72 max-sm:max-w-56 mx-auto' />
          <div className="text-white md:max-w-lg lg:max-w-xl space-y-2 md:space-y-4 mt-auto md:pb-20 max-sm:px-6 max-sm:text-sm">
            <div className="flex gap-6">
              <div className="flex flex-col justify-center">
                <div className="">
                  <p className="font-montserrat text-[#DCDCDC] capitalize">{category.name}</p>
                  <h2 className="capitalize md:text-5xl text-xl font-semibold mb-4">{name.split("-").join(" ")}</h2>
                </div>
                <Link className='w-full bg-fb font-medium px-6 text-center py-1.5 rounded-md md:hidden' href={qrPath} download={`qr-${finalist.name}`}>Unduh QR</Link>
              </div>
              <Image height={200} width={200} alt='qr-code' src={qrPath} className='bg-white rounded-2xl w-32 h-32 border border-dgb md:hidden' />
            </div>
            <div className="flex max-sm:flex-col w-full justify-between gap-8 items-center md:mt-8 mt-6">
              <ScrollArea className="space-y-4 md:h-[35vh] h-[30vh]">
                <p className="font-montserrat text-sm">{finalist.description}</p>
                <ul className='list-["-"] list-inside font-montserrat mb-8 mt-4'>
                  {finalist.achievements.map((achievement, index) => (
                    <li key={index} className='text-sm text-justify'>{" " + achievement}</li>
                  ))}
                </ul>
              </ScrollArea>
              <div className="min-w-40 flex flex-col items-center justify-center gap-4 max-sm:hidden">
                <Image height={200} width={200} alt='qr-code' src={qrPath} className='bg-white rounded-2xl w-40 h-40 border border-dgb' />
                <Link className='w-full bg-fb font-medium px-6 text-center py-1.5 rounded-md' href={qrPath} download={`qr-${finalist.name}`}>Unduh</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}