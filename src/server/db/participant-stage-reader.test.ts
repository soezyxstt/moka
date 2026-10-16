import { createClient } from '@libsql/client/node';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { getPublicParticipantStage } from '../cms/participant-stage';
import * as schema from './schema';

test('tahap publik memakai semifinal aktif tanpa placeholder final dan tetap terisolasi per edisi', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moka-public-stage-'));
  const client = createClient({ url: `file:${join(directory, 'test.db')}` });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: resolve('drizzle') });
    await db.insert(schema.editions).values([
      { id: 'old', year: 2025, slug: '2025', name: '2025' },
      { id: 'current', year: 2026, slug: '2026', name: '2026' },
      { id: 'empty', year: 2027, slug: '2027', name: '2027' },
    ]);
    await db.insert(schema.selectionStages).values([
      { id: 'old-final', editionId: 'old', name: 'Final', slug: 'final', displayOrder: 9, lifecycle: 'closed', finalStage: true },
      { id: 'audition', editionId: 'current', name: 'Audisi', slug: 'audisi', displayOrder: 0, lifecycle: 'closed' },
      { id: 'semi', editionId: 'current', name: 'Semifinalis', slug: 'semifinalis', displayOrder: 1, lifecycle: 'active' },
      { id: 'future', editionId: 'current', name: 'Tahap berikut', slug: 'berikut', displayOrder: 2, lifecycle: 'draft' },
    ]);

    assert.equal((await getPublicParticipantStage(db, 'current', 'semifinalis'))?.id, 'semi');
    assert.equal(await getPublicParticipantStage(db, 'current', 'finalis'), undefined);
    assert.equal(await getPublicParticipantStage(db, 'empty', 'semifinalis'), undefined);
    assert.equal(await getPublicParticipantStage(db, 'empty', 'finalis'), undefined);

    await db.insert(schema.selectionStages).values({ id: 'only-audition', editionId: 'empty', name: 'Audisi', slug: 'audisi', lifecycle: 'active' });
    assert.equal(await getPublicParticipantStage(db, 'empty', 'semifinalis'), undefined);

    await db.update(schema.selectionStages).set({ lifecycle: 'closed' }).where(eq(schema.selectionStages.id, 'semi'));
    assert.equal((await getPublicParticipantStage(db, 'current', 'semifinalis'))?.id, 'semi');

    await db.update(schema.selectionStages).set({ lifecycle: 'draft' }).where(eq(schema.selectionStages.editionId, 'current'));
    assert.equal(await getPublicParticipantStage(db, 'current', 'semifinalis'), undefined);

    await db.update(schema.selectionStages).set({ lifecycle: 'active' }).where(eq(schema.selectionStages.id, 'semi'));
    await db.insert(schema.selectionStages).values({
      id: 'final', editionId: 'current', name: 'Finalis', slug: 'finalis', displayOrder: 3, lifecycle: 'draft', finalStage: true,
    });
    assert.equal(await getPublicParticipantStage(db, 'current', 'semifinalis'), undefined);
    assert.equal(await getPublicParticipantStage(db, 'current', 'finalis'), undefined);

    await db.update(schema.selectionStages).set({ lifecycle: 'closed' }).where(eq(schema.selectionStages.id, 'future'));
    await db.update(schema.selectionStages).set({ lifecycle: 'active' }).where(eq(schema.selectionStages.id, 'final'));
    assert.equal((await getPublicParticipantStage(db, 'current', 'semifinalis'))?.id, 'future');
    assert.equal(await getPublicParticipantStage(db, 'current', 'finalis'), undefined, 'Semifinal masih aktif');
    await db.update(schema.selectionStages).set({ lifecycle: 'closed' }).where(eq(schema.selectionStages.id, 'semi'));
    assert.equal(await getPublicParticipantStage(db, 'current', 'finalis'), undefined, 'Roster final belum tersedia');
    await db.insert(schema.categories).values([
      { id: 'current-category', editionId: 'current', code: 'JD', slug: 'jd', label: 'JD' },
      { id: 'old-category', editionId: 'old', code: 'JD', slug: 'jd', label: 'JD' },
    ]);
    await db.insert(schema.participants).values([
      { id: 'current-participant', editionId: 'current', categoryId: 'current-category', stage: 'finalis', name: 'Current', slug: 'current', number: 1, active: false },
      { id: 'old-participant', editionId: 'old', categoryId: 'old-category', stage: 'finalis', name: 'Old', slug: 'old', number: 1 },
    ]);
    await db.insert(schema.participantStageEntries).values([
      { participantId: 'current-participant', stageId: 'final' },
      { participantId: 'old-participant', stageId: 'old-final' },
    ]);
    assert.equal(await getPublicParticipantStage(db, 'current', 'finalis'), undefined, 'Peserta nonaktif tidak membuka final');
    await db.update(schema.participants).set({ active: true }).where(eq(schema.participants.id, 'current-participant'));
    assert.equal((await getPublicParticipantStage(db, 'current', 'finalis'))?.id, 'final');
    assert.equal((await getPublicParticipantStage(db, 'old', 'finalis'))?.id, 'old-final');
    assert.equal(await getPublicParticipantStage(db, 'old', 'semifinalis'), undefined);
  } finally {
    client.close();
  }
});
