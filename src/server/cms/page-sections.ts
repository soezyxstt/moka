import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { appendAuditLog } from "@/server/auth/audit";
import { database } from "@/server/db/client";
import { contentDrafts, contentRevisions, pageSections } from "@/server/db/schema";

export const PAGE_SECTION_SLOTS = [
  { key: "home/hero", pageKey: "home", sectionKey: "hero", label: "Hero beranda" },
  { key: "home/program", pageKey: "home", sectionKey: "program", label: "Program unggulan" },
  { key: "home/berita", pageKey: "home", sectionKey: "berita", label: "Berita dan update" },
  { key: "home/ajakan", pageKey: "home", sectionKey: "ajakan", label: "Ajakan bergabung" },
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
    throw new Error("Data tombol pada draf tidak valid.");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("Data tombol pada draf tidak valid.");
  const fields = parsed as Record<string, unknown>;
  const action = homeActionFieldsSchema.parse({
    actionLabel: fields.actionLabel ?? null,
    actionHref: fields.actionHref ?? null,
  });
  if (action.actionHref && !action.actionLabel?.trim()) throw new Error("Label tombol wajib diisi jika tautan digunakan.");
  return action;
}

function resolveSlot(key: string) {
  const slot = PAGE_SECTION_SLOTS.find((candidate) => candidate.key === key);
  if (!slot) throw new Error("Bagian halaman tidak diizinkan");
  return slot;
}

function sectionSnapshot(current: typeof pageSections.$inferSelect, patch: z.infer<typeof sectionPatchSchema> | z.infer<typeof homeActionPatchSchema>, slot: ReturnType<typeof resolveSlot>) {
  const homeAction = slot.key === "home/ajakan" ? homeActionFieldsSchema.parse({
    actionLabel: "actionLabel" in patch ? patch.actionLabel : null,
    actionHref: "actionHref" in patch ? patch.actionHref : null,
  }) : null;
  return {
    title: patch.title,
    eyebrow: patch.eyebrow,
    body: patch.body,
    presentationJson: slot.key === "tentang/misi"
      ? JSON.stringify((patch.body ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean))
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
}) {
  const slot = resolveSlot(input.slotKey);
  const candidate = slot.key === "home/ajakan" ? homeActionPatchSchema.parse(input.patch) : sectionPatchSchema.parse(input.patch);

  return database.transaction(async (tx) => {
    let current = await tx.query.pageSections.findFirst({
      where: and(
        eq(pageSections.editionId, input.editionId),
        eq(pageSections.pageKey, slot.pageKey),
        eq(pageSections.sectionKey, slot.sectionKey),
      ),
    });

    if (current && (input.baseVersion === null || current.version !== input.baseVersion)) {
      throw new Error("Konten telah berubah. Muat ulang halaman.");
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
      if (!inserted.length) throw new Error("Konten telah berubah. Muat ulang halaman.");
      current = await tx.query.pageSections.findFirst({
        where: and(
          eq(pageSections.editionId, input.editionId),
          eq(pageSections.pageKey, slot.pageKey),
          eq(pageSections.sectionKey, slot.sectionKey),
        ),
      });
    }

    if (!current || (input.baseVersion === null && current.version !== 1)) {
      throw new Error("Konten telah berubah. Muat ulang halaman.");
    }

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
      changedFields: ["title", "eyebrow", "body", ...(slot.key === "tentang/misi" || slot.key === "home/ajakan" ? ["presentationJson"] : [])],
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
}) {
  const slot = resolveSlot(input.slotKey);

  return database.transaction(async (tx) => {
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
      throw new Error("Draf tidak ditemukan atau sudah kedaluwarsa");
    }

    const rawSnapshot: unknown = JSON.parse(draft.snapshotJson);
    const stored = savedSnapshotSchema.parse(rawSnapshot);
    const copy = { title: stored.title, eyebrow: stored.eyebrow, body: stored.body };
    const candidate = slot.key === "home/ajakan"
      ? homeActionPatchSchema.parse({ ...copy, ...parseHomeActionPresentation(stored.presentationJson) })
      : sectionPatchSchema.parse(copy);
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
