const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Small independent catalog: tests stay deterministic while the real imports change.
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-skills-cli-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'bin'));
  fs.mkdirSync(path.join(root, 'registry'));
  fs.mkdirSync(path.join(root, 'lib'));
  fs.copyFileSync(path.resolve(__dirname, '../lib/export-layout.js'), path.join(root, 'lib/export-layout.js'));
  fs.copyFileSync(path.resolve(__dirname, '../bin/vibe-skills.js'), path.join(root, 'bin/vibe-skills.js'));
  fs.copyFileSync(path.resolve(__dirname, '../lib/catalog-policy.js'), path.join(root, 'lib/catalog-policy.js'));
  const skills = ['alpha', 'beta'].map((name) => ({
    id: `example/${name}`, name, displayName: name, domain: 'example', path: `skills/example/${name}`,
    description: `${name} workflow`, capabilities: [], origin: 'local-original', license: 'MIT',
  }));
  for (const skill of skills) {
    const dir = path.join(root, skill.path);
    fs.mkdirSync(path.join(dir, 'references'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), `# ${skill.name}\n`);
    fs.writeFileSync(path.join(dir, 'references/guide.md'), `Guide for ${skill.name}\n`);
    fs.writeFileSync(path.join(dir, 'SOURCE.json'), JSON.stringify({ id: skill.id, origin: 'local-original', license: 'MIT', licenseStatus: 'declared' }));
  }
  const registries = {
    skills: { generatedAt: '2026-11-17', skills },
    domains: { domains: [{ id: 'example', name: 'Example', skillCount: 2 }] },
    resources: { resources: [{ id: 'knip', name: 'Knip', description: 'Unused code detector', type: 'tool', tags: [], url: 'https://knip.dev/' }], categories: [] },
  };
  for (const [name, value] of Object.entries(registries)) fs.writeFileSync(path.join(root, `registry/${name}.json`), JSON.stringify(value));
  const project = path.join(root, 'project with spaces');
  const run = (...args) => spawnSync(process.execPath, [path.join(root, 'bin/vibe-skills.js'), ...args], { encoding: 'utf8', cwd: root });
  const exportSkill = (target, ids = 'example/alpha', ...extra) => {
    const result = run('export', '--target', target, '--ids', ids, '--out', project, '--json', ...extra);
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  return { root, project, skills, run, exportSkill };
}

test('JSON search returns resource-only, skill-only, and empty results with the same shape', (t) => {
  const { run } = fixture(t);
  const search = (query) => {
    const result = run('search', query, '--json');
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const resources = search('Knip');
  assert.equal(resources.query, 'knip');
  assert.deepEqual(resources.skills, []);
  assert.deepEqual(resources.resources.map((r) => r.id), ['knip']);
  assert.match(run('search', 'knip').stdout, /Knip/);
  const skills = search('alpha');
  assert.deepEqual(skills.skills.map((s) => s.id), ['example/alpha']);
  assert.deepEqual(skills.resources, []);
  assert.deepEqual(search('no-such-entry'), { query: 'no-such-entry', skills: [], resources: [] });
});

for (const [target, relative] of Object.entries({ claude: '.claude/skills', cursor: '.cursor/skills', antigravity: '.agents/skills', agents: '.agents/skills' })) {
  test(`${target}: exports recursive contents, retains exact copies, and preserves verified earlier installs`, (t) => {
    const { project, exportSkill } = fixture(t);
    const first = exportSkill(target);
    assert.equal(first.schemaVersion, '2.0.0');
    assert.deepEqual(first.skills, ['example/alpha']);
    assert.deepEqual(first.written, ['example/alpha']);
    assert.deepEqual(first.retained, []);
    assert.equal(fs.readFileSync(path.join(project, relative, 'alpha/references/guide.md'), 'utf8'), 'Guide for alpha\n');
    const second = exportSkill(target, 'example/beta');
    assert.deepEqual(second.skills, ['example/alpha', 'example/beta']);
    assert.deepEqual(second.written, ['example/beta']);
    const third = exportSkill(target, 'example/alpha,example/alpha');
    assert.deepEqual(third.requestedSkills, ['example/alpha']);
    assert.deepEqual(third.retained, ['example/alpha']);
    assert.deepEqual(third.written, []);
    assert.equal(third.verified.length, 2);
    for (const record of third.verified) assert.match(record.sha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(project, relative, 'vibe-skills.export.json'), 'utf8')), third);
  });
}

test('existing modified directories are skipped and excluded from verified install claims', (t) => {
  const { project, exportSkill } = fixture(t);
  exportSkill('agents');
  const file = path.join(project, '.agents/skills/alpha/SKILL.md');
  fs.writeFileSync(file, 'User modifications\n');
  const skipped = exportSkill('agents');
  assert.deepEqual(skipped.skills, []);
  assert.deepEqual(skipped.written, []);
  assert.deepEqual(skipped.retained, []);
  assert.equal(skipped.skipped[0].id, 'example/alpha');
  assert.equal(skipped.unverified[0].id, 'example/alpha');
  assert.equal(fs.readFileSync(file, 'utf8'), 'User modifications\n');
});

