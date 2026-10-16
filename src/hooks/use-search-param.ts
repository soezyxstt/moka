'use client';
import { useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Reads one URL search param and returns a setter that updates it in place.
 * Uses the native History API, which Next.js syncs with `useSearchParams`,
 * so the value survives refresh without refetching the server component.
 */
export function useSearchParam(key: string, fallback: string) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const value = searchParams.get(key) ?? fallback;
  const setValue = useCallback((next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === fallback) params.delete(key);
    else params.set(key, next);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
  }, [fallback, key, pathname, searchParams]);
  return [value, setValue] as const;
}
