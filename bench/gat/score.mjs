import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { atlasSatisfiesClass, canonicalFormat, canonicalTool } = require('../../lib/atlas-taxonomy.js');
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const heldOut = fileURLToPath(new URL('./heldout.json', import.meta.url));
const freeze = JSON.parse(readFileSync(new URL('./freeze.json', import.meta.url)));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const list = (value) => Array.isArray(value) ? value : [];
const asRef = (value) => typeof value === 'string' ? { id: value } : value;
const pattern = (alternatives) => new RegExp(alternatives.join('|'), 'i');
const normalize = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const textHas = (text, phrase) => {
  const words = normalize(phrase);
  return words.length > 0 && ` ${normalize(text)} `.includes(` ${words} `);
};

// Synced with lib/catalog-policy.js (SPDX freely redistributable with attribution; BSL-1.0 kept, BUSL-1.1 excluded).
const licenses = new Set([
  '0BSD', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'BSL-1.0', 'CC0-1.0',
  'CC-BY-4.0', 'ISC', 'MIT', 'MIT-0', 'Unlicense', 'Zlib',
]);
const blockedBudget = new Set([
  'adobe-after-effects', 'adobe-illustrator', 'adobe-indesign', 'adobe-photoshop', 'adobe-premiere-pro',
  'affinity-designer', 'final-cut-pro',
]);

function loadCatalog(root) {
  const read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  const federated = read('catalog/federated/snapshot.json').entries.filter((entry) => entry.status === 'approved');
  const skills = [...read('registry/skills.json').skills, ...federated].map((entry) => ({ ...entry, type: 'skill' }));
  const resources = read('registry/resources.json').resources.map((entry) => ({ ...entry, type: 'resource' }));
  return new Map([...skills, ...resources].map((entry) => [entry.id, entry]));
}

function loadCases(filename) {
  const bytes = readFileSync(filename);
  if (resolve(filename) === heldOut && digest(bytes) !== freeze.sha256) {
    throw new Error('Held-out fixture does not match its pre-run SHA-256.');
  }
  const { schema, cases } = JSON.parse(bytes);
  if (schema !== 1 || !Array.isArray(cases) || !cases.length) throw new Error('Unexpected fixture schema.');
  const ids = new Set();
  for (const { id, domain, brief, expected, evidence, gapTerms } of cases) {
    if (!id || ids.has(id) || !domain || typeof brief !== 'string' || !brief.trim() ||
        !['ready', 'partial', 'no_match', 'outside'].includes(expected) || !Array.isArray(evidence) ||
        (['ready', 'partial'].includes(expected) && !evidence.length) ||
        (['no_match', 'partial'].includes(expected) && !gapTerms?.length) ||
        evidence.some(({ label, ids, terms }) => !label || !ids?.length || !terms?.length)) {
      throw new Error('Invalid or duplicate fixture record.');
    }
    ids.add(id);
  }
  return { cases, sha256: digest(bytes) };
}

function references(kit, catalog) {
  const refs = [...list(kit.skills), ...list(kit.resources)].map(asRef).filter((ref) => typeof ref?.id === 'string');
  return refs.map(({ id }) => {
    const meta = catalog.get(id);
    const stageIds = (stage) => [...list(stage.skills), ...list(stage.resources), ...list(stage.references), ...list(stage.refs)]
      .map(asRef).map((ref) => ref?.id);
    const stages = list(kit.stages).filter((stage) => stageIds(stage).includes(id));
    const checks = stages.map((stage) => stage.check).filter(Boolean).join(' ');
    const description = [meta?.name, meta?.title, meta?.description, meta?.why, ...list(meta?.tags),
      ...list(meta?.tools), ...list(meta?.formats)].filter(Boolean).join(' ');
    return { id, meta, stages, checks, description };
  });
}

