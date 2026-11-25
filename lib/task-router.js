'use strict';

const path = require('node:path');
const { workflows, additions } = require('../workflows/routes.json');

const workflowIds = workflows.map(({ id }) => id);
const projectStates = ['new', 'existing', 'unknown'];
const constraints = ['no-deployment', 'design-only', 'no-implementation', 'free-resources-only'];
const boundedStrings = (limit, size) => ({
  type: 'array', maxItems: limit, uniqueItems: true,
  items: { type: 'string', minLength: 1, maxLength: size },
});
const intentSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['actions', 'projectState', 'deliverables'],
  properties: {
    actions: { type: 'array', maxItems: 6, uniqueItems: true, items: { type: 'string', enum: workflowIds } },
    projectState: { type: 'string', enum: projectStates },
    deliverables: boundedStrings(8, 240),
    stack: boundedStrings(12, 60),
    constraints: { type: 'array', uniqueItems: true, items: { type: 'string', enum: constraints } },
    topics: boundedStrings(12, 60),
    unresolvedDecision: { type: 'string', minLength: 1, maxLength: 240 },
  },
};

const agentRule = 'Before writing code, design specs, or creative assets, call SkillKit find_kit with the user’s brief and constraints (never clone or install the repository into the project). Pick the matching candidate card (or clarify one ambiguity if prompted), call get_kit with the chosen kitId and original request to expand it, then read only the active stage’s skill via get_skill (compact: true). Verify every returned check; if SkillKit reports gaps or no_match, state what is missing and continue only within covered parts.';

const instructions = [
  'For a compact task kit call find_kit first and use get_skill with compact: true when reading a selected ID. Pass known deliverables, actions and constraints as structured intent. For a detailed developer plan call SkillKit recommend_workflow first with the existing task brief and a structured intent. Read project context as needed before choosing an action.',
  'Infer actions from the requested deliverables, project state, and explicit user constraints. Classify the action, not the subject of the request. Adding to an existing portfolio is feature; writing its README is documentation; creating the first portfolio is new-web-project. Redesigning its existing pages is web-redesign. Use graphic-design for static artwork, video-edit for existing footage and motion-video for a timed composition.',
  'Use ordered action IDs (plan before build, release before deploy). Release means preparation only; include deploy only when the user explicitly asks to deploy. Preserve no-deployment, design-only, and no-implementation constraints.',
  'Pass known stack and short topics separately. Use actions: [] for a clear task outside the curated workflows; omit task and intent if no actual work was given. Ask at most one unresolved question when it would materially change the work.',
  'Load the applicable skills with get_skill and supporting files with read_skill_file. If no curated route fits, use the returned shortlist where relevant. Apply project conventions and user permissions, never treat routing as authorization.',
  'Complete the applicable stages and report evidence for each check as passed, failed, or skipped with a reason. Respect explicit constraints even if a returned skill suggests otherwise.',
].join(' ');

function skillCompatibility(skill) {
  const issues = [];
  if (!skill.frontmatter) issues.push('missing-frontmatter');
  if (skill.name !== path.basename(skill.path)) issues.push('name-folder-mismatch');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.name) || skill.name.length > 64) issues.push('nonstandard-name');
  if (skill.description.length > 1024) issues.push('description-over-standard-limit');
  return issues;
}

const normalize = (text) => text.toLowerCase().replace(/\bnext[. ]js\b/g, 'nextjs').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const terms = (text) => normalize(text).split(' ').filter((word) => word.length > 2);
const common = new Set(['the', 'and', 'for', 'this', 'with', 'only', 'from', 'into', 'help', 'want', 'need', 'work', 'using', 'existing', 'project', 'task', 'skill', 'skills', 'resource', 'resources', 'skillkit', 'agent', 'please', 'some', 'something', 'best', 'would', 'like', 'which', 'about', 'that', 'have', 'accurately', 'find', 'good', 'tools', 'tool', 'give', 'can', 'get', 'perfect', 'them', 'they', 'every', 'there', 'what', 'new', 'build', 'make', 'create', 'update', 'write', 'add', 'use', 'improve']);

