'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createAdapters, refreshCatalog } = require('../lib/federation-refresh');
const { mirrorPath, readMirror, readSnapshot, snapshotPath } = require('../lib/federation');
const reviewed = require('../catalog/federated/reviewed.json');

function writeAtomic(target, data) {
  const temporary = target + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(temporary, data, { flag: 'wx' });
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

async function main() {
  const output = process.argv[2];
  if (process.argv.length > 3 || (output && output.startsWith('-') && output !== '--write')) {
    throw new Error('Usage: node scripts/refresh-federation.js [--write|output.json]');
  }
  const previous = readSnapshot();
  const mirror = new Map();
  for (const entry of previous.entries) {
    for (const sha of entry.status === 'approved' ? entry.mirror || [] : []) {
      const content = readMirror(sha);
      if (content) mirror.set(sha, content);
    }
  }
  const next = await refreshCatalog({ reviewed: reviewed.entries, previous, adapters: createAdapters(), mirror });
  const json = JSON.stringify(next, null, 2) + '\n';
  if (output) {
    const target = output === '--write' ? snapshotPath : path.resolve(output);
    if (output === '--write') {
      fs.mkdirSync(mirrorPath, { recursive: true });
      const active = new Set(next.entries.filter(({ status }) => status === 'approved').flatMap((entry) => entry.mirror || []));
      for (const sha of active) {
        const bytes = mirror.get(sha);
        if (!bytes) throw new Error('An approved mirror pin is missing verified bytes.');
        if (!readMirror(sha)) writeAtomic(path.join(mirrorPath, sha), bytes);
      }
    }
    writeAtomic(target, json);
  } else process.stdout.write(json);
  const priorById = new Map(previous.entries.map((entry) => [entry.id, entry]));
  const materialChange = (entry) => {
    const prior = priorById.get(entry.id);
    return !prior || ['status', 'checksum', 'license', 'reason', 'validity', 'mirror'].some((key) =>
      JSON.stringify(prior[key]) !== JSON.stringify(entry[key]));
  };
  const changed = next.entries.filter(materialChange).map(({ id, status, reason }) => ({ id, status, reason }));
  process.stderr.write(JSON.stringify({ sources: next.sources, funnel: next.funnel, changed }, null, 2) + '\n');
}

main().catch((error) => {
  console.error('Federation refresh failed: ' + error.message);
  process.exitCode = 1;
});
