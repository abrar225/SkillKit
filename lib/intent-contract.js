'use strict';

const { intentSchema: legacyIntent, workflowIds } = require('./task-router');

const list = (maxItems, maxLength) => ({
  type: 'array', maxItems, uniqueItems: true, items: { type: 'string', minLength: 1, maxLength },
});
const intentSchema = {
  ...legacyIntent,
  required: [],
  properties: {
    ...legacyIntent.properties,
    formats: list(8, 80),
    tools: list(8, 80),
    forbiddenTools: list(8, 80),
    budget: { type: 'string', enum: ['any', 'free', 'open-source'] },
    stage: { type: 'string', enum: ['plan', 'design', 'build', 'test', 'review', 'release'] },
    qualityBar: list(8, 180),
    files: list(20, 240),
  },
};
const inputSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    task: { type: 'string', maxLength: 8000 },
    intent: intentSchema,
    workflow: { type: 'string', enum: workflowIds },
    stack: { type: 'string', maxLength: 200 },
  },
};

const unique = (values) => [...new Set(values)];
const slug = (value) => value.toLowerCase().trim().replace(/[^a-z\d]+/g, '-').replace(/^-|-$/g, '');
const tools = [
  ['davinci-resolve', /\b(?:da[ -]?vinci(?: resolve)?|resolve(?: studio)?(?=\s+(?:timeline|project|workflow)|[.,;!?]|$)|resolve studio)\b/i],
  ['premiere-pro', /\b(?:adobe )?premiere(?: pro)?\b/i],
  ['after-effects', /\b(?:adobe )?after effects\b|\bAE(?= scripting| project)\b/i],
  ['ffmpeg', /\bffmpeg\b/i], ['remotion', /\bremotion\b/i],
  ['hyperframes', /\bhyperframes\b/i], ['motion-canvas', /\bmotion canvas\b/i],
  ['lottie', /\blottie\b/i], ['threejs', /\bthree[. -]?js\b/i], ['manim', /\bmanim\b/i],
  ['final-cut-pro', /\bfinal cut(?: pro)?\b/i], ['capcut', /\bcapcut\b/i],
  ['blender', /\bblender\b/i], ['audacity', /\baudacity\b/i], ['kdenlive', /\bkdenlive\b/i],
  ['figma', /\bfigma\b/i], ['canva', /\bcanva\b/i], ['inkscape', /\binkscape\b/i],
  ['illustrator', /\b(?:adobe )?illustrator\b/i], ['photoshop', /\b(?:adobe )?photoshop\b/i],
  ['indesign', /\b(?:adobe )?indesign\b/i], ['affinity-designer', /\baffinity designer\b/i],
  ['linkedin', /\blinkedin\b/i], ['instagram', /\binstagram\b/i],
  ['x', /\b(?:twitter|x(?=\s+(?:post|thread)))\b/i], ['substack', /\bsubstack\b/i],
  ['mailchimp', /\bmailchimp\b/i], ['wordpress', /\bwordpress\b/i],
  ['google-docs', /\bgoogle docs\b/i], ['obsidian', /\bobsidian\b/i],
  ['knip', /\bknip\b/i], ['playwright', /\bplaywright\b/i], ['cypress', /\bcypress\b/i],
  ['postgresql', /\bpostgres(?:ql)?\b/i], ['supabase', /\bsupabase\b/i],
  ['prisma', /\bprisma\b/i], ['duckdb', /\bduckdb\b/i], ['bigquery', /\bbigquery\b/i],
  ['dbt-core', /\bdbt core\b/i], ['dbt', /\bdbt\b(?!\s+core)/i],
  ['terraform', /\bterraform\b/i], ['github-actions', /\bgithub actions\b/i],
  ['vercel', /\bvercel\b/i], ['netlify', /\bnetlify\b/i],
  ['docker', /\bdocker\b/i], ['kubernetes', /\bkubernetes\b|\bk8s\b/i],
  ['p5js', /\bp5[. ]?js\b/i],
];
const stacks = [
  ['nextjs', /\bnext[. ]?js\b|\bnext\.config\.[a-z]+\b/i],
  ['react-native', /\breact[- ]native\b|\bexpo\b/i],
  ['react', /\breact\b(?![- ]native)/i], ['flutter', /\bflutter\b|\bpubspec\.yaml\b/i],
  ['swift', /\bswift(?:ui)?\b/i], ['kotlin', /\bkotlin\b/i],
  ['python', /\bpython\b|\bpyproject\.toml\b/i], ['rust', /\brust\b|\bcargo\.toml\b/i],
  ['typescript', /\btypescript\b|\btsconfig\.json\b/i],
  ['nodejs', /\bnode[. ]?js\b|\bpackage\.json\b/i],
  ['javascript', /\bjavascript\b/i], ['vue', /\bvue(?:\.js)?\b/i],
  ['svelte', /\bsvelte(?:kit)?\b/i], ['angular', /\bangular\b/i],
  ['astro', /\bastro\b/i], ['tailwindcss', /\btailwind(?: css)?\b/i],
  ['css', /\bcss\b/i], ['html', /\bhtml\b/i],
  ['go', /\bgolang\b|\bgo\.mod\b|\bGo\b/], ['ruby', /\bruby\b|\bgemfile\b/i],
];
const formats = [
  ['plain-text', 'plain text|text only|\\.txt\\b'], ['markdown', 'markdown|\\.md\\b'],
  ['mp4', 'mp4'], ['mov', '\\.mov\\b|quicktime'], ['webm', 'webm'],
  ['h264', 'h[. -]?264'], ['h265', 'h[. -]?265|hevc'], ['prores', 'prores'],
  ['aac', 'aac'], ['wav', 'wav|wave audio'], ['mp3', 'mp3'], ['flac', 'flac'],
  ['srt', 'srt|subrip'], ['vtt', 'webvtt|vtt'], ['ass', '\\.ass\\b|advanced substation alpha'],
  ['drp', 'drp'], ['drt', 'drt'], ['prproj', 'prproj'], ['fcpxml', 'fcpxml'], ['aep', 'aep'],
  ['lut', '\\.cube\\b|\\blut\\b'], ['pdf-x', 'pdf[ /-]x(?:-[134])?'], ['pdf', 'pdf(?![ /-]x)'],
  ['png', 'png'], ['jpg', 'jpe?g'], ['svg', 'svg'], ['psd', 'psd'], ['ai', '\\.ai\\b'],
  ['gif', 'gif'], ['lottie-json', 'lottie json'], ['fig', 'figma file|\\.fig\\b'],
  ['html', 'html'], ['json', '(?<!lottie )json'], ['yaml', 'ya?ml'], ['sql', 'sql'],
  ['docx', 'docx|word document'], ['pptx', 'pptx|powerpoint'], ['xlsx', 'xlsx'], ['csv', 'csv'],
].map(([key, pattern]) => [key, new RegExp('(?:^|[^a-z\\d])(?:' + pattern + ')(?=$|[^a-z\\d])', 'i')]);

