export function validateWebsiteUrl(urlStr: string | null | undefined): string | null {
  if (!urlStr) return null;
  const trimmed = urlStr.trim();
  if (trimmed.length === 0) return null;

  if (/^(javascript|data):/i.test(trimmed)) {
    throw new Error("Format URL tidak valid");
  }

  // Handle @handle shorthand for social profile (e.g. @mokagarut -> https://instagram.com/mokagarut)
  let candidate = trimmed;
  if (candidate.startsWith("@")) {
    const handle = candidate.slice(1).trim();
    if (handle.length === 0) {
      throw new Error("Handle sosial tidak boleh kosong");
    }
    candidate = `https://instagram.com/${handle}`;
  } else if (!/^https?:\/\//i.test(candidate)) {
    candidate = candidate.startsWith("//") ? `https:${candidate}` : `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error();
    }
    if (!parsed.hostname || (!parsed.hostname.includes(".") && parsed.hostname !== "localhost")) {
      throw new Error();
    }
    return parsed.href;
  } catch {
    throw new Error("URL website tidak valid, gunakan format seperti https://contoh.co.id atau instagram.com/sponsor");
  }
}
