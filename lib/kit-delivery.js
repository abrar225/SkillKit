'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { skills } = require('../registry/skills.json');
const { readEntry, skillDirectory } = require('./kit-reader');
const { mayDeliver, getResource, licenseEvidence } = require('./catalog-policy');
const { getFederatedSkill, fetchFederatedSkill, listFederated } = require('./federation');

const local = new Map(skills.map(skill => [skill.id, skill]));
const rootDir = path.resolve(__dirname, '..');
const handoffLimit = 12 * 1024;

function restricted(skill) {
  return { id: skill.id, delivery: 'metadata-only', license: skill.license || 'unverified',
    upstream: skill.upstream?.url || skill.upstream || null,
    reason: 'The catalog has no verified permission to deliver these instructions.' };
}

async function getSkill(id, file, root = rootDir) {
  const skill = local.get(id);
  if (!skill) {
    if (!getFederatedSkill(id)) throw new Error('Unknown skill. Use an exact ID from the kit.');
    const entry = await fetchFederatedSkill(id, file === undefined ? {} : { file });
    return entry.status === 'metadata-only' ? { ...entry, delivery: 'metadata-only' } : entry;
  }
  if (!mayDeliver(skill)) return restricted(skill);
  const entry = readEntry(root, id, file);
  if (file !== undefined) return entry;
  const evidence = licenseEvidence(skill);
  const dir = skillDirectory(root, id);
  entry.notices = evidence.files.map(name => ({ file: name, content: fs.readFileSync(path.join(dir, name), 'utf8') }));
  if (!entry.notices.length) {
    const original = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8');
    const content = skill.origin === 'local-original' ? original : [
      evidence.license + ' license declared by ' + evidence.author + ' in the pinned instructions.',
      original.slice(original.indexOf('Permission is hereby'), original.indexOf('This license covers')).trim(),
    ].join('\n\n');
    entry.notices.push({ file: 'SKILLKIT-LICENSE.txt', content });
  }
  return entry;
}

function archiveDirectory(id, root) {
  const skill = local.get(id);
  if (!skill || !mayDeliver(skill)) throw new Error('Verified local skill required for a native archive.');
  return skillDirectory(root, id);
}

function clip(text, limit) {
  if (Buffer.byteLength(text) <= limit) return text;
  const note = '\n[Truncated. Request the full item by ID.]';
  const bytes = Buffer.from(text);
  let end = Math.max(0, limit - Buffer.byteLength(note));
  while (end && (bytes[end] & 0xc0) === 0x80) end--;
  return bytes.subarray(0, end).toString() + note;
}

async function handoff(kit, root = rootDir) {
  const lines = ['SkillKit · ' + kit.status,
    ...(kit.question ? [kit.question] : []), ...(kit.gaps || []).map(g => 'Gap: ' + g),
    ...(kit.constraints || []).map(c => 'Constraint: ' + c),
    ...(kit.resources || []).map(r => r.name + ' · ' + r.url),
    ...(kit.stages || []).map(s => 'Verify ' + s.id + ' · ' + s.check)];
  const entries = kit.skills || [];
  const intro = clip(lines.join('\n'), handoffLimit / 2);
  const sections = [intro];
  const allowance = Math.floor((handoffLimit - Buffer.byteLength(intro) - 2 * entries.length) / Math.max(1, entries.length));
  for (const s of entries) {
    try {
      const detail = await getSkill(s.id, undefined, root);
      const source = detail.provenance?.upstream;
      const upstream = typeof source === 'string' ? source : source?.url || detail.provenance?.url || '';
      const attribution = [s.id, s.license, upstream, ...(detail.notices || []).map(n => n.content)].filter(Boolean).join('\n');
      const free = allowance - Buffer.byteLength(attribution) - 1;
      if (free > 200) sections.push(attribution + '\n' + clip(detail.instructions || detail.reason || '', free));
      else sections.push(clip(s.id + ' · ' + s.license + ' ' + upstream + '\n[Truncated. Retrieve the full item by ID for instructions and license notices.]', allowance));
    } catch {
      sections.push(clip(s.id + '\nInstructions unavailable. Retrieve this item separately before applying it.', allowance));
    }
  }
  return clip(sections.join('\n\n'), handoffLimit);
}

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function treeHash(dir) {
  const records = [];
  function visit(relative) {
    for (const e of fs.readdirSync(path.join(dir, relative), { withFileTypes: true }).sort((a,b) => a.name < b.name ? -1 : 1)) {
      const name = path.join(relative, e.name);
      if (e.isDirectory()) visit(name);
      else if (e.isFile()) {
        const target = path.join(dir, name);
        records.push([name, fs.statSync(target).mode & 0o111, digest(fs.readFileSync(target))]);
      } else throw new Error('Unsupported skill asset: ' + name);
    }
  }
  visit('');
  return digest(JSON.stringify(records));
}

function makeLock(kit, root = rootDir) {
  return { version: 1, skills: (kit.skills || []).map(({id}) => {
    const localSkill = local.get(id);
    if (localSkill) {
      const dir = archiveDirectory(id, root);
      const source = JSON.parse(fs.readFileSync(path.join(dir, 'SOURCE.json'), 'utf8'));
      return { id, commit: source.upstream?.commit || null, sha256: treeHash(dir) };
    }
    const entry = getFederatedSkill(id);
    if (!entry || !listFederated().some(s => s.id === id)) throw new Error('Unavailable pin: ' + id);
    return { id, upstream: entry.upstream, sha256: entry.checksum, assets: entry.skillAssets, notices: entry.licenseEvidence };
  }), resources: (kit.resources || []).map(({id}) => ({ id, sha256: digest(JSON.stringify(getResource(id))) })) };
}

function verifyLock(data) {
  if (data.version !== 1 || !Array.isArray(data.skills) || !Array.isArray(data.resources)) throw new Error('Invalid kit lock.');
  if (JSON.stringify(makeLock(data)) !== JSON.stringify(data)) throw new Error('Catalog pins differ from the lock.');
  return { verified: true, skills: data.skills.length, resources: data.resources.length };
}

function reportOutcome({ consent, result, ids = [] }) {
  if (consent !== true) throw new Error('Explicit consent is required to share an outcome.');
  if (!['useful','mixed','unhelpful'].includes(result) || !Array.isArray(ids) || ids.length > 12 ||
      ids.some(id => typeof id !== 'string' || !(local.has(id) || getFederatedSkill(id) || getResource(id)))) throw new Error('Invalid outcome or reference ID.');
  const file = process.env.SKILLKIT_OUTCOME_FILE;
  if (!file) return { recorded: false, reason: 'The operator has disabled outcome collection.' };
  fs.appendFileSync(file, JSON.stringify({ result, ids: [...new Set(ids)], date: new Date().toISOString().slice(0,10) })+'\n',
    { mode: 0o600, flag: fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_NOFOLLOW });
  return { recorded: true };
}

module.exports = { getSkill, archiveDirectory, handoff, handoffLimit, makeLock, verifyLock, getResource, reportOutcome, restricted };
