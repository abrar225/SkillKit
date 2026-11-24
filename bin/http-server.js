#!/usr/bin/env node
'use strict';

const { serve } = require('@hono/node-server');
const { handleRequest } = require('../lib/kit-http');
const endpoint = new URL(process.env.SKILLKIT_ORIGIN || 'http://127.0.0.1:' + (process.env.PORT || 3737));
const hostname = process.env.SKILLKIT_HOST || '127.0.0.1';
const port = Number(process.env.PORT ?? (endpoint.port || 3737));

serve({
  hostname, port,
  fetch(request) {
    if (request.headers.get('host') !== endpoint.host) return new Response('Unknown host.', { status: 403 });
    // The public origin can be HTTPS when TLS terminates at a trusted reverse proxy.
    const url = new URL(request.url);
    url.protocol = endpoint.protocol;
    return handleRequest(new Request(url, request));
  },
}, () => console.log('SkillKit listening on ' + hostname + ':' + port + ' · ' + endpoint.origin + '/api/mcp'));
