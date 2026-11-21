// Regulile tipurilor temei „Termenul necunoscut” (js/fulger/kinds-ecuatii.js), verificate de tests/fulger.test.js pe întrebările
// generate. Fiecare regulă citește singură ecuația cu căsuța, își face calculul care o rezolvă și verifică intervalele și forma
// variantelor, fără generatoarele din site (că răspunsul e singurul care face ecuația adevărată verifică testul principal, cu solveBox).

import { calcOptions } from './fulger-1000.rules.js';

const inRange = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;

/** „□ + a = s” sau „a + □ = s”: [a, s], sau null. */
function termForm(text) {
  const m = /^(?:□ \+ (\d+)|(\d+) \+ □) = (\d+)$/.exec(text);
  return m ? [Number(m[1] ?? m[2]), Number(m[3])] : null;
}

/** „s − □ = r” (scăzătorul) sau „□ − a = r” (descăzutul): calculul care rezolvă ecuația și numerele ei, sau null. */
function subForm(text) {
  let m = /^(\d+) − □ = (\d+)$/.exec(text);
  if (m) return { solving: `${m[1]} − ${m[2]}`, nums: [Number(m[1]), Number(m[2])] };
  m = /^□ − (\d+) = (\d+)$/.exec(text);
  if (m) return { solving: `${m[2]} + ${m[1]}`, nums: [Number(m[1]), Number(m[2])] };
  return null;
}

/** Variantele unei ecuații, cu forma și intervalul calculului care o rezolvă (ca la calculele obișnuite). */
const solvedOptions = (q, solving, max, opts) => q.solving === solving && calcOptions({ text: solving, answer: q.answer, choices: q.choices }, max, opts);

/** Forma [0, 1, c, c + 1] (c e numărul adunat lângă căsuță), cu răspunsul printre variante. */
const balanceShape = (choices, answer, c) => choices.length === 4 && choices.includes(answer) && [0, 1, c, c + 1].every((d, i) => choices[i] - choices[0] === d);

/** O latură de comparat „a + b” cu termenii între `lo` și `hi`: suma, sau null. */
function sumSide(text, lo, hi) {
  const m = /^(\d+) \+ (\d+)$/.exec(text);
  return m && inRange(Number(m[1]), lo, hi) && inRange(Number(m[2]), lo, hi) ? Number(m[1]) + Number(m[2]) : null;
}

/** O latură „a × b” sau „n : d” din tablă (factorii, împărțitorul și câtul între 2 și 9): valoarea ei, sau null. */
function tableSide(text) {
  let m = /^(\d) × (\d)$/.exec(text);
  if (m && Number(m[1]) >= 2 && Number(m[2]) >= 2) return Number(m[1]) * Number(m[2]);
  m = /^(\d+) : (\d)$/.exec(text);
  if (!m || Number(m[2]) < 2 || Number(m[1]) % Number(m[2]) !== 0) return null;
  const q = Number(m[1]) / Number(m[2]);
  return inRange(q, 2, 9) ? q : null;
}

export const ECUATII_RULES = {
  'ec-termen-20': (q) => {
    const f = termForm(q.text);
    return Boolean(f) && inRange(f[0], 2, 9) && f[1] <= 20 && q.answer >= 2 && solvedOptions(q, `${f[1]} − ${f[0]}`, 30, { plausible: false });
  },
  'ec-scadere-20': (q) => {
    const f = subForm(q.text);
    return Boolean(f) && f.nums.every((n) => inRange(n, 1, 20)) && q.answer <= 20 && solvedOptions(q, f.solving, 30, { plausible: false });
  },
  'cmp-balanta-20': ({ left, right }) => [left, right].every((s) => sumSide(s, 2, 9) !== null && sumSide(s, 2, 9) <= 18),
  'ec-termen-100': (q) => {
    const f = termForm(q.text);
    return Boolean(f) && inRange(f[0], 11, 79) && f[1] <= 99 && inRange(q.answer, 11, 79) && solvedOptions(q, `${f[1]} − ${f[0]}`, 100);
  },
  'ec-scadere-100': (q) => {
    const f = subForm(q.text);
    return Boolean(f) && f.nums.every((n) => inRange(n, 11, 99)) && q.answer <= 99 && solvedOptions(q, f.solving, 100);
  },
  'cmp-balanta-100': ({ left, right }) => [left, right].every((s) => sumSide(s, 11, 59) !== null && sumSide(s, 11, 59) <= 99),
  'ec-balanta': (q) => {
    // „a + b = □ + c” (în orice ordine): □ = a + b − c, iar forma aduce a + b printre variante când răspunsul stă pe primele locuri
    const m = /^(?:(\d+) \+ (\d+) = (?:□ \+ (\d+)|(\d+) \+ □)|(?:□ \+ (\d+)|(\d+) \+ □) = (\d+) \+ (\d+))$/.exec(q.text);
    if (!m) return false;
    const [a, b] = m[1] ? [Number(m[1]), Number(m[2])] : [Number(m[7]), Number(m[8])];
    const c = Number(m[3] ?? m[4] ?? m[5] ?? m[6]);
    return inRange(a, 2, 15) && inRange(b, 2, 9) && inRange(c, 2, 9) && q.answer === a + b - c && q.solving === `${a + b} − ${c}` && balanceShape(q.choices, q.answer, c);
  },
  'ec-doi-pasi': (q) => {
    // „□ + c = p × q” (sau invers): întâi produsul, apoi scăderea; „□ − c = n : d”: întâi câtul, apoi adunarea
    let m = /^(?:□ \+ (\d) = (\d) × (\d)|(\d) × (\d) = □ \+ (\d))$/.exec(q.text);
    if (m) {
      const [c, p, r] = m[1] ? [Number(m[1]), Number(m[2]), Number(m[3])] : [Number(m[6]), Number(m[4]), Number(m[5])];
      return p * r <= 60 && q.answer === p * r - c && q.answer >= 2 && solvedOptions(q, `${p * r} − ${c}`, 70);
    }
    m = /^□ − (\d) = (\d+) : (\d)$/.exec(q.text);
    if (!m) return false;
    const quotient = tableSide(`${m[2]} : ${m[3]}`);
    return quotient !== null && q.answer === quotient + Number(m[1]) && solvedOptions(q, `${quotient} + ${m[1]}`, 30, { plausible: false });
  },
  'ec-termen-1000': (q) => {
    const f = termForm(q.text);
    return Boolean(f) && f.every((n) => n % 10 === 0) && inRange(f[0], 110, 790) && f[1] <= 990 && inRange(q.answer, 110, 790) && solvedOptions(q, `${f[1]} − ${f[0]}`, 1000);
  },
  'cmp-balanta-x': ({ left, right }) => [left, right].every((s) => tableSide(s) !== null) && Math.abs(tableSide(left) - tableSide(right)) <= 6,
};
