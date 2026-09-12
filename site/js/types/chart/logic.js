// chart — construiești un grafic cu bare: pe fiecare categorie apeși + / − (pas `step`, până la `max`).
// { type:'chart', categories:[{ id, label, emoji? }], max:10, step:2,
//   key:{ aur:6, argint:4, bronz:8 }                       ← valorile cerute (credit pe bară)
//   sau rules:[{ rule:'total', value:20 }, { rule:'more', a:'mere', b:'banane' }, { rule:'least', a:'pere' },
//              { rule:'most', a }, { rule:'equal', a, b }, { rule:'range', a, min?, max? }, { rule:'each', min?, max? }]
//   given:{ fotbal:10 } → bare desenate dinainte (blocate); copilul completează doar restul.
// Răspuns: { categorieId: valoare } pentru categoriile editabile.

import { plain } from '../../core/markup.js';
import { checkIds, isInt, makeResult } from '../_shared.js';

const MAX_SEARCH = 200000;

export const editable = (part) => part.categories.filter((c) => !(part.given && c.id in part.given)).map((c) => c.id);
const labelOf = (part, id) => plain(String(part.categories.find((c) => c.id === id)?.label ?? id));
const allValues = (part, ans) => ({ ...(part.given ?? {}), ...ans });

/** Prima regulă încălcată de valorile `vals` (null dacă toate sunt respectate). */
export function ruleViolation(part, vals) {
  for (const r of part.rules ?? []) {
    const v = (id) => Number(vals[id] ?? 0);
    switch (r.rule) {
      case 'total': {
        const sum = part.categories.reduce((s, c) => s + v(c.id), 0);
        if (sum !== r.value) return `Barele fac împreună ${sum}, dar trebuie să facă ${r.value}.`;
        break;
      }
      case 'more':
        if (!(v(r.a) > v(r.b))) return `${labelOf(part, r.a)} trebuie să aibă mai mult decât ${labelOf(part, r.b)}.`;
        break;
      case 'equal':
        if (v(r.a) !== v(r.b)) return `${labelOf(part, r.a)} și ${labelOf(part, r.b)} trebuie să aibă la fel de mult.`;
        break;
      case 'most':
        if (!part.categories.every((c) => c.id === r.a || v(r.a) > v(c.id))) return `${labelOf(part, r.a)} trebuie să aibă mai mult decât fiecare altă bară.`;
        break;
      case 'least':
        if (!part.categories.every((c) => c.id === r.a || v(r.a) < v(c.id))) return `${labelOf(part, r.a)} trebuie să aibă mai puțin decât fiecare altă bară.`;
        break;
      case 'range':
        if (r.min !== undefined && v(r.a) < r.min) return `${labelOf(part, r.a)} trebuie să aibă cel puțin ${r.min}.`;
        if (r.max !== undefined && v(r.a) > r.max) return `${labelOf(part, r.a)} trebuie să aibă cel mult ${r.max}.`;
        break;
      case 'each':
        for (const id of editable(part)) {
          if (r.min !== undefined && v(id) < r.min) return `${labelOf(part, id)} trebuie să aibă cel puțin ${r.min}.`;
          if (r.max !== undefined && v(id) > r.max) return `${labelOf(part, id)} trebuie să aibă cel mult ${r.max}.`;
        }
        break;
      default:
        return `regulă necunoscută „${r.rule}”`;
    }
  }
  return null;
}

/** Toate combinațiile de valori (multipli de step, 0…max) pentru categoriile editabile, în ordine crescătoare. */
function* combos(part) {
  const ids = editable(part);
  const levels = Math.floor(part.max / part.step) + 1;
  const total = levels ** ids.length;
  for (let n = 0; n < total; n++) {
    const vals = {};
    let rest = n;
    for (const id of ids) {
      vals[id] = (rest % levels) * part.step;
      rest = Math.floor(rest / levels);
    }
    yield vals;
  }
}

export function firstValid(part) {
  for (const vals of combos(part)) {
    if (Object.values(vals).every((x) => x === 0)) continue;
    if (ruleViolation(part, allValues(part, vals)) === null) return vals;
  }
  return null;
}

export const keyOf = (part) => (part.key ? { ...part.key } : firstValid(part));

