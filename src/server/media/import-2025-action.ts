"use server";

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";

import { desc, inArray } from "drizzle-orm";
import { UTApi, UTFile } from "uploadthing/server";

import { categories, logoNames } from "@/lib/data";
import { ketua, pengurus } from "@/lib/organogram";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import { mediaAssets } from "@/server/db/schema";
import { isAllowedMediaMimeType, mediaPolicy, type MediaUploadKind } from "@/server/media/policy";
import { persistUploadedMediaAsset } from "@/server/media/persistence";

type MediaEntry = {
  filename: string;
  kind: MediaUploadKind;
  mimeType: string;
  alt: string | null;
  decorative: boolean;
};

type CheckedMediaEntry = MediaEntry & { absolutePath: string; bytes: number };
type RemoteMediaFile = { key: string; size: number; status: string };

const batchSize = 5;
const eventFolders = [
  ["audisi", 10, "Audisi"],
  ["semifinal", 10, "Semifinal"],
  ["karantina", 10, "Karantina"],
  ["unjuk-kabisa", 10, "Unjuk Kabisa"],
  ["gala-dinner", 10, "Gala Dinner"],
  ["grand-final", 10, "Grand Final"],
] as const;
const participantCodes = ["JD", "MD", "JR", "MR"] as const;
const mimeByExtension: Record<string, { mimeType: string; kind: MediaUploadKind }> = {
  ".jpg": { mimeType: "image/jpeg", kind: "image" },
  ".jpeg": { mimeType: "image/jpeg", kind: "image" },
  ".png": { mimeType: "image/png", kind: "image" },
  ".webp": { mimeType: "image/webp", kind: "image" },
  ".webm": { mimeType: "video/webm", kind: "video" },
  ".pdf": { mimeType: "application/pdf", kind: "pdf" },
};

function stableCustomId(filename: string) {
  const id = `import-${createHash("sha256").update(filename).digest("hex").slice(0, 32)}`;
  return filename === "/sponsors/LAVIOSA.png" ? `${id}-v2` : id;
}

function humanize(value: string) {
  return value.replace(/\.[^.]+$/, "").replaceAll(/[_-]+/g, " ").replaceAll(/\s+/g, " ").trim();
}

function safeSegment(value: string) {
  if (!value || value === "." || value === ".." || value.includes("/") || value.includes("\\")) {
    throw new Error("Daftar aset 2025 tidak valid");
  }
  return value;
}