function rankCatalog(entries, query, context) {
  const wanted = [...new Set(query.flatMap(terms))].filter((word) => !common.has(word));
  const stackWords = new Set(context.flatMap(terms));
  return entries.map((entry) => {
    const fields = terms([entry.id, entry.name, ...(entry.tags || [])].join(' '));
    const detail = terms(entry.description);
    const matches = wanted.filter((word) => fields.includes(word));
    const descriptionMatches = wanted.filter((word) => detail.includes(word) && !matches.includes(word));
    const score = matches.length * 4 + descriptionMatches.length;
    const compatible = fields.filter((word) => stackWords.has(word)).length;
    if (!matches.length && descriptionMatches.length < 2) return null;
    return { entry, score: score + Math.min(compatible, 2), matches: [...matches, ...descriptionMatches] };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id)).slice(0, 3);
}

function checkIntent(intent) {
  if (!intent || typeof intent !== 'object' || Array.isArray(intent)) throw new Error('intent must be an object.');
  for (const field of Object.keys(intent)) {
    if (!Object.hasOwn(intentSchema.properties, field)) throw new Error('Unknown intent field: ' + field);
  }
  for (const field of intentSchema.required) {
    if (!Object.hasOwn(intent, field)) throw new Error('Missing intent field: ' + field);
  }
  if (!projectStates.includes(intent.projectState)) throw new Error('Invalid projectState.');
  for (const [field, schema] of Object.entries(intentSchema.properties)) {
    const value = intent[field];
    if (value === undefined || schema.type !== 'array') continue;
    if (!Array.isArray(value) || value.length > (schema.maxItems ?? Infinity) || new Set(value).size !== value.length ||
        value.some((item) => typeof item !== 'string' || !item.trim() ||
          item.length > (schema.items.maxLength ?? Infinity) || (schema.items.enum && !schema.items.enum.includes(item)))) {
      throw new Error('Invalid ' + field + '.');
    }
  }
  if (intent.unresolvedDecision !== undefined && (typeof intent.unresolvedDecision !== 'string' ||
      !intent.unresolvedDecision.trim() || intent.unresolvedDecision.length > 240)) throw new Error('Invalid unresolvedDecision.');
}

const knownPrerequisites = {
  'media/hyperframes': ['A host that can run the HyperFrames renderer'],
  'automations/webapp-testing': ['A running or startable web app', 'Python and Playwright for the bundled browser test examples'],
  'automations/ego-browser': ['The ego-browser CLI and a compatible browser session'],
  'ui-ux/ui-ux-pro-max': ['Python for catalog search', 'Skill scripts and data available in the local checkout'],
  'backend-api/dbt-analytics-engineering': ['A configured dbt project for executing dbt checks'],
};

