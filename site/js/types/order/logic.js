// order — așază elementele în ordinea cerută.
// Ordine numerică:  { type:'order', direction:'asc'|'desc', items:[{ id, text:'65', tag?:'N', value? }], reveal?:{ word:'VACANȚĂ' } }
// Ordine din indicii: { type:'order', key:['radu','ana',…], constraints:[{ rule:'first', a:'radu' }, { rule:'before', a:'ana', b:'dan' }, …] }
//   reguli: first, last, before (a înaintea lui b), after, rightAfter (a imediat după b), rightBefore
// Credit: elementele din cel mai lung subșir aflat deja în ordinea corectă.
// Răspuns: [id, id, …] (null până când copilul mută ceva)

import { calc } from '../../core/expr.js';
import { checkIds, isBlank } from '../_shared.js';

const valueOf = (it) => it.value ?? calc(String(it.calc ?? it.text));

/** Aceleași id-uri ca în listă, fiecare exact o dată. */
export const isPermutation = (order, ids) =>
  Array.isArray(order) && order.length === ids.length && new Set(order).size === ids.length && order.every((id) => ids.includes(id));

export function keyOf(part) {
  if (part.key) return [...part.key];
  const sorted = [...part.items].sort((a, b) => valueOf(a) - valueOf(b));
  if (part.direction === 'desc') sorted.reverse();
  return sorted.map((it) => it.id);
}

const RULES = {
  first: (pos, c) => pos[c.a] === 0,
  last: (pos, c, n) => pos[c.a] === n - 1,
  before: (pos, c) => pos[c.a] < pos[c.b],
  after: (pos, c) => pos[c.a] > pos[c.b],
  rightAfter: (pos, c) => pos[c.a] === pos[c.b] + 1,
  rightBefore: (pos, c) => pos[c.a] === pos[c.b] - 1,
};

export function satisfies(order, constraints) {
  const pos = Object.fromEntries(order.map((id, i) => [id, i]));
  return constraints.every((c) => RULES[c.rule](pos, c, order.length));
}

function* permutations(list) {
  if (list.length <= 1) { yield list; return; }
  for (let i = 0; i < list.length; i++) {
    for (const rest of permutations([...list.slice(0, i), ...list.slice(i + 1)])) yield [list[i], ...rest];
  }
}

/** Indicii elementelor din cel mai lung subșir crescător (după poziția corectă). */
function longestInOrder(positions) {
  const n = positions.length;
  const len = Array(n).fill(1);
  const prev = Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (positions[j] < positions[i] && len[j] + 1 > len[i]) { len[i] = len[j] + 1; prev[i] = j; }
    }
  }
  let best = 0;
  for (let i = 1; i < n; i++) if (len[i] > len[best]) best = i;
  const keep = new Set();
  for (let i = n ? best : -1; i >= 0; i = prev[i]) keep.add(i);
  return keep;
}

export default {
  type: 'order',

  validate(part) {
    const errors = [];
    if (!Array.isArray(part.items) || part.items.length < 2) return ['order: sunt necesare cel puțin 2 elemente'];
    checkIds(part.items, 'order.items', errors);
    const ids = part.items.map((i) => i.id);
    if (!part.key && !['asc', 'desc'].includes(part.direction)) errors.push('order: lipsește direction (asc/desc) sau key');
    let key;
    try {
      key = keyOf(part);
    } catch (e) {
      return [...errors, `order: nu pot calcula ordinea (${e.message})`];
    }
    if (key.length !== ids.length || !ids.every((id) => key.includes(id))) errors.push('order: „key” trebuie să conțină toate elementele');
    if (!part.key) {
      const values = part.items.map(valueOf);
      if (new Set(values).size !== values.length) errors.push('order: valori egale — ordinea nu e unică');
    }
    if (part.constraints && ids.length > 8) errors.push('order: indiciile se verifică doar pentru cel mult 8 elemente');
    else if (part.constraints) {
      const found = [...permutations(ids)].filter((p) => satisfies(p, part.constraints));
      if (found.length !== 1) errors.push(`order: indiciile permit ${found.length} ordini (trebuie una)`);
      else if (found[0].join() !== key.join()) errors.push(`order: indiciile dau ${found[0].join(', ')}, nu ${key.join(', ')}`);
    }
    if (part.reveal?.word) {
      const byId = Object.fromEntries(part.items.map((i) => [i.id, i]));
      const word = key.map((id) => byId[id].tag ?? '').join('');
      if (word !== part.reveal.word) errors.push(`order: literele formează „${word}”, nu „${part.reveal.word}”`);
    }
    return errors;
  },

  count: () => 1,
  answered: (part, ans) => (isBlank(ans) ? 0 : 1),
  empty: () => null,
  solution: (part) => keyOf(part),

  evaluate(part, ans) {
    const key = keyOf(part);
    if (!isPermutation(ans, key)) {
      return { items: key.map((id, i) => ({ id, ok: false, credit: 0, expected: i, given: null })), earned: 0, total: key.length };
    }
    const keep = longestInOrder(ans.map((id) => key.indexOf(id)));
    const items = ans.map((id, i) => ({ id, ok: keep.has(i), credit: keep.has(i) ? 1 : 0, expected: key.indexOf(id), given: i }));
    return { items, earned: keep.size, total: key.length };
  },
};
