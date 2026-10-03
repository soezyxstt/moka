"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

export default function EventCarousel({
  event,
  title,
  description,
  images,
}: {
  event: string;
  title: string;
  description: string;
  images: string[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', handleSelect);
    return () => {
      api.off('select', handleSelect);
    };
  }, [api]);

  return (
    <>
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
      >
        <CarouselContent className="relative ml-0 h-[90vh] w-screen cursor-grab active:cursor-grabbing">
          {images.map((src, index) => (
            <CarouselItem key={`${event}-${src}-${index}`} className="relative h-full w-screen pl-0">
              <Image
                src={src}
                alt={`Foto kegiatan ${title || 'PAMOKA'} ${index + 1}`}
                width={1000}
                height={1000}
                sizes="100vw"
                className="h-full w-screen object-cover"
                preload={index === 0}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="pointer-events-none absolute left-0 top-0 z-1 h-full w-full bg-linear-to-r from-black/65 via-black/65 to-transparent max-sm:via-100%" />
      <div className="pointer-events-none absolute left-8 top-1/2 z-10 h-fit w-full max-w-[calc(100vw-4rem)] -translate-y-1/2 space-y-4 animate-fade-in md:left-20 md:max-w-sm">
        <h1 className="font-montserrat text-5xl font-semibold capitalize text-white">{title}</h1>
        <p>{description}</p>
      </div>
      <div className="absolute bottom-20 left-8 z-10 flex h-2 gap-2 md:left-20">
        {images.map((_, index) => (
          <button
            type="button"
            key={`${event}-slide-${index}`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Tampilkan foto ${index + 1}`}
            aria-pressed={current === index}
            className={`h-2 rounded-full transition-all ${current === index ? 'w-12 bg-white' : 'w-6 bg-white/40'}`}
          />
        ))}
      </div>
    </>
  );
}