function accessVerified({ meta, stages }) {
  if (!meta || !stages.length) return false;
  if (meta.type === 'resource') return Boolean(meta.url && /^https:\/\//.test(meta.url));
  return licenses.has(meta.license) && (meta.status !== 'approved' ||
    Boolean(meta.upstream?.commit && meta.checksum && meta.licenseEvidence?.length && !meta.scan?.blocked));
}

function classHits(groups, refs, { adjudicate = false, test = null, catalog = null } = {}) {
  return groups.map((group) => {
    const { ids, terms, checks } = group;
    return refs.filter((item) => {
      const strict = ids.includes(item.id) && accessVerified(item) &&
        pattern(terms).test(item.description) && (!checks || pattern(checks).test(item.checks));
      if (strict) return true;
      return adjudicate && atlasSatisfiesClass(item, group, test, catalog, accessVerified);
    });
  });
}

function assess(test, kit, catalog, { adjudicate = false } = {}) {
  const refs = references(kit, catalog);
  const hits = classHits(test.evidence, refs, { adjudicate, test, catalog });
  const matched = hits.flat();
  const everythingCovered = hits.length > 0 && hits.every((items) => items.length > 0);
  const questions = Boolean(kit.question || kit.status === 'needs_clarification' || list(kit.questions).length);
  const gaps = list(kit.gaps).filter((gap) => typeof gap === 'string' ? gap.trim() : gap && Object.keys(gap).length);
  const gapText = gaps.map((gap) => typeof gap === 'string' ? gap : JSON.stringify(gap)).join(' ');
  const namedGaps = (test.gapTerms || []).every((alternatives) => pattern(alternatives).test(gapText));
  const {
    excludeIds = [], excludeMarkers = [], budget, requiredTools = [], requiredFormats = [],
  } = test.constraints || {};
  const actionIds = [...list(kit.workflows), ...list(kit.stages).map(({ id }) => id)];
  const violatesExcluded = refs.some(({ id }) => excludeIds.includes(id)) ||
    [...refs.map(({ id }) => id), ...actionIds].some((id) => excludeMarkers.some((marker) => textHas(id, marker)));
  const violatesBudget = budget === 'free' && refs.some(({ id, meta }) =>
    blockedBudget.has(id) || meta?.type === 'resource' && meta.pricing !== 'free');
  const ready = kit.status === 'ready';
  // Mandatory tool and format evidence has to come from a selected, accepted reference or its stage.
  const proves = (term) => matched.some(({ description, checks, id, meta }) =>
    [description, checks, id].some((candidate) => textHas(candidate, term)) ||
    (adjudicate && id.startsWith('federated/') && (
      list(meta?.tools).map(canonicalTool).includes(canonicalTool(term)) ||
      list(meta?.formats).map(canonicalFormat).includes(canonicalFormat(term))
    )));
  const missingHardEvidence = ready && [...requiredTools, ...requiredFormats].some((term) => !proves(term));
  const constraintsOk = !violatesExcluded && !violatesBudget && !missingHardEvidence;
  const usable = test.expected === 'ready' && ready && everythingCovered && !questions && gaps.length === 0 && constraintsOk;
  const empty = !refs.length && list(kit.stages).length === 0;
  const noMatch = kit.status === 'no_match' && empty && !questions && gaps.length > 0;
  const usefulPartial = kit.status === 'partial' && everythingCovered && !questions && gaps.length > 0;
  const fallback = namedGaps && constraintsOk &&
    (test.expected === 'partial' && usefulPartial || test.expected === 'no_match' && noMatch);

  return {
    usable,
    confidentWrong: ready && !usable,
    constraintsOk,
    fallback,
    outsideCorrect: test.expected === 'outside' && noMatch,
    unnecessaryQuestion: questions,
    federatedHit: usable && matched.some(({ id }) => id.startsWith('federated/')),
    bytes: Buffer.byteLength(JSON.stringify(kit)),
  };
}

const percent = (rows, predicate) => rows.length ? Number((100 * rows.filter(predicate).length / rows.length).toFixed(2)) : null;

function summarizeRows(rows, sha256) {
  const inScope = rows.filter(({ expected }) => expected !== 'outside');
  const outside = rows.filter(({ expected }) => expected === 'outside');
  const constrained = inScope.filter((row) => row.constrained);
  const fallback = inScope.filter(({ expected }) => expected === 'partial' || expected === 'no_match');
  const byDomain = Object.fromEntries([...new Set(inScope.map(({ domain }) => domain))].map((domain) => {
    const items = inScope.filter((row) => row.domain === domain);
    return [domain, { count: items.length, usablePct: percent(items, (row) => row.usable) }];
  }));

  return {
    sha256,
    inScope: inScope.length,
    outside: outside.length,
    constrained: constrained.length,
    fallbackExpected: fallback.length,
    usablePct: percent(inScope, (row) => row.usable),
    wrongPct: percent(inScope, (row) => row.confidentWrong),
    constraintPct: percent(constrained, (row) => row.constraintsOk),
    fallbackPct: percent(fallback, (row) => row.fallback),
    outsidePct: percent(outside, (row) => row.outsideCorrect),
    maxBytes: Math.max(...rows.map(({ bytes }) => bytes)),
    unnecessaryQuestionPct: percent(rows, (row) => row.unnecessaryQuestion),
    byDomain,
  };
}

export async function scoreSet(findKit, filename = heldOut, { root = repoRoot, adjudicate = false, includeAdjudicated = false } = {}) {
  const { cases, sha256 } = loadCases(filename);
  const catalog = loadCatalog(root);
  const rows = [];
  const adjudicatedRows = [];
  for (const test of cases) {
    let kit;
    try {
      kit = await findKit({ task: test.brief });
    } catch {
      throw new Error('Engine failed on a benchmark invocation. Inspect engine logs without printing brief text.');
    }
    if (!kit || typeof kit !== 'object' || typeof kit.status !== 'string') throw new Error('Engine did not return a kit manifest.');
    rows.push({
      domain: test.domain, expected: test.expected, constrained: Boolean(test.constraints), ...assess(test, kit, catalog, { adjudicate }),
    });
    if (includeAdjudicated) {
      adjudicatedRows.push({
        domain: test.domain, expected: test.expected, constrained: Boolean(test.constraints), ...assess(test, kit, catalog, { adjudicate: true }),
      });
    }
  }
  const summary = summarizeRows(rows, sha256);
  if (includeAdjudicated) {
    const adj = summarizeRows(adjudicatedRows, sha256);
    summary.adjudicated = {
      usablePct: adj.usablePct,
      wrongPct: adj.wrongPct,
      constraintPct: adj.constraintPct,
      fallbackPct: adj.fallbackPct,
      outsidePct: adj.outsidePct,
      unnecessaryQuestionPct: adj.unnecessaryQuestionPct,
      federatedMatchedCount: adjudicatedRows.filter((row) => row.federatedHit).length,
      byDomain: adj.byDomain,
    };
  }
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , ...args] = process.argv;
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!['--root', '--fixture'].includes(args[index]) || !args[index + 1]) {
      throw new Error('Usage: node bench/gat/score.mjs [--root /checkout] [--fixture /fixture.json]');
    }
    options[args[index].slice(2)] = resolve(args[index + 1]);
  }
  const root = options.root || repoRoot;
  // Keep approved local catalog entries while stopping accidental HTTP calls before they can transmit.
  globalThis.fetch = async () => { throw new Error('Network access is disabled during routing evaluation.'); };
  const { findKit } = require(resolve(root, 'lib/task-kit.js'));
  console.log(JSON.stringify(await scoreSet(findKit, options.fixture, { root }), null, 2));
}
