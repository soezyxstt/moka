"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { publishPageSection, savePageSectionDraft } from "@/server/cms/page-sections";

const draftInputSchema = z.object({
  slotKey: z.string(),
  expectedVersion: z.number().int().positive().nullable(),
  patch: z.unknown(),
}).strict();

const publishInputSchema = z.object({ slotKey: z.string() }).strict();

export async function savePageSectionDraftAction(input: unknown) {
  const actor = await requirePermission("content.edit");
  const parsed = draftInputSchema.parse(input);
  const edition = await getAdminEditionContext();
  if (!edition) throw new Error("Konteks edisi tidak ditemukan");

  const result = await savePageSectionDraft({
    editionId: edition.id,
    slotKey: parsed.slotKey,
    baseVersion: parsed.expectedVersion,
    patch: parsed.patch,
    actorUserId: actor.session.user.id,
    actorLabel: actor.session.user.email,
  });
  revalidatePath("/admin/content/pages");
  return result;
}

export async function publishPageSectionAction(input: unknown) {
  const actor = await requirePermission("content.publish");
  const parsed = publishInputSchema.parse(input);
  const edition = await getAdminEditionContext();
  if (!edition) throw new Error("Konteks edisi tidak ditemukan");

  const result = await publishPageSection({
    editionId: edition.id,
    slotKey: parsed.slotKey,
    actorUserId: actor.session.user.id,
    actorLabel: actor.session.user.email,
  });
  revalidatePath("/admin/content/pages");
  revalidatePath("/");
  revalidatePath("/tentang");
  return result;
}
