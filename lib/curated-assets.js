'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { skills } = require('../registry/skills.json');
const localAssets = require('../catalog/local-assets.json');
const { fallbackNotice, licenseEvidence } = require('./catalog-policy');

const byId = new Map(skills.map(skill => [skill.id, skill]));

function readAsset(dir, name, maxBytes = Infinity) {
  if (typeof name !== 'string' || name.includes('\\') ||
      name.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Invalid curated asset path.');
  }
  const target = path.join(dir, name);
  const info = fs.lstatSync(target);
  if (!info.isFile() || fs.realpathSync(target) !== target) throw new Error('Expected a regular curated file: ' + name);
  if (info.size > maxBytes) throw new Error('The file exceeds 64 KiB. Read it from a local skill checkout.');
  const data = fs.readFileSync(target);
  if (data.length > maxBytes) throw new Error('The file exceeds 64 KiB. Read it from a local skill checkout.');
  return { name, data, mode: info.mode & 0o777 };
}

function curatedInventory(root, id) {
  const skill = byId.get(id);
  const evidence = licenseEvidence(skill);
  if (!evidence) throw new Error('Verified local skill required for a native archive or export.');
  const dir = path.join(fs.realpathSync(root), skill.path);
  const provenance = readAsset(dir, 'SOURCE.json');
  const source = JSON.parse(provenance.data);
  if (source.id !== id) throw new Error('Curated source ID does not match: ' + id);
  const inventory = localAssets[id] || source.contentIntegrity?.files;
  if (!inventory || !Object.hasOwn(inventory, 'SKILL.md')) throw new Error('Missing curated inventory for ' + id);
  const expected = new Map(Object.entries(inventory));
  for (const { localPath, sha256 } of source.licenseFiles || []) expected.set(localPath, sha256);
  const executablePaths = new Set(source.contentIntegrity?.executablePaths);
  if (expected.has(provenance.name)) throw new Error('Duplicate curated asset: ' + provenance.name);
  for (const file of evidence.files) {
    if (!expected.has(file)) throw new Error('Missing curated license notice: ' + file);
  }
  function read(name, maxBytes) {
    if (!expected.has(name)) throw new Error('Use a relative text file path from get_skill. Use get_skill for instructions and provenance.');
    const asset = readAsset(dir, name, maxBytes);
    const digest = createHash('sha256').update(asset.data).digest('hex');
    if (digest !== expected.get(name)) throw new Error('Curated asset differs from its recorded checksum: ' + name);
    if (source.contentIntegrity && Boolean(asset.mode & 0o111) !== executablePaths.has(name)) {
      throw new Error('Curated asset differs from its recorded executable mode: ' + name);
    }
    return asset;
  }
  return { skill, source, provenance, noticeFiles: evidence.files, files: [...expected.keys()].sort(), read,
    fallback: () => fallbackNotice(root, skill, evidence) };
}

function readCuratedAssets(root, id, { publicSource = false } = {}) {
  const inventory = curatedInventory(root, id);
  const { source, provenance } = inventory;
  if (publicSource && Object.hasOwn(source, 'originalPath')) {
    delete source.originalPath;
    provenance.data = Buffer.from(JSON.stringify(source, null, 2) + '\n');
  }
  const assets = [provenance, ...inventory.files.map(name => inventory.read(name))];
  let generatedNotice;
  if (!inventory.noticeFiles.length) {
    const { file, content } = inventory.fallback();
    if (inventory.files.includes(file)) throw new Error('Duplicate curated license notice: ' + file);
    generatedNotice = { name: file, data: Buffer.from(content), mode: 0o644 };
  }
  return { assets, generatedNotice };
}

function writeAsset(directory, { name, data, mode }) {
  const target = path.join(directory, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data, { flag: 'wx', mode });
  fs.chmodSync(target, mode);
}

module.exports = { curatedInventory, readCuratedAssets, writeAsset };
