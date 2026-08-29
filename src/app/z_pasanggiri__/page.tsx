"use client";

import { m } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { cn } from '@/lib/utils';
import { DataTable } from '@/components/data-table';
import { standingColumn } from './column';
import { finalists, sponsors } from '@/lib/data';
import SponsorItem from './sponsor';

export default function Pasanggiri() {
  const [Index, setIndex] = useState(1)
  const [year, setYear] = useState(2025)

  return (
    <main className="relative bg-[url(/art-center-1.png)] bg-fixed md:bg-size-[100lvw_100lvh] bg-size-[auto_100lvh] bg-center bg-no-repeat text-white max-sm:overflow-x-hidden">
      <section className='relative h-[90vh] text-white font-montserrat'>
        <m.div className='relative z-0 w-full h-full'>
          <Image src='/galdin.png' alt='' width={1920} height={1080} className='w-full h-full object-cover' />
        </m.div>
        <div className="absolute z-1 w-full h-full bg-linear-to-r from-black/65 via-black/65 to-transparent top-0 left-0"></div>

        <div className="absolute md:max-w-sm md:left-20 left-8 top-1/2 w-full z-10 h-fit -translate-y-1/2">
          <h2 className="font-montserrat text-5xl font-semibold text-white">
            Gala Dinner Night
          </h2>
        </div>

        <div className="absolute z-10 md:left-20 left-8 bottom-20 flex gap-2 h-2">
          {Array.from({ length: 4 }, (_, i) => (
            <button key={i} onClick={() => setIndex(i + 1)} className={`h-2 rounded-full transition-all ${Index === i + 1 ? 'bg-white w-12' : 'bg-white/40 w-6'}`}></button>
          ))}
        </div>
      </section>

      <section className='relative md:px-20 md:py-20 px-6 py-8'>
        <h2 className="uppercase font-semibold text-3xl md:text-6xl font-montserrat mb-4">Let&apos;s Vote</h2>
        <div className="flex max-sm:flex-col justify-between w-full gap-6 max-sm:items-end">
          <p className="max-w-lg">For any inquiries. collaborations, or just to say hello, we&apos;d love to hear from you! Reach out. and let&apos;s connect</p>
          <Link href='pasanggiri/vote' className="px-6 py-2 w-fit h-fit bg-white/10 backdrop-blur-sm rounded-full border border-white text-nowrap max-sm:ml-auto">Lihat Semua</Link>
        </div>
        <div className="max-sm:px-4">
          <Carousel className='w-full mt-8'>
            <CarouselContent className='md:-ml-12'>
              {finalists.map((finalist, index) => (
                <CarouselItem key={index + finalist.name} className='md:basis-3/10 md:pl-12'>
                  <Link href={'pasanggiri/voting/' + finalist.name.replace(" ", "-").toLowerCase()} className="bg-[url(/texture/grid.png)] w-full aspect-square object-cover rounded-2xl overflow-hidden relative flex flex-col">
                    <div className=" w-full h-[calc(100%-24px)] flex">
                      <Image src='/fullbody-2.png' alt='' width={1920} height={1080} className='w-3/5 object-cover object-top mt-4' />
                      <div className="w-2/5 h-full flex flex-col">
                        <div className="pr-10 flex justify-end">
                          <div style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 90%, 0 100%)',
                            textOrientation: 'upright',
                            writingMode: 'vertical-rl',
                          }} className="bg-fb-400 w-10 h-32 flex items-center text-sm font-semibold pt-2">MD-17</div>
                        </div>

                        <div className="flex items-center pl-4 text-black flex-1 font-medium">
                          <p className="font-montserrat pr-6">{finalist.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-6 w-full bg-dgb-300 px-4 text-[10px] flex items-center gap-10 justify-center">
                      <p className="">mokagarut</p>
                      <p className="">mokagarut</p>
                      <p className="">mokagarut</p>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className='bg-white/40 text-[#303030] max-sm:translate-x-4' />
            <CarouselNext className='bg-white/40 text-[#303030] max-sm:-translate-x-4' />
          </Carousel>
        </div>
      </section>

      <section className='relative md:px-20 md:py-20 px-6 py-8'>
        <h2 className="uppercase font-semibold text-3xl md:text-6xl font-montserrat mb-4 place-self-end">Hasil Seleksi</h2>
        <p className="max-w-lg text-right place-self-end">For any inquiries. collaborations, or just to say hello, we&apos;d love to hear from you! Reach out. and let&apos;s connect</p>

        <div className="flex gap-4 font-montserrat *:transition-all mt-4">
          <button onClick={() => setYear(2025)} className={cn("rounded-full bg-white/20 backdrop-blur-sm border border-white flex font-medium py-1.5 px-6", year === 2025 && "bg-fb", year === 2025 || "hover:bg-white/40")}>2025</button>
          <button onClick={() => setYear(2024)} className={cn("rounded-full bg-white/20 backdrop-blur-sm border border-white flex font-medium py-1.5 px-6", year === 2024 && "bg-fb", year === 2024 || "hover:bg-white/40")}>2024</button>
          <button onClick={() => setYear(2023)} className={cn("rounded-full bg-white/20 backdrop-blur-sm border border-white flex font-medium py-1.5 px-6", year === 2023 && "bg-fb", year === 2023 || "hover:bg-white/40")}>2023</button>
        </div>

        <Accordion type="single" collapsible className='bg-white/35 backdrop-blur mt-8 rounded-2xl px-6'>
          <AccordionItem value="item-1" className='border-b-[0.5px] border-white'>
            <AccordionTrigger className='text-md'>Semi Finalis</AccordionTrigger>
            <AccordionContent className='text-black'>
              <DataTable columns={standingColumn} data={finalists} />
            </AccordionContent>

          </AccordionItem>
          <AccordionItem value="item-2" className='border-b-[0.5px] border-white'>
            <AccordionTrigger className='text-md'>Finalis</AccordionTrigger>
            <AccordionContent>

            </AccordionContent>

          </AccordionItem>
          <AccordionItem value="item-2" className='border-b-[0.5px] border-white'>
            <AccordionTrigger className='text-md'>Pemenang</AccordionTrigger>
            <AccordionContent>

            </AccordionContent>

          </AccordionItem>
        </Accordion>

      </section>

      <section className="md:px-20 md:py-20 px-6 py-8">
        <h2 className="uppercase font-semibold text-3xl md:text-6xl font-montserrat mb-8 md:mb-16 md:place-self-center">Our Sponsor</h2>
        <div className="w-full flex flex-wrap gap-6 md:gap-12 justify-center">
          {sponsors.map((sponsor, index) => (
            <SponsorItem key={index + sponsor.name} title={sponsor.name} src={sponsor.src} size='lg' />
          ))}
        </div>
      </section>

    </main>
  )
}