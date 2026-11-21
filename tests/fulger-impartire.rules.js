// Regulile tipurilor temei „Împărțirea” (js/fulger/kinds-impartire.js), verificate de tests/fulger.test.js pe întrebările generate.
// Fiecare regulă citește singură calculul, ecuația cu căsuța sau cerința și recalculează răspunsul, intervalele și forma variantelor cu
// codul ei, fără generatoarele din site.

import { numberAnswer } from './fulger-1000.rules.js';

const inRange = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
const SMALL = [2, 3, 4, 5, 10];

/** O împărțire „n : d” exactă: [n, d, cât], sau null. */
function division(text) {
  const m = /^(\d+) : (\d+)$/.exec(String(text));
  if (!m) return null;
  const [n, d] = [Number(m[1]), Number(m[2])];
  return d > 0 && n % d === 0 ? [n, d, n / d] : null;
}

/** Un fapt din tablă: împărțitorul printre `divisors`, câtul 2–10, deîmpărțitul cel puțin 10. */
const tableFact = (text, divisors) => {
  const f = division(text);
  return Boolean(f) && divisors.includes(f[1]) && inRange(f[2], 2, 10) && f[0] >= 10;
};

/** Fiecare cifră a deîmpărțitului (de două cifre) se împarte exact, iar câtul are două cifre: 84 : 4, 80 : 4. */
const digitwise = (n, d) => inRange(n, 10, 99) && inRange(d, 2, 9) && Math.floor(n / 10) % d === 0 && (n % 10) % d === 0 && n / d >= 10;

/** Patru numere la rând, crescătoare, cu răspunsul printre ele, între `min` și `max`. */
const consecutive = (values, answer, min, max) =>
  values.length === 4 && values.includes(answer) && values.every((x, i) => i === 0 || x - values[i - 1] === 1) && values[0] >= min && values[3] <= max;

/** Patru multipli la rând ai lui `step`, cu răspunsul printre ei, între `min` și `max`. */
const stepped = (values, answer, step, min, max) =>
  values.length === 4 && values.includes(answer) && values.every((x, i) => (i === 0 ? x % step === 0 : x - values[i - 1] === step)) && values[0] >= min && values[3] <= max;

/** Forma [0, 1, 10, 11] (o unitate și o zece), cu răspunsul printre ele. */
const grid10 = (values, answer) => values.length === 4 && values.includes(answer) && [0, 1, 10, 11].every((d, i) => values[i] - values[0] === d);

/** O latură de comparat: un număr, o împărțire exactă sau un produs „a × b”; valoarea ei sau null. */
function sideValue(text, { divisions, products = false }) {
  if (/^\d+$/.test(text)) return Number(text);
  const f = division(text);
  if (f) return divisions(f) ? f[2] : null;
  const m = products && /^(\d) × (\d)$/.exec(text);
  return m ? Number(m[1]) * Number(m[2]) : null;
}

/** O ecuație cu căsuța de felul „□ : d = q” (deîmpărțitul) sau „n : □ = q” (împărțitorul): ce lipsește și numerele ei. */
function boxDivision(q) {
  if (q.mode !== 'choice') return null;
  let m = /^□ : (\d+) = (\d+)$/.exec(q.text);
  if (m) return { missing: 'dividend', d: Number(m[1]), q: Number(m[2]), n: Number(m[1]) * Number(m[2]) };
  m = /^(\d+) : □ = (\d+)$/.exec(q.text);
  if (m && Number(m[1]) % Number(m[2]) === 0) return { missing: 'divisor', n: Number(m[1]), q: Number(m[2]), d: Number(m[1]) / Number(m[2]) };
  return null;
}

/** O problemă scurtă: totalul, câți copii sau câte într-o cutie și câtul; felul ei vine din cerință și se potrivește cu `ask`. */
function shortProblem(q) {
  const text = q.prompt.replace(/ /g, ' ');
  let m = /^(\d+) (?:de )?\S+ la (\d+) copii\. (Câte|Câți) are fiecare\?$/.exec(text);
  if (m) return { op: 'parti', n: Number(m[1]), d: Number(m[2]) };
  m = /^(\d+) (?:de )?\S+, câte (\d+) în cutie\. Câte cutii\?$/.exec(text);
  if (m) return { op: 'grupe', n: Number(m[1]), d: Number(m[2]) };
  return null;
}

