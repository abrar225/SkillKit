import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
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
    const routing = await scoreSet(findKit, undefined, { root });
    const files = readdirSync(userBriefsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(({ name }) => name).sort();
    const userBriefs = [];
    for (const file of files) {
      try {
        userBriefs.push({ file, ...(await scoreSet(findKit, resolve(userBriefsDir, file), { root })) });
      } catch {
        userBriefs.push({ file, error: 'Unable to score this file. Check the JSON schema and evidence expressions.' });
      }
    }
    return { routing, userBriefs };
  } finally {
    globalThis.fetch = fetch;
  }
}
