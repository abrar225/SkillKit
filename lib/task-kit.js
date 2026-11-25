'use strict';

const { createRouter } = require('./task-router');
const { parseIntent, inputSchema, canonicalTool, canonicalFormat } = require('./intent-contract');
const { indexCandidates } = require('./task-retrieval');
const { local, openResources, toolResources, roleByStage, whenByRole } = require('./task-capabilities');
const { mayDeliver, isPermissive } = require('./catalog-policy');
const { personaPacks } = require('./persona-packs');
const { getFederatedSkill, listFederated } = require('./federation');
const { curatedIdDeliverables, deliverableEquivalence, extractDeliverables, canonicalTool: taxonomyTool } = require('./atlas-taxonomy');
const { skills } = require('../registry/skills.json');
const { resources } = require('../registry/resources.json');
const { workflows } = require('../workflows/routes.json');

const recommend = createRouter(skills, resources);
const workflowById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
const skillById = new Map(skills.map((item) => [item.id, item]));
const resourceById = new Map(resources.map((item) => [item.id, item]));
const unique = (values) => [...new Set(values)];
const terse = (value, limit = 95) => value.length <= limit ? value : value.slice(0, limit - 1).replace(/\s+\S*$/, '') + '…';

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
const freeTools = new Set([...genericStacks, 'davinci-resolve', 'figma', 'chrome', 'devtools', 'husky', 'lint-staged', 'git',
  'swiftui', 'linear', 'jira', 'linkedin', 'instagram', 'x', 'remotion', 'svelte', 'dbt', 'dbt-core', 'dbt-cloud',
  'docker', 'playwright', 'expo', 'prettier', 'eslint']);
const openTools = new Set([...genericStacks].filter((tool) => tool !== 'swift').concat(
  ['swift', 'git', 'husky', 'lint-staged', 'dbt', 'dbt-core', 'playwright', 'expo', 'prettier', 'eslint']));
