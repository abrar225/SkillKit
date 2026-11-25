'use strict';

// Each row records a capability evidenced by the selected catalog sources.
// The pattern identifies the requested outcome. It does not authorize work.
const prose = ['markdown', 'plain-text'];
const entries = [
  {
    kind: 'accessibility-review',
    match: /\b(?:audit|review|check|test|verify)\b.{0,80}\b(?:accessibility|a11y|wcag|screen readers?|keyboard navigation|focus order)\b/i,
    tools: ['html', 'css', 'chrome', 'devtools'], formats: prose, role: 'review',
    skills: ['automations/a11y-debugging', 'ui-ux/fixing-accessibility'], resources: ['mdn'],
    when: 'When a representative page or interface is available.',
    check: 'Check keyboard-only navigation, visible focus, accessible names, contrast, and representative screen-reader paths.',
  },
  {
    kind: 'performance-web',
    match: /\b(?:largest contentful paint|lcp|core web vitals|page speed)\b/i,
    tools: ['react', 'nextjs', 'html', 'css', 'chrome', 'devtools'], formats: prose, role: 'review',
    skills: ['frontend/debug-optimize-lcp'], resources: ['web-dev'],
    when: 'When the affected page and a representative device profile are available.',
    check: 'Compare the LCP element, timing breakdown, and repeat measurements before and after changes.',
  },
  {
    kind: 'web-metadata',
    match: /\b(?:open graph|social (?:card|share preview)|canonical (?:url|tag)|robots (?:meta|directive)|seo metadata|meta tags?)\b/i,
    tools: ['html', 'nextjs', 'react'], formats: ['html', ...prose], role: 'build',
    skills: ['frontend/fixing-metadata'], resources: ['mdn'],
    when: 'When the page sources and canonical site URL are known.',
    check: 'Inspect the rendered head for unique tags, reachable canonical URLs, and resolved social card images.',
  },
  {
    kind: 'react-transition',
    match: /\b(?:view transitions?|shared[- ]element animations?|animated route transitions?)\b/i,
    tools: ['react', 'nextjs', 'css', 'javascript', 'typescript'], formats: ['html', 'css', 'tsx', 'jsx'], role: 'build',
    skills: ['frontend/react-view-transitions'], resources: ['react'],
    when: 'When the React version and navigation paths are known.',
    check: 'Verify forward and back paths and inspect behavior with reduced motion and an unsupported browser.',
  },
  {
    kind: 'data-visualization',
    match: /\b(?:visuali[sz](?:e|ation)|plot|chart|graph|scatterplot|heatmap|sparkline)\b.{0,70}\b(?:data|dataset|sales|revenue|csv|parquet)\b|\b(?:create|make|build|design|draw|render)\b.{0,55}\b(?:chart|scatterplot|heatmap|sparkline|data visualization|bar graph|line graph)\b/i,
    tools: ['html', 'css', 'react', 'javascript', 'typescript'], formats: ['html', 'svg', 'png'], role: 'design',
    skills: ['frontend/dataviz'], resources: [],
    when: 'When the real input data, intended comparison, and medium are known.',
    check: 'Check marks against source values, meaningful axes and labels, color contrast, and a representative narrow layout.',
  },
  {
    kind: 'architecture-diagram',
    match: /\b(?:mermaid|c4 model|sequence diagram|er diagram|entity relationship diagram|component diagram|system context diagram|architecture diagram)\b/i,
    tools: ['mermaid'], formats: ['mermaid', 'svg', 'png', ...prose], role: 'design',
    skills: ['architecture/codebase-design'], resources: ['mermaid'],
    when: 'When system boundaries and participant names are known.',
    check: 'Render the diagram, walk one complete scenario, and verify that edges match actual dependencies or interactions.',
  },
  {
    kind: 'domain-model',
    match: /\b(?:domain model|ubiquitous language|glossary\.md|domain glossary|bounded contexts?)\b/i,
    formats: prose, role: 'design', skills: ['architecture/domain-modeling'], resources: [],
    when: 'When current terminology and a concrete scenario are available.',
    check: 'Trace an example through the model and verify each glossary term and boundary against the code or domain evidence.',
  },
  {
    kind: 'architecture-decision',
    match: /\b(?:architecture decision records?|architectural decision records?|draft (?:an? )?adr|write (?:an? )?adr)\b/i,
    formats: prose, role: 'plan', skills: ['architecture/documentation-and-adrs'], resources: ['adr'],
    when: 'When the decision, alternatives, and constraints are known.',
    check: 'Verify that context, decision, rejected alternatives, and consequences are explicit and tied to evidence.',
  },
  {
    kind: 'project-tickets',
    match: /\b(?:split|convert|break down|turn|write|create|draft)\b.{0,65}\b(?:tickets?|vertical slices|tracer bullets?)\b/i,
    tools: ['linear', 'jira'], formats: prose, role: 'plan', skills: ['planning/to-tickets'], resources: [],
    when: 'When the plan or spec and the destination tracker are known.',
    check: 'Check that every ticket delivers a testable slice and names its actual dependencies.',
  },
  {
    kind: 'observability',
    match: /\b(?:instrument(?:ation)?|observability|distributed trac(?:e|es|ing)|structured logging|telemetry)\b/i,
    formats: prose, role: 'build', skills: ['engineering-ops/observability-and-instrumentation'], resources: [],
    when: 'When the workload and failure or latency signals are known.',
    check: 'Send a representative request and confirm the emitted events correlate without sensitive fields or high-cardinality labels.',
  },
  {
    kind: 'safe-migration',
    match: /\b(?:expand[ -](?:and[ -])?contract|zero[- ]downtime migration|backward[s]?[- ]compatible migration|deprecat(?:e|ion|ing)|sunset (?:the )?(?:api|endpoint))\b/i,
    tools: ['postgresql'], formats: ['sql', ...prose], role: 'plan',
    skills: ['engineering-ops/deprecation-and-migration'], resources: ['postgresql'],
    when: 'When dependent versions, consumers, and affected data are known.',
    check: 'Verify old and new clients during rollout, validate the backfill, and identify the rollback point before destructive cleanup.',
  },
  {
    kind: 'memory-diagnostics',
    match: /\b(?:heap snapshots?|memory leaks?|heap retainers?|out[- ]of[- ]memory|oom errors?)\b/i,
    tools: ['javascript', 'nodejs', 'chrome', 'devtools'], formats: prose, role: 'review',
    skills: ['engineering-ops/memory-leak-debugging'], resources: [],
    when: 'When the target runtime and a repeatable workload are available.',
    check: 'Compare snapshots after repeated workloads and inspect retaining paths and retained size after collection.',
  },
  {
    kind: 'defensive-audit',
    match: /\b(?:security (?:audit|review|hardening)|dependency audit|supply.chain risk|owasp (?:top ten|top 10|asvs)|threat model(?:ing)?|hardcoded secrets?)\b/i,
    tools: ['semgrep', 'gitleaks'], formats: prose, role: 'review',
    skills: ['security-bug-bounty/security-and-hardening'], resources: ['owasp-asvs', 'semgrep', 'gitleaks'],
    when: 'When the reviewed code and authorized boundaries are known.',
    check: 'Trace input and authorization checks to the relevant files, record mitigations, and flag blocked or unverified checks.',
  },
  {
    kind: 'git-hooks',
    match: /\b(?:husky|lint-staged|pre[- ]commit hooks?)\b/i,
    tools: ['husky', 'lint-staged', 'nodejs', 'javascript', 'typescript'], formats: ['json', ...prose], role: 'build',
    skills: ['engineering-ops/setup-pre-commit'], resources: [],
    when: 'When the repository package manager and existing checks are known.',
    check: 'Exercise a commit with clean staged files and one that should be rejected without changing unstaged files.',
  },
  {
    kind: 'git-worktree',
    match: /\b(?:git worktrees?|isolated worktree)\b/i,
    tools: ['git'], formats: prose, role: 'plan', skills: ['engineering-ops/using-git-worktrees'], resources: [],
    when: 'When the source branch, target branch, and working directory are known.',
    check: 'Check the registered worktree, branch and baseline status before using the isolated checkout.',
  },
  {
    kind: 'prisma-setup',
    match: /\bprisma\b.{0,60}\b(?:setup|configure|configuration|initialize|connect|connection|provider)\b|\b(?:set up|configure|initialize|connect|install)\b.{0,60}\bprisma\b/i,
    tools: ['prisma', 'postgresql', 'nodejs', 'typescript', 'javascript'], formats: ['prisma', 'typescript', ...prose], role: 'build',
    skills: ['backend-api/prisma-orm-setup'], resources: ['prisma', 'postgresql'],
    when: 'When the installed Prisma version and database provider are known.',
    check: 'Validate the schema, generate the client, and run a minimal query against the intended nonproduction database.',
  },
  {
    kind: 'neon-auth',
    match: /\b(?:neon auth|managed better auth|@neon\/auth)\b/i,
    tools: ['neon', 'typescript', 'javascript', 'react', 'nextjs'], formats: ['typescript', 'tsx', ...prose], role: 'build',
    skills: ['backend-api/neon-auth'], resources: ['neon'],
    when: 'When the Neon project and authentication requirements are known.',
    check: 'Test successful sign-up and sign-in, expired sessions, and denied access to a protected route.',
  },
  {
    kind: 'dbt-cloud-debug',
    match: /\bdbt (?:cloud|platform)\b.{0,75}\b(?:error|fail(?:ed|ing|ure)?|job|run logs?)\b/i,
    tools: ['dbt', 'dbt-cloud'], formats: prose, role: 'review',
    skills: ['backend-api/dbt-job-troubleshooting'], resources: ['dbt'],
    when: 'When the failed platform run and applicable logs are available.',
    check: 'Tie the suspected cause to the earliest failing step and verify it against a successful or reproducible run.',
  },
  {
    kind: 'internal-communications',
    match: /\b(?:internal comm(?:s|unications?)|leadership update|stakeholder update|incident report|team status (?:update|report)|company newsletter)\b/i,
    formats: prose, role: 'build', skills: ['social-media/internal-comms'], resources: [],
    when: 'When the audience, source facts, and intended distribution are known.',
    check: 'Verify dates, owners, and claims against source notes, and make any decision or action clear to the audience.',
  },
  {
    kind: 'swift-development',
    match: /\b(?:swift(?:ui)?|swift 6)\b.{0,65}\b(?:actor|concurren|model|protocol|view|navigation|async|task group|sendable|data race|test)/i,
    tools: ['swift', 'swiftui'], formats: ['swift', ...prose], role: 'build',
    skills: ['mobile/write-swift'], resources: ['swiftui'],
    when: 'When Swift version, deployment target, and execution context are known.',
    check: 'Build with complete concurrency checking and exercise the affected success and failure paths.',
  },
  {
    kind: 'component-canvas',
    match: /\b(?:component canvas|interactive (?:component|variant) catalog|visual (?:component|variant) explorer)\b/i,
    tools: ['react', 'nextjs', 'html', 'css', 'typescript'], formats: ['html', 'tsx'], role: 'build',
    skills: ['ui-ux/component-canvas'], resources: [],
    when: 'When safe representative previews and their variants can be identified in the project.',
    check: 'Mount each preview independently and verify copy, zoom, and navigation without invoking live data actions.',
  },
  {
    kind: 'skill-authoring',
    match: /\b(?:skill\.md|agent skill|codex skill|claude skill)\b.{0,55}\b(?:author|draft|creat|writ|design|updat|test|validat)|\b(?:author|draft|creat\w*|writ\w*|design|updat\w*|test|validat\w*)\b.{0,65}\b(?:skill\.md|agent skills?|codex skills?|claude skills?)\b/i,
    tools: ['codex', 'claude'], formats: ['yaml', ...prose], role: 'build',
    skills: ['agent-tooling/writing-skills', 'agent-tooling/skill-creator'], resources: [],
    when: 'When intended triggers, scope, compatible agent, and supporting material are known.',
    check: 'Verify frontmatter and supporting links, then exercise an intended trigger and a nearby task that should not trigger.',
  },
  {
    kind: 'media-transcription',
    match: /\b(?:transcrib\w*|speech[- ]to[- ]text|auto[- ]?captions?)\b/i,
    tools: [], formats: [], role: 'build', skills: [], resources: [],
    when: '', check: '',
  },
  {
    kind: 'presentation',
    match: /\b(?:slide deck|presentation slides?|powerpoint|\.pptx|pitch deck)\b/i,
    tools: [], formats: [], role: 'build', skills: [], resources: [],
    when: '', check: '',
  },
  {
    kind: 'spreadsheet',
    match: /\b(?:workbook|spreadsheet|\.xlsx)\b/i,
    tools: [], formats: [], role: 'build', skills: [], resources: [],
    when: '', check: '',
  },
];

