'use strict';

const fs = require('node:fs');
const path = require('node:path');

const maxManifestBytes = 128 * 1024;
const javascriptTools = {
  next: 'Next.js', react: 'React', 'react-native': 'React Native', vue: 'Vue', svelte: 'Svelte',
  remotion: 'Remotion', three: 'Three.js', astro: 'Astro', typescript: 'TypeScript', '@angular/core': 'Angular',
};
const indicators = [
  ['Package.swift', 'Swift'], ['Cargo.toml', 'Rust'], ['go.mod', 'Go'], ['pyproject.toml', 'Python'],
];

function regularFile(filename) {
  return fs.lstatSync(filename, { throwIfNoEntry: false })?.isFile() ?? false;
}

function readManifest(filename) {
  if (!regularFile(filename)) return '';
  const { O_RDONLY, O_NOFOLLOW, O_NONBLOCK } = fs.constants;
  let fd;
  try {
    fd = fs.openSync(filename, O_RDONLY | O_NOFOLLOW | O_NONBLOCK);
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > maxManifestBytes) return '';
    const data = Buffer.alloc(stat.size + 1);
    const bytes = fs.readSync(fd, data, 0, data.length, 0);
    return bytes === stat.size ? data.toString('utf8', 0, bytes) : '';
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ELOOP') return '';
    throw error;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function javascriptDependencies(root) {
  const content = readManifest(path.join(root, 'package.json'));
  if (!content) return {};
  try {
    const manifest = JSON.parse(content.replace(/^\uFEFF/, ''));
    return { ...manifest?.dependencies, ...manifest?.devDependencies };
  } catch (error) {
    if (error instanceof SyntaxError) return {};
    throw error;
  }
}

// Project context comes from root-level manifests and returns technology labels.
function detect(directory) {
  const root = fs.realpathSync(directory);
  if (!fs.statSync(root).isDirectory()) throw new Error('Project must be a directory.');
  const result = [];
  const dependencies = javascriptDependencies(root);
  for (const [name, label] of Object.entries(javascriptTools)) {
    if (Object.hasOwn(dependencies, name)) result.push(label);
  }
  const pubspec = readManifest(path.join(root, 'pubspec.yaml'));
  // A pubspec is also used by non-Flutter Dart packages.
  if (/^flutter:[ \t]*(?:[#{]|\r?$)|^ +sdk:[ \t]*(?:flutter|'flutter'|"flutter")[ \t]*(?:#|\r?$)/m.test(pubspec)) {
    result.push('Flutter');
  }
  for (const [file, label] of indicators) {
    if (regularFile(path.join(root, file))) result.push(label);
  }
  return result.join(', ');
}
module.exports = { detect };
