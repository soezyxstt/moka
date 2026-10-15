import { and, desc, eq, inArray, lt } from "drizzle-orm";
import type { Database } from "@/server/db/queries";
import { editions } from "@/server/db/schema";

export async function readFallbackEditionIds(db: Pick<Database, "select">, editionId: string): Promise<string[]> {
  const [edition] = await db.select({ year: editions.year }).from(editions).where(eq(editions.id, editionId)).limit(1);
  if (!edition) throw new Error("Edisi tidak ditemukan");
  const previous = await db.select({ id: editions.id }).from(editions)
    .where(and(lt(editions.year, edition.year), inArray(editions.lifecycle, ["active", "archived"])))
    .orderBy(desc(editions.year));
  return [editionId, ...previous.map((row) => row.id)];
}
