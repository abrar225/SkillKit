'use strict';

const { createRouter } = require('./task-router');
const { parseIntent, inputSchema, canonicalTool, canonicalFormat } = require('./intent-contract');
const { indexCandidates } = require('./task-retrieval');
const { local, openResources, toolResources, roleByStage, whenByRole } = require('./task-capabilities');
const { mayDeliver, isPermissive } = require('./catalog-policy');
const { listFederated } = require('./federation');
const { skills } = require('../registry/skills.json');
const { resources } = require('../registry/resources.json');
const { workflows } = require('../workflows/routes.json');

const recommend = createRouter(skills, resources);
const workflowById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
const skillById = new Map(skills.map((item) => [item.id, item]));
const resourceById = new Map(resources.map((item) => [item.id, item]));
const unique = (values) => [...new Set(values)];
const terse = (value, limit = 95) => value.length <= limit ? value : value.slice(0, limit - 1).replace(/\s+\S*$/, '') + '…';

const personas = new Map();
const titles = new Map(workflows.map(({ id, title }) => [id, title]));
const reasons = {
  scope: 'Define scope and acceptance criteria.', plan: 'Order testable implementation slices.',
  design: 'Set a direction from content and constraints.', implement: 'Implement a focused, stack-native change.',
  verify: 'Verify the output with relevant checks.', draft: 'Shape the draft around the source material.',
};
const stageName = (id) => id.split('/').at(-1);
const excludedByDesign = new Set(['feature', 'debug', 'mobile-app', 'tests', 'mcp-server', 'dbt-tests', 'dbt-model', 'generative-art']);
const toolsExcludedByBudget = {
  free: new Set(['premiere-pro', 'after-effects', 'illustrator', 'photoshop', 'indesign', 'affinity-designer', 'final-cut-pro', 'bigquery']),
  'open-source': new Set(['davinci-resolve', 'premiere-pro', 'after-effects', 'illustrator', 'photoshop', 'indesign', 'affinity-designer',
    'final-cut-pro', 'figma', 'canva', 'capcut', 'remotion', 'bigquery', 'google-docs', 'mailchimp', 'substack']),
};
const genericStacks = new Set(['react', 'nextjs', 'html', 'css', 'javascript', 'typescript', 'python', 'nodejs', 'ruby', 'swift', 'go', 'rust',
  'kotlin', 'tailwindcss', 'vue', 'svelte', 'angular', 'astro']);
const skillTools = new Map([
  ['ui-ux/framer-motion-animator', ['react', 'nextjs']],
  ['frontend/vercel-react-best-practices', ['react', 'nextjs']],
  ['mobile/flutter-architecture', ['flutter']], ['mobile/react-native-skills', ['react-native']],
  ['backend-api/supabase-postgres-best-practices', ['postgresql', 'supabase']],
  ['backend-api/prisma-client-api', ['prisma']], ['backend-api/dbt-analytics-engineering', ['dbt', 'dbt-core']],
  ['media/hyperframes', ['hyperframes']], ['media/algorithmic-art', ['p5js']],
]);
const resourceTools = new Map(resources.map(({ id }) => [id, Object.keys(toolResources).filter((tool) => toolResources[tool].includes(id))]));

const baseSkill = (id, reason) => {
  const skill = skillById.get(id);
  if (!skill || !mayDeliver(skill)) return null;
  return { id, reason: terse(reason || skill.description), license: skill.license };
};
const baseResource = (id) => {
  const resource = resourceById.get(id);
  return resource ? { id, name: resource.name, url: resource.url, why: terse(resource.why || resource.description), pricing: resource.pricing } : null;
};
const hasIntersection = (left, right) => left.some((item) => right.includes(item));
const skillAllowed = (id, { forbiddenTools }) => !hasIntersection(skillTools.get(id) || [], forbiddenTools);
const resourceAllowed = (id, { budget, constraints, forbiddenTools }) => {
  const resource = resourceById.get(id);
  if (!resource || hasIntersection(resourceTools.get(id) || [], forbiddenTools) || forbiddenTools.includes(id)) return false;
  if ((budget === 'free' || constraints.includes('free-resources-only')) && resource.pricing !== 'free') return false;
  return budget !== 'open-source' || openResources.has(id);
};
const lockToolEvidence = (tool) => !['html', 'css', 'python', 'typescript', 'nodejs', 'dbt', 'dbt-core'].includes(tool);
const disabled = (item, contract) => (contract.constraints.includes('no-deployment') && item.kind === 'deploy') ||
  (contract.constraints.includes('no-implementation') && excludedByDesign.has(item.kind));

