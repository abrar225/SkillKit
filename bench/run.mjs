import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { performance } from 'node:perf_hooks';
import { assess, digest, loadFixtures, summarize } from './score.mjs';

const home = dirname(fileURLToPath(import.meta.url));
const { values } = parseArgs({ options: {
  root: { type: 'string', default: resolve(home, '..') },
  'held-out': { type: 'string', default: join(home, 'fixtures/held-out.tsv') },
  'public-only': { type: 'boolean' },
  out: { type: 'string' },
  detail: { type: 'boolean' },
  compare: { type: 'string' },
  enforce: { type: 'boolean' },
} });
const root = resolve(values.root);
const require = createRequire(join(root, 'package.json'));
const { findKit } = require('./lib/task-kit.js');
const { readEntry } = require('./lib/kit-reader.js');
const { skills } = require('./registry/skills.json');
const { resources } = require('./registry/resources.json');
const frozen = JSON.parse(readFileSync(join(home, 'freeze.json'), 'utf8'));
const catalog = new Map([...skills, ...resources].map((entry) => [entry.id, entry]));

function load(name, path) {
  return loadFixtures(path || join(home, `fixtures/${name}.tsv`), frozen.fixtureDigests[name]);
}
const review = load('review');
const development = load('development');
const heldOut = values['public-only'] ? [] : load('heldOut', values['held-out']);
const fixtures = [...review, ...development, ...heldOut];
if (new Set(fixtures.map(({ id }) => id)).size !== fixtures.length || review.length !== 14 || development.length !== 66 ||
    heldOut.length !== (values['public-only'] ? 0 : 40)) throw new Error('Unexpected fixture counts or duplicated IDs.');
if ((values.enforce || values.compare) && !heldOut.length) throw new Error('This comparison requires the frozen holdout.');

async function run(gold) {
  const start = performance.now();
  const kit = await findKit({ task: gold.task });
  const json = JSON.stringify(kit);
  const responseAt = performance.now();
  const score = assess(gold, kit, catalog);
  const ids = (entries = []) => entries.map((entry) => typeof entry === 'string' ? entry : entry.id);
  const fastResource = ids(kit.resources).some((id) => score.approvedIds.has(id));
  const ordered = [...new Set([...(kit.stages || []).flatMap((stage) => ids(stage.skills)), ...ids(kit.skills)])];
  let firstUsableSkillMs = null;
  for (const id of ordered) {
    if (!score.approvedIds.has(id)) continue;
    try {
      const entry = await readEntry(root, id);
      if (entry.instructions?.trim() && !entry.metadataOnly) {
        firstUsableSkillMs = performance.now() - start;
        break;
      }
    } catch (error) {
      // Unknown or intentionally unavailable deliveries are coverage without a measurable skill read.
      if (error.code && error.code !== 'ENOENT') throw error;
    }
  }
  const bytes = Buffer.byteLength(json);
  return { gold, ...score, bytes, estimatedTokens: Math.ceil(bytes / 4),
    firstUsableSkillMs, firstUsableReferenceMs: fastResource ? responseAt - start : firstUsableSkillMs, responseDigest: digest(json) };
}

const engineFiles = ['lib/task-kit.js', 'lib/task-router.js', 'lib/kit-reader.js', 'workflows/routes.json',
  'registry/skills.json', 'registry/resources.json'];
const sourceDigests = Object.fromEntries(engineFiles.filter((path) => existsSync(join(root, path)))
  .map((path) => [path, digest(readFileSync(join(root, path)))]));
const results = [];
for (const fixture of fixtures) results.push(await run(fixture));

const byPrefix = (prefix) => results.filter(({ gold }) => gold.id.startsWith(prefix));
const snapshot = {
  schemaVersion: 1,
  node: process.version,
  sourceDigests,
  fixtureDigests: frozen.fixtureDigests,
  groups: {
    all: summarize(results),
    originalReview: summarize(byPrefix('review-')),
    regressionVariants: summarize(byPrefix('regression-')),
    development: summarize(byPrefix('dev-')),
    ...(heldOut.length ? { heldOut: summarize(byPrefix('hold-')) } : {}),
  },
  permanentRegressionChecks: results.filter(({ gold }) => /^(review-0[56]|regression-0[12])$/.test(gold.id))
    .map(({ gold, status, regressionPass, usable }) => ({ id: gold.id, status, regressionPass, usable })),
};

if (values.detail) snapshot.publicCases = results.filter(({ gold }) => !gold.id.startsWith('hold-')).map((row) => ({
  id: row.gold.id, status: row.status, question: row.question, usable: row.usable, confidentWrong: row.confidentWrong,
  adherence: row.adherence, stateCorrect: row.stateCorrect, approvedIds: [...row.approvedIds], misses: row.misses,
  conflicts: row.conflicts, responseDigest: row.responseDigest, bytes: row.bytes,
}));
if (values.compare) {
  const baseline = JSON.parse(readFileSync(values.compare, 'utf8'));
  if (JSON.stringify(baseline.fixtureDigests) !== JSON.stringify(snapshot.fixtureDigests)) {
    throw new Error('The comparison must use the same fixture digests.');
  }
  snapshot.baseline = baseline.groups;
}
if (values.out) writeFileSync(values.out, JSON.stringify(snapshot, null, 2) + '\n');
else console.log(JSON.stringify(snapshot, null, 2));

if (values.enforce) {
  const held = snapshot.groups.heldOut;
  const failures = [
    held.confidentWrong.percent >= 2 && 'held-out confident-wrong rate must be below 2%',
    held.constraintAdherence.percent < 95 && 'held-out constraint adherence must be at least 95%',
    held.firstResponseBytes.p50 >= 2048 && 'typical held-out first response must be below 2 KiB',
    snapshot.permanentRegressionChecks.some((row) => !row.regressionPass) && 'permanent review regression',
  ].filter(Boolean);
  if (failures.length) {
    console.error('Routing acceptance failed: ' + failures.join(', '));
    process.exitCode = 1;
  }
}
