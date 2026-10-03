"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

type HeroVideoProps = {
  children: React.ReactNode;
  fallbackImageSrc: string;
  videoWebMSrc?: string;
  videoMp4Src?: string;
};

export default function HeroVideo({ children, fallbackImageSrc, videoWebMSrc, videoMp4Src }: HeroVideoProps) {
  const hasVideo = Boolean(videoWebMSrc || videoMp4Src);
  const [videoReady, setVideoReady] = useState(false);
  return (
    <section className="relative min-h-[38rem] w-full overflow-hidden bg-dgb-900 pt-16 text-white md:h-[82svh]">
      <AnimatePresence>
        {(!hasVideo || !videoReady) ? <motion.div key="fallback" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0"><Image src={fallbackImageSrc} alt="" fill preload sizes="100vw" className="object-cover" /></motion.div> : null}
      </AnimatePresence>
      {hasVideo ? (
        <motion.video autoPlay loop muted playsInline preload="metadata" onCanPlay={() => setVideoReady(true)} initial={{ opacity: 0 }} animate={{ opacity: videoReady ? 1 : 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 h-full w-full object-cover">
          {videoWebMSrc ? <source src={videoWebMSrc} type="video/webm" /> : null}
          {videoMp4Src ? <source src={videoMp4Src} type="video/mp4" /> : null}
        </motion.video>
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,11,9,0.9),rgba(13,44,38,0.62),rgba(3,11,9,0.22))]" />
      <div className="relative mx-auto flex min-h-[calc(38rem-4rem)] w-full max-w-7xl flex-col justify-center px-6 py-14 md:h-[calc(82svh-4rem)] md:px-10 lg:px-12">{children}</div>
    </section>
  );
}
