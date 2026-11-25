import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { webTools, webCall } from './host-web.mjs';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../../../', import.meta.url));
const snapshot = path.join(root, 'bench/gat/sessions.json');
const { agentRule } = require('../../../lib/task-router.js');
const model = 'Qwen2.5 1.5B Instruct Q4_K_M (llama.cpp)';
const localUrl = 'http://127.0.0.1:3897/v1/chat/completions';
const cases = [
  ['web developer', 'Redesign my portfolio website', 'frontend/frontend-design'],
  ['video editor', 'Trim my existing interview footage and export a smaller MP4 with FFmpeg', 'ffmpeg'],
  ['motion designer', 'Create a motion graphics video with HyperFrames', 'hyperframes'],
  ['graphic designer', 'Design a festival poster', 'ui-ux/canvas-design'],
  ['copywriter', 'Write a newsletter from my founder notes', 'social-media/writing-shape'],
];
const skillKitTools = new Set(['find_kit', 'get_kit', 'get_skill', 'get_resource']);
const idList = (items) => (items || []).map(({ id }) => id);

async function completion(messages, tools) {
  const response = await fetch(localUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(35000),
    body: JSON.stringify({ model: 'local', messages, tools, temperature: 0, max_tokens: 260 }),
  });
  if (!response.ok) throw new Error('Local model HTTP ' + response.status);
  return response.json();
}

async function run([persona, brief, wanted], arm, mcp, availableTools) {
  const manual = arm === 'manual';
  const messages = [
    { role: 'system', content: [
      'You are a task assistant. Use the listed tools when helpful. For this trial, return a concise, actionable kit for doing the task, with evidence from any references you actually read.',
      ...(arm === 'snippet' ? ['Project instructions: ' + agentRule] : []),
    ].join('\n') },
    { role: 'user', content: brief + (manual ? '.' : ' using SkillKit.') },
  ];
  const record = {
    host: 'Local tool-calling harness', model, persona, arm, realSession: true, localInference: true,
    completed: false, calledSkillKit: false, workingKit: false, manualSource: manual ? 'local-public-web-replay' : undefined,
    tokens: 0, tokensToWorkingKit: null, calls: 0, callsToWorkingKit: null, filesWritten: [],
    skillsLoaded: [], resourcesOpened: [], toolTrace: [],
  };
  let ready = false;
  let searched = false;

  function acceptDiscovery(tool, data) {
    const referenceMatch = idList(data.skills).includes(wanted) || idList(data.resources).includes(wanted);
    ready ||= (tool === 'find_kit' || tool === 'get_kit') && data.status === 'ready' && referenceMatch;
    if (!record.workingKit && ((ready && !wanted.includes('/')) ||
        (ready && record.skillsLoaded.includes(wanted)) || (searched && manual && data.coverage === persona))) {
      record.workingKit = true;
      record.tokensToWorkingKit = record.tokens;
      record.callsToWorkingKit = record.calls;
    }
  }

  try {
    for (let turn = 0; turn < 5; turn++) {
      const reply = await completion(messages, manual ? webTools : availableTools);
      record.tokens += reply.usage?.total_tokens ?? 0;
      const answer = reply.choices[0].message;
      const calls = answer.tool_calls || [];
      if (!calls.length) {
        record.completed = Boolean(answer.content?.trim());
        break;
      }
      messages.push(answer);
      for (const call of calls) {
        record.calls++;
        const tool = call.function.name;
        let data;
        try {
          const args = JSON.parse(call.function.arguments);
          if (manual) {
            data = webCall(tool, args);
            searched ||= tool === 'search_web' && data.results?.length > 0;
            if (data.url) record.resourcesOpened.push(data.url);
          } else if (skillKitTools.has(tool) && args.upstream !== true) {
            record.calledSkillKit = true;
            const result = await mcp.callTool({ name: tool, arguments: args });
            data = result.structuredContent || { error: result.content?.[0]?.text || 'No tool result' };
            if (tool === 'get_skill' && data.instructions) record.skillsLoaded.push(data.id);
            if (tool === 'get_resource' && data.url) record.resourcesOpened.push(data.url);
          } else {
            data = { error: 'Tool is unavailable in this trial.' };
          }
        } catch {
          data = { error: 'Invalid tool arguments or unavailable result.' };
        }
        record.toolTrace.push({ tool, ok: !data.error, ...(data.kitId && { kitId: data.kitId }),
          ...(data.status && { status: data.status }), ...(data.id && { id: data.id }) });
        acceptDiscovery(tool, data);
        messages.push({ role: 'tool', name: tool, tool_call_id: call.id, content: JSON.stringify(data) });
      }
    }
  } catch (error) {
    record.error = error.name;
  }
  if (record.workingKit) {
    record.sessionTokens = record.tokens;
    record.sessionCalls = record.calls;
    record.tokens = record.tokensToWorkingKit;
    record.calls = record.callsToWorkingKit;
  }
  return record;
}

const mcp = new Client({ name: 'skillkit-local-trial', version: '1' });
try {
  await mcp.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(root, 'bin/mcp-server.js')] }));
  const { tools } = await mcp.listTools();
  const availableTools = tools.filter(({ name }) => skillKitTools.has(name)).map(({ name, description, inputSchema }) => ({
    type: 'function', function: { name, description, parameters: inputSchema },
  }));
  const previous = fs.existsSync(snapshot) ? JSON.parse(fs.readFileSync(snapshot, 'utf8')) : [];
  const records = previous.filter(({ host }) => host !== 'Local tool-calling harness');
  for (const spec of cases) {
    for (const arm of ['snippet', 'pointer', 'manual']) {
      const record = await run(spec, arm, mcp, availableTools);
      records.push(record);
      const temp = snapshot + '.tmp';
      fs.writeFileSync(temp, JSON.stringify(records, null, 2) + '\n');
      fs.renameSync(temp, snapshot);
      console.log(JSON.stringify(record));
    }
  }
} finally {
  await mcp.close();
}
