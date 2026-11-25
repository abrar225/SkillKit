'use strict';

const { curatedInventory } = require('./curated-assets');
const { isSupportingText, readSkillText } = require('./skill-files');

function readEntry(root, id, file) {
  const inventory = curatedInventory(root, id);
  const { skill, source, noticeFiles } = inventory;
  if (file !== undefined) return { id, file, content: readSkillText(inventory, file) };
  const supportingFiles = inventory.files.filter(isSupportingText);
  return {
    id, instructions: inventory.read('SKILL.md').data.toString('utf8'),
    provenance: { origin: source.origin, license: source.license, upstream: source.upstream || null,
      ...(source.url ? { url: source.url } : {}), sourcePath: skill.path + '/SOURCE.json' },
    supportingFiles: supportingFiles.slice(0, 60), supportingFileCount: supportingFiles.length,
    notices: noticeFiles.length ? noticeFiles.map(file => ({ file, content: inventory.read(file).data.toString('utf8') })) : [inventory.fallback()],
  };
}

module.exports = { readEntry };
