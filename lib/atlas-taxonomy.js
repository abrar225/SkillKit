'use strict';

const slug = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z\d]+/g, '-').replace(/^-|-$/g, '');
const unique = (values) => [...new Set(values.filter(Boolean))];

const toolAliases = {
  'da-vinci-resolve': 'davinci-resolve',
  davinci: 'davinci-resolve',
  resolve: 'davinci-resolve',
  'resolve-studio': 'davinci-resolve',
  premiere: 'premiere-pro',
  'adobe-premiere': 'premiere-pro',
  'adobe-premiere-pro': 'premiere-pro',
  ae: 'after-effects',
  'adobe-after-effects': 'after-effects',
  'final-cut': 'final-cut-pro',
  'three-js': 'threejs',
  'next-js': 'nextjs',
  'p5-js': 'p5js',
  'node-js': 'nodejs',
  node: 'nodejs',
  postgres: 'postgresql',
  twitter: 'x',
  'framer-motion': 'motion',
  'd3-js': 'd3',
  d3js: 'd3',
  'tailwind-css': 'tailwindcss',
  tailwind: 'tailwindcss',
  'github-action': 'github-actions',
  k8s: 'kubernetes',
  'google-cloud-bigquery': 'bigquery',
  'react-native-expo': 'expo',
};

