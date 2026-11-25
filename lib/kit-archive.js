'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const tar = require('tar');
const { Readable } = require('node:stream');
const { getFederatedSkill } = require('./federation');
const { getSkill } = require('./kit-delivery');
const { readCuratedAssets, writeAsset } = require('./curated-assets');

// Tar one selected skill using only its recorded files and notices.
async function archive(id, root) {
  const external = getFederatedSkill(id);
  const local = external ? undefined : readCuratedAssets(root, id, { publicSource: true });
  const entry = external ? await getSkill(id, undefined, root) : undefined;
  if (entry && !entry.instructions) throw new Error('Instructions are metadata-only.');
  const temp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'skillkit-archive-'));
  try {
    const slug = id.split('/').at(-1);
    const dir = path.join(temp, slug);
    await fs.promises.mkdir(dir);
    async function add(name, data) {
      if (typeof name !== 'string' || !name.split('/').every(x => /^[\w.-]+$/.test(x) && !x.startsWith('.'))) throw new Error('Invalid archive member.');
      const dest = path.join(dir, name);
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await fs.promises.writeFile(dest, data, { flag: 'wx' });
    }
    if (local) {
      for (const asset of local.assets) writeAsset(dir, asset);
      if (local.generatedNotice) writeAsset(dir, local.generatedNotice);
    } else {
      await add('SKILL.md', entry.instructions);
      await add('SOURCE.json', JSON.stringify(entry.provenance, null, 2));
      for (const [index, notice] of (entry.notices || []).entries()) await add('NOTICES/' + index + '.txt', notice.content);
      for (const file of entry.supportingFiles || []) {
        const data = await getSkill(id, file, root);
        await add(file, data.content);
      }
    }
    const stream = Readable.from(tar.create({ cwd: temp, gzip: true, portable: true }, [slug]));
    stream.once('close', () => fs.promises.rm(temp, { recursive: true, force: true }).catch(() => {}));
    return stream;
  } catch (e) {
    await fs.promises.rm(temp, { recursive: true, force: true });
    throw e;
  }
}
module.exports = { archive };
