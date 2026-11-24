'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const tar = require('tar');
const { Readable } = require('node:stream');
const { getFederatedSkill } = require('./federation');
const { licenseEvidence } = require('./catalog-policy');
const { archiveDirectory, getSkill } = require('./kit-delivery');

// Tar a single selected skill. A federated archive has only explicitly pinned files.
async function archive(id, root) {
  const external = getFederatedSkill(id);
  const localDir = external ? undefined : archiveDirectory(id, root);
  if (localDir && licenseEvidence(id).files.length) {
    const dir = localDir;
    return Readable.from(tar.create({ cwd: path.dirname(dir), gzip: true, portable: true }, [path.basename(dir)]));
  }
  const entry = await getSkill(id, undefined, root);
  if (!entry.instructions) throw new Error('Instructions are metadata-only.');
  const temp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'skillkit-archive-'));
  try {
    const slug = localDir ? path.basename(localDir) : id.split('/').at(-1);
    const dir = path.join(temp, slug);
    await fs.promises.mkdir(dir);
    async function add(name, data) {
      if (typeof name !== 'string' || !name.split('/').every(x => /^[\w.-]+$/.test(x) && !x.startsWith('.'))) throw new Error('Invalid archive member.');
      const dest = path.join(dir, name);
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await fs.promises.writeFile(dest, data, { flag: 'wx' });
    }
    if (localDir) {
      await fs.promises.cp(localDir, dir, { recursive: true });
      await add('SKILLKIT-LICENSE.txt', entry.notices[0].content);
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
