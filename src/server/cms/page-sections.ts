import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { appendAuditLog } from "@/server/auth/audit";
import type { Database } from "@/server/db/queries";
import { parsePublicDocument, publicPdfUrl } from "@/server/cms/public-document";
import { contentDrafts, contentRevisions, pageSections, mediaAssets, editions } from "@/server/db/schema";
import { registrationEditionEligible, registrationLines, registrationRows } from "@/server/cms/registration";

export class PageSectionValidationError extends Error {}

export const PAGE_SECTION_SLOTS = [
  { key: "home/pengantar", pageKey: "home", sectionKey: "pengantar", label: "Deskripsi ajang" },
  { key: "home/agenda", pageKey: "home", sectionKey: "agenda", label: "Agenda terdekat" },
  { key: "tentang/peran", pageKey: "tentang", sectionKey: "peran", label: "Peran untuk Garut" },
  { key: "tentang/nilai", pageKey: "tentang", sectionKey: "nilai", label: "Nilai pembinaan" },
  { key: "pendaftaran/status", pageKey: "pendaftaran", sectionKey: "status", label: "Status pendaftaran" },
  { key: "pendaftaran/jalur", pageKey: "pendaftaran", sectionKey: "jalur", label: "Jalur pendaftaran" },
  { key: "pendaftaran/langkah", pageKey: "pendaftaran", sectionKey: "langkah", label: "Cara mendaftar" },
  { key: "pendaftaran/faq", pageKey: "pendaftaran", sectionKey: "faq", label: "Pertanyaan umum" },
  { key: "pendaftaran/hero", pageKey: "pendaftaran", sectionKey: "hero", label: "Pengantar pendaftaran" },
  { key: "pendaftaran/usia", pageKey: "pendaftaran", sectionKey: "usia", label: "Kategori usia" },
  { key: "pendaftaran/syarat", pageKey: "pendaftaran", sectionKey: "syarat", label: "Syarat pendaftaran" },
  { key: "pendaftaran/kriteria", pageKey: "pendaftaran", sectionKey: "kriteria", label: "Kriteria pendaftar" },
  { key: "pendaftaran/ots", pageKey: "pendaftaran", sectionKey: "ots", label: "Pendaftaran OTS" },
  { key: "pendaftaran/berkas", pageKey: "pendaftaran", sectionKey: "berkas", label: "Map dan berkas" },
  { key: "pendaftaran/timeline", pageKey: "pendaftaran", sectionKey: "timeline", label: "Timeline" },
  { key: "site/identity", pageKey: "site", sectionKey: "identity", label: "Identitas dan deskripsi pencarian" },
  { key: "site/instagram", pageKey: "site", sectionKey: "instagram", label: "Instagram" },
  { key: "site/youtube", pageKey: "site", sectionKey: "youtube", label: "YouTube" },
  { key: "site/email", pageKey: "site", sectionKey: "email", label: "Email" },
  { key: "galeri/hero", pageKey: "galeri", sectionKey: "hero", label: "Pengantar galeri" },
  { key: "voting/hero", pageKey: "voting", sectionKey: "hero", label: "Pengantar voting" },
  { key: "home/hero", pageKey: "home", sectionKey: "hero", label: "Hero beranda" },
  { key: "home/program", pageKey: "home", sectionKey: "program", label: "Program PAMOKA di Beranda" },
  { key: "home/berita", pageKey: "home", sectionKey: "berita", label: "Berita dan update" },
  { key: "home/ajakan", pageKey: "home", sectionKey: "ajakan", label: "Filosofi tema (Tentang)" },
  { key: "tentang/hero", pageKey: "tentang", sectionKey: "hero", label: "Hero tentang" },
  { key: "tentang/visi", pageKey: "tentang", sectionKey: "visi", label: "Visi" },
  { key: "tentang/misi", pageKey: "tentang", sectionKey: "misi", label: "Misi" },
  { key: "tentang/legalitas", pageKey: "tentang", sectionKey: "legalitas", label: "Legalitas organisasi" },
  { key: "tentang/organisasi", pageKey: "tentang", sectionKey: "organisasi", label: "Struktur organisasi" },
] as const;

