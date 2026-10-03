// components/HeroVideo.tsx
'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

interface HeroVideoProps {
  children: React.ReactNode;
  fallbackImageSrc: string | null;
  videoWebMSrc: string | null;
  videoMp4Src: string | null;
}

const HeroVideo: React.FC<HeroVideoProps> = ({ children, fallbackImageSrc, videoWebMSrc, videoMp4Src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [readyVideoSource, setReadyVideoSource] = useState<string | null>(null);
  const videoSource = videoWebMSrc ?? videoMp4Src;
  const videoReady = videoSource !== null && readyVideoSource === videoSource;
  const showFallback = !videoSource || !videoReady;

  return (
    <div className="relative h-[90lvh] w-full overflow-hidden bg-dgb-900">
      <AnimatePresence>
        {showFallback && fallbackImageSrc && (
          <motion.div
            key="fallback-image"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeOut" } }}
            className="absolute inset-0 z-0"
          >
            <Image
              src={fallbackImageSrc}
              alt="Latar kategori"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {(videoWebMSrc || videoMp4Src) && (
        <motion.video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onCanPlayThrough={() => {
            if (videoSource) setReadyVideoSource(videoSource);
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: videoReady ? 1 : 0 }}
          transition={{ duration: 1.0, ease: "easeIn" }}
          className="absolute inset-0 z-0 h-full w-full object-cover"
        >
          {videoWebMSrc && <source src={videoWebMSrc} type="video/webm" />}
          {videoMp4Src && <source src={videoMp4Src} type="video/mp4" />}
        </motion.video>
      )}

      <div className="absolute inset-0 bg-black opacity-50 z-10"></div>

      <div className="absolute inset-0 flex justify-center flex-col text-white md:px-20 px-8 text-sm z-20">
        {children}
      </div>
    </div>
  );
};

export default HeroVideo;
