"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { PageSectionValidationError, publishPageSection, savePageSectionDraft } from "@/server/cms/page-sections";

const draftInputSchema = z.object({
  expectedEditionId: z.string().min(1),
  slotKey: z.string(),
  expectedVersion: z.number().int().positive().nullable(),
  patch: z.unknown(),
}).strict();

const publishInputSchema = z.object({ slotKey: z.string(), expectedEditionId: z.string().min(1) }).strict();

export async function savePageSectionDraftAction(input: unknown) {
  const actor = await requirePermission("content.edit");
  const parsed = draftInputSchema.parse(input);
  const edition = await getAdminEditionContext();
  if (!edition) throw new Error("Konteks edisi tidak ditemukan");
  if (edition.id !== parsed.expectedEditionId) return { error: "Edisi telah berubah. Muat ulang halaman.", version: null };

  const result = await savePageSectionDraft({
    editionId: edition.id,
    slotKey: parsed.slotKey,
    baseVersion: parsed.expectedVersion,
    patch: parsed.patch,
    actorUserId: actor.session.user.id,
    actorLabel: actor.session.user.email,
  }).then((value) => ({ ...value, error: null })).catch((error: unknown) => {
    if (error instanceof PageSectionValidationError) return { error: error.message, version: null };
    if (error instanceof z.ZodError) return { error: "Periksa isian teks dan tautan.", version: null };
    throw error;
  });
  revalidatePath("/admin/content/pages");
  return result;
}

export async function publishPageSectionAction(input: unknown) {
  const actor = await requirePermission("content.publish");
  const parsed = publishInputSchema.parse(input);
  const edition = await getAdminEditionContext();
  if (!edition) throw new Error("Konteks edisi tidak ditemukan");
  if (edition.id !== parsed.expectedEditionId) return { error: "Edisi telah berubah. Muat ulang halaman.", version: null };

  const result = await publishPageSection({
    editionId: edition.id,
    slotKey: parsed.slotKey,
    actorUserId: actor.session.user.id,
    actorLabel: actor.session.user.email,
  }).then((value) => ({ ...value, error: null })).catch((error: unknown) => {
    if (error instanceof PageSectionValidationError) return { error: error.message, version: null };
    if (error instanceof z.ZodError) return { error: "Periksa isian teks dan tautan.", version: null };
    throw error;
  });
  revalidatePath("/admin/content/pages");
  revalidatePath("/", "layout");
  revalidatePath("/tentang");
  revalidatePath("/pendaftaran");
  return result;
}
