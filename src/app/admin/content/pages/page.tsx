import { eq, and, inArray } from "drizzle-orm";

import { AdminCard, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { PAGE_SECTION_SLOTS } from "@/server/cms/page-sections";
import { registrationEditionEligible } from "@/server/cms/registration";
import { database } from "@/server/db/client";
import { contentDrafts, pageSections, mediaAssets, editions, organizationPeriods } from "@/server/db/schema";

import { PageSectionsEditor, type PageSectionEditorItem } from "./page-sections-editor";

export const metadata = { title: "Teks halaman" };

type SectionCopy = Pick<typeof pageSections.$inferSelect, "title" | "eyebrow" | "body"> & {
  documentMediaId: string | null;
  documentTitle: string | null;
  actionLabel: string | null;
  actionHref: string | null;
};

function parseActionFields(presentationJson: string | null | undefined) {
  try {
    const value: unknown = JSON.parse(presentationJson ?? "{}");
    if (typeof value !== "object" || value === null || Array.isArray(value)) return { actionLabel: null, actionHref: null, documentMediaId: null, documentTitle: null };
    const fields = value as Record<string, unknown>;
    return {
      documentMediaId: typeof fields.documentMediaId === "string" ? fields.documentMediaId : null,
      documentTitle: typeof fields.documentTitle === "string" ? fields.documentTitle : null,
      actionLabel: typeof fields.actionLabel === "string" ? fields.actionLabel : null,
      actionHref: typeof fields.actionHref === "string" ? fields.actionHref : null,
    };
  } catch {
    return { actionLabel: null, actionHref: null, documentMediaId: null, documentTitle: null };
  }
}

function parseDraft(snapshotJson: string): SectionCopy | null {
  try {
    const value: unknown = JSON.parse(snapshotJson);
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    const fields = value as Record<string, unknown>;
    return {
      title: typeof fields.title === "string" ? fields.title : null,
      eyebrow: typeof fields.eyebrow === "string" ? fields.eyebrow : null,
      body: typeof fields.body === "string" ? fields.body : null,
      ...parseActionFields(typeof fields.presentationJson === "string" ? fields.presentationJson : null),
    };
  } catch {
    return null;
  }
}

export default async function PagesPage() {
  const actor = await requirePermission("content.view");
  const edition = await getAdminEditionContext();
  if (!edition) {
    return (
      <AdminPage title="Teks halaman">
        <AdminCard className="text-sm text-muted-foreground">Tidak ada edisi yang tersedia.</AdminCard>
      </AdminPage>
    );
  }

  const sections = await database
    .select()
    .from(pageSections)
    .where(eq(pageSections.editionId, edition.id));
  const sectionByKey = new Map(sections.map((section) => [`${section.pageKey}/${section.sectionKey}`, section]));
  const sectionIds = sections.map((section) => section.id);
  const drafts = sectionIds.length
    ? await database
      .select()
      .from(contentDrafts)
      .where(and(eq(contentDrafts.resourceType, "pageSection"), inArray(contentDrafts.resourceId, sectionIds)))
    : [];
  const draftByResourceId = new Map(drafts.map((draft) => [draft.resourceId, draft]));

  const initialSections: PageSectionEditorItem[] = PAGE_SECTION_SLOTS.filter((slot) => slot.pageKey !== "pendaftaran" || registrationEditionEligible(edition.year)).map((slot) => {
    const section = sectionByKey.get(slot.key);
    const draft = section ? draftByResourceId.get(section.id) : undefined;
    const published = {
      title: section?.title ?? null,
      eyebrow: section?.eyebrow ?? null,
      body: section?.body ?? null,
      ...parseActionFields(section?.presentationJson),
    };
    const draftCopy = draft ? parseDraft(draft.snapshotJson) : null;
    return {
      slotKey: slot.key,
      pageKey: slot.pageKey,
      label: slot.label,
      sectionKey: slot.sectionKey,
      version: section?.version ?? null,
      status: section?.status ?? null,
      published,
      draft: draftCopy,
      value: draftCopy ?? published,
    };
  });
  const documentIds = initialSections.flatMap((section) => section.value.documentMediaId ? [section.value.documentMediaId] : []);
  const [period] = await database.select({ label: organizationPeriods.label, vision: organizationPeriods.vision, missionJson: organizationPeriods.missionJson }).from(editions).innerJoin(organizationPeriods, eq(editions.organizationPeriodId, organizationPeriods.id)).where(eq(editions.id, edition.id)).limit(1);
  const documents = documentIds.length ? await database.select().from(mediaAssets).where(inArray(mediaAssets.id, documentIds)) : [];

  return (
    <AdminPage title="Teks halaman">
      <PageSectionsEditor
        editionId={edition.id}
        editionYear={edition.year}
        organizationPeriod={period ?? null}
        key={edition.id}
        documentAssets={documents.map(({ createdAt, updatedAt, ...asset }) => ({ ...asset, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() }))}
        initialSections={initialSections}
        canEdit={edition.lifecycle !== "archived" && actor.effectivePermissions.has("content.edit")}
        canPublish={edition.lifecycle !== "archived" && actor.effectivePermissions.has("content.publish")}
      />
    </AdminPage>
  );
}
