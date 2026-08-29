"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useScroll } from 'motion/react'; // Import useScroll
import { ArrowUp } from 'lucide-react';

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
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed bottom-8 right-8 z-50 p-3 bg-white/30 backdrop-blur-md text-slate-700 hover:bg-white/50 hover:text-slate-900 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-fb-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}