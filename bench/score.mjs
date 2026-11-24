import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const digest = (value) => createHash('sha256').update(value).digest('hex');

const schema = 'id|domain|brief|deliverable|format|requiredTools|forbidden|budget|confidence|question|components';
const split = (text, separator = ',') => text ? text.split(separator).map((part) => part.trim()) : [];

export function loadFixtures(path, expectedDigest) {
  const raw = readFileSync(path);
  if (digest(raw) !== expectedDigest) throw new Error('Fixture digest changed: ' + path);
  const [header, ...rows] = raw.toString().trimEnd().split('\n');
  if (header !== schema) throw new Error('Unexpected fixture schema: ' + path);
  return rows.map((row) => {
    const fields = row.split('|');
    const [id, domain, task, deliverable, format, requiredTools, forbidden, budget, confidence, question, components] = fields;
    if (fields.length !== 11 || !id || !domain || !task || !deliverable || !format ||
        !['no', 'yes'].includes(question) || !['', 'ready', 'partial', 'no_match'].includes(confidence)) {
      throw new Error('Invalid gold row: ' + id);
    }
    const groups = split(components, ';').map((component) => {
      const [label, alternatives] = component.split('=');
      if (!label || !alternatives) throw new Error('Invalid component for ' + id + ': ' + component);
      return { label, alternatives: split(alternatives) };
    });
    if (!groups.length && question !== 'yes') throw new Error('Missing component labels for ' + id);
    return { id, domain, task, deliverable, format, requiredTools: split(requiredTools),
      forbidden: split(forbidden), budget, confidence: confidence || 'ready', question: question === 'yes', groups };
  });
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function idMatches(id, selector) {
  return selector.startsWith('@') ? id.split('/').at(-1) === selector.slice(1) : id === selector;
}

const incompatibleTools = {
  'adobe-after-effects': ['after-effects', 'extendscript'],
  'adobe-premiere-pro': ['premiere-pro', 'premiere-pro-multicam'],
  'davinci-resolve': ['davinci-resolve', 'resolve-workflows', 'resolve-color-grading', 'blackmagic-resolve'],
  'final-cut-pro': ['final-cut-pro', 'fcpxml', 'fcp-workflows'],
  'tailwind-css': ['tailwindcss', 'tailwind-css'],
  'next-js': ['nextjs', 'next-js'],
  'react': ['react', 'react-native', 'remotion', 'remotion-best-practices', 'vercel-react-best-practices',
    'vercel-composition-patterns', 'react-view-transitions', 'composition-patterns', 'vercel-agent-skills', 'shadcn-ui'],
  'source-implementation': ['implement', 'implement-spec', 'incremental-implementation', 'generate-code', 'new-web-project'],
  'web-implementation': ['frontend-ui-engineering', 'web-artifacts-builder', 'new-web-project'],
  'video-editing': ['ffmpeg', 'ffmpeg-video-edit', 'video-edit', 'hyperframes', 'remotion', 'premiere-pro', 'davinci-resolve'],
  'auto-publishing': ['instagram-autoposting', 'linkedin-autoposting', 'x-autoposting', 'social-media-autoposting'],
  'contact-lookup': ['find-leads', 'enrich-lead', 'business-contact-research'],
  'cloud-upload': ['bigquery', 'cloud-storage'],
  'deployment': ['deploy', 'deploy-with-vercel', 'release-deployment'],
  'production-deployment': ['deploy-production', 'production-release'],
};

const nonTool = new Set(['source-implementation', 'web-implementation', 'video-editing', 'auto-publishing', 'contact-lookup',
  'cloud-upload', 'deployment', 'production-deployment', 're-encoding', 'paid-assets', 'paid-services']);

function knownFeatures(kit, catalog) {
  const entries = (references = [], kind) => references.map((reference) => {
    const item = typeof reference === 'string' ? { id: reference } : reference;
    if (typeof item.id !== 'string') throw new Error('Manifest reference is missing an ID.');
    return { ...catalog.get(item.id), ...item, kind };
  });
  return [...entries(kit.skills, 'skill'), ...entries(kit.resources, 'resource')];
}

export function assess(test, kit, catalog) {
  const items = knownFeatures(kit, catalog);
  const matched = test.groups.map((group) => items.filter(({ id }) => group.alternatives.some((alt) => idMatches(id, alt))));
  const approvedIds = new Set(matched.flat().map(({ id }) => id));
  const allComponents = matched.length > 0 && matched.every((items) => items.length);
  const promisedCoverage = matched.filter((items) => items.length).length;
  const question = Boolean(kit.question || kit.status === 'needs_clarification');
  const status = { catalog_matches: 'partial', no_applicable_stages: 'no_match', needs_clarification: 'no_match' }[kit.status] || kit.status;
  if (!['ready', 'partial', 'no_match'].includes(status)) throw new Error('Unexpected confidence state: ' + kit.status);

  // A stage's workflow ID can represent a prohibited action when its skills are otherwise generic.
  const signs = new Set([...items.map(({ id }) => slug(id.split('/').at(-1))),
    ...items.flatMap((item) => Array.isArray(item.tools) ? item.tools.map(slug) : []),
    ...(kit.workflows || []).map(slug),
    ...(kit.stages || []).map(({ id }) => slug(id))]);
  const conflicts = test.forbidden.filter((condition) => {
    const label = slug(condition);
    return (incompatibleTools[label] || [label]).some((marker) => signs.has(marker));
  });
  const paid = test.budget === 'free' && items.some(({ kind, pricing, freePath }) =>
    (kind === 'resource' || pricing !== undefined) && slug(pricing || 'unknown') !== 'free' && freePath !== true);
  const toolViolation = conflicts.some((condition) => !nonTool.has(slug(condition)));
  const formatViolation = conflicts.some((condition) => nonTool.has(slug(condition)));
  const anyViolation = toolViolation || formatViolation || paid;
  // Absence in a fallback is a coverage miss, not a recommendation of a forbidden tool or action.
  const requiredToolMiss = (status === 'ready' || items.length > 0 && status === 'partial') &&
    Boolean(test.requiredTools.length && promisedCoverage === 0);
  const readyFormatMiss = status === 'ready' && !allComponents && !test.question;
  const adherence = !anyViolation && !requiredToolMiss && !readyFormatMiss;
  const usable = status === 'ready' && !question && !test.question && allComponents && !anyViolation;
  const confidentWrong = status === 'ready' && !usable;
  const gaps = Array.isArray(kit.gaps) ? kit.gaps : [];
  const gapCount = gaps.filter((gap) => typeof gap === 'string' ? gap.trim() :
    gap && Object.values(gap).some((value) => typeof value === 'string' && value.trim())).length;
  const acceptableNoMatch = status === 'no_match' && !promisedCoverage && !items.length && !anyViolation;
  const acceptablePartial = status === 'partial' && promisedCoverage > 0 && !allComponents && !anyViolation &&
    gapCount >= matched.length - promisedCoverage;
  const stateCorrect = test.question ? question && status !== 'ready' && !items.length :
    usable || (!question && (test.confidence === 'no_match' && acceptableNoMatch ||
      test.confidence === 'partial' && acceptablePartial));
  // Permanent regressions permit an honest abstention when the catalog cannot meet the brief.
  const regressionPass = usable || !question && (acceptableNoMatch || acceptablePartial);
  return { status, question, approvedIds, promisedCoverage, allComponents, usable, confidentWrong, adherence,
    toolViolation: toolViolation || requiredToolMiss, formatViolation: formatViolation || readyFormatMiss,
    budgetViolation: paid, stateCorrect, correctFallback: !question && (test.confidence === 'no_match' && acceptableNoMatch ||
      test.confidence === 'partial' && acceptablePartial), unnecessaryQuestion: question && !test.question, regressionPass,
    misses: test.groups.filter((_, index) => matched[index].length === 0).map(({ label }) => label), conflicts,
  };
}

export function percentile(values, percent) {
  if (!values.length) return null;
  const ordered = values.slice().sort((a, b) => a - b);
  return Number(ordered[Math.ceil((percent / 100) * ordered.length) - 1].toFixed(3));
}

function rate(rows, predicate) {
  const count = rows.filter(predicate).length;
  return { count, total: rows.length, percent: rows.length ? Number((100 * count / rows.length).toFixed(2)) : null };
}

export function summarize(rows) {
  const samples = (key) => rows.map((row) => row[key]).filter(Number.isFinite);
  const distribution = (key) => ({ samples: samples(key).length,
    p50: percentile(samples(key), 50), p95: percentile(samples(key), 95), max: percentile(samples(key), 100) });
  const expectedFallback = rows.filter(({ gold }) => !gold.question && gold.confidence !== 'ready');
  return {
    briefs: rows.length,
    usableKit: rate(rows, (row) => row.usable),
    confidentWrong: rate(rows, (row) => row.confidentWrong),
    constraintAdherence: rate(rows, (row) => row.adherence),
    toolAdherence: rate(rows.filter(({ gold }) => gold.requiredTools.length ||
      gold.forbidden.some((condition) => !nonTool.has(slug(condition)))), (row) => !row.toolViolation),
    budgetAdherence: rate(rows.filter(({ gold }) => gold.budget === 'free'), (row) => !row.budgetViolation),
    formatAdherence: rate(rows, (row) => !row.formatViolation),
    correctConfidence: rate(rows, (row) => row.stateCorrect),
    correctNoMatchOrPartial: rate(expectedFallback, (row) => row.correctFallback),
    unnecessaryQuestion: rate(rows.filter(({ gold }) => !gold.question), (row) => row.unnecessaryQuestion),
    firstResponseBytes: distribution('bytes'),
    firstResponseEstimatedTokens: distribution('estimatedTokens'),
    responsesUnder2KiB: rate(rows, (row) => row.bytes < 2048),
    firstUsableSkillMs: distribution('firstUsableSkillMs'),
    firstUsableReferenceMs: distribution('firstUsableReferenceMs'),
    estimatedTokenMethod: 'ceil(UTF-8 bytes / 4); tokenizer not part of this offline harness',
  };
}
