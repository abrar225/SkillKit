import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { scoreSet } from './score.mjs';

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
