'use strict';

const { specialistRoutes } = require('./specialist-capabilities');

// Explicit coverage is kept separate from retrieval signals. A mention in a
// description or a lexical/vector match cannot add a tool or output format.
const motionFormats = ['mp4', 'webm', 'h264', 'mov', 'gif'];
const mediaFormats = ['mp4', 'mov', 'mkv', 'webm', 'h264', 'h265', 'prores', 'aac', 'wav', 'mp3', 'flac', 'm4a', 'ogg', 'opus', 'gif', 'png', 'jpg'];

const route = (kind, workflow, evidence = {}) => ({ id: workflow, kind, workflow, ...evidence });
const direct = (kind, id, evidence) => ({ id, kind, ...evidence });
const stage = (id, role, check, when, skillIds = [], resourceIds = []) => ({ id, role, check, when, skillIds, resourceIds });
const local = [
  ...specialistRoutes,
  route('web-site', 'new-web-project', { formats: ['html', 'css', 'tsx', 'jsx', 'typescript', 'markdown', 'javascript'], tools: ['react', 'nextjs', 'html', 'css', 'playwright', 'lucide'], stackCompatible: true }),
  route('web-redesign', 'web-redesign', { formats: ['html', 'css', 'tsx', 'jsx', 'typescript', 'markdown', 'javascript'], tools: ['react', 'nextjs', 'html', 'css', 'lucide', 'motion'], stackCompatible: true }),
  route('ui-design', 'design', { formats: ['html', 'css', 'tsx', 'jsx', 'typescript', 'markdown', 'javascript'], tools: ['html', 'css', 'lucide', 'motion'], stackCompatible: true }),
  direct('wireframe', 'wireframe-design', {
    workflow: 'design', formats: ['html', 'markdown', 'plain-text'], tools: ['html', 'css'],
    stages: [stage('wireframe', 'design', 'Trace the primary task and compare the layout at mobile and desktop widths.', 'When audience, content, and key states are known.', ['ui-ux/wireframe'])],
  }),
  direct('ui-review', 'ui-review', {
    formats: ['markdown', 'plain-text', 'html'], tools: ['html', 'css'], stackCompatible: true,
    stages: [stage('review', 'review', 'Record failing paths, contrast ratios, and keyboard and focus behavior.', 'When a representative page is available.', ['ui-ux/fixing-accessibility'], ['mdn'])],
  }),
  route('feature', 'feature', { formats: ['html', 'css', 'tsx', 'jsx', 'typescript', 'javascript', 'json', 'markdown'], tools: ['html', 'css', 'react', 'nextjs', 'tailwindcss'], stackCompatible: true }),
  route('plan', 'plan', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('debug', 'debug', { formats: ['markdown', 'plain-text'], tools: ['postgresql', 'supabase', 'prisma', 'chrome', 'devtools'], stackCompatible: true }),
  route('architecture', 'architecture', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('api', 'api-data', { formats: ['json', 'yaml', 'sql', 'markdown', 'plain-text', 'typescript'], tools: ['postgresql', 'supabase', 'prisma', 'drizzle', 'openapi'], stackCompatible: true }),
  route('mobile-app', 'mobile', { tools: ['react-native', 'flutter'], stackCompatible: true }),
  route('code-review', 'review', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('documentation', 'documentation', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('performance', 'performance', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('browser-tests', 'browser-check', { formats: ['typescript', 'javascript', 'markdown', 'plain-text'], tools: ['playwright', 'chrome', 'devtools'], stackCompatible: true }),
  route('release-plan', 'release', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('deploy', 'deploy', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('tests', 'testing', { formats: ['typescript', 'javascript', 'python', 'markdown', 'plain-text'], tools: ['vitest', 'jest', 'pytest'], stackCompatible: true }),
  route('static-graphic', 'graphic-design', { formats: ['png', 'pdf', 'svg', 'jpg', 'webp', 'html'], compatibleTools: ['figma', 'canva', 'inkscape', 'illustrator', 'photoshop', 'indesign', 'affinity-designer'] }),
  route('generative-art', 'generative-art', { formats: ['html', 'javascript'], tools: ['p5js'] }),
  route('article', 'editorial', { formats: ['markdown', 'plain-text'], compatibleTools: ['google-docs', 'wordpress', 'obsidian'] }),
  direct('design-system-doc', 'design-system-doc', {
    formats: ['markdown', 'plain-text'],
    stages: [stage('document', 'build', 'Trace tokens and component examples to actual project inputs.', 'Once representative screens or source files are available.', ['ui-ux/create-design-md'])],
  }),
  direct('brand-guide', 'brand-guide', {
    compatibleTools: ['figma', 'canva', 'inkscape', 'illustrator', 'indesign', 'affinity-designer'],
    formats: ['markdown', 'plain-text', 'pdf', 'html', 'svg'], incomplete: 'No integrated identity kit covers logo, type, color, and usage rules together.',
    stages: [stage('direction', 'design', 'Preview type and palette in a representative application.', 'When audience and brand references are available.', [], ['google-fonts', 'realtime-colors'])],
  }),
  direct('newsletter', 'newsletter', {
    formats: ['markdown', 'plain-text'], compatibleTools: ['substack', 'mailchimp'],
    stages: [stage('draft', 'build', 'Verify links, claims, and the subject line against the draft.', 'Once the audience, source material, and issue focus are known.', ['social-media/writing-shape'])],
  }),
  direct('social-copy', 'social-copy', {
    formats: ['markdown', 'plain-text'], compatibleTools: ['linkedin', 'x', 'instagram'],
    incomplete: 'Platform-specific copy guidance is required.',
    stages: [stage('draft', 'build', 'Check claims against the source and read the post aloud.', 'When source notes or a transcript are available.', ['social-media/writing-beats'])],
  }),
  direct('mcp-server', 'mcp-server', {
    tools: ['python', 'typescript', 'nodejs'], stackCompatible: true,
    stages: [stage('build', 'build', 'Run the host tool discovery and invoke each tool with valid and invalid inputs.', 'When host, transport, and tools are known.', ['backend-api/mcp-builder'])],
  }),
  direct('dbt-tests', 'dbt-tests', {
    tools: ['dbt', 'dbt-core'], formats: ['yaml', 'sql'],
    stages: [stage('test', 'test', 'Run the affected dbt unit tests with mocked upstream rows and checked expected results.', 'When model inputs and expected outputs are known.', ['backend-api/dbt-unit-testing'])],
  }),
  direct('dbt-model', 'dbt-model', {
    tools: ['dbt', 'dbt-core'], formats: ['sql', 'yaml'],
    stages: [stage('model', 'build', 'Run the model and its tests against fixtures. Check grain and expected rows.', 'When inputs and expected row grain are known.', ['backend-api/dbt-analytics-engineering'])],
  }),
  direct('data-analysis', 'duckdb-analysis', {
    tools: ['duckdb'], formats: ['csv', 'sql'], requiresTool: ['duckdb'],
    stages: [stage('query', 'build', 'Reconcile row counts and aggregate totals against a small input fixture.', 'When data and the expected grain are known.', [], ['duckdb'])],
  }),
  direct('dead-code', 'knip-unused-exports', {
    tools: ['knip'], formats: ['markdown', 'plain-text'], requiresTool: ['knip', 'javascript', 'typescript', 'nodejs', 'nextjs', 'react'],
    stages: [stage('inspect', 'review', 'Check findings against entry points and generated imports before any removal.', 'When the JS or TS project entry points are known.', [], ['knip'])],
  }),
  direct('video-export', 'ffmpeg-video-export', {
    workflow: 'video-edit', tools: ['ffmpeg'], formats: mediaFormats, features: ['interview'],
    stages: [stage('edit', 'build', 'Play the export and check exact length, cut points, sync, and dimensions.', 'When input footage and delivery specs are known.', [], ['ffmpeg'])],
  }),
  direct('captions', 'ffmpeg-captions', {
    workflow: 'video-edit', tools: ['ffmpeg'], formats: [...mediaFormats, 'srt', 'vtt', 'ass'], features: ['burn-in', 'interview'],
    stages: [stage('captions', 'build', 'Check timestamps, speech sync, line breaks, and legibility at delivery size.', 'When a timed caption source is available.', [], ['ffmpeg'])],
  }),
  direct('audio-cleanup', 'ffmpeg-audio-cleanup', {
    workflow: 'video-edit', tools: ['ffmpeg'], formats: mediaFormats, features: ['noise-reduction', 'broadcast', 'interview'],
    stages: [stage('clean-audio', 'build', 'A/B dialogue, verify peak and loudness targets, and listen for filtering artifacts.', 'When a dialogue sample and loudness target are available.', [], ['ffmpeg'])],
  }),
  direct('color-grade', 'ffmpeg-color', {
    workflow: 'video-edit', tools: ['ffmpeg'], formats: [...mediaFormats, 'lut'], features: ['interview'],
    stages: [stage('apply-lut', 'build', 'Check color tags, highlight clipping, and matching skin tones across cuts.', 'Once input color space and an existing LUT are known.', [], ['ffmpeg'])],
  }),
  direct('motion-video', 'hyperframes-motion', {
    workflow: 'motion-video', tools: ['hyperframes'], formats: [...motionFormats, 'html'], features: ['titles'],
    stages: [stage('compose', 'build', 'Review key frames and play the export to test timing, text, and audio.', 'When dimensions, runtime, and source assets are known.', [], ['hyperframes'])],
  }),
  direct('motion-video', 'remotion-motion', {
    workflow: 'motion-video', tools: ['remotion', 'react'], formats: motionFormats, features: ['titles'], requiresTool: ['remotion', 'react'],
    stages: [stage('remotion', 'build', 'Render the first, middle, and last frames. Confirm FPS, frame count, and export playback.', 'When the React composition and delivery settings are known.', [], ['remotion'])],
  }),
  direct('motion-video', 'motion-canvas-animation', {
    workflow: 'motion-video', tools: ['motion-canvas'], formats: motionFormats, features: ['titles'], requiresTool: ['motion-canvas'],
    stages: [stage('motion-canvas', 'build', 'Inspect the motion in the timeline and check rendered frame count.', 'When storyboard beats and frame rate are known.', [], ['motion-canvas'])],
  }),
  direct('motion-video', 'manim-animation', {
    workflow: 'motion-video', tools: ['manim'], formats: ['mp4', 'gif'], features: ['titles'], requiresTool: ['manim'],
    stages: [stage('manim', 'build', 'Render a low-resolution pass, checking equation legibility and transition timing.', 'When the scene sequence and mathematical notation are known.', [], ['manim'])],
  }),
  direct('motion-video', 'threejs-motion', {
    workflow: 'motion-video', tools: ['threejs', 'react-three-fiber', 'drei'], formats: ['html', 'tsx', 'jsx'], features: ['titles'], requiresTool: ['threejs', 'react-three-fiber', 'drei'],
    stages: [stage('threejs', 'build', 'Check deterministic camera positions and frame pacing in the target browser.', 'Once the scene and browser target are defined.', [], ['threejs'])],
  }),
];

const openResources = new Set(['ffmpeg', 'dbt', 'hyperframes', 'manim', 'motion-canvas', 'threejs', 'p5js', 'mdn', 'web-dev',
  'google-fonts', 'fontshare', 'coolors', 'knip', 'vulture', 'deadcode', 'deptry', 'ts-prune', 'playwright', 'react', 'nextjs', 'motion', 'lucide', 'phosphor-icons', 'heroicons',
  'flutter', 'react-native', 'postgresql', 'duckdb', 'openapi', 'prisma', 'redis', 'zod',
  'mermaid', 'c4-model', 'adr', 'excalidraw', 'owasp-asvs', 'owasp-top-10', 'gitleaks', 'trufflehog', 'osv-scanner', 'neon', 'typescript', 'tailwindcss', 'shadcn-ui', 'radix-ui', 'drizzle', 'docker-build-practices',
  'chrome-devtools-mcp', 'puppeteer', 'crawl4ai', 'temporal', 'inngest', 'trigger-dev', 'astro', 'svelte', 'vue', 'kotlin', 'swift', 'eslint', 'prettier', 'biome', 'vite',
  'react-three-fiber', 'drei', 'lenis', 'roughjs']);
const toolResources = {
  ffmpeg: ['ffmpeg'], hyperframes: ['hyperframes'], remotion: ['remotion'], manim: ['manim'],
  threejs: ['threejs'], 'motion-canvas': ['motion-canvas'], p5js: ['p5js'], playwright: ['playwright'],
  'react-three-fiber': ['react-three-fiber'], drei: ['drei'], lenis: ['lenis'], roughjs: ['roughjs'],
  react: ['react', 'nextjs'], nextjs: ['nextjs'], tailwindcss: ['tailwindcss'], typescript: ['typescript'],
  shadcn: ['shadcn-ui'], 'radix-ui': ['radix-ui'], 'aceternity-ui': ['aceternity-ui'], 'magic-ui': ['magic-ui'],
  lucide: ['lucide'], 'phosphor-icons': ['phosphor-icons'], heroicons: ['heroicons'],
  'google-fonts': ['google-fonts'], fontshare: ['fontshare'], coolors: ['coolors'], 'realtime-colors': ['realtime-colors'],
  drizzle: ['drizzle'], postgresql: ['postgresql'], supabase: ['postgresql', 'supabase'],
  prisma: ['prisma'], openapi: ['openapi'], dbt: ['dbt'], 'dbt-core': ['dbt'], docker: ['docker-build-practices'],
  redis: ['redis'], zod: ['zod'], postman: ['postman'], hoppscotch: ['hoppscotch'],
  biome: ['biome'], eslint: ['eslint'], prettier: ['prettier'], vite: ['vite'],
  temporal: ['temporal'], inngest: ['inngest'], 'trigger-dev': ['trigger-dev'], n8n: ['n8n'],
  puppeteer: ['puppeteer'], firecrawl: ['firecrawl'], crawl4ai: ['crawl4ai'], scrapy: ['scrapy'],
  'react-native': ['react-native'], flutter: ['flutter'], knip: ['knip'], vulture: ['vulture'], deptry: ['deptry'], 'ts-prune': ['ts-prune'],
  duckdb: ['duckdb'], neon: ['neon'], swiftui: ['swiftui'], mermaid: ['mermaid'], excalidraw: ['excalidraw'],
  semgrep: ['semgrep'], gitleaks: ['gitleaks'], trufflehog: ['trufflehog'], 'osv-scanner': ['osv-scanner'],
  snyk: ['snyk'], dependabot: ['dependabot'], codeql: ['codeql'], 'owasp-top-10': ['owasp-top-10'],
  gsap: ['gsap'], chrome: ['chrome-devtools-mcp'], devtools: ['chrome-devtools-mcp'],
  'davinci-resolve': ['resolve-editor-training'], 'premiere-pro': ['premiere-text-editing'], inkscape: ['inkscape-pdf'],
  'after-effects': ['after-effects-expressions'],
  astro: ['astro'], svelte: ['svelte'], vue: ['vue'], kotlin: ['kotlin'], swift: ['swift'],
};
const roleByStage = {
  scope: 'plan', plan: 'plan', design: 'design', implement: 'build', diagnose: 'review',
  reach: 'build', verify: 'test', review: 'review', write: 'build', measure: 'review',
  prepare: 'release', release: 'release', test: 'test', compose: 'build', edit: 'build',
  sketch: 'build', draft: 'build',
};
const whenByRole = {
  plan: 'When the brief and project context are available.',
  design: 'After the purpose and constraints are known.',
  build: 'After confirming the artifact and its constraints.',
  test: 'Once there is an artifact or reproducible case to check.',
  review: 'When evidence or a diff is available.',
  release: 'When a candidate and required checks are available.',
};

module.exports = { local, openResources, toolResources, roleByStage, whenByRole };
