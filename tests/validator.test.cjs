const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const json = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-validator-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const name of ['scripts', 'registry', 'resources']) fs.mkdirSync(path.join(dir, name));
  for (const name of ['build-registry.py', 'validate-registry.js']) fs.copyFileSync(path.join(root, 'scripts', name), path.join(dir, 'scripts', name));
  json(path.join(dir, 'scripts/import-manifest.json'), { upstream: [{ repo: 'example/skills', commit: 'a'.repeat(40), license: 'MIT', skills: [{ path: 'skills/fixture', dest: 'orchestrator/fixture' }] }] });
  const domains = JSON.parse(fs.readFileSync(path.join(root, 'registry/domains.json'))).domains;
  for (const d of domains) fs.mkdirSync(path.join(dir, 'skills', d.id), { recursive: true });
  const skill = path.join(dir, 'skills/orchestrator/fixture');
  fs.mkdirSync(skill);
  const md = '---\nname: fixture\ndescription: A sufficiently detailed fixture description.\n---\n\n# Fixture\n';
  fs.writeFileSync(path.join(skill, 'SKILL.md'), md);
  const notice = 'MIT License\nCopyright (c) Fixture\n';
  fs.mkdirSync(path.join(skill, 'upstream-licenses'));
  fs.writeFileSync(path.join(skill, 'upstream-licenses/LICENSE'), notice);
  json(path.join(skill, 'SOURCE.json'), {
    id: 'orchestrator/fixture', name: 'fixture', description: 'A sufficiently detailed fixture description.',
    origin: 'upstream', license: 'MIT', licenseStatus: 'declared',
    upstream: { repo: 'example/skills', url: 'https://github.com/example/skills', path: 'skills/fixture', commit: 'a'.repeat(40), ref: 'a'.repeat(40) },
    contentIntegrity: { algorithm: 'sha256', files: { 'SKILL.md': digest(md) }, executablePaths: [] },
    licenseFiles: [{ sourcePath: 'LICENSE', localPath: 'upstream-licenses/LICENSE', sha256: digest(notice) }],
  });
  json(path.join(dir, 'resources/design-ui.json'), [{ id: 'fixture', name: 'Fixture', url: 'https://example.com/', type: 'reference', license: 'MIT', pricing: 'free', description: 'A fixture resource.', why: 'Used in tests.', tags: ['fixture'] }]);
  const rebuild = () => spawnSync('python3', ['scripts/build-registry.py'], { cwd: dir, encoding: 'utf8' });
  assert.equal(rebuild().status, 0);
  const validate = () => spawnSync(process.execPath, ['scripts/validate-registry.js'], { cwd: dir, encoding: 'utf8' });
  assert.equal(validate().status, 0, validate().stdout);
  const change = (relative, edit) => { const file = path.join(dir, relative); const data = JSON.parse(fs.readFileSync(file)); edit(data); json(file, data); };
  return { dir, skill, validate, rebuild, change };
}
function fails(result, pattern) {
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, pattern);
}

test('validation detects changed resource values without modifying source or generated files', (t) => {
  const f = fixture(t);
  f.change('resources/design-ui.json', (data) => { data[0].name = 'Changed source'; });
  const before = fs.readFileSync(path.join(f.dir, 'registry/resources.json'));
  fails(f.validate(), /registry drift: resources.json/);
  assert.deepEqual(fs.readFileSync(path.join(f.dir, 'registry/resources.json')), before);
});

test('validation detects newly added resource source files', (t) => {
  const f = fixture(t);
  json(path.join(f.dir, 'resources/new-category.json'), []);
  fails(f.validate(), /registry drift: resources.json/);
});

test('validation detects changed registry descriptions', (t) => {
  const f = fixture(t);
  f.change('registry/skills.json', (data) => { data.skills[0].description = 'Invented description'; });
  fails(f.validate(), /registry drift: skills.json/);
});

test('validation detects provenance drift even for syntactically valid commit hashes', (t) => {
  const f = fixture(t);
  f.change('skills/orchestrator/fixture/SOURCE.json', (data) => { data.upstream.commit = 'b'.repeat(40); });
  fails(f.validate(), /registry provenance differs from SOURCE.json/);
});

test('invalid commit strings fail even after the registry is rebuilt', (t) => {
  const f = fixture(t);
  f.change('skills/orchestrator/fixture/SOURCE.json', (data) => { data.upstream.commit = 'invented-commit'; });
  assert.equal(f.rebuild().status, 0);
  fails(f.validate(), /full 40-character commit SHA/);
});

