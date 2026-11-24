#!/usr/bin/env node

/**
 * vibe-skills MCP server — exposes the curated catalog over the Model Context
 * Protocol (stdio).
 *
 * Tools:
 *   recommend_workflow select skills, resources, and checks for the current task
 *   read_skill_file read a referenced supporting text file
 *   search_skills  filter by query, domain, or capability
 *   get_skill      full SKILL.md plus provenance from SOURCE.json
 *   list_domains   the 14 domains with flagship skills
 *   export_skill   installation plan for claude | antigravity | cursor
 *   list_resources curated developer resources by category or query
 *
 * stdout is reserved for the MCP transport. Diagnostics go to stderr.
 */

const fs = require('fs');
const path = require('path');
const { createRouter, workflowIds, instructions, skillCompatibility, intentSchema } = require('../lib/task-router');
const { AjvJsonSchemaValidator } = require('@modelcontextprotocol/sdk/validation/ajv');

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  McpError,
  ErrorCode,
  CallToolRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const REPO_ROOT = path.resolve(__dirname, '..');
const TARGETS = require('../lib/export-layout');
const { findKit, inputSchema } = require('../lib/task-kit');
const delivery = require('../lib/kit-delivery');
const { mayDeliver } = require('../lib/catalog-policy');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const skillsRegistry = require('../registry/skills.json');
const domainsRegistry = require('../registry/domains.json');
const resourcesRegistry = require('../registry/resources.json');
const skills = skillsRegistry.skills;
const domains = domainsRegistry.domains;
const resources = resourcesRegistry.resources;
const recommendWorkflow = createRouter(skills, resources);

const lower = (value) => String(value || '').toLowerCase();
const clampLimit = (value, fallback = 25, max = 100) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(1, Math.min(Math.floor(parsed), max));
};

function exportFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? exportFiles(path.join(directory, entry.name), relative) : [relative];
  }).sort();
}

// Keep the human-readable POSIX command safe for paths containing spaces or shell characters.
function shellQuote(value) {
  return "'" + String(value).split("'").join("'\"'\"'") + "'";
}

function publicSkill(skill) {
  return {
    id: skill.id,
    name: skill.name,
    displayName: skill.displayName,
    domain: skill.domain,
    description: skill.description,
    license: skill.license,
    origin: skill.origin,
    featured: skill.featured,
    capabilities: skill.capabilities,
    path: skill.path,
    nativeLayoutIssues: skillCompatibility(skill),
  };
}

function textResult(payload, compact = false) {
  return {
    structuredContent: payload,
    content: [
      {
        type: 'text',
        text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, compact ? undefined : 2),
      },
    ],
  };
}

function errorResult(message) {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}

function resolveSkill(id) {
  if (!id) return null;
  const needle = lower(id).trim();
  if (!needle) return null;
  const exact = skills.find((skill) => lower(skill.id) === needle);
  if (exact) return exact;
  const groups = [
    skills.filter((skill) => [skill.name, skill.displayName].some((name) => lower(name) === needle)),
    skills.filter((skill) => lower(skill.id).endsWith(`/${needle}`)),
    skills.filter((skill) => lower(skill.id).includes(needle)),
  ];
  const matches = groups.find((group) => group.length) || [];
  if (matches.length > 1) throw new Error(`Ambiguous skill "${id}". Use an exact ID: ${matches.map((skill) => skill.id).join(', ')}`);
  return matches[0] || null;
}