const skillTools = new Map([
  ['ui-ux/framer-motion-animator', ['react', 'nextjs']],
  ['frontend/vercel-react-best-practices', ['react', 'nextjs']],
  ['mobile/flutter-architecture', ['flutter']], ['mobile/react-native-skills', ['react-native']],
  ['backend-api/supabase-postgres-best-practices', ['postgresql', 'supabase']],
  ['backend-api/prisma-client-api', ['prisma']], ['backend-api/dbt-analytics-engineering', ['dbt', 'dbt-core']],
  ['media/hyperframes', ['hyperframes']], ['media/algorithmic-art', ['p5js']],
  ['backend-api/dbt-job-troubleshooting', ['dbt', 'dbt-cloud']],
  ['backend-api/prisma-orm-setup', ['prisma', 'postgresql']],
  ['backend-api/neon-auth', ['neon']], ['mobile/write-swift', ['swiftui', 'swift']],
  ['frontend/react-view-transitions', ['react', 'nextjs']],
  ['frontend/fixing-metadata', ['react', 'nextjs']],
  ['frontend/debug-optimize-lcp', ['react', 'nextjs', 'chrome', 'devtools']],
  ['frontend/dataviz', ['react', 'd3', 'html', 'css', 'javascript', 'typescript']],
  ['frontend/web-artifacts-builder', ['react', 'nextjs', 'tailwindcss', 'shadcn', 'html', 'css']],
  ['frontend/frontend-ui-engineering', ['html', 'css', 'react', 'nextjs', 'tailwindcss']],
  ['ui-ux/animate', ['react', 'nextjs', 'motion']],
  ['ui-ux/gestures', ['react', 'motion']],
  ['ui-ux/ui-ux-pro-max', ['gsap', 'html', 'css', 'react']],
  ['automations/chrome-devtools', ['chrome', 'devtools']],
  ['automations/webapp-testing', ['playwright']],
  ['automations/browser-testing-with-devtools', ['chrome', 'devtools']],
  ['engineering-ops/using-git-worktrees', ['git']],
  ['engineering-ops/git-workflow-and-versioning', ['git']],
  ['engineering-ops/finishing-a-development-branch', ['git']],
  ['engineering-ops/setup-pre-commit', ['husky', 'lint-staged', 'git']],
  ['engineering-ops/code-review', ['typescript', 'javascript']],
  ['engineering-ops/code-review-and-quality', ['typescript', 'javascript']],
  ['ui-ux/fixing-motion-performance', ['css', 'html', 'react', 'motion']],
  ['mobile/animate-expo', ['react-native', 'expo', 'reanimated']],
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
const lockToolEvidence = (tool) => !['html', 'css', 'python', 'typescript', 'javascript', 'nodejs', 'dbt', 'dbt-core', 'vitest', 'jest', 'pytest'].includes(tool);
const runtimeStacks = new Set(['html', 'css', 'javascript', 'typescript', 'python', 'nodejs']);
const autoAttachTools = new Set(['tailwindcss', 'typescript', 'shadcn', 'drizzle',
  'postgresql', 'supabase', 'prisma', 'openapi', 'dbt', 'dbt-core', 'docker', 'playwright',
  'gsap', 'chrome', 'devtools', 'astro', 'svelte', 'vue', 'kotlin', 'swift',
  'react-three-fiber', 'drei', 'lenis', 'roughjs', 'zod', 'redis', 'biome', 'eslint', 'prettier', 'vite',
  'lucide', 'phosphor-icons', 'heroicons', 'google-fonts', 'fontshare', 'coolors', 'realtime-colors',
  'radix-ui', 'excalidraw', 'trufflehog', 'snyk', 'osv-scanner', 'dependabot', 'codeql', 'owasp-top-10',
  'temporal', 'inngest', 'trigger-dev', 'n8n', 'puppeteer', 'firecrawl', 'crawl4ai', 'vulture', 'deptry', 'ts-prune']);
const genericFormats = new Set(['plain-text', 'markdown', 'html', 'css', 'tsx', 'jsx', 'typescript', 'javascript', 'json', 'yaml', 'sql']);
const disabled = (item, contract) => (contract.constraints.includes('no-deployment') && item.kind === 'deploy') ||
  (contract.constraints.includes('no-implementation') && (excludedByDesign.has(item.kind) || item.effect === 'implementation'));

function toolAllowedByBudget(tool, contract) {
  const { budget, constraints } = contract;
  if (budget === 'any') return true;
  if (toolsExcludedByBudget[budget].has(tool)) return false;
  if (budget === 'open-source' && !openTools.has(tool) &&
    !(toolResources[tool] || []).some((id) => openResources.has(id))) return false;
  if (budget === 'free' || constraints.includes('free-resources-only')) {
    if (toolsExcludedByBudget.free.has(tool)) return false;
    return freeTools.has(tool) || openTools.has(tool) ||
      (toolResources[tool] || []).some((id) => resourceById.get(id)?.pricing === 'free');
  }
  return true;
}

const routerToAtlas = {
  'web-site': ['web-design', 'web-site'],
  'web-redesign': ['web-redesign', 'web-design'],
  'ui-design': ['ui-design', 'component-design', 'web-design', 'visual-mockup'],
  'ui-review': ['accessibility-audit', 'web-design'],
  'accessibility-review': ['accessibility-audit'],
  'performance-web': ['performance-optimization'],
  performance: ['performance-optimization'],
  feature: ['feature', 'component-design', 'api-integration'],
  api: ['database-schema', 'openapi-spec', 'api', 'api-integration'],
  debug: ['debugging', 'memory-leak-debugging'],
  'code-review': ['code-review', 'security-audit'],
  documentation: ['documentation', 'openapi-spec'],
  tests: ['tdd', 'testing'],
  'browser-tests': ['browser-testing'],
  'release-plan': ['release-plan', 'rollback-runbook', 'release-review'],
  'ci-cd': ['ci-cd'],
  'sql-optimization': ['database-schema', 'data-analysis', 'performance-optimization'],
  'data-analysis': ['data-analysis', 'research-synthesis'],
  'research-synthesis': ['research-synthesis'],
  'web-metadata': ['web-metadata', 'seo-optimization'],
  'seo-optimization': ['seo-optimization', 'web-metadata'],
  'email-marketing': ['email-marketing', 'newsletter'],
  'motion-performance': ['ui-animation', 'performance-optimization'],
  'motion-gestures': ['ui-animation'],
  'static-graphic': ['poster-design', 'print-design', 'static-graphic', 'visual-mockup', 'ad-creative'],
  'brand-guide': ['brand-identity', 'brand-guide'],
  'design-system-doc': ['design-system', 'design-system-doc'],
  'video-export': ['video-edit', 'video-transcode', 'video-export'],
  captions: ['video-captions', 'captions'],
  'dbt-tests': ['dbt-testing', 'dbt-tests'],
  'dbt-model': ['dbt-modeling', 'dbt-model', 'data-engineering'],
  'dbt-cloud-debug': ['dbt-troubleshooting'],
  'memory-diagnostics': ['memory-leak-debugging'],
  'git-hooks': ['pre-commit', 'git-hooks'],
  'git-worktree': ['git-worktree'],
  'defensive-audit': ['security-audit'],
  architecture: ['architecture-design', 'architecture'],
  'domain-model': ['domain-modeling'],
  'architecture-decision': ['adr'],
  article: ['editorial-writing', 'article'],
  newsletter: ['newsletter', 'email-marketing'],
  'internal-communications': ['internal-comms', 'internal-communications'],
  'dead-code': ['dead-code'],
  'motion-video': ['motion-video', '3d-scene'],
  'ui-animation': ['ui-animation'],
  plan: ['planning', 'plan'],
  'social-copy': ['social-copy', 'linkedin-post', 'instagram-copy', 'x-thread'],
  'cold-email': ['cold-email'],
  'linkedin-profile': ['linkedin-profile'],
  'resolve-edit': ['video-edit'],
  'resolve-grade': ['color-grade'],
  'ae-expression': ['motion-video'],
  'docker-build': ['container-build'],
  'data-visualization': ['data-visualization'],
  'mobile-app': ['mobile-app'],
  deploy: ['deploy', 'infrastructure-ops'],
  'infrastructure-ops': ['infrastructure-ops', 'deploy'],
  observability: ['observability', 'infrastructure-ops'],
};

const atlasToRouter = new Map();
for (const [routerKind, atlasDelivs] of Object.entries(routerToAtlas)) {
  for (const d of atlasDelivs) {
    if (!atlasToRouter.has(d)) atlasToRouter.set(d, new Set());
    atlasToRouter.get(d).add(routerKind);
  }
}

function expandCandidateDeliverables(delivs = []) {
  const expanded = new Set();
  for (const d of delivs) {
    if (!d) continue;
    expanded.add(d);
    for (const eq of deliverableEquivalence[d] || []) expanded.add(eq);
    for (const rk of atlasToRouter.get(d) || []) expanded.add(rk);
  }
  return [...expanded];
}

const curatedSkillExtras = {
  'ui-ux/brand-guidelines': { tools: ['css', 'html'], formats: ['markdown', 'plain-text'], stage: 'design' },
  'ui-ux/anthropic-design': { tools: ['css', 'html'], formats: ['markdown', 'plain-text'], stage: 'design' },
  'ui-ux/impeccable': { tools: ['html', 'css', 'react', 'nextjs'], formats: ['html'], stackCompatible: true, stage: 'design' },
  'ui-ux/improve-ui': { tools: ['html', 'css', 'react', 'nextjs'], formats: ['html'], stackCompatible: true, stage: 'design' },
  'ui-ux/hi-fi-design': { tools: ['html', 'css', 'react', 'nextjs'], formats: ['html'], stackCompatible: true, stage: 'design' },
  'ui-ux/baseline-ui': { tools: ['html', 'css', 'react', 'nextjs'], formats: ['html'], stackCompatible: true, stage: 'design' },
  'ui-ux/animate': { tools: ['motion', 'react', 'nextjs', 'css', 'html'], formats: ['tsx', 'jsx', 'html', 'css'], stackCompatible: true, stage: 'design' },
  'ui-ux/improve-animations': { tools: ['motion', 'react', 'nextjs', 'css', 'html'], formats: ['tsx', 'jsx', 'html', 'css'], stackCompatible: true, stage: 'design' },
  'frontend/composition-patterns': { tools: ['react', 'nextjs'], formats: ['tsx', 'jsx'], stackCompatible: true, stage: 'design' },
  'planning/writing-plans': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'plan' },
  'engineering-ops/git-workflow-and-versioning': { tools: ['git'], formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'release' },
  'engineering-ops/finishing-a-development-branch': { tools: ['git'], formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'release' },
  'backend-api/neon': { tools: ['neon', 'postgresql'], formats: ['sql', 'typescript'], stackCompatible: true, stage: 'build' },
  'backend-api/neon-postgres': { tools: ['neon', 'postgresql'], formats: ['sql'], stackCompatible: true, stage: 'build' },
  'engineering-ops/tdd': { tools: ['vitest', 'jest', 'pytest'], stackCompatible: true, stage: 'test' },
  'architecture/api-and-interface-design': { tools: ['openapi', 'postgresql'], formats: ['yaml', 'json', 'sql', 'markdown'], stackCompatible: true, stage: 'design' },
  'social-media/anthropic-docs': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'build' },
  'frontend/web-artifacts-builder': { tools: ['react', 'nextjs', 'tailwindcss', 'shadcn', 'html', 'css'], formats: ['html', 'tsx', 'jsx'], stackCompatible: true, stage: 'build' },
  'frontend/frontend-ui-engineering': { tools: ['html', 'css', 'react', 'nextjs', 'tailwindcss'], formats: ['html', 'tsx', 'jsx'], stackCompatible: true, stage: 'build' },
  'frontend/dataviz': { tools: ['react', 'd3', 'html', 'css', 'javascript', 'typescript'], formats: ['html', 'svg', 'png'], stackCompatible: true, stage: 'design' },
  'ui-ux/gestures': { tools: ['react', 'motion'], formats: ['tsx', 'jsx', 'typescript'], stackCompatible: true, stage: 'build' },
  'automations/chrome-devtools': { tools: ['chrome', 'devtools'], formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'test' },
  'ui-ux/ui-ux-pro-max': { tools: ['gsap', 'html', 'css', 'react', 'tailwindcss'], formats: ['html', 'tsx', 'jsx'], stackCompatible: true, stage: 'design' },
  'ui-ux/theme-factory': { tools: ['html', 'css'], formats: ['html', 'pptx', 'pdf', 'markdown'], stackCompatible: true, stage: 'design' },
  'engineering-ops/code-review-and-quality': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'review' },
  'planning/brainstorming': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'plan' },
  'planning/research': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'plan' },
  'mobile/react-native-skills': { tools: ['react-native', 'expo'], formats: ['tsx', 'jsx'], stackCompatible: true, stage: 'build' },
  'mobile/animate-expo': { tools: ['react-native', 'expo', 'reanimated'], formats: ['tsx', 'jsx'], stackCompatible: true, stage: 'build' },
  'engineering-ops/durable-test-collateral': { formats: ['typescript', 'javascript', 'python', 'markdown', 'plain-text'], stackCompatible: true, stage: 'test' },
  'engineering-ops/diagnosing-bugs': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'review' },
  'engineering-ops/debugging-and-error-recovery': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'review' },
  'engineering-ops/deprecation-and-migration': { formats: ['sql', 'typescript', 'markdown', 'plain-text'], stackCompatible: true, stage: 'plan' },
  'architecture/improve-codebase-architecture': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'review' },
  'architecture/domain-modeling': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'design' },
  'planning/to-spec': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'plan' },
  'ui-ux/review-animations': { tools: ['motion', 'react', 'css', 'html'], formats: ['tsx', 'jsx', 'css', 'html', 'markdown'], stackCompatible: true, stage: 'review' },
  'ui-ux/fixing-motion-performance': { tools: ['motion', 'react', 'css', 'html'], formats: ['tsx', 'jsx', 'css', 'html', 'markdown'], stackCompatible: true, stage: 'review' },
  'mobile/mobile-native': { tools: ['html', 'css'], formats: ['html', 'css', 'tsx'], stackCompatible: true, stage: 'build' },
  'security-bug-bounty/anthropic-security-review': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'review' },
  'automations/browser-testing-with-devtools': { tools: ['chrome', 'devtools'], formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'test' },
  'social-media/writing-beats': { formats: ['markdown', 'plain-text'], stackCompatible: true, stage: 'build' },
};

