// Învață: mașina de numere (logica, pură). Intră un număr, mașina face pe rând 1–2 operații (`ops`: [['×', 4]], [['+', 20], ['−', 8]])
// și iese rezultatul; copilul știe ce trebuie să iasă (`out`) și caută ce a intrat. Glisorul alege numărul care intră (11 valori, de la
// `lo`); la o împărțire neexactă sau la un număr negativ, mașina se blochează. „Pe dos” pornește de la `out` și face operațiile inverse,
// de la ultima la prima (+ devine −, × devine :): drumul înapoi. Operațiile și numerele vin din parametri sau din `start`.
// Starea se schimbă doar prin apply(); vederea (view.js) desenează starea și trimite acțiunile.

import { NBSP, spokenMath } from '../../text.js';

export const QUANTITIES = ['input', 'fits', 'back'];
export const SPAN = 10;
const OPS = ['+', '−', '×', ':'];
const INVERSE = { '+': '−', '−': '+', '×': ':', ':': '×' };

/** O operație pe un număr; null dacă nu se poate (împărțire neexactă, rezultat negativ). */
export function run(op, a, k) {
  if (op === '+') return a + k;
  if (op === '−') return a - k >= 0 ? a - k : null;
  if (op === '×') return a * k;
  return k > 0 && a % k === 0 ? a / k : null;
}

/** Numerele de după fiecare operație, de la intrare (null de unde s-a blocat mașina). */
export function steps(ops, input) {
  const values = [input];
  for (const [op, k] of ops) values.push(values.at(-1) === null ? null : run(op, values.at(-1), k));
  return values;
}

/** Drumul înapoi: de la `out`, operațiile inverse, de la ultima la prima; ultimul număr e cel care a intrat. */
export function backwards(ops, out) {
  const values = [out];
  for (const [op, k] of [...ops].reverse()) values.push(values.at(-1) === null ? null : run(INVERSE[op], values.at(-1), k));
  return values;
}

const calc = (a, op, k, r) => `${a}${NBSP}${op}${NBSP}${k}${NBSP}=${NBSP}${r}`;

export default {
  QUANTITIES,
  // numărul care intră e chiar glisorul: nimic de ascuns
  hideable: () => [],

  check(p) {
    const errors = [];
    if (!Array.isArray(p.ops) || !p.ops.length || p.ops.length > 2 || !p.ops.every(([op, k]) => OPS.includes(op) && Number.isInteger(k) && k >= 1)) {
      return ['„ops”: 1–2 operații, fiecare [semnul, un număr natural]'];
    }
    const lo = p.lo ?? 0;
    const answer = backwards(p.ops, p.out).at(-1);
    if (!Number.isInteger(p.out) || answer === null) errors.push(`din ${p.out} nu se poate merge pe dos`);
    else if (answer < lo || answer > lo + SPAN) errors.push(`numărul care intră (${answer}) nu e pe glisor (${lo}–${lo + SPAN})`);
    return errors;
  },

  controls: (p, s) => [{ id: 'input', min: s.lo, max: s.lo + SPAN, axis: 'cols' }],

  initial: (p) => ({ ops: p.ops, out: p.out, lo: p.lo ?? 0, input: p.lo ?? 0, back: false }),

  actions(p, s) {
    const list = [{ toggle: 'back' }];
    for (let v = s.lo; v <= s.lo + SPAN; v++) if (v !== s.input) list.push({ set: 'input', value: v });
    return list;
  },

  apply(p, s, a) {
    if (a.toggle === 'back') return { ...s, back: !s.back };
    if (a.set !== 'input') return s;
    return { ...s, input: Math.min(s.lo + SPAN, Math.max(s.lo, Math.round(a.value))) };
  },

  derive(p, s) {
    const result = steps(s.ops, s.input).at(-1);
    return { input: s.input, fits: result === s.out, back: s.back };
  },

  /** Textele: `equation` (drumul înainte, cu ce iese), `reading`, `legend`, `extra` (drumul înapoi, la „Pe dos”) și `spoken`. */
  texts(p, s) {
    const forward = steps(s.ops, s.input);
    const out = {};
    const blocked = forward.indexOf(null);
    const shown = s.ops.map(([op, k], i) => (forward[i + 1] === null ? null : calc(forward[i], op, k, forward[i + 1]))).filter(Boolean);
    out.equation = shown.join(', ') || String(s.input);
    out.legend = [['cols', `intră ${s.input}`]];
    const result = forward.at(-1);
    out.reading =
      blocked > 0
        ? `Mașina s-a oprit: ${forward[blocked - 1]} nu se ${s.ops[blocked - 1][0] === ':' ? `împarte exact la ${s.ops[blocked - 1][1]}` : `poate micșora cu ${s.ops[blocked - 1][1]}`}.`
        : result === s.out
          ? `A ieșit ${result}, cât trebuia: a intrat ${s.input}.`
          : `A ieșit ${result}, dar trebuia să iasă ${s.out}.`;
    if (s.back) {
      const back = backwards(s.ops, s.out);
      const inv = [...s.ops].reverse().map(([op, k], i) => calc(back[i], INVERSE[op], k, back[i + 1]));
      out.extra = `Pe dos: ${inv.join(', ')}. A intrat ${back.at(-1)}.`;
    }
    out.spoken = `${out.reading} ${spokenMath(out.equation)}`;
    return out;
  },
};
