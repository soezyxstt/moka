import { asc, desc, eq } from "drizzle-orm";

import { AdminPage } from "@/components/admin/primitives";
import { requirePermission } from "@/server/auth/authorization";
import { database } from "@/server/db/client";
import {
  editions,
  mediaAssets,
  organizationAssignments,
  organizationMemberships,
  organizationPeriods,
  organizationUnits,
  people,
  personSocialLinks,
} from "@/server/db/schema";
import {
  OrganizationWorkspace,
  type LegacyAssignmentItem,
  type PeriodItem,
  type PersonItem,
  type UnitOption,
} from "./organization-workspace";

export const metadata = { title: "Kepengurusan" };

export default async function OrganizationPage() {
  const { effectivePermissions } = await requirePermission("content.view");
  const canEdit = effectivePermissions.has("people.manage");
  const canManageMedia = effectivePermissions.has("media.manage");

  // 1. Fetch periods with counts
  const periodRows = await database
    .select()
    .from(organizationPeriods)
    .orderBy(desc(organizationPeriods.startYear), asc(organizationPeriods.label));

  const allUnitsRaw = await database
    .select({
      id: organizationUnits.id,
      periodId: organizationUnits.periodId,
      name: organizationUnits.name,
      displayOrder: organizationUnits.displayOrder,
    })
    .from(organizationUnits)
    .orderBy(asc(organizationUnits.displayOrder), asc(organizationUnits.name));

  const allMembershipsRaw = await database
    .select({
      id: organizationMemberships.id,
      periodId: organizationMemberships.periodId,
      unitId: organizationMemberships.unitId,
      personId: organizationMemberships.personId,
    })
    .from(organizationMemberships);

  const connectedEditionsRaw = await database
    .select({
      id: editions.id,
      organizationPeriodId: editions.organizationPeriodId,
    })
    .from(editions);

  const periods: PeriodItem[] = periodRows.map((p) => {
    const unitsForPeriod = allUnitsRaw.filter((u) => u.periodId === p.id);
    const membersForPeriod = allMembershipsRaw.filter((m) => m.periodId === p.id);
    const connectedEditions = connectedEditionsRaw.filter((e) => e.organizationPeriodId === p.id);

    return {
      id: p.id,
      label: p.label,
      startYear: p.startYear,
      endYear: p.endYear,
      vision: p.vision,
      missionJson: p.missionJson,
      lifecycle: p.lifecycle,
      version: p.version,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      connectedEditionsCount: connectedEditions.length,
      unitCount: unitsForPeriod.length,
      memberCount: membersForPeriod.length,
    };
  });

  // 2. Fetch people list with assets and social links
  const peopleRaw = await database
    .select({
      id: people.id,
      name: people.name,
      slug: people.slug,
      shortBio: people.shortBio,
      portraitMediaId: people.portraitMediaId,
      version: people.version,
      createdAt: people.createdAt,
      updatedAt: people.updatedAt,
      assetId: mediaAssets.id,
      assetUrl: mediaAssets.url,
      assetFilename: mediaAssets.filename,
      assetMimeType: mediaAssets.mimeType,
      assetBytes: mediaAssets.bytes,
      assetAlt: mediaAssets.alt,
      assetDecorative: mediaAssets.decorative,
      assetLifecycle: mediaAssets.lifecycle,
      assetFolderId: mediaAssets.folderId,
    })
    .from(people)
    .leftJoin(mediaAssets, eq(people.portraitMediaId, mediaAssets.id))
    .orderBy(asc(people.name));

  const socialLinksRaw = await database
    .select()
    .from(personSocialLinks)
    .orderBy(asc(personSocialLinks.displayOrder));

  const peopleList: PersonItem[] = peopleRaw.map((row) => {
    const personSocials = socialLinksRaw
      .filter((s) => s.personId === row.id)
      .map((s) => ({
        id: s.id,
        platform: s.platform,
        label: s.label,
        url: s.url,
        displayOrder: s.displayOrder,
      }));

    const membershipCount = allMembershipsRaw.filter((m) => m.personId === row.id).length;

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortBio: row.shortBio,
      portraitMediaId: row.portraitMediaId,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      portraitAsset: row.assetId
        ? {
            id: row.assetId,
            url: row.assetUrl!,
            filename: row.assetFilename!,
            mimeType: row.assetMimeType!,
            bytes: row.assetBytes!,
            alt: row.assetAlt,
            decorative: row.assetDecorative ?? false,
            lifecycle: row.assetLifecycle!,
            folderId: row.assetFolderId,
          }
        : null,
      socialLinks: personSocials,
      membershipCount,
    };
  });

  // 3. Fetch legacy assignments
  const legacyRaw = await database
    .select({
      id: organizationAssignments.id,
      editionId: organizationAssignments.editionId,
      personId: organizationAssignments.personId,
      personName: people.name,
      title: organizationAssignments.title,
      group: organizationAssignments.group,
      termLabel: organizationAssignments.termLabel,
      displayOrder: organizationAssignments.displayOrder,
      active: organizationAssignments.active,
    })
    .from(organizationAssignments)
    .leftJoin(people, eq(organizationAssignments.personId, people.id))
    .orderBy(asc(organizationAssignments.displayOrder));

  const legacyAssignments: LegacyAssignmentItem[] = legacyRaw.map((l) => {
    const isMapped = allMembershipsRaw.some((m) => m.personId === l.personId);
    return {
      id: l.id,
      editionId: l.editionId,
      personId: l.personId,
      personName: l.personName ?? "Anonim",
      title: l.title,
      group: l.group,
      termLabel: l.termLabel,
      displayOrder: l.displayOrder,
      active: l.active,
      isMapped,
    };
  });

  const allUnits: UnitOption[] = allUnitsRaw.map((u) => ({
    id: u.id,
    periodId: u.periodId,
    name: u.name,
  }));

  return (
    <AdminPage
      eyebrow="Kepengurusan"
      title="Kepengurusan"
    >
      <OrganizationWorkspace
        periods={periods}
        peopleList={peopleList}
        legacyAssignments={legacyAssignments}
        allUnits={allUnits}
        canEdit={canEdit}
        canManageMedia={canManageMedia}
      />
    </AdminPage>
  );
}
