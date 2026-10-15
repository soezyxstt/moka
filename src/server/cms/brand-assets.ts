import type { Metadata, MetadataRoute } from "next";
import type { PublicSiteAsset, PublicSiteAssets } from "./site-assets";

export function resolveBrandLogos(assets: PublicSiteAssets, legacy: { logoUrl: string | null; logoAlt: string | null; logoMimeType?: string | null }) {
  const fallback = legacy.logoUrl ? { url: legacy.logoUrl, alt: legacy.logoAlt, mimeType: legacy.logoMimeType ?? "image/png" } : null;
  return {
    desktop: assets["brand.navbar.desktop"] ?? assets["brand.combined.dark"] ?? assets["brand.logo.dark"] ?? fallback,
    mobile: assets["brand.navbar.mobile"] ?? assets["brand.combined.light"] ?? assets["brand.logo.light"] ?? fallback,
    footer: assets["brand.footer"] ?? assets["brand.combined.dark"] ?? assets["brand.logo.dark"] ?? fallback,
  };
}

export function brandMetadata(assets: PublicSiteAssets): Pick<Metadata, "icons" | "openGraph" | "twitter" | "manifest"> {
  const favicon = assets["brand.favicon"];
  const apple = assets["brand.apple"];
  const social = assets["site.social.image"];
  return {
    icons: {
      icon: favicon ? [{ url: favicon.url, type: favicon.mimeType }] : [],
      apple: apple ? [{ url: apple.url, type: apple.mimeType }] : [],
    },
    manifest: "/manifest.webmanifest",
    openGraph: { images: social ? [{ url: social.url, alt: social.alt ?? "MOKA Garut" }] : [] },
    twitter: { card: "summary_large_image", images: social ? [social.url] : [] },
  };
}

export function brandManifestIcons(assets: PublicSiteAssets): NonNullable<MetadataRoute.Manifest["icons"]> {
  return ([
    ["brand.icon192", "192x192", "any"],
    ["brand.icon512", "512x512", "any"],
    ["brand.maskable", "512x512", "maskable"],
  ] as const).flatMap(([key, sizes, purpose]) => assets[key] ? [{ src: assets[key].url, type: assets[key].mimeType, sizes, purpose }] : []);
}

export type BrandLogo = PublicSiteAsset | null;
