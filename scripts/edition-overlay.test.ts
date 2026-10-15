import assert from 'node:assert/strict';
import { createClient } from '@libsql/client/node';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import * as schema from '../src/server/db/schema';

test('public readers overlay CMS sections and event media while keeping operational data isolated', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moka-overlay-'));
  const client = createClient({ url: `file:${join(directory, 'test.db')}` });
  const db = drizzle(client, { schema });
  const require = createRequire(import.meta.url);
  let preview: string | null = 'new';
  const compiled = ts.transpileModule(readFileSync(resolve('src/server/cms/public-readers.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const readers = {} as typeof import('../src/server/cms/public-readers');
  // Keep the real CMS queries and replace only request context and the database target.
  new Function('require', 'exports', compiled)((specifier: string) => {
    if (specifier === 'next/server') return { connection: async () => {} };
    if (specifier === 'react') return { cache: (fn: unknown) => fn };
    if (specifier === '@/server/db/client') return { database: db };
    if (specifier === '@/server/cms/preview') return { getPreviewEditionId: async () => preview };
    return require(specifier.startsWith('@/') ? resolve('src', specifier.slice(2)) : specifier);
  }, readers);
  try {
    await migrate(db, { migrationsFolder: resolve('drizzle') });
    await db.insert(schema.editions).values([
      { id: 'new', year: 2026, slug: 'new', name: 'Current', lifecycle: 'draft', slogan: 'New theme' },
      { id: 'old', year: 2025, slug: 'old', name: 'Previous', lifecycle: 'active', slogan: 'Old theme' },
      { id: 'private', year: 2024, slug: 'private', name: 'Private', lifecycle: 'draft' },
    ]);
    await db.insert(schema.mediaAssets).values(['old-image', 'new-image', 'unready'].map((id) => ({
      id, provider: 'uploadthing', url: `https://example.com/${id}.webp`, filename: `${id}.webp`, mimeType: 'image/webp', bytes: 100,
      lifecycle: id === 'unready' ? 'processing' : 'ready',
    })));
    await db.insert(schema.pageSections).values([
      { editionId: 'old', pageKey: 'home', sectionKey: 'hero', title: 'Old hero', body: 'Old body', status: 'published' },
      { editionId: 'new', pageKey: 'home', sectionKey: 'hero', title: 'New hero', body: null, status: 'draft' },
      { editionId: 'old', pageKey: 'home', sectionKey: 'program', title: 'Old program', status: 'published' },
      { editionId: 'old', pageKey: 'home', sectionKey: 'ajakan', title: 'Private old draft', status: 'draft' },
      { editionId: 'private', pageKey: 'home', sectionKey: 'ajakan', title: 'Private edition', status: 'published' },
      { editionId: 'old', pageKey: 'site', sectionKey: 'identity', title: 'Old identity', body: 'Old identity body', status: 'published' },
      { editionId: 'old', pageKey: 'site', sectionKey: 'instagram', title: 'Instagram', body: 'https://instagram.com/mokagarut', status: 'published' },
      { editionId: 'old', pageKey: 'pendaftaran', sectionKey: 'hero', title: 'Old registration', status: 'published' },
    ]);
    await db.insert(schema.siteAssetBindings).values([
      { editionId: 'old', slotKey: 'home.hero.bg', mediaId: 'old-image' },
      { editionId: 'new', slotKey: 'home.hero.bg', mediaId: 'unready' },
    ]);
    await db.insert(schema.editionPrograms).values({ editionId: 'old', title: 'Previous program' });
    await db.insert(schema.sponsors).values({ editionId: 'old', name: 'Previous sponsor', tier: 'pendukung', logoMediaId: 'old-image' });
    await db.insert(schema.events).values([
      { id: 'old-event', editionId: 'old', slug: 'audisi', label: 'Old audition', description: 'Old description', heroMediaId: 'old-image' },
      { id: 'new-event', editionId: 'new', slug: 'audisi', label: 'Current audition', description: 'Current description', heroMediaId: 'unready' },
    ]);
    await db.insert(schema.galleries).values([
      { id: 'old-album', editionId: 'old', slug: 'audisi', title: 'Old album', ownerType: 'event', ownerId: 'old-event' },
      { id: 'new-album', editionId: 'new', slug: 'audisi', title: 'Empty new album', ownerType: 'event', ownerId: 'new-event' },
      { id: 'private-album', editionId: 'old', slug: 'private', title: 'Old draft album', ownerType: 'standalone', ownerId: 'private', status: 'draft', coverMediaId: 'old-image' },
    ]);
    await db.insert(schema.galleryItems).values({ galleryId: 'old-album', mediaId: 'old-image' });
    await db.insert(schema.newsArticles).values({ editionId: 'old', slug: 'old-story', title: 'Old story', status: 'published', body: 'Old story body' });
    await db.insert(schema.selectionStages).values({ id: 'old-semi', editionId: 'old', slug: 'semifinalis', name: 'Semifinalis', lifecycle: 'closed' });
    assert.equal((await readers.getPublicNavigation()).participantKind, 'finalis', 'An older semifinal stage does not change current navigation');
    await db.insert(schema.selectionStages).values({ id: 'new-semi', editionId: 'new', slug: 'semifinalis', name: 'Semifinalis', lifecycle: 'active' });
    assert.equal((await readers.getPublicNavigation()).participantKind, 'semifinalis');
    await db.insert(schema.selectionStages).values({ id: 'old-final', editionId: 'old', slug: 'finalis', name: 'Finalis', lifecycle: 'closed', finalStage: true, displayOrder: 1 });
    assert.equal((await readers.getPublicNavigation()).participantKind, 'semifinalis', 'An older final stage does not hide current semifinal navigation');
    await db.insert(schema.selectionStages).values({ id: 'new-final', editionId: 'new', slug: 'finalis', name: 'Finalis', lifecycle: 'draft', finalStage: true, displayOrder: 1 });
    assert.equal((await readers.getPublicNavigation()).participantKind, 'semifinalis', 'Draft final stage keeps semifinal links');
    await db.update(schema.selectionStages).set({ lifecycle: 'active' }).where(eq(schema.selectionStages.id, 'new-final'));
    assert.equal((await readers.getPublicNavigation()).participantKind, 'finalis', 'Public final stage switches profile links');

    const home = await readers.getPublicHomeContent();
    assert.equal(home.sections.hero.title, 'New hero');
    assert.equal(home.sections.hero.body, null, 'A replacement section never mixes older fields');
    assert.equal(home.sections.program.title, 'Old program');
    assert.equal(home.sections.ajakan, undefined, 'Draft older editions and older draft sections stay private');
    assert.equal(home.assets['home.hero.bg'].url, 'https://example.com/old-image.webp');
    assert.equal(home.programs[0].title, 'Previous program');
    const identity = await readers.getPublicSiteIdentity();
    assert.equal(identity.edition.year, 2026);
    assert.equal(identity.edition.slogan, 'New theme');
    assert.equal(identity.description, '', 'Identity copy remains current-only');
    assert.equal(identity.contacts.length, 1);
    assert.equal(await readers.getPublicRegistration(), null);
    assert.equal((await readers.getPublicSponsors())[0].name, 'Previous sponsor');
    const event = await readers.getPublicEventBySlug('audisi');
    assert.equal(event?.label, 'Current audition');
    assert.equal(event?.heroImageUrl, 'https://example.com/old-image.webp');
    assert.deepEqual(event?.images, ['https://example.com/old-image.webp']);
    assert.equal((await readers.getPublicEvents())[0].label, event?.label);
    assert.equal((await readers.getPublicGalleryAlbums())[0].id, 'old-album');
    assert.equal((await readers.getPublicGalleryAlbums()).length, 1);
    assert.equal((await readers.getPublicNews())[0].slug, 'old-story');
    assert.equal((await readers.getPublicNewsBySlug('old-story'))?.body, 'Old story body');
    assert.equal((await readers.getPublicVotingCategories()).categories.length, 0);
    assert.equal(await readers.getPublicVotingCampaign(), null);

    await db.insert(schema.categories).values({ id: 'new-jd', editionId: 'new', code: 'JD', slug: 'jajaka-dewasa', label: 'JD' });
    await db.insert(schema.siteAssetBindings).values({ editionId: 'old', slotKey: 'category.jd.poster', mediaId: 'old-image' });
    assert.equal((await readers.getPublicVotingCategoryBySlug('jajaka-dewasa'))?.poster, null, 'Participant category images never inherit');
    await db.update(schema.events).set({ heroMediaId: 'new-image' }).where(eq(schema.events.id, 'new-event'));
    await db.insert(schema.galleryItems).values({ galleryId: 'new-album', mediaId: 'new-image' });
    await db.insert(schema.newsArticles).values({ editionId: 'new', slug: 'new-story', title: 'New story', status: 'published' });
    await db.insert(schema.editionPrograms).values({ editionId: 'new', title: 'Current program' });
    await db.insert(schema.sponsors).values({ editionId: 'new', name: 'Current sponsor', tier: 'pendukung', logoMediaId: 'new-image' });
    assert.equal((await readers.getPublicEventBySlug('audisi'))?.heroImageUrl, 'https://example.com/new-image.webp');
    assert.deepEqual((await readers.getPublicEventBySlug('audisi'))?.images, ['https://example.com/new-image.webp']);
    assert.equal((await readers.getPublicGalleryAlbums())[0].id, 'new-album');
    assert.equal((await readers.getPublicNews())[0].slug, 'new-story');
    assert.equal(await readers.getPublicNewsBySlug('old-story'), null, 'Details follow the same source edition as the news list');
    assert.deepEqual((await readers.getPublicHomeContent()).programs.map((item) => item.title), ['Current program']);
    assert.deepEqual((await readers.getPublicSponsors()).map((item) => item.name), ['Current sponsor']);

    preview = null;
    assert.equal((await readers.getPublicHomeContent()).sections.hero.title, 'Old hero');
    assert.equal((await readers.getCurrentEdition()).year, 2025);
  } finally { client.close(); }
});
