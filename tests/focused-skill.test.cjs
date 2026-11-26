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

test('focused skill excerpts preserve intact fenced code blocks inside byte limit', () => {
  const prose = 'Use explicit accessible labels linked to every form control by matching id.';
  const code = [
    '```html',
    '<label for="email">Email address</label>',
    '',
    '<input id="email" type="email" required />',
    '```',
  ].join('\n');
  const unrelated = 'Migration checklists require verifying staged backups before schema cutover.';
  const detail = { instructions: [prose, code, unrelated].join('\n\n'), notices: ['notice'] };
  const excerpt = focusedSkill(detail, 'accessible label email form control');
  assert.equal(excerpt.excerpt, true);
  assert.ok(excerpt.instructions.includes('```html'));
  assert.ok(excerpt.instructions.includes('<input id="email" type="email" required />'));
  assert.equal((excerpt.instructions.match(/```/g) || []).length % 2, 0);
  assert.ok(Buffer.byteLength(excerpt.instructions) <= 900);
});
