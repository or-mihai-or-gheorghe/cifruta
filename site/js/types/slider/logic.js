// slider — poziționare pe o axă (sau termometru).
// { type:'slider', skin:'line'|'thermometer', min:0, max:100, step:1, ticks:{ minor:10, major:50, labels:[0,50,100] },
//   unit?:'°', items:[{ id, label, answer:48, tolerance:2 }] }
// Răspuns: { [itemId]: număr | null } — null până la prima atingere.

import { checkIds, countAnswered, makeResult } from '../_shared.js';

export default {
  type: 'slider',

  validate(part) {
    const errors = [];
    const { min, max, step = 1 } = part;
    if (!(Number.isFinite(min) && Number.isFinite(max) && min < max)) errors.push('slider: min < max');
    if (!(step > 0)) errors.push('slider: step > 0');
    if (!Array.isArray(part.items) || !part.items.length) return [...errors, 'slider: lipsește lista „items”'];
    checkIds(part.items, 'slider.items', errors);
    for (const it of part.items) {
      if (!(it.answer >= min && it.answer <= max)) errors.push(`slider.${it.id}: răspunsul ${it.answer} e în afara axei`);
      if ((it.answer - min) % step !== 0) errors.push(`slider.${it.id}: răspunsul ${it.answer} nu se potrivește cu pasul ${step}`);
    }
    return errors;
  },

  count: (part) => part.items.length,
  answered: (part, ans) => countAnswered(part.items.map((i) => i.id), ans),
  empty: () => ({}),
  solution: (part) => Object.fromEntries(part.items.map((it) => [it.id, it.answer])),

  evaluate(part, ans) {
    return makeResult(
      part.items.map((it) => {
        const given = ans?.[it.id] ?? null;
        const ok = given !== null && Math.abs(Number(given) - it.answer) <= (it.tolerance ?? 0);
        return { id: it.id, ok, expected: it.answer, given };
      }),
    );
  },
};
