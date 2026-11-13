import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/app/voting/page.tsx', import.meta.url), 'utf8');
const start = source.indexOf('export default function VotingPage() {');
const setup = source.slice(start, source.indexOf('  return <main', start))
  .replace('export default function VotingPage()', 'function VotingPage()');
const createPage = new Function('getPublicVotingCategories', 'loadVotingBase', 'loadVotingDetails',
  `${setup} return { base, details }; } return VotingPage();`);

test('early voting detail failures remain handled and reach the eventual consumer', async () => {
  const failure = new Error('results unavailable');
  let releaseBase;
  const pendingBase = new Promise((resolve) => { releaseBase = resolve; });
  const page = createPage(() => Promise.resolve({ categories: [] }), () => pendingBase,
    async () => { throw failure; });
  // Let Node detect unhandled rejections before the Suspense consumer awaits details.
  await new Promise((resolve) => setImmediate(resolve));
  releaseBase({});
  await page.base;
  await assert.rejects(page.details, (error) => error === failure);
});

test('successful voting details retain their value', async () => {
  const details = [{ category: 'JD' }];
  const page = createPage(() => Promise.resolve({ categories: [] }), async () => ({}),
    async () => details);
  assert.equal(await page.details, details);
});
