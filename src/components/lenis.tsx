'use client';

import { useEffect } from 'react';
import * as LenisRaw from 'lenis'

export default function Lenis() {
  useEffect(() => {
    const lenis = new LenisRaw.default({
      lerp: 0.075,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);
  return null;
}