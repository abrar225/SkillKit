'use strict';

const packs = require('../workflows/personas.json');
const { getResource, mayDeliver } = require('./catalog-policy');

function getPersonaPack(id) {
  const pack = packs.find((entry) => entry.id === id);
  if (!pack) return null;
  return {
    ...pack,
    skills: pack.skills.filter(mayDeliver),
    references: pack.resources.map(getResource).filter(Boolean).map(({ id, name, url }) => ({ id, name, url })),
  };
}

function personaPacks(contract, kit) {
  const matching = packs.map((pack) => {
    const deliverables = contract.deliverables.filter(({ kind }) => pack.deliverables.includes(kind));
    return { pack, deliverables, score: deliverables.length };
  }).filter(({ score }) => score > 0);
  const selected = new Set(kit.resources.map(({ id }) => id));
  return matching.sort((a, b) => b.score - a.score || Number(a.pack.id === 'developers') - Number(b.pack.id === 'developers'))
    .map(({ pack, deliverables }) => {
      const variants = [...new Set(deliverables.flatMap(({ tools }) => tools))]
        .flatMap((tool) => pack.variants[tool] ? [{ tool, ...pack.variants[tool] }] : []);
      return {
        id: pack.id, title: pack.title, tasteAnchors: pack.tasteAnchors, antiPatterns: pack.antiPatterns,
        checks: [...variants.map(({ check }) => check), ...pack.checks],
        references: getPersonaPack(pack.id).references.filter(({ id }) => selected.has(id)),
        ...(variants.length ? { variants } : {}),
      };
    });
}

module.exports = { getPersonaPack, personaPacks };