export type PageSectionSlotKey = (typeof PAGE_SECTION_SLOTS)[number]["key"];

const sectionPatchSchema = z.object({
  title: z.string().max(200).nullable(),
  eyebrow: z.string().max(120).nullable(),
  body: z.string().max(20_000).nullable(),
  documentMediaId: z.string().trim().min(1).nullable().optional(),
  documentTitle: z.string().trim().max(200).nullable().optional(),
}).strict();
const homeActionFieldsSchema = z.object({
  actionLabel: z.string().trim().max(120).nullable(),
  actionHref: z.string().trim().max(2_048).nullable().refine((href) => href === null || isAllowedActionHref(href), "Tautan harus berupa path situs atau URL http(s) lengkap."),
}).strict();
const homeActionPatchSchema = sectionPatchSchema.extend(homeActionFieldsSchema.shape).strict().superRefine((patch, context) => {
  if (patch.actionHref && !patch.actionLabel?.trim()) {
    context.addIssue({ code: "custom", path: ["actionLabel"], message: "Label tombol wajib diisi jika tautan digunakan." });
  }
});
const savedSnapshotSchema = sectionPatchSchema.extend({ presentationJson: z.string().optional() }).passthrough();

function isAllowedActionHref(href: string) {
  if (!href || /[\\\u0000-\u001f\u007f]/.test(href)) return false;
  if (href.startsWith("/") && !href.startsWith("//")) return true;

  try {
    const url = new URL(href);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function parseHomeActionPresentation(value: string | undefined) {
  if (!value) return { actionLabel: null, actionHref: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new PageSectionValidationError("Data tombol pada draf tidak valid.");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new PageSectionValidationError("Data tombol pada draf tidak valid.");
  const fields = parsed as Record<string, unknown>;
  const action = homeActionFieldsSchema.parse({
    actionLabel: fields.actionLabel ?? null,
    actionHref: fields.actionHref ?? null,
  });
  if (action.actionHref && !action.actionLabel?.trim()) throw new PageSectionValidationError("Label tombol wajib diisi jika tautan digunakan.");
  return action;
}

function resolveSlot(key: string) {
  const slot = PAGE_SECTION_SLOTS.find((candidate) => candidate.key === key);
  if (!slot) throw new PageSectionValidationError("Bagian halaman tidak diizinkan");
  return slot;
}

function hasAction(key: string) {
  return key === "home/ajakan" || key === "pendaftaran/hero";
}

async function validateRegistrationEdition(tx: Parameters<Parameters<Database["transaction"]>[0]>[0], pageKey: string, editionId: string) {
  if (pageKey !== "pendaftaran") return;
  const edition = await tx.query.editions.findFirst({ where: eq(editions.id, editionId) });
  if (!edition || !registrationEditionEligible(edition.year) || edition.lifecycle === "archived") {
    throw new PageSectionValidationError("Pendaftaran hanya dapat diubah pada edisi mulai 2026 yang belum diarsipkan.");
  }
}

function validateRegistrationBody(pageKey: string, sectionKey: string, body: string | null) {
  if (!["home/agenda", "tentang/peran", "tentang/nilai", "pendaftaran/usia", "pendaftaran/timeline", "pendaftaran/jalur", "pendaftaran/langkah", "pendaftaran/faq"].includes(pageKey + "/" + sectionKey)) return;
  const lines = registrationLines(body);
  if (lines.length > 50 || registrationRows(body).length !== lines.length) {
    throw new PageSectionValidationError("Gunakan format: tanggal atau kategori | judul | keterangan opsional. Maksimal 50 baris.");
  }
}

function validateContact(page: string, section: string, body: string | null) {
  if (page !== "site" || !body || !["instagram", "youtube", "email"].includes(section)) return;
  const value = body.trim();
  if (section === "email" ? !z.string().email().safeParse(value).success : !isAllowedActionHref(value) || value.startsWith("/")) {
    throw new PageSectionValidationError("Alamat kontak tidak valid. Gunakan email atau tautan http(s) lengkap.");
  }
}

async function validateSectionMedia(tx: Parameters<Parameters<Database["transaction"]>[0]>[0], slot: string, mediaId: string | null | undefined) {
  if (slot !== "tentang/legalitas" || !mediaId) return;
  const asset = await tx.query.mediaAssets.findFirst({ where: eq(mediaAssets.id, mediaId) });
  if (!publicPdfUrl(asset)) {
    throw new PageSectionValidationError("Pilih dokumen PDF siap pakai melalui HTTPS.");
  }
}

function sectionSnapshot(current: typeof pageSections.$inferSelect, patch: z.infer<typeof sectionPatchSchema> | z.infer<typeof homeActionPatchSchema>, slot: ReturnType<typeof resolveSlot>) {
  const previousDocument = parsePublicDocument(current.presentationJson);
  const homeAction = hasAction(slot.key) ? homeActionFieldsSchema.parse({
    actionLabel: "actionLabel" in patch ? patch.actionLabel : null,
    actionHref: "actionHref" in patch ? patch.actionHref : null,
  }) : null;
  return {
    title: patch.title,
    eyebrow: patch.eyebrow,
    body: patch.body,
    presentationJson: slot.key === "tentang/misi"
      ? JSON.stringify((patch.body ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean))
      : slot.key === "tentang/legalitas"
        ? JSON.stringify({ documentMediaId: patch.documentMediaId === undefined ? previousDocument?.documentMediaId ?? null : patch.documentMediaId, documentTitle: patch.documentTitle === undefined ? previousDocument?.documentTitle ?? "Dokumen legalitas organisasi" : patch.documentTitle || "Dokumen legalitas organisasi" })
      : homeAction
        ? JSON.stringify(homeAction)
        : current.presentationJson,
  };
}

export async function savePageSectionDraft(input: {
  editionId: string;
  slotKey: string;
  baseVersion: number | null;
  patch: unknown;
  actorUserId: string;
  actorLabel: string;
}, db?: Database) {
  const slot = resolveSlot(input.slotKey);
  const candidate = hasAction(slot.key) ? homeActionPatchSchema.parse(input.patch) : sectionPatchSchema.parse(input.patch);

  const database = db ?? (await import("@/server/db/client")).database;
  return database.transaction(async (tx) => {
    await validateRegistrationEdition(tx, slot.pageKey, input.editionId);
    let current = await tx.query.pageSections.findFirst({
      where: and(
        eq(pageSections.editionId, input.editionId),
        eq(pageSections.pageKey, slot.pageKey),
        eq(pageSections.sectionKey, slot.sectionKey),
      ),
    });

    if (current && (input.baseVersion === null || current.version !== input.baseVersion)) {
      throw new PageSectionValidationError("Konten telah berubah. Muat ulang halaman.");
    }

    if (!current && input.baseVersion === null) {
      const inserted = await tx.insert(pageSections).values({
        editionId: input.editionId,
        pageKey: slot.pageKey,
        sectionKey: slot.sectionKey,
        title: null,
        eyebrow: null,
        body: null,
        presentationJson: "{}",
        status: "draft",
        version: 1,
      }).onConflictDoNothing().returning({ id: pageSections.id });
      if (!inserted.length) throw new PageSectionValidationError("Konten telah berubah. Muat ulang halaman.");
      current = await tx.query.pageSections.findFirst({
        where: and(
          eq(pageSections.editionId, input.editionId),
          eq(pageSections.pageKey, slot.pageKey),
          eq(pageSections.sectionKey, slot.sectionKey),
        ),
      });
    }

    if (!current || (input.baseVersion === null && current.version !== 1)) {
      throw new PageSectionValidationError("Konten telah berubah. Muat ulang halaman.");
    }

    await validateSectionMedia(tx, slot.key, candidate.documentMediaId);
    validateContact(slot.pageKey, slot.sectionKey, candidate.body);
    validateRegistrationBody(slot.pageKey, slot.sectionKey, candidate.body);
    const snapshot = sectionSnapshot(current, candidate, slot);
    await tx.insert(contentDrafts).values({
      resourceType: "pageSection",
      resourceId: current.id,
      baseVersion: current.version,
      snapshotJson: JSON.stringify(snapshot),
      authorUserId: input.actorUserId,
    }).onConflictDoUpdate({
      target: [contentDrafts.resourceType, contentDrafts.resourceId],
      set: {
        baseVersion: current.version,
        snapshotJson: JSON.stringify(snapshot),
        authorUserId: input.actorUserId,
        updatedAt: new Date(),
      },
    });
    await appendAuditLog(tx, {
      actorUserId: input.actorUserId,
      actorLabel: input.actorLabel,
      action: "content.draft.save",
      resourceType: "pageSection",
      resourceId: current.id,
      resourceLabel: slot.label,
      before: current,
      after: snapshot,
      changedFields: ["title", "eyebrow", "body", ...(slot.key === "tentang/misi" || hasAction(slot.key) || slot.key === "tentang/legalitas" ? ["presentationJson"] : [])],
      source: "admin-content-pages",
    });

    return { sectionId: current.id, version: current.version };
  });
}

export async function publishPageSection(input: {
  editionId: string;
  slotKey: string;
  actorUserId: string;
  actorLabel: string;
}, db?: Database) {
  const slot = resolveSlot(input.slotKey);

  const database = db ?? (await import("@/server/db/client")).database;
  return database.transaction(async (tx) => {
    await validateRegistrationEdition(tx, slot.pageKey, input.editionId);
    const current = await tx.query.pageSections.findFirst({
      where: and(
        eq(pageSections.editionId, input.editionId),
        eq(pageSections.pageKey, slot.pageKey),
        eq(pageSections.sectionKey, slot.sectionKey),
      ),
    });
    const draft = current && await tx.query.contentDrafts.findFirst({
      where: and(eq(contentDrafts.resourceType, "pageSection"), eq(contentDrafts.resourceId, current.id)),
    });
    if (!current || !draft || current.version !== draft.baseVersion) {
      throw new PageSectionValidationError("Draf tidak ditemukan atau sudah kedaluwarsa");
    }

    const rawSnapshot: unknown = JSON.parse(draft.snapshotJson);
    const stored = savedSnapshotSchema.parse(rawSnapshot);
    const document = slot.key === "tentang/legalitas" ? JSON.parse(stored.presentationJson ?? "{}") : {};
    const copy = { title: stored.title, eyebrow: stored.eyebrow, body: stored.body, documentMediaId: document.documentMediaId ?? null, documentTitle: document.documentTitle ?? null };
    const candidate = hasAction(slot.key)
      ? homeActionPatchSchema.parse({ ...copy, ...parseHomeActionPresentation(stored.presentationJson) })
      : sectionPatchSchema.parse(copy);
    await validateSectionMedia(tx, slot.key, candidate.documentMediaId);
    validateContact(slot.pageKey, slot.sectionKey, candidate.body);
    validateRegistrationBody(slot.pageKey, slot.sectionKey, candidate.body);
    const snapshot = sectionSnapshot(current, candidate, slot);
    const nextVersion = current.version + 1;
    await tx.update(pageSections).set({
      ...snapshot,
      status: "published",
      version: nextVersion,
      updatedAt: new Date(),
    }).where(eq(pageSections.id, current.id));
    await tx.insert(contentRevisions).values({
      resourceType: "pageSection",
      resourceId: current.id,
      version: nextVersion,
      snapshotJson: JSON.stringify(snapshot),
      authorUserId: input.actorUserId,
    });
    await tx.delete(contentDrafts).where(eq(contentDrafts.id, draft.id));
    await appendAuditLog(tx, {
      actorUserId: input.actorUserId,
      actorLabel: input.actorLabel,
      action: "content.publish",
      resourceType: "pageSection",
      resourceId: current.id,
      resourceLabel: slot.label,
      before: current,
      after: { ...snapshot, status: "published", version: nextVersion },
      changedFields: ["title", "eyebrow", "body", "presentationJson", "status", "version"],
      source: "admin-content-pages",
    });

    return { sectionId: current.id, version: nextVersion };
  });
}