const curatedActionTools = {
  'ui-ux/impeccable': [],
};

function curatedDirectCandidates() {
  const results = [];
  const pushCurated = (id, extra = {}) => {
    const skill = skillById.get(id);
    if (!skill || !mayDeliver(skill)) return;
    const extracted = extractDeliverables([skill.name, skill.description].filter(Boolean).join(' '));
    const rawDeliverables = curatedIdDeliverables[id]?.length ? curatedIdDeliverables[id] : extracted;
    const deliverables = expandCandidateDeliverables(rawDeliverables);
    if (!deliverables.length) return;
    results.push({
      id: 'curated:' + id,
      kind: deliverables[0],
      rawDeliverables,
      deliverables,
      title: skill.name,
      description: skill.description,
      tags: skill.tags || [],
      tools: extra.tools || [],
      formats: extra.formats || ['markdown', 'plain-text'],
      stackCompatible: extra.stackCompatible ?? true,
      curatedSkill: true,
      stages: [{
        id: extra.stage || 'build',
        role: extra.stage || 'build',
        when: whenByRole[extra.stage || 'build'] || whenByRole.build,
        check: 'Verify the requested output and constraints against ' + id + '.',
        skillIds: [id],
        resourceIds: [],
      }],
    });
  };
  for (const [id, extra] of Object.entries(curatedSkillExtras)) pushCurated(id, extra);
  for (const skill of skills) {
    if (!mayDeliver(skill) || Object.hasOwn(curatedSkillExtras, skill.id)) continue;
    pushCurated(skill.id);
  }
  return results;
}

