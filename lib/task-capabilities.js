'use strict';

const { specialistRoutes } = require('./specialist-capabilities');

// Explicit coverage is kept separate from retrieval signals. A mention in a
// description or a lexical/vector match cannot add a tool or output format.
const motionFormats = ['mp4', 'webm', 'h264'];
const mediaFormats = ['mp4', 'mov', 'webm', 'h264', 'h265', 'prores', 'aac', 'wav', 'mp3', 'flac', 'gif'];

const route = (kind, workflow, evidence = {}) => ({ id: workflow, kind, workflow, ...evidence });
const direct = (kind, id, evidence) => ({ id, kind, ...evidence });
const stage = (id, role, check, when, skillIds = [], resourceIds = []) => ({ id, role, check, when, skillIds, resourceIds });
const local = [
  ...specialistRoutes,
  route('web-site', 'new-web-project', { formats: ['html'], tools: ['react', 'nextjs', 'html', 'css'], stackCompatible: true }),
  route('web-redesign', 'web-redesign', { formats: ['html'], tools: ['react', 'nextjs', 'html', 'css'], stackCompatible: true }),
  route('ui-design', 'design', { formats: ['html'], tools: ['html', 'css'], stackCompatible: true }),
  direct('wireframe', 'wireframe-design', {
    workflow: 'design', formats: ['html'], tools: ['html', 'css'],
    stages: [stage('wireframe', 'design', 'Trace the primary task and compare the layout at mobile and desktop widths.', 'When audience, content, and key states are known.', ['ui-ux/wireframe'])],
  }),
  direct('ui-review', 'ui-review', {
    formats: ['markdown', 'plain-text'], tools: ['html', 'css'], compatibleStack: true,
    stages: [stage('review', 'review', 'Record failing paths, contrast ratios, and keyboard and focus behavior.', 'When a representative page is available.', ['ui-ux/fixing-accessibility'], ['mdn'])],
  }),
  route('feature', 'feature', { formats: ['html'], tools: ['html', 'css', 'react', 'nextjs'], stackCompatible: true }),
  route('plan', 'plan', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('debug', 'debug', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('architecture', 'architecture', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('api', 'api-data', { formats: ['json', 'yaml', 'sql', 'markdown', 'plain-text'], tools: ['postgresql', 'supabase', 'prisma'], stackCompatible: true }),
  route('mobile-app', 'mobile', { tools: ['react-native', 'flutter'], stackCompatible: true }),
  route('code-review', 'review', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('documentation', 'documentation', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('performance', 'performance', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('browser-tests', 'browser-check', { tools: ['playwright'], stackCompatible: true }),
  route('release-plan', 'release', { formats: ['markdown', 'plain-text'], stackCompatible: true }),
  route('deploy', 'deploy', { stackCompatible: true }),
  route('tests', 'testing', { stackCompatible: true }),
  route('static-graphic', 'graphic-design', { formats: ['png', 'pdf'], compatibleTools: ['figma', 'canva', 'inkscape', 'illustrator', 'photoshop', 'indesign', 'affinity-designer'] }),
  route('generative-art', 'generative-art', { formats: ['html'], tools: ['p5js'] }),
  route('article', 'editorial', { formats: ['markdown', 'plain-text'], compatibleTools: ['google-docs', 'wordpress', 'obsidian'] }),
  direct('design-system-doc', 'design-system-doc', {
    formats: ['markdown', 'plain-text'],
    stages: [stage('document', 'build', 'Trace tokens and component examples to actual project inputs.', 'Once representative screens or source files are available.', ['ui-ux/create-design-md'])],
  }),
  direct('brand-guide', 'brand-guide', {
    compatibleTools: ['figma', 'canva', 'inkscape', 'illustrator', 'indesign', 'affinity-designer'],
    formats: ['markdown', 'plain-text'], incomplete: 'No integrated identity kit covers logo, type, color, and usage rules together.',
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
    workflow: 'video-edit', tools: ['ffmpeg'], formats: mediaFormats, features: ['interview'],
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
    workflow: 'motion-video', tools: ['threejs'], formats: ['html'], features: ['titles'], requiresTool: ['threejs'],
    stages: [stage('threejs', 'build', 'Check deterministic camera positions and frame pacing in the target browser.', 'Once the scene and browser target are defined.', [], ['threejs'])],
  }),
];

const openResources = new Set(['ffmpeg', 'dbt', 'hyperframes', 'manim', 'motion-canvas', 'threejs', 'p5js', 'mdn', 'web-dev',
  'google-fonts', 'knip', 'playwright', 'react', 'nextjs', 'motion', 'lucide', 'flutter', 'react-native', 'postgresql', 'duckdb', 'openapi', 'prisma',
  'mermaid', 'c4-model', 'adr', 'owasp-asvs', 'gitleaks', 'neon', 'typescript']);
const toolResources = {
  ffmpeg: ['ffmpeg'], hyperframes: ['hyperframes'], remotion: ['remotion'], manim: ['manim'],
  threejs: ['threejs'], 'motion-canvas': ['motion-canvas'], p5js: ['p5js'], playwright: ['playwright'],
  react: ['react', 'nextjs'], nextjs: ['nextjs'], postgresql: ['postgresql'], supabase: ['postgresql', 'supabase'],
  prisma: ['prisma'], 'react-native': ['react-native'], flutter: ['flutter'], knip: ['knip'], duckdb: ['duckdb'],
  neon: ['neon'], swiftui: ['swiftui'], mermaid: ['mermaid'], semgrep: ['semgrep'], gitleaks: ['gitleaks'],
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
