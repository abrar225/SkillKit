const test = require('node:test');
const assert = require('node:assert/strict');
const { explainKit, findKit, formatKit } = require('../lib/task-kit');
const { mayDeliver } = require('../lib/catalog-policy');

const localOnly = { federatedCandidates: () => [] };
const skillIds = (kit) => kit.skills.map(({ id }) => id);
const resourceIds = (kit) => kit.resources.map(({ id }) => id);

test('native Resolve timelines never earn a generic transcoding kit', () => {
  const info = explainKit({ task: 'Edit an interview in DaVinci Resolve and deliver an editable Resolve timeline' }, localOnly);
  assert.equal(info.kit.status, 'no_match');
  assert.deepEqual(info.contract.deliverables.map(({ kind, tools }) => [kind, tools]), [['video-editor-project', ['davinci-resolve']]]);
  assert.deepEqual(resourceIds(info.kit), []);
  assert.match(info.kit.gaps[0], /video editor project.*davinci-resolve/);
  assert.match(info.gapBrief, /exact tools and formats/);
});

test('social copy routes on the text output and ignores video as source', () => {
  const input = { task: 'Write the LinkedIn post text for an already-edited video' };
  const local = explainKit(input, localOnly);
  assert.equal(local.kit.status, 'partial');
  assert.deepEqual(local.contract.deliverables.map(({ kind }) => kind), ['social-copy']);
  assert.deepEqual(skillIds(local.kit), ['social-media/writing-beats']);
  assert.ok(!resourceIds(local.kit).includes('ffmpeg'));
  assert.match(local.kit.gaps.join(' '), /linkedin/i);

  const expected = 'federated/shwetankg07/linkedin-writing/writing-linkedin-posts';
  let calls = 0;
  const remote = explainKit(input, { federatedCandidates(contract) {
    calls += 1;
    assert.equal(contract.deliverables[0].kind, 'social-copy');
    return [{ id: expected, title: 'LinkedIn post writing', description: 'Write plain text LinkedIn posts',
      license: 'MIT', deliverables: ['social-copy'], tools: ['linkedin'], formats: ['plain-text'], stage: 'build' }];
  } });
  assert.equal(calls, 1);
  assert.equal(remote.kit.status, 'ready');
  assert.deepEqual(skillIds(remote.kit), [expected]);
  assert.match(remote.kit.stages[0].id, /social-copy\/build/);
  assert.equal(remote.selected[0].trust, 'federated');
});

test('enforces required and excluded tools, native formats and free budgets', () => {
  const input = { task: 'Edit an interview', intent: {
    actions: ['video-edit'], tools: ['Premiere Pro'], formats: ['.prproj'], budget: 'free',
  } };
  const native = explainKit(input, localOnly);
  assert.equal(native.kit.status, 'no_match');
  assert.deepEqual(native.contract.tools, ['premiere-pro']);
  assert.deepEqual(native.contract.formats, ['prproj']);
  assert.match(native.kit.gaps[0], /free/);

  const conflicting = findKit({
    task: 'Trim the interview with FFmpeg.',
    intent: { forbiddenTools: ['FFmpeg'] },
  }, localOnly);
  assert.equal(conflicting.status, 'no_match');
  assert.match(conflicting.gaps[0], /excluded/);
  const commercial = findKit({ task: 'Make an animated explainer in Remotion using only open-source tools.' }, localOnly);
  assert.equal(commercial.status, 'no_match');
  assert.deepEqual(resourceIds(commercial), []);
});

test('coverage of a compound brief requires both outputs', () => {
  const both = findKit({ task: 'Create a flyer and trim this video' }, localOnly);
  assert.equal(both.status, 'ready');
  assert.deepEqual(both.workflows, ['graphic-design', 'video-edit']);
  assert.equal(both.question, undefined);

  const partial = findKit({ task: 'Write a draft article and a spreadsheet' }, localOnly);
  assert.equal(partial.status, 'partial');
  assert.deepEqual(skillIds(partial), ['social-media/writing-shape']);
  assert.match(partial.gaps[0], /spreadsheet/);
  assert.equal(partial.question, undefined);
});

test('motion output is retained through a format-only export clause', () => {
  const kit = findKit({ task: 'Animate a mathematical explainer with Manim and export MP4' }, localOnly);
  assert.equal(kit.status, 'ready');
  assert.deepEqual(resourceIds(kit), ['manim']);
  assert.ok(kit.stages[0].when);
  assert.match(kit.stages[0].check, /render/i);
});

test('structured project files contribute stack context and select the entry stage', () => {
  const input = { intent: { actions: ['feature'], deliverables: ['Add CSV import'], stage: 'build',
    files: ['next.config.js'], qualityBar: ['edge cases'] } };
  const info = explainKit(input, localOnly);
  assert.equal(info.kit.status, 'ready');
  assert.equal(info.contract.project.state, 'existing');
  assert.ok(info.contract.project.stack.includes('nextjs'));
  assert.deepEqual(info.kit.stages.map(({ id }) => id), ['feature/implement']);
  assert.ok(skillIds(info.kit).includes('frontend/vercel-react-best-practices'));
  assert.ok(info.selected[0].lexicalScore > 0);
  assert.ok(info.selected[0].vectorSimilarity > 0);
  assert.deepEqual(info, explainKit(input, localOnly));
});

test('clarification is reserved for a brief with materially different plausible outputs', () => {
  const ambiguous = findKit({ task: 'Help with my video' }, localOnly);
  assert.equal(ambiguous.status, 'partial');
  assert.deepEqual(ambiguous.choices.map(({ id }) => id), ['video-edit', 'motion-video']);
  assert.match(formatKit(ambiguous), /editing existing footage/);
  const unmatched = findKit({ task: 'Summarize the differences between two trademark filings' }, localOnly);
  assert.equal(unmatched.status, 'no_match');
  assert.equal(unmatched.question, undefined);
});

test('typical manifests are compact and route-selected skills are licensed', () => {
  for (const task of ['Redesign my personal portfolio website', 'Design a festival poster using only free resources',
    'Trim a video clip to 30 seconds', 'Draft a blog article', 'Find unused exports with Knip']) {
    const kit = findKit({ task }, localOnly);
    assert.equal(kit.status, 'ready', task);
    assert.ok(Buffer.byteLength(JSON.stringify(kit)) < 2048, task);
    assert.ok(kit.skills.every((skill) => mayDeliver(skill)), task);
    for (const stage of kit.stages) {
      assert.ok(stage.when && stage.check);
      assert.ok(stage.skills.every((id) => skillIds(kit).includes(id)));
      assert.ok(stage.resources.every((id) => resourceIds(kit).includes(id)));
    }
  }
});
