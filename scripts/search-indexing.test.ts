import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { delimiter, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import type { Metadata, MetadataRoute, NextConfig } from 'next';
import { getRedirectUrl, unstable_getResponseFromNextConfig } from 'next/experimental/testing/server';
import ts from 'typescript';

const origin = 'https://www.pamokagarut.com';

// Exercise the real route functions; replace only imports that need a request,
// CMS connection, or UI rendering. No database or network is used by these tests.
function loadRoute<T>(path: string, imports: Record<string, unknown> = {}): T {
  const compiled = ts.transpileModule(readFileSync(resolve(path), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const route = {};
  new Function('require', 'exports', compiled)((specifier: string) => imports[specifier] ?? {}, route);
  return route as T;
}

function sitemapFixture() {
  let previewId: string | null = null;
  let registrationVisible = true;
  let contentReads = 0;
  const rosters: Record<string, { participants: { slug: string }[] } | null> = {
    'finalis/jajaka-dewasa': { participants: [] },
    'semifinalis/jajaka-dewasa': { participants: [{ slug: 'nama-peserta' }] },
    'finalis/mojang-dewasa': null,
    'semifinalis/mojang-dewasa': { participants: [] },
  };
  const route = loadRoute<{ default: () => Promise<MetadataRoute.Sitemap> }>('src/app/sitemap.ts', {
    '@/env': { env: { BASE_URL: `${origin}/` } },
    '@/server/cms/preview': { getPreviewEditionId: async () => previewId },
    '@/server/cms/public-readers': {
      getPublicNavigation: async () => {
        contentReads += 1;
        return {
          registrationVisible,
          categories: [{ slug: 'jajaka-dewasa' }, { slug: 'mojang-dewasa' }],
          events: [{ slug: 'audisi' }],
        };
      },
      getPublicGalleryAlbums: async () => { contentReads += 1; return []; },
      getPublicNews: async () => {
        contentReads += 1;
        return [{ slug: 'kabar-resmi', isInternal: true }, { slug: 'sumber-luar', isInternal: false }];
      },
    },
    '@/server/cms/public-participant-readers': {
      getPublicParticipantCategory: async (slug: string, kind: string) => {
        contentReads += 1;
        return rosters[`${kind}/${slug}`];
      },
    },
  });
  return {
    read: route.default,
    rosters,
    setPreview: (value: string | null) => { previewId = value; },
    setRegistration: (value: boolean) => { registrationVisible = value; },
    contentReads: () => contentReads,
  };
}

test('sitemap includes published destinations and skips empty or missing participant lists', async () => {
  const fixture = sitemapFixture();
  const entries = await fixture.read();
  const paths = entries.map((entry) => new URL(entry.url).pathname);
  assert.deepEqual(paths.sort(), [
    '/', '/tentang', '/voting', '/galeri', '/berita', '/pendaftaran',
    '/rangkaian-kegiatan/audisi', '/berita/kabar-resmi',
    '/profil-semifinalis/jajaka-dewasa',
    '/profil-semifinalis/jajaka-dewasa/nama-peserta',
  ].sort());
  assert.ok(entries.every((entry) => new URL(entry.url).origin === origin));
  assert.ok(entries.every((entry) => entry.lastModified === undefined));
  assert.deepEqual(await fixture.read(), entries, 'Reading again does not invent content modification dates');
});

test('sitemap follows participant publication and registration visibility', async () => {
  const fixture = sitemapFixture();
  fixture.setRegistration(false);
  fixture.rosters['finalis/jajaka-dewasa'] = { participants: [{ slug: 'peserta baru' }] };
  const paths = (await fixture.read()).map((entry) => new URL(entry.url).pathname);
  assert.ok(!paths.includes('/pendaftaran'));
  assert.ok(paths.includes('/profil-finalis/jajaka-dewasa'));
  assert.ok(paths.includes('/profil-finalis/jajaka-dewasa/peserta%20baru'));
});

test('an authorized preview returns no sitemap URLs and does not read draft content', async () => {
  const fixture = sitemapFixture();
  fixture.setPreview('draft-edition');
  assert.deepEqual(await fixture.read(), []);
  assert.equal(fixture.contentReads(), 0);
  fixture.setPreview(null);
  assert.ok((await fixture.read()).length > 0);
});

type MetadataRouteModule = {
  metadata?: Metadata;
  generateMetadata?: (props: { params: Promise<Record<string, string>> }) => Promise<Metadata>;
};

test('Next resolves every public canonical and retains preview noindex through child metadata', async () => {
  let preview = false;
  const imports = {
    '@/env': { env: { BASE_URL: `${origin}/` } },
    react: { cache: (fn: unknown) => fn },
    '@/server/cms/preview': { getPreviewEditionId: async () => preview ? 'draft-edition' : null },
    '@/server/cms/brand-assets': { brandMetadata: () => ({ openGraph: {} }) },
    '@/server/cms/public-readers': {
      getPublicSiteIdentity: async () => ({ title: 'PAMOKA Garut', description: 'Situs resmi', assets: {} }),
      getPublicRegistration: async () => ({ sections: { hero: { title: 'Pendaftaran' } } }),
      getPublicVotingCampaign: async () => ({ name: 'Voting' }),
      getPublicEventSharingMetadata: async () => ({ openGraph: { images: [] } }),
      getPublicEventBySlug: async (slug: string) => ({ slug, label: `Kegiatan ${slug}`, desc: `Tentang ${slug}` }),
      getPublicNewsBySlug: async (slug: string) => ({ slug, kind: 'internal', title: 'Kabar resmi', excerpt: 'Berita kegiatan', coverUrl: null }),
    },
    '@/server/cms/public-participant-readers': {
      getPublicParticipantCategory: async (slug: string) => ({ slug, name: 'Jajaka Dewasa', editionYear: 2026, participants: [] }),
      getPublicParticipantBySlug: async (categorySlug: string, slug: string) => ({ slug, categorySlug, name: 'Nama Peserta', categoryName: 'Jajaka Dewasa', editionYear: 2026 }),
    },
  };
  const cases: { file: string; path: string; params?: Record<string, string>; layout?: string }[] = [
    { file: 'src/app/page.tsx', path: '/' },
    { file: 'src/app/tentang/page.tsx', path: '/tentang' },
    { file: 'src/app/galeri/page.tsx', path: '/galeri' },
    { file: 'src/app/pendaftaran/page.tsx', path: '/pendaftaran' },
    { file: 'src/app/berita/page.tsx', path: '/berita' },
    { file: 'src/app/berita/[slug]/page.tsx', path: '/berita/kabar-resmi', params: { slug: 'kabar-resmi' } },
    { file: 'src/app/voting/page.tsx', path: '/voting', layout: 'src/app/voting/layout.tsx' },
    { file: 'src/app/rangkaian-kegiatan/[event]/page.tsx', path: '/rangkaian-kegiatan/audisi', params: { event: 'audisi' }, layout: 'src/app/rangkaian-kegiatan/[event]/layout.tsx' },
  ];
  for (const kind of ['finalis', 'semifinalis']) {
    cases.push(
      { file: `src/app/profil-${kind}/[category]/page.tsx`, path: `/profil-${kind}/jajaka-dewasa`, params: { category: 'jajaka-dewasa' }, layout: `src/app/profil-${kind}/layout.tsx` },
      { file: `src/app/profil-${kind}/[category]/[name]/page.tsx`, path: `/profil-${kind}/jajaka-dewasa/nama-peserta`, params: { category: 'jajaka-dewasa', name: 'nama-peserta' }, layout: `src/app/profil-${kind}/layout.tsx` },
    );
  }
  const readMetadata = async (file: string, params: Record<string, string> = {}) => {
    const route = loadRoute<MetadataRouteModule>(file, imports);
    return route.generateMetadata ? route.generateMetadata({ params: Promise.resolve(params) }) : route.metadata ?? {};
  };
  const root = await readMetadata('src/app/layout.tsx');
  assert.equal(root.alternates?.canonical, undefined, 'The root layout must not canonicalize all pages to home');
  preview = true;
  const previewRoot = await readMetadata('src/app/layout.tsx');
  const fixtures = [];
  for (const item of cases) {
    const page = await readMetadata(item.file, item.params);
    const layout = item.layout ? await readMetadata(item.layout, item.params) : {};
    fixtures.push({ path: item.path, layers: [root, layout, page], expectedNoindex: false });
    fixtures.push({ path: item.path, layers: [previewRoot, layout, page], expectedNoindex: true });
  }
  const admin = await readMetadata('src/app/admin/layout.tsx');
  fixtures.push({ path: '/admin/login', layers: [root, admin], expectedNoindex: true });

  // Next aliases server-only to its compiled package in the server build.
  // Reproduce that alias in a separate Node process to test the actual resolver.
  const require = createRequire(import.meta.url);
  const nextRoot = dirname(require.resolve('next/package.json'));
  const program = `
    const assert = require('node:assert/strict');
    const { accumulateMetadata } = require('next/dist/lib/metadata/resolve-metadata');
    (async () => {
      for (const fixture of JSON.parse(process.argv[1])) {
        const metadata = await accumulateMetadata(fixture.path, fixture.layers.map(layer => [layer, null]), Promise.resolve(fixture.path), { trailingSlash: false, isStaticMetadataRouteFile: false });
        if (fixture.path === '/admin/login') {
          assert.equal(metadata.alternates?.canonical ?? null, null);
        } else {
          assert.equal(new URL(metadata.alternates.canonical.url).href, new URL(fixture.path, '${origin}').href);
        }
        assert.equal(metadata.robots?.basic?.includes('noindex') ?? false, fixture.expectedNoindex);
        if (fixture.expectedNoindex) assert.ok(metadata.robots.basic.includes('nofollow'));
      }
    })().catch(error => { console.error(error); process.exit(1); });
  `;
  execFileSync(process.execPath, ['--conditions=react-server', '-e', program, JSON.stringify(fixtures)], {
    cwd: resolve('.'),
    env: { ...process.env, NODE_PATH: [join(nextRoot, 'dist', 'compiled'), process.env.NODE_PATH].filter(Boolean).join(delimiter) },
    stdio: 'pipe',
  });
  const audisi = await readMetadata('src/app/rangkaian-kegiatan/[event]/page.tsx', { event: 'audisi' });
  const semifinal = await readMetadata('src/app/rangkaian-kegiatan/[event]/page.tsx', { event: 'semifinal' });
  assert.notEqual(audisi.title, semifinal.title);
  assert.notEqual(audisi.description, semifinal.description);
});

test('Next routes retired voting results with 308, preserving queries without a redirect loop', async () => {
  const { default: nextConfig } = loadRoute<{ default: NextConfig }>('next.config.ts');
  for (const path of ['/voting/hasil', '/voting/hasil/jajaka-dewasa?utm_source=audit']) {
    const response = await unstable_getResponseFromNextConfig({ url: origin + path, nextConfig });
    assert.equal(response.status, 308);
    const destination = getRedirectUrl(response);
    assert.ok(destination);
    assert.equal(new URL(destination).pathname, '/voting');
    assert.equal(new URL(destination).search, new URL(origin + path).search);
    const target = await unstable_getResponseFromNextConfig({ url: destination, nextConfig });
    assert.equal(getRedirectUrl(target), null);
  }
  for (const path of ['/admin/login', '/voting/hasil-lain']) {
    const response = await unstable_getResponseFromNextConfig({ url: origin + path, nextConfig });
    assert.equal(getRedirectUrl(response), null, 'The result redirect must not capture other routes');
  }
});