const tools = [
  {
    name: 'find_kit',
    description: 'Start here. Find relevant skills, reference links and checks for a creative or technical brief. Supply structured intent when you know the deliverables and constraints. Resolve a clarification from conversation context, asking the user only if necessary.',
    inputSchema,
  },
  { name: 'explain_match', description: 'Explain selected and rejected matches and coverage gaps.', inputSchema },
  { name: 'get_resource', description: 'Look up one resource by exact ID and inspect its terms and purpose.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', minLength: 1, maxLength: 150 } }, required: ['id'], additionalProperties: false } },
  { name: 'report_outcome', description: 'Share a result only with the user’s explicit consent. Stores catalog IDs and a rating when operator collection is enabled.',
    inputSchema: { type: 'object', properties: { consent: { const: true }, result: { enum: ['useful','mixed','unhelpful'] },
      ids: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 150 } } }, required: ['consent','result'], additionalProperties: false } },
  {
    name: 'recommend_workflow',
    description: 'Start here for any developer task. Interpret the user request in context and pass the structured intent. Returns applicable stages, exact skill IDs, resources, and checks. A raw task alone returns choices without inferring a workflow.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', maxLength: 8000, description: 'Latest task brief, including relevant requirements and earlier answers. Omit when the user has given no work.' },
        intent: intentSchema,
        workflow: { type: 'string', enum: workflowIds, description: 'Legacy explicit selection of one workflow. Use intent for compound tasks and constraints.' },
        stack: { type: 'string', maxLength: 200, description: 'Frameworks or technologies already known to be in use. Leave blank if unknown.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'read_skill_file',
    description: 'Read one supporting text file referenced by a skill. Pass its exact skill ID and the file path relative to that skill. Returns UTF-8 text up to 64 KiB.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', minLength: 1, maxLength: 150 },
        file: { type: 'string', minLength: 1, maxLength: 512 },
      },
      required: ['id', 'file'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_skills',
    description:
      'Search the curated skills catalog by free-text query, domain, and capability. Returns matching skills with id, description, license, and capabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text match against id, name, and description.' },
        domain: {
          type: 'string',
          description: `Restrict to one domain: ${domains.map((d) => d.id).join(', ')}.`,
        },
        capability: {
          type: 'string',
          description: 'Require a capability tag such as references, scripts, templates, prompts, rules, agents, evals, data.',
        },
        limit: { type: 'number', description: 'Maximum results (default 25, max 100).' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_skill',
    description:
      'Fetch one skill by id (or unique name fragment). Returns the full SKILL.md instructions plus SOURCE.json provenance.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Skill id such as engineering-ops/tdd.' },
        compact: { type: 'boolean', description: 'Use an exact ID and omit the per-file integrity ledger from provenance.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_domains',
    description: 'List the 14 catalog domains with descriptions, skill counts, and flagship skill ids.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'export_skill',
    description:
      'Plan an export of one skill into an agent layout. Returns the source directory, destination path, exact files, and the equivalent CLI command. Does not copy files.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Skill id such as ui-ux/refactoring-ui.' },
        target: {
          type: 'string',
          enum: Object.keys(TARGETS),
          description: 'Agent layout to export into.',
        },
        project: {
          type: 'string',
          description: 'Project directory to install into. Supply the user project path. If omitted, this resolves against the MCP process working directory, which can differ from the client workspace.',
        },
      },
      required: ['id', 'target'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_resources',
    description:
      'List curated developer resources (tools, articles, repositories, datasets) by category or free-text query.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: `One of: ${resourcesRegistry.categories.map((c) => c.id).join(', ')}.`,
        },
        query: { type: 'string', description: 'Free-text match against name, description, type, and tags.' },
        limit: { type: 'number', description: 'Maximum results (default 25, max 100).' },
      },
      additionalProperties: false,
    },
  },
];

async function callTool(name, args, remote, root, endpoint) {
  switch (name) {
    case 'find_kit':
      return textResult(findKit(args), true);

    case 'recommend_workflow':
      return textResult(recommendWorkflow(args));

    case 'get_resource': {
      const resource = delivery.getResource(args.id);
      return resource ? textResult(resource) : errorResult('Unknown resource ID.');
    }
    case 'explain_match': return textResult(require('../lib/task-kit').explainKit(args));
    case 'report_outcome': return textResult(delivery.reportOutcome(args));
    case 'read_skill_file': return textResult(await delivery.getSkill(args.id, args.file, root));

    case 'search_skills': {
      const query = lower(args.query).trim();
      const domain = lower(args.domain).trim();
      const capability = lower(args.capability).trim();
      const limit = clampLimit(args.limit);

      if (domain && !domains.some((entry) => entry.id === domain)) {
        return errorResult(`Unknown domain "${args.domain}". Valid domains: ${domains.map((d) => d.id).join(', ')}`);
      }

      const matches = skills.filter((skill) => {
        if (domain && skill.domain !== domain) return false;
        if (capability && !(skill.capabilities || []).some((tag) => lower(tag) === capability)) return false;
        if (!query) return true;
        return [skill.id, skill.name, skill.displayName, skill.description, ...(skill.capabilities || [])]
          .map(lower)
          .some((value) => value.includes(query));
      });

      return textResult({
        query: args.query || null,
        domain: domain || null,
        capability: capability || null,
        total: matches.length,
        returned: Math.min(matches.length, limit),
        skills: matches.slice(0, limit).map(publicSkill),
      });
    }

    case 'get_skill': {
      const skill = remote ? null : resolveSkill(args.id);
      const id = skill?.id || args.id;
      const detail = await delivery.getSkill(id, undefined, root);
      if (detail.delivery === 'metadata-only') return textResult(detail);
      if (endpoint) detail.archiveUrl = endpoint + '/api/kit?' + new URLSearchParams({ id, format: 'archive' });
      if (skill && !args.compact) {
        detail.skill = publicSkill(skill);
        detail.provenance = readJson(path.join(root, skill.path, 'SOURCE.json'));
        delete detail.provenance.originalPath;
      }
      return textResult(detail, true);
    }

    case 'list_domains':
      return textResult({
        count: domains.length,
        totalSkills: skills.length,
        domains: domains.map((domain) => ({
          id: domain.id,
          name: domain.name,
          description: domain.description,
          skillCount: domain.skillCount,
          flagshipSkills: (domain.flagshipSkills || []).map((slug) => `${domain.id}/${slug}`),
          path: domain.path,
        })),
      });

    case 'export_skill': {
      const skill = resolveSkill(args.id);
      if (!skill) return errorResult(`No skill matches "${args.id}". Use search_skills to find one.`);
      if (!mayDeliver(skill)) return textResult(delivery.restricted(skill));
      const target = lower(args.target);
      if (!Object.hasOwn(TARGETS, target)) {
        return errorResult(`Unknown target "${args.target}". Valid targets: ${Object.keys(TARGETS).join(', ')}`);
      }

      const sourceDir = path.join(REPO_ROOT, skill.path);
      const project = args.project ? path.resolve(args.project) : process.cwd();
      const destination = path.join(project, TARGETS[target], path.basename(skill.path));
      const files = exportFiles(sourceDir);
      const commandArgs = [path.join(REPO_ROOT, 'bin', 'vibe-skills.js'), 'export', '--target', target, '--ids', skill.id, '--out', project];

      return textResult({
        id: skill.id,
        target,
        source: sourceDir,
        destination,
        flat: true,
        nativeLayoutIssues: skillCompatibility(skill),
        projectExplicit: Boolean(args.project),
        files,
        invocation: { command: 'node', args: commandArgs },
        command: `node ${commandArgs.map(shellQuote).join(' ')}`,
      });
    }

    case 'list_resources': {
      const category = lower(args.category).trim();
      const query = lower(args.query).trim();
      const limit = clampLimit(args.limit);

      if (category && !resourcesRegistry.categories.some((entry) => entry.id === category)) {
        return errorResult(
          `Unknown category "${args.category}". Valid categories: ${resourcesRegistry.categories.map((c) => c.id).join(', ')}`
        );
      }

      const matches = resources.filter((resource) => {
        if (category && resource.category !== category) return false;
        if (!query) return true;
        return [resource.id, resource.name, resource.description, resource.type, ...(resource.tags || [])]
          .map(lower)
          .some((value) => value.includes(query));
      });

      return textResult({
        category: category || null,
        query: args.query || null,
        total: matches.length,
        returned: Math.min(matches.length, limit),
        resources: matches.slice(0, limit),
      });
    }

    default:
      return errorResult(`Unknown tool "${name}".`);
  }
}

