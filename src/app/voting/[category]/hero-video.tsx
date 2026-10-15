'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

interface HeroVideoProps {
  children: React.ReactNode;
  fallbackImageSrc: string;
  videoWebMSrc: string;
  videoMp4Src: string;
}

const HeroVideo: React.FC<HeroVideoProps> = ({ children, fallbackImageSrc, videoWebMSrc }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState<boolean>(false);
  const [showFallback, setShowFallback] = useState<boolean>(true);

  useEffect(() => {
    const videoElement = videoRef.current;

    const handleCanPlayThrough = () => {
      // console.log('Video canplaythrough event fired. Setting videoReady to true.');
      setVideoReady(true);
      setTimeout(() => {
        setShowFallback(false);
      }, 300); // Give a slight delay for smooth visual transition
    };

    if (videoElement) {
      if (videoElement.readyState >= 4) { // HAVE_ENOUGH_DATA
        // console.log('Video already ready on mount.');
        handleCanPlayThrough();
      } else {
        videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
      }
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[90lvh] overflow-hidden"> {/* Adjusted height to match your layout */}
      {/* Framer Motion AnimatePresence for smooth unmounting of the fallback image */}
      <AnimatePresence>
        {showFallback && (
          <motion.div
            key="fallback-image"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeOut" } }}
            className="absolute inset-0 z-0"
          >
            <Image
              src={fallbackImageSrc} // Use prop for dynamic image source
              alt="Background image fallback"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Video Element with Framer Motion */}
      <motion.video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: videoReady ? 1 : 0 }}
        transition={{ duration: 1.0, ease: "easeIn" }}
        className="absolute inset-0 w-full h-full object-cover z-0"
        // onLoadedData={() => console.log('Video metadata loaded (video onLoadedData)')}
        // onPlay={() => console.log('Video started playing (video onPlay)')}
        // onError={(e) => console.error('Video error:', e)}
      >
        <source src={videoWebMSrc} type="video/webm" /> {/* Use prop */}
        {/* <source src={videoMp4Src} type="video/mp4" />   Use prop */}
        Your browser does not support the video tag. Please update your browser.
      </motion.video>

      <div className="absolute inset-0 bg-ink opacity-50 z-10"></div>

      {/* Content over the video */}
      <div className="absolute inset-0 flex justify-center flex-col text-canvas md:px-20 px-8 text-sm z-20">
        {children}
      </div>
    </div>
  );
};

export default HeroVideo;