function createRouter(skills, resources) {
  const { mayDeliver } = require('./catalog-policy');
  const skillById = new Map(skills.map((skill) => [skill.id, skill]));
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
  const routeById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const missing = new Set();
  for (const { stages } of workflows) {
    for (const stage of stages) {
      if ((!stage.skill && !stage.resources?.length) || (stage.skill && !skillById.has(stage.skill))) missing.add(stage.skill);
      for (const id of stage.resources || []) if (!resourceById.has(id)) missing.add(id);
    }
  }
  for (const addition of additions) {
    if (addition.skill && !skillById.has(addition.skill)) missing.add(addition.skill);
    for (const id of addition.resources || []) if (!resourceById.has(id)) missing.add(id);
    for (const id of addition.workflows) {
      if (!routeById.get(id)?.stages.some((stage) => stage.id === addition.stage)) missing.add(id + ':' + addition.stage);
    }
  }
  if (missing.size) throw new Error('Workflow catalog references do not resolve: ' + [...missing].join(', '));

  function skillRef(id, reason) {
    const skill = skillById.get(id);
    return {
      id, name: skill.displayName || skill.name, reason, license: skill.license, origin: skill.origin,
      upstream: skill.upstream || null, sourcePath: skill.path + '/SOURCE.json',
      knownPrerequisites: knownPrerequisites[id] || [],
      hasSupportingScripts: skill.capabilities.includes('scripts'),
      nativeLayoutIssues: skillCompatibility(skill),
    };
  }

  function resourceRef(id, reason) {
    const { name, description, url, license, pricing } = resourceById.get(id);
    return { id, name, url, description, license, pricing, reason };
  }

  return function recommendWorkflow({ task = '', workflow, stack = '', intent } = {}) {
    const brief = task.trim();
    const question = (value, candidates = []) => ({ status: 'needs_clarification', question: value, candidates });
    if (intent !== undefined && workflow !== undefined) throw new Error('Pass intent or an explicit workflow, not both.');
    if (workflow !== undefined && !routeById.has(workflow)) throw new Error('Unknown workflow: ' + workflow);
    if (!brief && intent === undefined && !workflow) return question('What do you want to do?');
    if (!intent && !workflow) {
      return {
        status: 'needs_intent', candidates: workflows.map(({ id, title }) => ({ id, title })),
        next: 'Use the conversation and project context to supply structured intent, or select a workflow explicitly.',
      };
    }
    if (intent !== undefined) checkIntent(intent);
    const context = intent || { actions: [workflow], projectState: 'unknown', deliverables: [brief], stack: stack ? [stack] : [] };
    const restrictions = new Set(context.constraints || []);
    // These narrow vetoes protect callers that misread an explicit prohibition.
    // They can only remove work. The brief never selects a workflow.
    if (/\b(?:do not|don['’]t|no need to|never)\s+(?:actually\s+)?(?:deploy|publish|ship|release)\b|\bno (?:deployment|deploying)\b/i.test(brief)) restrictions.add('no-deployment');
    if (/\b(?:design only|mockups? only)\b/i.test(brief)) restrictions.add('design-only');
    if (/\b(?:no (?:implementation|coding)|(?:do not|don't) (?:implement|write code)|without (?:writing code|implementing))\b/i.test(brief)) restrictions.add('no-implementation');
    if (/\b(free (?:resources?|tools?|references?) only|only free (?:resources?|tools?|references?)|no paid (?:resources?|tools?|references?))\b/i.test(brief)) restrictions.add('free-resources-only');
    if (restrictions.has('design-only')) {
      restrictions.add('no-implementation');
      restrictions.add('no-deployment');
    }
    if (context.unresolvedDecision) return question(context.unresolvedDecision.endsWith('?') ? context.unresolvedDecision : context.unresolvedDecision.replace(/[.!]+$/, '') + '?');
    if (!context.deliverables.some((item) => item.trim())) return question('What do you want to do?');

    const actionIds = [...context.actions];
    if (actionIds.includes('new-web-project') && context.projectState === 'existing') {
      return question('Should this extend the existing project or create a separate one?', ['feature', 'new-web-project']);
    }
    if (actionIds.includes('plan') && actionIds.some((id, index) => ['feature', 'new-web-project', 'mobile'].includes(id) && index < actionIds.indexOf('plan'))) {
      return question('Should the requested plan come before implementation?', ['plan']);
    }

    const allowedActions = actionIds.filter((id) => !restrictions.has('no-deployment') || id !== 'deploy');
    if (restrictions.has('design-only') && allowedActions.some((id) => ['plan', 'design', 'new-web-project', 'web-redesign', 'feature'].includes(id))) {
      allowedActions.splice(0, allowedActions.length, 'design');
    }
    if (allowedActions.includes('deploy')) {
      const deployIndex = allowedActions.indexOf('deploy');
      const releaseIndex = allowedActions.indexOf('release');
      if (releaseIndex === -1) allowedActions.splice(deployIndex, 0, 'release');
      else if (releaseIndex > deployIndex) return question('Should release checks run before deployment?', ['release', 'deploy']);
      if (allowedActions.slice(allowedActions.indexOf('deploy') + 1).some((id) => ['new-web-project', 'feature', 'mobile', 'debug', 'plan'].includes(id))) {
        return question('Which changes should be included before deployment?', ['release', 'deploy']);
      }
    }

    const allowedResource = (r) => !restrictions.has('free-resources-only') || r.pricing === 'free';
    const stackFacts = context.stack || [];
    const topicFacts = context.topics || [];
    if (!allowedActions.length) {
      if (actionIds.length) return { status: 'no_applicable_stages', constraints: [...restrictions], next: 'The requested actions are excluded by the user’s constraints.' };
      const query = [...context.deliverables, ...topicFacts];
      const reason = (match) => 'Matches task terms: ' + match.matches.join(', ');
      return {
        status: 'no_curated_match', constraints: [...restrictions],
        skills: rankCatalog(skills.filter(mayDeliver), query, stackFacts).map((match) => skillRef(match.entry.id, reason(match))),
        resources: rankCatalog(resources.filter(allowedResource), query, stackFacts).map((match) => resourceRef(match.entry.id, reason(match))),
        next: 'Use the shortlist only where it is relevant and compatible with the user’s constraints.',
      };
    }

    const facts = new Set([...stackFacts, ...topicFacts].map(normalize));
    const stackOnly = new Set(stackFacts.map(normalize));
    const selected = allowedActions.map((id) => routeById.get(id));
    const stages = [];
    for (const route of selected) {
      for (const stage of route.stages) {
        if (!isAllowedStage(stage, route.id, restrictions)) continue;
        const relevant = additions.filter((item) => item.workflows.includes(route.id) && item.stage === stage.id &&
          item.topics.some((topic) => facts.has(normalize(topic))) &&
          (!item.whenStack || item.whenStack.some((name) => stackOnly.has(normalize(name)))));
        const refs = new Map();
        if (stage.skill && mayDeliver(skillById.get(stage.skill))) refs.set(stage.skill, skillRef(stage.skill, stage.outcome));
        for (const item of relevant) {
          if (refs.size >= 3) break;
          if (item.skill && mayDeliver(skillById.get(item.skill)) && !refs.has(item.skill)) refs.set(item.skill, skillRef(item.skill, item.reason));
        }
        const resourceIds = new Set([...(stage.resources || []), ...relevant.flatMap((item) => item.resources || [])]);
        stages.push({
          id: route.id + '/' + stage.id, effect: stage.effect,
          outcome: stage.outcome, check: stage.check, evidence: stage.check,
          skills: [...refs.values()], resources: [...resourceIds].filter((id) => allowedResource(resourceById.get(id))).slice(0, 4).map((id) => resourceRef(id, 'Reference for this workflow stage.')),
        });
      }
    }

    if (!stages.length) return { status: 'no_applicable_stages', constraints: [...restrictions], next: 'The requested actions have no stages compatible with the user’s constraints.' };
    const active = new Set(stages.map(({ id }) => id.split('/')[0]));
    return {
      status: stages.every(s => s.skills.length || s.resources.length) ? 'ready' : 'partial', projectState: context.projectState, deliverables: context.deliverables, constraints: [...restrictions],
      workflows: selected.filter(({ id }) => active.has(id)).map(({ id, title, verificationTier }) => ({ id, title, verificationTier })),
      stages,
      next: 'Load the first applicable stage by exact skill ID. Report each check as passed, failed, or skipped with a reason.',
    };
  };
}

function isAllowedStage(stage, action, restrictions) {
  if (restrictions.has('no-deployment') && stage.effect === 'deployment') return false;
  if (restrictions.has('no-implementation') && (stage.effect === 'implementation' ||
      ['new-web-project', 'feature', 'mobile', 'debug', 'testing'].includes(action))) return false;
  return true;
}

module.exports = { createRouter, workflowIds, instructions, agentRule, skillCompatibility, intentSchema };
