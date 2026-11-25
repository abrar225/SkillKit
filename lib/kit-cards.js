'use strict';

const { createHash } = require('node:crypto');
const { assemble, buildKit, inputSchema } = require('./task-kit');
const { searchUpstream } = require('./upstream-search');

const cardLimit = 2048;
const candidateLimit = 8;
const idPattern = /^kit3-[a-f0-9]{32}$/;
const cardInputSchema = { ...inputSchema, properties: { ...inputSchema.properties, upstream: { type: 'boolean' } } };
const getKitSchema = {
  type: 'object',
  properties: {
    kitId: { type: 'string', pattern: idPattern.source },
    request: cardInputSchema,
  },
  required: ['kitId', 'request'],
  additionalProperties: false,
};

// Bound the actual MCP response, including the text fallback and JSON-RPC framing.
function discoveryResult(card) {
  const text = card.kitId ? card.status + ' · ' + card.kitId +
    '. Call get_kit with this ID and the original request.' :
    card.question || card.gaps?.[0] || 'No matching kit.';
  return { structuredContent: card, content: [{ type: 'text', text }] };
}
function responseBytes(card) {
  return Buffer.byteLength(JSON.stringify({ jsonrpc: '2.0', id: 1, result: discoveryResult(card) }));
}
const fits = card => responseBytes(card) <= cardLimit;
const ids = (items) => items.map(({ id }) => id);
const short = (text, length) => Array.from(text).length > length ?
  Array.from(text).slice(0, length - 1).join('') + '…' : text;

function kitId(kit, covers) {
  if (!kit.stages.length) return null;
  // Only stable catalog IDs and normalized constraints enter a selection ID.
  const footprint = [
    kit.status, [...kit.constraints].sort(), covers.map(({ kind, candidate }) => [kind, candidate]),
    kit.stages.map(({ id, skills, resources }) => [id, skills, resources]),
  ];
  return 'kit3-' + createHash('sha256').update(JSON.stringify(footprint)).digest('hex').slice(0, 32);
}

function variants({ ranked, contract, kit, covers }) {
  const primary = { kit, kitId: kitId(kit, covers) };
  if (!primary.kitId) return [primary];
  const choices = ranked.map(([best]) => best);
  const distinct = new Set([JSON.stringify([ids(kit.skills), ids(kit.resources)])]);
  const results = [primary];
  // Substitute one eligible choice at a time so compound kits retain coverage
  // of each other required output. Consider the next rank across all outputs.
  for (let rank = 1; rank < Math.max(...ranked.map((items) => items.length)); rank++) {
    for (const [index, options] of ranked.entries()) {
      const choice = options[rank];
      if (!choice || choice.gaps.length > choices[index].gaps.length) continue;
      const selection = [...choices];
      selection[index] = choice;
      const { kit: alternative, covers: coverage } = buildKit(contract, selection);
      const refs = JSON.stringify([ids(alternative.skills), ids(alternative.resources)]);
      if (distinct.has(refs)) continue;
      distinct.add(refs);
      results.push({ kit: alternative, kitId: kitId(alternative, coverage), choice });
      if (results.length === candidateLimit) return results;
    }
  }
  return results;
}

function summarize({ kit, kitId: id, choice }) {
  return {
    kitId: id,
    title: short(choice.match.candidate.title || choice.match.candidate.id, 38),
    status: kit.status,
    skills: ids(kit.skills).slice(0, 3),
    resources: ids(kit.resources).slice(0, 2),
    check: short(choice.stages[0].check, 40),
    ...(kit.gaps?.length ? { misses: short(kit.gaps[0], 45) } : {}),
  };
}

function compact(primary, alternatives) {
  const { kit, kitId } = primary;
  const card = { version: 3, kitId, ...kit };
  if (card.question) {
    card.question = short(card.question, 160);
    if (card.choices?.length) card.defaultWorkflow = card.choices[0].id;
  }
  if (card.gaps) {
    card.gaps = card.gaps.slice(0, 4).map((gap) => short(gap, 130));
    if (card.gaps.length !== kit.gaps.length) card.more = true;
  }
  const hasManyAlternatives = alternatives.length >= 2;
  if (alternatives.length && (hasManyAlternatives || !fits({ ...card, alternatives: alternatives.map(summarize) }))) {
    card.skills = card.skills.map(({ id, license }) => ({ id, license }));
    card.resources = card.resources.map(({ id, name, pricing }) => ({ id, name, pricing }));
    card.stages = card.stages.map(({ id, skills, resources, check }) =>
      ({ id, skills, resources, check: short(check, 60) }));
    card.more = true;
  }
  if (!fits(card) || (alternatives.length >= 4 && responseBytes(card) > 900)) {
    card.stages = card.stages.map(({ id, check }) => ({ id, check: short(check, 48) }));
    card.resources = card.resources.map(({ id, name, pricing }) => ({ id, name, pricing }));
    card.skills = card.skills.map(({ id, license }) => ({ id, license }));
    card.more = true;
  }
  while (!fits(card) && (card.stages.length || card.skills.length || card.resources.length)) {
    if (card.stages.length) card.stages.pop();
    else if (card.resources.length >= card.skills.length) card.resources.pop();
    else card.skills.pop();
  }
  for (const alternative of alternatives.map(summarize)) {
    const next = [...(card.alternatives || []), alternative];
    if (fits({ ...card, alternatives: next })) card.alternatives = next;
    else break;
  }
  return card;
}

function cardSelection(input = {}, options) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      (Object.hasOwn(input, 'upstream') && typeof input.upstream !== 'boolean')) throw new Error('Invalid kit request.');
  const { upstream, ...request } = input;
  return assemble(request, options);
}

function findKitCards(input, options) {
  const [primary, ...alternatives] = variants(cardSelection(input, options));
  return compact(primary, alternatives);
}

async function discoverKitCards(input, options) {
  if (input?.upstream !== true) return findKitCards(input, options);
  const assembled = cardSelection(input, options);
  const [primary, ...alternatives] = variants(assembled);
  const card = compact(primary, alternatives);
  if (card.status === 'ready') return card;
  const discovery = await searchUpstream(assembled.contract, assembled.covers, options);
  for (const item of discovery) {
    const next = [...(card.discovery || []), item];
    if (fits({ ...card, discovery: next })) card.discovery = next;
    else break;
  }
  return card;
}

function getKit(input, options) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
    Object.keys(input).some((key) => key !== 'kitId' && key !== 'request') ||
    typeof input.kitId !== 'string' || !idPattern.test(input.kitId) || !Object.hasOwn(input, 'request')) {
    throw new Error('Pass a kit ID and its original routing request.');
  }
  const [primary, ...alternatives] = variants(cardSelection(input.request, options));
  const card = compact(primary, alternatives);
  const allowed = [card.kitId, ...(card.alternatives || []).map(({ kitId }) => kitId)];
  const match = allowed.includes(input.kitId) && [primary, ...alternatives].find(({ kitId }) => kitId === input.kitId);
  if (!match) throw new Error('This kit ID is unavailable for the request. Find matching kits again.');
  return { version: 3, kitId: match.kitId, ...match.kit };
}

module.exports = { findKitCards, discoverKitCards, getKit, cardInputSchema, getKitSchema, cardLimit, discoveryResult, responseBytes };
