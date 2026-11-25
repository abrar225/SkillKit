'use strict';

const path = require('node:path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

async function check(endpoint) {
  const client = new Client({ name: 'skillkit-check', version: '1.0.0' });
  const transport = endpoint
    ? new StreamableHTTPClientTransport(new URL(endpoint))
    : new StdioClientTransport({ command: process.execPath, args: [path.join(__dirname, '../bin/mcp-server.js')] });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    for (const name of ['explain_match', 'find_kit', 'get_kit', 'get_resource', 'get_skill', 'read_skill_file', 'report_outcome']) {
      if (!tools.some((tool) => tool.name === name)) throw new Error('Missing tool: ' + name);
    }
    const request = { task: 'Redesign my portfolio website' };
    const result = await client.callTool({ name: 'find_kit', arguments: request });
    const kit = result.structuredContent;
    if (result.isError || kit?.workflows[0] !== 'web-redesign' || Buffer.byteLength(JSON.stringify({ jsonrpc: "2.0", id: 1, result })) > 2048) throw new Error('Portfolio redesign did not resolve to a compact card.');
    const expanded = await client.callTool({ name: 'get_kit', arguments: { kitId: kit.kitId, request } });
    if (expanded.isError || expanded.structuredContent?.skills[0].id !== kit.skills[0].id) throw new Error('The selected card could not be expanded.');
    const detail = await client.callTool({ name: 'get_skill', arguments: { id: kit.skills[0].id } });
    if (detail.isError || !detail.structuredContent?.instructions) throw new Error('Selected instructions could not be read.');
    console.log('SkillKit ready over ' + (endpoint || 'local stdio') + '. Portfolio redesign returned ' +
      kit.skills.length + ' skills and ' + kit.resources.length + ' resources. Read ' + kit.skills[0].id + '.');
  } finally {
    await client.close();
  }
}

check(process.argv[2]).catch((error) => {
  console.error('MCP setup check failed: ' + error.message);
  process.exitCode = 1;
});
