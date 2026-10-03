import { asc, eq } from "drizzle-orm";

import { AdminCard, AdminEmptyState, AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminEditionContext } from "@/server/cms/context";
import { database } from "@/server/db/client";
import {
  committeeAssignments,
  committeeUnits,
  mediaAssets,
  people,
} from "@/server/db/schema";
import {
  CommitteeWorkspaceClient,
  type CommitteeMemberItem,
  type CommitteeUnitItem,
  type PersonOption,
} from "./committee-workspace";

export const metadata = { title: "Panitia" };

export default async function CommitteePage() {
  const { effectivePermissions } = await requirePermission("content.view");
  const canEdit = effectivePermissions.has("content.edit");
  const edition = await getAdminEditionContext();

  if (!edition) {
    return (
      <AdminPage
        eyebrow="Konten"
        title="Panitia"
      >
        <AdminCard padding="none">
          <AdminEmptyState
            icon="clipboard"
            title="Pilih edisi"
            description="Gunakan pemilih edisi di bagian atas."
          />
        </AdminCard>
      </AdminPage>
    );
  }

  // Fetch unit hierarchy for the active edition
  const unitRows = await database
    .select()
    .from(committeeUnits)
    .where(eq(committeeUnits.editionId, edition.id))
    .orderBy(asc(committeeUnits.displayOrder), asc(committeeUnits.name));

  const units: CommitteeUnitItem[] = unitRows.map((u) => ({
    id: u.id,
    editionId: u.editionId,
    parentId: u.parentId,
    name: u.name,
    displayOrder: u.displayOrder,
    active: u.active,
  }));

  // Fetch committee assignments joined with person and portrait asset
  const memberRows = await database
    .select({
      id: committeeAssignments.id,
      editionId: committeeAssignments.editionId,
      unitId: committeeAssignments.unitId,
      personId: committeeAssignments.personId,
      title: committeeAssignments.title,
      displayOrder: committeeAssignments.displayOrder,
      active: committeeAssignments.active,
      version: committeeAssignments.version,
      personName: people.name,
      personSlug: people.slug,
      shortBio: people.shortBio,
      portraitUrl: mediaAssets.url,
    })
    .from(committeeAssignments)
    .innerJoin(people, eq(committeeAssignments.personId, people.id))
    .leftJoin(mediaAssets, eq(people.portraitMediaId, mediaAssets.id))
    .where(eq(committeeAssignments.editionId, edition.id))
    .orderBy(asc(committeeAssignments.displayOrder));

  const members: CommitteeMemberItem[] = memberRows.map((m) => ({
    id: m.id,
    editionId: m.editionId,
    unitId: m.unitId,
    personId: m.personId,
    title: m.title,
    displayOrder: m.displayOrder,
    active: m.active,
    version: m.version,
    personName: m.personName,
    personSlug: m.personSlug,
    portraitUrl: m.portraitUrl,
    shortBio: m.shortBio,
  }));

  // Fetch all people for selection in assignments
  const peopleRows = await database
    .select({
      id: people.id,
      name: people.name,
      slug: people.slug,
      shortBio: people.shortBio,
      portraitMediaId: people.portraitMediaId,
      portraitUrl: mediaAssets.url,
    })
    .from(people)
    .leftJoin(mediaAssets, eq(people.portraitMediaId, mediaAssets.id))
    .orderBy(asc(people.name));

  const peopleOptions: PersonOption[] = peopleRows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortBio: p.shortBio,
    portraitMediaId: p.portraitMediaId,
    portraitUrl: p.portraitUrl,
  }));

  return (
    <AdminPage
      eyebrow="Konten"
      title="Panitia"
    >
      <CommitteeWorkspaceClient
        edition={edition}
        initialUnits={units}
        initialMembers={members}
        initialPeople={peopleOptions}
        canEdit={canEdit}
      />
    </AdminPage>
  );
}
