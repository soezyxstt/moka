import assert from 'node:assert/strict';
import { createClient } from '@libsql/client/node';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { readFileSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import * as schema from '../src/server/db/schema';
import { initializeParticipantStageMedia } from '../src/server/selection/stage-media';

test('migrasi additive mempertahankan entri dan membekukan referensi lama sebelum diubah', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moka-stage-upgrade-'));
  const oldMigrations = join(directory, 'migrations');
  await mkdir(join(oldMigrations, 'meta'), { recursive: true });
  const journal = JSON.parse(readFileSync(resolve('drizzle/meta/_journal.json'), 'utf8')) as { entries: { tag: string }[] };
  const previous = { ...journal, entries: journal.entries.filter((entry) => entry.tag !== '0019_red_mister_sinister') };
  await writeFile(join(oldMigrations, 'meta', '_journal.json'), JSON.stringify(previous));
  for (const entry of previous.entries) await copyFile(resolve('drizzle', `${entry.tag}.sql`), join(oldMigrations, `${entry.tag}.sql`));
  const client = createClient({ url: `file:${join(directory, 'test.db')}` });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: oldMigrations });
    await client.executeMultiple(`INSERT INTO edition (id, year, slug, name, createdAt, updatedAt) VALUES ('ed', 2026, 'ed', 'Edisi', 0, 0);
      INSERT INTO category (id, editionId, code, slug, label, createdAt, updatedAt) VALUES ('cat', 'ed', 'JD', 'jd', 'JD', 0, 0);
      INSERT INTO mediaAsset (id, provider, url, filename, mimeType, bytes, createdAt, updatedAt) VALUES ('photo', 'uploadthing', 'https://example.com/photo.png', 'photo.png', 'image/png', 10, 0, 0);
      INSERT INTO participant (id, editionId, categoryId, stage, number, name, slug, portraitMediaId, createdAt, updatedAt) VALUES ('p', 'ed', 'cat', 'semi', 1, 'Peserta', 'peserta', 'photo', 0, 0);
      INSERT INTO selectionStage (id, editionId, name, slug, createdAt, updatedAt) VALUES ('semi', 'ed', 'Semifinalis', 'semi', 0, 0);
      INSERT INTO participantStageEntry (id, participantId, stageId, createdAt, updatedAt) VALUES ('entry', 'p', 'semi', 0, 0);`);
    await migrate(db, { migrationsFolder: resolve('drizzle') });
    const [before] = await db.select().from(schema.participantStageEntries).where(eq(schema.participantStageEntries.id, 'entry'));
    assert.equal(before.mediaInitialized, false);
    await db.transaction(async (tx) => {
      await initializeParticipantStageMedia(tx, { id: 'p', portraitMediaId: 'photo', qrisMediaId: null }, new Date('2026-01-01T00:00:00Z'));
      await tx.update(schema.participants).set({ portraitMediaId: null }).where(eq(schema.participants.id, 'p'));
    });
    const [after] = await db.select().from(schema.participantStageEntries).where(eq(schema.participantStageEntries.id, 'entry'));
    assert.deepEqual([after.portraitMediaId, after.qrisMediaId, after.mediaInitialized], ['photo', null, true]);
  } finally { client.close(); }
});

