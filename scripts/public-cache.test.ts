import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { readFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { createClient } from '@libsql/client/node';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import ts from 'typescript';
import * as schema from '../src/server/db/schema';
import { publicPrefetch } from '../src/lib/public-prefetch';

const requireModule = createRequire(import.meta.url);
Object.defineProperty(globalThis, 'AsyncLocalStorage', { value: AsyncLocalStorage, configurable: true });

test('public links prefetch fully except voting and preview', () => {
  assert.equal(publicPrefetch('/', true), true);
  assert.equal(publicPrefetch('/pendaftaran', true), true);
  assert.equal(publicPrefetch('/voting', true), null);
  assert.equal(publicPrefetch('/voting/jd?x=1', true), null);
  assert.equal(publicPrefetch('/admin', true), false);
  assert.equal(publicPrefetch('https://example.com', true), false);
  assert.equal(publicPrefetch('/', false), false);
  assert.equal(publicPrefetch('/voting', false), false);
});

function loadSource<T>(path: string, mocks: Record<string, unknown>): T {
  const source = ts.transpileModule(readFileSync(resolve(path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', source)((name: string) => {
    if (name in mocks) return mocks[name];
    return requireModule(name.startsWith('@/') ? resolve('src', name.slice(2)) : name);
  }, exports);
  return exports as T;
}

test('published reads share cache, preview bypasses it, and invalidation refreshes every reader', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'moka-public-cache-'));
  const client = createClient({ url: `file:${join(directory, 'test.db')}` });
  const db = drizzle(client, { schema });
  const previousIncrementalCache = Reflect.get(globalThis, '__incrementalCache');
  try {
    await migrate(db, { migrationsFolder: resolve('drizzle') });
    await db.insert(schema.editions).values([
      { id: 'current', year: 2026, slug: 'current', name: 'Current', lifecycle: 'active' },
      { id: 'draft', year: 2027, slug: 'draft', name: 'Draft', lifecycle: 'draft' },
    ]);
    await db.insert(schema.pageSections).values([
      { id: 'home-current', editionId: 'current', pageKey: 'home', sectionKey: 'hero', title: 'Published', status: 'published' },
      { id: 'home-draft', editionId: 'draft', pageKey: 'home', sectionKey: 'hero', title: 'Private draft', status: 'draft' },
    ]);
    await db.insert(schema.newsArticles).values({ id: 'article', editionId: 'current', slug: 'article', title: 'News', status: 'published', publishedAt: new Date('2026-01-01T00:00:00Z') });
    await db.insert(schema.categories).values({ id: 'category', editionId: 'current', code: 'JD', slug: 'jd', label: 'JD' });
    await db.insert(schema.selectionStages).values({ id: 'stage', editionId: 'current', name: 'Semifinal', slug: 'semifinal', lifecycle: 'active' });
    await db.insert(schema.participants).values({ id: 'person', editionId: 'current', categoryId: 'category', stage: 'semifinalis', number: 1, name: 'First', slug: 'first' });
    await db.insert(schema.participantStageEntries).values({ participantId: 'person', stageId: 'stage' });
    await db.insert(schema.votingCampaigns).values({ id: 'campaign', editionId: 'current', name: 'Voting', slug: 'voting', startsAt: new Date('2026-01-01T00:00:00Z'), endsAt: new Date('2026-12-31T00:00:00Z'), status: 'active', resultVisibility: 'visible' });
    await db.insert(schema.votingCampaignParticipants).values({ campaignId: 'campaign', participantId: 'person' });
    await db.insert(schema.voteDailyTallies).values({ id: 'tally', campaignId: 'campaign', participantId: 'person', localDate: '2026-11-17', amount: 1000 });

    let preview: string | null = null;
    const values = new Map<string, unknown>();
    const tags = new Map<string, string[]>();
    const invalidatedPaths: unknown[][] = [];
    const incrementalCache = {
      generateSimpleCacheKey: async (key: string) => key,
      get: async (key: string) => values.has(key) ? { value: values.get(key), isStale: false } : null,
      set: async (key: string, value: unknown, context: { tags: string[] }) => {
        values.set(key, value);
        tags.set(key, context.tags);
      },
    };
    Reflect.set(globalThis, '__incrementalCache', incrementalCache);
    const { workAsyncStorage } = requireModule('next/dist/server/app-render/work-async-storage.external');
    const { workUnitAsyncStorage } = requireModule('next/dist/server/app-render/work-unit-async-storage.external');
    async function request<T>(read: () => Promise<T>): Promise<T> {
      const store = { page: '/', route: '/', incrementalCache, isStaticGeneration: false, isDraftMode: false, pendingRevalidates: {} as Record<string, Promise<unknown>> };
      const result: T = await workAsyncStorage.run(store, () => workUnitAsyncStorage.run({ type: 'request', phase: 'render', url: { pathname: '/', search: '' } }, read));
      await Promise.all(Object.values(store.pendingRevalidates));
      return result;
    }
    const nextCache = {
      unstable_cache: requireModule('next/cache').unstable_cache,
      updateTag: (tag: string) => {
        for (const [key, entryTags] of tags) if (entryTags.includes(tag)) values.delete(key);
      },
      revalidatePath: (...args: unknown[]) => invalidatedPaths.push(args),
    };
    const publicCache = loadSource<{ revalidatePath: (...args: unknown[]) => void; PUBLIC_CONTENT_TAG: string; PUBLIC_CONTENT_SCOPE: string; PUBLIC_CONTENT_REVALIDATE: number }>('src/server/cms/public-cache.ts', {
      'next/cache': nextCache,
      '@/env': { env: { TURSO_DATABASE_URL: 'file:fixture' } },
    });
    const otherCache = loadSource<typeof publicCache>('src/server/cms/public-cache.ts', {
      'next/cache': nextCache,
      '@/env': { env: { TURSO_DATABASE_URL: 'file:other' } },
    });
    assert.notEqual(publicCache.PUBLIC_CONTENT_SCOPE, otherCache.PUBLIC_CONTENT_SCOPE);
    assert.notEqual(publicCache.PUBLIC_CONTENT_TAG, otherCache.PUBLIC_CONTENT_TAG);
    const mocks = {
      'next/cache': nextCache,
      'next/server': { connection: async () => {} },
      react: { cache: (fn: unknown) => fn },
      '@/server/db/client': { database: db },
      '@/server/cms/preview': { getPreviewEditionId: async () => preview },
      '@/server/cms/public-cache': publicCache,
    };
    const readers = loadSource<typeof import('../src/server/cms/public-readers')>('src/server/cms/public-readers.ts', mocks);
    const participants = loadSource<typeof import('../src/server/cms/public-participant-readers')>('src/server/cms/public-participant-readers.ts', { ...mocks, '@/server/cms/public-readers': readers });

    assert.equal((await request(() => readers.getPublicHomeContent())).sections.hero.title, 'Published');
    assert.equal((await request(() => participants.getPublicParticipantCategory('jd', 'semifinalis')))?.participants[0]?.name, 'First');
    assert.ok((await request(() => readers.getPublicNews()))[0].date instanceof Date);
    assert.ok((await request(() => readers.getPublicNews()))[0].date instanceof Date);
    assert.ok((await request(() => readers.getPublicNewsBySlug('article')))?.publishedAt instanceof Date);
    assert.ok((await request(() => readers.getPublicNewsBySlug('article')))?.publishedAt instanceof Date);

    await db.update(schema.pageSections).set({ title: 'Changed' }).where(eq(schema.pageSections.id, 'home-current'));
    await db.update(schema.participants).set({ name: 'Second' }).where(eq(schema.participants.id, 'person'));
    await db.update(schema.newsArticles).set({ title: 'Updated news' }).where(eq(schema.newsArticles.id, 'article'));
    assert.equal((await request(() => readers.getPublicHomeContent())).sections.hero.title, 'Published');
    assert.equal((await request(() => participants.getPublicParticipantCategory('jd', 'semifinalis')))?.participants[0]?.name, 'First');
    assert.equal((await request(() => readers.getPublicNews()))[0].title, 'News');
    assert.equal((await request(() => readers.getPublicVotingResults('jd')))?.totalAmount, 1000);
    await db.update(schema.voteDailyTallies).set({ amount: 2000 }).where(eq(schema.voteDailyTallies.id, 'tally'));
    assert.equal((await request(() => readers.getPublicVotingResults('jd')))?.totalAmount, 2000);
    await db.update(schema.votingCampaigns).set({ resultVisibility: 'hidden' }).where(eq(schema.votingCampaigns.id, 'campaign'));
    assert.equal((await request(() => readers.getPublicVotingResults('jd')))?.visible, false);

    preview = 'draft';
    assert.equal((await request(() => readers.getPublicHomeContent())).sections.hero.title, 'Private draft');
    await db.update(schema.pageSections).set({ title: 'New draft' }).where(eq(schema.pageSections.id, 'home-draft'));
    assert.equal((await request(() => readers.getPublicHomeContent())).sections.hero.title, 'New draft');
    preview = null;
    assert.equal((await request(() => readers.getPublicHomeContent())).sections.hero.title, 'Published');

    publicCache.revalidatePath('/admin/content/pages');
    assert.deepEqual(invalidatedPaths, [['/admin/content/pages']]);
    assert.equal((await request(() => readers.getPublicHomeContent())).sections.hero.title, 'Changed');
    assert.equal((await request(() => participants.getPublicParticipantCategory('jd', 'semifinalis')))?.participants[0]?.name, 'Second');
    assert.equal((await request(() => readers.getPublicNews()))[0].title, 'Updated news');
    assert.equal((await request(() => readers.getPublicNewsBySlug('article')))?.title, 'Updated news');

    await db.update(schema.editions).set({ lifecycle: 'archived' }).where(eq(schema.editions.id, 'current'));
    await db.update(schema.editions).set({ lifecycle: 'active' }).where(eq(schema.editions.id, 'draft'));
    assert.equal((await request(() => readers.getCurrentEdition())).id, 'current');
    publicCache.revalidatePath('/', 'layout');
    assert.equal((await request(() => readers.getCurrentEdition())).id, 'draft');
  } finally {
    Reflect.set(globalThis, '__incrementalCache', previousIncrementalCache);
    client.close();
  }
});