const remoteNames = new Set(['find_kit', 'get_skill', 'read_skill_file', 'explain_match', 'get_resource', 'report_outcome']);
const remoteInstructions = 'Call find_kit with the current brief. Supply structured intent from the conversation for compound tasks, explicit constraints or known project context. Resolve a question using known context first. Read the exact skill ID for the current stage with get_skill, then read_skill_file only for referenced text. Use the resource links where relevant. The kit is read-only.';

const validator = new AjvJsonSchemaValidator();
const validators = new Map(tools.map((tool) => [tool.name, validator.getValidator(tool.inputSchema)]));

function createServer({ remote = false, root = REPO_ROOT, endpoint } = {}) {
  const activeTools = remote ? tools.filter((tool) => remoteNames.has(tool.name)).map((tool) =>
    tool.name === 'get_skill' ? { ...tool, description: 'Read one exact skill ID, its provenance and a preview of supporting file names.' } : tool) : tools;
  const guidance = remote ? remoteInstructions : instructions;
  const server = new Server(
    { name: 'vibe-skills', version: require('../package.json').version },
    {
      capabilities: { tools: {}, prompts: {} },
      instructions: guidance,
    }
  );

  const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: activeTools.map((tool) => ({ ...tool, annotations: { ...annotations, openWorldHint: ['get_skill','read_skill_file'].includes(tool.name), ...(tool.name === 'report_outcome' ? { readOnlyHint: false, idempotentHint: false } : {}) } })),
  }));

  const prompt = {
    name: 'skillkit_start',
    description: 'Use SkillKit to select and apply skills for the current task.',
    arguments: [{ name: 'task', description: 'Optional task brief. Otherwise use the existing conversation.' }],
  };
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [prompt] }));
  server.setRequestHandler(GetPromptRequestSchema, async ({ params }) => {
    if (params.name !== prompt.name) throw new McpError(ErrorCode.InvalidParams, 'Unknown prompt: ' + params.name);
    const messages = [{ role: 'user', content: { type: 'text', text: guidance } }];
    if (params.arguments?.task) {
      if (params.arguments.task.length > 8000) throw new McpError(ErrorCode.InvalidParams, 'Task exceeds 8000 characters.');
      messages.push({ role: 'user', content: { type: 'text', text: params.arguments.task } });
    }
    return { messages };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const validate = (!remote || remoteNames.has(name)) && validators.get(name);
      if (!validate) return errorResult(`Unknown tool "${name}".`);
      const result = validate(args || {});
      if (!result.valid) return errorResult('Invalid arguments: ' + result.errorMessage);
      return await callTool(name, result.data, remote, root, endpoint);
    } catch (err) {
      if (remote && err.code) return errorResult('The catalog file is unavailable.');
      return errorResult(`Tool ${name} failed: ${err.message}`);
    }
  });

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`vibe-skills MCP server ready: ${skills.length} skills, ${domains.length} domains, ${resources.length} resources`);
}

module.exports = { createServer };

if (require.main === module) main().catch((err) => {
  console.error(`vibe-skills MCP server failed: ${err.stack || err.message}`);
  process.exit(1);
});
