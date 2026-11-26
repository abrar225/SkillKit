'use strict';

/**
 * Split markdown body into paragraph blocks without breaking fenced code blocks.
 */
function splitBlocks(text) {
  const blocks = [];
  let current = [];
  let fence = null;
  let heading = '';
  let blockHeading = '';
  const flush = () => {
    if (!current.length) return;
    const body = current.join('\n').trim();
    if (body) blocks.push({ body, heading: blockHeading });
    current = [];
  };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      current.push(line);
      if (match && match[1][0] === fence[0] && match[1].length >= fence.length && /^\s*(?:`{3,}|~{3,})\s*$/.test(line)) {
        fence = null;
      }
      continue;
    }
    if (match) {
      if (!current.length) blockHeading = heading;
      fence = match[1];
      current.push(line);
      continue;
    }
    if (!line.trim()) {
      flush();
    } else if (/^#{1,4}\s+\S/.test(line)) {
      flush();
      heading = line.trim();
    } else {
      if (!current.length) blockHeading = heading;
      current.push(line);
    }
  }
  if (!fence) flush();
  return blocks;
}

function hasBalancedFences(body) {
  let open = null;
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^\s*(`{3,}|~{3,})/);
    if (!match) continue;
    if (!open) open = match[1];
    else if (match[1][0] === open[0] && match[1].length >= open.length && /^\s*(?:`{3,}|~{3,})\s*$/.test(line)) open = null;
  }
  return open === null;
}

// Keep quoted source paragraphs and complete fenced code blocks intact. A caller can always request the full file.
function focusedSkill(detail, focus, options = {}) {
  if (!focus || !detail.instructions) return detail;
  if (typeof focus !== 'string' || focus.length > 8000) throw Error('Focus must be a brief of at most 8000 characters.');
  const limit = Number.isFinite(options.limit) ? options.limit : 900;
  const maxBlocks = Number.isFinite(options.maxBlocks) ? options.maxBlocks : 3;
  const text = detail.instructions.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
  const words = value => new Set(value.toLowerCase().match(/[a-z0-9]{4,}/g) || []);
  const wanted = words(focus);
  const blocks = splitBlocks(text).map(({ body, heading }, index) => {
    const bodyText = heading && !body.startsWith(heading) && Buffer.byteLength(heading + '\n' + body) <= Math.min(850, limit - 2)
      ? heading + '\n' + body
      : body;
    const bodyScore = [...words(body)].filter(word => wanted.has(word)).length;
    const headingScore = [...words(heading)].filter(word => wanted.has(word)).length * 2;
    return { body: bodyText, index, score: bodyScore + headingScore };
  }).filter(({ body }) => body.length >= 45 && hasBalancedFences(body) && Buffer.byteLength(body) <= Math.min(1200, limit));
  blocks.sort((a, b) => b.score - a.score || a.index - b.index);
  const selected = [];
  let bytes = 0;
  for (const block of blocks) {
    const size = Buffer.byteLength(block.body) + 2;
    if (size + bytes > limit) continue;
    bytes += size;
    selected.push(block);
    if (selected.length === maxBlocks) break;
  }
  if (!selected.length) return { ...detail, excerpt: false };
  return { ...detail, excerpt: true, instructions: selected.sort((a,b) => a.index-b.index).map(b=>b.body).join('\n\n') };
}
module.exports = { focusedSkill };
