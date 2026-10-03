import { eq, and, inArray } from "drizzle-orm";

import { AdminBadge, AdminCard, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { PAGE_SECTION_SLOTS } from "@/server/cms/page-sections";
import { database } from "@/server/db/client";
import { contentDrafts, pageSections } from "@/server/db/schema";

import { PageSectionsEditor, type PageSectionEditorItem } from "./page-sections-editor";

export const metadata = { title: "Teks halaman" };

type SectionCopy = Pick<typeof pageSections.$inferSelect, "title" | "eyebrow" | "body"> & {
  actionLabel: string | null;
  actionHref: string | null;
};

function parseActionFields(presentationJson: string | null | undefined) {
  try {
    const value: unknown = JSON.parse(presentationJson ?? "{}");
    if (typeof value !== "object" || value === null || Array.isArray(value)) return { actionLabel: null, actionHref: null };
    const fields = value as Record<string, unknown>;
    return {
      actionLabel: typeof fields.actionLabel === "string" ? fields.actionLabel : null,
      actionHref: typeof fields.actionHref === "string" ? fields.actionHref : null,
    };
  } catch {
    return { actionLabel: null, actionHref: null };
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
      <AdminPage eyebrow="Konten" title="Teks halaman">
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

  const initialSections: PageSectionEditorItem[] = PAGE_SECTION_SLOTS.map((slot) => {
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

  return (
    <AdminPage
      eyebrow="Konten"
      title="Teks halaman"
      description={`Kelola teks tetap untuk beranda dan tentang pada ${edition.name}.`}
      action={<AdminBadge value={edition.lifecycle} />}
    >
      <PageSectionsEditor
        initialSections={initialSections}
        canEdit={actor.effectivePermissions.has("content.edit")}
        canPublish={actor.effectivePermissions.has("content.publish")}
      />
    </AdminPage>
  );
}
