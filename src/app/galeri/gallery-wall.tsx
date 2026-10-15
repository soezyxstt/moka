"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/custom/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import YouTubeEmbed from "@/components/youtube-embed";
import type { GalleryMedia } from "./gallery-media";

const photoShapes = ["aspect-[4/3]", "aspect-[3/4]", "aspect-square"];

export default function GalleryWall({ media }: { media: GalleryMedia[] }) {
  const opener = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const down = useTransform(scrollYProgress, [0, 1], [0, 96]);
  const up = useTransform(scrollYProgress, [0, 1], [64, -64]);
  const [selected, setSelected] = useState<number | null>(null);
  const photos = media.filter((item) => item.imageUrl);
  const videos = media.filter((item) => item.youtubeId);
  const current = selected === null ? null : photos[selected];

  function movePhoto(direction: number) {
    setSelected((index) => index === null ? null : (index + direction + photos.length) % photos.length);
  }

  return (
    <div className="relative px-4 pb-14 md:px-8 md:pb-36">
      {!media.length ? <p className="px-4 py-12 text-muted-foreground">Belum ada foto terbit untuk edisi ini.</p> : null}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {[0, 1, 2].map((column) => (
            <motion.div key={column} style={{ y: reducedMotion ? 0 : column === 1 ? up : down }} className="flex min-w-0 flex-col gap-4 max-md:transform-none! md:gap-5">
              {photos.map((photo, index) => index % 3 === column ? (
                <motion.div key={photo.id} id={photo.albumSlug} className="scroll-mt-28" initial={reducedMotion ? false : { y: 18 }} whileInView={{ y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} viewport={{ once: true, margin: "0px 0px -40px 0px" }}>
                    <Button variant="ghost" type="button" aria-haspopup="dialog" onClick={(event) => { opener.current = event.currentTarget; setSelected(index); }} aria-label={`Perbesar foto: ${photo.alt}`} className={`group relative block h-auto w-full overflow-hidden rounded-lg bg-brand-100 p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${photoShapes[(Math.floor(index / 3) + column) % photoShapes.length]}`}>
                      <Image src={photo.imageUrl!} alt={photo.alt} fill sizes="(max-width: 767px) calc(100vw - 32px), 33vw" loading={index < 3 ? "eager" : "lazy"} className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105" />
                      <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/10" aria-hidden="true" />
                      <span className="absolute right-4 bottom-4 flex size-9 items-center justify-center rounded-md bg-ink/30 text-canvas opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true"><Expand className="size-4" /></span>
                    </Button>
                </motion.div>
              ) : null)}
            </motion.div>
          ))}
        </div>
        {current?.imageUrl ? (
          <DialogContent aria-describedby={undefined} onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus({ preventScroll: true }); }} className="max-w-[calc(100%-1rem)] gap-0 border-0 bg-brand-900 p-0 shadow-none sm:max-w-[min(1200px,calc(100%-4rem))] [&>button:last-child]:hidden motion-reduce:animate-none" onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              movePhoto(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}>
            <DialogTitle className="sr-only">{current.alt}</DialogTitle>
            <div className="relative h-[80svh]" data-lenis-prevent>
              <Image src={current.imageUrl} alt={current.alt} fill sizes="90vw" className="object-contain" />
              <DialogClose asChild><Button size="sm" className="absolute top-3 right-3 size-10 bg-brand-900/80" aria-label="Tutup foto"><X className="size-5" /></Button></DialogClose>
              {photos.length > 1 ? <div className="absolute inset-x-3 bottom-3 flex justify-between">
                <Button size="sm" className="size-10 bg-brand-900/80" onClick={() => movePhoto(-1)} aria-label="Foto sebelumnya"><ArrowLeft className="size-5" /></Button>
                <Button size="sm" className="size-10 bg-brand-900/80" onClick={() => movePhoto(1)} aria-label="Foto berikutnya"><ArrowRight className="size-5" /></Button>
              </div> : null}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
      {videos.length ? <div className="mx-auto mt-32 grid max-w-[1600px] gap-5 md:grid-cols-2">
        {videos.map((video) => <div key={video.id} id={video.albumSlug} className="scroll-mt-28 overflow-hidden rounded-lg"><YouTubeEmbed id={video.youtubeId!} title={video.alt} /></div>)}
      </div> : null}
    </div>
  );
}
