'use strict';

// Keep quoted source paragraphs intact. A caller can always request the full file.
function focusedSkill(detail, focus) {
  if (!focus || !detail.instructions) return detail;
  if (typeof focus !== 'string' || focus.length > 8000) throw Error('Focus must be a brief of at most 8000 characters.');
  const text = detail.instructions.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
  const words = value => new Set(value.toLowerCase().match(/[a-z0-9]{4,}/g) || []);
  const wanted = words(focus);
  const blocks = text.split(/\r?\n\s*\r?\n/).map((body, index) => {
    body = body.trim();
    const score = [...words(body)].filter(word => wanted.has(word)).length;
    return { body, index, score };
  }).filter(({ body }) => body.length >= 45 && !body.includes('```') && Buffer.byteLength(body) <= 850);
  blocks.sort((a, b) => b.score - a.score || a.index - b.index);
  const selected = [];
  let bytes = 0;
  for (const block of blocks) {
    const size = Buffer.byteLength(block.body) + 2;
    if (size + bytes > 900) continue;
    bytes += size;
    selected.push(block);
    if (selected.length === 3) break;
  }
  if (!selected.length) return { ...detail, excerpt: false };
  return { ...detail, excerpt: true, instructions: selected.sort((a,b) => a.index-b.index).map(b=>b.body).join('\n\n') };
}
module.exports = { focusedSkill };
