import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { realisticWebCall } from './web-replay-v2.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const skillKitTools = new Set(['find_kit', 'get_kit', 'get_skill', 'get_resource']);

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 2) {
    out[argv[i].replace(/^--/, '')] = argv[i + 1];
  }
  return out;
}

const opts = parseArgs(process.argv);
const logPath = opts.log;
const arm = opts.arm;
const tool = opts.tool;
const wanted = opts.wanted || '';
const coverage = opts.coverage || '';
let args = {};
try {
  args = opts.args ? JSON.parse(opts.args) : {};
} catch {
  console.log(JSON.stringify({ error: 'Invalid JSON args' }));
  process.exit(0);
}

let data;
let workingKitHit = false;

const statePath = logPath ? logPath + '.state.json' : null;
const state = statePath && fs.existsSync(statePath)
  ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
  : { guide: false, verify: false, ready: false, loadedSkills: [] };

if (arm === 'manual') {
  data = realisticWebCall(tool, args);
  if (tool === 'open_page' && !data.error) {
    if (data.coverage === coverage && data.role === 'guide') state.guide = true;
    if (data.coverage === coverage && data.role === 'verify') state.verify = true;
    if (state.guide && state.verify) workingKitHit = true;
  }
} else if (skillKitTools.has(tool)) {
  const mcp = new Client({ name: 'skillkit-gat-bridge', version: '1' });
  try {
    await mcp.connect(new StdioClientTransport({
      command: process.execPath,
      args: [path.join(root, 'bin/mcp-server.js')],
    }));
    const result = await mcp.callTool({ name: tool, arguments: args });
    data = result.structuredContent || { error: result.content?.[0]?.text || 'No tool result' };
    if ((tool === 'find_kit' || tool === 'get_kit') && data.status === 'ready') {
      const ids = [...(data.skills || []), ...(data.resources || [])].map((x) => x.id);
      if (!wanted || ids.includes(wanted)) state.ready = true;
    }
    if (tool === 'get_skill' && data.instructions && data.id) {
      if (!state.loadedSkills.includes(data.id)) state.loadedSkills.push(data.id);
    }
    if (state.ready && (!wanted.includes('/') || state.loadedSkills.includes(wanted))) {
      workingKitHit = true;
    } else if (tool === 'get_resource' && data.url && !wanted.includes('/') && data.id === wanted && state.ready) {
      workingKitHit = true;
    }
  } finally {
    await mcp.close();
  }
} else {
  data = { error: 'Tool is unavailable in this arm.' };
}
if (statePath) fs.writeFileSync(statePath, JSON.stringify(state));

const entry = {
  ts: new Date().toISOString(),
  arm,
  tool,
  ok: !data?.error,
  status: data?.status || null,
  id: data?.id || null,
  kitId: data?.kitId || null,
  workingKitHit,
  responseBytes: Buffer.byteLength(JSON.stringify(data)),
};
if (logPath) fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
console.log(JSON.stringify(data));
