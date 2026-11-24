const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
const { findKit } = require('../lib/task-kit');
const { handleRequest } = require('../lib/kit-http');

const brief = 'I want to redesign my entire portfolio website. Use SkillKit to find the best skills and resources for my task.';
const cases = [
  [brief, 'web-redesign', ['frontend/frontend-design', 'ui-ux/refactoring-ui'], ['refactoring-ui', 'mdn']],
  ['Design a festival poster using only free resources', 'graphic-design', ['ui-ux/canvas-design'], ['google-fonts']],
  ['Cut this interview footage down to 30 seconds', 'video-edit', [], ['ffmpeg']],
  ['Make an animated explainer', 'motion-video', [], ['hyperframes']],
  ['Create generative art using flow fields', 'generative-art', [], ['p5js']],
  ['Reshape my blog post into an article', 'editorial', ['social-media/writing-shape'], []],
  ['Write the README for my portfolio website', 'documentation', ['architecture/documentation-and-adrs'], []],
  ['No need to redesign the website. Write a README', 'documentation', ['architecture/documentation-and-adrs'], []],
];

for (const [task, route, skillIds, resourceIds] of cases) {
  test('brief selects exactly the expected kit: ' + task, () => {
    const kit = findKit({ task });
    assert.deepEqual(kit.workflows, [route]);
    assert.deepEqual(kit.skills.map(({ id }) => id), skillIds);
    assert.deepEqual(kit.resources.map(({ id }) => id), resourceIds);
    assert.ok(kit.stages.every((s) => s.check));
    assert.ok(kit.resources.every((r) => r.url.startsWith('https://') && r.why && r.pricing));
    assert.ok(Buffer.byteLength(JSON.stringify(kit)) < 3500);
  });
}

test('ambiguous, compound and unsupported briefs preserve uncertainty', () => {
  const question = findKit({ task: 'Help with my video' });
  assert.equal(question.status, 'partial');
  assert.deepEqual(question.choices.map(({ id }) => id), ['video-edit', 'motion-video']);
  assert.equal(findKit({ task: 'Help with my video', workflow: question.choices[0].id }).status, 'ready');
  assert.equal(findKit({ task: 'Create a flyer and trim this video' }).status, 'ready');
  assert.equal(findKit({ task: 'qxyzz wvxqq' }).status, 'no_match');
  assert.equal(findKit({ task: 'Find unused exports with Knip' }).resources[0].id, 'knip');
  const compound = findKit({ task: 'Design a poster and trim footage', intent: {
    actions: ['graphic-design', 'video-edit'], projectState: 'unknown', deliverables: ['Poster', 'Edited footage'],
  } });
  assert.deepEqual(compound.workflows, ['graphic-design', 'video-edit']);
});

test('known stack and explicit constraints change the selection', () => {
  const kit = findKit({ task: brief + ' Use Next.js and hover animations. Only free resources.' });
  assert.ok(kit.skills.some((s) => s.id === 'frontend/vercel-react-best-practices'));
  assert.ok(kit.skills.some((s) => s.id === 'ui-ux/animate'));
  assert.ok(kit.resources.every((r) => r.pricing === 'free'));
  const limited = findKit({ task: 'Redesign my portfolio website. Mockups only. Do not deploy.' });
  assert.ok(limited.stages.every((s) => !s.id.includes('implement') && !s.id.includes('deploy')));
});