const toolPatterns = [
  ['davinci-resolve', /\b(?:da[ -]?vinci(?: resolve)?|resolve studio)\b/i],
  ['premiere-pro', /\b(?:adobe )?premiere(?: pro)?\b/i],
  ['after-effects', /\b(?:adobe )?after effects\b|\bextendscript\b/i],
  ['ffmpeg', /\bffmpeg\b|\bffprobe\b/i],
  ['remotion', /\bremotion\b/i],
  ['hyperframes', /\bhyperframes\b/i],
  ['motion-canvas', /\bmotion canvas\b/i],
  ['lottie', /\blottie\b/i],
  ['threejs', /\bthree[. -]?js\b|\br3f\b|\breact three fiber\b/i],
  ['manim', /\bmanim(?:vox)?\b/i],
  ['final-cut-pro', /\bfinal cut(?: pro)?\b|\bfcpxml\b/i],
  ['capcut', /\bcapcut\b/i],
  ['aegisub', /\baegisub\b/i],
  ['blender', /\bblender\b/i],
  ['cinema-4d', /\b(?:cinema\s*4d|c4d)\b/i],
  ['unreal-engine', /\bunreal(?:\s+engine)?\b/i],
  ['audacity', /\baudacity\b/i],
  ['kdenlive', /\bkdenlive\b/i],
  ['figma', /\bfigma\b/i],
  ['canva', /\bcanva\b/i],
  ['inkscape', /\binkscape\b/i],
  ['sketch', /\bSketch\b(?=\s+(?:file|document|library|symbols?|app|macos))|\b(?:in|using|with)\s+Sketch\b|\.sketch\b|sketch-design|sketch-macos/],
  ['coreldraw', /\bcorel\s*draw\b/i],
  ['illustrator', /\b(?:adobe )?illustrator\b/i],
  ['photoshop', /\b(?:adobe )?photoshop\b/i],
  ['indesign', /\b(?:adobe )?indesign\b/i],
  ['affinity-designer', /\baffinity designer\b/i],
  ['linkedin', /\blinkedin\b/i],
  ['instagram', /\binstagram\b/i],
  ['x', /\b(?:twitter|x(?=\s+(?:post|thread|threads|autoposting)))\b|(?:instagram|tiktok|youtube)[^.\n]{0,30}\bX\b/i],
  ['reanimated', /\breanimated\b/i],
  ['drawio', /\bdraw\.?io\b/i],
  ['substack', /\bsubstack\b/i],
  ['youtube', /\byoutube\b/i],
  ['tiktok', /\btiktok\b/i],
  ['facebook', /\bfacebook\b/i],
  ['mailchimp', /\bmailchimp\b/i],
  ['wordpress', /\bwordpress\b/i],
  ['shopify', /\bshopify\b/i],
  ['google-docs', /\bgoogle docs\b/i],
  ['notion', /\bnotion\b/i],
  ['obsidian', /\bobsidian\b/i],
  ['knip', /\bknip\b/i],
  ['playwright', /\bplaywright\b/i],
  ['cypress', /\bcypress\b/i],
  ['puppeteer', /\bpuppeteer\b/i],
  ['vitest', /\bvitest\b/i],
  ['jest', /\bjest\b/i],
  ['pytest', /\bpytest\b/i],
  ['postgresql', /\bpostgres(?:ql)?\b/i],
  ['supabase', /\bsupabase\b/i],
  ['neon', /\bneon\b(?=\s+(?:auth|postgres|database|project))|@neon\//i],
  ['redis', /\bredis\b/i],
  ['qdrant', /\bqdrant\b/i],
  ['elasticsearch', /\belasticsearch\b/i],
  ['prisma', /\bprisma\b(?!.{0,40}(?:systematic[- ]review|meta[- ]analys))/i],
  ['drizzle', /\bdrizzle\b/i],
  ['duckdb', /\bduckdb\b/i],
  ['bigquery', /\bbigquery\b/i],
  ['dbt-core', /\bdbt[- ]core\b/i],
  ['dbt-cloud', /\bdbt[- ]cloud\b/i],
  ['dbt', /\bdbt\b/i],
  ['openapi', /\bopenapi\b|\bswagger\b/i],
  ['d3', /\bd3(?:\.js|js)?\b/i],
  ['terraform', /\bterraform\b|\bopentofu\b/i],
  ['helm', /\bhelm\b/i],
  ['github-actions', /\bgithub actions\b/i],
  ['bamboo-specs', /\bbamboo(?: specs)?\b/i],
  ['alteryx', /\balteryx\b/i],
  ['incopy', /\b(?:adobe )?incopy\b/i],
  ['vercel', /\bvercel\b/i],
  ['netlify', /\bnetlify\b/i],
  ['docker', /\bdocker(?:file)?\b/i],
  ['kubernetes', /\bkubernetes\b|\bk8s\b/i],
  ['p5js', /\bp5[. -]?js\b/i],
  ['motion', /\bframer[- ]?motion\b|\bmotion\.dev\b/i],
  ['gsap', /\bgsap\b/i],
  ['mermaid', /\bmermaid\b/i],
  ['linear', /\bLinear\b(?=\s+(?:ticket|issue|project|tracker|api|sdk|mcp))/],
  ['jira', /\bjira\b/i],
  ['github', /\b(?:github\s+(?:pr|pull|issue|repo|cli|notification|workflow|api|pages)|gh\s+cli)\b/i],
  ['husky', /\bhusky\b/i],
  ['lint-staged', /\blint-staged\b/i],
  ['chrome', /\bchrome(?: devtools)?\b/i],
  ['devtools', /\bdevtools\b/i],
  ['semgrep', /\bsemgrep\b/i],
  ['gitleaks', /\bgitleaks\b/i],
  ['git', /\bgit\b(?=\s+(?:worktrees?|hooks?|branches?|commits?|repo))|\busing-git-worktrees\b/i],
  ['swiftui', /\bswiftui\b/i],
  ['swift', /\bswift\b/i],
  ['flutter', /\bflutter\b/i],
  ['expo', /\bexpo\b/i],
  ['react-native', /\breact[- ]native\b/i],
  ['tanstack-query', /\btanstack[- ]query\b|\breact[- ]query\b/i],
  ['shadcn', /\bshadcn(?:\/ui)?\b/i],
  ['huggingface', /\bhugging\s*face\b|\bhf[- ]?(?:mem|hub)\b/i],
  ['nextjs', /\bnext[. -]?js\b/i],
  ['react', /\breact\b(?![- ]native)/i],
  ['vue', /\bvue(?:\.js)?\b/i],
  ['svelte', /\bsvelte(?:kit)?\b/i],
  ['angular', /\bangular\b/i],
  ['astro', /\bastro\b/i],
  ['tailwindcss', /\btailwind(?: css)?\b/i],
  ['typescript', /\btypescript\b/i],
  ['javascript', /\bjavascript\b/i],
  ['nodejs', /\bnode[. -]?js\b/i],
  ['python', /\bpython\b/i],
  ['rust', /\brust\b/i],
  ['go', /\bgolang\b|\bgo\.mod\b|\bGo\s+\d/],
  ['html', /\bhtml5?\b/i],
  ['css', /\bcss3?\b/i],
  ['mcp', /\bmcp\b|\bmodel context protocol\b/i],
  ['codex', /\bcodex\b(?=\s+skills?)/i],
  ['claude', /\bclaude\b(?=\s+(?:skills?|code))/i],
];

const formatPatterns = [
  ['plain-text', /\bplain[- ]text\b|\.txt\b/i],
  ['markdown', /\bmarkdown\b|\.md\b/i],
  ['mp4', /\bmp4\b/i],
  ['mov', /\.mov\b|\bquicktime\b/i],
  ['webm', /\bwebm\b/i],
  ['h264', /\bh[. -]?264\b/i],
  ['h265', /\bh[. -]?265\b|\bhevc\b/i],
  ['prores', /\bprores\b/i],
  ['aac', /\baac\b/i],
  ['wav', /\bwav\b/i],
  ['mp3', /\bmp3\b/i],
  ['flac', /\bflac\b/i],
  ['srt', /\bsrt\b|\bsubrip\b/i],
  ['vtt', /\bwebvtt\b|\bvtt\b/i],
  ['ass', /\.ass\b|\badvanced substation alpha\b/i],
  ['pdf', /\bpdf\b/i],
  ['docx', /\.docx\b|\bdocx\b/i],
  ['pptx', /\.pptx\b|\bpptx\b/i],
  ['xlsx', /\.xlsx\b|\bxlsx\b/i],
  ['png', /\bpng\b/i],
  ['jpg', /\bjpe?g\b/i],
  ['webp', /\.webp\b|\bwebp\b/i],
  ['svg', /\bsvg\b/i],
  ['gif', /\bgif\b/i],
  ['lottie-json', /\blottie json\b/i],
  ['html', /\bhtml\b/i],
  ['css', /\bcss\b/i],
  ['json', /\bjson\b/i],
  ['yaml', /\bya?ml\b/i],
  ['sql', /\bsql\b/i],
  ['csv', /\bcsv\b/i],
  ['tsx', /\.tsx\b|\btsx\b/i],
  ['jsx', /\.jsx\b|\bjsx\b/i],
  ['typescript', /\.ts\b|\btypescript\b/i],
  ['swift', /\.swift\b/i],
  ['prisma', /\.prisma\b|\bprisma schema\b/i],
  ['mermaid', /\bmermaid\b|\.mmd\b/i],
];

function canonicalTool(value) {
  const key = slug(value);
  if (!key) return '';
  if (toolAliases[key]) return toolAliases[key];
  const hit = toolPatterns.find(([id]) => id === key);
  if (hit) return hit[0];
  const matched = toolPatterns.find(([, pattern]) => pattern.test(String(value)));
  return matched ? matched[0] : key;
}

function canonicalFormat(value) {
  const key = slug(value);
  if (!key) return '';
  const aliases = { txt: 'plain-text', md: 'markdown', jpeg: 'jpg', yml: 'yaml' };
  if (aliases[key]) return aliases[key];
  if (formatPatterns.some(([id]) => id === key)) return key;
  const matched = formatPatterns.find(([, pattern]) => pattern.test(String(value)));
  return matched ? matched[0] : key;
}

// Ordered from specific capabilities to broader ones to preserve distinctness.
const deliverableRules = [
  ['memory-leak-debugging', /\b(?:memory leaks?|heap snapshots?|heap retainers?|leak isolation|out[- ]of[- ]memory|oom)\b/i],
  ['accessibility-audit', /\b(?:accessibility|a11y|wcag|screen[- ]readers?|keyboard (?:focus|navigation)|aria)\b/i],
  ['wireframe', /\bwirefram\w*\b/i],
  ['component-design', /\b(?:component composition|compound components?|component patterns?|component canvas|variant explorer|component library|react components?|react \d+ components?|ui[- ]library|sonner|toast library|wp[- ]block|gutenberg|adaptive[- ]layout)\b/i],
  ['design-system', /\b(?:design system|design tokens?|design\.md|theme factory|design language)\b/i],
  ['web-metadata', /\b(?:open graph|canonical url|seo metadata|meta tags?|social share preview)\b/i],
  ['react-transition', /\b(?:view transitions?|shared[- ]element animation|route transitions?)\b/i],
  ['browser-testing', /\b(?:browser (?:smoke )?test\w*|playwright|e2e[- ]test\w*|end-to-end[- ](?:tests?|testing|suite|verification)|webapp[- ]testing|devtools[- ]testing|cypress)\b/i],
  ['ui-animation', /\b(?:framer motion|micro[- ]?interactions?|gesture[- ]driven|ui animation|interface animations?|web animations?|screen transitions?|spring animation|spring physics|easing|reduced motion)\b/i],
  ['3d-scene', /\b(?:three[. -]?js|webgl|raycasting|3d scene|react three fiber)\b/i],
  ['generative-art', /\b(?:generative art|algorithmic art|flow fields?|p5[. -]?js|seeded sketch)\b/i],
  ['brand-identity', /\b(?:brand[- ]identity|brand[- ]guidelines?|brand[- ]style[- ]guide|brand[- ]colors?|brand[- ]styling|brand[- ]kit|brand[- ]context|wordmark|logo[- ]?systems?|logo[- ]?(?:design|creat\w*)|visual[- ]identity)\b/i],
  ['poster-design', /\b(?:poster|flyer|album cover|book cover|leaflet)\b/i],
  ['print-design', /\b(?:print[- ]ready|print (?:design|layout|artwork)|cmyk|risograph|indesign|affinity designer|coreldraw|static visual)\b/i],
  ['visual-mockup', /\b(?:image[- ]editing|mockup\w*|device[- ]fram\w*|inpainting|upscaling|background removal|quote card|knowledge card|xiaohongshu card|thumbnail|ai image|slack gif)\b/i],
  ['video-captions', /\b(?:(?:video|film|audio|srt|vtt|ass|burned?[- ]in)\s+subtitles?|subtitles?\s+(?:file|track|timing|sync|burn|generation|srt|vtt)|srt|webvtt|aegisub|\.ass|(?:video|closed|burned?[- ]in|auto)\s+captions?|caption timing|(?:video|retrieve)\s+transcripts?)\b/i],
  ['audio-cleanup', /\b(?:audio normalization|loudness|lufs|noise reduction|denoise|audio cleanup|de[- ]hum|fairlight)\b/i],
  ['color-grade', /\b(?:colou?r grad\w*|colou?r correct\w*|lut|white balance)\b/i],
  ['video-transcode', /\b(?:transcod\w*|stream[- ]copy|re[- ]encod\w*|mux(?:ing)?|h[. -]?264|h[. -]?265|prores)\b/i],
  ['video-edit', /\b(?:video[- ]edit\w*|video[- ]timeline|edit(?:ing)?[- ]timeline|footage|multicam|rough[- ]cut|b[- ]?roll|talking[- ]head|premiere|davinci[- ]resolve|final[- ]cut|ffmpeg|clip[- ]?finder|clipify|video[- ]moments?|vo[- ]timing)\b|视频剪辑|剪辑|口播/i],
  ['motion-video', /\b(?:motion[- ]graphic\w*|remotion|hyperframes|manim(?:vox)?|motion[- ]canvas|lottie|after[- ]effects|product[- ]reel|animated[- ]explainer|kinetic[- ]typograph\w*|storyboard\w*|paper[- ]cut[- ]style)\b|分镜/i],
  ['3d-cg-production', /\b(?:cinema\s*4d|maxon redshift|redshift render\w*|redshift shader\w*|unreal[- ]engine|path[- ]tracer|led[- ]box|cave[- ]rigs?)\b/i],
  ['linkedin-profile', /\blinkedin profile\b/i],
  ['linkedin-post', /\blinkedin (?:post|copy|writing|announcement)\b/i],
  ['x-thread', /\b(?:x thread|twitter thread|tweet thread|x post|twitter post)\b/i],
  ['instagram-copy', /\binstagram (?:caption|copy|post|reel)s?\b/i],
  ['newsletter', /\bnewsletter\b|\bsubstack\b/i],
  ['email-marketing', /\b(?:email[- ](?:sequence|marketing|warmup|deliverability|copy|campaign|list|lifecycle)|spf\/dkim\/dmarc)\b|用户分层|送达率|邮件/i],
  ['ad-creative', /\b(?:ad[- ]creative|video[- ]ad\w*|product[- ]ad\w*|ugc[- ]video|cartoon[- ]video|ad[- ]copy|ad[- ]angles?|headline variations|unique[- ]mechanism|awareness[- ]level|buyer[- ]objections?|offer[- ]extraction|campaign[- ]planning|thumbstopper|apple search ads|bid[- ]strategy)\b/i],
  ['brand-strategy', /\b(?:brand[- ](?:messaging|positioning|strategy|profile|voice|audit)|audience[- ]research|target[- ]audience|ideal customer profile|\bicp\b|content[- ]pillars|content[- ]calendar|content[- ]strategy|community[- ]management|crisis[- ]and[- ]moderation|marketing)\b/i],
  ['social-publishing', /\b(?:publish videos?|upload videos?|schedule posts?|content[- ]batch|social[- ]auto[- ]upload|social[- ]listening|promote[- ]app[- ]release)\b|视频发布/i],
  ['seo-optimization', /\b(?:seo\b|search[- ]visibility|ai[- ]search[- ]optimization|answer[- ]engines?|\bgeo\b|bing[- ]webmaster|broken[- ]links?)\b/i],
  ['internal-comms', /\b(?:internal comm(?:s|unications?)|stakeholder update|leadership update|incident report|company announcement)\b/i],
  ['cold-email', /\b(?:cold email|cold outreach|outbound email)\b/i],
  ['social-copy', /\b(?:social (?:copy|post|caption|content|media)|copywriting)\b/i],
  ['editorial-writing', /\b(?:editorial|blog post|essay|article|prose|human writer|writing guidelines|writing beats|writing shape|writing coach|reword|humaniz\w*|writing fragments|methodology[- ]explainer|value[- ]prop(?:osition)?)\b/i],
  ['document-processing', /\b(?:\.docx|docx|word documents?|pptx|powerpoint|presentation decks?|pitch[- ]deck|ai[- ]slides|slides?|spreadsheets?|\.xlsx|workbook|pdf (?:files?|documents?|forms?|manipulation|creation)|reading, creating, or reviewing pdf|icmje|irb protocol|ebook|offer[- ]toolkit)\b/i],
  ['dbt-testing', /\bdbt\b.{0,100}\btest\w*\b|\btest\w*\b.{0,100}\bdbt\b/i],
  ['dbt-troubleshooting', /\bdbt\b.{0,100}\b(?:fail\w*|troubleshoot\w*|debug\w*|error|logs?|migrat\w*)\b/i],
  ['dbt-modeling', /\bdbt\b.{0,100}\b(?:model\w*|analytics|incremental|snapshot)\b/i],
  ['prisma-setup', /\bprisma\b(?!.{0,40}(?:systematic[- ]review|meta[- ]analys))|\bprisma[- ](?:orm|schema|client)\b/i],
  ['openapi-spec', /\bopenapi\b|\bswagger\b|\bapi contract\b|\bapi[- ]designer\b/i],
  ['data-engineering', /\b(?:data[- ]engineering|lakehouse|delta[- ]lake|medallion|change[- ]data[- ]capture|\bcdc\b|etl|elt|incremental[- ]load\w*|data[- ]platform|airflow)\b/i],
  ['data-visualization', /\b(?:data visuali[sz]ation|scientific[- ]visuali[sz]ation|scientific[- ]figure|d3(?:\.js|js)?|dataviz|scatterplot|heatmap|conversion chart|bar graph|matplotlib|seaborn)\b/i],
  ['data-analysis', /\b(?:duckdb|parquet|data analysis|aggregate|sql query|analytics|dataset|csv)\b/i],
  ['database-schema', /\b(?:database schema|data model\w*|postgres(?:ql)?|supabase|neon|sql ddl|idempotency|schema migration)\b/i],
  ['adr', /\b(?:architecture decision|adr\b)\b/i],
  ['architecture-diagram', /\b(?:mermaid|c4 model|sequence diagram|architecture diagram|er diagram)\b/i],
  ['domain-modeling', /\b(?:domain model\w*|bounded contexts?|ubiquitous language)\b/i],
  ['architecture-design', /\b(?:system architecture|clean[- ]architecture|codebase design|architectural|module boundaries|application layer|dependency rule)\b/i],
  ['documentation', /\b(?:readme|documentation|api docs|release notes|changelog|co-authoring)\b/i],
  ['tdd', /\b(?:test[- ]driven|tdd|unit test\w*|vitest|jest|pytest|regression (?:coverage|test\w*|proof|suite|check\w*)|newman|junit|coverage gate)\b/i],
  ['code-review', /\b(?:code review|pull request review|pr review|review diff)\b/i],
  ['debugging', /\b(?:systematic debugging|diagnos(?:e|ing) bugs?|root cause|debugg(?:er|ing)|crash fix|csp[- ]investigation)\b/i],
  ['performance-optimization', /\b(?:performance optimization|profiling|latency|lcp|core web vitals|hotspots?)\b/i],
  ['rollback-runbook', /\b(?:rollback|runbook)\b/i],
  ['release-review', /\brelease (?:quality |process )?review\b/i],
  ['release-plan', /\b(?:release readiness|release plan|shipping|launch checklist|smoke checks?|migration plan|expand[- ]and[- ]contract|version bump)\b/i],
  ['deploy', /\b(?:deploy(?:ment|ing)?|vercel preview|netlify)\b/i],
  ['infrastructure-ops', /\b(?:kubernetes|helm|kustomize|terraform|opentofu|gitops|finops|disaster recovery|cloud[- ]cost|sre\b|devops|infrastructure[- ](?:as code|audit|ops|automation|deployment|migration|security|provisioning|setup|review)|upgrade[- ]review)\b/i],
  ['ci-cd', /\b(?:ci\/cd|ci[- ]pipeline|ci[- ]design|jenkins|kubesphere devops)\b/i],
  ['api-integration', /\b(?:http[- ]request|rest[- ]api|webhook|dai[- ]sdk|mobile[- ]ads[- ]sdk|jwt[- ]bearer|api integration|wx[- ]cli|post \/[a-z]|kapso|whatsapp|open api)\b|网络请求/i],
  ['git-worktree', /\bgit worktree\w*\b/i],
  ['pre-commit', /\bpre[- ]commit\b|\bhusky\b|\blint-staged\b/i],
  ['observability', /\b(?:observability|telemetry|distributed trac\w*|structured logging|instrumentation)\b/i],
  ['container-build', /\b(?:docker(?:file)?|multi-stage build|container image)\b/i],
  ['security-audit', /\b(?:security[- ](?:audit|review|hardening|headers?)|auth[- ]session|access[- ]audit|claude[- ]settings[- ]audit|redis[- ]security|owasp|threat[- ]model\w*|semgrep|gitleaks|vulnerability|devsecops|dependency[- ]audit|sbom|secret[- ]scan\w*|secscan|pre[- ]flight scan)\b/i],
  ['dead-code', /\b(?:dead code|unused exports|knip|deletion-first)\b/i],
  ['ai-agent-workflow', /\b(?:ai[- ]agent|llm[- ]agent|agent[- ]testing|rag\b|vector[- ]db|qdrant|gpu memory|llama\.cpp|gguf|multi[- ]agent|subagent|agent[- ]handoff|mcp proxy|agent[- ]playbooks?|orchestrator|venice|text[- ]routing|discover[- ]azure[- ]skills|handoff)\b/i],
  ['mcp-server', /\bmcp server\b|\bmodel context protocol\b/i],
  ['skill-authoring', /\b(?:(?:create|authoring)\s+(?:a |new )?(?:agent )?skills?|writing\s+(?:agent\s+|claude\s+|codex\s+)?skills?|skill[- ]creator|add-new-\w*-skill|find-skills|skills? catalog|skill\.md (?:format|spec|standard|authoring))\b/i],
  ['research-synthesis', /\b(?:systematic[- ]review|meta[- ]analys|literature[- ]review|competitor[- ]analysis|competitors?|battlecards?|market[- ](?:research|movers|pulse)|research[- ]report|hot[- ]monitor|hotspot|content[- ]radar|lead[- ]list|lead[- ]scraping|lead[- ]sourcing|app store intelligence|source[- ]driven)\b/i],
  ['product-planning', /\b(?:okr\b|product[- ]roadmap|job[- ]stories|prioritization[- ]frameworks?|sprint[- ]plan\w*|retrospective|stakeholder[- ]map|summarize[- ]meeting|sred|pre[- ]mortem|steel[- ]manning|epic[- ]hypothesis|launch[- ]metrics|add-task|go\/no-go|eol[- ]readiness|retiring a product|product[- ]brief|competitor[- ]matrix)\b/i],
  ['mobile-app', /\b(?:flutter|react native|expo|swiftui|mobile app|ios app|android app|write[- ]swift|drift\/sqlite|on-device|persistence-drift)\b/i],
  ['web-redesign', /\b(?:web redesign|redesign|restyle|refactor(?:ing)? ui|improve ui|dashboard redesign|anti-?slop|visual[- ]fidelity)\b|视觉还原/i],
  ['web-design', /\b(?:frontend design|web design|landing page|portfolio site|web ui|web page|hi-fi design|ui design|new angular app|angular app|html docs|design language|information architecture|plan pages, navigation)\b/i],
  ['planning', /\b(?:implementation plan|brainstorm\w*|specification|to-spec|to-tickets|task breakdown|openspec|scraper[- ]brief|grill me|loop[- ]me)\b/i],
];

const deliverableEquivalence = {
  'poster-design': ['print-design', 'poster-design'],
  'print-design': ['print-design', 'poster-design'],
  'linkedin-post': ['linkedin-post', 'social-copy'],
  'x-thread': ['x-thread', 'social-copy'],
  'instagram-copy': ['instagram-copy', 'social-copy'],
  'video-transcode': ['video-edit', 'video-transcode'],
  'video-captions': ['video-captions', 'video-edit'],
  'audio-cleanup': ['audio-cleanup', 'video-edit'],
  'color-grade': ['color-grade', 'video-edit'],
  'rollback-runbook': ['rollback-runbook', 'release-plan'],
  'release-review': ['release-review', 'release-plan'],
  'dbt-troubleshooting': ['dbt-troubleshooting', 'dbt-modeling'],
  'web-redesign': ['web-redesign', 'web-design'],
  'web-design': ['web-design', 'web-redesign'],
  tdd: ['tdd', 'testing'],
  testing: ['tdd', 'testing'],
};

const canonicalDeliverableSet = new Set(deliverableRules.map(([id]) => id).concat(['testing', 'feature']));

function normalizeDeliverable(value) {
  const key = slug(value);
  if (!key) return '';
  const aliases = {
    'static-graphic': 'print-design',
    'brand-guide': 'brand-identity',
    'design-system-doc': 'design-system',
    'ui-design': 'web-design',
    'web-site': 'web-design',
    'ui-review': 'accessibility-audit',
    'browser-tests': 'browser-testing',
    'video-export': 'video-edit',
    captions: 'video-captions',
    'dbt-tests': 'dbt-testing',
    'dbt-model': 'dbt-modeling',
    api: 'database-schema',
    'implementation-plan': 'planning',
    'release-plan': 'release-plan',
    article: 'editorial-writing',
    debug: 'debugging',
    tests: 'tdd',
    performance: 'performance-optimization',
    architecture: 'architecture-design',
    'video-editor-project': 'video-edit',
  };
  if (aliases[key]) return aliases[key];
  if (canonicalDeliverableSet.has(key)) return key;
  const hit = deliverableRules.find(([, pattern]) => pattern.test(String(value)));
  return hit ? hit[0] : key;
}

const curatedIdDeliverables = {
  'engineering-ops/systematic-debugging': ['debugging'],
  'engineering-ops/anthropic-debug': ['debugging'],
  'engineering-ops/diagnosing-bugs': ['debugging'],
  'engineering-ops/debugging-and-error-recovery': ['debugging'],
  'engineering-ops/memory-leak-debugging': ['memory-leak-debugging'],
  'engineering-ops/code-review-and-quality': ['code-review'],
  'engineering-ops/code-review': ['code-review'],
  'engineering-ops/anthropic-code-review': ['code-review'],
  'engineering-ops/review': ['code-review'],
  'engineering-ops/review-agent': ['code-review'],
  'engineering-ops/review-bugbot': ['code-review'],
  'engineering-ops/test-driven-development': ['tdd', 'testing'],
  'engineering-ops/tdd': ['tdd', 'testing'],
  'engineering-ops/durable-test-collateral': ['tdd', 'testing'],
  'engineering-ops/performance-optimization': ['performance-optimization'],
  'engineering-ops/shipping-and-launch': ['release-plan'],
  'engineering-ops/finishing-a-development-branch': ['release-plan'],
  'engineering-ops/verification-before-completion': ['tdd', 'release-review'],
  'engineering-ops/using-git-worktrees': ['git-worktree'],
  'engineering-ops/setup-pre-commit': ['pre-commit'],
  'engineering-ops/observability-and-instrumentation': ['observability'],
  'engineering-ops/deprecation-and-migration': ['release-plan'],
  'architecture/documentation-and-adrs': ['documentation', 'adr'],
  'architecture/codebase-design': ['architecture-design', 'architecture-diagram'],
  'architecture/domain-modeling': ['domain-modeling', 'database-schema'],
  'architecture/api-and-interface-design': ['openapi-spec', 'database-schema'],
  'architecture/improve-codebase-architecture': ['architecture-design'],
  'mobile/flutter-architecture': ['mobile-app'],
  'mobile/react-native-skills': ['mobile-app'],
  'mobile/mobile-native': ['mobile-app'],
  'mobile/write-swift': ['mobile-app'],
  'mobile/animate-expo': ['mobile-app', 'ui-animation'],
  'frontend/frontend-design': ['web-design', 'web-redesign'],
  'frontend/frontend-ui-engineering': ['web-design', 'web-redesign'],
  'frontend/web-artifacts-builder': ['web-design'],
  'frontend/composition-patterns': ['component-design'],
  'frontend/vercel-react-best-practices': ['component-design'],
  'frontend/web-design-guidelines': ['accessibility-audit', 'web-design'],
  'frontend/fixing-metadata': ['web-metadata'],
  'frontend/react-view-transitions': ['react-transition'],
  'frontend/debug-optimize-lcp': ['performance-optimization'],
  'frontend/threejs-fundamentals': ['3d-scene'],
  'frontend/threejs-interaction': ['3d-scene'],
  'frontend/dataviz': ['data-visualization'],
  'frontend/deploy-with-vercel': ['deploy'],
  'ui-ux/impeccable': ['web-design', 'web-redesign'],
  'ui-ux/hi-fi-design': ['web-design'],
  'ui-ux/improve-ui': ['web-redesign'],
  'ui-ux/baseline-ui': ['web-redesign'],
  'ui-ux/fixing-accessibility': ['accessibility-audit'],
  'ui-ux/wireframe': ['wireframe'],
  'ui-ux/canvas-design': ['print-design', 'poster-design'],
  'ui-ux/brand-guidelines': ['brand-identity'],
  'ui-ux/anthropic-design': ['brand-identity', 'web-design'],
  'ui-ux/create-design-md': ['design-system'],
  'ui-ux/component-canvas': ['component-design'],
  'ui-ux/framer-motion-animator': ['ui-animation'],
  'ui-ux/animate': ['ui-animation'],
  'ui-ux/improve-animations': ['ui-animation'],
  'ui-ux/review-animations': ['ui-animation'],
  'ui-ux/gestures': ['ui-animation'],
  'automations/webapp-testing': ['browser-testing'],
  'automations/browser-testing-with-devtools': ['browser-testing'],
  'automations/a11y-debugging': ['accessibility-audit'],
  'automations/chrome-devtools': ['browser-testing'],
  'media/algorithmic-art': ['generative-art'],
  'media/hyperframes': ['motion-video'],
  'media/motion-reel': ['motion-video'],
  'social-media/writing-shape': ['newsletter'],
  'social-media/writing-beats': ['social-copy'],
  'social-media/writing-guidelines': ['editorial-writing'],
  'social-media/human-writer': ['editorial-writing'],
  'social-media/anthropic-docs': ['documentation'],
  'social-media/internal-comms': ['internal-comms'],
  'social-media/linkedin-profile-optimizer': ['linkedin-profile'],
  'scraping-leads/cold-email': ['cold-email'],
  'backend-api/supabase-postgres-best-practices': ['database-schema'],
  'backend-api/neon-postgres': ['database-schema'],
  'backend-api/dbt-unit-testing': ['dbt-testing'],
  'backend-api/dbt-job-troubleshooting': ['dbt-troubleshooting'],
  'backend-api/dbt-analytics-engineering': ['dbt-modeling'],
  'backend-api/prisma-orm-setup': ['prisma-setup'],
  'backend-api/prisma-client-api': ['prisma-setup'],
  'backend-api/mcp-builder': ['mcp-server'],
  'security-bug-bounty/security-and-hardening': ['security-audit'],
  'security-bug-bounty/review-security': ['security-audit'],
  'security-bug-bounty/anthropic-security-review': ['security-audit'],
  'agent-tooling/writing-skills': ['skill-authoring'],
  'agent-tooling/skill-creator': ['skill-authoring'],
  'planning/writing-plans': ['planning'],
  'planning/brainstorming': ['planning'],
  'planning/to-spec': ['planning'],
  'planning/spec-driven-development': ['planning'],
};

const stagePatterns = [
  ['test', /\b(?:test(?:ing|s)?|test[- ]cases?|validat\w*|verif(?:y|ication)|evaluat\w*|tdd|vitest|pytest|playwright|bdd)\b|测试|验证/i],
  ['review', /\b(?:audit\w*|review\w*|triage|diagnos(?:e|is|ing)|inspect\w*|analy[sz]\w*|assess\w*|leak isolation|root cause)\b|评审|审核|检查/i],
  ['release', /\b(?:deploy(?:ment)?|publish\w*|release|rollout|rollback|ship(?:ping)?)\b|发布|部署/i],
  ['plan', /\b(?:plan(?:ning)?|spec(?:ification)?|adr\b|domain model|scope|wirefram\w*|worktree|calendar|pillars?|strategy|roadmap|okr|storyboard\w*)\b|规划|分镜|排期/i],
  ['design', /\b(?:design\w*|architect(?:ure)?|styl\w*|brand(?:ing)?|poster|flyer|typography|color|illustrat\w*|layout|visual|chart|diagrams?|logo|mockup\w*)\b|设计|视觉/i],
  ['build', /\b(?:build\w*|implement\w*|creat\w*|configur\w*|setup|writ\w*|draft\w*|transcod\w*|edit\w*|render\w*|animat\w*|convert\w*|generat\w*)\b|撰写|生成|制作|剪辑/i],
];

const domainRules = [
  ['security-bug-bounty', /\b(?:security[- ](?:audit|review|hardening|scanner|guidance|model|settings|headers?)|owasp|threat[- ]model\w*|vulnerability|secret[- ]scan\w*|secscan|semgrep|gitleaks|pentest|devsecops|sbom|dependency[- ]audit|cve|appsec|bug[- ]bounty|redis[- ]security|tls\b|acl\b)\b/i],
  ['automations', /\b(?:playwright|puppeteer|browser testing|chrome devtools|a11y|accessibility debugging|scraping|web[- ]crawl\w*)\b/i],
  ['agent-tooling', /\b(?:skill\.md|agent[- ]skills?|subagent|claude[- ]code[- ]hooks?|mcp[- ]server|skills[- ]cli|prompt[- ]engineering|agent[- ]testing|ai[- ]agent|rag\b|vector[- ]db|qdrant|gguf|llama\.cpp|venice)\b/i],
  ['ui-ux', /\b(?:design[- ]system|design[- ]tokens?|accessibility|wcag|typography|wirefram\w*|poster|flyer|brand[- ]guidelines?|brand[- ]colors?|brand[- ]identity|brand[- ]kit|ui[- ]design|framer[- ]motion|interface[- ]animations?|easing|reduced[- ]motion|animation|mockup\w*|device[- ]fram\w*|image[- ]editing|visual[- ]design|design[- ]language|theme[- ]factory|styling artifacts|anti-?slop|creative[- ]director|ux)\b/i],
  ['frontend', /\b(?:react|next\.?js|angular|frontend|css|html|three\.?js|d3|view transitions|lcp|core web vitals|web[- ]performance|web[- ]app|portfolio|tanstack|shadcn|visual[- ]fidelity)\b|视觉还原/i],
  ['mobile', /\b(?:flutter|react[- ]native|expo|swiftui|swift(?:\s*\d)?|ios[- ]app|android[- ]app|mobile[- ]app|mobile[- ]ads|persistence-drift)\b/i],
  ['media', /\b(?:ffmpeg|davinci[- ]resolve|premiere|after[- ]effects|remotion|hyperframes|manim(?:vox)?|motion[- ]canvas|lottie|subtitles?|srt|audio|color[- ]grad\w*|generative[- ]art|p5\.?js|talking[- ]head|storyboard\w*|youtube|tiktok|cinema\s*4d|unreal[- ]engine|blender|clipify|ima[- ]dai|video[- ](?:edit|ad|upload|clip|moments?|cut|export|transcod)\w*)\b|口播|分镜|视频/i],
  ['social-media', /\b(?:newsletter|linkedin|instagram|twitter|x[- ]thread|copywriting|editorial|blog[- ]post|internal[- ]comms|documentation|readme|social[- ]media|content[- ]calendar|content[- ]pillars|content[- ]strategy|audience[- ]research|substack|brand[- ]messaging|brand[- ]positioning|brand[- ]audit|email[- ](?:sequence|marketing|warmup|deliverability|copy|lifecycle)|writing[- ]coach|ad[- ]copy|headlines?|campaign|wordpress|pitch[- ]deck|value[- ]prop(?:osition)?)\b|邮件|小红书/i],
  ['scraping-leads', /\b(?:cold[- ]email|cold[- ]outreach|sales|lead[- ]gen\w*|lead[- ]list|lead[- ]scraping|lead[- ]sourcing|seo\b|geo\b|aeo\b|search[- ]visibility|conversion[- ]funnel|webmaster|competitor[- ]analysis|bid[- ]strategy)\b/i],
  ['backend-api', /\b(?:postgres(?:ql)?|sql|supabase|neon|prisma(?!.{0,40}systematic[- ]review)|drizzle|dbt|duckdb|bigquery|openapi|swagger|database|schema|rest[- ]api|graphql|redis(?!\s+security)|data[- ]engineering|lakehouse|delta[- ]lake|medallion|etl|elt|kafka|http[- ]request|airflow|zod)\b|网络请求/i],
  ['architecture', /\b(?:architecture|adr\b|domain[- ]model\w*|bounded[- ]context\w*|mermaid|c4[- ]model|codebase[- ]design|system[- ]design|monorepo|dependency rule)\b/i],
  ['planning', /\b(?:implementation[- ]plan|spec[- ]driven|brainstorm\w*|prd\b|vertical[- ]slice|okr\b|sprint[- ]plan\w*|roadmap|job[- ]stories|prioritization|retrospective|epic[- ]hypothesis|launch[- ]metrics|add-task|openspec|eol[- ]readiness|go\/no-go|product[- ]manager|competitor[- ]matrix|product[- ]brief)\b/i],
  ['orchestrator', /\b(?:orchestrat\w*|model[- ]council|grill[- ]me|parallel[- ]agent|context[- ]engineering|foreman|handoff|interview[- ]me)\b/i],
  ['engineering-ops', /\b(?:debug\w*|tdd|unit[- ]test\w*|code[- ]review|pull[- ]request|performance|memory[- ]leak|pre[- ]commit|git[- ]worktree|release|deploy|docker|kubernetes|terraform|helm|gitops|finops|sre\b|observability|telemetry|knip|dead[- ]code|ci\/cd|ci[- ]pipeline|ci[- ]design|kubesphere|systematic[- ]review)\b/i],
];

const gatToSkillKitDomain = {
  coding: ['engineering-ops', 'architecture', 'planning', 'mobile', 'agent-tooling'],
  ui: ['frontend', 'ui-ux', 'automations'],
  graphic: ['ui-ux', 'media'],
  video: ['media'],
  motion: ['media', 'ui-ux', 'frontend'],
  writing: ['social-media', 'scraping-leads', 'architecture'],
  data: ['backend-api', 'architecture', 'frontend'],
  devops: ['engineering-ops', 'frontend', 'security-bug-bounty'],
};

function extractTools(text) {
  const value = String(text || '');
  return unique(toolPatterns.filter(([, pattern]) => pattern.test(value)).map(([id]) => id));
}

function extractFormats(text) {
  const value = String(text || '');
  return unique(formatPatterns.filter(([, pattern]) => pattern.test(value)).map(([id]) => id));
}

function extractDeliverables(text) {
  const value = String(text || '');
  return unique(deliverableRules.filter(([, pattern]) => pattern.test(value)).map(([id]) => id));
}

function earliestStage(text) {
  const value = String(text || '');
  let best = null;
  let bestIdx = Infinity;
  for (const [stage, pattern] of stagePatterns) {
    const m = pattern.exec(value);
    if (m && m.index < bestIdx) {
      bestIdx = m.index;
      best = stage;
    }
  }
  return best;
}

function extractStage(text, primaryText = '') {
  const sample = String(primaryText || text || '');
  // If the primary clause explicitly targets tests or visual/diagram/architecture design objects, classify by intent even when led by create/generate/write.
  if (/\b(?:e2e tests?|unit tests?|test[- ]cases?|bdd tests?|playwright.*tests?|write.*tests?|generate.*tests?)\b/i.test(sample)) return 'test';
  if (/\b(?:create|build|generate|define)\s+(?:a\s+)?(?:brand[- ]identity|color[- ]palette|diagrams?|architecture diagrams?|visual[- ]direction|design[- ]system)\b/i.test(sample)) return 'design';
  const primaryHit = earliestStage(primaryText);
  if (primaryHit) return primaryHit;
  return earliestStage(text) || 'build';
}

function extractDomain(text, bodyText = '') {
  const header = String(text || '');
  const body = String(bodyText || '');
  let best = null;
  let bestScore = 0;
  for (const [domain, pattern] of domainRules) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    const headerHits = (header.match(re) || []).length;
    if (headerHits > bestScore) {
      bestScore = headerHits;
      best = domain;
    }
  }
  if (best) return best;
  if (body) {
    for (const [domain, pattern] of domainRules) {
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      const bodyHits = (body.match(re) || []).length;
      if (bodyHits > bestScore) {
        bestScore = bodyHits;
        best = domain;
      }
    }
  }
  return best || 'engineering-ops';
}

