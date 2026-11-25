'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { skills } = require('../registry/skills.json');
const { resources } = require('../registry/resources.json');

const root = path.join(__dirname, '..');
const skillById = new Map(skills.map((skill) => [skill.id, skill]));
const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
// SPDX license IDs that are freely redistributable with attribution (or public-domain dedication).
// BSL-1.0 (Boost Software License 1.0) is included; BUSL-1.1 (Business Source License 1.1) is excluded.
const permissive = new Set([
  '0BSD', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'BSL-1.0', 'CC0-1.0',
  'CC-BY-4.0', 'ISC', 'MIT', 'MIT-0', 'Unlicense', 'Zlib',
]);

function isPermissive(license) {
  return permissive.has(license);
}

function licenseEvidence(skill) {
  const local = skillById.get(typeof skill === 'string' ? skill : skill?.id);
  if (!local || !isPermissive(local.license)) return null;
  try {
    const sourcePath = local.path + '/SOURCE.json';
    const source = JSON.parse(fs.readFileSync(path.join(root, sourcePath), 'utf8'));
    const declaredId = source.license?.match(/^([\w.-]+)(?: \(per-skill (?:LICENSE\.txt|frontmatter)\))?$/)?.[1];
    if (source.id !== local.id || source.origin !== local.origin || declaredId !== local.license ||
        !['declared', 'declared-in-readme'].includes(source.licenseStatus)) return null;
    const files = [
      ...(source.licenseFiles || []).map((file) => file.localPath),
      ...Object.keys(source.contentIntegrity?.files || {}).filter((file) => /^(?:LICENSE|COPYING|NOTICE)(?:\.|$)/i.test(file)),
    ];
    let author;
    if (!files.length && local.origin !== 'local-original') {
      const body = fs.readFileSync(path.join(root, local.path, 'SKILL.md'), 'utf8');
      const header = body.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || '';
      if (header.match(/^license:\s*([^\n]+)$/m)?.[1].trim() !== local.license) return null;
      author = header.match(/^\s*author:\s*([^\n]+)$/m)?.[1].trim() || source.upstream?.repo;
      if (!author) return null;
    }
    return { license: local.license, sourcePath, upstream: source.upstream, files, author };
  } catch {
    return null;
  }
}

function mayDeliver(skill) {
  return licenseEvidence(skill) !== null;
}

function getResource(id) {
  return resourceById.get(id) || null;
}

function fallbackNotice(catalogRoot, skill, evidence) {
  const original = fs.readFileSync(path.join(catalogRoot, 'LICENSE'), 'utf8');
  const content = skill.origin === 'local-original' ? original : [
    evidence.license + ' license declared by ' + evidence.author + ' in the pinned instructions.',
    original.slice(original.indexOf('Permission is hereby'), original.indexOf('This license covers')).trim(),
  ].join('\n\n');
  return { file: 'SKILLKIT-LICENSE.txt', content };
}

module.exports = { fallbackNotice, getResource, isPermissive, licenseEvidence, mayDeliver };
