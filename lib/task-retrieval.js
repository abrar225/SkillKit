'use strict';

const stopWords = new Set(('the and for from with this that these those into using only both please want need help work existing new ' +
  'which should use good best select give find skill skills resource resources tool tools project task deliverable make create write build').split(' '));
const synonyms = [
  ['website', /\b(?:web site|webpage|homepage|landing page|site|web app)\b/g],
  ['artifact', /\b(?:output|deliverable|result|export)\b/g],
  ['video', /\b(?:footage|recording|interview|clip|movie)\b/g],
  ['captions', /\b(?:subtitle|subtitles|subrip|webvtt|caption)\b/g],
  ['print', /\b(?:flyer|poster|leaflet|brochure|press-ready)\b/g],
  ['copy', /\b(?:prose|draft|post|writing)\b/g],
  ['test', /\b(?:verify|validate|verification|testable|checks|regression|vitest|tdd)\b/g],
  ['deploy', /\b(?:shipping|release|rollout|deploying)\b/g],
  ['reduce', /\b(?:trim|cut|shorten|crop)\b/g],
  ['noise', /\b(?:denoise|dehum|hiss|hum|background noise)\b/g],
  ['architecture', /\b(?:layered|clean architecture|mvvm|module boundaries|package structure|system design)\b/g],
  ['restyle', /\b(?:redesign|restyle|polish|refresh|revamp|vanilla css)\b/g],
  ['automation', /\b(?:autopost|auto-publish|schedule|scheduler|outreach|mailing)\b/g],
];

const normalize = (value) => value.toLowerCase().replace(/[^a-z\d#]+/g, ' ').trim();
const terms = (value) => normalize(value).split(/\s+/).filter((word) => word.length > 1 && !stopWords.has(word));

function fields(candidate) {
  return [candidate.id, candidate.title, candidate.kind, candidate.stage, candidate.description,
    ...(candidate.tags || []), ...(candidate.deliverables || []), ...(candidate.tools || []),
    ...(candidate.formats || []), ...(candidate.features || [])].filter(Boolean).join(' ');
}

function vector(value) {
  const counts = new Map();
  const normalized = normalize(value);
  const add = (key, weight) => {
    // A signed, deterministic feature hash bounds the size of each vector.
    let hash = 2166136261;
    for (let index = 0; index < key.length; index += 1) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
    const bucket = hash & 2047;
    counts.set(bucket, (counts.get(bucket) || 0) + (hash & 2048 ? weight : -weight));
  };
  const words = [...new Set(terms(normalized))];
  for (const word of words) {
    add('word:' + word, 1);
    const boundary = '#' + word + '#';
    for (let index = 0; index < boundary.length - 2; index += 1) add('gram:' + boundary.slice(index, index + 3), 0.24);
  }
  for (const [concept, pattern] of synonyms) {
    pattern.lastIndex = 0;
    if (pattern.test(normalized)) add('concept:' + concept, 1.6);
  }
  const norm = Math.hypot(...counts.values()) || 1;
  return new Map([...counts].map(([key, weight]) => [key, weight / norm]));
}

function indexCandidates(entries) {
  const frequency = new Map();
  const indexed = entries.map((candidate) => {
    const text = fields(candidate);
    const words = new Set(terms(text));
    for (const word of words) frequency.set(word, (frequency.get(word) || 0) + 1);
    const strong = new Set(terms([candidate.id, candidate.title, candidate.kind, ...(candidate.tags || []),
      ...(candidate.deliverables || []), ...(candidate.tools || [])].filter(Boolean).join(' ')));
    return { candidate, words, strong, vector: vector(text) };
  });
  return function retrieve(query, kind, limit = 8) {
    const wanted = new Set(terms([kind, query].filter(Boolean).join(' ')));
    const embedding = vector([kind, query].filter(Boolean).join(' '));
    return indexed.map((item) => {
      let lexical = 0;
      const terms = [];
      for (const word of wanted) {
        if (!item.words.has(word)) continue;
        terms.push(word);
        const idf = Math.log(1 + indexed.length / (frequency.get(word) || 1));
        lexical += idf * (item.strong.has(word) ? 1 : 0.45);
      }
      let similarity = 0;
      for (const [key, weight] of embedding) similarity += weight * (item.vector.get(key) || 0);
      const declared = item.candidate.kind === kind || item.candidate.deliverables?.includes(kind);
      return { candidate: item.candidate, declared, lexical, similarity, terms };
    }).filter((item) => item.declared || item.lexical > 0 || item.similarity > 0.14)
      .sort((a, b) => Number(b.declared) - Number(a.declared) ||
        (b.lexical + 3 * b.similarity) - (a.lexical + 3 * a.similarity) ||
        a.candidate.id.localeCompare(b.candidate.id)).slice(0, limit);
  };
}

module.exports = { indexCandidates };
