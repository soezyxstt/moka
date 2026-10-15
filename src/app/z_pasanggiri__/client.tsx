"use client";

import { m } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DataTable } from '@/components/data-table';
import { standingColumn } from './column';
import SponsorItem from './sponsor';

type FinalistData = { id: string; name: string; title: string };
type SponsorData = { name: string; src: string };

export default function LegacyPasanggiriClient({ finalists, sponsors }: { finalists: FinalistData[]; sponsors: SponsorData[] }) {
  return (
    <main className="relative bg-[url(/art-center-1.png)] bg-fixed md:bg-size-[100lvw_100lvh] bg-size-[auto_100lvh] bg-center bg-no-repeat text-canvas max-sm:overflow-x-hidden">
      <section className="relative h-[90vh] text-canvas font-manrope">
        <m.div className="relative z-0 w-full h-full">
          <Image src="/galdin.png" alt="" width={1920} height={1080} className="w-full h-full object-cover" />
        </m.div>
        <div className="absolute z-1 w-full h-full bg-linear-to-r from-ink/65 via-ink/65 to-transparent top-0" />
        <div className="absolute md:max-w-sm md:left-20 left-8 top-1/2 w-full z-10 h-fit -translate-y-1/2">
          <h2 className="font-manrope text-5xl font-semibold text-canvas">Gala Dinner Night</h2>
        </div>
      </section>

      <section className="relative md:px-20 md:py-20 px-6 py-8">
        <h2 className="uppercase font-semibold text-3xl md:text-6xl font-manrope mb-4">Let&apos;s Vote</h2>
        <div className="flex max-sm:flex-col justify-between w-full gap-6 max-sm:items-end">
          <p className="max-w-lg">Dukung finalis pilihanmu melalui halaman voting.</p>
          <Link href="/voting" className="px-6 py-2 w-fit h-fit bg-canvas/10 backdrop-blur-sm rounded-full border border-canvas text-nowrap max-sm:ml-auto">Lihat Semua</Link>
        </div>
        <div className="max-sm:px-4">
          <Carousel className="w-full mt-8">
            <CarouselContent className="md:-ml-12">
              {finalists.map((finalist) => (
                <CarouselItem key={finalist.id} className="md:basis-3/10 md:pl-12">
                  <div className="bg-[url(/texture/grid.png)] w-full aspect-square object-cover rounded-2xl overflow-hidden relative flex flex-col">
                    <div className="w-full h-[calc(100%-24px)] flex">
                      <Image src="/fullbody-2.png" alt="" width={1920} height={1080} className="w-3/5 object-cover object-top mt-4" />
                      <div className="w-2/5 h-full flex flex-col">
                        <div className="pr-10 flex justify-end">
                          <div className="bg-highlight-400 text-ink w-10 h-32 flex items-center text-sm font-semibold pt-2" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 90%, 0 100%)', writingMode: 'vertical-rl' }}>{finalist.title}</div>
                        </div>
                        <div className="flex items-center pl-4 text-ink flex-1 font-medium"><p className="font-manrope pr-6">{finalist.name}</p></div>
                      </div>
                    </div>
                    <div className="h-6 w-full bg-brand-300 px-4 text-[10px] text-brand-900 flex items-center gap-10 justify-center">
                      <p>mokagarut</p><p>mokagarut</p><p>mokagarut</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-canvas/40 text-foreground max-sm:translate-x-4" />
            <CarouselNext className="bg-canvas/40 text-foreground max-sm:-translate-x-4" />
          </Carousel>
        </div>
      </section>

      <section className="relative md:px-20 md:py-20 px-6 py-8">
        <h2 className="uppercase font-semibold text-3xl md:text-6xl font-manrope mb-4 place-self-end">Hasil Seleksi</h2>
        <p className="max-w-lg text-right place-self-end">Data finalis ditampilkan dari database Turso.</p>
        <Accordion type="single" collapsible className="bg-canvas/35 backdrop-blur mt-8 rounded-2xl px-6">
          <AccordionItem value="semifinalis" className="border-b-[0.5px] border-canvas">
            <AccordionTrigger className="text-md">Finalis</AccordionTrigger>
            <AccordionContent className="text-ink"><DataTable columns={standingColumn} data={finalists} /></AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="md:px-20 md:py-20 px-6 py-8">
        <h2 className="uppercase font-semibold text-3xl md:text-6xl font-manrope mb-8 md:mb-16 md:place-self-center">Our Sponsor</h2>
        <div className="w-full flex flex-wrap gap-6 md:gap-12 justify-center">
          {sponsors.map((sponsor) => <SponsorItem key={sponsor.name + sponsor.src} title={sponsor.name} src={sponsor.src} size="lg" />)}
        </div>
      </section>
    </main>
  );
}
