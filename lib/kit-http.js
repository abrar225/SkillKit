'use strict';

const path = require('node:path');
const { WebStandardStreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js');
const { readRequestBody } = require('@modelcontextprotocol/sdk/server/requestBody.js');
const { createServer } = require('../bin/mcp-server');
const delivery = require('./kit-delivery');
const { Readable } = require('node:stream');
const { archive: makeArchive } = require('./kit-archive');
const { findKit, formatKit, explainKit } = require('./task-kit');

const text = (body, status = 200, headers = {}) => new Response(body, {
  status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', ...headers },
});

async function handleRequest(request, root = path.resolve(__dirname, '..')) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return text('Origin is not allowed.', 403);
  if (url.pathname === '/api/mcp') {
    if (request.method !== 'POST') return text('Use Streamable HTTP POST for MCP.', 405, { allow: 'POST' });
    const server = createServer({ remote: true, root, endpoint: url.origin });
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 64 * 1024,
    });
    try {
      await server.connect(transport);
      return await transport.handleRequest(request);
    } finally {
      await server.close();
    }
  }

  if (url.pathname === '/api/kit' && request.method === 'POST') {
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return text('Send application/json.', 415);
    const body = await readRequestBody(request, 64 * 1024);
    if (body.tooLarge) return text('Brief exceeds 64 KiB.', 413);
    try {
      const input = JSON.parse(body.text);
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) =>
        !['task', 'workflow', 'intent', 'stack'].includes(key))) return text('Invalid kit request fields.', 400);
      const format = url.searchParams.get('format');
      if (format === 'explain') return Response.json(explainKit(input));
      if (format === 'handoff') return text(await delivery.handoffFor(input, root));
      const kit = findKit(input);
      if (format === 'lock') return Response.json(delivery.makeLock(kit, root));
      return Response.json(kit, { headers: { 'cache-control': 'no-store' } });
    } catch (error) {
      return text(error.message, 400);
    }
  }
  if (request.method !== 'GET') return text('Use GET for discovery.', 405, { allow: 'GET' });
  if (url.pathname === '/' || url.pathname === '/llms.txt') {
    return text([
      '# SkillKit', '',
      'Send the smallest description of the deliverable that preserves the user’s constraints.',
      'MCP clients: connect to ' + url.origin + '/api/mcp and call find_kit.',
      'Web readers: GET ' + url.origin + '/api/kit?task=<URL-encoded brief>.',
      'For a clarification, reuse the brief with &workflow=<chosen ID> or refine the task.',
      'Read one selected skill at /api/kit?id=<exact ID>. Add &file=<relative path> for one supporting file.',
      'Add &format=handoff for a size-capped text kit with instructions and verification checks.',
      'Read one resource at /api/kit?resource=<id>. Use format=explain for match evidence.',
    ].join('\n'));
  }
  if (url.pathname !== '/api/kit') return text('Unknown endpoint.', 404);
  const params = url.searchParams;
  const json = (data) => Response.json(data, { headers: { 'cache-control': 'no-store' } });
  try {
    if (params.has('resource')) {
      const entry = delivery.getResource(params.get('resource'));
      return entry ? json(entry) : text('Unknown resource.', 404);
    }
    if (params.has('id')) {
      if (params.get('format') === 'archive') {
        if (params.has('file')) return text('Choose one skill ID for an archive.', 400);
        const id = params.get('id');
        const archive = await makeArchive(id, root);
        const slug = id.split('/').at(-1).replace(/[^a-z0-9._-]/gi,'_');
        return new Response(Readable.toWeb(Readable.from(archive)), { headers: {
          'content-type': 'application/gzip', 'content-disposition': 'attachment; filename="' + slug + '.tar.gz"',
        } });
      }
      const entry = await delivery.getSkill(params.get('id'), params.get('file') ?? undefined, root);
      if (entry.delivery === 'metadata-only') return json(entry);
      if (params.get('format') !== 'markdown') return json(entry);
      return text(entry.content ?? [entry.id, entry.provenance.license,
        entry.provenance.origin === 'federated' ? entry.provenance.upstream.url : entry.provenance.upstream ? entry.provenance.upstream.url + '/tree/' + entry.provenance.upstream.commit + '/' + entry.provenance.upstream.path :
          entry.provenance.url || ('https://github.com/abrar225/SkillKit/blob/main/' + entry.provenance.sourcePath), '', entry.instructions, ...(entry.notices || []).map(n => n.content)].join('\n'));
    }
    const input = { task: params.get('task') || '', ...(params.has('workflow') ? { workflow: params.get('workflow') } : {}), stack: params.get('stack') || '' };
    if (params.get('format') === 'explain') return json(explainKit(input));
    if (params.get('format') === 'handoff') return text(await delivery.handoffFor(input, root));
    const kit = findKit(input);
    return params.get('format') === 'markdown' ? text(formatKit(kit, (id) => url.origin + '/api/kit?id=' + encodeURIComponent(id) + '&format=markdown')) : json(kit);
  } catch (error) {
    return text(error.code ? 'Catalog file unavailable.' : error.message, error.code === 'ENOENT' ? 404 : 400);
  }
}

module.exports = { handleRequest };
