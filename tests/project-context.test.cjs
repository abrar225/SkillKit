'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { detect } = require('../lib/project-context');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillkit-project-context-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('project detection returns known labels from root manifests only', (t) => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'package.json'), '\uFEFF' + JSON.stringify({
    scripts: { dev: 'next dev' },
    dependencies: { react: 'test-version', 'react-native': 'test-version', 'private-package': 'secret' },
    devDependencies: { typescript: 'test-version' },
  }));
  fs.writeFileSync(path.join(root, 'pubspec.yaml'), 'name: app\r\ndependencies:\r\n  flutter:\r\n    sdk: "flutter" # comment\r\n');
  fs.writeFileSync(path.join(root, 'Package.swift'), '// sample manifest\n');
  const nested = fs.mkdirSync(path.join(root, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(nested, 'go.mod'), 'module nested\n');
  assert.equal(detect(root), 'React, React Native, TypeScript, Flutter, Swift');
});

test('project detection ignores malformed, oversized, and non-Flutter manifests', (t) => {
  const root = fixture(t);
  const pkg = path.join(root, 'package.json');
  fs.writeFileSync(pkg, '{');
  fs.writeFileSync(path.join(root, 'pubspec.yaml'), 'name: plain_dart\nenvironment:\n  sdk: ">=3.0.0"\n');
  fs.writeFileSync(path.join(root, 'Cargo.toml'), '[package]\nname = "helper"\n');
  assert.equal(detect(root), 'Rust');
  fs.writeFileSync(pkg, JSON.stringify({ dependencies: { next: 'x'.repeat(128 * 1024) } }));
  assert.equal(detect(root), 'Rust');
  assert.throws(() => detect(pkg), { message: 'Project must be a directory.' });
});

test('project detection ignores symlinks and directories named as manifests', (t) => {
  const root = fixture(t);
  const source = path.join(root, 'source');
  fs.writeFileSync(source, '{"dependencies":{"react-native":"test-version"}}');
  fs.symlinkSync(source, path.join(root, 'package.json'), 'file');
  fs.symlinkSync(source, path.join(root, 'Package.swift'), 'file');
  fs.mkdirSync(path.join(root, 'pyproject.toml'));
  assert.equal(detect(root), '');
});