const validValue = (part, x) => isInt(x, 0, part.max) && x % part.step === 0;

export default {
  type: 'chart',

  validate(part) {
    const errors = [];
    if (!Array.isArray(part.categories) || part.categories.length < 2) return ['chart: sunt necesare cel puțin 2 categorii'];
    checkIds(part.categories, 'chart.categories', errors);
    if (!isInt(part.step, 1)) errors.push('chart: `step` trebuie să fie un număr întreg ≥ 1');
    if (!isInt(part.max, 1) || (isInt(part.step, 1) && part.max % part.step !== 0)) errors.push('chart: `max` trebuie să fie un multiplu al pasului');
    if (Boolean(part.key) === Boolean(part.rules)) errors.push('chart: exact unul dintre `key` și `rules`');
    const ids = new Set(part.categories.map((c) => c.id));
    for (const [id, v] of Object.entries(part.given ?? {})) {
      if (!ids.has(id)) errors.push(`chart.given: categorie necunoscută „${id}”`);
      else if (!validValue(part, v)) errors.push(`chart.given.${id}: valoarea trebuie să fie multiplu de ${part.step}, între 0 și ${part.max}`);
    }
    if (errors.length) return errors;
    const free = editable(part);
    if (!free.length) errors.push('chart: toate barele sunt date — nu rămâne nimic de construit');
    if (part.key) {
      for (const id of free) {
        const v = part.key[id];
        if (v === undefined) errors.push(`chart.key: lipsește valoarea pentru „${id}”`);
        else if (!validValue(part, v) || v < part.step) errors.push(`chart.key.${id}: valoarea trebuie să fie multiplu de ${part.step}, între ${part.step} și ${part.max}`);
      }
      for (const id of Object.keys(part.key)) if (!ids.has(id)) errors.push(`chart.key: categorie necunoscută „${id}”`);
    } else {
      if (!Array.isArray(part.rules) || !part.rules.length) return ['chart: `rules` trebuie să fie o listă nevidă'];
      for (const r of part.rules) for (const k of ['a', 'b']) if (r[k] !== undefined && !ids.has(r[k])) errors.push(`chart.rules: categorie necunoscută „${r[k]}”`);
      const space = (Math.floor(part.max / part.step) + 1) ** free.length;
      if (space > MAX_SEARCH) errors.push(`chart: prea multe combinații (${space}); micșorează max sau mărește step`);
      if (!errors.length) {
        if (ruleViolation(part, allValues(part, Object.fromEntries(free.map((id) => [id, 0])))) === null) errors.push('chart: barele goale respectă regulile — adaugă o regulă care cere valori');
        else if (!firstValid(part)) errors.push('chart: nicio combinație de bare nu respectă regulile');
      }
    }
    return errors;
  },

  count: (part) => (part.key ? editable(part).length : 1),
  answered: (part, ans) => {
    const vals = editable(part).map((id) => ans?.[id]).filter((v) => isInt(v, 0));
    return part.key ? vals.length : vals.some((v) => v > 0) ? 1 : 0;
  },
  empty: () => ({}),
  solution: (part) => keyOf(part),

  evaluate(part, ans) {
    const given = ans && typeof ans === 'object' && !Array.isArray(ans) ? ans : {};
    const free = editable(part);
    if (part.key) {
      return makeResult(free.map((id) => {
        const v = given[id];
        const ok = validValue(part, v) && v === part.key[id];
        return { id, ok, expected: part.key[id], given: isInt(v) ? v : null };
      }));
    }
    const clean = Object.fromEntries(free.map((id) => [id, validValue(part, given[id]) ? given[id] : 0]));
    const touched = free.some((id) => isInt(given[id], 1));
    const invalid = free.some((id) => given[id] !== undefined && !validValue(part, given[id]));
    const feedback = invalid
      ? `O bară are o valoare care nu se poate desena aici: între 0 și ${part.max}, din ${part.step} în ${part.step}.`
      : touched ? ruleViolation(part, allValues(part, clean)) : 'Ridică barele apăsând +.';
    const ok = feedback === null;
    return makeResult([{ id: 'chart', ok, expected: keyOf(part), given: touched ? clean : null, feedback }]);
  },
};