function enrich(candidate) {
  const baseStages = candidate.stages || workflowById.get(candidate.workflow)?.stages.map((stage) => ({
    skillIds: stage.skill ? [stage.skill] : [], resourceIds: stage.resources || [],
  })) || [];
  const entries = baseStages.flatMap(({ skillIds, resourceIds }) => [
    ...skillIds.map((id) => skillById.get(id)), ...resourceIds.map((id) => resourceById.get(id)),
  ]).filter(Boolean);
  return {
    ...candidate,
    title: titles.get(candidate.workflow) || candidate.id,
    description: entries.map((item) => item.description).join(' '),
    tags: unique(entries.flatMap((item) => item.tags || [])),
  };
}

const retrieveLocal = indexCandidates(local.map(enrich));

function canonicalFederated(entry) {
  if (!entry || !entry.id?.startsWith('federated/') || !isPermissive(entry.license)) return null;
  return { ...entry, tools: (entry.tools || []).map(canonicalTool), formats: (entry.formats || []).map(canonicalFormat), federated: true };
}

function getLocalStages(candidate, contract) {
  if (candidate.stages) return candidate.stages;
  const stack = contract.project.stack.map((tool) => ({ nextjs: 'Next.js', 'react-native': 'React Native' })[tool] || tool);
  const topics = unique([...stack, ...contract.topics, ...contract.tools]).slice(0, 12);
  const constraints = contract.constraints.filter((item) => item !== 'open-source-only');
  const action = candidate.workflow;
  const actions = [action];
  if (action === 'api-data' && /\b(?:implement|build)\b/i.test(contract.task)) actions.push('feature');
  const intent = { actions, projectState: contract.project.state, deliverables: [candidate.kind], stack: stack.slice(0, 12), topics, constraints };
  if (action === 'new-web-project' && intent.projectState === 'existing') intent.projectState = 'unknown';
  const plan = recommend({ task: contract.task, intent });
  return (plan.stages || []).map((entry) => ({
    id: entry.id,
    role: roleByStage[stageName(entry.id)] || 'build',
    check: entry.check,
    when: whenByRole[roleByStage[stageName(entry.id)] || 'build'],
    skillIds: entry.skills.map(({ id }) => id),
    resourceIds: entry.resources.map(({ id }) => id),
    reasons: Object.fromEntries(entry.skills.map(({ id, reason }) => [id, reason])),
    capability: entry.effect,
  }));
}

function qualityGaps(contract, request, stages) {
  if (!contract.qualityBar.length) return [];
  const checks = stages.map((stage) => stage.check.toLowerCase()).join(' ');
  const evidence = [
    [/\b(?:keyboard|focus|accessibility|a11y|wcag|contrast)\b/i, /keyboard|focus|contrast|accessibility/],
    [/\b(?:responsive|mobile|desktop)\b/i, /phone|desktop|responsive|mobile|narrow/],
    [/\b(?:frame rate|fps|frame count|dimensions|resolution|duration|sync)\b/i, /frame|length|dimensions|sync|timing/],
    [/\b(?:loudness|peak|noise)\b/i, /loudness|peak|filtering/],
    [/\b(?:test|fixture|regression|edge cases)\b/i, /test|normal, error|checks|verify|fixture/],
    [/\b(?:copy|claims|links|tone|draft)\b/i, /claim|draft|read aloud|link/],
  ];
  return contract.qualityBar.filter((quality) => !evidence.some(([requestPattern, checkPattern]) =>
    requestPattern.test(quality) && checkPattern.test(checks)) &&
    !request.features.some((feature) => quality.toLowerCase().includes(feature.replaceAll('-', ' '))));
}