const optionValues = (q) => q.choices.map((id) => Number(q.options[id].text));

/** Regula unei probleme: împărțirea e exactă, cu împărțitorul din listă, iar variantele sunt patru câturi la rând. */
function problemRule(q, divisors) {
  const p = shortProblem(q);
  if (!p || p.op !== q.ask?.op || !divisors.includes(p.d) || p.n % p.d !== 0) return false;
  const answer = p.n / p.d;
  return inRange(answer, 2, 10) && p.n >= 10 && numberAnswer(q, answer) && consecutive(optionValues(q), answer, 1, 13);
}

export const IMPARTIRE_RULES = {
  'imp-tabla-mica': (q) => tableFact(q.text, SMALL) && consecutive(q.choices, q.answer, 1, 13),
  'cmp-imp-tabla-mica': ({ left, right }) => [left, right].every((s) => sideValue(s, { divisions: (f) => tableFact(`${f[0]} : ${f[1]}`, SMALL) }) !== null),
  'imp-scadere-repetata': (q) => {
    const text = q.prompt.replace(/ /g, ' ');
    const m = /^(\d+)((?: − \d+)+) = 0, deci (\d+) : (\d+) = \?$/.exec(text);
    if (!m) return false;
    const subtrahends = m[2].match(/\d+/g).map(Number);
    const [n, d] = [Number(m[1]), Number(m[4])];
    // aceeași scădere, de 2–4 ori, până la 0; răspunsul e de câte ori am scăzut
    return (
      Number(m[3]) === n &&
      inRange(d, 2, 9) &&
      subtrahends.every((x) => x === d) &&
      inRange(subtrahends.length, 2, 4) &&
      n === d * subtrahends.length &&
      numberAnswer(q, subtrahends.length) &&
      consecutive(optionValues(q), subtrahends.length, 1, 13)
    );
  },
  'imp-problema-mica': (q) => problemRule(q, SMALL),
  'imp-tabla': (q) => tableFact(q.text, [2, 3, 4, 5, 6, 7, 8, 9, 10]) && consecutive(q.choices, q.answer, 1, 13),
  'cmp-imp-tabla': ({ left, right }) =>
    [left, right].every((s) => sideValue(s, { divisions: (f) => tableFact(`${f[0]} : ${f[1]}`, [2, 3, 4, 5, 6, 7, 8, 9, 10]), products: true }) !== null),
  'imp-lipsa': (q) => {
    const b = boxDivision(q);
    if (!b || !inRange(b.d, 2, 9) || !inRange(b.q, 2, 10) || b.n < 10) return false;
    // deîmpărțitul: multipli ai împărțitorului; împărțitorul: patru numere la rând între 2 și 10
    return b.missing === 'dividend' ? q.answer === b.n && stepped(q.choices, b.n, b.d, b.d, 100) : q.answer === b.d && consecutive(q.choices, b.d, 2, 10);
  },
  'imp-problema': (q) => problemRule(q, [2, 3, 4, 5, 6, 7, 8, 9, 10]),
  'imp-2c': (q) => {
    const f = division(q.text);
    return Boolean(f) && digitwise(f[0], f[1]) && grid10(q.choices, q.answer) && q.choices[0] >= 1 && q.choices[3] < f[0];
  },
  'imp-lipsa-2c': (q) => {
    const b = boxDivision(q);
    if (!b || !digitwise(b.n, b.d)) return false;
    // deîmpărțitul: patru zeci la rând, cu aceleași unități (ultima cifră a lui 32 × 3 se află dintr-o privire); împărțitorul: 2–9
    const tens = (v) => v.length === 4 && v.includes(b.n) && v.every((x, i) => i === 0 || x - v[i - 1] === 10) && v[0] >= 10 && v[3] <= 99;
    return b.missing === 'dividend' ? q.answer === b.n && tens(q.choices) : q.answer === b.d && consecutive(q.choices, b.d, 2, 9);
  },
  'cmp-imp-2c': ({ left, right }) => {
    const values = [left, right].map((s) => sideValue(s, { divisions: (f) => digitwise(f[0], f[1]) }));
    return values.every((v) => v !== null && v >= 10);
  },
};