const kindByAction = {
  'new-web-project': 'web-site', 'web-redesign': 'web-redesign', design: 'ui-design',
  feature: 'feature', plan: 'plan', debug: 'debug', architecture: 'architecture',
  'api-data': 'api', mobile: 'mobile-app', review: 'code-review', documentation: 'documentation',
  performance: 'performance', 'browser-check': 'browser-tests', release: 'release-plan',
  deploy: 'deploy', testing: 'tests', 'graphic-design': 'static-graphic', 'video-edit': 'video-export',
  'motion-video': 'motion-video', 'generative-art': 'generative-art', editorial: 'article',
};

const positiveForms = [
  ['social-copy', /\b(?:linkedin|instagram|facebook|threads|twitter|x|social media|tiktok|youtube)\b.{0,24}\b(?:post|caption|copy|thread|description)s?\b|\b(?:post|caption|copy|thread)s?\b.{0,20}\b(?:for|on) (?:my |our )?(?:linkedin|instagram|facebook|threads|twitter|x|tiktok|youtube)\b|\bsocial (?:copy|post|caption)\b/i],
  ['newsletter', /\bnewsletter\b/i],
  ['documentation', /\b(?:readme|api docs|release notes|developer documentation|user documentation|changelog|docs for)\b/i],
  ['design-system-doc', /(?:\bdesign\.md\b|\bdesign (?:tokens?|system)\b.{0,25}\b(?:inventory|documentation|audit)\b)/i],
  ['mcp-server', /\b(?:build|create|implement|scaffold|write|develop)\b.{0,65}\b(?:mcp server|model context protocol server)\b|^\s*(?:an? )?mcp server\b/i],
  ['feature', /\b(?:add|implement|build|update|fix|improve)\b.{0,90}\b(?:button|widget|feature|component|filter|search bar|pagination|form validation)\b/i],
  ['video-editor-project', /\b(?:editab(?:le|ility)|native|reopenable|reopen|project file|\.prproj|\.drp|\.drt|\.aep|\.fcpxml)\b.{0,60}\b(?:timeline|project|source|premiere|resolve|after effects)\b|\b(?:timeline|project)\b.{0,24}\b(?:\.prproj|\.drp|\.drt|\.aep|\.fcpxml|editable)\b/i],
  ['motion-video', /\b(?:motion graphics?|animated (?:explainers?|videos?|diagrams?|titles?|logos?)|launch film|product reel|showreel|animation reel|kinetic typograph\w*|motion design|lower thirds?|lottie|after effects scripting)\b|\b(?:animate|render|build|make|create|compose)\b.{0,75}\b(?:explainer|animation|manim|remotion|motion canvas|hyperframes)\b/i],
  ['captions', /\b(?:subtitles?|closed captions?|burn(?:ed)?[- ]?in captions?|caption tracks?|srt|webvtt|vtt)\b/i],
  ['audio-cleanup', /\b(?:audio cleanup|denoise|noise reduction|remove (?:background )?noise|normalize (?:the )?(?:audio|dialogue|loudness)|de[- ]?hum|clean up (?:the )?(?:audio|dialogue)|(?:remove|reduce) (?:background |an? )?hum)\b/i],
  ['color-grade', /\b(?:colou?r grad(?:e|ing)|colou?r correct(?:ion)?|apply (?:a |an |the )?lut|build (?:a |the )?lut|white balance (?:grade|footage))\b/i],
  ['video-export', /\b(?:edit(?:ing)?|trim|cut|crop|transcode|convert|splice|encode|mux|export|deliver|resize|compress|render)\b.{0,85}\b(?:video|footage|clip|interview|recording|mp4|webm|prores|h[. -]?264|h[. -]?265)\b|\b(?:edited|trimmed|cropped) (?:footage|video)\b|\bvideo (?:export|edit|editing)\b/i],
  ['brand-guide', /\b(?:brand identity|brand guidelines?|brand kits?|brand style guide|logo system|wordmark|brand mood ?board)\b/i],
  ['static-graphic', /\b(?:poster|flyer|infographic|static graphic|album cover|book cover|print artwork|print design|leaflet|event graphic|brochure)\b/i],
  ['generative-art', /\b(?:generative art|algorithmic art|flow fields?|seeded sketch|p5[. ]?js)\b/i],
  ['dbt-tests', /\bdbt\b.{0,75}\b(?:tests?|tdd)\b|\b(?:tests?|tdd)\b.{0,75}\bdbt\b/i],
  ['dbt-model', /\bdbt\b.{0,75}\b(?:models?|transformations?|snapshots?)\b|\b(?:models?|transformations?|snapshots?)\b.{0,75}\bdbt\b/i],
  ['data-analysis', /\b(?:analy[sz]e|analyse|analysis|summari[sz]e|aggregate|query)\b.{0,80}\b(?:csv|dataset|data set|data|parquet|spreadsheet|sql|duckdb)\b/i],
  ['article', /\b(?:write|draft|rewrite|reshape|edit|article|essay|blog post)\b.{0,80}\b(?:article|essay|blog post)\b|^(?:an? )?(?:article|essay|blog post)\b/i],
  ['debug', /\b(?:fix|debug|diagnose|investigate|reproduce|troubleshoot)\b.{0,85}\b(?:crash|regression|exception|failing|flakes?|broken|bug|failure|timeout|error|leak)\b|\b(?:crash fix|bug fix|root cause analysis)\b/i],
  ['tests', /\b(?:unit|integration|regression|automated) tests?\b|\b(?:add|write|cover)\b.{0,60}\btests?\b/i],
  ['code-review', /\bcode review\b|\breview\b.{0,40}\b(?:diff|pull request|pr|changes|implementation|code)\b/i],
  ['browser-tests', /\b(?:browser tests?|browser smoke tests?|end-to-end tests?|e2e tests?|test in (?:a |the )?browser)\b/i],
  ['release-plan', /\b(?:release readiness|release plan|rollback plan|deployment plan)\b|\b(?:prepare|plan|preflight|check readiness)\b.{0,50}\b(?:release|deployment|launch|rollout)\b/i],
  ['deploy', /\b(?:deploy|ship|publish)\b.{0,55}\b(?:site|service|app|staging|production|vercel|netlify|release)\b/i],
  ['architecture', /\b(?:system architecture|architecture (?:review|decision|diagram)|architectural (?:review|decision)|module boundaries|system design)\b/i],
  ['api', /\b(?:api|database schema|data model|rest endpoint|graphql|openapi|migration)\b.{0,60}\b(?:design|spec|model|schema|contract)\b|\b(?:design|model|define|test|implement|write|build)\b.{0,60}\b(?:api|database schema|data model|rest endpoint|graphql|openapi|migration)\b/i],
  ['mobile-app', /\b(?:build|create|implement|make|scaffold|polish)\b.{0,70}\b(?:mobile app|flutter app|react native app|ios app|android app)\b|^(?:an? )?(?:mobile app|flutter app|react native app|ios app|android app)\b/i],
  ['performance', /\b(?:profile|optimi[sz]e|measure|improve)\b.{0,70}\b(?:performance|latency|load time|lcp|core web vitals)\b/i],
  ['web-redesign', /\b(?:redesign|restyle|refresh|overhaul|revamp|rework)\b.{0,80}\b(?:portfolio|site|website|web app|homepage|landing page|dashboard)\b/i],
  ['ui-design', /\b(?:wireframe|mockup|prototype|screen design|ux audit|accessibility audit|ui design)\b|\b(?:design|polish|audit|review)\b.{0,65}\b(?:interface|ui|ux)\b/i],
  ['web-site', /\b(?:build|create|launch|make|design|prototype|scaffold)\b.{0,85}\b(?:website|web app|homepage|page|portfolio|site|dashboard)\b|^(?:an? )?(?:landing page|portfolio site|website|web app)\b/i],
  ['dead-code', /\b(?:dead code|unused (?:exports|dependencies|files))\b/i],
  ['plan', /^(?:please )?(?:plan\b|(?:write|draft|outline|create|give me)\s+(?:an? |the )?(?:(?:implementation|migration|project|test) )?plan\b)|\bimplementation plan\b/i],
  ['feature', /\b(?:implement|modify|refactor|port)\b.{0,70}\b(?:service|project|repo|code|app|module|backend|frontend)\b/i],
];

