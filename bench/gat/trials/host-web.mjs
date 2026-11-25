const pages = [
  ['mdn-responsive', 'web developer', 'MDN Responsive Web Design', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design', 'Build a flexible layout first. Use media queries where the content needs a breakpoint, resize images inside their containers, and test at a range of viewport widths.', 'website portfolio redesign css html layout responsive navigation'],
  ['ffmpeg-manual', 'video editor', 'FFmpeg reference manual', 'https://ffmpeg.org/ffmpeg.html', 'Use input seeking and set output duration with -t. Re-encode when you need accurate cuts. Inspect the output streams and check the cut boundaries and audio by playback.', 'video editor footage clip trim mp4 interview ffmpeg export'],
  ['hyperframes-docs', 'motion designer', 'HyperFrames documentation', 'https://hyperframes.heygen.com/', 'HyperFrames renders HTML-based compositions as video. Build a timed composition, preview its transitions, and inspect rendered timing, readability and dimensions.', 'motion animated animation motion-graphics video hyperframes composition'],
  ['w3c-contrast', 'graphic designer', 'W3C Understanding Contrast', 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html', 'For digital text, assess foreground and background together. WCAG AA gives 4.5:1 for regular text and 3:1 for large text. Check artwork at intended output scale.', 'graphic poster flyer festival visual typography design contrast'],
  ['mailchimp-email', 'copywriter', 'Mailchimp Requirements and Best Practices for Audiences', 'https://mailchimp.com/help/requirements-best-practices-audiences/', 'Set appropriate expectations for subscribers. Send content that matches what the audience signed up for and give recipients a clear path to change preferences.', 'copy email newsletter draft copywriting founder editorial readers subscriptions'],
  ['playwright-overview', null, 'Playwright Introduction', 'https://playwright.dev/docs/intro', 'Use browser tests to verify the behavior users interact with.', 'test web browser'],
  ['pandas-io', null, 'pandas I/O tools', 'https://pandas.pydata.org/docs/user_guide/io.html', 'Use the parser corresponding to the file format and validate the inferred data types.', 'data table csv file'],
  ['svg-element', null, 'MDN SVG svg element', 'https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/svg', 'An SVG viewBox maps drawing coordinates into the display viewport.', 'graphic vector svg element render'],
];

function tool(name, description, field) {
  return { type: 'function', function: { name, description, parameters: {
    type: 'object', properties: { [field]: { type: 'string' } }, required: [field], additionalProperties: false,
  } } };
}

export const webTools = [
  tool('search_web', 'Search the local replay of public web documentation. Returns titles and URLs.', 'query'),
  tool('open_page', 'Read a page from the local public-web replay by URL.', 'url'),
];

export function webCall(toolName, args) {
  if (toolName === 'search_web' && typeof args.query === 'string') {
    const words = new Set(args.query.toLowerCase().match(/[a-z0-9]+/g) || []);
    const hits = pages.map((entry) => [entry, entry[5].split(' ').filter((word) => words.has(word)).length])
      .sort((a, b) => b[1] - a[1]).filter(([, score]) => score > 0).slice(0, 4);
    return { results: hits.map(([[, , title, url]]) => ({ title, url })) };
  }
  const page = pages.find((entry) => entry[3] === args.url);
  if (toolName !== 'open_page' || !page) return { error: 'Page is outside the public-web replay.' };
  const [id, coverage, title, url, guidance] = page;
  return { id, coverage, title, url, guidance };
}
