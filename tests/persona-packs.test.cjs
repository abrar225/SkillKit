const assert = require('node:assert/strict');
const test = require('node:test');
const { getPersonaPack } = require('../lib/persona-packs');
const { explainKit, formatKit } = require('../lib/task-kit');
const packs = require('../workflows/personas.json');
const { resources } = require('../registry/resources.json');
const { skills } = require('../registry/skills.json');

test('each persona has checked catalog references and executable acceptance criteria', () => {
  const validResources = new Set(resources.map(({ id }) => id));
  const validSkills = new Set(skills.map(({ id }) => id));
  assert.deepEqual(packs.map(({ id }) => id), ['developers', 'video-editors', 'motion-graphics', 'designers', 'writers-social']);
  for (const profile of packs) {
    assert.ok(profile.skills.every((id) => validSkills.has(id)), profile.id);
    assert.ok(profile.resources.every((id) => validResources.has(id)), profile.id);
    const pack = getPersonaPack(profile.id);
    assert.ok(pack.tasteAnchors.length >= 2 && pack.tasteAnchors.every(({ example, test }) => example && test));
    assert.ok(pack.checks.length >= 2);
    assert.ok(pack.antiPatterns.length >= 2);
  }
  assert.equal(getPersonaPack('missing'), null);
});

test('persona details follow the deliverable and only expose selected tool links', () => {
  const input = { task: 'Animate an explainer in Manim and export MP4. Use only free resources.' };
  const { kit, packs } = explainKit(input);
  assert.equal(kit.status, 'ready');
  assert.deepEqual(packs.map(({ id }) => id), ['motion-graphics']);
  assert.deepEqual(packs[0].references.map(({ id }) => id), ['manim']);
  assert.match(packs[0].checks[0], /equation readability/);
  assert.ok(Buffer.byteLength(JSON.stringify(kit)) < 2048);
});

test('pack checks can describe an unsupported native deliverable while preserving the gap', () => {
  const info = explainKit({ task: 'Edit this interview in DaVinci Resolve and deliver a native Resolve project' });
  assert.notEqual(info.kit.status, 'ready');
  assert.deepEqual(info.kit.resources.map(r => r.id), ['resolve-editor-training']);
  assert.equal(info.packs[0].id, 'video-editors');
  assert.match(info.packs[0].variants[0].check, /Reopen the native Resolve project/);
  assert.ok(info.packs[0].variants[0].gap);
});

test('unknown or unsupported native files cannot be masked by generic workflows', () => {
  const cases = [
    { task: 'Design low-fidelity wireframes in Sketch and deliver a .sketch file' },
    { task: 'Design a festival poster in CorelDRAW and deliver the original .cdr' },
    { task: 'Implement an integration test in Bamboo Specs Kotlin' },
    { task: 'Create a poster and deliver an editable .acme native file' },
    { task: 'Build an Alteryx Designer workflow and deliver the .yxmd file' },
  ];
  for (const input of cases) assert.notEqual(explainKit(input).kit.status, 'ready', input.task);
  const flutter = explainKit({ task: 'Build a new mobile app in Flutter' }).kit;
  assert.ok(flutter.skills.every((s) => s.id !== 'mobile/flutter-architecture'));
  assert.equal(explainKit({ task: 'Create wireframes for a library catalog' }).kit.skills[0].id, 'ui-ux/wireframe');
});

test('default Markdown links a federated skill to reviewed upstream bytes', () => {
  const { kit } = explainKit({ task: 'Write the LinkedIn post text for an already-edited video' });
  assert.equal(kit.status, 'ready');
  assert.match(formatKit(kit), /https:\/\/github\.com\/shwetankg07\/linkedin-writing\/blob\/[a-f\d]{40}\/SKILL\.md/);
  assert.match(formatKit(kit, (id) => '/read/' + id), /\/read\/federated\//);
});
