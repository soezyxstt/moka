import { z } from "zod";

const documentPresentation = z.object({
  documentMediaId: z.string().trim().min(1),
  documentTitle: z.string().trim().min(1).max(200).default("Dokumen legalitas organisasi"),
});

export function parsePublicDocument(value: string | undefined) {
  try {
    const parsed = documentPresentation.safeParse(JSON.parse(value ?? "{}"));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function publicPdfUrl(media: { url: string; mimeType: string; lifecycle: string } | undefined) {
  if (!media || media.lifecycle !== "ready" || media.mimeType !== "application/pdf") return null;
  try {
    const url = new URL(media.url);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
