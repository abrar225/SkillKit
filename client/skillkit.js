#!/usr/bin/env node
'use strict';
const { Readable } = require('node:stream');
const { saveArchive } = require('./output');

async function main() {
  const [command, value, flag, dest, ...rest] = process.argv.slice(2);
  if (!['use','get','handoff','explain'].includes(command) || !value || rest.length ||
      (flag !== undefined && !(command === 'get' && flag === '--out' && dest))) {
    throw new Error('Use skillkit use|handoff|explain "<brief>" or skillkit get <id> [--out directory]. Set SKILLKIT_URL to the service origin.');
  }
  if (!process.env.SKILLKIT_URL) throw new Error('Set SKILLKIT_URL to your SkillKit service origin.');
  const url = new URL('/api/kit', process.env.SKILLKIT_URL);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname))) throw new Error('Use HTTPS or a loopback server.');
  const options = { redirect: 'error', signal: AbortSignal.timeout(60000) };
  if (command === 'get') {
    url.searchParams.set('id', value);
    if (dest) url.searchParams.set('format', 'archive');
  } else {
    options.method = 'POST';
    options.headers = { 'content-type': 'application/json' };
    options.body = JSON.stringify({ task: value });
    if (command !== 'use') url.searchParams.set('format', command);
  }
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Service returned ' + response.status + ': ' + (await response.text()).slice(0,250));
  if (dest) console.log(await saveArchive(Readable.fromWeb(response.body), dest, value));
  else console.log(await response.text());
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
