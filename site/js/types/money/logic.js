// money — plătește o sumă cu bancnote (lei), eventual în mai multe feluri diferite.
// { type:'money', allowed:[1,5,10], target:12, items:[{ id, label:'Primul fel' }, { id, label:'Al doilea fel' }],
//   distinct?: true,   // fiecare fel trebuie să fie diferit
//   fewest?: true }    // cu cât mai puține bancnote
// Răspuns: { [itemId]: { '10': 1, '1': 2 } }

import { cantitate } from '../../core/ro.js';
import { minPieces, moneyCombos, moneyKey, moneyPieces, moneySum } from '../../core/rules.js';
import { checkIds, makeResult } from '../_shared.js';

export const RON_NOTES = [1, 5, 10, 20, 50, 100, 200, 500];

const combosFor = (part) => {
  const all = moneyCombos(part.target, part.allowed);
  if (!part.fewest) return all;
  const min = minPieces(part.target, part.allowed);
  return all.filter((c) => moneyPieces(c) === min);
};

export default {
  type: 'money',

  validate(part) {
    const errors = [];
    if (!Array.isArray(part.allowed) || !part.allowed.length) errors.push('money: lipsește lista „allowed”');
    else if (part.allowed.some((d) => !RON_NOTES.includes(d))) errors.push('money: valori care nu sunt bancnote românești');
    if (!(Number.isInteger(part.target) && part.target > 0)) errors.push('money: target trebuie să fie un număr pozitiv');
    if (!Array.isArray(part.items) || !part.items.length) errors.push('money: lipsește lista „items”');
    if (errors.length) return errors;
    checkIds(part.items, 'money.items', errors);
    const combos = combosFor(part);
    if (!combos.length) errors.push(`money: ${part.target} nu se poate plăti exact cu ${part.allowed.join(', ')}`);
    if (part.distinct && combos.length < part.items.length) errors.push(`money: există doar ${combos.length} feluri, dar se cer ${part.items.length}`);
    return errors;
  },

  count: (part) => part.items.length,
  answered: (part, ans) => part.items.filter((it) => moneyPieces(ans?.[it.id]) > 0).length,
  empty: () => ({}),
  solution: (part) => {
    const combos = combosFor(part);
    return Object.fromEntries(part.items.map((it, i) => [it.id, combos[part.distinct ? i : 0]]));
  },

  evaluate(part, ans) {
    const min = minPieces(part.target, part.allowed);
    const seen = new Set();
    return makeResult(
      part.items.map((it) => {
        const combo = ans?.[it.id] ?? null;
        const sum = moneySum(combo);
        const pieces = moneyPieces(combo);
        let ok = false;
        let feedback = null;
        if (pieces > 0) {
          if (sum !== part.target) feedback = `Ai pus ${cantitate(sum, 'leu', 'lei')}, dar trebuiau ${cantitate(part.target, 'leu', 'lei')}.`;
          else if (part.fewest && pieces !== min) feedback = 'Suma e bună, dar se poate cu mai puține bancnote.';
          else ok = true;
        }
        if (ok && part.distinct) {
          const key = moneyKey(combo);
          if (seen.has(key)) { ok = false; feedback = 'Acest fel l-ai folosit deja. Caută altul!'; }
          seen.add(key);
        }
        return { id: it.id, ok, expected: part.target, given: combo, feedback };
      }),
    );
  },
};
