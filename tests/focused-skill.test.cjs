const test = require('node:test');
const assert = require('node:assert/strict');
const { focusedSkill } = require('../lib/focused-skill');
test('focused skill excerpts preserve source paragraphs, attribution and full-file access', () => {
  const lead = 'Before a migration, identify the old schema and a previously tested rollback.';
  const body = 'Check typography and contrast in the rendered poster at the requested physical size.';
  const detail = { instructions: '---\nname: guide\n---\n' + lead + '\n\n' + body, notices: ['notice'] };
  const excerpt = focusedSkill(detail, 'typography contrast');
  assert.ok(excerpt.excerpt);
  assert.ok(excerpt.instructions.includes(body));
  assert.ok(Buffer.byteLength(excerpt.instructions) <= 900);
  assert.deepEqual(excerpt.notices, detail.notices);
  assert.equal(focusedSkill(detail), detail);
  assert.throws(() => focusedSkill(detail, 'x'.repeat(8001)));
});
