"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react'; // Import useScroll
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MotionButton = motion.create(Button);

export function ScrollToTopButton() {
  const { scrollY } = useScroll(); // Get the scrollY MotionValue
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // The subscribe method returns an unsubscribe function,
    // which useEffect will call on cleanup.
    const unsubscribe = scrollY.on("change", (latestValue) => {
      // Show button if scrolled more than one viewport height
      if (typeof window !== 'undefined') { // Ensure window is defined (for SSR safety, though less critical in client components)
        setIsVisible(latestValue > window.innerHeight);
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [scrollY]); // Re-run effect if scrollY MotionValue instance changes (though it typically doesn't)

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <MotionButton
          type="button"
          variant="ghost"
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed bottom-16 right-6 z-50 h-auto rounded-full bg-highlight-400 p-3 text-neutral-950 shadow-lg transition-all duration-200 hover:bg-highlight-300 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-highlight-300 focus:ring-offset-2 focus:ring-offset-transparent md:bottom-12 md:right-8"
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="size-6" aria-hidden="true" />
        </MotionButton>
      )}
    </AnimatePresence>
  );
}