function evaluate(match, request, contract) {
  const { candidate, declared } = match;
  const soft = [];
  const reject = (reason) => ({ match, rejected: reason, gaps: [], stages: [] });
  if (!declared) return reject('Deliverable type is not documented.');
  if (disabled(request, contract)) return reject('The requested work conflicts with the project constraints.');

  const offeredTools = candidate.tools || [];
  const forbidden = offeredTools.filter((tool) => contract.forbiddenTools.includes(tool));
  if (forbidden.length && (candidate.stages || candidate.federated)) return reject('Requires an excluded tool: ' + forbidden.join(', ') + '.');
  if (candidate.requiresTool?.length && !hasIntersection(candidate.requiresTool, [...request.tools, ...contract.project.stack])) {
    return reject('Requires an explicitly selected tool or compatible project stack.');
  }
  if (request.tools.some((tool) => contract.forbiddenTools.includes(tool))) return reject('A required tool is also excluded.');
  const budgetConflict = request.tools.filter((tool) =>
    toolsExcludedByBudget[contract.budget]?.has(tool) || (contract.budget === 'open-source' && contract.constraints.includes('free-resources-only') &&
    toolsExcludedByBudget.free.has(tool)));
  if (budgetConflict.length) return reject('Required tool violates the requested budget: ' + budgetConflict.join(', ') + '.');
  const unsupportedTools = request.tools.filter((tool) => !offeredTools.includes(tool) &&
    !(candidate.stackCompatible && genericStacks.has(tool)));
  if (unsupportedTools.some((tool) => !(candidate.compatibleTools || []).includes(tool))) {
    return reject('Requires different tooling. Missing: ' + unsupportedTools.join(', ') + '.');
  }
  if (unsupportedTools.length) soft.push('Missing tool-specific guidance for ' + unsupportedTools.join(', ') + '.');
  const missingFormats = request.formats.filter((item) => !(candidate.formats || []).includes(item));
  if (missingFormats.length) {
    if ((candidate.formats || []).some((format) => ['plain-text', 'png', 'html', 'mp4'].includes(format)) &&
        request.formats.every((format) => ['drp', 'drt', 'prproj', 'aep', 'fig', 'psd', 'ai', 'fcpxml'].includes(format))) {
      return reject('Cannot produce the requested native file format.');
    }
    soft.push('Missing output format: ' + missingFormats.join(', ') + '.');
  }
  const missingFeatures = request.features.filter((item) => !(candidate.features || []).includes(item));
  if (missingFeatures.length) soft.push('Missing support for ' + missingFeatures.join(', ') + '.');
  if (candidate.incomplete) soft.push(candidate.incomplete);

  let stageRefs;
  if (candidate.federated) {
    if (contract.budget !== 'any' && (candidate.pricing !== 'free' || request.tools.some((tool) => lockToolEvidence(tool)))) {
      return reject('Federated entry does not establish the required tool budget.');
    }
    stageRefs = [{
      id: candidate.stage, role: candidate.stage, check: 'Verify the requested artifact and constraints against the pinned skill.',
      when: whenByRole[candidate.stage] || whenByRole.build,
      federatedSkills: [{ id: candidate.id, reason: terse(candidate.description), license: candidate.license }],
    }];
  } else {
    stageRefs = getLocalStages(candidate, contract);
  }

  const stages = [];
  for (const entry of stageRefs) {
    if (contract.stage && entry.role !== contract.stage) continue;
    if (contract.constraints.includes('no-implementation') && entry.capability === 'implementation') continue;
    let skillRefs = entry.federatedSkills || (entry.skillIds || []).filter((id) => skillAllowed(id, contract))
      .map((id) => baseSkill(id, entry.reasons?.[id] && !reasons[stageName(entry.id)] ? entry.reasons[id] : reasons[stageName(entry.id)])).filter(Boolean);
    const resourceRefs = (entry.resourceIds || []).filter((id) => resourceAllowed(id, contract)).map(baseResource);
    if ((candidate.kind === 'web-site' || candidate.kind === 'web-redesign' || candidate.kind === 'ui-design') &&
        entry.role === 'design' && contract.topics.includes('motion') && resourceRefs.some(({ id }) => id === 'motion') &&
        !skillRefs.some(({ id }) => id === 'ui-ux/framer-motion-animator') && !contract.constraints.includes('no-implementation')) {
      const animation = baseSkill('ui-ux/animate', 'Set motion intent, timing, and reduced-motion behavior.');
      if (animation) skillRefs = [...skillRefs, animation];
    }
    if (!skillRefs.length && !resourceRefs.length) continue;
    const prefix = candidate.workflow || request.kind;
    const id = entry.id.includes('/') ? entry.id : prefix + '/' + entry.id;
    stages.push({ id, role: entry.role, when: entry.when, check: entry.check, skillRefs, resourceRefs });
  }
  if (!stages.length) return reject('No deliverable stage passes the tool, budget, stage, and license checks.');
  const stageSkillIds = stages.flatMap(({ skillRefs }) => skillRefs.map(({ id }) => id));
  const stageResourceIds = stages.flatMap(({ resourceRefs }) => resourceRefs.map(({ id }) => id));
  for (const tool of request.tools) {
    if (unsupportedTools.includes(tool) || candidate.federated || !lockToolEvidence(tool)) continue;
    if ((toolResources[tool] || []).length && !hasIntersection(toolResources[tool], stageResourceIds) &&
        !stageSkillIds.some((id) => (skillTools.get(id) || []).includes(tool))) {
      soft.push('No selected item verifies ' + tool + ' support under the requested constraints.');
    }
  }
  const unsupportedQuality = qualityGaps(contract, request, stages);
  if (unsupportedQuality.length) soft.push('No verification for: ' + unsupportedQuality.join(', ') + '.');
  return { match, stages, gaps: unique(soft) };
}

