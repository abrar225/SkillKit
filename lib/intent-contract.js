'use strict';

const { intentSchema: legacyIntent, workflowIds } = require('./task-router');
const { specialistForms } = require('./specialist-capabilities');

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
  ['react-three-fiber', /\breact[- ]?three[- ]?fiber\b|\br3f\b/i], ['drei', /@react-three\/drei|\bdrei\b/i],
  ['lenis', /\blenis\b/i], ['roughjs', /\brough[. -]?js\b/i],
  ['zod', /\bzod\b/i], ['redis', /\bredis\b/i], ['biome', /\bbiome\b/i],
  ['eslint', /\beslint\b/i], ['prettier', /\bprettier\b/i], ['vite', /\bvite\b/i],
  ['postman', /\bpostman\b/i], ['hoppscotch', /\bhoppscotch\b/i],
  ['temporal', /\btemporal(?:\.io|\s+workflows?)?\b/i], ['inngest', /\binngest\b/i], ['trigger-dev', /\btrigger\.dev\b/i],
  ['n8n', /\bn8n\b/i], ['puppeteer', /\bpuppeteer\b/i], ['firecrawl', /\bfirecrawl\b/i],
  ['crawl4ai', /\bcrawl4ai\b/i], ['scrapy', /\bscrapy\b/i],
  ['vulture', /\bvulture\b/i], ['deptry', /\bdeptry\b/i], ['ts-prune', /\bts-prune\b/i],
  ['excalidraw', /\bexcalidraw\b/i], ['trufflehog', /\btrufflehog\b/i], ['osv-scanner', /\bosv[- ]scanner\b/i],
  ['snyk', /\bsnyk\b/i], ['dependabot', /\bdependabot\b/i], ['codeql', /\bcodeql\b/i],
  ['owasp-top-10', /\bowasp\s+top\s+(?:ten|10)\b/i],
  ['lucide', /\blucide\b/i], ['phosphor-icons', /\bphosphor(?:\s+icons?)?\b/i], ['heroicons', /\bheroicons\b/i],
  ['google-fonts', /\bgoogle\s+fonts?\b/i], ['fontshare', /\bfontshare\b/i],
  ['coolors', /\bcoolors\b/i], ['realtime-colors', /\brealtime\s+colors\b/i],
  ['radix-ui', /\bradix(?:[- ]ui)?\b/i], ['aceternity-ui', /\baceternity(?:[- ]ui)?\b/i], ['magic-ui', /\bmagic[- ]?ui\b/i],
  ['final-cut-pro', /\bfinal cut(?: pro)?\b/i], ['capcut', /\bcapcut\b/i],
  ['blender', /\bblender\b/i], ['audacity', /\baudacity\b/i], ['kdenlive', /\bkdenlive\b/i],
  ['figma', /\bfigma\b/i], ['canva', /\bcanva\b/i], ['inkscape', /\binkscape\b/i],
  ['sketch', /\bSketch\b(?=\s+(?:design\s+)?(?:file|document|library|symbols?|app|artboards?|ui|interface|macos)|[.,;!?]|$)|\b(?:in|using|with|for|from) Sketch\b|\bsketch\s+(?:file|document|library|symbols?|app|artboards?)\b/i],
  ['coreldraw', /\bcorel\s*draw\b/i], ['bamboo-specs', /\bbamboo(?:\s+specs)?\b/i],
  ['alteryx', /\balteryx(?:\s+designer)?\b/i], ['incopy', /\b(?:adobe\s+)?incopy\b/i],
  ['aegisub', /\baegisub\b/i], ['d3', /\bd3(?:\.js|js)?\b/i],
  ['motion', /\bframer[- ]?motion\b|\bmotion\.dev\b/i], ['gsap', /\bgsap\b/i],
  ['cinema-4d', /\b(?:cinema\s*4d|c4d)\b/i], ['reanimated', /\breanimated\b/i],
  ['illustrator', /\b(?:adobe )?illustrator\b/i], ['photoshop', /\b(?:adobe )?photoshop\b/i],
  ['indesign', /\b(?:adobe )?indesign\b/i], ['affinity-designer', /\baffinity designer\b/i],
  ['linkedin', /\blinkedin\b/i], ['instagram', /\binstagram\b/i],
  ['x', /\b(?:twitter|x(?=\s+(?:post|thread)))\b|\b(?:for|on)\s+X(?=\s|[.,;!?]|$)/], ['substack', /\bsubstack\b/i],
  ['mailchimp', /\bmailchimp\b/i], ['wordpress', /\bwordpress\b/i],
  ['google-docs', /\bgoogle docs\b/i], ['obsidian', /\bobsidian\b/i],
  ['knip', /\bknip\b/i], ['playwright', /\bplaywright\b/i], ['cypress', /\bcypress\b/i],
  ['vitest', /\bvitest\b/i], ['jest', /\bjest\b/i], ['pytest', /\bpytest\b/i],
  ['postgresql', /\bpostgres(?:ql)?\b/i], ['supabase', /\bsupabase\b/i],
  ['prisma', /\bprisma\b(?!.{0,40}(?:systematic[- ]review|meta[- ]analys))/i], ['drizzle', /\bdrizzle\b/i],
  ['duckdb', /\bduckdb\b/i], ['bigquery', /\bbigquery\b/i], ['openapi', /\bopenapi\b|\bswagger\b/i],
  ['dbt-core', /\bdbt core\b/i], ['dbt', /\bdbt\b(?!\s+core)/i],
  ['terraform', /\bterraform\b|\bopentofu\b/i], ['github-actions', /\bgithub actions\b/i],
  ['vercel', /\bvercel\b/i], ['netlify', /\bnetlify\b/i],
  ['docker', /\bdocker(?:file)?\b/i], ['kubernetes', /\bkubernetes\b|\bk8s\b/i],
  ['p5js', /\bp5[. -]?js\b/i], ['shadcn', /\bshadcn(?:\/ui)?\b/i],
  ['mermaid', /\bmermaid\b/i], ['linear', /\bLinear (?:ticket|issue|project|tracker)s?\b/],
  ['jira', /\bjira\b/i], ['husky', /\bhusky\b/i], ['lint-staged', /\blint-staged\b/i],
  ['chrome', /\bchrome\b/i], ['devtools', /\bdevtools\b/i], ['semgrep', /\bsemgrep\b/i],
  ['gitleaks', /\bgitleaks\b/i], ['neon', /\bneon\b(?=\s+(?:auth|postgres|database|project))|@neon\//i],
  ['git', /\bgit\b(?=\s+worktrees?\b)/i], ['swiftui', /\bswiftui\b/i],
  ['codex', /\bcodex\b(?=\s+skills?\b)/i], ['claude', /\bclaude\b(?=\s+skills?\b)/i],
  ['dbt-cloud', /\bdbt cloud\b/i], ['helm', /\bhelm\b(?:\s+charts?)?/i],
  ['tableau', /\btableau\b/i], ['power-bi', /\bpower\s*bi\b/i], ['looker', /\blooker\b/i],
  ['gimp', /\bgimp\b/i], ['krita', /\bkrita\b/i], ['webflow', /\bwebflow\b/i],
  ['framer', /\bframer\b(?!(?:[- ]?motion|[- ]?inspired|[- ]?style|[- ]?like|['’]s aesthetic))/i], ['rive', /\brive\b/i], ['spline', /\bspline\b/i],
  ['jenkins', /\bjenkins\b/i], ['ansible', /\bansible\b/i], ['pulumi', /\bpulumi\b/i],
  ['gitlab-ci', /\bgitlab\s+ci\b/i], ['circleci', /\bcircle\s*ci\b/i],
  ['airflow', /\b(?:apache\s+)?airflow\b/i], ['prefect', /\bprefect\b/i], ['dagster', /\bdagster\b/i],
  ['procreate', /\bprocreate\b/i], ['pixelmator', /\bpixelmator\b/i], ['xd', /\badobe\s+xd\b/i],
  ['lightroom', /\blightroom\b/i], ['maya', /\b(?:autodesk\s+)?maya\b/i], ['houdini', /\bhoudini\b/i],
  ['reaper', /\breaper\b/i], ['logic-pro', /\blogic\s+pro\b/i], ['ableton', /\bableton\b/i],
  ['handbrake', /\bhandbrake\b/i], ['adobe-audition', /\badobe\s+audition\b/i], ['camtasia', /\bcamtasia\b/i],
  ['vegas-pro', /\bvegas\s+pro\b/i], ['protopie', /\bprotopie\b/i], ['zeplin', /\bzeplin\b/i],
  ['axure', /\baxure\b/i], ['balsamiq', /\bbalsamiq\b/i], ['unity', /\bunity(?:\s+engine|\s+3d)?\b/i],
  ['unreal', /\bunreal(?:\s+engine)?\b/i], ['excel', /\b(?:microsoft\s+)?excel\b/i],
  ['powerpoint', /\b(?:microsoft\s+)?powerpoint\b/i], ['google-sheets', /\bgoogle\s+sheets?\b/i],
  ['shopify', /\bshopify\b/i], ['squarespace', /\bsquarespace\b/i], ['wix', /\bwix\b/i],
  ['teamcity', /\bteamcity\b/i], ['bitbucket-pipelines', /\bbitbucket\s+pipelines?\b/i],
  ['chef', /\bchef\s+(?:infra|recipes?|cookbooks?)\b/i], ['puppet', /\bpuppet\s+(?:manifests?|modules?)\b/i],
  ['spss', /\bspss\b/i], ['stata', /\bstata\b/i], ['matlab', /\bmatlab\b/i],
  ['cloudformation', /\b(?:aws\s+)?cloudformation\b/i], ['aws-cdk', /\b(?:aws[- ]cdk)\b/i],
  ['bicep', /\b(?:azure\s+)?bicep\b/i], ['argocd', /\bargo\s*cd\b/i], ['crossplane', /\bcrossplane\b/i],
  ['nomad', /\bhashicorp\s+nomad\b/i], ['packer', /\bhashicorp\s+packer\b/i], ['vagrant', /\bvagrant\b/i],
  ['datadog', /\bdatadog\b/i], ['splunk', /\bsplunk\b/i], ['new-relic', /\bnew\s+relic\b/i],
  ['pagerduty', /\bpagerduty\b/i], ['buildkite', /\bbuildkite\b/i], ['azure-pipelines', /\bazure\s+pipelines\b/i],
  ['affinity-photo', /\baffinity\s+photo\b/i], ['affinity-publisher', /\baffinity\s+publisher\b/i],
  ['keynote', /\bapple\s+keynote\b|\bkeynote\b(?=\s+(?:deck|slides?|file|presentation))/i],
  ['godot', /\bgodot\b|\bgdscript\b/i], ['descript', /\bdescript\b/i], ['elevenlabs', /\belevenlabs\b/i],
  ['sqlalchemy', /\bsqlalchemy\b/i], ['alembic', /\balembic\b/i], ['typeorm', /\btypeorm\b/i],
  ['grpc', /\bgrpc\b|\bprotobuf\b/i], ['kustomize', /\bkustomize\b/i], ['terragrunt', /\bterragrunt\b/i],
  ['kubectl', /\bkubectl\b/i], ['screenflow', /\bscreenflow\b/i], ['filmora', /\bfilmora\b/i],
  ['media-composer', /\bmedia\s+composer\b|\bavid\b/i], ['runway', /\brunway\b(?:\s+(?:ml|gen))?/i],
  ['graphql', /\bgraphql\b/i], ['soap', /\bsoap\b(?=\s+(?:api|service|endpoint|envelope|wsdl|xml))|\bwsdl\b/i],
  ['salesforce', /\bsalesforce\b|\bapex\b(?=\s+(?:trigger|class|api|rest))/i], ['sap', /\bsap\b(?=\s+(?:rfc|odata|abap|bapi|api))|\babap\b/i],
  ['shotcut', /\bshotcut\b/i], ['openshot', /\bopenshot\b/i], ['imovie', /\bimovie\b/i],
  ['clipchamp', /\bclipchamp\b/i], ['lumafusion', /\bluma\s*fusion\b/i], ['hitfilm', /\bhitfilm\b/i],
  ['heygen', /\bheygen\b/i], ['synthesia', /\bsynthesia\b/i],
  ['sora', /\bsora\b(?=\s+(?:video|model|clip|prompt|generat))/i],
  ['helmfile', /\bhelmfile\b/i], ['cdk8s', /\bcdk8s\b/i], ['eksctl', /\beksctl\b/i],
  ['istio', /\bistio\b/i], ['hashicorp-vault', /\bhashicorp\s+vault\b/i], ['openshift', /\bopenshift\b/i],
  ['rancher', /\brancher\b/i], ['mulesoft', /\bmulesoft\b/i], ['sharepoint', /\bsharepoint\b/i],
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
  ['astro', /\bastro\b/i], ['tailwindcss', /\btailwind(?:css|\s+css)?\b/i],
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
  ['edl', '\\.edl\\b|cmx\\s*3600|\\bedl\\b'], ['aaf', '\\.aaf\\b|\\baaf\\b(?=\\s+(?:interchange|timeline|file|export))'],
  ['otio', '\\.otio\\b|opentimelineio'], ['omf', '\\.omf\\b'],
  ['xml-timeline', '\\b(?:timeline|interchange)\\s+xml\\b|\\bxml\\s+(?:timeline|interchange)\\b'],
  ['lut', '\\.cube\\b|\\blut\\b'], ['pdf-x', 'pdf[ /-]x(?:-[134])?'], ['pdf', 'pdf(?![ /-]x)'],
  ['png', 'png'], ['jpg', 'jpe?g'], ['svg', 'svg'], ['psd', 'psd'], ['ai', '\\.ai\\b'],
  ['indd', '\\.indd\\b|indesign package'], ['afdesign', '\\.afdesign\\b|\\.afpub\\b|afpub\\/afdesign|affinity designer file'],
  ['yxmd', '\\.yxmd\\b|yxmd'], ['incopy', 'incopy file|incopy-managed'], ['mkv', 'mkv'], ['parquet', 'parquet'],
  ['gif', 'gif'], ['lottie-json', 'lottie json'], ['fig', 'figma file|\\.fig\\b'],
  ['sketch', '\\.sketch\\b|sketch file'], ['cdr', '\\.cdr\\b|coreldraw file'],
  ['html', 'html'], ['json', '(?<!lottie )json'], ['yaml', 'ya?ml'], ['sql', 'sql'],
  ['docx', 'docx|word document'], ['pptx', 'pptx|powerpoint'], ['xlsx', 'xlsx'], ['csv', 'csv'],
  ['tsx', '\\.tsx\\b'], ['extendscript', '\\b(?:extendscript|jsx scripts?|\\.jsxbin)\\b'], ['jsx', '\\.jsx\\b'], ['typescript', '\\.ts\\b'], ['swift', '\\.swift\\b'],
  ['css', '\\.css\\b'], ['mermaid', '\\.mmd\\b'], ['prisma', '\\.prisma\\b'],
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
  ['social-copy', /\b(?:linkedin|instagram|facebook|threads|twitter|x|social media|tiktok|youtube)\b.{0,28}\b(?:post|caption|copy|thread|description)s?\b(?!\s+(?:banner|graphic|poster|flyer|image|thumbnail|visual|card|artwork)\b)|\b(?:post|caption|copy|thread)s?\b.{0,24}\b(?:for|on) (?:my |our )?(?:linkedin|instagram|facebook|threads|twitter|x|tiktok|youtube)\b|\b(?:social (?:media )?(?:copy|posts?|captions?|announcement)|launch copy|announcement post)\b/i],
  ['newsletter', /\bnewsletter\b/i],
  ['documentation', /\b(?:api docs|release notes|developer documentation|changelog|api reference|runbook|docs for)\b|\b(?:write|draft|create|update|edit|polish|generate|add|review|prepare)\b.{0,45}\breadme\b|^\s*(?:a\s+)?readme\b|\bdocument(?:ing)?\b.{0,65}\b(?:api|endpoints?|webhooks?|schemas?|cli|sdk|setup|architecture|workflow|repo|module|auth|deploy|payloads?)\b/i],
  ['design-system-doc', /(?:\bdesign\.md\b|\bdesign (?:tokens?|system)\b.{0,25}\b(?:inventory|documentation|audit|reference)\b|\b(?:color|typography|spacing)\b.{0,30}\btokens?\b.{0,35}\b(?:document|reference|agents?)\b)/i],
  ['mcp-server', /\b(?:build|create|implement|scaffold|write|develop|need|want|make|set up|design)\b.{0,65}\b(?:mcp server|model context protocol server)\b|^\s*(?:an? )?mcp server\b/i],
  ['generative-art', /\b(?:generative art|algorithmic art|flow fields?|seeded sketch|p5[. ]?js)\b/i],
  ['feature', /\b(?:add|implement|build|create)\b.{0,90}\b(?:button|widget|pagination|search bar|form validation|modal)\b/i],
  ['video-editor-project', /\b(?:editab(?:le|ility)|native|reopenable|reopen|project file|\.prproj|\.drp|\.drt|\.aep|\.fcpxml)\b.{0,60}\b(?:timeline|project|source|premiere|resolve|after effects)\b|\b(?:timeline|project)\b.{0,24}\b(?:\.prproj|\.drp|\.drt|\.aep|\.fcpxml|editable)\b/i],
  ['motion-video', /\b(?:motion graphics?|motion video|animated (?:expla(?:in|n)\w*|videos?|diagrams?|titles?|logos?|teaser|product|opener|intro|reel|svg|icons?|spinners?|loaders?|elements?|badges?|illustrations?|css)|explainer video|launch film|product reel|showreel|animation reel|kinetic typograph\w*|motion design|lower thirds?|lottie|after effects scripting)\b|\b(?:animate|render|build|make|create|compose|set up|produce)\b.{0,85}\b(?:animated\s+expla\w*|explainer\s+video|animation|manim|remotion|motion canvas|hyperframes|three[. -]?js(?:\s+scene)?|react[- ]three[- ]fiber|gsap|teaser)\b/i],
  ['captions', /\b(?:subtitles?|closed captions?|burn(?:ed)?[- ]?in captions?|caption tracks?|srt|webvtt|vtt)\b/i],
  ['audio-cleanup', /\b(?:audio cleanup|denoise|noise reduction|de[- ]?hum|de[- ]?ess|de[- ]?reverb|loudness|lufs)\b|\b(?:remove|reduce|clean up|normalize|trim)\b.{0,35}\b(?:background noise|noise|hum|hiss|echo|silence|audio|dialogue|spoken dialogue|podcast|levels)\b/i],
  ['color-grade', /\b(?:colou?r grad(?:e|ing)|colou?r correct(?:ion)?|white balance)\b|\b(?:apply|load|use|build)\b.{0,35}\blut\b|\bgrade\b.{0,25}\b(?:footage|shots?|clips?|film|video)\b/i],
  ['video-export', /\b(?:edit(?:ing)?|trim|cut|split|merge|concat(?:enate)?|crop|reframe|pad|scale|letterbox|remux|extract|strip|mute|fade|transcode|convert|splice|encode|mux|demux|export|deliver|resize|compress|render|burn|overlay|watermark|sync|turn|generate|create|make|produce)\b.{0,95}\b(?:(?:existing |source )?(?:video|footage|clip|interview|recording|lecture|screencast|screen recording|podcast clip|highlight clip)|mp4|mkv|mov|webm|gif|prores|h[. -]?264|h[. -]?265|wav|mp3|aac|9:16|16:9|4:5|1:1|aspect ratio|landscape|portrait|vertical|horizontal)\b|\b(?:edited|trimmed|cropped) (?:footage|video)\b|\bvideo (?:export|edit|editing)\b/i],
  ['brand-guide', /\b(?:brand identity|brand guidelines?|brand kits?|brand style guide|brand manual|logo (?:system|design|mark|and color)|color (?:palette|system|scheme)|font pairing|visual (?:usage|style|brand) guide|visual identity|wordmark|brand mood ?board)\b/i],
  ['static-graphic', /\b(?:poster|flyer|handbill|playbill|booklet|infographic|static graphic|album cover|book cover|podcast cover|cover (?:graphic|art)|hero banner|banner|thumbnail(?!\s+(?:nav|navigation|grid|strip|bar|sidebar|menu))|social (?:graphic|card)|quote card|carousel (?:graphic|slides?)|square artwork|artwork|print artwork|print design|print graphic|printable pdf|leaflet|event graphic|brochure|menu card|business card|sticker(?: sheet)?|packaging|bottle label|wine label|food label|magazine (?:cover|spread|layout)|zine|vinyl sleeve|open[- ]?graph (?:image|card|preview|banner)|(?:og|preview|promo) (?:card|image)|fact sheet|one[- ]?pager pdf|lanyard|event ticket|certificate|invitation|key visual|promo graphic|ad creative|cmyk proof|badge)\b|\b(?:static|printable|print-ready|png|pdf|svg)\s+(?:(?:png|pdf|svg|printable|static)\s+)?(?:sign|banner|badge|card|sheet|notice|placard|graphic)\b|\b(?:sign|placard|door hanger|yard sign)\s+for\b|\b(?:linkedin|instagram|facebook|threads|twitter|x|youtube)\b.{0,24}\b(?:banner|header image|cover image|carousel graphic|promo graphic|ad image)\b/i],
  ['dbt-tests', /\bdbt\b.{0,75}\b(?:tests?|tdd)\b|\b(?:tests?|tdd)\b.{0,75}\bdbt\b/i],
  ['dbt-model', /\b(?:dbt|data pipeline|warehouse|staging|mart|table model)\b.{0,75}\b(?:models?|transformations?|snapshots?|sql|schema)\b|\b(?:models?|transformations?|snapshots?)\b.{0,75}\bdbt\b/i],
  ['data-analysis', /\b(?:analy[sz]e|analyse|analysis|summari[sz]e|aggregate|query|compute|explore|breakdown)\b.{0,80}\b(?:csv|dataset|data set|data|parquet|spreadsheet|sql|duckdb|cohort|retention|churn|funnel|metrics)\b|\b(?:cohort|retention|churn|funnel|csv|parquet|duckdb)\s+(?:analysis|breakdown|summary|report|query|queries)\b/i],
  ['article', /\b(?:write|draft|rewrite|reshape|edit|polish)\b.{0,80}\b(?:article|essay|blog post|tutorial|guidebook|case study|whitepaper|technical writeup|press release|executive summary|one[- ]pager|landing page copy|product copy|ux copy|microcopy|post)\b|^(?:an? )?(?:article|essay|blog post)\b/i],
  ['tests', /\b(?:unit|integration|regression|automated) tests?\b|\b(?:add|write|cover|set up|create)\b.{0,60}\btests?\b/i],
  ['debug', /\b(?:fix|debug|diagnose|investigate|reproduce|troubleshoot)\b.{0,85}\b(?:crash|regression|exception|failing|flakes?|flaky|broken|bug|failure|timeout|error|leak|mismatch|hydration|deadlock|race condition)\b|\b(?:crash fix|bug fix|root cause analysis|falls over|freezes|hangs|unresponsive|stops working|failing silently|keeps crashing|stack trace|segfault|doesn['’]t work|won['’]t (?:start|load|compile|build|connect|save|render)|race condition|double[- ]?claim|both claim|duplicate processing)\b|\b(?:fails?|failed)\b.{0,45}\b(?:when|with|on|after|during)\b/i],
  ['code-review', /\bcode review\b|\b(?:review|audit|inspect)\b.{0,60}\b(?:diff|pull request|pr|changes|implementation|code|error handling|edge cases|type safety|src\/|handlers?|modules?)\b/i],
  ['browser-tests', /\b(?:playwright|cypress|browser (?:smoke )?tests?|end[- ]to[- ]end (?:tests?|suite)|e2e (?:tests?|suite)|test in (?:a |the )?browser|checkout flows? in chrome)\b/i],
  ['release-plan', /\b(?:release readiness|release plan|rollback plan|deployment plan|release (?:playbook|runbook|process))\b|\b(?:prepare|plan|preflight|check readiness|rollback|tactical review)\b.{0,60}\b(?:release|deployment|launch|rollout)\b/i],
  ['deploy', /\b(?:deploy|ship|publish)\b.{0,55}\b(?:site|service|app|staging|production|vercel|netlify|release)\b/i],
  ['architecture', /\b(?:technical rfc|rfc\b.{0,30}\bpropos|system architecture|architecture (?:review|decision|diagram)|architectural (?:review|decision)|module boundaries|system design)\b/i],
  ['api', /\b(?:api|database schema|data model|rest endpoint|graphql|openapi|migration|drizzle|prisma|postgres(?:ql)?\s+(?:tables?|indexes?|schema|queries|constraints?|partitioning|pooling|rls))\b.{0,60}\b(?:design|spec|model|schema|contract|orm|plan|layout|setup|migration)\b|\b(?:design|model|define|test|implement|write|build|set up|configure|plan)\b.{0,60}\b(?:api|database schema|data model|rest endpoint|graphql|openapi|migration|drizzle|postgres(?:ql)?\s+(?:tables?|schema|indexes?|queries))\b/i],
  ['mobile-app', /\b(?:build|create|implement|make|scaffold|design|polish)\b.{0,75}\b(?:mobile app|flutter app|react native app|ios app|android app|mobile\b.{0,30}\b(?:ui|screen|onboarding|flow|navigation))\b|\b(?:in|for|with) (?:flutter|react[- ]?native|expo|swiftui)\b|^(?:an? )?(?:mobile app|flutter app|react native app|ios app|android app)\b/i],
  ['performance', /\b(?:profile|optimi[sz]e|measure|improve|eliminate)\b.{0,70}\b(?:performance|latency|load time|lcp|cls|inp|layout shift|bundle size|core web vitals|lighthouse)\b/i],
  ['web-redesign', /\b(?:redesign|restyle|refresh|overhaul|revamp|rework|polish|tighten|moderni[sz]e|declutter|re-?skin)\b.{0,80}\b(?:portfolio|site|website|web app|homepage|landing page|dashboard|panel|screen|view|navigation|sidebar|header|footer|interface|ui|component|cards?|typography|hierarchy|spacing|layout|flow|(?:pricing|checkout|settings|billing|product|account|profile|login|signup|docs)\s+pages?|sections?)\b|\b(?:portfolio|site|website|web app|homepage|landing page|dashboard|ui|interface)\b.{0,50}\b(?:feels? dated|looks? dated|fresh look|outdated|cluttered)\b|\bfresh look\b.{0,60}\b(?:portfolio|site|website|homepage|landing page|ui)\b/i],
  ['wireframe', /\bwireframes?\b/i],
  ['ui-design', /\b(?:mockups?|prototype|screen design|ux audit|accessibility audit|ui design|component composition|analytics dashboard|pricing cards?|pricing table|pricing section|hero section|feature grid|modal dialog|data table|typography hierarchy|onboarding flow|ui component library|component library)\b|\b(?:design|polish|tighten|audit|review|critique|improve|build|create|choose|pick)\b.{0,65}\b(?:interface|dashboard|ui|ux|component|cards?|spacing|hierarchy|visual hierarchy|layout|pricing table|modal dialog|shadcn|billing page|settings page|checkout flow|ui library|component library)\b/i],
  ['web-site', /\b(?:build|create|launch|make|design|prototype|scaffold)\b.{0,85}\b(?:website|web app(?!.{0,35}\bspinner\b)|homepage|landing page|portfolio|site|dashboard|(?<!one[- ])\bpage(?!\s+(?:fact sheet|summary|pdf|flyer|handbill|poster|guide|memo|report|proposal)\b))\b|^(?:an? )?(?:landing page|portfolio site|website|web app)\b/i],
  ['dead-code', /\b(?:dead code|unused (?:exports|dependencies|files))\b/i],
  ['plan', /^(?!.{0,80}\b(?:itinerary|trip|vacation|backpacking|travel|wedding|dinner|menu|workout|party)\b)(?:please )?(?:plan\b|(?:write|draft|outline|create|give me)\s+(?:an? |the )?(?:(?:implementation|migration|project|test) )?plan\b)|\bimplementation plan\b/i],
  ['feature', /^(?!.{0,50}\b(?:rfc|proposal|blog post|article|tutorial|readme|whitepaper)\b)(?:.*\b(?:implement|modify|refactor|clean up|simplify|modulari[sz]e|split up|port)\b.{0,70}\b(?:services?|projects?|repos?|code|app|modules?|backend|frontend|handlers?|routes?|controllers?|hooks?|components?|state|logic|codebase|webhooks?|endpoints?|helpers?|libraries|library)\b|.*\b(?:add|implement|build|update|fix|improve|write|create|refactor|migrate)\b.{0,90}\b(?:button|widget|feature|component|filter|search bar|pagination|form validation|endpoint|handler|middleware|webhook|worker|queue|cron|parser|validator|module|cli|sdk|rate limit\w*|oauth|authentication)\b)/i],
  ['web-site', /\b(?:landing page|portfolio (?:site|website)|marketing site|marketing page|web app|homepage)\b/i],
  ['article', /\b(?:blog post|case study|whitepaper|technical article|editorial article)\b/i],
  ['tests', /\b(?:test suite|unit tests?|integration tests?|e2e tests?|regression tests?)\b/i],
  ['code-review', /\b(?:pull request review|pr review|code audit)\b/i],
  ['release-plan', /\b(?:rollback checklist|release checklist|go[- ]live checklist|cutover plan)\b/i],
];

const actionByKind = Object.fromEntries(Object.entries(kindByAction).map(([action, kind]) => [kind, action]));
const negation = /\b(?:do not|don['’]t|no need to|never|avoid|without|exclude|forbid(?:den)?|skip|omit|no)\s+/i;
const separators = /[.!?](?:\s|$)|[;\n:]|\s+[—–]\s+|\s+(?:but instead|instead of|but)\s+|,?\s+(?:and then|then|as well as|alongside|and also)\s+|,?\s+and\s+(?=(?:also\s+)?(?:write|draft|deploy|design|edit|create|make(?!\s+(?:its|it|them)\b)|trim|export|cut|deliver|render|add|build|implement|review|audit|check|fix|optimi[sz]e|document|generate|animate|normalize|grade|clean|polish|refactor|debug|scaffold|configure|set up|prepare|analy[sz]e|query|convert|transcode|extract|burn|test|verify|plan|(?:an? |the )?(?:poster|flyer|newsletter|article|blog post|infographic|video|mp4|project file|editable timeline|spreadsheet|workbook|presentation|deck|slides?|pdf|readme|(?:linkedin|instagram|twitter|x) (?:post|caption|thread)))\b)/i;
const leadingNegation = /^\s*(?:do not|don['’]t|no need to|never|avoid|without|exclude|forbid(?:den)?|skip|omit|no)\b[^,.;—–:\n]{1,75}(?:,|—|–|:|\s+-\s+)\s*/i;
const sourceClause = /\s+(?:from(?!\s+(?:coreldraw|figma|inkscape|sketch|indesign|illustrator|photoshop|affinity|davinci|resolve|premiere|after effects|manim|blender|aegisub|alteryx|incopy|canva|webflow|framer|gimp|krita|cinema\s*4d|audacity|logic\s*pro|reaper|final\s*cut(?:\s*pro)?)\b)|based on|summarizing|to accompany|for the already[- ]edited|for an already[- ]edited)\s+/i;
const media = new Set(['video-editor-project', 'motion-video', 'video-export', 'color-grade', 'captions', 'audio-cleanup']);
const writing = new Set(['social-copy', 'newsletter', 'article', 'documentation']);
const toolForFormat = { drp: 'davinci-resolve', drt: 'davinci-resolve', prproj: 'premiere-pro', fcpxml: 'final-cut-pro', aep: 'after-effects', fig: 'figma', 'lottie-json': 'lottie', sketch: 'sketch', cdr: 'coreldraw', yxmd: 'alteryx', indd: 'indesign', afdesign: 'affinity-designer', incopy: 'incopy' };

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
    'p5-js': 'p5js', postgres: 'postgresql', twitter: 'x', 'framer-motion': 'motion',
    'tailwind-css': 'tailwindcss', 'd3-js': 'd3', d3js: 'd3', 'alteryx-designer': 'alteryx',
    'adobe-incopy': 'incopy' })[key] ?? detect(value, [...tools, ...stacks])[0] ?? key;
};
const canonicalFormat = (value) => {
  const key = slug(value);
  return formats.some(([id]) => id === key) ? key : ({ txt: 'plain-text', md: 'markdown' })[key] ?? detect(value, formats)[0] ?? key;
};

function identify(text) {
  if (/^(?:please )?(?:plan|outline the (?:work|implementation)|write (?:a |the )?(?:short |implementation )?plan)\b/i.test(text) &&
      !/\b(?:release|rollback|deployment plan|migration|schema|database|postgres\w*|sql|api|architecture|security|observability|tables?|indexes?|queries|itinerary|trip|vacation|backpacking|travel|wedding|dinner|menu|workout|party)\b/i.test(text)) return 'plan';
  if (/^\s*(?:please )?(?:test|verify|check|smoke[- ]test)\b.{0,65}\b(?:playwright|browser|chrome)\b/i.test(text)) return 'browser-tests';
  if (/^\s*(?:please )?(?:review|audit|check)\b.{0,60}\b(?:html|css|web accessibility|wcag|a11y)\b/i.test(text)) return 'ui-review';
  if (detect(text.split(sourceClause)[0], formats).some((format) => ['drp', 'drt', 'prproj', 'aep', 'fcpxml'].includes(format)) ||
      /\b(?:editable|native) (?:resolve |premiere |davinci resolve |after effects )?(?:timeline|project)\b|\b(?:davinci\s+resolve|resolve|premiere(?:\s+pro)?|after\s+effects|final\s+cut(?:\s+pro)?)\s+(?:timeline|project)\b/i.test(text)) return 'video-editor-project';
  const matchForms = (candidate) => {
    const generic = positiveForms.find(([, pattern]) => pattern.test(candidate))?.[0];
    const specific = specialistForms.find(([kind, pattern]) => {
      if (kind === 'spreadsheet' && generic === 'data-analysis') return false;
      if (kind === 'media-transcription' && ['social-copy', 'article', 'documentation'].includes(generic)) return false;
      if (kind === 'architecture-diagram' && generic === 'documentation') return false;
      return pattern.test(candidate);
    })?.[0];
    return { generic, specific };
  };
  const hasTransformInto = /\bfrom\b.{0,110}\b(?:into|to)\b/i.test(text);
  const withoutSource = hasTransformInto ? text : text.split(sourceClause)[0];
  let { generic, specific } = matchForms(withoutSource);
  if (!generic && !specific && withoutSource.length < text.length) {
    const cleaned = text
      .replace(/\s+(?:based on|to accompany|for (?:an? |the )?(?:already[- ]edited|existing)\s+\w+)\b[^,.;!?]*/gi, '')
      .replace(/\s+from\s+(?:an?\s+|the\s+|our\s+|my\s+)?(?:already[- ]edited|recorded)\s+(?:interview|footage|video|recording|audio)\b(?!\s+into\b)/gi, '');
    ({ generic, specific } = matchForms(cleaned));
  }
  const kind = generic === 'social-copy' ? generic : specific || generic;
  if (!kind && /\b(?:guide|docs|documentation|reference)\b.{0,60}\b(?:for|on)\b/i.test(text)) return 'reference';
  return kind;
}

const postNegationPositive = /\s*(?:,|;\s*|\binstead\b)\s*(?=(?:using|use|with|via|preferring|sticking to|keeping|delivering|returning|rather than)\b)/i;

function positiveWork(part) {
  let clean = part.replace(leadingNegation, '');
  clean = clean.replace(/\b(?:rather than|instead of)\s+(?:using\s+)?(?:a\s+|an\s+|the\s+)?[a-z\d .+#/-]{1,30}?(?=\s+(?:to|for|when|in|with|and|or)\b|[,.;!?]|$)/gi, '');
  const idx = clean.search(negation);
  if (idx < 0) return clean.trim();
  const before = clean.slice(0, idx).trim();
  const after = clean.slice(idx);
  const tailMatch = after.match(/\s*,\s*(?:using|use|with|via|preferring|sticking to|keeping|delivering|returning|instead)\b.*$/i);
  return tailMatch ? (before + ' ' + tailMatch[0].replace(/^,\s*/, '')).trim() : before;
}

function excludeFacts(task) {
  const expandAliases = (raw) => raw
    .replace(/\butility\s+css(?:\s+library)?\b|\bcss\s+frameworks?\b/gi, 'tailwindcss')
    .replace(/\banimation\s+(?:library|libraries|packages?)\b/gi, 'framer motion gsap')
    .replace(/\b(?:ui|component)\s+(?:library|libraries|frameworks?)\b/gi, 'shadcn radix-ui')
    .replace(/\borms?\b/gi, 'prisma drizzle')
    .replace(/\bjavascript\s+framework\b/gi, 'react nextjs vue angular svelte');
  const found = [];
  if (/\b(?:system fonts? only|local fonts? only)\b/i.test(task)) found.push('google-fonts', 'fontshare');
  for (const clause of task.split(separators)) {
    const lead = leadingNegation.exec(clause)?.[0];
    if (lead) found.push(...detect(expandAliases(lead.replace(negation, '')), [...tools, ...stacks]));
    for (const m of clause.matchAll(/\b(?:rather than|instead of)\s+(?:using\s+)?(?:a\s+|an\s+|the\s+)?([a-z\d .+#/-]{1,35}?)(?=\s+(?:to|for|when|in|with|and|or)\b|[,.;!?]|$)/gi)) {
      found.push(...detect(expandAliases(m[1]), [...tools, ...stacks]));
    }
    for (const m of clause.matchAll(/\b([a-z\d .+#/-]{1,35}?)\s+(?:is|are)\s+(?:off[- ]?limits|prohibited|forbidden|not allowed|disallowed|banned|excluded)\b/gi)) {
      found.push(...detect(expandAliases(m[1]), [...tools, ...stacks]));
    }
    const stripped = clause.replace(leadingNegation, '');
    const offset = stripped.search(negation);
    if (offset >= 0) {
      const negSlice = stripped.slice(offset).replace(negation, '').split(postNegationPositive)[0];
      found.push(...detect(expandAliases(negSlice), [...tools, ...stacks]));
    }
  }
  return unique(found);
}

function mediaFeatures(text, kind) {
  if (!media.has(kind) && kind !== 'media-transcription') return [];
  return [
    ...(/\b(?:transcrib\w*|from scratch captions?|auto[- ]?captions?|auto[- ]?subtitles?|speech[- ]to[- ]text|word[- ]level timestamps?|speaker diarization|diarize|whisper)\b/i.test(text) ? ['transcription'] : []),
    ...(/\b(?:burn[- ]in|burn(?:ed)? (?:the )?captions?|open captions?)\b/i.test(text) ? ['burn-in'] : []),
    ...(/\b(?:lower thirds?|title cards?)\b/i.test(text) ? ['titles'] : []),
    ...(/\b(?:multicam|multi.camera|two camera|multi[- ]angle|camera angles)\b/i.test(text) ? ['multicam'] : []),
    ...(/\b(?:stabiliz\w*|rotoscop\w*|green[- ]screen|chroma[- ]key|motion track\w*|3d camera track\w*|optical flow|frame interpolat\w*|scene detect\w*|beauty retouch\w*|object remov\w*|inpaint\w*|lip[- ]sync|voice clon\w*|speech enhanc\w*|auto[- ]?reframe|360 video|spatial audio|dolby atmos|prores raw|braw|r3d|color wheels?|power windows?|ai (?:upscal\w*|dub\w*|voiceover))\b/i.test(text) ? ['advanced-video'] : []),
    ...(/\binterview\b/i.test(text) ? ['interview'] : []),
    ...(/\b(?:denoise|noise reduction|cleanup|remove (?:background |an? )?(?:hum|noise))\b/i.test(text) ? ['noise-reduction'] : []),
    ...(/\b(?:broadcast|eb[u] r128)\b/i.test(text) ? ['broadcast'] : []),
  ];
}

function requirement(text, kind) {
  const target = /\bfrom\b.{0,90}\binto\b/i.test(text) ? text : text.split(sourceClause)[0];
  const namedFile = /\b(?:native|editable|deliver|export|output|save|original|reopenable)\b.{0,45}(?:^|\s|\*)\.([a-z][a-z\d]{1,8})\b/gi;
  const suffixes = [...target.matchAll(namedFile)].map(([, suffix]) => canonicalFormat(suffix));
  const artifactFormats = unique([...detect(target, formats), ...suffixes]).filter((id) =>
    !(id === 'html' && ['ui-review', 'web-redesign', 'web-site', 'feature', 'motion-video', 'browser-tests', 'seo-optimization'].includes(kind)) &&
    !(['csv', 'xlsx', 'json', 'yaml', 'parquet'].includes(id) && ['data-analysis', 'feature', 'debug', 'tests', 'performance', 'code-review', 'documentation', 'plan', 'architecture'].includes(kind) &&
      (/\b(?:analy[sz]e|analyse|import|parse|read|load|aggregat\w*|ingest\w*|encounters?|query|counts?)\b/i.test(target) ||
        ['documentation', 'debug', 'code-review', 'tests', 'performance', 'plan', 'architecture'].includes(kind)) &&
      !new RegExp('\\b(?:export|generate|return|output|deliver|convert|into|save(?:d)? as)\\b.{0,30}\\b' + id + '\\b', 'i').test(target)) &&
    !(id === 'sql' && ['dbt-model', 'dbt-tests'].includes(kind) && !/\b(?:export|deliver|write|output)\b.{0,25}\bsql\b/i.test(target)));
  const writingTools = new Set(['linkedin', 'instagram', 'x', 'substack', 'mailchimp', 'wordpress', 'google-docs', 'obsidian', 'mermaid', 'excalidraw', 'canva', 'figma']);
  const toolScanTarget = ['article', 'newsletter', 'social-copy'].includes(kind)
    ? target.replace(/\b(?:about|explaining|discussing|covering)\b.+$/i, '')
    : target;
  const targetTools = detect(toolScanTarget, tools).filter((t) =>
    !(['article', 'newsletter', 'social-copy'].includes(kind) && !writingTools.has(t)) &&
    !(['static-graphic', 'brand-guide', 'video-export', 'captions', 'motion-video', 'ui-design', 'web-site', 'web-redesign'].includes(kind) &&
      ['instagram', 'linkedin', 'x'].includes(t)));
  const explicitTool = /\b(?:required tool|target tool|editor|runtime|platform)\s*[:=]\s*([\p{L}\p{N}][\p{L}\p{N} .+#-]{0,45})/iu.exec(target)?.[1];
  if (explicitTool) targetTools.push(canonicalTool(explicitTool.trim()));
  if (['web-site', 'web-redesign', 'ui-design', 'feature', 'mobile-app', 'mcp-server',
    'react-transition', 'data-visualization', 'memory-diagnostics', 'swift-development', 'component-canvas', 'ui-animation'].includes(kind) &&
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
  if (!subject) return null;
  if (/\bedited cut\b.{0,35}\bor\b.{0,35}\banimated\b/i.test(subject)) {
    return { question: 'Are you editing existing footage or creating a motion graphic?', choices: ['video-edit', 'motion-video'] };
  }
  if (/^(?:please\s+)?(?:make|help)\b.{0,30}\bdesign look better\b/i.test(subject)) {
    return { question: 'What should the design deliverable be?', choices: ['design', 'graphic-design', 'motion-video'] };
  }
  if (!/\b(?:help|need|something|find|suggest|looking for|work on|ideas)\b/i.test(subject)) return null;
  if (/\b(?:dns|cname|mx record|ssl|tls|nginx|cloudflare|database|postgres|docker|kubernetes|terraform|extract|keyframe|thumbnail|transcode|compress|convert|50\d|40\d)\b/i.test(subject)) {
    return null;
  }
  if (/\b(?:video|footage)\b/i.test(subject) && !/\b(?:deliver|add|make|create|show|publish|write|fix|trim|cut|edit|render|animate|export|sync|stabiliz\w*|upscal\w*|transcrib\w*|diariz\w*|subtitl\w*|caption\w*|grade|noise|lufs|normalize|mp4|mov|mkv|webm|srt|vtt|prproj|drp|drt|fcpxml|aep|edl|aaf|otio)\b/i.test(subject)) {
    return { question: 'Are you editing existing footage or creating a motion graphic?', choices: ['video-edit', 'motion-video'] };
  }
  if (/\b(?:portfolio|site|website|homepage)\b/i.test(subject) && !/\b(?:with\s+\d+|create|build|fix|write|host|test|improve|redesign|audit|optimize|refactor|style|animate|deploy|review|add|update|migrate|configure|debug|troubleshoot|monitor|analyze|secure|scrape|backup)\b/i.test(subject)) {
    return { question: 'Should the kit create a new site or redesign an existing one?', choices: ['new-web-project', 'web-redesign'] };
  }
  if (/\b(?:design|visuals?)\b/i.test(subject) && !/\b(?:interface|logo|brand|paper|artifact|dashboard|poster|flyer|banner|hero|card|badge|sticker|handbill|brochure|invitation|ticket|cover|mockup|layout|typography|spacing|palette|grid|icon|illustration|deck|slides?|app|screen|website|site|mobile|animation|motion|ui|ux|page|component|system|tokens?|wireframe|email|newsletter|print|packaging|contrast|accessibility|responsive)\b/i.test(subject)) {
    return { question: 'What should the design deliverable be?', choices: ['design', 'graphic-design', 'motion-video'] };
  }
  return null;
}

const refinementClause = /^(?:(?:provide|return|deliver|keep|use|send)\s+(?:the\s+|them\s+as\s+)?(?:copy[- ]ready\s+)?(?:plain[- ]?text|text|findings|audit|review|code|output|results?)\s+only|leave\s+(?:all\s+)?(?:publishing|the\s+environment)\b|i\s+have\s+the\s+(?:photo|image|footage|video|files?)\s+already|this\s+is\s+an?\s+internal\s+preview|retain\s+reduced[- ]motion|no\s+(?:mailing|contact\s+lookup|deployment|implementation)|do\s+not\s+(?:publish|deploy|implement|re-?encode))/i;

function parseIntent(input = {}) {
  validate(input, inputSchema, 'kit request');
  const { task = '', workflow, stack = '', intent = {} } = input;
  if (input.intent && workflow !== undefined) throw new Error('Pass intent or an explicit workflow, not both.');
  const clauses = task.trim().split(separators);
  const explicit = intent.deliverables || [];
  const clausesOfWork = clauses.map(positiveWork).filter(Boolean);
  const subject = clausesOfWork.join(' ');
  const constraints = new Set(intent.constraints || []);
  if (/\b(?:(?:do not|don['’]t|no need to|never)\s+(?:actually\s+)?(?:deploy|publish|ship|release|push|send|apply)|no (?:deployment|deploying)|without (?:deploying|pushing|publishing|applying)|do not make live changes|leave (?:all )?publishing to me|leave the environment alone)\b/i.test(task)) constraints.add('no-deployment');
  if (/\b(?:leave (?:all )?publishing to me|(?:don['’]t|do not|never) (?:auto[- ]?)?(?:publish|schedule|post|send)|no (?:auto[- ]?publishing|automated publishing|auto[- ]?posting|automated posting|live publishing)|as copy[- ]ready text|(?:without|skip)\s+(?:publishing|automated publishing|auto[- ]?posting|scheduling|sending)|(?:provide|return|deliver|write)\s+(?:the\s+)?(?:post\s+|thread\s+|email\s+|caption\s+)?(?:text|copy|draft|script)\s+only|\b(?:draft|copy|text)\s+only\b)\b/i.test(task)) constraints.add('no-auto-publishing');
  if (/\b(?:no mailing|no contact lookup|without contact lookup)\b/i.test(task)) constraints.add('no-contact-lookup');
  if (/\b(?:design only|mockups? only)\b/i.test(task)) constraints.add('design-only');
  if (/\b(?:no (?:implementation|coding|code changes|edits)|(?:do not|don['’]t|never) (?:implement|write code|edit (?:any )?(?:files|code|source)|modify (?:any )?(?:files|code|source)|alter (?:any )?(?:code|source))|without (?:writing code|implementing|modifying|editing (?:files|code|source))|(?:findings|audit|review|diagnosis|triage|analysis|feedback|critique|recommendations|suggestions|report|assessment)\s+only|\bread[- ]?only\b|leave (?:existing )?(?:code|files|source|the environment) (?:alone|untouched))\b/i.test(task)) constraints.add('no-implementation');
  if (/\b(?:offline[- ]?only|local[- ]?only|air[- ]?gapped|no cloud|without (?:cloud|uploading|external network|network calls?|external apis?|internet)|never upload|keep (?:all )?(?:data|files|processing) local)\b/i.test(task)) constraints.add('no-cloud');
  if (constraints.has('design-only')) {
    constraints.add('no-implementation');
    constraints.add('no-deployment');
  }
  const openSource = intent.budget === 'open-source' ||
    /\b(?:only|using|with|in|prefer|require(?:s|d)?) (?:fully |strictly )?open[- ]source(?: only| tools?| software| resources?| references?| tooling)?\b|\bopen[- ]source (?:tools?|software|resources?|licen[cs]es?|alternatives?|only)\b|\b(?:must be|strictly) open[- ]source\b|\b(?:no|avoid|without) (?:proprietary|commercial|closed[- ]source) (?:tools?|software|licen[cs]es?|services?)\b|\b(?:avoid|no|without) bsl\b/i.test(task);
  const free = intent.budget === 'free' || constraints.has('free-resources-only') ||
    /\b(?:only free|using (?:only )?free|free (?:resources?|tools?|software|references?|fonts?|assets?) only|no (?:paid|commercial|subscription|proprietary)\b.{0,40}\b(?:resources?|tools?|software|references?|fonts?|assets?|services?|plugins?|icons?|fees?)|(?:paid|commercial|subscription)\b.{0,45}\b(?:off[- ]limits|prohibited|forbidden|not allowed|disallowed|banned)|zero[- ]budget|gratis|without (?:paying|a paid subscription|paid (?:tools?|subscriptions?|services?))|free \w+ to (?:create|make|build|generate|author)|free tier only)\b/i.test(task);
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

  const inferredQuestion = clarify(subject);
  const requestedActions = workflow && inferredQuestion?.choices.includes(workflow) ? [workflow] : intent.actions || [];
  let deliverables = explicit.length
    ? explicit.map((text, index) => requirement(text, identify(text) || kindByAction[requestedActions[index]] || 'unknown'))
    : [];
  const trailingRefinements = [];
  for (const clause of clausesOfWork) {
    if (refinementClause.test(clause)) continue;
    let kind = identify(clause);
    if (!kind && ((/^(?:also )?(?:write|draft|deliver|provide|create|build|export|make|send)\s+\S/i.test(clause) &&
        (deliverables.length || /\b(?:clipboard|schedule|presentations?|deck|slides?|spreadsheet|workbook|report|pdf|asset|pack)\b/i.test(clause))) ||
        (deliverables.length && /^(?:an? |the )?(?:spreadsheet|workbook|presentation|deck|slides?|pdf)\b/i.test(clause)))) {
      kind = 'unknown';
    }
    if (!kind) {
      if (!explicit.length) trailingRefinements.push(clause);
      continue;
    }
    const current = requirement(clause, kind);
    const prior = deliverables.at(-1);
    if (!explicit.length && prior && ['motion-video', 'data-analysis', 'resolve-edit', 'resolve-grade', 'color-grade', 'audio-cleanup', 'captions',
        'static-graphic', 'brand-guide', 'design-system-doc', 'ui-design', 'web-site', 'web-redesign', 'article', 'newsletter', 'social-copy', 'documentation', 'sop-doc', 'data-visualization', 'reusable-theme'].includes(prior.kind) &&
        ['video-export', 'unknown'].includes(kind) &&
        /^(?:export|render|deliver|mp4|prores|mov|output|save|provide|supply|return|include|keep|use|send|format|make it|keep it)\b/i.test(clause) &&
        !/\b(?:editable|native)\b.{0,25}\.[a-z\d]{2,8}\b/i.test(clause) &&
        (!current.tools.length || current.tools.every((tool) => prior.tools.includes(tool) || tool === prior.tools[0]))) {
      prior.formats = unique([...prior.formats, ...current.formats]);
      prior.tools = unique([...prior.tools, ...current.tools]);
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
  if (!explicit.length && deliverables.length && trailingRefinements.length) {
    const primary = deliverables.at(-1);
    const extraText = trailingRefinements.join(' ');
    const extraReq = requirement(extraText, primary.kind);
    primary.tools = unique([...primary.tools, ...extraReq.tools]);
    primary.formats = unique([...primary.formats, ...extraReq.formats]);
    primary.features = unique([...primary.features, ...extraReq.features]);
    primary.text = (primary.text + ' ' + extraText).trim().slice(0, 240);
  }
  for (const action of requestedActions) {
    if (!deliverables.some((item) => item.kind === kindByAction[action] || actionByKind[item.kind] === action ||
      (action === 'video-edit' && media.has(item.kind)) ||
      (action === 'editorial' && writing.has(item.kind)) ||
      (action === 'api-data' && ['dbt-model', 'dbt-tests', 'data-analysis', 'mcp-server'].includes(item.kind)) ||
      (action === 'design' && ['ui-review', 'static-graphic', 'brand-guide', 'wireframe'].includes(item.kind)))) {
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
  const explicitChoiceQuestion = Boolean(inferredQuestion && /\bedited cut\b.{0,35}\bor\b.{0,35}\banimated\b/i.test(subject));
  const clarification = intent.unresolvedDecision
    ? { question: intent.unresolvedDecision.replace(/[.!?]+$/, '') + '?', choices: [] }
    : (!known || explicitChoiceQuestion) && !requestedActions.length ? inferredQuestion : null;
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
