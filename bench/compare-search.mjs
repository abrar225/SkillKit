import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { assess, loadFixtures, percentile } from './score.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const options = { options: {
  source: { type: 'string' },
  'held-out': { type: 'string' },
  out: { type: 'string' },
  tessl: { type: 'string' },
  'skillkit-url': { type: 'string' },
} };
const { values } = parseArgs(options);
const supported = ['skills-sh', 'skillsmp', 'tessl', 'rohitg00'];
if (!supported.includes(values.source)) throw new Error('Choose --source ' + supported.join(', '));
if (values['held-out'] && (values.source !== 'rohitg00' ||
    !/^http:\/\/127\.0\.0\.1:\d+\/?$/.test(values['skillkit-url'] || ''))) {
  throw new Error('The sealed fixture can only be sent to the verified offline loopback comparator.');
}
const frozen = JSON.parse(readFileSync(join(here, 'freeze.json'), 'utf8'));
const original = loadFixtures(join(here, 'fixtures/review.tsv'), frozen.fixtureDigests.review)
  .filter(({ id }) => id.startsWith('review-'));
const held = values['held-out'] ? loadFixtures(values['held-out'], frozen.fixtureDigests.heldOut) : [];
const { skills } = JSON.parse(readFileSync(join(here, '../registry/skills.json'), 'utf8'));
const canonical = new Map(skills.filter(({ upstream }) => upstream).map(({ upstream, id }) =>
  [upstream.repo.toLowerCase() + '/' + upstream.path.split('/').at(-1).toLowerCase(), id]));

function githubSource(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'github.com' ? parsed.pathname.split('/').slice(1, 3).join('/') : null;
  } catch {
    return null;
  }
}

function normalizeSkill({ id, name, source, url }) {
  const basename = String(name || '').toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(basename)) return null;
  const repo = source || githubSource(url);
  const equivalent = repo ? canonical.get(repo.toLowerCase() + '/' + basename) : null;
  return { id: equivalent || `external/${basename}`, name: basename,
    ...(id ? { remoteId: id } : {}), ...(repo ? { repo } : {}), ...(url ? { url } : {}) };
}

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { accept: 'application/json' } });
  const raw = await response.text();
  if (!response.ok) throw Error('HTTP ' + response.status);
  return { bytes: Buffer.byteLength(raw), data: JSON.parse(raw) };
}

async function search(source, brief) {
  const q = new URLSearchParams({ q: brief });
  let result;
  if (source === 'skills-sh') {
    result = await get('https://skills.sh/api/search?' + q);
    return { bytes: result.bytes, results: result.data.skills?.slice(0, 3).map((entry) => normalizeSkill({
      ...entry, name: entry.skillId || entry.name, url: 'https://skills.sh/' + entry.id,
    })) };
  }
  if (source === 'skillsmp') {
    q.set('limit', '3');
    result = await get('https://skillsmp.com/api/v1/skills/search?' + q);
    return { bytes: result.bytes, results: result.data.data?.skills?.slice(0, 3).map((entry) => normalizeSkill({
      ...entry, url: entry.githubUrl || entry.skillUrl,
    })) };
  }
  if (source === 'tessl') {
    if (!values.tessl) throw Error('Supply an absolute --tessl CLI path.');
    const run = promisify(execFile);
    const { stdout } = await run(values.tessl, ['search', '--type', 'skills', '--json', brief], { timeout: 20000 });
    const parsed = JSON.parse(stdout);
    const entries = Array.isArray(parsed) ? parsed : parsed.results;
    return { bytes: Buffer.byteLength(stdout), results: entries?.slice(0, 3).map((entry) => normalizeSkill({
      name: entry.name?.split('/').at(-1), id: entry.name, url: entry.sourceUrl || entry.url,
    })) };
  }
  if (!values['skillkit-url']) throw Error('Supply an absolute --skillkit-url for the local official REST server.');
  q.set('limit', '3');
  result = await get(new URL('/search?' + q, values['skillkit-url']));
  return { bytes: result.bytes, results: result.data.skills?.slice(0, 3).map((entry) => normalizeSkill({
    name: entry.name, id: entry.id, url: entry.githubUrl || entry.url,
    source: typeof entry.source === 'string' ? entry.source : undefined,
  })) };
}

const records = [];
// SkillsMP allows 50 anonymous keyword requests per day and at most 10 per minute.
const selected = [...original, ...held];
for (const [index, fixture] of selected.entries()) {
  if (values.source === 'skillsmp' && index) await setTimeout(6500);
  const start = performance.now();
  try {
    const { bytes, results } = await search(values.source, fixture.task);
    if (!Array.isArray(results)) throw Error('Unexpected search result shape');
    const entries = results.filter(Boolean);
    const match = assess(fixture, { status: 'no_match', skills: entries }, new Map());
    records.push({ id: fixture.id, results: entries, allComponents: match.allComponents, bytes, ms: performance.now() - start });
  } catch (error) {
    records.push({ id: fixture.id, error: error.message });
    if (/HTTP 429|Unexpected search result shape|Supply an absolute/.test(error.message)) break;
  }
}

function summary(prefix, eligible) {
  const filtered = records.filter(({ id }) => id.startsWith(prefix));
  const done = filtered.filter((record) => !record.error);
  return { eligible, attempted: filtered.length, responses: done.length,
    anyResults: done.filter(({ results }) => results.length).length,
    allComponentsTop3Metadata: done.filter(({ allComponents }) => allComponents).length,
    responseBytesP50: percentile(done.map(({ bytes }) => bytes), 50),
    elapsedMsP50: percentile(done.map(({ ms }) => ms), 50),
    errors: [...new Set(filtered.filter((record) => record.error).map(({ error }) => error))],
  };
}
const output = {
  source: values.source,
  fixtureDigests: { review: frozen.fixtureDigests.review, heldOut: frozen.fixtureDigests.heldOut },
  originalReview: summary('review', original.length),
  heldOut: summary('hold', held.length),
  // Keep individual held-out evidence private while the candidate is under development.
  publicCases: records.filter(({ id }) => id.startsWith('review-')),
};
if (values.out) writeFileSync(values.out, JSON.stringify(output, null, 2) + '\n');
else console.log(JSON.stringify(output, null, 2));
