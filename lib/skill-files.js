'use strict';

const { TextDecoder } = require('node:util');

const MAX_BYTES = 64 * 1024;
const TEXT_FILE = /\.(?:md|mdx|txt|json|ya?ml|toml|csv|tsv|sh|bash|zsh|ps1|py|js|cjs|mjs|ts|tsx|jsx|html|css|sql|xml|svg)$/i;

function isSupportingText(file) {
  return file.length <= 512 && !file.includes('\\') &&
    file.split('/').every((part) => part && part !== 'node_modules' && !part.startsWith('.') && !/[\x00-\x1f:]/.test(part)) &&
    TEXT_FILE.test(file) && file !== 'SKILL.md' && file !== 'SOURCE.json';
}

function readSkillText(inventory, file) {
  if (!isSupportingText(file)) {
    throw new Error('Use a relative text file path from get_skill. Use get_skill for instructions and provenance.');
  }
  const { data: buffer } = inventory.read(file, MAX_BYTES);
  if (buffer.includes(0)) throw new Error('The file is not supported as MCP text.');
  return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
}

module.exports = { isSupportingText, readSkillText };
