// Învață: săriturile pe axă (logica, pură). Veverița face `count` sărituri de câte `step`; axa merge de la 0 la 10 × step (rândul
// tablei acelei sărituri), ca mai multe sărituri să ajungă mai departe pe aceeași riglă.

import { cantitate } from '../../../core/ro.js';
import { equation, factorsOf, repeatedSum, spokenMath } from '../../text.js';

export const QUANTITIES = ['step', 'count', 'end'];
const MAX = 10;
const valid = (v) => Number.isInteger(v) && v >= 1 && v <= MAX;

export default {
  QUANTITIES,
  // desenul arată unde aterizează veverița, deci nimic nu se poate ascunde
  hideable: () => [],

  check(p) {
    const errors = [];
    for (const k of ['step', 'count']) if (!valid(p[k])) errors.push(`„${k}” între 1 și ${MAX}`);
    return errors;
  },

  controls: () => [
    { id: 'step', min: 1, max: MAX, axis: 'cols' },
    { id: 'count', min: 1, max: MAX, axis: 'cols' },
  ],

  initial: (p) => ({ step: p.step, count: p.count }),

  actions(p, s) {
    const list = [];
    for (const c of this.controls(p, s)) for (let v = c.min; v <= c.max; v++) if (v !== s[c.id]) list.push({ set: c.id, value: v });
    return list;
  },

  apply(p, s, a) {
    if (a.set !== 'step' && a.set !== 'count') return s;
    return { ...s, [a.set]: Math.min(MAX, Math.max(1, a.value)) };
  },

  derive: (p, s) => ({ step: s.step, count: s.count, end: s.step * s.count }),

  /** `landings`: numerele pe care aterizează veverița (numărătoarea din `step` în `step`). */
  texts(p, s) {
    const end = s.step * s.count;
    const [a, b] = factorsOf(s.count, s.step);
    const out = {
      reading: `${cantitate(s.count, 'săritură', 'sărituri')} de câte ${s.step}`,
      equation: equation(a, b, end),
      sum: repeatedSum(s.step, s.count, end),
      landings: Array.from({ length: s.count }, (_, i) => (i + 1) * s.step),
    };
    out.spoken = `${out.reading}: ${spokenMath(out.equation)}`;
    return out;
  },
};