// Native references cover the specific operation; interchange formats require separate evidence.
const nativeReferences = [
  ['resolve-edit', /(?:interview|footage|edit|timeline).{0,90}(?:DaVinci|Resolve)|(?:DaVinci|Resolve).{0,90}(?:interview|rough cut|timeline)/i, 'davinci-resolve', 'resolve-editor-training', [], 'Reopen the editable timeline, scrub the dialogue edits and check source clip links in Resolve.'],
  ['resolve-grade', /(?:grade|color|colour|skin tones).{0,80}(?:DaVinci|Resolve)|(?:DaVinci|Resolve).{0,80}(?:grade|color|colour)/i, 'davinci-resolve', 'resolve-editor-training', [], 'Compare representative shots with scopes and check skin tones after the grade.'],
  ['ae-expression', /after effects.{0,80}expressions?|expressions?.{0,80}after effects/i, 'after-effects', 'after-effects-expressions', [], 'Scrub the linked properties and check the expression for evaluation errors.'],
  ['premiere-transcript', /premiere.{0,65}(?:transcript|rough cut|interview)|(?:transcript|rough cut|interview).{0,65}premiere/i, 'premiere-pro', 'premiere-text-editing', [], 'Review the edited sequence against its transcript and reopen the project.'],
  ['remotion-subtitles', /remotion.{0,65}(?:caption|subtitle)|(?:caption|subtitle).{0,65}remotion/i, 'remotion', 'remotion-captions', [], 'Preview caption boundaries at their first and last displayed frames in Remotion.'],
  ['inkscape-print', /inkscape.{0,80}pdf|pdf.{0,80}inkscape/i, 'inkscape', 'inkscape-pdf', ['pdf'], 'Inspect PDF page size and fonts and retain the editable SVG master.'],
  ['figma-names', /(?:organize|name|naming).{0,80}figma.{0,70}components?|figma.{0,80}component naming/i, 'figma', 'figma-component-naming', [], 'Locate the component by its group and name in the Figma Assets panel.'],
  ['docker-build', /(?:review|harden|improve|reduce|optimize).{0,60}dockerfile|dockerfile.{0,60}(?:hardening|multi-stage)/i, 'docker', 'docker-build-practices', [], 'Build the Dockerfile and check the contents and execution user of the final image.'],
];
for (const [kind, match, tool, resource, formats, check] of nativeReferences) {
  entries.push({kind, match, tools:[tool], formats, role:'build', skills:[], resources:[resource],
    when:'When the source project is available in the requested tool.', check});
}

const specialistForms = entries.map(({ kind, match }) => [kind, match]);
const specialistRoutes = entries.filter(({ skills, resources }) => skills.length || resources.length)
  .map(({ kind, tools = [], formats, role, skills, resources, when, check }) => ({
    id: kind, kind, tools, formats,
    ...(role === 'build' && !['internal-communications'].includes(kind) ? { effect: 'implementation' } : {}),
    stages: [{ id: role, role, check, when, skillIds: skills, resourceIds: resources }],
  }));

module.exports = { specialistForms, specialistRoutes };
