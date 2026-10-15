import { load } from "cheerio";
import { mediaPolicy } from "./policy";

const elements = new Set("svg g path rect circle ellipse line polyline polygon title desc defs clipPath mask linearGradient radialGradient stop text tspan".split(" "));
const attributes = new Set("xmlns xmlns:xlink id version width height viewBox x y x1 y1 x2 y2 cx cy r rx ry d points transform fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity clip-path clip-rule mask gradientUnits gradientTransform offset stop-color stop-opacity font-family font-size font-weight text-anchor dominant-baseline preserveAspectRatio".split(" "));

export function assertStaticSvg(source: string) {
  if (!source.trim() || /<!DOCTYPE|<!ENTITY|<\?(?!xml\s)/i.test(source)) throw new Error("SVG harus berupa vektor statis tanpa entitas eksternal");
  const document = load(source, { xmlMode: true });
  const roots = document.root().children();
  if (roots.length !== 1 || roots[0].tagName !== "svg") throw new Error("Dokumen SVG tidak valid");
  document("*").each((_, node) => {
    if (node.type !== "tag") throw new Error("SVG hanya menerima bentuk dan teks statis");
    if (!elements.has(node.tagName)) throw new Error("SVG hanya menerima bentuk dan teks statis");
    for (const [name, value] of Object.entries(node.attribs)) {
      if (!attributes.has(name) || /url\s*\(/i.test(value) && !/^url\(#[\w.-]+\)$/.test(value)) throw new Error("SVG tidak boleh memuat skrip, gaya aktif, atau sumber eksternal");
      if (["fill", "stroke", "stop-color"].includes(name) && !/^(?:#[a-f\d]{3,8}|[a-z]+|(?:rgb|rgba|hsl|hsla)\([\d\s.,%/+-]+\)|url\(#[\w.-]+\))$/i.test(value)) throw new Error("Warna SVG harus berupa nilai statis");
      if (["clip-path", "mask"].includes(name) && value !== "none" && !/^url\(#[\w.-]+\)$/.test(value)) throw new Error("Referensi SVG harus berada di dokumen yang sama");
      if (name === "xmlns" && value !== "http://www.w3.org/2000/svg" || name === "xmlns:xlink" && value !== "http://www.w3.org/1999/xlink") throw new Error("Namespace SVG tidak valid");
    }
  });
}

export async function validateUploadedSvg(url: string) {
  const target = new URL(url);
  if (target.protocol !== "https:" || target.username || target.password || !(target.hostname.endsWith(".ufs.sh") || target.hostname === "utfs.io")) throw new Error("Sumber SVG harus dari UploadThing");
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(15_000) });
  if (!response.ok || !response.body) throw new Error("SVG unggahan belum dapat diverifikasi");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > mediaPolicy.image.applicationMaxBytes) throw new Error("SVG melebihi batas ukuran gambar");
      chunks.push(chunk.value);
    }
  } finally { await reader.cancel(); }
  assertStaticSvg(Buffer.concat(chunks).toString("utf8"));
}
