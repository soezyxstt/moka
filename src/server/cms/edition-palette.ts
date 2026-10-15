import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { appendAuditLog } from "@/server/auth/audit";
import type { Database } from "@/server/db/queries";
import { contentDrafts, contentRevisions, editions, pageSections } from "@/server/db/schema";

export class EditionPaletteError extends Error {}

const hex = z.string().regex(/^#[\da-f]{6}$/i, "Gunakan kode hex enam digit.").transform((value) => value.toLowerCase());
const luminance = (value: string) => [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
  .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

export const editionPaletteSchema = z.object({ dark: hex, light: hex }).strict().refine(({ dark, light }) => {
  const a = luminance(dark), b = luminance(light);
  return a < b && 1.05 / (a + 0.05) >= 4.5 && (b + 0.05) / 0.05 >= 4.5;
}, "Warna gelap harus mendukung teks putih dan warna terang mendukung teks gelap, minimal kontras 4.5:1.");

export function parseEditionPalette(value: string | null | undefined) {
  try {
    const parsed = editionPaletteSchema.safeParse(JSON.parse(value ?? "null"));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

const paletteWhere = (editionId: string) => and(eq(pageSections.editionId, editionId), eq(pageSections.pageKey, "site"), eq(pageSections.sectionKey, "palette"));

export async function readEditionPalette(db: Database, editionId: string) {
  const row = await db.query.pageSections.findFirst({ where: paletteWhere(editionId) });
  return { version: row?.version ?? null, palette: row?.status === "published" ? parseEditionPalette(row.presentationJson) : null };
}

export async function saveEditionPalette(db: Database, input: {
  editionId: string; expectedVersion: number | null; palette: unknown; actorUserId: string; actorLabel: string;
}) {
  const parsed = editionPaletteSchema.safeParse(input.palette);
  if (!parsed.success) throw new EditionPaletteError(parsed.error.issues[0].message);
  const palette = parsed.data;
  return db.transaction(async (tx) => {
    const edition = await tx.query.editions.findFirst({ where: eq(editions.id, input.editionId) });
    if (!edition || edition.lifecycle === "archived") throw new EditionPaletteError("Edisi tidak ditemukan atau sudah diarsipkan.");
    const current = await tx.query.pageSections.findFirst({ where: paletteWhere(input.editionId) });
    if ((current?.version ?? null) !== input.expectedVersion) throw new EditionPaletteError("Palet telah berubah. Muat ulang halaman.");
    if (current && await tx.query.contentDrafts.findFirst({ where: and(eq(contentDrafts.resourceType, "pageSection"), eq(contentDrafts.resourceId, current.id)) })) {
      throw new EditionPaletteError("Selesaikan draf palet yang tersimpan terlebih dahulu.");
    }
    const version = current ? current.version + 1 : 1;
    const snapshot = { editionId: input.editionId, pageKey: "site", sectionKey: "palette", presentationJson: JSON.stringify(palette), status: "published", version };
    const id = current?.id ?? crypto.randomUUID();
    if (current) await tx.update(pageSections).set({ ...snapshot, updatedAt: new Date() }).where(eq(pageSections.id, id));
    else await tx.insert(pageSections).values({ id, ...snapshot });
    await tx.insert(contentRevisions).values({ resourceType: "pageSection", resourceId: id, version, snapshotJson: JSON.stringify(snapshot), authorUserId: input.actorUserId });
    await appendAuditLog(tx, {
      actorUserId: input.actorUserId, actorLabel: input.actorLabel, action: "edition.palette.publish", resourceType: "pageSection", resourceId: id,
      resourceLabel: `Palet ${edition.year}`, before: current ?? null, after: snapshot,
      changedFields: ["presentationJson", "status", "version"], source: "admin-edition-settings",
    });
    return { version };
  });
}
