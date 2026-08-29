"use client";

import Image from 'next/image';
import { use, useEffect, useState } from 'react';
import Autoplay from "embla-carousel-autoplay"
// import { cn } from '@/lib/utils';
// import { DataTable } from '@/components/data-table';
// import { standingColumn } from './column';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { rangkaianKegiatan, logoNames } from '@/lib/data';
import SponsorItem from './sponsor';
import BacksoundPlayer from '@/components/backsound-player';

export default function Page({
  params,
}: Readonly<{
  params: Promise<{ event: string }>;
}>) {
  const { event } = use(params);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (!api) {
      return
    }

    // setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])
  // const [year, setYear] = useState(2025)
  const kegiatan = rangkaianKegiatan.find(k => k.label.toLowerCase().replace(" ", "-") === event);

  return (
    <main className="relative text-white max-sm:overflow-x-hidden">
      <div className="fixed w-full h-full top-0 left-0 -z-1 bg-[url(/art-center-1.png)] bg-fixed bg-size-[auto_100lvh] bg-center"></div>
      <section className='relative h-[90vh] text-white font-montserrat'>
        <Carousel setApi={setApi} opts={{
          loop: true,
        }} plugins={[
          Autoplay({ delay: 3000, stopOnInteraction: false }),
        ]}>
          <CarouselContent className="relative w-screen h-[90vh] ml-0 cursor-grab active:cursor-grabbing">
            {Array.from({ length: 6 }, (_, i) => (
              <CarouselItem key={"rk-" + event + "-" + i} className="relative w-screen h-full pl-0">
                <Image src={'/rangkaian-kegiatan/' + event + "/" + (i + 1) + ".jpg"} alt='image' width={1000} height={1000} className='w-screen h-full object-cover' />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute z-1 w-full pointer-events-none h-full bg-linear-to-r from-black/65 via-black/65 max-sm:via-100% to-transparent top-0 left-0"></div>

        <div className="absolute md:max-w-sm md:left-20 left-8 top-1/2 w-full max-w-[calc(100vw-4rem)] z-10 h-fit -translate-y-1/2 pointer-events-none space-y-4">
          <h2 className="font-montserrat text-5xl font-semibold text-white capitalize">
            {kegiatan?.label}
          </h2>
          <p className="">
            {kegiatan?.desc}
          </p>
        </div>

        <div className="absolute z-10 md:left-20 left-8 bottom-20 flex gap-2 h-2">
          {Array.from({ length: 6 }, (_, i) => (
            <button key={i} onClick={() => api?.scrollTo(i)} className={`h-2 rounded-full transition-all ${current === i ? 'bg-white w-12' : 'bg-white/40 w-6'}`}></button>
          ))}
        </div>
      </section>


      {/* 
      <section className='relative md:px-20 md:py-20 px-6 py-8'>
        <h2 className="uppercase font-semibold text-3xl md:text-6xl font-montserrat mb-4 place-self-end">Hasil Seleksi</h2>
        <p className="max-w-lg text-right place-self-end">For any inquiries. collaborations, or just to say hello, we&apos;d love to hear from you! Reach out. and let&apos;s connect</p>

        <div className="flex gap-4 font-montserrat *:transition-all mt-4">
          <button onClick={() => setYear(2025)} className={cn("rounded-full bg-white/20 backdrop-blur-sm border border-white flex font-medium py-1.5 px-6", year === 2025 && "bg-fb", year === 2025 || "hover:bg-white/40")}>2025</button>
          <button onClick={() => setYear(2024)} className={cn("rounded-full bg-white/20 backdrop-blur-sm border border-white flex font-medium py-1.5 px-6", year === 2024 && "bg-fb", year === 2024 || "hover:bg-white/40")}>2024</button>
          <button onClick={() => setYear(2023)} className={cn("rounded-full bg-white/20 backdrop-blur-sm border border-white flex font-medium py-1.5 px-6", year === 2023 && "bg-fb", year === 2023 || "hover:bg-white/40")}>2023</button>
        </div>

        <div className="md:mt-8 mt-6">
          <DataTable columns={standingColumn} data={finalists} />
        </div>
      </section> */}

      <section className="md:px-20 md:py-20 px-6 py-8">
        <h2 className="uppercase font-semibold text-3xl md:text-6xl font-montserrat mb-8 md:mb-16 md:place-self-center">Sponsor Kami</h2>
        <div className="w-full flex flex-wrap gap-6 md:gap-12 justify-center">
          {logoNames.map((sponsor, index) => (
            <SponsorItem key={index + sponsor} title={sponsor} src={'/sponsors/' + sponsor} size='lg' />
          ))}
        </div>
      </section>
      <BacksoundPlayer />
    </main>
  )
}