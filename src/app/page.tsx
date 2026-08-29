import Image from "next/image";
import Link from 'next/link';
import { typography } from '@/components/custom/typography';
import { NewsCard } from '@/components/news-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/custom/button';
// import { news } from '@/lib/data';
import { newsUrls } from '@/lib/news';
import { fetchAndParseNews } from '@/lib/metadata-fetcher';

export default async function Home() {
  const newsPromises = newsUrls.map(url => fetchAndParseNews(url));
  const newsData = await Promise.all(newsPromises)

  return (
    <main className="min-h-screen">
      <section className='h-screen overflow-hidden bg-[url(/babancong.png)] bg-cover relative bg-center' id='hero'>
        <div className='w-full h-full pointer-events-none absolute z-0 bg-radial-[at_50%_50%] from-transparent to-90% to-dgb-800' />
        <div className="absolute top-9/20 md:left-20 left-12 text-white max-w-1/2">
          <h1 className="font-montserrat">Paguyuban Mojang Jajaka Kabupaten Garut</h1>
          <p className="italic mt-3 text-2xl">Nu Nyunda Tur Nyakola</p>
          {/* <Link href="https://instagram.com/mokagarut" className='rounded-full text-xl font-semibold px-6 py-1 bg-fb'>Get To Know Us</Link> */}
        </div>

        {/* people */}
        <div className="bottom-0 absolute right-8 h-[60vh] max-sm:hidden">
          <Image
            src="/hero.png"
            alt=""
            width={1000}
            height={1000}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      <section id='section-1' className='min-h-screen bg-[url(/programs.jpg)] bg-cover grid place-items-center px-8 md:px-32 py-12 relative'>
        <div className="bg-dgb-50/90 backdrop-opacity-40 w-full h-full left-0 top-0 absolute z-0 pointer-events-auto">
        </div>
        <div className="flex gap-8 md:gap-24 w-full max-sm:flex-col-reverse isolate">
          {/* circles */}
          <div className="relative aspect-square md:min-w-[45%] md:max-w-[45%]">
            <div className="w-full aspect-square rounded-full border border-fb-400 p-12">
              <div className="w-full aspect-square rounded-full border border-fb-400/90 p-12">
                <div className="w-full aspect-square rounded-full border border-fb-400/80 p-12">
                </div>
              </div>
            </div>
            <Image src='/program-1.jpg' alt='' width={300} height={500} className='absolute left-6 object-cover w-7/20 h-1/2 top-6 rounded-b-full' />
            <Image src='/program-2.jpg' alt='' width={300} height={500} className='absolute object-cover w-7/20 aspect-square right-6 rounded-bl-full top-6 rounded-t-full' />
            <Image src='/program-3.jpg' alt='' width={300} height={500} className='absolute object-cover w-7/20 h-1/2 bottom-6 rounded-t-full right-6' />
            <Image src='/bagendit.jpg' alt='' width={300} height={500} className='absolute object-cover h-7/20 w-9/20 bottom-6 rounded-r-full left-6' />
          </div>


          {/* texts */}
          <div className="space-y-6">
            <typography.t1 className=''>Our Program</typography.t1>
            <typography.h1 className='md:max-w-[calc(16*24px)]'>Program Unggulan Paguyuban Mojang Jajaka Kabupaten Garut</typography.h1>
            <ul className="text-[#505050] text-medium list-disc font-inter pl-6 space-y-2">
              <li className="list-outside">Pasanggiri Mojang Jajaka Kabupaten Garut.</li>
              <li className="list-outside">MOKA Uninga: Mojang Jajaka <span className='italic'>Ulin Ngaprak Garut</span>.</li>
              <li className="list-outside">Balakecrakan: Buka Bersama <span className='italic'>Lampahan Kanggo Ngakeun Rukun Atikan Maparin Kaberkahan</span>.</li>
              <li className="list-outside">Hurub Guyub: Miara Hubungan, Ngabudikeun Guyub.</li>
              <li className="list-outside">Berseka: Bersama Sehat Bareng Moka Garut.</li>
              <li className="list-outside">Karmisun: <span className='italic'>Kartu Miara Kasundaan</span>.</li>
            </ul>
          </div>
        </div>
      </section>
      <section id='section-2' className='min-h-screen bg-cover bg-[url(/bagendit.jpg)] bg-no-repeat bg-center px-8 py-12 md:px-24 md:py-16 relative'>
        {/* overlay */}
        <div className="bg-fb-50/90 backdrop-opacity-40 w-full h-full left-0 top-0 absolute z-0 pointer-events-auto">
        </div>

        <div className="flex isolate w-full max-sm:flex-col gap-y-4 mb-12">
          <typography.h1 className='min-w-1/5 md:w-min'>Berita dan Update</typography.h1>
          <div className="w-full"></div>
          <div className="space-y-6 min-w-1/2">
            <typography.p>Tetap terinformasi dengan perkembangan terkini agar Anda tetap terupdate.</typography.p>
            {/* <Link href="/news" className='rounded-md font-semibold px-6 py-1.5 text-dgb border border-dgb'>Lihat Semua</Link> */}
          </div>
        </div>
        <div className="flex flex-col gap-8 isolate w-full items-center">
          <Carousel className='w-full' opts={{ align: "start" }}>
            <CarouselContent className='md:-ml-10'>
              {newsData.map((item, i) => {
                if (!item) return null; // Skip null items
                return (
                  <CarouselItem key={item.link + i} className='md:basis-1/4 md:pl-10'>
                    <NewsCard news={item} />
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className='bg-transparent max-sm:hidden' />
            <CarouselNext className='bg-transparent max-sm:hidden' />
          </Carousel>
          <div className="md:hidden w-full flex justify-center gap-2">
            {[1, 2, 3].map((_, i) => (
              <div className="h-3 w-3 rounded-full bg-stone-700/50" key={'bullet' + i}></div>
            ))}
          </div>
          <div className="md:mt-4 w-full md:hidden">
            <typography.p className='w-full text-right text-[#505050]'>Geser untuk melihat berita lain.</typography.p>
          </div>
        </div>
      </section>
      <section className="bg-cover min-h-screen bg-center bg-[url(/gf-1.png)] grid place-items-center md:px-20 py-16 px-8">
        <div className="flex justify-between w-full items-center max-sm:flex-col max-sm:gap-12">
          <div className="max-w-md md:w-1/2 w-3/4">
            <Image
              src="/moka.png"
              alt=""
              width={1000}
              height={1000}
              className="w-full h-auto object-cover rounded-bl-[65%]"
            />
          </div>
          <div className="md:w-9/20 space-y-6">
            <typography.t1 className=''>Come Join Us</typography.t1>
            <typography.h1 className=''>Mari Bergabung Bersama Kami di Mojang Jajaka Kab. Garut</typography.h1>
            <typography.p className='text-[#505050] text-justify'>Apakah kamu generasi muda Garut yang berbakat, cerdas, berwawasan luas, dan memiliki jiwa kepemimpinan serta cinta terhadap budaya Sunda? Inilah saatnya kamu unjuk diri dan jadi representasi anak muda terbaik Kabupaten Garut di ajang <strong>Pasanggiri Mojang Jajaka Kabupaten Garut 2025!</strong></typography.p>
            <Link href='https://linktr.ee/mokagarut?fbclid=PAQ0xDSwLLAKNleHRuA2FlbQIxMQABpw2gC_fOT2itRpmmK5AsSHkaDqOu4-BC0du__5tC4c43H3SO4IlcW9Q7OLLd_aem_qcMFicl7PRVKHE-aba_AkA' target='_blank'>
              <Button>Daftar
              </Button></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
