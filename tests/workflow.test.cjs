const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createRouter } = require('../lib/task-router');
const { skills } = require('../registry/skills.json');
const { resources } = require('../registry/resources.json');
const { evals } = require('../skills/orchestrator/master-router/evals/eval.json');

const recommend = createRouter(skills, resources);

for (const example of evals) {
  test('workflow routes ' + example.id, () => {
    const result = recommend(example.input);
    assert.equal(result.status, example.status);
    if (example.question) assert.equal(result.question, example.question);
    if (example.workflows) assert.deepEqual(result.workflows.map(({ id }) => id), example.workflows);
    const picked = new Set(result.stages?.flatMap((stage) => stage.skills.map(({ id }) => id)));
    for (const id of example.skills || []) assert.ok(picked.has(id), id);
    for (const id of example.excludeSkills || []) assert.ok(!picked.has(id), id);
    const links = new Set(result.stages?.flatMap((stage) => stage.resources.map(({ id }) => id)));
    for (const id of example.resources || []) assert.ok(links.has(id), id);
  });
}

test('CLI produces the same answer as the shared router', () => {
  const task = 'Build a web app with a product list and a working filter.';
  const output = execFileSync(process.execPath, [
    path.resolve(__dirname, '../bin/vibe-skills.js'), 'recommend', task, '--workflow', 'new-web-project', '--stack', 'Next.js', '--json',
  ], { encoding: 'utf8' });
  assert.deepEqual(JSON.parse(output), recommend({ task, workflow: 'new-web-project', stack: 'Next.js' }));
});

test('recommendations disclose skills that need a compatible native layout', () => {
  const route = recommend({ task: 'Build a React Native app that tracks walking routes.', intent: { actions: ['mobile'], projectState: 'new', deliverables: ['Walking routes app'], stack: ['React Native'] } });
  const reactNative = route.stages.flatMap(({ skills }) => skills).find(({ id }) => id === 'mobile/react-native-skills');
  assert.ok(reactNative.nativeLayoutIssues.includes('name-folder-mismatch'));
});

test('raw task wording never picks a workflow', () => {
  assert.equal(recommend({ task: 'Deploy a portfolio site and design a blog.' }).status, 'needs_intent');
});

test('fallback returns a bounded relevant shortlist or an empty result', () => {
  const input = (deliverable) => ({ intent: { actions: [], projectState: 'existing', deliverables: [deliverable] } });
  const useful = recommend(input('Detect unused exports with Knip'));
  assert.ok(useful.resources.some(({ id }) => id === 'knip'));
  assert.ok(useful.skills.length <= 3 && useful.resources.length <= 3);
  assert.ok(useful.resources.every(({ reason, url }) => reason && url.startsWith('https://')));
  const empty = recommend(input('zzxyppq qqxxzvv'));
  assert.deepEqual(empty.skills, []);
  assert.deepEqual(empty.resources, []);
});

test('structured conflicts produce one clarification and unknown action IDs fail', () => {
  const pick = (actions, projectState, constraints) => recommend({ intent: { actions, projectState, constraints, deliverables: ['Change'] } });
  assert.throws(() => pick(['misspelled'], 'existing'), /Invalid actions/);
  assert.equal(pick(['new-web-project'], 'existing').status, 'needs_clarification');
  assert.equal(pick(['deploy'], 'existing', ['no-deployment']).status, 'no_applicable_stages');
  assert.equal(pick(['deploy', 'release'], 'existing').status, 'needs_clarification');
  assert.equal(pick(['feature', 'plan'], 'existing').status, 'needs_clarification');
  assert.equal(pick(['testing'], 'existing', ['no-implementation']).status, 'no_applicable_stages');
});
