'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
  createAdapters,
  expandedCodeQueries,
  expandedSkillsmpQueries,
  expandedTopicQueries,
  maxInventory,
  refreshCatalog,
} = require('../lib/federation-refresh');
const { mirrorPath, readMirror, readSnapshot, snapshotPath } = require('../lib/federation');
const reviewed = require('../catalog/federated/reviewed.json');

function resolveGithubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    }).trim() || undefined;
  } catch {
    return undefined;
  }
}

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
  // Keep token purely in memory; never log, write to disk, or serialize.
  const token = resolveGithubToken();
  const env = token ? { ...process.env, GITHUB_TOKEN: token } : { ...process.env };
  const adapters = createAdapters({
    env,
    topicQueries: expandedTopicQueries,
    codeQueries: expandedCodeQueries,
    skillsmpQueries: expandedSkillsmpQueries,
    awesomeRepoLimit: 120,
    skipSkillsSh: true,
    inventoryLimit: maxInventory,
  });
  const next = await refreshCatalog({ reviewed: reviewed.entries, previous, adapters, mirror, autoVerify: true });
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
      for (const file of fs.readdirSync(mirrorPath)) {
        if (!active.has(file)) fs.unlinkSync(path.join(mirrorPath, file));
      }
    }
    writeAtomic(target, json);
  } else process.stdout.write(json);
  const priorById = new Map(previous.entries.map((entry) => [entry.id, entry]));
  const materialChange = (entry) => {
    const prior = priorById.get(entry.id);
    return !prior || ['status', 'trustTier', 'checksum', 'license', 'reason', 'validity', 'mirror'].some((key) =>
      JSON.stringify(prior[key]) !== JSON.stringify(entry[key]));
  };
  const changed = next.entries.filter(materialChange).map(({ id, status, trustTier, license, reason }) => ({ id, status, trustTier, license, reason }));
  process.stderr.write(JSON.stringify({ sources: next.sources, funnel: next.funnel, changedCount: changed.length }, null, 2) + '\n');
}

main().catch((error) => {
  console.error('Federation refresh failed: ' + error.message);
  process.exitCode = 1;
});
