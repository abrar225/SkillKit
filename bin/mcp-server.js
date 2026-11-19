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
const { listFiles, readSkillFile } = require('../lib/skill-files');
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
const SKILLS_FILE = path.join(REPO_ROOT, 'registry', 'skills.json');
const DOMAINS_FILE = path.join(REPO_ROOT, 'registry', 'domains.json');
const RESOURCES_FILE = path.join(REPO_ROOT, 'registry', 'resources.json');

const TARGETS = require('../lib/export-layout');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const skillsRegistry = readJson(SKILLS_FILE);
const domainsRegistry = readJson(DOMAINS_FILE);
const resourcesRegistry = readJson(RESOURCES_FILE);

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

function textResult(payload) {
  return {
    structuredContent: payload,
    content: [
      {
        type: 'text',
        text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
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

async function callTool(name, args) {
  switch (name) {
    case 'recommend_workflow':
      return textResult(recommendWorkflow(args));

    case 'read_skill_file': {
      const skill = skills.find(({ id }) => id === args.id);
      if (!skill) return errorResult('Use an exact skill ID returned by recommend_workflow or search_skills.');
      const content = readSkillFile(path.join(REPO_ROOT, skill.path), args.file);
      return textResult({ id: skill.id, file: args.file, content });
    }

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
      const skill = resolveSkill(args.id);
      if (!skill) return errorResult(`No skill matches "${args.id}". Use search_skills to find one.`);

      const skillDir = path.join(REPO_ROOT, skill.path);
      const skillFile = path.join(skillDir, 'SKILL.md');
      const sourceFile = path.join(skillDir, 'SOURCE.json');
      const instructions = fs.existsSync(skillFile) ? fs.readFileSync(skillFile, 'utf8') : '';
      const source = fs.existsSync(sourceFile) ? readJson(sourceFile) : null;
      const supportingFiles = listFiles(skillDir);

      return textResult({
        skill: publicSkill(skill),
        instructions,
        provenance: source,
        supportingFiles: supportingFiles.slice(0, 60),
        supportingFileCount: supportingFiles.length,
      });
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

async function main() {
  const server = new Server(
    { name: 'vibe-skills', version: require('../package.json').version },
    {
      capabilities: { tools: {}, prompts: {} },
      instructions,
    }
  );

  const validator = new AjvJsonSchemaValidator();
  const validateArgs = new Map(tools.map((tool) => [tool.name, validator.getValidator(tool.inputSchema)]));
  const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({ ...tool, annotations })),
  }));

  const prompt = {
    name: 'skillkit_start',
    description: 'Use SkillKit to select and apply skills for the current developer task.',
    arguments: [{ name: 'task', description: 'Optional task brief. Otherwise use the existing conversation.' }],
  };
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [prompt] }));
  server.setRequestHandler(GetPromptRequestSchema, async ({ params }) => {
    if (params.name !== prompt.name) throw new McpError(ErrorCode.InvalidParams, 'Unknown prompt: ' + params.name);
    const messages = [{ role: 'user', content: { type: 'text', text: instructions } }];
    if (params.arguments?.task) {
      if (params.arguments.task.length > 8000) throw new McpError(ErrorCode.InvalidParams, 'Task exceeds 8000 characters.');
      messages.push({ role: 'user', content: { type: 'text', text: params.arguments.task } });
    }
    return { messages };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const validate = validateArgs.get(name);
      if (!validate) return errorResult(`Unknown tool "${name}".`);
      const result = validate(args || {});
      if (!result.valid) return errorResult('Invalid arguments: ' + result.errorMessage);
      return await callTool(name, result.data);
    } catch (err) {
      return errorResult(`Tool ${name} failed: ${err.message}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`vibe-skills MCP server ready: ${skills.length} skills, ${domains.length} domains, ${resources.length} resources`);
}

main().catch((err) => {
  console.error(`vibe-skills MCP server failed: ${err.stack || err.message}`);
  process.exit(1);
});
