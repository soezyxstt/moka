"use client";

import { usePathname } from "next/navigation";

import { SiteMotion } from "@/components/site-motion";

type SiteChromeProps = {
  children: React.ReactNode;
  top?: React.ReactNode;
  bottom?: React.ReactNode;
};

/**
 * Keeps the public presentation layer out of the CMS and monitor surfaces.
 * The root layout still owns the shared shell, while each product surface can
 * keep its own navigation and density. Public pages are wrapped in SiteMotion
 * for smooth staggered text and content reveal animations.
 */
export function SiteChrome({ children, top, bottom }: SiteChromeProps) {
  const pathname = usePathname();
  const isPrivateSurface = pathname?.startsWith("/admin") || pathname?.startsWith("/monitor");

  if (isPrivateSurface) {
    return <>{children}</>;
  }

  return (
    <SiteMotion>
      {top}
      {children}
      {bottom}
    </SiteMotion>
  );
}
