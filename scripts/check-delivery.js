'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { spawn, execFile } = require('node:child_process');
const { once } = require('node:events');
const path = require('node:path');
const os = require('node:os');
const { promisify } = require('node:util');

async function main() {
  const repo = path.resolve(__dirname, '..');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillkit-consumer-'));
  const origin = 'http://127.0.0.1:' + (process.env.SKILLKIT_CHECK_PORT || '3799');
  const env = { ...process.env, PORT: new URL(origin).port, SKILLKIT_ORIGIN: origin, SKILLKIT_URL: origin };
  const server = spawn(process.execPath, [path.join(repo,'bin/http-server.js')], { cwd: dir, env, stdio: ['ignore','pipe','inherit'] });
  const exit = once(server,'exit');
  const run = (file,args) => promisify(execFile)(process.execPath, [path.join(repo,file), ...args], { cwd: dir, env });
  try {
    await Promise.race([once(server.stdout,'data'), exit.then(() => { throw new Error('Service exited before startup.'); })]);
    await run('scripts/check-mcp.js',[origin+'/api/mcp']);
    const query = await run('client/skillkit.js',['use','Redesign my portfolio website']);
    const kit = JSON.parse(query.stdout);
    assert.equal(kit.status,'ready');
    const id = kit.skills[0].id;
    const result = JSON.parse((await run('client/skillkit.js',['get',id])).stdout);
    assert.equal(result.id,id);
    assert.ok(result.instructions);
    assert.deepEqual(await fs.readdir(dir),[]);
    await run('client/skillkit.js',['get',id,'--out',dir]);
    const files = await fs.readdir(dir);
    assert.deepEqual(files,[id.split('/').pop()+'.tar.gz']);
    assert.ok((await fs.stat(path.join(dir,files[0]))).size>100);
    console.log('Remote MCP and standalone client passed discovery, one skill read, zero implicit writes, and one explicit archive.');
  } finally {
    server.kill(); await exit; await fs.rm(dir,{recursive:true,force:true});
  }
}
main().catch(error => {console.error(error.message);process.exitCode=1;});
