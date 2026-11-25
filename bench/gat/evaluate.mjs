import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreSet } from './score.mjs';

const require = createRequire(import.meta.url);
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const supplemental = fileURLToPath(new URL('../user-briefs/', import.meta.url));

export async function evaluateGat({ root = repoRoot, userBriefsDir = supplemental } = {}) {
  const { findKit } = require(resolve(root, 'lib/task-kit.js'));
  const fetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Network access is disabled during routing evaluation.'); };
  try {
    let maxFirstResponseBytes=0;
    const cardPath=resolve(root,'lib/kit-cards.js');
    const cards=existsSync(cardPath) ? require(cardPath) : null;
    function autoSelection(request) {
      const first=cards ? cards.findKitCards(request) : findKit(request);
      maxFirstResponseBytes=Math.max(maxFirstResponseBytes,cards ? cards.responseBytes(first) : Buffer.byteLength(JSON.stringify(first)));
      return first.kitId && cards ? cards.getKit({kitId:first.kitId,request}) : first;
    }
    const routing = await scoreSet(autoSelection, undefined, { root, includeAdjudicated: true });
    routing.maxFirstResponseBytes=maxFirstResponseBytes;
    const files = readdirSync(userBriefsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(({ name }) => name).sort();
    const userBriefs = [];
    for (const file of files) {
      try {
        userBriefs.push({ file, ...(await scoreSet(autoSelection, resolve(userBriefsDir, file), { root, includeAdjudicated: true })) });
      } catch {
        userBriefs.push({ file, error: 'Unable to score this file. Check the JSON schema and evidence expressions.' });
      }
    }
    return { routing, userBriefs };
  } finally {
    globalThis.fetch = fetch;
  }
}
