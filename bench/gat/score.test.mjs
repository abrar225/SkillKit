import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { scoreSet } from './score.mjs';

const require = createRequire(import.meta.url);
const { isPermissive } = require('../../lib/catalog-policy.js');

const gap = 'Unsupported fixture deliverable';
const local = 'ui-ux/canvas-design';
const design = {
  status: 'ready', workflows: [],
  stages: [{ id: 'graphic/delivery', check: 'Check PDF size.', skills: [local] }],
  skills: [{ id: local }], resources: [],
};

test('checks classes, selected tool and format evidence, and specific gaps without exposing prompts', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'skillkit-scorer-test-'));
  t.after(() => rmSync(dir, { force: true, recursive: true }));
  const filename = join(dir, 'cases.json');
  const classes = [{ label: 'static graphics', ids: [local], terms: ['visual art'], checks: ['pdf size'] }];
  const cases = [
    { id: 'works', expected: 'ready', evidence: classes, constraints: { requiredFormats: ['pdf'] } },
    { id: 'no-stage', expected: 'ready', evidence: classes },
    { id: 'unsupported-format', expected: 'ready', evidence: classes, constraints: { requiredFormats: ['ai'] } },
    { id: 'forbidden', expected: 'ready', evidence: classes, constraints: { excludeIds: [local] } },
    { id: 'precise', expected: 'no_match', evidence: [], gapTerms: [['fixture deliverable']] },
    { id: 'vague', expected: 'no_match', evidence: [], gapTerms: [['fixture deliverable']] },
    { id: 'partial-good', expected: 'partial', evidence: classes, gapTerms: [['missing native export']] },
    { id: 'bogus-outside', expected: 'outside', evidence: [] },
    { id: 'correct-outside', expected: 'outside', evidence: [] },
  ].map((row) => ({ ...row, domain: 'synthetic', brief: row.id }));
  writeFileSync(filename, JSON.stringify({ schema: 1, cases }));
  const result = await scoreSet(({ task }) => ({
    works: design,
    'no-stage': { ...design, stages: [] },
    'unsupported-format': design,
    forbidden: design,
    precise: { status: 'no_match', gaps: [gap] },
    vague: { status: 'no_match', gaps: ['Try again.'] },
    'partial-good': { ...design, status: 'partial', gaps: ['Missing native export.'] },
    'bogus-outside': { ...design, status: 'no_match', gaps: [gap] },
    'correct-outside': { status: 'no_match', gaps: [gap] },
  })[task], filename);

  assert.equal(result.usablePct, 14.29);
  assert.equal(result.wrongPct, 42.86);
  assert.equal(result.constraintPct, 33.33);
  assert.equal(result.fallbackPct, 66.67);
  assert.equal(result.outsidePct, 50);
  assert.ok(result.maxBytes > 0);
  assert.doesNotMatch(JSON.stringify(result), /bogus-outside|Unsupported fixture deliverable/);
});

test('strict-frozen stays headline while deterministic blind adjudication checks normalized deliverable and tool tags', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'skillkit-adj-root-'));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  const fs = require('node:fs');
  fs.mkdirSync(join(root, 'registry'), { recursive: true });
  fs.mkdirSync(join(root, 'catalog/federated'), { recursive: true });
  fs.writeFileSync(join(root, 'registry/skills.json'), JSON.stringify({ skills: [] }));
  fs.writeFileSync(join(root, 'registry/resources.json'), JSON.stringify({ resources: [] }));

  const validAtlas = {
    id: 'federated/owner/repo/react-ui-pro',
    name: 'react-ui-pro',
    title: 'React UI Pro',
    description: 'Redesign dashboards in React.',
    deliverables: ['web-redesign'],
    tools: ['react'],
    formats: ['html'],
    domain: 'frontend',
    license: 'BSL-1.0',
    status: 'approved',
    upstream: { commit: 'a'.repeat(40), repo: 'owner/repo', path: 'SKILL.md' },
    checksum: 'b'.repeat(64),
    licenseEvidence: [{ name: 'LICENSE', path: 'LICENSE', sha256: 'c'.repeat(64), kind: 'notice' }],
    scan: { blocked: false, flags: [] },
  };
  const missingToolAtlas = {
    ...validAtlas,
    id: 'federated/owner/repo/generic-ui',
    name: 'generic-ui',
    title: 'Generic UI',
    description: 'Redesign web interfaces.',
    tools: [],
  };
  const buslAtlas = {
    ...validAtlas,
    id: 'federated/owner/repo/busl-ui',
    license: 'BUSL-1.1',
  };
  fs.writeFileSync(join(root, 'catalog/federated/snapshot.json'), JSON.stringify({
    schemaVersion: 1,
    entries: [validAtlas, missingToolAtlas, buslAtlas],
  }));

  const filename = join(root, 'cases.json');
  const cases = [{
    id: 'react-redesign',
    domain: 'ui',
    brief: 'Redesign my React dashboard',
    expected: 'ready',
    constraints: { requiredTools: ['React'] },
    evidence: [{ label: 'interface design', ids: ['frontend/frontend-design'], terms: ['web ui'] }],
  }];
  writeFileSync(filename, JSON.stringify({ schema: 1, cases }));

  const makeKit = (skillId) => ({
    status: 'ready',
    workflows: ['web-redesign'],
    stages: [{ id: 'design', skills: [skillId], resources: [], check: 'Check hierarchy.' }],
    skills: [{ id: skillId }],
    resources: [],
  });

  const strictAndAdj = await scoreSet(() => makeKit(validAtlas.id), filename, { root, includeAdjudicated: true });
  assert.equal(strictAndAdj.usablePct, 0);
  assert.equal(strictAndAdj.wrongPct, 100);
  assert.equal(strictAndAdj.adjudicated.usablePct, 100);
  assert.equal(strictAndAdj.adjudicated.wrongPct, 0);
  assert.equal(strictAndAdj.adjudicated.federatedMatchedCount, 1);

  const missingTool = await scoreSet(() => makeKit(missingToolAtlas.id), filename, { root, includeAdjudicated: true });
  assert.equal(missingTool.adjudicated.usablePct, 0);

  const buslRejected = await scoreSet(() => makeKit(buslAtlas.id), filename, { root, includeAdjudicated: true });
  assert.equal(buslRejected.adjudicated.usablePct, 0);

  assert.equal(isPermissive('BSL-1.0'), true);
  assert.equal(isPermissive('BUSL-1.1'), false);
});
