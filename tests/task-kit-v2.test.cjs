const test = require('node:test');
const assert = require('node:assert/strict');
const { explainKit, findKit, formatKit } = require('../lib/task-kit');
const { mayDeliver } = require('../lib/catalog-policy');

const localOnly = { federatedCandidates: () => [] };
const skillIds = (kit) => kit.skills.map(({ id }) => id);
const resourceIds = (kit) => kit.resources.map(({ id }) => id);

test('native Resolve timelines never earn a generic transcoding kit', () => {
  const info = explainKit({ task: 'Edit an interview in DaVinci Resolve and deliver an editable Resolve timeline' }, localOnly);
  assert.equal(info.kit.status, 'partial');
  assert.deepEqual(info.contract.deliverables.map(({ kind, tools }) => [kind, tools]), [['resolve-edit', ['davinci-resolve']], ['video-editor-project', ['davinci-resolve']]]);
  assert.deepEqual(resourceIds(info.kit), ['resolve-editor-training']);
  assert.match(info.kit.gaps[0], /video editor project.*davinci-resolve/);
  assert.match(info.gapBrief, /exact tools and formats/);
});

test('social copy routes on the text output and ignores video as source', () => {
  const input = { task: 'Write the LinkedIn post text for an already-edited video' };
  const local = explainKit(input, localOnly);
  assert.equal(local.kit.status, 'no_match');
  assert.deepEqual(local.contract.deliverables.map(({ kind }) => kind), ['social-copy']);
  assert.deepEqual(skillIds(local.kit), []);
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

test('specialist routes, graphic phrasing, and constraint boundaries hold without false matches', () => {
  const astryx = explainKit({ task: 'Build a form screen using the Astryx design system.' }, localOnly);
  assert.equal(astryx.kit.status, 'ready');
  assert.ok(skillIds(astryx.kit).includes('ui-ux/astryx'));

  const pickUi = explainKit({ task: 'Recommend a UI component library for a React command palette.' }, localOnly);
  assert.equal(pickUi.kit.status, 'ready');
  assert.ok(skillIds(pickUi.kit).includes('ui-ux/pick-ui-library'));

  const reusable = explainKit({ task: 'Create a reusable theme for our quarterly slide deck in PPTX.' }, localOnly);
  assert.equal(reusable.kit.status, 'ready');
  assert.ok(skillIds(reusable.kit).includes('ui-ux/theme-factory'));

  const comp = explainKit({ task: 'Design compound React component composition patterns for our dropdown.' }, localOnly);
  assert.equal(comp.kit.status, 'ready');
  assert.ok(skillIds(comp.kit).includes('frontend/composition-patterns'));

  const durable = explainKit({ task: 'Stabilize flaky tests and eliminate fake timer leaks in Vitest.' }, localOnly);
  assert.equal(durable.kit.status, 'ready');
  assert.ok(skillIds(durable.kit).includes('engineering-ops/durable-test-collateral'));

  const safeMig = explainKit({ task: 'Plan a zero-downtime Postgres schema migration with backward-compatible rollout.' }, localOnly);
  assert.equal(safeMig.kit.status, 'ready');
  assert.ok(skillIds(safeMig.kit).includes('engineering-ops/deprecation-and-migration'));

  const sop = explainKit({ task: 'Turn these onboarding notes into an engineering SOP handbook in Markdown.' }, localOnly);
  assert.equal(sop.kit.status, 'ready');
  assert.ok(skillIds(sop.kit).includes('social-media/anthropic-docs'));

  const sign = explainKit({ task: 'Create a static PNG sign for the conference workshop desk.' }, localOnly);
  assert.equal(sign.kit.status, 'ready');
  assert.ok(skillIds(sign.kit).includes('ui-ux/canvas-design'));

  const duckdb = explainKit({ task: 'Document a local DuckDB query workflow over Parquet logs.' }, localOnly);
  assert.equal(duckdb.kit.status, 'ready');
  assert.ok(resourceIds(duckdb.kit).includes('duckdb'));

  const arch = explainKit({ task: 'Refactor our legacy Express handlers into clean domain modules.' }, localOnly);
  assert.equal(arch.kit.status, 'ready');
  assert.ok(skillIds(arch.kit).includes('architecture/improve-codebase-architecture'));

  const helm = explainKit({ task: 'Create a Kubernetes Helm chart for our microservice.' }, localOnly);
  assert.notEqual(helm.contract.deliverables[0].kind, 'data-visualization');

  const xThread = findKit({ task: 'Write X thread copy breaking down 5 Postgres indexing mistakes, text only.' }, localOnly);
  assert.equal(xThread.status, 'ready');
  assert.ok(xThread.constraints.includes('no-auto-publishing'));

  const negSpan = explainKit({ task: 'Design an API without OpenAPI or Swagger, using gRPC protobuf instead.' }, localOnly);
  assert.ok(negSpan.contract.forbiddenTools.includes('openapi'));
  assert.ok(!negSpan.contract.forbiddenTools.includes('grpc'));
  assert.equal(negSpan.kit.status, 'no_match');

  const pricingRedesign = explainKit({ task: 'Redesign our pricing page without any JavaScript framework or utility CSS library.' }, localOnly);
  assert.equal(pricingRedesign.kit.status, 'ready');
  assert.ok(pricingRedesign.contract.forbiddenTools.includes('tailwindcss'));
  assert.ok(pricingRedesign.contract.forbiddenTools.includes('react'));

  const freeFonts = explainKit({ task: 'Create a static poster. Paid fonts and commercial stock are strictly off limits.' }, localOnly);
  assert.equal(freeFonts.kit.status, 'ready');
  assert.equal(freeFonts.contract.budget, 'free');

  const dns = findKit({ task: 'Migrate our website DNS records to Cloudflare; need help configuring CNAMEs.' }, localOnly);
  assert.equal(dns.status, 'no_match');
  assert.equal(dns.question, undefined);

  const acme = findKit({ task: 'Create a poster and deliver an editable .acme native file.' }, localOnly);
  assert.notEqual(acme.status, 'ready');

  const edl = findKit({ task: 'Edit an interview and deliver an .edl timeline.' }, localOnly);
  assert.notEqual(edl.status, 'ready');

  const readOnlyInfra = explainKit({ task: 'Deploy a Kubernetes Ingress controller with Helm.' }, {
    federatedCandidates: () => [{
      id: 'federated/notharshhaa/devops-skills/k8s-review',
      name: 'k8s-review',
      description: 'Review Kubernetes manifests.',
      deliverables: ['infrastructure-ops'],
      tools: ['helm', 'kubernetes'],
      formats: ['yaml'],
      stage: 'review',
      license: 'MIT',
    }],
  });
  assert.equal(readOnlyInfra.kit.status, 'no_match');
});
