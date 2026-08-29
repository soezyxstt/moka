import Image from 'next/image';
import Link from 'next/link';

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ name: string }>;
}>) {

  const { name } = await params;

  return (
    <main className="h-screen overflow-hidden bg-[url(/babancong.png)] bg-fixed bg-size-[auto_100lvh] relative bg-center">
      <div className='w-full h-full pointer-events-none absolute z-0 bg-radial-[at_50%_50%] from-transparent to-90% to-dgb-800' />
      <div className="relative z-1 bg-white/50 backdrop-blur-[2px] md:h-3/4 min-h-[80vh] mx-6 rounded-3xl top-28 md:top-32 md:mx-20 md:rounded-[64px] overflow-hidden">
        <div className="absolute top-0 -z-1 bg-linear-120 from-black/50 via-black/50 to-fb-300/40 via-60% w-full h-full"></div>
        <div className="md:flex md:flex-row-reverse gap-20 justify-end md:pl-20 lg:pl-24 max-h-full space-y-8 max-sm:py-8">
          <Image src='/fullbody-1.png' alt='' width={400} height={1000} className='object-top object-cover md:max-h-full max-h-72 max-sm:max-w-56 mx-auto' />
          <div className="text-white md:max-w-md lg:max-w-lg space-y-2 md:space-y-4 mt-auto md:pb-20 max-sm:px-6 max-sm:text-sm">
            <p className="font-montserrat text-[#DCDCDC]">SPOTLIGHT</p>
            <h2 className="capitalize md:text-5xl text-xl font-semibold">{name.replace("-", " ")}</h2>
            <p className="font-montserrat">Jackie Art&apos;s music is a captivating fusion of influences that traverse the Atlantic. His early years in North London exposed him to the rich tapestry of R&B, UK grime, and UK pop.</p>
            <ul className='list-["-"] list-inside font-montserrat mb-8'>
              <li className=""> Juara 1 Silat Tingkat Kabupaten</li>
              <li className=""> Juara 1 Silat Tingkat Kabupaten</li>
              <li className=""> Juara 1 Silat Tingkat Kabupaten</li>
            </ul>
            <Link href='#' className="px-6 py-2 bg-dgb-300 rounded-full border border-white  font-medium">Vote</Link>
          </div>
        </div>
      </div>
    </main>
  )
}