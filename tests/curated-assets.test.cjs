const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const tar = require('tar');
const { handleRequest } = require('../lib/kit-http');
const { makeLock } = require('../lib/kit-delivery');
const catalog = path.resolve(__dirname, '..');

function fixture(t, id) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillkit-curated-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'skills', id);
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  fs.cpSync(path.join(catalog, 'skills', id), dir, { recursive: true });
  fs.copyFileSync(path.join(catalog, 'LICENSE'), path.join(root, 'LICENSE'));
  const request = (params = {}) => handleRequest(new Request(
    'http://localhost/api/kit?' + new URLSearchParams({ id, ...params }),
  ), root);
  return { dir, root, request };
}

test('approved archives and text reads include only reviewed files, and extras do not affect the lock', async t => {
  const id = 'automations/webapp-testing';
  const { dir, root, request } = fixture(t, id);
  const kit = { skills: [{ id }] };
  const lock = makeLock(kit, root);
  fs.writeFileSync(path.join(dir, '.env'), 'dummy local configuration');
  fs.writeFileSync(path.join(dir, 'scripts/private.md'), 'unreviewed workspace note');
  assert.deepEqual(makeLock(kit, root), lock);
  const details = await (await request()).json();
  assert.ok(details.supportingFiles.includes('scripts/with_server.py'));
  assert.ok(!details.supportingFiles.includes('scripts/private.md'));
  assert.ok((await request({ file: 'scripts/private.md' })).status >= 400);
  const response = await request({ format: 'archive' });
  assert.equal(response.status, 200);
  const extracted = path.join(root, 'extracted');
  fs.mkdirSync(extracted);
  await pipeline(Readable.fromWeb(response.body), tar.extract({ cwd: extracted }));
  const skill = path.join(extracted, 'webapp-testing');
  assert.deepEqual(fs.readdirSync(extracted), ['webapp-testing']);
  assert.deepEqual(fs.readdirSync(skill), ['LICENSE.txt', 'SKILL.md', 'SOURCE.json', 'examples', 'scripts']);
  assert.deepEqual(fs.readdirSync(path.join(skill, 'scripts')), ['with_server.py']);
  const script = 'scripts/with_server.py';
  assert.deepEqual(fs.readFileSync(path.join(skill, script)), fs.readFileSync(path.join(dir, script)));
  assert.notEqual(fs.statSync(path.join(skill, script)).mode & 0o111, 0);
  fs.appendFileSync(path.join(dir, script), '\n# modified outside review\n');
  for (const params of [{ file: script }, { format: 'archive' }]) {
    const refused = await request(params);
    assert.equal(refused.status, 400);
    assert.match(await refused.text(), /recorded checksum/);
  }
});

test('reviewed local archives omit original workstation paths and keep fallback license notices', async t => {
  const id = 'frontend/vercel-react-best-practices';
  const { dir, root, request } = fixture(t, id);
  fs.writeFileSync(path.join(dir, 'private.md'), 'unreviewed workspace note');
  const response = await request({ format: 'archive' });
  assert.equal(response.status, 200);
  const extracted = path.join(root, 'extracted');
  fs.mkdirSync(extracted);
  await pipeline(Readable.fromWeb(response.body), tar.extract({ cwd: extracted }));
  const skill = path.join(extracted, 'vercel-react-best-practices');
  const provenance = JSON.parse(fs.readFileSync(path.join(skill, 'SOURCE.json'), 'utf8'));
  assert.ok(!Object.hasOwn(provenance, 'originalPath'));
  assert.match(fs.readFileSync(path.join(skill, 'SKILLKIT-LICENSE.txt'), 'utf8'), /MIT license declared/);
  assert.equal(fs.existsSync(path.join(skill, 'private.md')), false);
});