test('CLI, web API, and Streamable HTTP MCP return the same kit without project files', async (t) => {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'skillkit-consumer-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const cli = execFileSync(process.execPath, [path.resolve(__dirname, '../bin/vibe-skills.js'), 'find', brief, '--json'], { cwd: dir });
  const kit = JSON.parse(cli);
  const url = new URL('http://localhost/api/mcp');
  const fetch = (url, init) => handleRequest(new Request(url, init));
  const client = new Client({ name: 'task-kit-test', version: '1' });
  try {
    await client.connect(new StreamableHTTPClientTransport(url, { fetch }));
    assert.deepEqual((await client.listTools()).tools.map((s) => s.name).sort(), ['explain_match', 'find_kit', 'get_resource', 'get_skill', 'read_skill_file', 'report_outcome']);
    const result = await client.callTool({ name: 'find_kit', arguments: { task: brief } });
    assert.deepEqual(result.structuredContent, kit);
    const detail = await client.callTool({ name: 'get_skill', arguments: { id: kit.skills[0].id } });
    assert.match(detail.structuredContent.instructions, /Frontend Design/);
    assert.ok(detail.structuredContent.provenance.license);
    assert.equal(new URL(detail.structuredContent.archiveUrl).searchParams.get('id'), kit.skills[0].id);
    const invalid = await client.callTool({ name: 'export_skill', arguments: {} });
    assert.ok(invalid.isError);
  } finally { await client.close(); }
  const api = 'http://localhost/api/kit';
  assert.deepEqual(await (await fetch(api + '?task=' + encodeURIComponent(brief))).json(), kit);
  assert.deepEqual(await (await fetch(api, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ task: brief }) })).json(), kit);
  assert.match(await (await fetch(api + '?task=' + encodeURIComponent(brief) + '&format=markdown')).text(), /http:\/\/localhost\/api\/kit\?id=/);
  const script = await (await fetch(api + '?id=automations/webapp-testing&file=scripts/with_server.py')).json();
  assert.equal(script.content, fs.readFileSync(path.resolve(__dirname, '../skills/automations/webapp-testing/scripts/with_server.py'), 'utf8'));
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('HTTP rejects invalid inputs, crossed origins, private file paths and oversized bodies', async () => {
  const url = 'http://localhost/api/kit';
  const status = async (suffix, init) => (await handleRequest(new Request(url + suffix, init))).status;
  assert.equal(await status('?workflow=unknown'), 400);
  assert.equal(await status('?id=../outside'), 400);
  assert.equal(await status('?id=frontend/frontend-design&file=../../package.json'), 400);
  assert.equal(await status('', { headers: { origin: 'https://unrelated.example' } }), 403);
  const post = (body) => status('', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  assert.equal(await post('x'.repeat(65537)), 413);
  for (const bad of ['null', '[]', '{"unrecognized":true}', '{"task":3}', '{"workflow":"xyz"}']) assert.equal(await post(bad), 400);
});

test('native download contains only the requested skill, including recursive notices and source bytes', async (t) => {
  const url = 'http://localhost/api/kit?id=backend-api/prisma-client-api&format=archive';
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'skillkit-archive-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const archive = await handleRequest(new Request(url));
  assert.equal(archive.status, 200);
  assert.match(archive.headers.get('content-disposition'), /prisma-client-api\.tar\.gz/);
  const { pipeline } = require('node:stream/promises');
  await pipeline(require('node:stream').Readable.fromWeb(archive.body), require('tar').extract({ cwd: dir }));
  assert.deepEqual(fs.readdirSync(dir), ['prisma-client-api']);
  const installed = path.join(dir, 'prisma-client-api');
  const source = path.resolve(__dirname, '../skills/backend-api/prisma-client-api');
  for (const file of fs.readdirSync(source, { recursive: true })) {
    if (fs.statSync(path.join(source, file)).isFile()) {
      assert.deepEqual(fs.readFileSync(path.join(installed, file)), fs.readFileSync(path.join(source, file)), file);
    }
  }
  assert.ok(fs.existsSync(path.join(installed, 'upstream-licenses')));
});

test('excluded frameworks and unrelated subjects do not trigger optional guidance', () => {
  const kit = findKit({ task: 'No React. Redesign my existing site without animations. Only free resources.' });
  assert.deepEqual(kit.skills.map((s) => s.id), ['frontend/frontend-design', 'ui-ux/refactoring-ui']);
  assert.deepEqual(kit.resources.map((r) => r.id), ['mdn']);
  assert.deepEqual(findKit({ task: 'Design an API for invoices' }).workflows, ['api-data']);
  assert.deepEqual(findKit({ task: 'Implement a video editing button in my app' }).workflows, ['feature']);
  assert.equal(findKit({ task: 'Explain the difference between two trademark filings' }).status, 'no_match');
});

test('a clarification answer keeps the stack, topics and budget from the brief', () => {
  const task = 'Help with my portfolio in React, with hover animations. Only free resources.';
  assert.equal(findKit({ task }).status, 'partial');
  const kit = findKit({ task, workflow: 'web-redesign' });
  assert.ok(kit.skills.some((s) => s.id === 'ui-ux/animate'));
  assert.ok(kit.skills.some((s) => s.id === 'frontend/vercel-react-best-practices'));
  assert.ok(kit.resources.every((r) => r.pricing === 'free'));
});
