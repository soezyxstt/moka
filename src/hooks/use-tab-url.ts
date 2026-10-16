"use client";

import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function useTabUrl<T extends string>(
  validTabs: readonly T[],
  defaultTab?: T,
  paramKey?: string,
): readonly [T, (next: T) => void];
export function useTabUrl<T extends string>(
  defaultTab: T,
  paramKey?: string,
): readonly [T, (next: T) => void];
export function useTabUrl<T extends string>(
  tabsOrDefault: readonly T[] | T,
  defaultTabOrKey?: T | string,
  paramKey = "tab",
): readonly [T, (next: T) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isList = Array.isArray(tabsOrDefault);
  const validTabs = isList ? (tabsOrDefault as readonly T[]) : null;
  const fallback = isList
    ? ((defaultTabOrKey as T | undefined) ?? validTabs![0]!)
    : (tabsOrDefault as T);
  const key = isList ? paramKey : ((defaultTabOrKey as string | undefined) ?? "tab");

  const raw = searchParams.get(key);
  const activeTab =
    raw && (!validTabs || validTabs.includes(raw as T)) ? (raw as T) : fallback;

  const setActiveTab = useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === fallback) {
        params.delete(key);
      } else {
        params.set(key, next);
      }
      const query = params.toString();
      window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
    },
    [fallback, key, pathname, searchParams],
  );

  return [activeTab, setActiveTab] as const;
}
