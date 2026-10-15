import "dotenv/config";
import { createClient } from "@libsql/client/node";

const requiredTables = [
  "Finalist",
  "Semifinalist",
  "IncomePerDate",
  "user",
  "session",
  "account",
  "verification",
  "adminProfile",
  "role",
  "permission",
  "rolePermission",
  "userRole",
  "userPermissionOverride",
  "accessRequest",
  "auditLog",
  "organizationAssignment",
  "edition",
  "editionProgram",
  "pageSection",
  "siteAssetBinding",
  "organizationPeriod",
  "organizationUnit",
  "organizationMembership",
  "mediaFolder",
  "mediaAsset",
  "contentDraft",
  "contentRevision",
  "person",
  "personSocialLink",
  "category",
  "selectionStage",
  "participant",
  "participantStageEntry",
  "participantAchievement",
  "participantSocialLink",
  "participantMedia",
  "editionTitle",
  "participantTitleAssignment",
  "sponsor",
  "newsArticle",
  "event",
  "gallery",
  "galleryItem",
  "votingCampaign",
  "votingCampaignParticipant",
  "voteDailyTally",
  "committeeUnit",
  "committeeAssignment",
] as const;

const requiredColumns: Record<string, string[]> = {
  edition: ["year", "slug", "lifecycle", "slogan"],
  selectionStage: ["targetJDCount", "targetMDCount", "targetJRCount", "targetMRCount"],
  participant: ["currentStageId", "selectionStatus", "qrisMediaId"],
  participantStageEntry: ["number", "displayOrder", "decision"],
  editionTitle: ["editionId", "capacity"],
  participantMedia: ["participantId", "role", "mediaId"],
  galleryItem: ["mediaId", "youtubeId"],
  votingCampaign: ["eligibilityStageId", "pricePerPoint", "resultVisibility"],
};

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error("Turso env belum lengkap");

  const host = new URL(url).host;
  const client = createClient({ url, authToken });
  try {
    const tableRows = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    const tableNames = new Set(tableRows.rows.map((row) => String(row.name)));
    const missingTables = requiredTables.filter((table) => !tableNames.has(table));
    const missingColumns: string[] = [];

    for (const [table, columns] of Object.entries(requiredColumns)) {
      if (!tableNames.has(table)) {
        missingColumns.push(...columns.map((column) => `${table}.${column}`));
        continue;
      }
      const tableInfo = await client.execute(`PRAGMA table_info("${table}")`);
      const present = new Set(tableInfo.rows.map((row) => String(row.name)));
      missingColumns.push(...columns.filter((column) => !present.has(column)).map((column) => `${table}.${column}`));
    }

    const migrationRows = tableNames.has("__drizzle_migrations")
      ? await client.execute("SELECT created_at FROM __drizzle_migrations ORDER BY created_at")
      : { rows: [] };
    const migrations = migrationRows.rows.map((row) => Number(row.created_at));
    const editions = tableNames.has("edition")
      ? await client.execute("SELECT id, year, slug, lifecycle FROM edition ORDER BY year")
      : { rows: [] };
    const edition2025 = editions.rows.filter((row) => Number(row.year) === 2025 || row.slug === "2025");
    const counts: Record<string, number> = {};
    const expectedCountTables = [
      "edition", "editionProgram", "pageSection", "siteAssetBinding", "organizationPeriod",
      "organizationUnit", "organizationMembership", "category", "selectionStage", "participant",
      "participantStageEntry", "participantAchievement", "participantMedia", "editionTitle",
      "participantTitleAssignment", "sponsor", "newsArticle", "event", "gallery", "galleryItem",
      "mediaFolder", "mediaAsset", "votingCampaign", "votingCampaignParticipant", "voteDailyTally",
    ] as const;

    for (const table of expectedCountTables) {
      if (tableNames.has(table)) {
        const safeTable = table.replaceAll('"', '""');
        counts[table] = Number((await client.execute(`SELECT COUNT(*) AS count FROM "${safeTable}"`)).rows[0].count);
      }
    }

    let edition2025Content: Record<string, number | string | null> | null = null;
    let campaigns2025: Array<Record<string, unknown>> = [];
    if (edition2025.length === 1 && missingTables.length === 0) {
      const editionId = String(edition2025[0].id);
      const scalarCount = async (table: string, column: string) => Number((await client.execute({
        sql: `SELECT COUNT(*) AS count FROM "${table}" WHERE "${column}" = ?`,
        args: [editionId],
      })).rows[0].count);
      const stageCounts = await client.execute({
        sql: `SELECT stage, COUNT(*) AS count FROM participant WHERE editionId = ? GROUP BY stage ORDER BY stage`,
        args: [editionId],
      });
      edition2025Content = {
        editionId,
        lifecycle: String(edition2025[0].lifecycle),
        categories: await scalarCount("category", "editionId"),
        participants: await scalarCount("participant", "editionId"),
        pageSectionsPublished: Number((await client.execute({
          sql: "SELECT COUNT(*) AS count FROM pageSection WHERE editionId = ? AND status = 'published'",
          args: [editionId],
        })).rows[0].count),
        programsActive: Number((await client.execute({
          sql: "SELECT COUNT(*) AS count FROM editionProgram WHERE editionId = ? AND active = 1",
          args: [editionId],
        })).rows[0].count),
        siteAssets: await scalarCount("siteAssetBinding", "editionId"),
        events: await scalarCount("event", "editionId"),
        galleriesPublished: Number((await client.execute({
          sql: "SELECT COUNT(*) AS count FROM gallery WHERE editionId = ? AND status = 'published'",
          args: [editionId],
        })).rows[0].count),
        galleryItems: Number((await client.execute({
          sql: `SELECT COUNT(*) AS count FROM galleryItem
                INNER JOIN gallery ON gallery.id = galleryItem.galleryId
                WHERE gallery.editionId = ? AND gallery.status = 'published'`,
          args: [editionId],
        })).rows[0].count),
        newsPublished: Number((await client.execute({
          sql: "SELECT COUNT(*) AS count FROM newsArticle WHERE editionId = ? AND status = 'published'",
          args: [editionId],
        })).rows[0].count),
        sponsorsActive: Number((await client.execute({
          sql: "SELECT COUNT(*) AS count FROM sponsor WHERE editionId = ? AND active = 1",
          args: [editionId],
        })).rows[0].count),
        participantStages: JSON.stringify(stageCounts.rows.map((row) => ({ stage: row.stage, count: Number(row.count) }))),
      };

      campaigns2025 = (await client.execute({
        sql: `SELECT campaign.id, campaign.name, campaign.status, campaign.startsAt, campaign.endsAt,
                     campaign.pricePerPoint, campaign.resultVisibility, COUNT(tally.id) AS tallyCount
              FROM votingCampaign AS campaign
              LEFT JOIN voteDailyTally AS tally ON tally.campaignId = campaign.id
              WHERE campaign.editionId = ?
              GROUP BY campaign.id
              ORDER BY campaign.startsAt`,
        args: [editionId],
      })).rows.map((row) => ({ ...row }));
    }

    const foreignKeyErrors = (await client.execute("PRAGMA foreign_key_check")).rows.length;
    const missingMedia = tableNames.has("mediaAsset") && tableNames.has("participant") && tableNames.has("sponsor")
      ? (await client.execute(
          "SELECT (SELECT COUNT(*) FROM participant WHERE portraitMediaId IS NULL) participantPortraits, (SELECT COUNT(*) FROM sponsor WHERE logoMediaId IS NULL) sponsorLogos",
        )).rows[0]
      : null;

    console.log(JSON.stringify({
      mode: "read-only-preflight",
      target: host,
      tableCount: tableNames.size,
      missingTables,
      missingColumns,
      migrationCount: migrations.length,
      latestMigrationTimestamp: migrations.at(-1) ?? null,
      editions: editions.rows,
      counts,
      edition2025: edition2025Content,
      campaigns2025,
      foreignKeyErrors,
      missingMedia,
    }, null, 2));
  } finally {
    client.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Preflight gagal";
  const token = process.env.TURSO_AUTH_TOKEN;
  console.error(token ? message.replaceAll(token, "[REDACTED]") : message);
  process.exitCode = 1;
});