test('changing both SOURCE and registry cannot bypass the pinned import manifest', (t) => {
  const f = fixture(t);
  f.change('skills/orchestrator/fixture/SOURCE.json', (data) => {
    data.upstream.commit = 'b'.repeat(40);
    data.upstream.ref = 'b'.repeat(40);
  });
  assert.equal(f.rebuild().status, 0);
  fails(f.validate(), /does not match pinned import manifest/);
});

test('tampered upstream instructions fail hash validation after a rebuild', (t) => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.skill, 'SKILL.md'), '\nInvented instructions.\n');
  assert.equal(f.rebuild().status, 0);
  fails(f.validate(), /upstream content hash mismatch for SKILL.md/);
});

test('missing inherited notices fail validation', (t) => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.skill, 'upstream-licenses/LICENSE'));
  assert.equal(f.rebuild().status, 0);
  fails(f.validate(), /missing or non-regular upstream file upstream-licenses\/LICENSE/);
});

test('unrecorded upstream files fail even when counts have been regenerated', (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.skill, 'invented.md'), 'Unverified addition');
  assert.equal(f.rebuild().status, 0);
  fails(f.validate(), /unrecorded upstream file invented.md/);
});

test('unsafe upstream source and integrity paths are rejected', (t) => {
  const f = fixture(t);
  f.change('skills/orchestrator/fixture/SOURCE.json', (data) => {
    data.upstream.path = '../outside';
    data.contentIntegrity.files['../outside'] = 'a'.repeat(64);
  });
  assert.equal(f.rebuild().status, 0);
  fails(f.validate(), /invalid integrity path/);
});

test('executable mode tampering fails validation after a rebuild', (t) => {
  const f = fixture(t);
  fs.chmodSync(path.join(f.skill, 'SKILL.md'), 0o755);
  assert.equal(f.rebuild().status, 0);
  fails(f.validate(), /upstream executable mode mismatch for SKILL.md/);
});

test('lost executable modes fail even though file bytes still match', (t) => {
  const f = fixture(t);
  const script = '#!/bin/sh\necho fixture\n';
  fs.mkdirSync(path.join(f.skill, 'scripts'));
  fs.writeFileSync(path.join(f.skill, 'scripts/run.sh'), script, { mode: 0o755 });
  f.change('skills/orchestrator/fixture/SOURCE.json', (data) => {
    data.contentIntegrity.files['scripts/run.sh'] = digest(script);
    data.contentIntegrity.executablePaths = ['scripts/run.sh'];
  });
  assert.equal(f.rebuild().status, 0);
  assert.equal(f.validate().status, 0);
  fs.chmodSync(path.join(f.skill, 'scripts/run.sh'), 0o644);
  fails(f.validate(), /upstream executable mode mismatch for scripts\/run.sh/);
});

test('inherited notices must remain nonexecutable', (t) => {
  const f = fixture(t);
  fs.chmodSync(path.join(f.skill, 'upstream-licenses/LICENSE'), 0o755);
  fails(f.validate(), /upstream executable mode mismatch for upstream-licenses\/LICENSE/);
});

test('integrity paths cannot follow a symlinked directory to an identical outside file', (t) => {
  const f = fixture(t);
  const outside = path.join(f.dir, 'outside');
  fs.mkdirSync(outside);
  const script = 'identical bytes';
  fs.writeFileSync(path.join(outside, 'run.sh'), script);
  fs.symlinkSync(outside, path.join(f.skill, 'scripts'), 'dir');
  f.change('skills/orchestrator/fixture/SOURCE.json', (data) => {
    data.contentIntegrity.files['scripts/run.sh'] = digest(script);
  });
  assert.equal(f.rebuild().status, 0);
  fails(f.validate(), /missing or non-regular upstream file scripts\/run.sh \(symlink components are forbidden\)/);
});

test('executable paths must be safe, unique and recorded in upstream content', (t) => {
  const f = fixture(t);
  f.change('skills/orchestrator/fixture/SOURCE.json', (data) => {
    data.contentIntegrity.executablePaths = ['SKILL.md', 'SKILL.md', '../outside', 'unknown.sh'];
  });
  fails(f.validate(), /invalid or duplicate executablePaths entry/);
});
