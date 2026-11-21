// Învață: zidul fracțiilor (logica, pură). Rândurile sunt întregul tăiat în 1, 2, … 10 părți egale; copilul alege un rând (numitorul)
// și câte bucăți (numărătorul), iar zidul arată ce fracții din alte rânduri se termină exact în același loc (fracțiile egale).

import { fractionWords } from '../../../core/ro.js';
import { equivalents, fractionText, reduce } from '../../fractions.js';

export const QUANTITIES = ['den', 'num', 'value'];
export const HIDEABLE = [];
export const ROWS = 10;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default {
  QUANTITIES,
  HIDEABLE,

  check(p) {
    const errors = [];
    if (!Number.isInteger(p.den) || p.den < 1 || p.den > ROWS) errors.push(`„den” între 1 și ${ROWS}`);
    if (!Number.isInteger(p.num) || p.num < 1 || p.num > p.den) errors.push('„num” între 1 și den');
    return errors;
  },

  /** Rândul (vertical, aliniat cu rândurile zidului) și câte bucăți (orizontal, aliniat cu bucățile rândului ales). */
  controls: (p, s) => [
    { id: 'den', min: 1, max: ROWS },
    { id: 'num', min: 1, max: s.den },
  ],

  initial: (p) => ({ den: p.den, num: p.num }),

  actions(p, s) {
    const list = [];
    for (const c of this.controls(p, s)) for (let v = c.min; v <= c.max; v++) if (v !== s[c.id]) list.push({ set: c.id, value: v });
    return list;
  },

  apply(p, s, a) {
    if (a.set === 'den') {
      const den = clamp(a.value, 1, ROWS);
      return { den, num: clamp(s.num, 1, den) };
    }
    if (a.set === 'num') return { ...s, num: clamp(a.value, 1, s.den) };
    if (a.tap) {
      const den = clamp(a.tap[0] + 1, 1, ROWS);
      return { den, num: clamp(a.tap[1] + 1, 1, den) };
    }
    return s;
  },

  derive: (p, s) => ({ den: s.den, num: s.num, value: fractionText(reduce([s.num, s.den])) }),

  /** Fracțiile egale de pe zid, cu cea aleasă întâi: 3/6 = 1/2 = 2/4 = 4/8 = 5/10. */
  same(s) {
    const others = equivalents([s.num, s.den], ROWS).filter(([, d]) => d !== s.den);
    return [[s.num, s.den], ...others];
  },

  texts(p, s) {
    const all = this.same(s);
    const out = {
      markup: true,
      equation: all.map(([n, d]) => `{{f:${n}/${d}}}`).join(' = '),
      reading: fractionWords(s.num, s.den),
      sum: all.length > 1 ? 'Toate se termină în același loc pe zid.' : 'Nicio altă fracție de pe zid nu se termină în același loc.',
    };
    out.spoken = all.length > 1 ? `${out.reading} este egal cu ${all.slice(1).map((f) => fractionWords(...f)).join(', cu ')}` : out.reading;
    return out;
  },
};
