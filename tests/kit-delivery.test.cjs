const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { handoff, handoffLimit, getSkill, reportOutcome, getResource, makeLock, verifyLock } = require('../lib/kit-delivery');
const { handleRequest } = require('../lib/kit-http');
const { skills } = require('../registry/skills.json');
const { mayDeliver } = require('../lib/catalog-policy');
const script = path.resolve(__dirname, '../bin/vibe-skills.js');
const publicId = 'frontend/frontend-design';
const restricted = skills.find(s => !mayDeliver(s));
const ref = { id: publicId, license: 'Apache-2.0' };
const kit = { status:'ready', skills:[ref], stages:[{id:'verify',check:'Check keyboard focus.'}], resources:[getResource('mdn')] };

function temp(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'kit-delivery-'));
  t.after(() => rmSync(dir, {recursive:true,force:true}));
  return dir;
}

test('unknown licenses are metadata-only in reads, asset reads, HTTP archives and explicit export', async t => {
  const dir = temp(t);
  for (const file of [undefined,'guide.md']) {
    const value = await getSkill(restricted.id,file);
    assert.equal(value.delivery,'metadata-only');
    assert.equal(value.instructions,undefined);
    assert.equal(value.content,undefined);
  }
  const response = await handleRequest(new Request('http://localhost/api/kit?'+new URLSearchParams({id:restricted.id,format:'archive'})));
  assert.ok(response.status >= 400);
  const result = spawnSync(process.execPath,[script,'export','--target','agents','--ids',restricted.id,'--out',dir]);
  assert.notEqual(result.status,0);
  assert.deepEqual(readdirSync(dir),[]);
});

test('text handoff keeps checks, links, and instruction IDs when the UTF-8 budget is exhausted', async () => {
  const text = await handoff({...kit, skills:[ref,{id:'engineering-ops/systematic-debugging',license:'MIT'}]});
  assert.ok(Buffer.byteLength(text)<=handoffLimit);
  assert.match(text,/Check keyboard focus/);
  assert.match(text,/https:/);
  assert.ok(text.includes(publicId));
  assert.match(text,/Truncated/);
});

test('lock verifies exact selections, rejects altered pins and refuses overwrites', t => {
  const dir = temp(t);
  const lock = makeLock(kit);
  assert.ok(verifyLock(lock).verified);
  lock.skills[0].sha256 = '0'.repeat(64);
  assert.throws(() => verifyLock(lock), /differ/);
  writeFileSync(path.join(dir,'skillkit.lock.json'),'user-owned');
  const result=spawnSync(process.execPath,[script,'use','Redesign my portfolio website','--lock'],{cwd:dir});
  assert.notEqual(result.status,0);
  assert.equal(readFileSync(path.join(dir,'skillkit.lock.json'),'utf8'),'user-owned');
});

test('feedback collection requires consent and an enabled operator sink', t => {
  const old = process.env.SKILLKIT_OUTCOME_FILE;
  delete process.env.SKILLKIT_OUTCOME_FILE;
  t.after(()=>{if(old===undefined) delete process.env.SKILLKIT_OUTCOME_FILE; else process.env.SKILLKIT_OUTCOME_FILE=old;});
  assert.throws(()=>reportOutcome({result:'useful'}),/consent/);
  const args={consent:true,result:'useful',ids:[publicId]};
  assert.equal(reportOutcome(args).recorded,false);
  const dest=path.join(temp(t),'outcomes.jsonl');
  process.env.SKILLKIT_OUTCOME_FILE=dest;
  assert.ok(reportOutcome(args).recorded);
  const saved=JSON.parse(readFileSync(dest,'utf8'));
  assert.deepEqual(Object.keys(saved).sort(),['date','ids','result']);
});