test('aksi media tahap membekukan referensi lama, mengisolasi tahap, dan menolak perubahan tidak sah', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moka-stage-media-'));
  const client = createClient({ url: `file:${join(directory, 'test.db')}` });
  const db = drizzle(client, { schema });
  const require = createRequire(import.meta.url);
  let authorized = true;
  const compiled = ts.transpileModule(readFileSync(resolve('src/app/admin/content/participants/actions.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const actions = {} as typeof import('../src/app/admin/content/participants/actions');
  new Function('require', 'exports', compiled)((specifier: string) => {
    if (specifier === 'next/cache') return { revalidatePath: () => {} };
    if (specifier === '@/server/db/client') return { database: db };
    if (specifier === '@/server/cms/context') return { getAdminEditionContext: async () => ({ id: 'ed' }) };
    if (specifier === '@/server/auth/authorization') return { requirePermission: async () => {
      if (!authorized) throw new Error('Tidak diizinkan');
      return { session: { user: { id: 'actor', email: 'actor@example.com' } } };
    } };
    return require(specifier.startsWith('@/') ? resolve('src', specifier.slice(2)) : specifier);
  }, actions);
  try {
    await migrate(db, { migrationsFolder: resolve('drizzle') });
    await db.insert(schema.authUsers).values({ id: 'actor', name: 'Admin', email: 'actor@example.com', emailVerified: true });
    await db.insert(schema.editions).values({ id: 'ed', year: 2026, slug: 'ed', name: 'Edisi', lifecycle: 'active' });
    await db.insert(schema.categories).values({ id: 'cat', editionId: 'ed', code: 'JD', slug: 'jd', label: 'JD' });
    await db.insert(schema.selectionStages).values([
      { id: 'semi', editionId: 'ed', slug: 'semifinalis', name: 'Semifinalis' },
      { id: 'final', editionId: 'ed', slug: 'finalis', name: 'Finalis', displayOrder: 1 },
    ]);
    await db.insert(schema.mediaAssets).values(['old-photo', 'old-qr', 'new-photo', 'new-qr'].map((id) => ({
      id, provider: 'uploadthing', url: `https://example.com/${id}.png`, filename: `${id}.png`, mimeType: 'image/png', bytes: 100,
    })));
    await db.insert(schema.participants).values({ id: 'p', editionId: 'ed', categoryId: 'cat', currentStageId: 'final', stage: 'semifinalis', number: 1, name: 'Peserta', slug: 'peserta', portraitMediaId: 'old-photo', qrisMediaId: 'old-qr' });
    await db.insert(schema.participantStageEntries).values([
      { id: 'entry-semi', participantId: 'p', stageId: 'semi' },
      { id: 'entry-final', participantId: 'p', stageId: 'final' },
    ]);
    const input = { participantId: 'p', entryId: 'entry-final', expectedParticipantVersion: 1, expectedEntryVersion: 1, portraitMediaId: 'new-photo', qrisMediaId: 'new-qr', reason: 'Foto final' };
    authorized = false;
    await assert.rejects(actions.updateParticipantStageMediaAction(input), /Tidak diizinkan/);
    authorized = true;
    await assert.rejects(actions.updateParticipantStageMediaAction({ ...input, entryId: 'missing' }), /tidak ditemukan/);
    await assert.rejects(actions.updateParticipantStageMediaAction({ ...input, qrisMediaId: 'missing' }), /gambar valid/);
    await actions.updateParticipantStageMediaAction(input);
    const [semi] = await db.select().from(schema.participantStageEntries).where(eq(schema.participantStageEntries.id, 'entry-semi'));
    const [final] = await db.select().from(schema.participantStageEntries).where(eq(schema.participantStageEntries.id, 'entry-final'));
    const [participant] = await db.select().from(schema.participants).where(eq(schema.participants.id, 'p'));
    assert.deepEqual([semi.portraitMediaId, semi.qrisMediaId, semi.mediaInitialized], ['old-photo', 'old-qr', true]);
    assert.deepEqual([final.portraitMediaId, final.qrisMediaId, final.mediaInitialized], ['new-photo', 'new-qr', true]);
    assert.deepEqual([participant.portraitMediaId, participant.qrisMediaId], ['new-photo', 'new-qr']);
    assert.equal((await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, 'participant.stage.media.update'))).length, 1);
    await assert.rejects(actions.updateParticipantStageMediaAction(input), /telah diubah/);
    await actions.updateParticipantStageMediaAction({ ...input, entryId: 'entry-semi', expectedParticipantVersion: participant.version, expectedEntryVersion: semi.version, portraitMediaId: null, qrisMediaId: null });
    const [retained] = await db.select().from(schema.participants).where(eq(schema.participants.id, 'p'));
    const [cleared] = await db.select().from(schema.participantStageEntries).where(eq(schema.participantStageEntries.id, 'entry-semi'));
    assert.deepEqual([retained.portraitMediaId, retained.qrisMediaId], ['new-photo', 'new-qr']);
    assert.deepEqual([cleared.portraitMediaId, cleared.qrisMediaId, cleared.mediaInitialized], [null, null, true]);
    const qrisForm = new FormData();
    qrisForm.set('participantId', 'p');
    qrisForm.set('expectedVersion', String(retained.version));
    qrisForm.set('qrisMediaId', 'old-qr');
    qrisForm.set('reason', 'Ubah QRIS final');
    await actions.updateParticipantQrisAction(qrisForm);
    const [afterQris] = await db.select().from(schema.participants).where(eq(schema.participants.id, 'p'));
    await actions.saveParticipantMediaAction('p', [{ role: 'closeup', mediaId: 'old-photo', displayOrder: 0, active: true }], afterQris.version, 'Ubah foto final');
    const [afterLegacyFinal] = await db.select().from(schema.participantStageEntries).where(eq(schema.participantStageEntries.id, 'entry-final'));
    const [afterLegacySemi] = await db.select().from(schema.participantStageEntries).where(eq(schema.participantStageEntries.id, 'entry-semi'));
    assert.deepEqual([afterLegacyFinal.portraitMediaId, afterLegacyFinal.qrisMediaId], ['old-photo', 'old-qr']);
    assert.deepEqual([afterLegacySemi.portraitMediaId, afterLegacySemi.qrisMediaId], [null, null]);
  } finally { client.close(); }
});
