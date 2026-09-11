// truefalse — afirmații de tip Adevărat / Fals.
// { type:'truefalse', items:[{ id, text, answer: true|false, why? }] }
// Răspuns: { [itemId]: true | false }

import { checkIds, countAnswered, makeResult } from '../_shared.js';

export default {
  type: 'truefalse',

  validate(part) {
    const errors = [];
    if (!Array.isArray(part.items) || !part.items.length) return ['truefalse: lipsește lista „items”'];
    checkIds(part.items, 'truefalse.items', errors);
    for (const it of part.items) {
      if (!it.text) errors.push(`truefalse.${it.id}: lipsește textul`);
      if (typeof it.answer !== 'boolean') errors.push(`truefalse.${it.id}: „answer” trebuie să fie true sau false`);
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
        return { id: it.id, ok: given === it.answer, expected: it.answer, given, feedback: given === it.answer ? null : (it.why ?? null) };
      }),
    );
  },
};
