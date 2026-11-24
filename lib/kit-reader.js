'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { skills } = require('../registry/skills.json');
const { listFiles, readSkillFile } = require('./skill-files');

const byId = new Map(skills.map((skill) => [skill.id, skill]));
function skillDirectory(root, id) {
  const skill = byId.get(id);
  if (!skill) throw new Error('Unknown skill. Use the exact ID from the kit.');
  return path.join(root, skill.path);
}

function readEntry(root, id, file) {
  const dir = skillDirectory(root, id);
  const skill = byId.get(id);
  if (file !== undefined) return { id, file, content: readSkillFile(dir, file) };
  const source = JSON.parse(fs.readFileSync(path.join(dir, 'SOURCE.json'), 'utf8'));
  const supportingFiles = listFiles(dir);
  return {
    id, instructions: fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8'),
    provenance: { origin: source.origin, license: source.license, upstream: source.upstream || null,
      ...(source.url ? { url: source.url } : {}), sourcePath: skill.path + '/SOURCE.json' },
    supportingFiles: supportingFiles.slice(0, 60), supportingFileCount: supportingFiles.length,
  };
}

module.exports = { readEntry, skillDirectory };
