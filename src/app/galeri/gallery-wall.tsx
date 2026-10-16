"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, Pause, Play, X } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Button } from "@/components/custom/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import YouTubeEmbed from "@/components/youtube-embed";
import { cn } from "@/lib/utils";
import type { PublicGalleryAlbum } from "@/server/cms/public-readers";
import type { GalleryMedia } from "./gallery-media";

const photoShapes = [
  "aspect-[3/4]",
  "aspect-[4/3]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[16/10]",
];

export interface GalleryWallProps {
  media: GalleryMedia[];
  albums?: PublicGalleryAlbum[];
  intro?: {
    title?: string | null;
    subtitle?: string | null;
    description?: string | null;
  } | null;
}

export default function GalleryWall({ media, albums = [], intro }: GalleryWallProps) {
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const systemReducedMotion = useReducedMotion();
  const [motionPaused, setMotionPaused] = useState(false);
  const isMotionDisabled = Boolean(systemReducedMotion || motionPaused);

  // Responsive column count: 3 on desktop, 2 on mobile
  const [columnCount, setColumnCount] = useState(3);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const updateCols = () => setColumnCount(mql.matches ? 2 : 3);
    updateCols();
    mql.addEventListener("change", updateCols);
    return () => mql.removeEventListener("change", updateCols);
  }, []);

  // Filter state
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Global scroll progress for the gallery page top bar
  const { scrollYProgress: pageScrollProgress } = useScroll();

  // Container scroll progress for the sticky counter-motion gallery window
  const { scrollYProgress: galleryProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const photos = useMemo(() => media.filter((item) => Boolean(item.imageUrl)), [media]);
  const videos = useMemo(() => media.filter((item) => Boolean(item.youtubeId)), [media]);

  // Extract unique album options
  const albumTabs = useMemo(() => {
    const list = [{ slug: "all", title: "Semua" }];
    const seen = new Set<string>();

    for (const album of albums) {
      if (album.slug && !seen.has(album.slug)) {
        seen.add(album.slug);
        list.push({ slug: album.slug, title: album.title });
      }
    }

    // In case media has albums not in the albums list
    for (const item of photos) {
      if (item.albumSlug && item.albumTitle && !seen.has(item.albumSlug)) {
        seen.add(item.albumSlug);
        list.push({ slug: item.albumSlug, title: item.albumTitle });
      }
    }

    return list;
  }, [albums, photos]);

  const filteredPhotos = useMemo(() => {
    if (selectedAlbum === "all") return photos;
    return photos.filter((p) => p.albumSlug === selectedAlbum);
  }, [photos, selectedAlbum]);

  const currentPhoto = selectedPhotoIndex === null ? null : filteredPhotos[selectedPhotoIndex];

  function movePhoto(step: number) {
    setSelectedPhotoIndex((curr) => {
      if (curr === null || filteredPhotos.length === 0) return null;
      return (curr + step + filteredPhotos.length) % filteredPhotos.length;
    });
  }

  // Feature passage photo (use the cover of first album or first photo)
  const passagePhoto = useMemo(() => {
    return photos.find((p) => p.isCover) ?? photos[0] ?? null;
  }, [photos]);

  // Calculate dynamic scroll runway height based on photo count
  const runwayHeightStyle = useMemo(() => {
    if (isMotionDisabled) return { height: "auto" };
    const rows = Math.ceil(filteredPhotos.length / columnCount);
    // At least 140svh, plus ~55svh per row to allow smooth progressive scroll
    const svh = Math.max(140, rows * 55 + 90);
    return { height: `${svh}svh` };
  }, [isMotionDisabled, filteredPhotos.length, columnCount]);

  return (
    <div className="relative">
      {/* Scroll Progress Bar at the top of the viewport */}
      <motion.div
        style={{ scaleX: pageScrollProgress }}
        className="fixed top-0 inset-x-0 z-50 h-[3px] origin-left bg-linear-to-r from-brand-700 via-highlight-500 to-highlight-400 pointer-events-none"
        aria-hidden="true"
      />

      {/* Header & Filter Controls Section */}
      <section className="relative px-6 pt-28 pb-8 md:px-12 md:pt-36 md:pb-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-brand-200/70 pb-8"
        >
          <div>
            <h1 className="font-manrope text-4xl font-semibold tracking-tight text-brand-900 md:text-6xl">
              {intro?.title || "Galeri Dokumentasi"}
            </h1>
            <p className="mt-3 max-w-2xl font-inter text-base text-neutral-600 leading-relaxed">
              {intro?.subtitle ||
                intro?.description ||
                "Rekam jejak visual, pesona tradisi, dan ragam karya Pasanggiri Mojang Jajaka Kabupaten Garut."}
            </p>
          </div>

          {/* Pause motion toggle */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMotionPaused((prev) => !prev)}
              aria-pressed={motionPaused}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200/90 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-brand-800 shadow-xs backdrop-blur-xs transition-colors hover:bg-brand-100 hover:text-brand-950 focus-visible:outline-2 focus-visible:outline-brand"
            >
              {motionPaused ? (
                <>
                  <Play className="size-3 text-highlight-600" />
                  <span>Lanjut gerakan</span>
                </>
              ) : (
                <>
                  <Pause className="size-3 text-brand-600" />
                  <span>Jeda gerakan</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div
            role="group"
            aria-label="Filter album galeri"
            className="flex flex-wrap items-center gap-2"
          >
            {albumTabs.map((tab) => {
              const isActive = selectedAlbum === tab.slug;
              return (
                <motion.button
                  key={tab.slug}
                  type="button"
                  onClick={() => setSelectedAlbum(tab.slug)}
                  aria-pressed={isActive}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    isActive
                      ? "text-brand-950 font-semibold"
                      : "text-neutral-600 hover:text-brand-900"
                  )}
                >
                  {tab.title}
                  {isActive ? (
                    <motion.span
                      layoutId="gallery-active-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-brand-200/70"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                  {isActive ? (
                    <span className="size-1.5 rounded-full bg-brand-800" aria-hidden="true" />
                  ) : null}
                </motion.button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-neutral-500">
            {String(filteredPhotos.length).padStart(2, "0")} Foto
          </div>
        </div>
      </section>

      {/* Main Multi-Column Counter-Motion Gallery Wall */}
      <div
        ref={containerRef}
        className="relative px-4 md:px-8 max-w-[1600px] mx-auto"
        style={runwayHeightStyle}
      >
        {filteredPhotos.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-neutral-500">
            Belum ada foto terbit untuk kategori ini.
          </p>
        ) : isMotionDisabled ? (
          // Static Grid Fallback when motion is paused or prefers-reduced-motion
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 py-8">
            {filteredPhotos.map((photo, index) => (
              <figure
                key={photo.id}
                id={photo.albumSlug}
                className="group relative block overflow-hidden rounded-xl bg-brand-100/70 shadow-sm transition-shadow duration-500 hover:shadow-xl"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    openerRef.current = e.currentTarget;
                    setSelectedPhotoIndex(index);
                  }}
                  aria-label={`Perbesar foto: ${photo.alt}`}
                  className={cn(
                    "relative block w-full text-left overflow-hidden cursor-pointer",
                    photoShapes[index % photoShapes.length]
                  )}
                >
                  <Image
                    src={photo.imageUrl!}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading={index < 4 ? "eager" : "lazy"}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0">
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-brand-50 drop-shadow-sm font-manrope">
                        {photo.caption || photo.albumTitle || photo.alt}
                      </span>
                      {photo.albumTitle ? (
                        <span className="block truncate text-[11px] text-brand-200/90 drop-shadow-sm">
                          {photo.albumTitle}
                        </span>
                      ) : null}
                    </div>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-950/60 text-brand-50 backdrop-blur-xs">
                      <Expand className="size-4" />
                    </span>
                  </div>
                </button>
              </figure>
            ))}
          </div>
        ) : (
          // Sticky Counter-Motion Parallax Wall (Adapted directly from ginalist)
          <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 h-full items-start">
              {Array.from({ length: columnCount }, (_, colIdx) => (
                <CounterMotionColumn
                  key={colIdx}
                  column={colIdx}
                  columnCount={columnCount}
                  progress={galleryProgress}
                  photos={filteredPhotos.filter((_, idx) => idx % columnCount === colIdx)}
                  onSelect={(photo) => {
                    const originalIdx = filteredPhotos.findIndex((p) => p.id === photo.id);
                    setSelectedPhotoIndex(originalIdx >= 0 ? originalIdx : 0);
                  }}
                  openerRef={openerRef}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Parallax Image Passage */}
      {passagePhoto && photos.length > 3 ? (
        <ImagePassage photo={passagePhoto} isPaused={isMotionDisabled} />
      ) : null}

      {/* Video Showcase Section */}
      {videos.length > 0 ? <VideoSection videos={videos} /> : null}

      {/* Fullscreen Lightbox Modal Dialog */}
      <Dialog
        open={selectedPhotoIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPhotoIndex(null);
        }}
      >
        {currentPhoto?.imageUrl ? (
          <DialogContent
            aria-describedby={undefined}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              openerRef.current?.focus({ preventScroll: true });
            }}
            className="max-w-[calc(100%-1rem)] gap-0 border-0 bg-brand-950 p-0 shadow-2xl sm:max-w-[min(1280px,calc(100%-4rem))] [&>button:last-child]:hidden motion-reduce:animate-none rounded-2xl overflow-hidden"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                movePhoto(-1);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                movePhoto(1);
              }
            }}
          >
            <DialogTitle className="sr-only">{currentPhoto.alt}</DialogTitle>

            <div className="relative flex flex-col h-[85svh] bg-brand-950 text-brand-50" data-lenis-prevent>
              {/* Lightbox Top Header Bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-900/60 z-20 bg-brand-950/80 backdrop-blur-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-brand-400">
                    {String((selectedPhotoIndex ?? 0) + 1).padStart(2, "0")} /{" "}
                    {String(filteredPhotos.length).padStart(2, "0")}
                  </span>
                  {currentPhoto.albumTitle ? (
                    <span className="text-xs text-brand-200 truncate hidden sm:inline">
                      {currentPhoto.albumTitle}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <DialogClose asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-9 rounded-full bg-brand-900/80 text-brand-200 hover:bg-brand-800 hover:text-canvas"
                      aria-label="Tutup penampil foto"
                    >
                      <X className="size-4" />
                    </Button>
                  </DialogClose>
                </div>
              </div>

              {/* Main Image Container */}
              <div className="relative flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center p-4">
                <Image
                  src={currentPhoto.imageUrl}
                  alt={currentPhoto.alt}
                  fill
                  sizes="92vw"
                  className="object-contain"
                  priority
                />

                {/* Left/Right Navigation Buttons */}
                {filteredPhotos.length > 1 ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => movePhoto(-1)}
                      aria-label="Foto sebelumnya"
                      className="absolute left-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-brand-900/80 text-brand-200 hover:bg-brand-800 hover:text-canvas shadow-lg backdrop-blur-xs"
                    >
                      <ArrowLeft className="size-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => movePhoto(1)}
                      aria-label="Foto berikutnya"
                      className="absolute right-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-brand-900/80 text-brand-200 hover:bg-brand-800 hover:text-canvas shadow-lg backdrop-blur-xs"
                    >
                      <ArrowRight className="size-5" />
                    </Button>
                  </>
                ) : null}
              </div>

              {/* Bottom Caption Bar */}
              <div className="px-6 py-4 border-t border-brand-900/60 bg-brand-950/80 backdrop-blur-xs z-20">
                <p className="text-sm font-manrope font-medium text-brand-100 truncate">
                  {currentPhoto.caption || currentPhoto.alt}
                </p>
                {currentPhoto.albumTitle && currentPhoto.caption !== currentPhoto.albumTitle ? (
                  <p className="text-xs text-brand-400 mt-0.5 truncate">
                    Album: {currentPhoto.albumTitle}
                  </p>
                ) : null}
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

/**
 * Counter-motion column item adapted directly from ginalist.vercel.app:
 * Column 1 moves in the OPPOSING DIRECTION (counter-motion) to Column 0 and Column 2!
 */
function CounterMotionColumn({
  column,
  columnCount,
  progress,
  photos,
  onSelect,
  openerRef,
}: {
  column: number;
  columnCount: number;
  progress: MotionValue<number>;
  photos: GalleryMedia[];
  onSelect: (photo: GalleryMedia) => void;
  openerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const colRef = useRef<HTMLDivElement>(null);
  const [maxScroll, setMaxScroll] = useState(0);

  useEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const measure = () => {
      const parentH = el.parentElement?.clientHeight ?? window.innerHeight;
      setMaxScroll(Math.max(0, el.scrollHeight - parentH + 130));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    measure();
    return () => ro.disconnect();
  }, [photos.length]);

  // Transform calculation:
  // If 3 columns:
  // - col 0: moves [0, -maxScroll * 0.38, -maxScroll]
  // - col 1 (CENTER): starts at -maxScroll and moves to 0 (COUNTER-MOTION!)
  // - col 2: moves [0, -maxScroll * 0.68, -maxScroll]
  // If 2 columns:
  // - col 0: [0, -maxScroll]
  // - col 1: [-maxScroll, 0] (COUNTER-MOTION!)
  const y = useTransform(
    progress,
    [0, 0.5, 1],
    columnCount === 3
      ? column === 1
        ? [-maxScroll, -0.5 * maxScroll, 0]
        : column === 2
          ? [0, -0.68 * maxScroll, -maxScroll]
          : [0, -0.38 * maxScroll, -maxScroll]
      : column === 1
        ? [-maxScroll, -0.5 * maxScroll, 0]
        : [0, -0.5 * maxScroll, -maxScroll]
  );

  return (
    <motion.div
      ref={colRef}
      className={cn(
        "flex flex-col gap-6 md:gap-8 will-change-transform",
        column === 1 ? "pt-12 md:pt-20 z-10 md:-mx-1" : "pt-0"
      )}
      style={{ y }}
    >
      {photos.map((photo, idx) => (
        <motion.figure
          key={photo.id}
          initial={{ opacity: 0.85, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="group relative block m-0 overflow-hidden rounded-xl bg-brand-100/60 shadow-xs transition-shadow duration-500 hover:shadow-xl"
        >
          <button
            type="button"
            onClick={(e) => {
              openerRef.current = e.currentTarget;
              onSelect(photo);
            }}
            aria-label={`Perbesar foto: ${photo.alt}`}
            className={cn(
              "relative block w-full text-left overflow-hidden cursor-pointer",
              photoShapes[(idx + column) % photoShapes.length]
            )}
          >
            <Image
              src={photo.imageUrl!}
              alt={photo.alt}
              fill
              sizes="(max-width: 768px) 48vw, 32vw"
              loading={idx < 2 ? "eager" : "lazy"}
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            />
            {/* Scrim overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden="true"
            />
            {/* Floating info badge */}
            <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 opacity-0 transition-all duration-300 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0">
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-brand-50 drop-shadow-sm font-manrope">
                  {photo.caption || photo.albumTitle || photo.alt}
                </span>
                {photo.albumTitle && photo.caption && photo.caption !== photo.albumTitle ? (
                  <span className="block truncate text-[11px] text-brand-200/90 drop-shadow-sm">
                    {photo.albumTitle}
                  </span>
                ) : null}
              </div>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-950/60 text-brand-50 backdrop-blur-xs">
                <Expand className="size-4" />
              </span>
            </div>
          </button>
        </motion.figure>
      ))}
    </motion.div>
  );
}

/**
 * Parallax Image Passage section adapted directly from ginalist.vercel.app's `image-passage`
 */
function ImagePassage({
  photo,
  isPaused,
}: {
  photo: GalleryMedia;
  isPaused: boolean;
}) {
  const passageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: passageRef,
    offset: ["start end", "end start"],
  });
  const passageY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section
      ref={passageRef}
      className="relative h-[180svh] bg-brand-950 text-on-media overflow-hidden my-16 md:my-28"
      aria-label="Dokumentasi Pasanggiri Nu Nyunda Tur Nyakola"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ y: isPaused ? 0 : passageY }}
          className="absolute inset-[-20%_0] w-full h-[140%]"
        >
          <Image
            src={photo.imageUrl!}
            alt={photo.alt}
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>

        {/* Vignette and radial contrast overlay */}
        <div
          className="absolute inset-0 bg-radial-[at_50%_50%] from-brand-950/30 via-brand-950/60 to-brand-950/90 pointer-events-none"
          aria-hidden="true"
        />

        {/* Editorial topper typography */}
        <div className="relative z-10 flex h-full flex-col justify-end p-8 md:p-20 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-manrope text-4xl font-semibold tracking-tight text-on-media md:text-7xl drop-shadow-md">
              Nu Nyunda{" "}
              <span className="font-normal italic text-highlight-300">Tur Nyakola.</span>
            </h2>
            <p className="mt-4 max-w-xl font-inter text-sm md:text-base leading-relaxed text-on-media/85">
              Dokumentasi dedikasi generasi muda dalam melestarikan luhurnya adat, keanggunan budaya,
              serta pesona pariwisata Kabupaten Garut.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * Editorial Video section
 */
function VideoSection({ videos }: { videos: GalleryMedia[] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24 border-t border-brand-200/60">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-200/60 pb-6">
        <div>
          <h2 className="font-manrope text-3xl font-semibold tracking-tight text-brand-900 md:text-5xl">
            Dokumentasi <span className="font-normal italic">Video.</span>
          </h2>
          <p className="mt-2 text-sm md:text-base text-neutral-600 font-inter">
            Sorotan audiovisual kegiatan dan panggung utama.
          </p>
        </div>
        <span className="text-xs text-neutral-500 font-mono">
          {String(videos.length).padStart(2, "0")} Video
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {videos.map((video) => (
          <motion.div
            key={video.id}
            id={video.albumSlug}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="scroll-mt-28 overflow-hidden rounded-xl bg-brand-900 shadow-md"
          >
            <YouTubeEmbed id={video.youtubeId!} title={video.alt} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
