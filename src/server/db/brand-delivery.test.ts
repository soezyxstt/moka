import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { deliverBrandAsset } from "../cms/brand-delivery";
import { brandMetadata, brandManifestIcons, resolveBrandLogos } from "../cms/brand-assets";

const gold = { url: "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZRrXS5CeVoEnvZQz9sL4YbC8xI3BXdwOuNDFV6", alt: "Logo MOKA", mimeType: "image/svg+xml" };
const symbol = { ...gold, url: "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZRfFUSnOICwJhf529LVERs8eHPyxIQMlkaNTXF" };

test("logo situs dan favicon tetap terpisah tanpa akses host media", () => {
  const assets = { "brand.navbar.desktop": gold, "brand.footer": gold, "brand.favicon": symbol };
  const logos = resolveBrandLogos(assets, { logoUrl: null, logoAlt: null });
  assert.equal(logos.desktop?.url, "/brand/2026/moka-gold.svg");
  assert.equal(logos.footer?.url, "/brand/2026/moka-gold.svg");
  assert.deepEqual(brandMetadata(assets).icons, { icon: [{ url: "/brand/2026/symbol-navy.svg", type: "image/svg+xml" }], apple: [] });
  assert.deepEqual(resolveBrandLogos({ "brand.favicon": symbol }, { logoUrl: null, logoAlt: null }), { desktop: null, mobile: null, footer: null });
});

test("aset CMS pengganti, edisi lain, dan slot kosong tetap mengikuti CMS", () => {
  const replacement = { ...gold, url: "https://example.com/new-logo.svg" };
  assert.equal(deliverBrandAsset(replacement), replacement);
  assert.equal(deliverBrandAsset(null), null);
  assert.equal(deliverBrandAsset(undefined), undefined);
  assert.equal(resolveBrandLogos({ "brand.navbar.desktop": replacement }, { logoUrl: gold.url, logoAlt: gold.alt }).desktop, replacement);
  assert.equal(resolveBrandLogos({}, { logoUrl: gold.url, logoAlt: gold.alt }).footer?.url, "/brand/2026/moka-gold.svg");
  assert.deepEqual(brandManifestIcons({}), []);
});

test("semua pemetaan menunjuk berkas deploy dan ikon aplikasi mempertahankan ukuran", () => {
  const source = readFileSync(resolve("src/server/cms/brand-delivery.ts"), "utf8");
  const paths = [...source.matchAll(/"(\/brand\/2026\/[^\"]+)"/g)].map((match) => match[1]);
  assert.equal(paths.length, 7);
  for (const path of paths) assert.ok(existsSync(resolve(`public${path}`)), path);
  const icon = { ...gold, mimeType: "image/png", url: "https://yzk8cdswcm.ufs.sh/f/c1dT4ER90uZR4TO5U2EDUJB75zjHodIGw8MO3NEXqSuinCel" };
  assert.deepEqual(brandManifestIcons({ "brand.icon512": icon, "brand.maskable": icon }), [
    { src: "/brand/2026/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
    { src: "/brand/2026/icon-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
  ]);
});
