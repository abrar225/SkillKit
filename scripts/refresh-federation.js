'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createAdapters, refreshCatalog } = require('../lib/federation-refresh');
const { readSnapshot, snapshotPath } = require('../lib/federation');
const reviewed = require('../catalog/federated/reviewed.json');

async function main() {
  const output = process.argv[2];
  if (process.argv.length > 3 || (output && output.startsWith('-') && output !== '--write')) {
    throw new Error('Usage: node scripts/refresh-federation.js [--write|output.json]');
  }
  const previous = readSnapshot();
  const next = await refreshCatalog({ reviewed: reviewed.entries, previous, adapters: createAdapters() });
  const json = JSON.stringify(next, null, 2) + '\n';
  if (output) {
    const target = output === '--write' ? snapshotPath : path.resolve(output);
    const temporary = target + '.' + process.pid + '.tmp';
    try {
      fs.writeFileSync(temporary, json, { flag: 'wx' });
      fs.renameSync(temporary, target);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  } else process.stdout.write(json);
  const priorById = new Map(previous.entries.map((entry) => [entry.id, entry]));
  const materialChange = (entry) => {
    const prior = priorById.get(entry.id);
    return !prior || ['status', 'checksum', 'license', 'reason'].some((key) => prior[key] !== entry[key]);
  };
  const changed = next.entries.filter(materialChange).map(({ id, status, reason }) => ({ id, status, reason }));
  process.stderr.write(JSON.stringify({ sources: next.sources, entries: next.entries.length, changed }, null, 2) + '\n');
}

main().catch((error) => {
  console.error('Federation refresh failed: ' + error.message);
  process.exitCode = 1;
});
