'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const MAX_BYTES = 64 * 1024;
const TEXT_FILE = /\.(?:md|mdx|txt|json|ya?ml|toml|csv|tsv|sh|bash|zsh|ps1|py|js|cjs|mjs|ts|tsx|jsx|html|css|sql|xml|svg)$/i;

function readableRelative(file) {
  return file.length <= 512 && !file.includes('\\') &&
    file.split('/').every((part) => part && part !== 'node_modules' && !part.startsWith('.') && !/[\x00-\x1f:]/.test(part)) &&
    TEXT_FILE.test(file);
}

function listFiles(directory) {
  const files = [];
  function visit(absolute, prefix) {
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const relative = prefix + entry.name;
      if (entry.isDirectory()) visit(path.join(absolute, entry.name), relative + '/');
      else if (entry.isFile() && readableRelative(relative) &&
          relative !== 'SKILL.md' && relative !== 'SOURCE.json') files.push(relative);
    }
  }
  visit(directory, '');
  return files.sort();
}

function readSkillFile(directory, file) {
  if (!readableRelative(file) || file === 'SKILL.md' || file === 'SOURCE.json') {
    throw new Error('Use a relative text file path from get_skill. Use get_skill for instructions and provenance.');
  }
  const resolved = path.resolve(directory, file);
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile() || fs.realpathSync(resolved) !== path.join(fs.realpathSync(directory), ...file.split('/'))) {
    throw new Error('The requested file is not a regular file inside this skill.');
  }
  if (stat.size > MAX_BYTES) throw new Error('The file exceeds 64 KiB. Read it from a local skill checkout.');
  const buffer = fs.readFileSync(resolved);
  if (buffer.length > MAX_BYTES || buffer.includes(0)) throw new Error('The file is not supported as MCP text.');
  return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
}

module.exports = { listFiles, readSkillFile };
