const test = require('node:test');
const assert = require('node:assert/strict');
const { findKitCards, getKit, responseBytes, cardLimit } = require('../lib/kit-cards');

test('findKitCards fits multi-candidate kits inside the 2048-byte JSON-RPC budget', () => {
  const briefs = [
    'Redesign my portfolio website',
    'Write a LinkedIn post announcing our product launch',
    'Set up Vitest unit tests for our TypeScript utilities',
    'Create a multi-stage Dockerfile for a Node.js service',
  ];
  for (const task of briefs) {
    const request = { task };
    const card = findKitCards(request);
    assert.ok(card.kitId, task);
    assert.ok(responseBytes(card) <= cardLimit, `${task}: ${responseBytes(card)} bytes`);
    const expanded = getKit({ kitId: card.kitId, request });
    assert.equal(expanded.kitId, card.kitId);
    for (const alt of card.alternatives || []) {
      const altKit = getKit({ kitId: alt.kitId, request });
      assert.equal(altKit.kitId, alt.kitId);
      assert.ok(Array.isArray(alt.skills));
    }
  }
});

test('findKitCards retains multiple candidate cards when alternatives exist', () => {
  const request = { task: 'Write a LinkedIn post announcing our new design system launch' };
  const card = findKitCards(request);
  assert.ok(responseBytes(card) <= cardLimit);
  assert.ok((card.alternatives?.length || 0) >= 3, `expected >=3 alternatives, got ${card.alternatives?.length}`);
});