async function get2025MediaManifest(): Promise<MediaEntry[]> {
  const entries = new Map<string, MediaEntry>();
  const add = (sourcePath: string, alt: string | null, decorative = false) => {
    const filename = `/${sourcePath.replaceAll("\\", "/").replace(/^\/+/, "")}`;
    if (filename.slice(1).split("/").some((segment) => !segment || segment === "." || segment === "..")) {
      throw new Error("Daftar aset 2025 tidak valid");
    }
    const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    const media = mimeByExtension[extension];
    if (!media || !isAllowedMediaMimeType(media.kind, media.mimeType)) {
      throw new Error("Daftar aset 2025 memuat jenis file yang tidak didukung");
    }
    entries.set(filename, entries.get(filename) ?? {
      filename,
      kind: media.kind,
      mimeType: media.mimeType,
      alt: decorative ? null : alt,
      decorative,
    });
  };

  for (const [path, alt, decorative] of [
    ["babancong.webp", "Latar hero beranda MOKA Garut 2025", true],
    ["hero.webp", "Visual utama Pasanggiri Mojang Jajaka Garut 2025", false],
    ["programs.jpg", "Latar bagian program beranda", true],
    ["program-1.webp", "Kolase program Pasanggiri 2025", false],
    ["program-2.webp", "Kolase program Pasanggiri 2025", false],
    ["program-3.webp", "Kolase program Pasanggiri 2025", false],
    ["bagendit.webp", "Latar berita beranda", true],
    ["gf-1.webp", "Latar ajakan beranda", true],
    ["moka.png", "Logo MOKA Garut", false],
    ["hero-about.webp", "Latar halaman Tentang MOKA Garut", true],
    ["gf-about.webp", "Foto kegiatan MOKA Garut", false],
    ["vision.jpg", "Ilustrasi visi MOKA Garut", false],
    ["bagendit.jpg", "Latar galeri halaman Tentang", true],
    ["logo-w.png", "Logo putih MOKA Garut", false],
  ] as const) add(path, alt, decorative);

  for (const [slug, count, label] of eventFolders) {
    for (let index = 1; index <= count; index++) {
      add(`rangkaian-kegiatan/${slug}/${index}.webp`, `Dokumentasi ${label} 2025, foto ${index}`);
    }
  }

  let finalistCount = 0;
  for (const category of categories) {
    for (const finalist of category.finalist) {
      const code = safeSegment(category.abrev);
      const number = String(finalist.no).padStart(2, "0");
      const name = "name" in finalist && typeof finalist.name === "string" ? finalist.name : `finalis ${code} nomor ${number}`;
      add(`finalis/${code}/${code}${number}.webp`, `Foto ${name}`);
      finalistCount++;
    }
  }
  if (finalistCount !== 44) throw new Error("Daftar foto finalis 2025 tidak lengkap");

  for (const code of participantCodes) {
    let folders: Awaited<ReturnType<typeof readdir>>;
    try {
      folders = await readdir(join(process.cwd(), "public", "peserta", code), { withFileTypes: true });
    } catch {
      throw new Error(`Daftar foto peserta ${code} tidak dapat dibaca`);
    }
    const people = folders
      .filter((entry) => entry.isDirectory())
      .map((entry) => safeSegment(entry.name))
      .sort();
    if (people.length !== 16) throw new Error(`Daftar foto peserta ${code} tidak lengkap`);
    for (const person of people) {
      const name = humanize(person);
      add(`peserta/${code}/${person}/default.png`, `Foto semifinalis ${name}`);
      add(`qr/${code}/${person}.jpg`, `QR voting untuk ${name}`);
    }
  }

  for (const [folder, people] of [["pengurus", pengurus], ["ketua", ketua]] as const) {
    for (const person of people) {
      const name = safeSegment(person.nama);
      add(`${folder}/${name}.png`, `Foto ${person.nama}`);
    }
  }
  for (const logo of logoNames) add(`sponsors/${safeSegment(logo)}`, `Logo ${humanize(logo)}`);

  add("berita/press-release-semifinalis.webp", "Sampul berita pengumuman semifinalis 2025");
  add("berita/press-release-semifinalis.pdf", null);
  add("pdf/SK_MOKA.pdf", null);
  add("finalis/hero.webp", "Poster Pasanggiri Mojang Jajaka Garut 2025");
  add("finalis/hero.webm", "Video latar Pasanggiri Mojang Jajaka Garut 2025");

  return [...entries.values()];
}

function getAbsoluteSourcePath(filename: string) {
  const publicRoot = resolve(process.cwd(), "public");
  const absolutePath = resolve(publicRoot, filename.slice(1));
  const relativePath = relative(publicRoot, absolutePath);
  if (!relativePath || relativePath.startsWith(`..${sep}`) || relativePath === ".." || isAbsolute(relativePath)) {
    throw new Error("Daftar aset 2025 tidak valid");
  }
  return absolutePath;
}

async function listRemoteManifestFiles(utapi: UTApi, manifest: readonly MediaEntry[]) {
  const filenamesByCustomId = new Map(manifest.map((entry) => [stableCustomId(entry.filename), entry.filename]));
  const remoteFiles = new Map<string, RemoteMediaFile>();
  let offset = 0;
  try {
    while (true) {
      const page = await utapi.listFiles({ limit: 500, offset });
      for (const file of page.files) {
        const filename = file.customId ? filenamesByCustomId.get(file.customId) : undefined;
        if (filename && !remoteFiles.has(filename)) {
          remoteFiles.set(filename, { key: file.key, size: file.size, status: file.status });
        }
      }
      offset += page.files.length;
      if (!page.hasMore || page.files.length === 0) break;
    }
  } catch {
    throw new Error("Daftar aset UploadThing tidak dapat diperiksa");
  }
  return remoteFiles;
}

