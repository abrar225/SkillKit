'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { skills } = require('../registry/skills.json');
const { readEntry } = require('./kit-reader');
const { mayDeliver, getResource } = require('./catalog-policy');
const { getFederatedSkill, fetchFederatedSkill, listFederated } = require('./federation');
const { curatedInventory } = require('./curated-assets');
const { focusedSkill } = require('./focused-skill');

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
  return readEntry(root, id, file);
}

function clip(text, limit) {
  if (Buffer.byteLength(text) <= limit) return text;
  const note = '\n[Truncated. Request the full item by ID.]';
  const bytes = Buffer.from(text);
  let end = Math.max(0, limit - Buffer.byteLength(note));
  while (end && (bytes[end] & 0xc0) === 0x80) end--;
  return bytes.subarray(0, end).toString() + note;
}

async function handoff(kit, root = rootDir, packs = [], focus = '') {
  const lines = ['SkillKit · ' + kit.status,
    ...(kit.question ? [kit.question] : []), ...(kit.gaps || []).map(g => 'Gap: ' + g),
    ...(kit.constraints || []).map(c => 'Constraint: ' + c),
    ...(kit.resources || []).map(r => r.name + ' · ' + r.url),
    ...(kit.stages || []).map(s => 'Verify ' + s.id + ' · ' + s.check)];
  for (const pack of packs.slice(0, 3)) {
    if (!pack || typeof pack !== 'object') continue;
    lines.push(pack.title);
    for (const anchor of (pack.tasteAnchors || []).slice(0,2)) lines.push('Reference example · ' + anchor.example + ' ' + anchor.test);
    for (const item of (pack.antiPatterns || []).slice(0,2)) lines.push('Avoid · ' + item);
    for (const check of (pack.checks || []).slice(0,2)) lines.push('Check · ' + check);
    for (const ref of (pack.references || []).slice(0,3)) lines.push(ref.name + ' · ' + ref.url);
  }
  const entries = kit.skills || [];
  const intro = clip(lines.join('\n'), handoffLimit / 2);
  const sections = [intro];
  const allowance = Math.floor((handoffLimit - Buffer.byteLength(intro) - 2 * entries.length) / Math.max(1, entries.length));
  for (const s of entries) {
    try {
      const detail = await getSkill(s.id, undefined, root);
      const source = detail.provenance?.upstream;
      const upstream = typeof source === 'string' ? source : source?.url || detail.provenance?.url || '';
      const header = [s.id, s.license, upstream].filter(Boolean).join(' · ');
      const noticeText = (detail.notices || []).map(n => n.content).filter(Boolean).join('\n\n');
      const noticeCost = noticeText ? Buffer.byteLength(noticeText) + 2 : 0;
      const free = allowance - Buffer.byteLength(header) - 1;
      const bodyBudget = Math.max(200, free - noticeCost);
      let body = detail.instructions || detail.reason || '';
      if (focus && detail.instructions && Buffer.byteLength(detail.instructions) > bodyBudget) {
        const focused = focusedSkill(detail, focus, { limit: Math.min(bodyBudget, 4500), maxBlocks: 8 });
        if (focused.excerpt && focused.instructions) {
          const headAnchor = focused.instructions.split('\n\n')[0].replace(/^#{1,4}\s+[^\n]*\n/, '');
          const offset = headAnchor ? detail.instructions.indexOf(headAnchor) : -1;
          if (offset < 0 || offset > bodyBudget * 0.5) {
            body = focused.instructions + '\n[Focused excerpt. Retrieve full skill by ID if more detail is needed.]';
          }
        }
      }
      if (free > 200) {
        const bodyOut = clip(body, bodyBudget);
        const tail = noticeText && Buffer.byteLength(header + '\n' + bodyOut + '\n\n' + noticeText) <= allowance ? '\n\n' + noticeText : '';
        sections.push(header + '\n' + bodyOut + tail);
      } else {
        sections.push(clip(header + '\n[Truncated. Retrieve the full item by ID for instructions and license notices.]', allowance));
      }
    } catch {
      sections.push(clip(s.id + '\nInstructions unavailable. Retrieve this item separately before applying it.', allowance));
    }
  }
  return clip(sections.join('\n\n'), handoffLimit);
}

function handoffFor(input, root = rootDir) {
  const explanation = require('./task-kit').explainKit(input);
  const focus = typeof input === 'string' ? input : input?.task || '';
  return handoff(explanation.kit, root, explanation.packs, focus);
}

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function treeHash(inventory) {
  // Keep the depth-first relative path ordering of version 1 locks.
  const ordered = name => name.replaceAll('/', '\0');
  const records = [inventory.provenance, ...inventory.files.map(name => inventory.read(name))]
    .sort((a, b) => ordered(a.name) < ordered(b.name) ? -1 : 1)
    .map(({ name, mode, data }) => [name.split('/').join(path.sep), mode & 0o111, digest(data)]);
  return digest(JSON.stringify(records));
}

function makeLock(kit, root = rootDir) {
  return { version: 1, skills: (kit.skills || []).map(({id}) => {
    const localSkill = local.get(id);
    if (localSkill) {
      const inventory = curatedInventory(root, id);
      return { id, commit: inventory.source.upstream?.commit || null, sha256: treeHash(inventory) };
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

module.exports = { getSkill, handoff, handoffFor, handoffLimit, makeLock, verifyLock, getResource, reportOutcome, restricted };
