// categorize — sortează elementele în coșuri.
// { type:'categorize', bins:[{ id, label, visual? }], items:[{ id, text, visual?, bin }] }
// Răspuns: { [itemId]: binId }

import { checkIds, countAnswered, makeResult } from '../_shared.js';

export default {
  type: 'categorize',

  validate(part) {
    const errors = [];
    if (!Array.isArray(part.bins) || part.bins.length < 2) errors.push('categorize: sunt necesare cel puțin 2 coșuri');
    if (!Array.isArray(part.items) || !part.items.length) errors.push('categorize: lipsește lista „items”');
    if (errors.length) return errors;
    checkIds(part.bins, 'categorize.bins', errors);
    checkIds(part.items, 'categorize.items', errors);
    const binIds = part.bins.map((b) => b.id);
    for (const it of part.items) if (!binIds.includes(it.bin)) errors.push(`categorize.${it.id}: coșul „${it.bin}” nu există`);
    return errors;
  },

  count: (part) => part.items.length,
  answered: (part, ans) => countAnswered(part.items.map((i) => i.id), ans),
  empty: () => ({}),
  solution: (part) => Object.fromEntries(part.items.map((it) => [it.id, it.bin])),

  evaluate(part, ans) {
    return makeResult(
      part.items.map((it) => {
        const given = ans?.[it.id] ?? null;
        return { id: it.id, ok: given === it.bin, expected: it.bin, given };
      }),
    );
  },
};
