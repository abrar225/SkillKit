'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');

async function saveArchive(stream, dir, id) {
  if (!/^[\w./-]+$/.test(id) || id.split('/').some(part => !part || part.startsWith('.'))) throw new Error('Invalid skill ID.');
  const dest = path.resolve(dir, id.split('/').pop() + '.tar.gz');
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const temp = await fs.mkdtemp(path.join(path.dirname(dest), '.skillkit-'));
  try {
    const file = path.join(temp, 'asset');
    const handle = await fs.open(file, 'wx', 0o600);
    await pipeline(stream, handle.createWriteStream());
    await fs.link(file, dest);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
  return dest;
}
module.exports = { saveArchive };
