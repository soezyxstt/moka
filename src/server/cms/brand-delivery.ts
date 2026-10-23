import type { PublicSiteAsset } from "./site-assets";

// Pin only byte-verified kit URLs; new CMS media keep their selected URL.
const bundledAssets: Record<string, string> = {
  "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZR4TO5U2EDUJB75zjHodIGw8MO3NEXqSuinCel": "/brand/2026/icon-512.png",
  "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZRfFUSnOICwJhf529LVERs8eHPyxIQMlkaNTXF": "/brand/2026/symbol-navy.svg",
  "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZRjcqOdiUToNTy0Z4g3KWk78GmHnpd6UJOeiPB": "/brand/2026/icon-192.png",
  "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZRpQroDlA6RiHKCJQNIVy3kLpgjUzl4Bba7Eq1": "/brand/2026/apple-touch-icon.png",
  "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZRq3E0OCPbuAeZB3RfPUQozliKhF4ry09pvGmx": "/brand/2026/moka-navy.svg",
  "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZRrXS5CeVoEnvZQz9sL4YbC8xI3BXdwOuNDFV6": "/brand/2026/moka-gold.svg",
  "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZRyaJCIgjNRlE0rUuTiXkbLHngec3JZKAWDxYC": "/brand/2026/og-navy.png",
};

export function deliverBrandAsset<T extends PublicSiteAsset | null | undefined>(asset: T): T {
  const url = asset && bundledAssets[asset.url];
  return url ? { ...asset, url } : asset;
}
