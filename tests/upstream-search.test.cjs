const test = require('node:test');
const assert = require('node:assert/strict');
const { searchUpstream } = require('../lib/upstream-search');
const { discoverKitCards } = require('../lib/kit-cards');

test('live discovery requires opt-in and sends only allowlisted catalog vocabulary', async () => {
  const marker = 'private-customer-7';
  const contract = { forbiddenTools: [], deliverables: [{ kind: 'video-editor-project', tools: ['davinci-resolve'], text: marker }] };
  const gaps = [{ gaps: [marker] }];
  const urls = [];
  const fetchImpl = async url => {
    urls.push(String(url));
    return Response.json({ items: [{ full_name: 'example/repo' }, { full_name: '../../unsafe' }] });
  };
  assert.deepEqual(await searchUpstream(contract, gaps, { env: {}, fetchImpl }), []);
  const enabled = { env: { SKILLKIT_UPSTREAM_SEARCH: '1' }, fetchImpl };
  await discoverKitCards({ task: 'Edit an interview in DaVinci Resolve and deliver an editable Resolve timeline' }, enabled);
  assert.equal(urls.length, 0);
  assert.deepEqual(await searchUpstream(contract, gaps, enabled), [
    { id: 'example/repo', url: 'https://github.com/example/repo', status: 'discovery-only' }
  ]);
  const url = new URL(urls[0]);
  assert.equal(url.host, 'api.github.com');
  assert.equal(url.searchParams.get('q'), 'topic:agent-skills video editor project davinci resolve');
  assert.equal(url.href.includes(marker), false);
  contract.deliverables[0].tools = [marker];
  assert.deepEqual(await searchUpstream(contract, gaps, enabled), []);
  assert.equal(urls.length, 1);
});