const actionByKind = Object.fromEntries(Object.entries(kindByAction).map(([action, kind]) => [kind, action]));
const negation = /\b(?:do not|don['’]t|no need to|never|avoid|without|exclude|forbid(?:den)?|no)\s+/i;
const separators = /[.!?](?:\s|$)|[;\n]|\s+(?:but instead|instead of|but)\s+|,?\s+(?:and then|then)\s+|,?\s+and\s+(?=(?:also\s+)?(?:write|draft|deploy|design|edit|create|make|trim|export|cut|deliver|render|add|build|implement|review|test|verify|plan|(?:an? |the )?(?:poster|flyer|newsletter|article|blog post|infographic|video|mp4|project file|editable timeline|spreadsheet|workbook|presentation|deck|slides?|pdf|readme|(?:linkedin|instagram|twitter|x) (?:post|caption|thread)))\b)/i;
const sourceClause = /\s+(?:from|based on|summarizing|to accompany|for the already[- ]edited|for an already[- ]edited)\s+/i;
const media = new Set(['video-editor-project', 'motion-video', 'video-export', 'color-grade', 'captions', 'audio-cleanup']);
const writing = new Set(['social-copy', 'newsletter', 'article', 'documentation']);
const toolForFormat = { drp: 'davinci-resolve', drt: 'davinci-resolve', prproj: 'premiere-pro', fcpxml: 'final-cut-pro', aep: 'after-effects', fig: 'figma', 'lottie-json': 'lottie' };

function validate(input, schema, name) {
  const fail = () => { throw new Error('Invalid ' + name + '.'); };
  if (schema.type === 'object') {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail();
    for (const [key, value] of Object.entries(input)) {
      if (!Object.hasOwn(schema.properties, key)) throw new Error('Unknown ' + name + ' field: ' + key);
      validate(value, schema.properties[key], key);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(input) || input.length > (schema.maxItems ?? Infinity) || new Set(input).size !== input.length) fail();
    for (const value of input) validate(value, schema.items, name);
  } else if (typeof input !== 'string' || input.length > (schema.maxLength ?? Infinity) ||
             (schema.minLength && input.trim().length < schema.minLength) || (schema.enum && !schema.enum.includes(input))) {
    fail();
  }
}

const detect = (value, patterns) => patterns.filter(([, pattern]) => pattern.test(value)).map(([id]) => id);
const canonicalTool = (value) => {
  const key = slug(value);
  return ({ 'da-vinci-resolve': 'davinci-resolve', 'davinci': 'davinci-resolve', resolve: 'davinci-resolve',
    premiere: 'premiere-pro', ae: 'after-effects', 'three-js': 'threejs', 'next-js': 'nextjs',
    'p5-js': 'p5js', postgres: 'postgresql', twitter: 'x' })[key] ?? detect(value, [...tools, ...stacks])[0] ?? key;
};
const canonicalFormat = (value) => {
  const key = slug(value);
  return formats.some(([id]) => id === key) ? key : ({ txt: 'plain-text', md: 'markdown' })[key] ?? detect(value, formats)[0] ?? key;
};

function identify(text) {
  if (/^(?:please )?(?:plan|outline the (?:work|implementation)|write (?:a |the )?(?:short |implementation )?plan)\b/i.test(text) &&
      !/\b(?:release|rollback|deployment plan)\b/i.test(text)) return 'plan';
  if (/^\s*(?:please )?(?:test|verify|check|smoke[- ]test)\b.{0,65}\b(?:playwright|browser|chrome)\b/i.test(text)) return 'browser-tests';
  if (/^\s*(?:please )?(?:review|audit|check)\b.{0,60}\b(?:html|css|web accessibility|wcag|a11y)\b/i.test(text)) return 'ui-review';
  if (detect(text.split(sourceClause)[0], formats).some((format) => ['drp', 'drt', 'prproj', 'aep', 'fcpxml'].includes(format)) ||
      /\b(?:editable|native) (?:resolve |premiere |davinci resolve |after effects )?(?:timeline|project)\b/i.test(text)) return 'video-editor-project';
  const withoutSource = text.split(sourceClause)[0];
  const kind = positiveForms.find(([, pattern]) => pattern.test(withoutSource))?.[0];
  if (!kind && /\b(?:guide|docs|documentation|reference)\b.{0,60}\b(?:for|on)\b/i.test(text)) return 'reference';
  return kind;
}

function excludeFacts(task) {
  return unique(task.split(separators).flatMap((clause) => {
    const offset = clause.search(negation);
    return offset < 0 ? [] : detect(clause.slice(offset).replace(negation, ''), [...tools, ...stacks]);
  }));
}

function mediaFeatures(text, kind) {
  if (!media.has(kind)) return [];
  return [
    ...(/\b(?:transcrib\w*|from scratch captions?|auto[- ]?captions?|speech[- ]to[- ]text)\b/i.test(text) ? ['transcription'] : []),
    ...(/\b(?:burn[- ]in|burn(?:ed)? (?:the )?captions?|open captions?)\b/i.test(text) ? ['burn-in'] : []),
    ...(/\b(?:lower thirds?|title cards?)\b/i.test(text) ? ['titles'] : []),
    ...(/\b(?:multicam|multi.camera)\b/i.test(text) ? ['multicam'] : []),
    ...(/\binterview\b/i.test(text) ? ['interview'] : []),
    ...(/\b(?:denoise|noise reduction|cleanup|remove (?:background |an? )?(?:hum|noise))\b/i.test(text) ? ['noise-reduction'] : []),
    ...(/\b(?:broadcast|eb[u] r128)\b/i.test(text) ? ['broadcast'] : []),
  ];
}

function requirement(text, kind) {
  const target = text.split(sourceClause)[0];
  const artifactFormats = detect(target, formats).filter((id) =>
    !(id === 'html' && ['ui-review', 'web-redesign', 'web-site', 'feature'].includes(kind)) &&
    !(['csv', 'xlsx', 'json', 'yaml'].includes(id) && ['data-analysis', 'feature'].includes(kind) &&
      /\b(?:analy[sz]e|analyse|import|parse|read|load)\b/i.test(target) && !/\b(?:export|generate|return|output|deliver)\b/i.test(target)) &&
    !(id === 'sql' && ['dbt-model', 'dbt-tests'].includes(kind) && !/\b(?:export|deliver|write|output)\b.{0,25}\bsql\b/i.test(target)));
  const targetTools = detect(target, tools);
  if (['web-site', 'web-redesign', 'ui-design', 'feature', 'mobile-app', 'mcp-server'].includes(kind) &&
      /\b(?:use|using|in|with|on|for)\b/i.test(target)) {
    targetTools.push(...detect(target, stacks));
  }
  if (media.has(kind) && /\bin\s+resolve\b/i.test(target)) targetTools.push('davinci-resolve');
  if (kind === 'motion-video' && detect(target, stacks).includes('react') && !targetTools.length) targetTools.push('react');
  return {
    kind, text: text.trim().slice(0, 240), tools: unique([...targetTools, ...artifactFormats.map((id) => toolForFormat[id]).filter(Boolean)]),
    formats: artifactFormats, features: mediaFeatures(text, kind),
  };
}

function clarify(subject) {
  if (!subject || !/\b(?:help|need|something|find|suggest|looking for|work on|ideas)\b/i.test(subject)) return null;
  if (/\b(?:video|footage)\b/i.test(subject) && !/\b(?:deliver|add|make|create|show|publish|write|fix)\b/i.test(subject)) {
    return { question: 'Are you editing existing footage or creating a motion graphic?', choices: ['video-edit', 'motion-video'] };
  }
  if (/\b(?:portfolio|site|website|homepage)\b/i.test(subject) && !/\b(?:with\s+\d+|create|build|fix|write|host|test)\b/i.test(subject)) {
    return { question: 'Should the kit create a new site or redesign an existing one?', choices: ['new-web-project', 'web-redesign'] };
  }
  if (/\b(?:design|visuals?)\b/i.test(subject) && !/\b(?:interface|logo|brand|paper|artifact)\b/i.test(subject)) {
    return { question: 'What should the design deliverable be?', choices: ['design', 'graphic-design', 'motion-video'] };
  }
  return null;
}

function parseIntent(input = {}) {
  validate(input, inputSchema, 'kit request');
  const { task = '', workflow, stack = '', intent = {} } = input;
  if (input.intent && workflow !== undefined) throw new Error('Pass intent or an explicit workflow, not both.');
  const clauses = task.trim().split(separators);
  const explicit = intent.deliverables || [];
  const clausesOfWork = clauses.map((part) => part.split(negation)[0].trim()).filter(Boolean);
  const subject = clausesOfWork.join(' ');
  const constraints = new Set(intent.constraints || []);
  if (/\b(?:(?:do not|don['’]t|no need to|never)\s+(?:actually\s+)?(?:deploy|publish|ship|release)|no (?:deployment|deploying))\b/i.test(task)) constraints.add('no-deployment');
  if (/\b(?:design only|mockups? only)\b/i.test(task)) constraints.add('design-only');
  if (/\b(?:no (?:implementation|coding)|(?:do not|don['’]t) (?:implement|write code)|without (?:writing code|implementing))\b/i.test(task)) constraints.add('no-implementation');
  if (constraints.has('design-only')) {
    constraints.add('no-implementation');
    constraints.add('no-deployment');
  }
  const openSource = intent.budget === 'open-source' ||
    /\b(?:only|using|with|require(?:s|d)?) (?:fully |strictly )?open[- ]source(?: only| tools?| software| resources?| references?)?\b|\bopen[- ]source (?:tools?|software|resources?) only\b|\bno proprietary (?:tools?|software)\b/i.test(task);
  const free = intent.budget === 'free' || constraints.has('free-resources-only') ||
    /\b(?:only free|using (?:only )?free|free (?:resources?|tools?|software|references?) only|no (?:paid (?:resources?|tools?|software|references?)|subscriptions)|zero[- ]budget|without (?:paying|a paid subscription))\b/i.test(task);
  if (free) constraints.add('free-resources-only');
  if (openSource) constraints.add('open-source-only');
  const forbiddenTools = unique([...(intent.forbiddenTools || []).map(canonicalTool), ...excludeFacts(task)]);
  const fileFacts = intent.files || [];
  const contextWords = [subject, stack, ...explicit, ...(intent.stack || []), ...fileFacts].join(' ');
  const stackFacts = unique([...stack.split(',').map((name) => name.trim()).filter(Boolean).map(canonicalTool),
    ...(intent.stack || []).map(canonicalTool), ...detect(contextWords, stacks),
    ...(/\bdbt_project\.ya?ml\b/i.test(contextWords) ? ['dbt'] : [])]).filter((tool) => !forbiddenTools.includes(tool));
  let projectState = intent.projectState ?? 'unknown';
  if (projectState === 'unknown') {
    if (fileFacts.length || /\b(?:existing|current|already built|repository|repo|codebase)\b/i.test(subject)) projectState = 'existing';
    else if (/\b(?:new|from scratch|first)\b/i.test(subject)) projectState = 'new';
  }

  const requestedActions = workflow ? [workflow] : intent.actions || [];
  let deliverables = explicit.length
    ? explicit.map((text, index) => requirement(text, identify(text) || kindByAction[requestedActions[index]] || 'unknown'))
    : [];
  for (const clause of clausesOfWork) {
    let kind = identify(clause);
    if (!kind && ((/^(?:also )?(?:write|draft|deliver|provide|create|build|export|make|send)\s+\S/i.test(clause) &&
        (deliverables.length || /\b(?:clipboard|schedule|presentations?|deck|slides?|spreadsheet|workbook|report|pdf|asset|pack)\b/i.test(clause))) ||
        (deliverables.length && /^(?:an? |the )?(?:spreadsheet|workbook|presentation|deck|slides?|pdf)\b/i.test(clause)))) {
      kind = 'unknown';
    }
    if (!kind) continue;
    const current = requirement(clause, kind);
    const prior = deliverables.at(-1);
    if (!explicit.length && prior?.kind === 'motion-video' && kind === 'video-export' &&
        /^(?:export|render|deliver|mp4)\b/i.test(clause) && (!current.tools.length || current.tools.every((tool) => prior.tools.includes(tool)))) {
      prior.formats = unique([...prior.formats, ...current.formats]);
      continue;
    }
    if (!explicit.length && prior?.kind === 'video-export' && kind === 'video-editor-project' && !prior.formats.length &&
        !/\b(?:export|encode|transcode|mp4)\b/i.test(prior.text)) {
      current.tools = unique([...prior.tools, ...current.tools]);
      current.features = unique([...prior.features, ...current.features]);
      deliverables.pop();
    }
    const same = deliverables.find((item) => item.kind === kind && kind !== 'unknown' &&
      (!item.tools.length || !current.tools.length || item.tools.join() === current.tools.join()));
    if (same) {
      same.formats = unique([...same.formats, ...current.formats]);
      same.tools = unique([...same.tools, ...current.tools]);
      same.features = unique([...same.features, ...current.features]);
    } else if (kind !== 'unknown' || !explicit.length) {
      deliverables.push(current);
    }
  }
  for (const action of requestedActions) {
    if (!deliverables.some((item) => item.kind === kindByAction[action] || actionByKind[item.kind] === action ||
      (action === 'video-edit' && media.has(item.kind)) ||
      (action === 'editorial' && writing.has(item.kind)) ||
      (action === 'api-data' && ['dbt-model', 'dbt-tests', 'data-analysis', 'mcp-server'].includes(item.kind)) ||
      (action === 'design' && ['ui-review', 'static-graphic', 'brand-guide'].includes(item.kind)))) {
      const onlyUnknown = deliverables.length === 1 && deliverables[0].kind === 'unknown';
      if (onlyUnknown) deliverables[0].kind = kindByAction[action];
      else if (!deliverables.length || (intent.actions?.includes(action) && action === 'plan')) deliverables.push(requirement(subject, kindByAction[action]));
    }
  }

  if (constraints.has('design-only')) {
    for (const item of deliverables) {
      if (['web-site', 'web-redesign', 'feature'].includes(item.kind)) item.kind = 'ui-design';
    }
  }
  if (intent.stage === 'plan' && deliverables.every((item) => ['web-site', 'web-redesign', 'feature', 'api', 'mobile-app'].includes(item.kind))) {
    deliverables = [requirement(subject || explicit.join(' '), 'plan')];
  }
  if (!deliverables.length && subject) deliverables.push(requirement(subject, 'unknown'));
  const requestedTools = (intent.tools || []).map(canonicalTool);
  const requestedFormats = (intent.formats || []).map(canonicalFormat);
  for (const item of deliverables) {
    const family = media.has(item.kind) ? media : null;
    const neighbors = family ? deliverables.filter((other) => other !== item && family.has(other.kind)) : [];
    const nearbyTools = unique(neighbors.flatMap((other) => other.tools));
    if (!item.tools.length && nearbyTools.length === 1) item.tools = nearbyTools;
    if (deliverables.length === 1 || !item.tools.length) item.tools = unique([...item.tools, ...requestedTools]);
    if (deliverables.length === 1 || !item.formats.length) item.formats = unique([...item.formats, ...requestedFormats]);
    if (media.has(item.kind) && item.formats.some((format) => ['drp', 'drt', 'prproj', 'fcpxml', 'aep'].includes(format))) {
      item.kind = 'video-editor-project';
      item.tools = unique([...item.tools, ...item.formats.map((format) => toolForFormat[format]).filter(Boolean)]);
    }
  }
  // Global structured requirements belong to the kit even when a brief associates
  // individual unstructured requirements with particular outputs.
  const topics = unique([...(intent.topics || []), ...stackFacts, ...detect(contextWords, tools),
    ...(/\b(?:hover|animations?|micro[- ]?interactions?)\b/i.test(subject) ? ['motion'] : []),
    ...(/\b(?:api|endpoint|rest|openapi)\b/i.test(subject) ? ['api'] : [])]);
  const known = deliverables.some(({ kind }) => kind !== 'unknown');
  const clarification = intent.unresolvedDecision
    ? { question: intent.unresolvedDecision.replace(/[.!?]+$/, '') + '?', choices: [] }
    : !known && !workflow && !requestedActions.length ? clarify(subject) : null;
  return {
    task, deliverables: deliverables.slice(0, 12), omittedDeliverables: Math.max(0, deliverables.length - 12),
    formats: unique([...requestedFormats, ...deliverables.flatMap((item) => item.formats)]),
    tools: unique([...requestedTools, ...deliverables.flatMap((item) => item.tools)]), forbiddenTools,
    budget: openSource ? 'open-source' : free ? 'free' : 'any',
    qualityBar: unique(intent.qualityBar || []), stage: intent.stage || null,
    project: { state: projectState, stack: stackFacts, files: fileFacts },
    constraints: [...constraints], topics, requestedActions, clarification,
  };
}

module.exports = { parseIntent, inputSchema, kindByAction, actionByKind, canonicalTool, canonicalFormat };