function enrich(candidate) {
  const baseStages = candidate.stages || workflowById.get(candidate.workflow)?.stages.map((stage) => ({
    skillIds: stage.skill ? [stage.skill] : [], resourceIds: stage.resources || [],
  })) || [];
  const entries = baseStages.flatMap(({ skillIds, resourceIds }) => [
    ...skillIds.map((id) => skillById.get(id)), ...resourceIds.map((id) => resourceById.get(id)),
  ]).filter(Boolean);
  return {
    ...candidate,
    deliverables: candidate.deliverables || expandCandidateDeliverables([candidate.kind]),
    title: candidate.title || titles.get(candidate.workflow) || candidate.id,
    description: candidate.description || entries.map((item) => item.description).join(' '),
    tags: candidate.tags || unique(entries.flatMap((item) => item.tags || [])),
  };
}

const retrieveLocal = indexCandidates([...local, ...curatedDirectCandidates()].map(enrich));

function canonicalFederated(entry) {
  if (!entry || !entry.id?.startsWith('federated/') || !isPermissive(entry.license)) return null;
  const rawDeliverables = entry.deliverables || [];
  const tools = (entry.tools || []).map((t) => canonicalTool(taxonomyTool(t)));
  const formats = (entry.formats || []).map(canonicalFormat);
  return {
    ...entry,
    rawDeliverables,
    deliverables: expandCandidateDeliverables(rawDeliverables),
    tools,
    formats,
    federated: true,
  };
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

function deliverableCheck(candidate, request) {
  const d = new Set([request.kind, ...(candidate.rawDeliverables || []), ...(candidate.deliverables || [])]);
  const fmtNote = request.formats.length ? ' Confirm output matches ' + request.formats.join(', ') + ' format.' : '';
  if (d.has('accessibility-audit') || d.has('web-design') || d.has('web-redesign') || d.has('ui-design') || d.has('component-design') || d.has('ui-animation')) {
    return 'Inspect hierarchy, contrast ratios, keyboard navigation, visible focus, reduced motion, and responsive mobile and desktop layouts.' + fmtNote;
  }
  if (d.has('poster-design') || d.has('print-design') || d.has('static-graphic') || d.has('brand-identity')) {
    return 'Check typography, visual hierarchy, color contrast, bleed/margins, and print or delivery dimensions.' + fmtNote;
  }
  if (d.has('video-edit') || d.has('video-transcode') || d.has('video-captions') || d.has('audio-cleanup') || d.has('color-grade')) {
    return 'Play the export and check exact length, cut points, frame sync, timestamps, dimensions, and loudness or peak levels.' + fmtNote;
  }
  if (d.has('motion-video') || d.has('3d-scene') || d.has('generative-art')) {
    return 'Render the first, middle, and last frames; confirm FPS, frame count, timing sync, camera framing, and export playback.' + fmtNote;
  }
  if (d.has('social-copy') || d.has('linkedin-post') || d.has('instagram-copy') || d.has('x-thread') || d.has('newsletter') || d.has('editorial-writing') || d.has('cold-email') || d.has('linkedin-profile') || d.has('internal-comms') || d.has('documentation')) {
    return 'Check claims against source notes, verify any links and formatting, and read the draft aloud for clarity and tone.' + fmtNote;
  }
  return 'Run tests on normal and error edge cases, verify fixtures, build/lint checks, and rollback or boundary conditions before completion.' + fmtNote;
}

function evaluate(match, request, contract) {
  const { candidate, declared } = match;
  const soft = [];
  const reject = (reason) => ({ match, rejected: reason, gaps: [], stages: [] });
  if (!declared) return reject('Deliverable type is not documented.');
  if (disabled(candidate, contract)) return reject('The requested work conflicts with the project constraints.');
  const textBlob = [candidate.id, candidate.title, candidate.description].filter(Boolean).join(' ');
  if (candidate.federated && !/[^\x00-\x7F]/.test(contract.task) &&
      ((candidate.language && candidate.language !== 'en') || /[\u0400-\u04FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(textBlob))) {
    return reject('Skill instructions are not in English.');
  }
  if ((contract.constraints.includes('no-auto-publishing') || contract.constraints.includes('no-deployment')) &&
      ((candidate.rawDeliverables || []).includes('social-publishing') || /\b(?:autopost\w*|auto[- ]?publish\w*|publora)\b/i.test(textBlob))) {
    return reject('Skill focuses on automated publishing rather than draft copy.');
  }
  if (contract.constraints.includes('no-contact-lookup') &&
      /\b(?:prospecting|send[- ]list|contact lookup|enrich[- ]lead|find[- ]leads)\b/i.test(textBlob)) {
    return reject('Skill covers contact or prospect operations excluded by constraints.');
  }

  const offeredTools = candidate.tools || [];
  const forbidden = offeredTools.filter((tool) => contract.forbiddenTools.includes(tool));
  if (forbidden.length && (candidate.stages || candidate.federated)) return reject('Requires an excluded tool: ' + forbidden.join(', ') + '.');
  if (candidate.federated) {
    for (const fw of ['flutter', 'swiftui', 'expo', 'react-native', 'wordpress', 'shopify']) {
      if (offeredTools.includes(fw) && !request.tools.includes(fw) && !contract.project.stack.includes(fw) &&
          !new RegExp('\\b' + fw.replace('-', '[- ]?') + '\\b', 'i').test(contract.task)) {
        return reject('Skill targets ' + fw + ', which was not requested.');
      }
    }
  }
  if ((candidate.id === 'curated:ui-ux/brand-guidelines' || candidate.id === 'curated:ui-ux/anthropic-design') &&
      request.kind === 'brand-guide' && !/\banthropic\b/i.test(contract.task)) {
    return reject('Skill specifies Anthropic corporate brand colors rather than general brand identity authoring.');
  }
  if (candidate.federated && request.kind === 'social-copy' &&
      !/\b(?:video|reel|shorts?|tiktok|youtube)\b/i.test(request.text) &&
      (offeredTools.includes('ffmpeg') || offeredTools.includes('remotion') || (candidate.rawDeliverables || []).includes('video-edit'))) {
    return reject('Skill targets video/shorts production rather than social copy.');
  }
  if (candidate.requiresTool?.length && !hasIntersection(candidate.requiresTool, [...request.tools, ...contract.project.stack])) {
    return reject('Requires an explicitly selected tool or compatible project stack.');
  }
  if (request.tools.some((tool) => contract.forbiddenTools.includes(tool))) return reject('A required tool is also excluded.');
  const budgetConflict = unique([...request.tools, ...(candidate.requiredTools || [])]).filter((tool) => !toolAllowedByBudget(tool, contract));
  if (budgetConflict.length) return reject('Required tool violates the requested budget: ' + budgetConflict.join(', ') + '.');
  const hasDomainTool = offeredTools.some((t) => request.tools.includes(t) && !runtimeStacks.has(t));
  const unsupportedTools = request.tools.filter((tool) => !offeredTools.includes(tool) &&
    !(candidate.stackCompatible && genericStacks.has(tool)) &&
    !(candidate.federated && hasDomainTool && runtimeStacks.has(tool)));
  if (unsupportedTools.length) {
    return reject('Requires different tooling. Missing: ' + unsupportedTools.join(', ') + '.');
  }
  const candFormats = candidate.formats || [];
  const softFormatEligible = (candidate.federated || candidate.curatedSkill) && candFormats.length === 0;
  const missingFormats = request.formats.filter((item) => !candFormats.includes(item) &&
    !(genericFormats.has(item) && (softFormatEligible || candidate.curatedSkill || (candidate.federated && !candFormats.some((f) => ['svg', 'pdf', 'png', 'mp4'].includes(f))))) &&
    !(item === 'csv' && candidate.federated && (candidate.rawDeliverables || []).includes('data-analysis') && offeredTools.includes('duckdb')));
  if (missingFormats.length) {
    return reject('Missing output format: ' + missingFormats.join(', ') + '.');
  }
  if (candidate.federated && request.tools.includes('lottie') &&
      (candidate.rawDeliverables || []).includes('brand-identity') &&
      !(candidate.formats || []).some((f) => ['lottie-json', 'json'].includes(f)) &&
      !/\b(?:logo|brand)\b/i.test(request.text)) {
    return reject('Brand logo SVG animation does not provide general UI Lottie JSON authoring.');
  }
  const missingFeatures = request.features.filter((item) => !(candidate.features || []).includes(item));
  if (missingFeatures.length) soft.push('Missing support for ' + missingFeatures.join(', ') + '.');
  if (candidate.incomplete) soft.push(candidate.incomplete);

  let stageRefs;
  if (candidate.federated) {
    const fedPaidTool = (candidate.tools || []).some((tool) => toolsExcludedByBudget[contract.budget]?.has(tool));
    if (contract.budget !== 'any' && (candidate.pricing === 'paid' || fedPaidTool || !isPermissive(candidate.license))) {
      return reject('Federated entry does not establish the required tool budget.');
    }
    const fedResources = unique(request.tools.flatMap((tool) => toolResources[tool] || []))
      .filter((id) => resourceAllowed(id, contract));
    stageRefs = [{
      id: candidate.stage || 'build', role: candidate.stage || 'build',
      check: deliverableCheck(candidate, request),
      when: whenByRole[candidate.stage] || whenByRole.build,
      federatedSkills: [{ id: candidate.id, reason: terse(candidate.description), license: candidate.license }],
      resourceIds: fedResources,
    }];
  } else {
    stageRefs = getLocalStages(candidate, contract).map((stageEntry) => candidate.curatedSkill
      ? { ...stageEntry, check: deliverableCheck(candidate, request) }
      : stageEntry);
  }

  const stages = [];
  for (const entry of stageRefs) {
    if (!candidate.federated && contract.stage && entry.role !== contract.stage) continue;
    if (contract.constraints.includes('no-implementation') && entry.capability === 'implementation') continue;
    let skillRefs = entry.federatedSkills || (entry.skillIds || []).filter((id) => skillAllowed(id, contract))
      .map((id) => baseSkill(id, entry.reasons?.[id] && !reasons[stageName(entry.id)] ? entry.reasons[id] : reasons[stageName(entry.id)])).filter(Boolean);
    const resourceRefs = (entry.resourceIds || []).filter((id) => resourceAllowed(id, contract)).map(baseResource).filter(Boolean);
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
  if (!candidate.federated && (request.formats.length || request.tools.length)) {
    const checkBlob = stages.map((s) => s.check).join(' ').toLowerCase();
    const missingFmtText = request.formats.filter((fmt) => !checkBlob.includes(fmt.replace(/-/g, ' ')) && !checkBlob.includes(fmt));
    const missingToolText = request.tools.filter((t) => !checkBlob.includes(t.replace(/-/g, ' ')) && !checkBlob.includes(t));
    const targetStage = stages.at(-1);
    if (missingFmtText.length) {
      targetStage.check = targetStage.check + ' Confirm output meets the requested ' + missingFmtText.join(', ') + ' format.';
    }
    if (missingToolText.length) {
      targetStage.check = targetStage.check + ' Verify ' + missingToolText.join(', ') + ' behavior and constraints.';
    }
  }
  if (!candidate.federated && request.tools.length) {
    const primaryStage = stages.find((s) => ['build', 'design', 'test', 'review'].includes(s.role)) || stages[0];
    const presentRes = new Set(stages.flatMap(({ resourceRefs }) => resourceRefs.map(({ id }) => id)));
    const presentSkills = stages.flatMap(({ skillRefs }) => skillRefs.map(({ id }) => id));
    for (const tool of request.tools) {
      if (!autoAttachTools.has(tool)) continue;
      if (presentSkills.some((id) => (skillTools.get(id) || []).includes(tool))) continue;
      if ((toolResources[tool] || []).some((id) => presentRes.has(id))) continue;
      for (const resId of toolResources[tool] || []) {
        if (!resourceAllowed(resId, contract)) continue;
        const ref = baseResource(resId);
        if (ref) {
          primaryStage.resourceRefs = [...primaryStage.resourceRefs, ref];
          presentRes.add(resId);
          break;
        }
      }
    }
  }
  const stageSkillIds = stages.flatMap(({ skillRefs }) => skillRefs.map(({ id }) => id));
  const stageResourceIds = stages.flatMap(({ resourceRefs }) => resourceRefs.map(({ id }) => id));
  if (candidate.kind === 'mobile-app' && request.tools.includes('flutter') &&
      !stageSkillIds.includes('mobile/flutter-architecture')) {
    soft.push('Flutter documentation is available. Verified Flutter architecture guidance is missing.');
  }
  for (const tool of request.tools) {
    if (candidate.federated || !lockToolEvidence(tool)) continue;
    const hasSkillTool = stageSkillIds.some((id) => (skillTools.get(id) || []).includes(tool));
    const hasResTool = (toolResources[tool] || []).some((id) => stageResourceIds.includes(id));
    if (!hasSkillTool && !hasResTool) {
      return reject('No selected item verifies ' + tool + ' support under the requested constraints.');
    }
  }
  const unsupportedQuality = qualityGaps(contract, request, stages);
  if (unsupportedQuality.length) soft.push('No verification for: ' + unsupportedQuality.join(', ') + '.');
  return { match, stages, gaps: unique(soft) };
}

function scoreOption(option, request) {
  const { candidate, lexical, similarity } = option.match;
  const wantedAtlas = new Set([request.kind, ...(routerToAtlas[request.kind] || [])]);
  const rawMatch = (candidate.rawDeliverables || []).some((d) => wantedAtlas.has(d)) ? 2.5 : 0;
  const exactTools = request.tools.filter((t) => (candidate.tools || []).includes(t)).length * 2.5;
  const toolSpec = request.tools.length && candidate.tools?.length
    ? 2 / (1 + candidate.tools.length)
    : 0;
  const idSlug = String(candidate.id || '').toLowerCase();
  const toolNameHit = request.tools.filter((t) => idSlug.includes(t)).length * 2.0;
  const desc = String(candidate.description || '');
  const isPublishing = (candidate.rawDeliverables || []).includes('social-publishing') ||
    /\/(?:publora|social-media-ops)(?:\/|$)/.test(idSlug) || /\b(?:write and publish|schedule to)\b/i.test(desc);
  const pubPenalty = isPublishing && !/\b(?:publish|schedule|autopost|operations|ops)\b/i.test(request.text) ? -4.5 : 0;
  const indexPenalty = /(?:conventions-index|-index)$/.test(idSlug) ? -2.5 : 0;
  const noisyIdPenalty = /(?:poster|product-launch|devrel-video|dark-psychology)/.test(idSlug) &&
    !request.tools.some((t) => idSlug.includes(t)) && !['static-graphic', 'motion-video', 'video-export'].includes(request.kind) ? -4.5 : 0;
  const copyOpsPenalty = /(?:metrics-benchmarks|-benchmarks|campaign-ops|deliverability|verification|sales-enablement)$/.test(idSlug) &&
    /\b(?:write|draft|copy|email|post|outreach)\b/i.test(request.text) && !/\b(?:metrics|benchmark|deliverability|campaign ops|verification|enablement)\b/i.test(request.text) ? -3.5 : 0;
  const writeBoost = /(?:copywriting|writing-|caption-writer)/.test(idSlug) && /\b(?:write|draft|caption|post|thread)\b/i.test(request.text) ? 2.0 : 0;
  const workflowBoost = candidate.curatedSkill || candidate.federated ? 0 : 2.5;
  const anthropicPenalty = /anthropic-/.test(idSlug) && !/\banthropic\b/i.test(request.text) ? -4.0 : 0;
  const unrequestedToolPenalty = (candidate.tools || []).filter((t) =>
    !request.tools.includes(t) && ['after-effects', 'premiere-pro', 'final-cut-pro', 'davinci-resolve', 'expo', 'react-native', 'capcut'].includes(t)).length * -1.2;
  return lexical + 3 * similarity + rawMatch + exactTools + toolNameHit + toolSpec + workflowBoost + pubPenalty + indexPenalty + noisyIdPenalty + copyOpsPenalty + writeBoost + anthropicPenalty + unrequestedToolPenalty;
}

function rank(options, request) {
  return options.filter((item) => !item.rejected && item.stages.length)
    .sort((a, b) => a.gaps.length - b.gaps.length ||
      Number(Boolean(a.match.candidate.federated)) - Number(Boolean(b.match.candidate.federated)) ||
      Number(Boolean(a.match.candidate.curatedSkill)) - Number(Boolean(b.match.candidate.curatedSkill)) ||
      (request ? scoreOption(b, request) - scoreOption(a, request) :
        (b.match.lexical + 3 * b.match.similarity) - (a.match.lexical + 3 * a.match.similarity)));
}

function findReference(request, contract) {
  if (request.kind !== 'reference') return [];
  if (request.formats.length || request.tools.some((id) =>
    contract.forbiddenTools.includes(id) || !toolAllowedByBudget(id, contract))) return [];
  const terms = request.text.toLowerCase();
  return resources.filter(({ id, name }) => {
    if (request.tools.length) return request.tools.every((tool) => tool === id || resourceTools.get(id)?.includes(tool));
    const word = name.toLowerCase();
    return request.tools.includes(id) || (word.length >= 4 && new RegExp('(?:^|\\W)' + word.replace(/[.*+?^$${}()|[\]\\]/g, '\\$&') + '(?:$|\\W)').test(terms));
  }).filter(({ id }) => resourceAllowed(id, contract)).slice(0, 1).map((resource) => {
    const candidate = { id: resource.id, title: resource.name, kind: request.kind };
    const ref = baseResource(resource.id);
    return {
      match: { candidate, lexical: 1, similarity: 0, declared: true, terms: [resource.name] },
      stages: [{ id: 'reference/read', when: 'When checking the named tool.', check: 'Confirm the example applies to the project version.',
        skillRefs: [], resourceRefs: [ref] }],
      gaps: [],
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

const outOfScopeTopic = /\b(?:trademarks?|patents?|lawsuits?|legal filings?|contracts?|leases?|tax(?:es| returns?)|medical|diagnosis|prescriptions?|medications?|symptoms?|recipes?|cooking|bak(?:e|ing)|flights?|hotels?|itinerary|vacations?|travel plans?|horoscopes?|astrology|mortgages?|real estate|workouts?|exercise routines?|diet plans?|meal plans?|salary negotiation|cover letters?|resumes?|curriculum vitae|job interviews?|weddings?|party planning|gardening|pet care|parenting)\b/i;
const inScopeWorkCue = /\b(?:code|repo|repository|codebase|app|application|api|endpoint|database|sql|postgres\w*|prisma|drizzle|dbt|duckdb|parquet|csv|react|nextjs|next\.js|typescript|javascript|python|swift|flutter|html|css|tailwind\w*|shadcn|ui|ux|interface|layout|typography|hierarchy|contrast|accessibility|a11y|wcag|wireframe|component|design system|poster|flyer|brand|logo|palette|color|fonts?|svg|pdf|png|video|footage|audio|subtitles?|captions?|srt|vtt|ffmpeg|remotion|manim|three\.?js|threejs|framer|gsap|lottie|p5\.?js|animation|motion|docker|kubernetes|terraform|ci\/cd|github actions?|release|rollback|telemetry|observability|playwright|tests?|testing|vitest|jest|pytest|debug|refactor|review|pr|pull request|readme|docs|documentation|changelog|release notes|newsletter|linkedin|instagram|x|twitter|email|article|blog|copy|seo|mcp server|git worktree|pre[- ]commit)\b/i;

function assemble(input, { federatedCandidates = listFederated } = {}) {
  const contract = parseIntent(input);
  const ranked = [];
  const exclusions = [];
  let federatedSearch;
  const getFedSearch = () => {
    if (!federatedSearch) {
      const entries = federatedCandidates(contract).map(canonicalFederated).filter(Boolean);
      federatedSearch = indexCandidates(entries);
    }
    return federatedSearch;
  };
  if (!contract.clarification) {
    for (const request of contract.deliverables) {
      const query = [request.text, ...request.tools, ...request.formats, ...request.features, ...contract.project.stack].join(' ');
      let matches = retrieveLocal(query, request.kind, Infinity).filter(({ declared }) => declared)
        .map((match) => evaluate(match, request, contract));
      matches.push(...findReference(request, contract));
      const localChoice = rank(matches, request)[0];
      const localHasSkill = Boolean(localChoice && localChoice.stages.some((stage) => stage.skillRefs.length));
      if (!localChoice || localChoice.gaps.length || !localHasSkill) {
        const remote = getFedSearch()(query, request.kind, Infinity)
          .filter(({ declared }) => declared).map((match) => evaluate(match, request, contract));
        matches = [...matches, ...remote];
      }
      if (request.kind === 'unknown' && !rank(matches, request).length && !outOfScopeTopic.test(contract.task)) {
        const hasTechCue = request.tools.length > 0 || contract.project.stack.length > 0;
        const minLex = hasTechCue ? 6.2 : 8.5;
        const minSim = hasTechCue ? 0.21 : 0.28;
        const openLocal = retrieveLocal(query, 'unknown', 5)
          .filter((m) => m.lexical >= minLex && m.similarity >= minSim && m.terms.length >= 2)
          .map((m) => evaluate({ ...m, declared: true }, request, contract))
          .filter((opt) => !opt.rejected && opt.gaps.length === 0);
        const openRemote = openLocal.length || !hasTechCue ? [] : getFedSearch()(query, 'unknown', 6)
          .filter((m) => m.lexical >= 8.5 && m.similarity >= 0.25 && m.terms.length >= 2)
          .map((m) => evaluate({ ...m, declared: true }, request, contract))
          .filter((opt) => !opt.rejected && opt.gaps.length === 0);
        matches = [...matches, ...openLocal, ...openRemote];
      }
      const eligible = rank(matches, request);
      const choice = eligible[0];
      if (choice && !choice.match.candidate.federated && !choice.gaps.length &&
          !choice.stages.some((s) => s.skillRefs.length) && request.tools.length &&
          !request.tools.some((t) => ['davinci-resolve', 'premiere-pro', 'after-effects', 'final-cut-pro'].includes(t))) {
        const fedHelper = eligible.find((opt) => opt.match.candidate.federated && !opt.gaps.length &&
          opt.stages.some((s) => s.skillRefs.length) &&
          !/(?:publora|dark-psychology)/.test(opt.match.candidate.id));
        if (fedHelper) {
          choice.stages = [
            { ...choice.stages[0], skillRefs: [...choice.stages[0].skillRefs, ...fedHelper.stages[0].skillRefs] },
            ...choice.stages.slice(1),
          ];
        }
      }
      ranked.push(eligible);
      for (const option of matches) {
        if (choice === option || !option.match.declared) continue;
        exclusions.push({ id: option.match.candidate.id, reason: option.rejected || option.gaps[0] || 'A more specific or higher-trust match was selected.' });
      }
    }
  }
  const selections = ranked.map(([choice]) => choice);
  return { contract, selected: selections.filter(Boolean), ranked, exclusions, ...buildKit(contract, selections) };
}

function buildKit(contract, selections) {
  const choices = contract.clarification?.choices.map((id) => ({ id, title: titles.get(id) }));
  const selected = selections.filter(Boolean);
  const covers = contract.clarification ? [] : contract.deliverables.map((request, index) => {
    const choice = selections[index];
    return { kind: request.kind, ...(choice ? { candidate: choice.match.candidate.id } : {}),
      gaps: choice ? choice.gaps : [describeGap(request, contract)] };
  });
  const gaps = covers.flatMap((entry) => entry.gaps);
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
  return { kit, covers };
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
    packs: personaPacks(contract, kit),
    ...(kit.gaps?.length ? { gapBrief: 'A specialist skill should document the missing deliverable, exact tools and formats, stage entry, prerequisites, and a reproducible acceptance check: ' + kit.gaps.join(' ') } : {}),
  };
}

const githubRoot = 'https://github.com/abrar225/SkillKit/blob/main/';
function defaultSkillUrl(id) {
  return id.startsWith('federated/') ? getFederatedSkill(id)?.upstream.url : githubRoot + 'skills/' + id + '/SKILL.md';
}

function formatKit(kit, skillUrl = defaultSkillUrl) {
  const heading = (kit.workflows || []).map((id) => titles.get(id)).filter(Boolean).join(' → ') || 'Task kit';
  const lines = ['# ' + heading, '', 'Status ' + kit.status.toUpperCase()];
  if (kit.question) lines.push('', kit.question, ...(kit.choices || []).map(({ title, id }) => '- ' + title + ' (' + id + ')'));
  if (kit.constraints?.length) lines.push('', 'Constraints ' + kit.constraints.join(', '));
  for (const skill of kit.skills || []) {
    const href = skillUrl(skill.id);
    lines.push('- ' + (href ? '[' + skill.id + '](' + href + ')' : skill.id) + ' · ' + skill.license + '. ' + skill.reason);
  }
  for (const resource of kit.resources || []) lines.push('- [' + resource.name + '](' + resource.url + ') · ' + resource.pricing + '. ' + resource.why);
  for (const stage of kit.stages || []) {
    lines.push('', '**' + stage.id + '** (' + [...stage.skills, ...stage.resources].join(', ') + ')', stage.when, stage.check);
  }
  if (kit.gaps?.length) lines.push('', 'Gaps', ...kit.gaps.map((gap) => '- ' + gap));
  return [...lines, '', kit.next].join('\n');
}

module.exports = { assemble, buildKit, findKit, explainKit, formatKit, inputSchema };
