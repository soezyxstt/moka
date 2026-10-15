"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { BrandLogo } from "@/server/cms/brand-assets";

export type AdminBranding = { title: string; slogan: string | null; logo: BrandLogo; background: string | null };
const BrandingContext = createContext<AdminBranding>({ title: "PAMOKA Garut", slogan: null, logo: null, background: null });
export function AdminBrandProvider({ value, children }: { value: AdminBranding; children: ReactNode }) {
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
export function useAdminBranding() { return useContext(BrandingContext); }
