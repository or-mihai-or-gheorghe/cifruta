// build — formează un număr pe numărătoare (bile pe tije: sute / zeci / unități).
// { type:'build', tool:'abacus', places:['Z','U'], items:[{ id, label:'46 de ouă', target:46 }] }
// Ținta se poate da și ca un calcul: items:[{ id, label, calc:'148 + 136' }] (se verifică și „cu / fără trecere”).
// Răspuns: { [itemId]: { Z:4, U:6 } | null }

import { calc } from '../../core/expr.js';
import { checkIds, countAnswered, isInt, makeResult } from '../_shared.js';

const targetOf = (it) => it.target ?? (it.calc !== undefined ? calc(String(it.calc)) : undefined);

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
      let target;
      try {
        target = targetOf(it);
      } catch (e) {
        errors.push(`build.${it.id}: nu pot calcula „${it.calc}” (${e.message})`);
        continue;
      }
      if (!isInt(target, 1, max)) errors.push(`build.${it.id}: ținta ${target} trebuie să fie între 1 și ${max} (cu ${places.join('')})`);
      if (it.target !== undefined && it.calc !== undefined && calc(String(it.calc)) !== it.target) errors.push(`build.${it.id}: ${it.calc} = ${calc(String(it.calc))}, nu ${it.target}`);
    }
    return errors;
  },

  expressions: (part) => part.items.filter((it) => it.calc !== undefined).map((it) => String(it.calc)),

  count: (part) => part.items.length,
  answered: (part, ans) => countAnswered(part.items.map((i) => i.id), ans),
  empty: () => ({}),
  solution: (part) => Object.fromEntries(part.items.map((it) => [it.id, beadsFor(part.places, targetOf(it))])),

  evaluate(part, ans) {
    return makeResult(
      part.items.map((it) => {
        const beads = ans?.[it.id] ?? null;
        const valid = typeof beads === 'object' && beads !== null && part.places.every((p) => isInt(beads[p] ?? 0, 0, 9));
        const value = valid ? valueOf(part.places, beads) : null;
        return { id: it.id, ok: value === targetOf(it), expected: targetOf(it), given: value };
      }),
    );
  },
};
