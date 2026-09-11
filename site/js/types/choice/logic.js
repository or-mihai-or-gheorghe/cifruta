// choice — una sau mai multe întrebări cu variante (alegere simplă sau multiplă).
// { type:'choice', items:[{ id, q, options:['50','5','40'] | [{id,text,visual}], correct:'50' | ['a','b'], multi?, calc?:'30+20', feedback? }] }
// Răspuns: { [itemId]: optionId | [optionIds] }

import { calc } from '../../core/expr.js';
import { checkIds, countAnswered, feedbackFor, makeResult } from '../_shared.js';

export const optionId = (o) => (typeof o === 'object' ? String(o.id) : String(o));
const correctOf = (item) => [].concat(item.correct ?? []).map(String);

export default {
  type: 'choice',

  validate(part) {
    const errors = [];
    if (!Array.isArray(part.items) || !part.items.length) return ['choice: lipsește lista „items”'];
    checkIds(part.items, 'choice.items', errors);
    for (const item of part.items) {
      const ids = (item.options ?? []).map(optionId);
      const corr = correctOf(item);
      if (ids.length < 2) errors.push(`choice.${item.id}: sunt necesare cel puțin 2 variante`);
      if (new Set(ids).size !== ids.length) errors.push(`choice.${item.id}: variante duplicate`);
      if (!corr.length) errors.push(`choice.${item.id}: lipsește „correct”`);
      for (const c of corr) if (!ids.includes(c)) errors.push(`choice.${item.id}: „${c}” nu este printre variante`);
      if (!item.multi && corr.length !== 1) errors.push(`choice.${item.id}: un singur răspuns corect (sau multi: true)`);
      if (item.calc !== undefined && String(calc(item.calc)) !== corr[0]) {
        errors.push(`choice.${item.id}: ${item.calc} = ${calc(item.calc)}, nu ${corr[0]}`);
      }
    }
    return errors;
  },

  expressions: (part) => part.items.filter((it) => it.calc !== undefined).map((it) => String(it.calc)),

  count: (part) => part.items.length,
  answered: (part, ans) => countAnswered(part.items.map((i) => i.id), ans),
  empty: () => ({}),
  solution: (part) => Object.fromEntries(part.items.map((it) => [it.id, it.multi ? correctOf(it) : correctOf(it)[0]])),

  evaluate(part, ans) {
    return makeResult(
      part.items.map((it) => {
        const corr = correctOf(it);
        const given = ans?.[it.id] ?? null;
        if (it.multi) {
          const sel = [...new Set([].concat(given ?? []).map(String))]; // o variantă aleasă de două ori contează o dată
          const hits = sel.filter((s) => corr.includes(s)).length;
          const wrong = sel.length - hits;
          return {
            id: it.id,
            ok: hits === corr.length && wrong === 0,
            credit: Math.max(0, (hits - wrong) / corr.length),
            expected: corr,
            given: sel,
          };
        }
        const single = typeof given === 'string' || typeof given === 'number' ? String(given) : null;
        const ok = single === corr[0];
        return { id: it.id, ok, expected: corr[0], given, feedback: ok ? null : feedbackFor(it.feedback, single) };
      }),
    );
  },
};
