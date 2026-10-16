'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import * as LenisRaw from 'lenis';

export default function Lenis() {
  const pathname = usePathname();
  const isPrivateSurface = pathname?.startsWith('/admin') || pathname?.startsWith('/monitor');

  useEffect(() => {
    if (isPrivateSurface) return;

    const lenis = new LenisRaw.default({
      lerp: 0.075,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isPrivateSurface]);

  return null;
}