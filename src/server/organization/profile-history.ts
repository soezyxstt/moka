import { and, eq } from "drizzle-orm";
import type { Database } from "@/server/db/queries";
import { contentRevisions, mediaAssets, organizationMemberships, organizationPeriods, people, personSocialLinks } from "@/server/db/schema";

export async function preserveArchivedProfile(tx: Pick<Database, "select" | "insert">, person: typeof people.$inferSelect, actorUserId: string) {
  const memberships = await tx.select({ id: organizationMemberships.id }).from(organizationMemberships)
    .innerJoin(organizationPeriods, eq(organizationMemberships.periodId, organizationPeriods.id))
    .where(and(eq(organizationMemberships.personId, person.id), eq(organizationPeriods.lifecycle, "archived")));
  const [portrait] = person.portraitMediaId ? await tx.select().from(mediaAssets).where(eq(mediaAssets.id, person.portraitMediaId)) : [];
  const socials = await tx.select().from(personSocialLinks).where(eq(personSocialLinks.personId, person.id));
  for (const membership of memberships) {
    await tx.insert(contentRevisions).values({
      resourceType: "organizationPerson", resourceId: membership.id, version: 1, authorUserId: actorUserId,
      snapshotJson: JSON.stringify({ ...person, socialLinks: socials, imageUrl: portrait?.lifecycle === "ready" ? portrait.url : null }),
    }).onConflictDoNothing();
  }
  return memberships.map((membership) => membership.id);
}

export function archivedIdentity(value: string | undefined, fallback: { name: string; imageUrl: string | null }) {
  if (!value) return fallback;
  try {
    const snapshot: unknown = JSON.parse(value);
    if (typeof snapshot !== "object" || snapshot === null) return fallback;
    const fields = snapshot as Record<string, unknown>;
    if (typeof fields.name !== "string" || !(fields.imageUrl === null || typeof fields.imageUrl === "string")) return fallback;
    return { name: fields.name, imageUrl: fields.imageUrl };
  } catch { return fallback; }
}
