// Realistic multi-hit offline web replay for manual arm comparison (unmodified baseline docs + distractors + verification checklists).
const pages = [
  // Web developer
  {
    id: 'css-tricks-portfolio',
    coverage: null,
    role: 'partial',
    title: 'Showcase: 12 Minimal Portfolio Layouts (2025)',
    url: 'https://example-design-blog.org/minimal-portfolios',
    guidance: 'Gallery inspiration for creative portfolios using clean serif display typography and generous whitespace. Does not cover semantic form markup, accessibility attributes, or browser verification.',
    terms: 'website portfolio redesign layout design inspiration typography',
  },
  {
    id: 'mdn-responsive',
    coverage: 'web developer',
    role: 'guide',
    title: 'MDN Responsive Web Design & Semantic HTML',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design',
    guidance: 'Build a flexible fluid layout first using CSS Grid/Flexbox. Pair every interactive input with an explicit <label for="...">, use landmark elements (<main>, <nav>, <header>), ensure images scale inside containers, and test across narrow mobile and desktop viewports.',
    terms: 'website portfolio redesign css html layout responsive navigation accessibility',
  },
  {
    id: 'w3c-focus-check',
    coverage: 'web developer',
    role: 'verify',
    title: 'W3C WCAG 2.2 Keyboard Focus & Contrast Verification',
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html',
    guidance: 'Verification checklist: test full keyboard navigation (Tab/Shift+Tab) with visible :focus-visible outlines, verify 4.5:1 text contrast and 44x44px target sizes, and inspect desktop and 375px phone widths.',
    terms: 'wcag keyboard focus contrast accessibility verify check audit',
  },

  // Video editor
  {
    id: 'video-blog-codecs',
    coverage: null,
    role: 'partial',
    title: 'Choosing Between H.264, H.265, and ProRes Containers',
    url: 'https://example-media-notes.org/video-codecs-overview',
    guidance: 'High-level codec comparison for archival masters vs web delivery. For exact trimming CLI flags, refer to FFmpeg stream-copy vs re-encoding manuals.',
    terms: 'video editor footage clip trim mp4 codec ffmpeg compression',
  },
  {
    id: 'ffmpeg-manual',
    coverage: 'video editor',
    role: 'guide',
    title: 'FFmpeg Seeking, Trimming, and MP4 Compression Guide',
    url: 'https://ffmpeg.org/ffmpeg.html',
    guidance: 'Place -ss before -i for fast keyframe seeking and set duration with -t or -to. Re-encode with -c:v libx264 -crf 23 -preset medium -c:a aac -movflags +faststart when reducing size or needing frame-accurate cuts.',
    terms: 'video editor footage clip trim mp4 interview ffmpeg export size',
  },
  {
    id: 'ffmpeg-ffprobe-check',
    coverage: 'video editor',
    role: 'verify',
    title: 'FFprobe Delivery QA Checklist (Audio Sync & Dimensions)',
    url: 'https://ffmpeg.org/ffprobe.html',
    guidance: 'Verification checklist: inspect duration, stream resolution, frame rate, and pixel format with ffprobe, then play back start and end cut points to check lip-sync and cleanly trimmed boundaries.',
    terms: 'ffprobe verify duration audio sync streams playback check audit',
  },

  // Motion designer
  {
    id: 'motion-landscape',
    coverage: null,
    role: 'partial',
    title: 'HTML-to-Video Motion Frameworks Comparison',
    url: 'https://example-motion-notes.org/html-video-tools',
    guidance: 'Compares programmatic HTML/CSS canvas renderers against imperative keyframe timelines. See HyperFrames official docs for composition authoring and CLI rendering.',
    terms: 'motion animated animation motion-graphics video hyperframes composition',
  },
  {
    id: 'hyperframes-docs',
    coverage: 'motion designer',
    role: 'guide',
    title: 'HyperFrames Authoring & CLI Rendering Docs',
    url: 'https://hyperframes.heygen.com/',
    guidance: 'HyperFrames compiles timed HTML/CSS compositions via GSAP-driven keyframes and exports MP4/WebM with hyperframes render. Keep typography stable during reading beats and configure exact canvas dimensions and FPS.',
    terms: 'motion animated animation motion-graphics video hyperframes cli render composition',
  },
  {
    id: 'motion-qa-checklist',
    coverage: 'motion designer',
    role: 'verify',
    title: 'Motion Export Timing & Readability QA',
    url: 'https://example-motion-notes.org/render-qa-checklist',
    guidance: 'Verification checklist: validate composition FPS, total frame count, first/middle/final frame readability at target aspect ratio, safe margins, and audio sync across the full render.',
    terms: 'fps frame count safe margins readability playback verify check audit',
  },

  // Graphic designer
  {
    id: 'poster-gallery',
    coverage: null,
    role: 'partial',
    title: 'Modern Typographic Festival Posters Archive',
    url: 'https://example-print-archive.org/festival-posters',
    guidance: 'Curated exhibition of Swiss-grid and Neo-grotesque event posters. Visual reference only; does not specify canvas/print specs or contrast ratios.',
    terms: 'graphic poster flyer festival visual typography design inspiration',
  },
  {
    id: 'print-grid-guide',
    coverage: 'graphic designer',
    role: 'guide',
    title: 'Print & Poster Hierarchy, Grid, and Typography Guide',
    url: 'https://example-print-archive.org/poster-grid-spec',
    guidance: 'Establish strict visual hierarchy: event title, date/time, then venue/CTA. Pair at most two type families, preserve generous margins/bleed for print output, and render crisp vector SVG or high-DPI PNG canvas.',
    terms: 'graphic poster flyer festival visual typography design hierarchy grid print',
  },
  {
    id: 'w3c-contrast',
    coverage: 'graphic designer',
    role: 'verify',
    title: 'W3C Contrast & Print Legibility Verification',
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
    guidance: 'Verification checklist: check foreground/background contrast (>= 4.5:1 normal, >= 3:1 display), inspect artwork in grayscale and at intended poster viewing scale, and confirm key details read cleanly.',
    terms: 'wcag contrast legibility grayscale print bleed verify check audit',
  },

  // Copywriter
  {
    id: 'newsletter-benchmarks',
    coverage: null,
    role: 'partial',
    title: '2026 Founder Newsletter Open-Rate Benchmarks',
    url: 'https://example-editorial.org/newsletter-benchmarks',
    guidance: 'Aggregate industry open/click statistics across B2B and indie creator dispatches. Does not provide drafting structure or factual verification steps.',
    terms: 'copy email newsletter draft copywriting founder benchmarks',
  },
  {
    id: 'mailchimp-email',
    coverage: 'copywriter',
    role: 'guide',
    title: 'Concise Founder Newsletter Structure & Voice Guide',
    url: 'https://mailchimp.com/help/requirements-best-practices/',
    guidance: 'Lead with a clear subject line stating what changed for readers, preserve authentic first-person founder voice without meta-labels, state dates/facts once cleanly, and close with one concrete next step.',
    terms: 'copy email newsletter draft copywriting founder editorial readers notes',
  },
  {
    id: 'editorial-fact-check',
    coverage: 'copywriter',
    role: 'verify',
    title: 'Editorial Verification & Reader Clarity Checklist',
    url: 'https://example-editorial.org/fact-and-link-check',
    guidance: 'Verification checklist: trace every date, quote, number, and link back to the supplied founder notes; confirm subject matches the opening without verbatim repetition; preview line breaks at reading width.',
    terms: 'fact link verification reading width editorial check audit',
  },
];

export function realisticWebCall(toolName, args) {
  if (toolName === 'search_web' && typeof args.query === 'string') {
    const words = new Set(args.query.toLowerCase().match(/[a-z0-9]+/g) || []);
    const hits = pages
      .map((entry) => [entry, entry.terms.split(' ').filter((w) => words.has(w)).length])
      .sort((a, b) => b[1] - a[1])
      .filter(([, score]) => score > 0)
      .slice(0, 6);
    return {
      results: hits.map(([p]) => ({
        title: p.title,
        url: p.url,
      })),
    };
  }
  const page = pages.find((entry) => entry.url === args.url);
  if (toolName !== 'open_page' || !page) return { error: 'Page not found in public web replay.' };
  return {
    id: page.id,
    coverage: page.coverage,
    role: page.role,
    title: page.title,
    url: page.url,
    guidance: page.guidance,
  };
}