export async function import2025MediaBatch(cursor: number) {
  if (process.env.NODE_ENV === "production" || process.env.TURSO_DATABASE_URL !== "file:local.db") {
    throw new Error("Import media 2025 hanya tersedia untuk database lokal file:local.db");
  }

  const actor = await requirePermission("media.manage");
  if (!Number.isSafeInteger(cursor) || cursor < 0) throw new Error("Posisi import tidak valid");

  const manifest = await get2025MediaManifest();
  if (cursor > manifest.length) throw new Error("Posisi import di luar daftar aset");
  if (cursor === manifest.length) {
    return { status: "complete" as const, cursor, nextCursor: cursor, totalCount: manifest.length, processedCount: 0, uploadedCount: 0, reconciledCount: 0, skippedCount: 0, requiredBytes: 0, remainingBytes: 0, blockedFiles: [] as string[], failedFiles: [] as string[], pendingFiles: [] as string[] };
  }

  const checked: CheckedMediaEntry[] = [];
  const blockedFiles: string[] = [];
  for (const entry of manifest) {
    const absolutePath = getAbsoluteSourcePath(entry.filename);
    try {
      const fileInfo = await stat(absolutePath);
      if (!fileInfo.isFile() || fileInfo.size <= 0 || fileInfo.size > mediaPolicy[entry.kind].applicationMaxBytes) {
        blockedFiles.push(entry.filename);
        continue;
      }
      checked.push({ ...entry, absolutePath, bytes: fileInfo.size });
    } catch {
      blockedFiles.push(entry.filename);
    }
  }
  if (blockedFiles.length > 0) {
    return { status: "blocked" as const, cursor, nextCursor: cursor, totalCount: manifest.length, processedCount: 0, uploadedCount: 0, reconciledCount: 0, skippedCount: 0, requiredBytes: 0, remainingBytes: 0, blockedFiles, failedFiles: [] as string[], pendingFiles: [] as string[] };
  }

  const batch = checked.slice(cursor, cursor + batchSize);
  const batchCounts: Record<MediaUploadKind, number> = { image: 0, video: 0, pdf: 0 };
  const overPolicyFiles: string[] = [];
  for (const entry of batch) {
    batchCounts[entry.kind]++;
    if (batchCounts[entry.kind] > mediaPolicy[entry.kind].maxFileCount) overPolicyFiles.push(entry.filename);
  }
  if (overPolicyFiles.length > 0) {
    return { status: "blocked" as const, cursor, nextCursor: cursor, totalCount: manifest.length, processedCount: 0, uploadedCount: 0, reconciledCount: 0, skippedCount: 0, requiredBytes: 0, remainingBytes: 0, blockedFiles: overPolicyFiles, failedFiles: [] as string[], pendingFiles: [] as string[] };
  }

  const filenames = checked.map((entry) => entry.filename);
  const existingRows = await database
    .select({ filename: mediaAssets.filename, id: mediaAssets.id, provider: mediaAssets.provider, providerKey: mediaAssets.providerKey, lifecycle: mediaAssets.lifecycle })
    .from(mediaAssets)
    .where(inArray(mediaAssets.filename, filenames))
    .orderBy(desc(mediaAssets.createdAt));
  const rowsByFilename = new Map<string, (typeof existingRows)[number][]>();
  for (const row of existingRows) {
    const rows = rowsByFilename.get(row.filename) ?? [];
    rows.push(row);
    rowsByFilename.set(row.filename, rows);
  }
  const existingByFilename = new Map<string, (typeof existingRows)[number]>();
  for (const [filename, rows] of rowsByFilename) {
    existingByFilename.set(filename, rows.find((row) => row.provider === "uploadthing" && row.providerKey && row.lifecycle === "ready") ?? rows[0]!);
  }
  const unusableExisting = checked
    .filter((entry) => {
      const row = existingByFilename.get(entry.filename);
      return row && (row.provider !== "uploadthing" || !row.providerKey || row.lifecycle !== "ready");
    })
    .map((entry) => entry.filename);
  if (unusableExisting.length > 0) {
    return { status: "blocked" as const, cursor, nextCursor: cursor, totalCount: manifest.length, processedCount: 0, uploadedCount: 0, reconciledCount: 0, skippedCount: 0, requiredBytes: 0, remainingBytes: 0, blockedFiles: unusableExisting, failedFiles: [] as string[], pendingFiles: [] as string[] };
  }

  if (batch.every((entry) => existingByFilename.has(entry.filename))) {
    const nextCursor = cursor + batch.length;
    return {
      status: nextCursor >= manifest.length ? "complete" as const : "in_progress" as const,
      cursor,
      nextCursor,
      totalCount: manifest.length,
      processedCount: batch.length,
      uploadedCount: 0,
      reconciledCount: 0,
      skippedCount: batch.length,
      requiredBytes: 0,
      remainingBytes: 0,
      blockedFiles: [] as string[],
      failedFiles: [] as string[],
      pendingFiles: [] as string[],
    };
  }

  const utapi = new UTApi();
  const remoteFiles = await listRemoteManifestFiles(utapi, manifest);
  let usage: Awaited<ReturnType<UTApi["getUsageInfo"]>>;
  try {
    usage = await utapi.getUsageInfo();
  } catch {
    throw new Error("Kapasitas UploadThing tidak dapat diperiksa");
  }
  const remainingBytes = Math.max(0, usage.limitBytes - usage.appTotalBytes);

  const pendingFiles = batch
    .filter((entry) => !existingByFilename.has(entry.filename))
    .filter((entry) => {
      const remote = remoteFiles.get(entry.filename);
      return remote && remote.status !== "Uploaded";
    })
    .map((entry) => entry.filename);
  if (pendingFiles.length > 0) {
    return { status: "remote_pending" as const, cursor, nextCursor: cursor, totalCount: manifest.length, processedCount: 0, uploadedCount: 0, reconciledCount: 0, skippedCount: 0, requiredBytes: 0, remainingBytes, blockedFiles: [] as string[], failedFiles: [] as string[], pendingFiles };
  }

  const toUpload = checked.filter((entry) => !existingByFilename.has(entry.filename) && !remoteFiles.has(entry.filename));
  const requiredBytes = toUpload.reduce((sum, entry) => sum + entry.bytes, 0);
  if (requiredBytes > remainingBytes) {
    return { status: "storage_limit" as const, cursor, nextCursor: cursor, totalCount: manifest.length, processedCount: 0, uploadedCount: 0, reconciledCount: 0, skippedCount: 0, requiredBytes, remainingBytes, blockedFiles: [] as string[], failedFiles: [] as string[], pendingFiles: [] as string[] };
  }

  let uploadedCount = 0;
  let reconciledCount = 0;
  let skippedCount = 0;
  const failedFiles: string[] = [];

  for (const entry of batch) {
    const existing = existingByFilename.get(entry.filename);
    if (existing?.providerKey) {
      skippedCount++;
      continue;
    }

    const remote = remoteFiles.get(entry.filename);
    if (remote) {
      try {
        const resolvedRemote = await utapi.getFileUrls(remote.key);
        const remoteUrl = resolvedRemote.data[0]?.url;
        if (!remoteUrl) throw new Error("Remote media URL tidak tersedia");
        await persistUploadedMediaAsset(database, {
          provider: "uploadthing",
          providerKey: remote.key,
          url: remoteUrl,
          filename: entry.filename,
          mimeType: entry.mimeType,
          bytes: remote.size || entry.bytes,
          folderId: null,
          ownerUserId: actor.session.user.id,
          actorLabel: actor.session.user.email,
          kind: entry.kind,
          alt: entry.alt,
          decorative: entry.decorative,
        });
        reconciledCount++;
      } catch {
        failedFiles.push(entry.filename);
        break;
      }
      continue;
    }

    try {
      const file = new UTFile([await readFile(entry.absolutePath)], basename(entry.filename), {
        type: entry.mimeType,
        customId: stableCustomId(entry.filename),
      });
      const result = await utapi.uploadFiles(file);
      if (result.error || !result.data?.key || !result.data.ufsUrl) {
        failedFiles.push(entry.filename);
        break;
      }
      await persistUploadedMediaAsset(database, {
        provider: "uploadthing",
        providerKey: result.data.key,
        url: result.data.ufsUrl,
        filename: entry.filename,
        mimeType: entry.mimeType,
        bytes: entry.bytes,
        folderId: null,
        ownerUserId: actor.session.user.id,
        actorLabel: actor.session.user.email,
        kind: entry.kind,
        alt: entry.alt,
        decorative: entry.decorative,
      });
      uploadedCount++;
    } catch {
      failedFiles.push(entry.filename);
      break;
    }
  }

  if (failedFiles.length > 0) {
    return { status: "partial" as const, cursor, nextCursor: cursor, totalCount: manifest.length, processedCount: uploadedCount + reconciledCount + skippedCount, uploadedCount, reconciledCount, skippedCount, requiredBytes, remainingBytes, blockedFiles: [] as string[], failedFiles, pendingFiles: [] as string[] };
  }

  const nextCursor = cursor + batch.length;
  return {
    status: nextCursor >= manifest.length ? "complete" as const : "in_progress" as const,
    cursor,
    nextCursor,
    totalCount: manifest.length,
    processedCount: batch.length,
    uploadedCount,
    reconciledCount,
    skippedCount,
    requiredBytes,
    remainingBytes,
    blockedFiles: [] as string[],
    failedFiles,
    pendingFiles: [] as string[],
  };
}
