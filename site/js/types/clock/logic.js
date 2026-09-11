// clock — arată ora pe un ceas cu ace (ore fixe și jumătăți).
// { type:'clock', step:30, items:[{ id, label:'9 și jumătate', answer:{ h:9, m:30 } }] }
// Răspuns: { [itemId]: { h, m } | null }

import { checkIds, countAnswered, makeResult } from '../_shared.js';

export const sameTime = (a, b) => !!a && !!b && a.h % 12 === b.h % 12 && a.m === b.m;

export const timeText = (t) => {
  if (!t) return '—';
  const h = t.h % 12 === 0 ? 12 : t.h % 12;
  return t.m === 30 ? `${h} și jumătate` : t.m === 0 ? `ora ${h}` : `${h}:${String(t.m).padStart(2, '0')}`;
};

export default {
  type: 'clock',

  validate(part) {
    const errors = [];
    const step = part.step ?? 30;
    if (!Array.isArray(part.items) || !part.items.length) return ['clock: lipsește lista „items”'];
    checkIds(part.items, 'clock.items', errors);
    for (const it of part.items) {
      const a = it.answer;
      if (!a || !Number.isInteger(a.h) || a.h < 0 || a.h > 23) errors.push(`clock.${it.id}: ora trebuie să fie între 0 și 23`);
      else if (!Number.isInteger(a.m) || a.m % step !== 0 || a.m >= 60) errors.push(`clock.${it.id}: minutele trebuie să fie multiplu de ${step}`);
    }
    return errors;
  },

  count: (part) => part.items.length,
  answered: (part, ans) => countAnswered(part.items.map((i) => i.id), ans),
  empty: () => ({}),
  solution: (part) => Object.fromEntries(part.items.map((it) => [it.id, { ...it.answer }])),

  evaluate(part, ans) {
    return makeResult(
      part.items.map((it) => {
        const given = ans?.[it.id] ?? null;
        return { id: it.id, ok: sameTime(given, it.answer), expected: it.answer, given };
      }),
    );
  },
};
