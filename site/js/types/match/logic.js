// match — unește elementele din stânga cu cele din dreapta (săgeți).
// { type:'match', left:[{ id, text, visual?, calc?, feedback? }], right:[{ id, text, visual?, calc? }], key:{ leftId: rightId } }
// Mai multe elemente din stânga pot merge la același element din dreapta; în dreapta pot exista distractori.
// Dacă ambele capete au `calc`, validatorul verifică egalitatea valorilor (și că nu există două variante corecte).
// Răspuns: { [leftId]: rightId }

import { calc } from '../../core/expr.js';
import { checkIds, countAnswered, feedbackFor, makeResult } from '../_shared.js';

export default {
  type: 'match',

  validate(part) {
    const errors = [];
    if (!Array.isArray(part.left) || !part.left.length) errors.push('match: lipsește lista „left”');
    if (!Array.isArray(part.right) || part.right.length < 2) errors.push('match: lista „right” are nevoie de cel puțin 2 elemente');
    if (errors.length) return errors;
    checkIds(part.left, 'match.left', errors);
    checkIds(part.right, 'match.right', errors);
    const rightIds = part.right.map((r) => r.id);
    for (const l of part.left) {
      const target = part.key?.[l.id];
      if (target === undefined) errors.push(`match.${l.id}: lipsește în „key”`);
      else if (!rightIds.includes(target)) errors.push(`match.${l.id}: „${target}” nu există în dreapta`);
      if (l.calc !== undefined) {
        const v = calc(l.calc);
        const same = part.right.filter((r) => r.calc !== undefined && calc(r.calc) === v).map((r) => r.id);
        if (!same.includes(target)) errors.push(`match.${l.id}: ${l.calc} = ${v}, dar perechea din „key” are altă valoare`);
        if (same.length > 1) errors.push(`match.${l.id}: mai multe elemente din dreapta au valoarea ${v}`);
      }
    }
    return errors;
  },

  expressions: (part) => [...part.left, ...part.right].filter((x) => x.calc !== undefined).map((x) => String(x.calc)),

  count: (part) => part.left.length,
  answered: (part, ans) => countAnswered(part.left.map((l) => l.id), ans),
  empty: () => ({}),
  solution: (part) => ({ ...part.key }),

  evaluate(part, ans) {
    return makeResult(
      part.left.map((l) => {
        const given = ans?.[l.id] ?? null;
        const ok = given !== null && given === part.key[l.id];
        return { id: l.id, ok, expected: part.key[l.id], given, feedback: ok ? null : feedbackFor(l.feedback, given) };
      }),
    );
  },
};