function stripFrontmatter(body) {
  return String(body || '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function extractTags({ title = '', description = '', body = '', slug: entrySlug = '', deliverables = [], tools = [], formats = [], domain = null, stage = null } = {}) {
  const headerText = [entrySlug.replace(/-/g, ' '), title, description].filter(Boolean).join(' ');
  const bodySnippet = stripFrontmatter(body).slice(0, 450);
  const fullText = [headerText, bodySnippet].filter(Boolean).join(' ');
  const normTools = unique([...tools.map(canonicalTool), ...extractTools(headerText)]);
  const normFormats = unique([...formats.map(canonicalFormat), ...extractFormats(headerText)]);
  const inferredDelivs = extractDeliverables(headerText);
  const fallbackDelivs = inferredDelivs.length ? inferredDelivs : extractDeliverables(fullText).slice(0, 2);
  const normDelivs = unique([...deliverables.map(normalizeDeliverable), ...fallbackDelivs]);
  const descFirst = String(description || '').split(/[.。!?]/)[0].trim();
  const primaryStageText = descFirst || [title, entrySlug.replace(/-/g, ' ')].filter(Boolean).join(' ');
  const inferredStage = stage || extractStage(headerText, primaryStageText);
  const inferredDomain = domain || extractDomain(headerText, bodySnippet);
  return {
    domain: inferredDomain,
    stage: inferredStage,
    deliverables: normDelivs,
    tools: normTools,
    formats: normFormats,
  };
}

function expandEquivalentDeliverables(items) {
  const out = new Set();
  for (const raw of items) {
    const norm = normalizeDeliverable(raw);
    if (!norm) continue;
    out.add(norm);
    for (const eq of deliverableEquivalence[norm] || []) out.add(eq);
  }
  return out;
}

function deriveGoldDeliverables(group, test, catalog) {
  const labelAndTerms = [group?.label, ...(group?.terms || [])].filter(Boolean).join(' ');
  const directFromLabel = extractDeliverables(labelAndTerms);
  const atIds = (group?.ids || []).filter((id) => id.startsWith('@')).map((id) => id.slice(1).replace(/-/g, ' '));
  const fromAtIds = extractDeliverables(atIds.join(' '));
  const specific = unique([...directFromLabel, ...fromAtIds]);
  if (specific.length) return expandEquivalentDeliverables(specific);

  const fromCurated = [];
  for (const id of group?.ids || []) {
    if (curatedIdDeliverables[id]) fromCurated.push(...curatedIdDeliverables[id]);
    const meta = catalog?.get(id);
    if (meta?.deliverables?.length) fromCurated.push(...meta.deliverables.map(normalizeDeliverable));
    if (!curatedIdDeliverables[id] && !id.startsWith('@')) {
      fromCurated.push(...extractDeliverables(id.replace(/[/-]/g, ' ')));
    }
  }
  if (fromCurated.length) return expandEquivalentDeliverables(fromCurated);

  // Fallback only for exact bare tool resource IDs in group.ids (e.g. 'ffmpeg', 'duckdb', 'knip', 'prisma', 'dbt').
  const bare = (group?.ids || []).filter((id) => !id.includes('/')).map((id) => id.replace(/^@/, ''));
  const fromBare = extractDeliverables(bare.join(' '));
  if (fromBare.length) return expandEquivalentDeliverables(fromBare);

  return new Set();
}

const genericLanguages = new Set(['html', 'css', 'javascript', 'typescript', 'python', 'nodejs', 'codex', 'claude', 'go', 'rust']);

function deriveGoldTools(group, test) {
  const required = (test?.constraints?.requiredTools || []).map(canonicalTool);
  const labelText = [
    group?.label,
    ...(group?.ids || []).filter((id) => id.startsWith('@') || !id.includes('/')).map((id) => id.replace(/^@/, '').replace(/-/g, ' ')),
  ].join(' ');
  const inferred = extractTools(labelText).filter((tool) => !genericLanguages.has(tool));
  return unique([...required, ...inferred]);
}

function atlasSatisfiesClass(item, group, test, catalog, accessVerified) {
  const meta = item?.meta;
  if (!meta || meta.type !== 'skill' || !item.id?.startsWith('federated/') || meta.duplicateOf) return false;
  if (accessVerified && !accessVerified(item)) return false;
  if (group?.checks) {
    const checkRe = new RegExp(group.checks.join('|'), 'i');
    if (!checkRe.test(item.checks || '')) return false;
  }

  const skillDelivs = expandEquivalentDeliverables(meta.deliverables || []);
  if (!skillDelivs.size) return false;

  const goldDelivs = deriveGoldDeliverables(group, test, catalog);
  if (!goldDelivs.size) return false;
  const deliverableMatch = [...skillDelivs].some((d) => goldDelivs.has(d));
  if (!deliverableMatch) return false;

  const skillTools = new Set((meta.tools || []).map(canonicalTool));
  const skillFormats = new Set((meta.formats || []).map(canonicalFormat));
  const requiredTools = deriveGoldTools(group, test);
  const formatLanguages = new Set(['css', 'html', 'sql', 'typescript', 'swift']);
  for (const req of requiredTools) {
    const hasTool = skillTools.has(req) || (formatLanguages.has(req) && skillFormats.has(req));
    if (!hasTool) return false;
  }

  const excludeMarkers = (test?.constraints?.excludeMarkers || []).map((m) => String(m).toLowerCase());
  if (excludeMarkers.length) {
    const tokens = [...skillTools, ...skillDelivs, ...(meta.formats || []).map(canonicalFormat)];
    if (tokens.some((tok) => excludeMarkers.some((m) => tok.includes(m.replace(/\s+/g, '-')) || tok.replace(/-/g, ' ').includes(m)))) {
      return false;
    }
  }

  return true;
}

module.exports = {
  atlasSatisfiesClass,
  canonicalDeliverableSet,
  canonicalFormat,
  canonicalTool,
  curatedIdDeliverables,
  deliverableEquivalence,
  deriveGoldDeliverables,
  deriveGoldTools,
  extractDeliverables,
  extractDomain,
  extractFormats,
  extractStage,
  extractTags,
  extractTools,
  gatToSkillKitDomain,
  normalizeDeliverable,
};