test('about hero streams before slow organization data', async () => {
  let release!: (value: unknown) => void;
  const pendingAbout = new Promise((resolve) => { release = resolve; });
  const intro = { sections: { hero: { title: 'Fast intro', body: 'Visible text' }, organisasi: { title: 'Organization' } }, assets: {} };
  const container = ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children);
  const page = loadSource<{ default: () => React.ReactNode }>('src/app/tentang/page.tsx', {
    'next/image': { __esModule: true, default: () => null },
    'next/link': { __esModule: true, default: container },
    '@/components/custom/section': { Section: container },
    '@/components/custom/button': { Button: container },
    '@/components/custom/typography': { typography: { h1: container, p: container } },
    '@/server/cms/registration': { registrationRows: () => [] },
    '@/server/cms/public-readers': {
      getPublicAboutIntro: async () => intro,
      getPublicAboutContent: () => pendingAbout,
      getPublicSiteIdentity: async () => ({ contacts: [] }),
      getPublicHomeContent: async () => ({ sections: {} }),
    },
  });
  const stream = await renderToReadableStream(React.createElement(page.default));
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let received = '';
  while (!received.includes('Fast intro')) {
    const next = await reader.read();
    assert.equal(next.done, false);
    received += decoder.decode(next.value, { stream: true });
  }
  assert.match(received, /Visible text/);
  assert.doesNotMatch(received, />Organization</);
  release({ ...intro, vision: null, mission: [], legalDocument: null, organizationPeriodLabel: null, pengurus: [], history: [], galleries: [] });
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    received += decoder.decode(next.value, { stream: true });
  }
  assert.match(received, />Organization</);
});

