'use strict';

const { createRouter, workflowIds, intentSchema } = require('./task-router');
const { skills } = require('../registry/skills.json');
const { resources } = require('../registry/resources.json');
const { workflows } = require('../workflows/routes.json');

const recommend = createRouter(skills, resources);
const titles = new Map(workflows.map(({ id, title }) => [id, title]));
const resourceById = new Map(resources.map((item) => [item.id, item]));
const inputSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    task: { type: 'string', maxLength: 8000 },
    intent: intentSchema,
    workflow: { type: 'string', enum: workflowIds },
    stack: { type: 'string', maxLength: 200 },
  },
};

// These cues serve clients without a model-generated intent. Avoid inferring deployment
// or choosing a framework from a brief. Multiple plausible outputs need a decision.
const stackPatterns = [
  ['Next.js', /\bnext[. ]?js\b/i],
  ['React', /\breact\b(?![- ]native)/i],
  ['React Native', /\breact[- ]native\b/i],
  ['Flutter', /\bflutter\b/i],
];

const cues = [
  ['web-redesign', /\b(redesign|restyle|refresh|overhaul|revamp|rework)\b/i, /\b(portfolio|site|website|web site|web app|homepage|landing page|website's|dashboard)\b/i],
  ['new-web-project', /\b(build|create|launch|make)\b/i, /\b(new website|new portfolio|portfolio website|landing page|first website|first portfolio)\b/i],
  ['graphic-design', /\b(poster|flyer|infographic|static graphic|album cover|book cover|print artwork)\b/i],
  ['video-edit', /\b(video edit(?:ing)?|edit|trim|cut|encode|transcode|subtitles?|captions?|crop|splice)\b/i, /\b(video|footage|clip|mp4|recording|interview)\b/i],
  ['motion-video', /\b(motion graphics?|animated explainer|launch film|hyperframes|product reel)\b/i],
  ['generative-art', /\b(generative art|algorithmic art|flow field|seeded sketch|p5\.js)\b/i],
  ['editorial', /\b(write|draft|rewrite|reshape|edit)\b/i, /\b(article|essay|blog post|newsletter)\b/i],
  ['api-data', /\b(design|model|test|implement)\b/i, /\b(api|database schema|data model)\b/i],
  ['architecture', /\b(architecture review|system architecture|architecture decision)\b/i],
  ['mobile', /\b(build|create)\b/i, /\b(mobile app|flutter app|react native app)\b/i],
  ['performance', /\b(profile|optimi[sz]e|measure|improve)\b/i, /\b(performance|latency|load time)\b/i],
  ['browser-check', /\b(browser test|test in (?:a |the )?browser|browser smoke test)\b/i],
  ['documentation', /\b(write|update|rewrite|document|draft)\b/i, /\b(readme|api docs|developer documentation)\b/i],
  ['debug', /\b(fix|debug|diagnose|investigate)\b/i, /\b(crash|regression|exception|failing test)\b/i],
  ['testing', /\b(unit tests?|integration tests?)\b/i, /\b(write|add|cover)\b/i],
  ['review', /\b(code review|review (?:my |the |this )?(?:diff|pull request))\b/i],
];

function clarify(question, ids = []) {
  return { status: 'needs_clarification', question, choices: ids.map((id) => ({ id, title: titles.get(id) })) };
}

function infer(task, stack, workflow) {
  if (workflow !== undefined && !titles.has(workflow)) throw new Error('Unknown workflow: ' + workflow);
  const missingBrief = /^(?:please )?(?:help(?: me)?|(?:find|suggest)(?: me)? (?:some |the )?(?:best |good )?(?:skills|tools|resources))[.!? ]*$/i;
  if (!task || missingBrief.test(task)) return clarify('What would you like to make, change or check?');
  const clauses = task.split(/[.!?](?:\s|$)|[;\n]|,?\s+(?:but|instead)\s+/i);
  const negative = /\b(?:do not|don['’]t|no(?: need to)?|without|never|avoid)\b/i;
  const subject = clauses.map((part) => part.split(negative)[0].trim()).filter(Boolean).join(' ');
  if (!subject) return clarify('What deliverable should the kit help with?');
  let ids = cues.filter(([, ...patterns]) => patterns.every((pattern) => pattern.test(subject))).map(([id]) => id);
  if (ids.includes('web-redesign')) ids = ids.filter((id) => id !== 'new-web-project');
  if (/\b(?:add|implement|build)\s+(?:a |an |the )?[^.!?]{0,60}\b(?:button|feature|widget)\b/i.test(subject) && !ids.includes('web-redesign')) {
    ids = ['feature'];
  }
  if (workflow !== undefined) ids = [workflow];
  if (ids.length > 1) return clarify('Which deliverable should the kit cover first?', ids);
  if (!ids.length) {
    if (/\b(video|footage)\b/i.test(subject)) return clarify('Are you editing existing footage or composing a motion graphic?', ['video-edit', 'motion-video']);
    if (/\b(portfolio|site|website|homepage)\b/i.test(subject)) return clarify('Are you redesigning an existing site or creating a new one?', ['web-redesign', 'new-web-project']);
    if (/\b(design|creative|graphic|brand|visuals?)\b/i.test(subject)) return clarify('What should the finished deliverable be?', ['web-redesign', 'graphic-design', 'motion-video']);
  }
  const stackFacts = (stack || '').split(',').map((name) => name.trim()).filter(Boolean);
  for (const [name, pattern] of stackPatterns) {
    if (pattern.test(subject) && !stackFacts.includes(name)) stackFacts.push(name);
  }
  const topics = /\b(hover|animations?|microinteractions)\b/i.test(subject) ? ['motion'] : [];
  return recommend({ task, intent: {
    actions: ids, projectState: ids.includes('web-redesign') ? 'existing' : 'unknown',
    deliverables: [subject.slice(0, 240)], topics, stack: [...new Set(stackFacts)],
  } });
}

function findKit({ task = '', workflow, stack = '', intent } = {}) {
  if (typeof task !== 'string' || task.length > 8000 || typeof stack !== 'string' || stack.length > 200) {
    throw new Error('Supply a task up to 8000 characters and a stack up to 200 characters.');
  }
  const plan = intent !== undefined
    ? recommend({ task, workflow, stack, intent })
    : infer(task.trim(), stack, workflow);
  if (plan.status === 'needs_clarification') {
    return plan.choices ? plan : clarify(plan.question, plan.candidates);
  }
  if (plan.status === 'no_applicable_stages') return { status: plan.status, constraints: plan.constraints, next: plan.next };
  const stages = plan.stages || [];
  const picked = new Map();
  const links = new Map();
  const skillRefs = plan.skills || stages.flatMap((stage) => stage.skills);
  const resourceRefs = plan.resources || stages.flatMap((stage) => stage.resources);
  for (const { id, reason, license, knownPrerequisites } of skillRefs) {
    picked.set(id, { id, reason, license, ...(knownPrerequisites.length ? { prerequisites: knownPrerequisites } : {}) });
  }
  for (const { id, name, url, pricing, reason } of resourceRefs) {
    links.set(id, { id, name, url, pricing, why: stages.length ? resourceById.get(id).why : reason });
  }
  if (!stages.length && !picked.size && !links.size) {
    return { status: 'no_match', next: 'No matching catalog entry. Add a tool, medium or specific deliverable to refine the brief.' };
  }
  return {
    status: stages.length ? 'ready' : 'catalog_matches',
    workflows: (plan.workflows || []).map(({ id }) => id), constraints: plan.constraints,
    stages: stages.map(({ id, outcome, check, skills, resources }) => ({
      id, ...(!skills.length ? { outcome } : {}), skills: skills.map((s) => s.id), resources: resources.map((r) => r.id), check,
    })),
    skills: [...picked.values()], resources: [...links.values()],
    next: stages.length ? 'Use the listed references for the current stage. Read a skill only when that stage names it. Verify the stage check.' :
      'These are catalog keyword matches. Check their fit against the brief before reading any instructions.',
  };
}

const githubRoot = 'https://github.com/abrar225/SkillKit/blob/main/';
function formatKit(kit, skillUrl = (id) => githubRoot + 'skills/' + id + '/SKILL.md') {
  if (kit.question) return [kit.question, ...kit.choices.map((choice) => '- ' + choice.title + ' (' + choice.id + ')')].join('\n');
  if (!kit.skills) return kit.next;
  const lines = ['# ' + (kit.workflows.map((id) => titles.get(id)).join(' → ') || 'Catalog matches'), ''];
  if (kit.constraints.length) lines.push('Constraints: ' + kit.constraints.join(', '), '');
  for (const s of kit.skills) {
    lines.push('- [' + s.id + '](' + skillUrl(s.id) + ') · ' + s.license + '. ' + s.reason);
    if (s.prerequisites) lines.push('  Requires ' + s.prerequisites.join(', '));
  }
  for (const r of kit.resources) lines.push('- [' + r.name + '](' + r.url + ') · ' + r.pricing + '. ' + r.why);
  for (const stage of kit.stages) {
    lines.push('', '**' + stage.id + '** (' + [...stage.skills, ...stage.resources].join(', ') + ')');
    if (stage.outcome) lines.push(stage.outcome);
    lines.push(stage.check);
  }
  return [...lines, '', kit.next].join('\n');
}

module.exports = { findKit, formatKit, inputSchema };