function select(options) {
  return options.filter((item) => !item.rejected && item.stages.length)
    .sort((a, b) => a.gaps.length - b.gaps.length ||
      Number(Boolean(a.match.candidate.federated)) - Number(Boolean(b.match.candidate.federated)) ||
      (b.match.lexical + 3 * b.match.similarity) - (a.match.lexical + 3 * a.match.similarity))[0];
}

function findReference(request, contract) {
  if (request.kind !== 'reference') return [];
  const terms = request.text.toLowerCase();
  return resources.filter(({ id, name }) => {
    const word = name.toLowerCase();
    return request.tools.includes(id) || (word.length >= 4 && new RegExp('(?:^|\\W)' + word.replace(/[.*+?^$${}()|[\]\\]/g, '\\$&') + '(?:$|\\W)').test(terms));
  }).filter(({ id }) => resourceAllowed(id, contract)).slice(0, 1).map((resource) => {
    const candidate = { id: resource.id, title: resource.name, kind: request.kind };
    const ref = baseResource(resource.id);
    return {
      match: { candidate, lexical: 1, similarity: 0, declared: true, terms: [resource.name] },
      stages: [{ id: 'reference/read', when: 'When checking the named tool.', check: 'Confirm the example applies to the project version.',
        skillRefs: [], resourceRefs: [ref] }],
      gaps: request.formats.length ? ['Named reference does not establish the requested output format.'] : [],
    };
  });
}

function combineStages(selections) {
  const stages = new Map();
  for (const entry of selections.flatMap(({ stages }) => stages)) {
    const previous = stages.get(entry.id);
    if (!previous) {
      stages.set(entry.id, { ...entry });
      continue;
    }
    previous.skillRefs = [...new Map([...previous.skillRefs, ...entry.skillRefs].map((skill) => [skill.id, skill])).values()];
    previous.resourceRefs = [...new Map([...previous.resourceRefs, ...entry.resourceRefs].map((resource) => [resource.id, resource])).values()];
  }
  return [...stages.values()];
}

function describeGap(request, contract) {
  const needs = [...request.tools, ...request.formats, ...request.features].filter(Boolean);
  if (disabled(request, contract)) return 'Requested ' + request.kind + ' conflicts with the project constraints.';
  if (request.tools.some((tool) => contract.forbiddenTools.includes(tool))) return 'A required tool is also explicitly excluded.';
  const budget = contract.budget === 'any' ? '' : ' under the ' + contract.budget + ' budget';
  const name = request.kind === 'unknown' ? '"' + terse(request.text, 90) + '"' : request.kind.replaceAll('-', ' ');
  return 'No verified kit for ' + name + (needs.length ? ' (' + needs.join(', ') + ')' : '') + budget + '.';
}

