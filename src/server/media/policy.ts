export const mediaMimeTypes = {
  image: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"],
  video: ["video/mp4", "video/webm"],
  pdf: ["application/pdf"],
} as const;

const megabyte = 1024 * 1024;

export type MediaUploadKind = keyof typeof mediaMimeTypes;

export function isAllowedMediaMimeType(kind: MediaUploadKind, mimeType: string) {
  return (mediaMimeTypes[kind] as readonly string[]).includes(mimeType);
}

export function mediaSizeLabel(kind: MediaUploadKind) {
  return `${mediaPolicy[kind].applicationMaxBytes / megabyte} MB`;
}

export const mediaPolicy = {
  image: { maxFileSize: "32MB" as const, maxFileCount: 10, applicationMaxBytes: 20 * megabyte, allowedMimeTypes: mediaMimeTypes.image },
  video: { maxFileSize: "512MB" as const, maxFileCount: 1, applicationMaxBytes: 512 * megabyte, allowedMimeTypes: mediaMimeTypes.video },
  pdf: { maxFileSize: "64MB" as const, maxFileCount: 5, applicationMaxBytes: 64 * megabyte, allowedMimeTypes: mediaMimeTypes.pdf },
};
