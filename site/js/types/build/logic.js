// build — formează un număr pe numărătoare (bile pe tije: sute / zeci / unități).
// { type:'build', tool:'abacus', places:['Z','U'], items:[{ id, label:'46 de ouă', target:46 }] }
// Răspuns: { [itemId]: { Z:4, U:6 } | null }

import { checkIds, countAnswered, makeResult } from '../_shared.js';

export const WEIGHTS = { S: 100, Z: 10, U: 1 };

export const valueOf = (places, beads) =>
  beads ? places.reduce((s, p) => s + WEIGHTS[p] * Number(beads[p] ?? 0), 0) : null;

export const beadsFor = (places, n) =>
  Object.fromEntries(places.map((p) => [p, Math.floor(n / WEIGHTS[p]) % 10]));

export default {
  type: 'build',

  validate(part) {
    const errors = [];
    const places = part.places ?? [];
    if (!places.length || places.some((p) => !WEIGHTS[p])) errors.push('build: places trebuie să fie din S, Z, U');
    if (!Array.isArray(part.items) || !part.items.length) return [...errors, 'build: lipsește lista „items”'];
    checkIds(part.items, 'build.items', errors);
    const max = places.reduce((s, p) => s + WEIGHTS[p] * 9, 0);
    for (const it of part.items) {
      if (!Number.isInteger(it.target) || it.target < 0 || it.target > max) errors.push(`build.${it.id}: ${it.target} nu se poate forma cu ${places.join('')}`);
    }
    return errors;
  },

  count: (part) => part.items.length,
  answered: (part, ans) => countAnswered(part.items.map((i) => i.id), ans),
  empty: () => ({}),
  solution: (part) => Object.fromEntries(part.items.map((it) => [it.id, beadsFor(part.places, it.target)])),

  evaluate(part, ans) {
    return makeResult(
      part.items.map((it) => {
        const beads = ans?.[it.id] ?? null;
        const value = valueOf(part.places, beads);
        const valid = beads !== null && part.places.every((p) => Number(beads[p] ?? 0) <= 9);
        return { id: it.id, ok: valid && value === it.target, expected: it.target, given: value };
      }),
    );
  },
};
