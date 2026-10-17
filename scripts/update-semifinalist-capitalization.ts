import 'dotenv/config';

import { createClient } from '@libsql/client/node';

interface ParticipantRow {
  id: string;
  editionId: string;
  categoryId: string;
  stage: string;
  currentStageId: string | null;
  selectionStatus: string;
  number: number;
  name: string;
  slug: string;
  bio: string | null;
  portraitMediaId: string | null;
  qrisMediaId: string | null;
  paymentUrl: string | null;
  displayOrder: number;
  active: number | boolean;
  version: number;
  createdAt: number;
  updatedAt: number;
}

function toTitleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      return word
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('-');
    })
    .join(' ');
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) throw new Error('TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN wajib diisi');

  const host = new URL(url).host;
  const isDryRun = process.argv.includes('--dry-run');

  if (!isDryRun) {
    const confirmationIndex = process.argv.indexOf('--confirm-host');
    const confirmation = confirmationIndex >= 0 ? process.argv[confirmationIndex + 1] : undefined;
    if (confirmation !== host) {
      throw new Error(`Target harus dikonfirmasi dengan --confirm-host ${host} (atau jalankan dengan --dry-run)`);
    }
  }

  const client = createClient({ url, authToken });

  try {
    const res = await client.execute(`
      SELECT p.*, c.code as categoryCode
      FROM participant p
      JOIN category c ON p.categoryId = c.id
      WHERE p.stage = 'semifinalis'
      ORDER BY p.editionId, c.code, p.number
    `);

    const candidates = res.rows as unknown as (ParticipantRow & { categoryCode: string })[];
    const updates: {
      row: ParticipantRow & { categoryCode: string };
      oldName: string;
      newName: string;
    }[] = [];

    for (const row of candidates) {
      const oldName = String(row.name);
      const newName = toTitleCase(oldName);
      if (oldName !== newName) {
        updates.push({ row, oldName, newName });
      }
    }

    console.log(`Ditemukan ${updates.length} semifinalis yang perlu pembaruan nama kapital.`);
    for (const u of updates) {
      console.log(`- [${u.row.categoryCode}-${u.row.number}] "${u.oldName}" -> "${u.newName}" (ID: ${u.row.id})`);
    }

    if (updates.length === 0) {
      console.log('Tidak ada peserta yang perlu diperbarui.');
      return;
    }

    if (isDryRun) {
      console.log('\n[DRY RUN] Tidak ada perubahan yang disimpan ke database.');
      return;
    }

    // Operator user info for audit and revision
    const operatorUserRes = await client.execute(
      "SELECT id, email FROM user WHERE email = 'soezyxst@gmail.com' LIMIT 1"
    );
    const operatorUserId = operatorUserRes.rows[0]?.id ? String(operatorUserRes.rows[0].id) : null;
    const operatorEmail = operatorUserRes.rows[0]?.email ? String(operatorUserRes.rows[0].email) : 'operator';

    const now = Date.now();
    const tx = await client.transaction('write');

    try {
      for (const u of updates) {
        const nextVersion = Number(u.row.version) + 1;

        // 1. Update participant
        await tx.execute({
          sql: `
            UPDATE participant
            SET name = :name,
                version = :version,
                updatedAt = :updatedAt
            WHERE id = :id AND version = :expectedVersion
          `,
          args: {
            name: u.newName,
            version: nextVersion,
            updatedAt: now,
            id: u.row.id,
            expectedVersion: u.row.version,
          },
        });

        // 2. Snapshot for revision
        const snapshot = {
          id: u.row.id,
          editionId: u.row.editionId,
          categoryId: u.row.categoryId,
          stage: u.row.stage,
          currentStageId: u.row.currentStageId,
          selectionStatus: u.row.selectionStatus,
          number: u.row.number,
          name: u.newName,
          slug: u.row.slug,
          bio: u.row.bio,
          portraitMediaId: u.row.portraitMediaId,
          qrisMediaId: u.row.qrisMediaId,
          paymentUrl: u.row.paymentUrl,
          displayOrder: u.row.displayOrder,
          active: Boolean(u.row.active),
          version: nextVersion,
          createdAt: new Date(Number(u.row.createdAt)).toISOString(),
          updatedAt: new Date(now).toISOString(),
        };

        // Insert contentRevision
        await tx.execute({
          sql: `
            INSERT INTO contentRevision (
              id, resourceType, resourceId, version, snapshotJson, authorUserId, reason, createdAt
            ) VALUES (
              :id, :resourceType, :resourceId, :version, :snapshotJson, :authorUserId, :reason, :createdAt
            )
          `,
          args: {
            id: crypto.randomUUID(),
            resourceType: 'participant',
            resourceId: u.row.id,
            version: nextVersion,
            snapshotJson: JSON.stringify(snapshot),
            authorUserId: operatorUserId,
            reason: 'Update nama semifinalis menjadi format kapital (title case)',
            createdAt: now,
          },
        });

        // 3. Insert auditLog
        await tx.execute({
          sql: `
            INSERT INTO auditLog (
              id, actorUserId, actorLabel, action, resourceType, resourceId, resourceLabel,
              beforeJson, afterJson, changedFieldsJson, source, reason, requestMetadataJson, createdAt
            ) VALUES (
              :id, :actorUserId, :actorLabel, :action, :resourceType, :resourceId, :resourceLabel,
              :beforeJson, :afterJson, :changedFieldsJson, :source, :reason, :requestMetadataJson, :createdAt
            )
          `,
          args: {
            id: crypto.randomUUID(),
            actorUserId: operatorUserId,
            actorLabel: operatorEmail,
            action: 'participant.update',
            resourceType: 'participant',
            resourceId: u.row.id,
            resourceLabel: `${u.row.number} - ${u.newName}`,
            beforeJson: JSON.stringify({
              name: u.oldName,
              version: u.row.version,
            }),
            afterJson: JSON.stringify({
              name: u.newName,
              version: nextVersion,
            }),
            changedFieldsJson: JSON.stringify(['name', 'version', 'updatedAt']),
            source: 'operator:db-script',
            reason: 'Update nama semifinalis menjadi format kapital (title case)',
            requestMetadataJson: JSON.stringify({ target: host }),
            createdAt: now,
          },
        });
      }

      await tx.commit();
      console.log(`\nBerhasil memperbarui ${updates.length} semifinalis secara atomik di target ${host}.`);
    } catch (err) {
      await tx.rollback();
      throw err;
    }

    // Post-check verification
    const verifyRes = await client.execute(`
      SELECT p.id, c.code as categoryCode, p.number, p.name, p.version
      FROM participant p
      JOIN category c ON p.categoryId = c.id
      WHERE p.id IN (${updates.map((u) => `'${u.row.id}'`).join(', ')})
      ORDER BY c.code, p.number
    `);

    console.log('\nHasil verifikasi di database:');
    for (const r of verifyRes.rows) {
      console.log(`✓ [${r.categoryCode}-${r.number}] "${r.name}" (version: ${r.version})`);
    }

    const fkCheck = await client.execute('PRAGMA foreign_key_check');
    if (fkCheck.rows.length > 0) {
      console.error('Peringatan: ditemukan foreign key errors!', fkCheck.rows);
    } else {
      console.log('✓ foreign_key_check OK: 0 error.');
    }
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