test('Next server action records immediate tag invalidation and preserves path invalidation', () => {
  const { workAsyncStorage } = requireModule('next/dist/server/app-render/work-async-storage.external');
  const { workUnitAsyncStorage } = requireModule('next/dist/server/app-render/work-unit-async-storage.external');
  const publicCache = loadSource<{ revalidatePath: (path: string) => void; PUBLIC_CONTENT_TAG: string }>('src/server/cms/public-cache.ts', {
    '@/env': { env: { TURSO_DATABASE_URL: 'file:framework-fixture' } },
  });
  const store = { page: '/admin/content/pages', route: '/admin/content/pages', incrementalCache: {}, cacheLifeProfiles: {}, pendingRevalidatedTags: [] as { tag: string; profile?: unknown }[] };
  workAsyncStorage.run(store, () => workUnitAsyncStorage.run({ type: 'request', phase: 'action' }, () => publicCache.revalidatePath('/admin/content/pages')));
  assert.ok(store.pendingRevalidatedTags.some((item) => item.tag === publicCache.PUBLIC_CONTENT_TAG && item.profile === undefined));
  assert.ok(store.pendingRevalidatedTags.some((item) => item.tag.includes('/admin/content/pages')));
});

test('saving a page draft keeps the public cache while publishing invalidates it', async () => {
  const adminPaths: unknown[][] = [];
  const publicPaths: unknown[][] = [];
  const actions = loadSource<typeof import('../src/app/admin/content/pages/actions')>('src/app/admin/content/pages/actions.ts', {
    'next/cache': { revalidatePath: (...args: unknown[]) => adminPaths.push(args) },
    '@/server/cms/public-cache': { revalidatePath: (...args: unknown[]) => publicPaths.push(args) },
    '@/server/auth/authorization': { requirePermission: async () => ({ session: { user: { id: 'actor', email: 'admin@example.com' } } }) },
    '@/server/cms/context': { getAdminEditionContext: async () => ({ id: 'current' }) },
    '@/server/cms/page-sections': { PageSectionValidationError: class extends Error {}, savePageSectionDraft: async () => ({ version: 1 }), publishPageSection: async () => ({ version: 2 }) },
  });
  await actions.savePageSectionDraftAction({ expectedEditionId: 'current', slotKey: 'home/hero', expectedVersion: null, patch: {} });
  assert.deepEqual(adminPaths, [['/admin/content/pages']]);
  assert.equal(publicPaths.length, 0);
  await actions.publishPageSectionAction({ expectedEditionId: 'current', slotKey: 'home/hero' });
  assert.ok(publicPaths.some(([path]) => path === '/'));
});