test('previously tracked directories are rechecked even when not selected in this run', (t) => {
  const { project, exportSkill } = fixture(t);
  exportSkill('agents');
  fs.unlinkSync(path.join(project, '.agents/skills/alpha/references/guide.md'));
  const result = exportSkill('agents', 'example/beta');
  assert.deepEqual(result.skills, ['example/beta']);
  assert.equal(result.unverified[0].id, 'example/alpha');
});

test('--force replaces the whole selected directory and preserves unrelated installs', (t) => {
  const { project, exportSkill } = fixture(t);
  exportSkill('agents', 'example/alpha,example/beta');
  const target = path.join(project, '.agents/skills');
  fs.writeFileSync(path.join(target, 'alpha/obsolete.txt'), 'obsolete');
  fs.writeFileSync(path.join(target, 'alpha/SKILL.md'), 'old version');
  fs.mkdirSync(path.join(target, 'unrelated'));
  fs.writeFileSync(path.join(target, 'unrelated/keep.txt'), 'keep');
  const result = exportSkill('agents', 'example/alpha', '--force');
  assert.deepEqual(result.skills, ['example/alpha', 'example/beta']);
  assert.deepEqual(result.written, ['example/alpha']);
  assert.equal(fs.existsSync(path.join(target, 'alpha/obsolete.txt')), false);
  assert.equal(fs.readFileSync(path.join(target, 'alpha/SKILL.md'), 'utf8'), '# alpha\n');
  assert.equal(fs.readFileSync(path.join(target, 'unrelated/keep.txt'), 'utf8'), 'keep');
  assert.ok(!fs.readdirSync(target).some((name) => name.startsWith('.vibe-skills-stage-')));
});

test('invalid and empty skill selections fail before creating output', (t) => {
  const { project, run } = fixture(t);
  for (const ids of ['example/alpha,does-not-exist', '', ',,,']) {
    const result = run('export', '--target', 'agents', '--ids', ids, '--out', project);
    assert.equal(result.status, 1);
    assert.equal(fs.existsSync(project), false);
  }
  for (const args of [
    ['export', '--target', 'agents', '--out', project, '--ids'],
    ['export', '--target', 'agents', '--ids', '--force'],
    ['export', '--target', 'agents', '--out', ''],
  ]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.equal(fs.existsSync(project), false);
  }
});

test('symlink destinations cannot redirect a forced replacement', (t) => {
  const { project, root, run } = fixture(t);
  const outside = path.join(root, 'unrelated');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'keep.txt'), 'keep');
  const dir = path.join(project, '.agents/skills');
  fs.mkdirSync(dir, { recursive: true });
  fs.symlinkSync(outside, path.join(dir, 'alpha'), 'dir');
  const result = run('export', '--target', 'agents', '--ids', 'example/alpha', '--out', project, '--force');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /destination is a symlink/);
  assert.equal(fs.readFileSync(path.join(outside, 'keep.txt'), 'utf8'), 'keep');
});

test('source overlap through an output ancestor symlink is rejected', (t) => {
  const { root, run } = fixture(t);
  fs.mkdirSync(path.join(root, 'overlap/.agents'), { recursive: true });
  fs.symlinkSync(path.join(root, 'skills/example'), path.join(root, 'overlap/.agents/skills'), 'dir');
  const result = run('export', '--target', 'agents', '--ids', 'example/alpha', '--out', path.join(root, 'overlap'), '--force');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /source and destination overlap/);
  assert.equal(fs.readFileSync(path.join(root, 'skills/example/alpha/SKILL.md'), 'utf8'), '# alpha\n');
});

test('exports cannot write inside an unselected source skill', (t) => {
  const { root, run } = fixture(t);
  const otherSource = path.join(root, 'skills/example/beta');
  const result = run('export', '--target', 'agents', '--ids', 'example/alpha', '--out', otherSource, '--force');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /source and destination overlap/);
  assert.equal(fs.existsSync(path.join(otherSource, '.agents')), false);
});

test('bulk exports require an intentional --all and cannot mix selections', (t) => {
  const { project, run } = fixture(t);
  const args = ['export', '--target', 'agents', '--out', project, '--json'];
  for (const extra of [[], ['--all', '--ids', 'example/alpha']]) {
    assert.equal(run(...args, ...extra).status, 1);
    assert.equal(fs.existsSync(project), false);
  }
  assert.deepEqual(JSON.parse(run(...args, '--all').stdout).written, ['example/alpha', 'example/beta']);
});
