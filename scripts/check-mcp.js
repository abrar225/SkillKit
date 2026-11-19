'use strict';

const path = require('node:path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function check() {
  const client = new Client({ name: 'skillkit-check', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(__dirname, '../bin/mcp-server.js')],
  });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    for (const name of ['recommend_workflow', 'get_skill', 'read_skill_file']) {
      if (!tools.some((tool) => tool.name === name)) throw new Error('Missing tool: ' + name);
    }
    const result = await client.callTool({ name: 'recommend_workflow', arguments: {
      task: 'Build a portfolio website.',
      intent: { actions: ['new-web-project'], projectState: 'new', deliverables: ['Portfolio website'] },
    } });
    if (result.isError || result.structuredContent?.workflows[0]?.id !== 'new-web-project') {
      throw new Error('The sample portfolio intent did not resolve.');
    }
    console.log('SkillKit MCP is ready. Portfolio intent resolved over local stdio.');
  } finally {
    await client.close();
  }
}

check().catch((error) => {
  console.error('MCP setup check failed: ' + error.message);
  process.exitCode = 1;
});