function assemble(input, { federatedCandidates = listFederated } = {}) {
  const contract = parseIntent(input);
  const choices = contract.clarification?.choices.map((id) => ({ id, title: titles.get(id) }));
  const selected = [];
  const exclusions = [];
  const gaps = [];
  const covers = [];
  let federatedSearch;
  if (!contract.clarification) {
    for (const request of contract.deliverables) {
      const query = [request.text, ...request.tools, ...request.formats, ...request.features, ...contract.project.stack].join(' ');
      let matches = retrieveLocal(query, request.kind).map((match) => evaluate(match, request, contract));
      matches.push(...findReference(request, contract));
      const localChoice = select(matches);
      if (!localChoice || localChoice.gaps.length) {
        if (!federatedSearch) {
          const entries = federatedCandidates(contract).map(canonicalFederated).filter(Boolean);
          federatedSearch = indexCandidates(entries);
        }
        const remote = federatedSearch(query, request.kind)
          .filter(({ declared }) => declared).map((match) => evaluate(match, request, contract));
        matches = [...matches, ...remote];
      }
      const choice = select(matches);
      if (choice) selected.push(choice);
      const uncovered = choice ? choice.gaps : [describeGap(request, contract)];
      gaps.push(...uncovered);
      covers.push({ kind: request.kind, ...(choice ? { candidate: choice.match.candidate.id } : {}), gaps: uncovered });
      for (const option of matches) {
        if (choice === option || !option.match.declared) continue;
        exclusions.push({ id: option.match.candidate.id, reason: option.rejected || option.gaps[0] || 'A more specific or higher-trust match was selected.' });
      }
    }
  }
  for (const [field, label] of [['tools', 'tools'], ['formats', 'formats']]) {
    const unassigned = contract[field].filter((value) => !contract.deliverables.some((item) => item[field].includes(value)));
    if (unassigned.length) gaps.push('No selected deliverable establishes the required ' + label + ': ' + unassigned.join(', ') + '.');
  }
  if (contract.omittedDeliverables) gaps.push(contract.omittedDeliverables + ' additional deliverables require a separate brief.');
  if (!contract.deliverables.length && !contract.clarification) gaps.push('A concrete deliverable is needed.');
  if (contract.clarification) gaps.push('The deliverable depends on one unresolved decision.');
  const allStages = combineStages(selected);
  const pickedSkills = [...new Map(allStages.flatMap(({ skillRefs }) => skillRefs.map((skill) => [skill.id, skill]))).values()];
  const pickedResources = [...new Map(allStages.flatMap(({ resourceRefs }) => resourceRefs.map((resource) => [resource.id, resource]))).values()];
  const status = gaps.length ? (allStages.length || contract.clarification ? 'partial' : 'no_match') : 'ready';
  const kit = {
    status,
    workflows: unique(selected.map(({ match }) => match.candidate.workflow).filter(Boolean)),
    constraints: contract.constraints,
    stages: allStages.map(({ id, when, check, skillRefs, resourceRefs }) =>
      ({ id, skills: skillRefs.map((item) => item.id), resources: resourceRefs.map((item) => item.id), check, when })),
    skills: pickedSkills,
    resources: pickedResources,
    ...(contract.clarification ? { question: contract.clarification.question, choices } : {}),
    ...(gaps.length ? { gaps: unique(gaps) } : {}),
    next: status === 'ready' ? 'Load only the references for the applicable stage.' :
      contract.clarification ? 'Reuse the brief with a listed workflow or clarify the deliverable.' :
        'Use verified stages where applicable and find a licensed specialist for the listed gaps.',
  };
  return { kit, contract, selected, exclusions, covers };
}

function findKit(input, options) {
  return assemble(input, options).kit;
}

const score = (value) => Number(value.toFixed(3));
function explainKit(input, options) {
  const { kit, contract, selected, exclusions, covers } = assemble(input, options);
  return {
    kit, contract,
    retrieval: 'Weighted lexical terms and deterministic feature-hashed concept, word and character vectors.',
    selected: selected.map(({ match, gaps }) => ({
      id: match.candidate.id, matchedTerms: match.terms, lexicalScore: score(match.lexical),
      vectorSimilarity: score(match.similarity), trust: match.candidate.federated ? 'federated' : 'curated',
      ...(match.candidate.federated ? { trustScore: match.candidate.trustScore, qualityScore: match.candidate.qualityScore } : {}), gaps,
    })),
    excluded: [...new Map(exclusions.map((entry) => [entry.id + entry.reason, entry])).values()],
    coverage: covers,
    packs: [...new Set(contract.deliverables.map(({ kind }) => personas.get(kind)).filter(Boolean))],
    ...(kit.gaps?.length ? { gapBrief: 'A specialist skill should document the missing deliverable, exact tools and formats, stage entry, prerequisites, and a reproducible acceptance check: ' + kit.gaps.join(' ') } : {}),
  };
}

const githubRoot = 'https://github.com/abrar225/SkillKit/blob/main/';
function formatKit(kit, skillUrl = (id) => githubRoot + 'skills/' + id + '/SKILL.md') {
  const heading = (kit.workflows || []).map((id) => titles.get(id)).filter(Boolean).join(' → ') || 'Task kit';
  const lines = ['# ' + heading, '', 'Status ' + kit.status.toUpperCase()];
  if (kit.question) lines.push('', kit.question, ...(kit.choices || []).map(({ title, id }) => '- ' + title + ' (' + id + ')'));
  if (kit.constraints?.length) lines.push('', 'Constraints ' + kit.constraints.join(', '));
  for (const skill of kit.skills || []) lines.push('- [' + skill.id + '](' + skillUrl(skill.id) + ') · ' + skill.license + '. ' + skill.reason);
  for (const resource of kit.resources || []) lines.push('- [' + resource.name + '](' + resource.url + ') · ' + resource.pricing + '. ' + resource.why);
  for (const stage of kit.stages || []) {
    lines.push('', '**' + stage.id + '** (' + [...stage.skills, ...stage.resources].join(', ') + ')', stage.when, stage.check);
  }
  if (kit.gaps?.length) lines.push('', 'Gaps', ...kit.gaps.map((gap) => '- ' + gap));
  return [...lines, '', kit.next].join('\n');
}

module.exports = { findKit, explainKit, formatKit, inputSchema };
