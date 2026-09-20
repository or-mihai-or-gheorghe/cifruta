// Regulile tipurilor temei „Numere până la 1000” (js/fulger/kinds-1000.js), verificate de tests/fulger.test.js pe întrebările
// generate. Fiecare regulă citește singură datele întrebării (textul calculului, cerința, desenul) și recalculează răspunsul și
// limitele cu codul ei: trecerile le numără pe coloane, cu propagare, nu prin `trecere()` din site.

import { calc } from '../site/js/core/expr.js';
import { numberToWords } from '../site/js/core/ro.js';

const terms = (text) => text.split(/ [+−] /).map(Number);
const inRange = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
const szu = (n) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
const numbersIn = (text) => (String(text).match(/\d+/g) ?? []).map(Number);
const optionValues = (q) => q.choices.map((id) => Number(q.options[id].text));

/** Variantele unei întrebări cu cerință: patru numere diferite, crescătoare, iar răspunsul e cel așteptat. */
function numberAnswer(q, expected) {
  const nums = optionValues(q);
  return (
    Number.isInteger(expected) &&
    nums.every(Number.isInteger) &&
    nums.every((n, i) => i === 0 || n > nums[i - 1]) &&
    Number(q.options[q.answer].text) === expected
  );
}

/** Câte treceri peste ordin are calculul: la adunare, coloanele care trec de 9; la scădere, împrumuturile. */
function crossings(op, a, b) {
  let count = 0;
  let carry = 0;
  for (let x = a, y = b; x > 0 || y > 0; x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    const d = op === '+' ? (x % 10) + (y % 10) + carry : (x % 10) - (y % 10) - carry;
    carry = op === '+' ? (d >= 10 ? 1 : 0) : d < 0 ? 1 : 0;
    count += carry;
  }
  return count;
}

/** Un calcul fără trecere, cu termenii în limitele date. */
const plainOp = ({ text, answer }, { min = 10, maxA = 999 } = {}) => {
  const [a, b] = terms(text);
  const op = text.includes('−') ? '-' : '+';
  return inRange(a, 100, maxA) && b >= 1 && inRange(answer, min, 999) && crossings(op, a, b) === 0;
};

export const RULES_1000 = {
  'nr-numaratoare': (q) => {
    const f = q.figure;
    if (f?.v !== 'abacus' || f.places !== 'SZU') return false;
    const [s, z, u] = [f.S, f.Z, f.U];
    // numele desenului spune mărgelele, nu numărul (numărul e chiar răspunsul)
    const spoken = typeof f.alt === 'string' && !f.alt.includes(String(100 * s + 10 * z + u));
    return inRange(s, 1, 9) && inRange(z, 0, 9) && inRange(u, 0, 9) && spoken && numberAnswer(q, 100 * s + 10 * z + u);
  },

  'nr-litere': (q) => {
    const n = Number(q.options[q.answer]?.text);
    return !q.figure && inRange(n, 100, 999) && q.prompt === `Scrie cu cifre: ${numberToWords(n)}` && numberAnswer(q, n);
  },

  'op-sute': ({ text, answer, choices }) => {
    const [a, b] = terms(text);
    const op = text.includes('−') ? '-' : '+';
    // toate variantele sunt sute întregi, niciuna 0
    return (
      a % 100 === 0 && b % 100 === 0 && inRange(answer, 400, 700) && crossings(op, a, b) === 0 && choices.every((c) => c % 100 === 0 && c > 0)
    );
  },

  'nr-extins': ({ text, answer }) => {
    const parts = terms(text);
    // bucățile sunt sute, zeci și unități, fiecare ordin o singură dată, de la mare la mic
    const orders = parts.map((p) => (p >= 100 ? 2 : p >= 10 ? 1 : 0));
    const shaped = parts.every((p, i) => p > 0 && p % 10 ** orders[i] === 0 && p < 10 ** (orders[i] + 1));
    return (
      parts.length >= 2 &&
      shaped &&
      orders.every((o, i) => i === 0 || o === orders[i - 1] - 1 || o < orders[i - 1]) &&
      new Set(orders).size === orders.length &&
      inRange(answer, 100, 999) &&
      answer === parts.reduce((s, x) => s + x, 0)
    );
  },

  'cmp-sute': ({ left, right }) => [left, right].every((x) => inRange(Number(x), 100, 999) && Number(x) % 10 === 0),

  'sort-3-sute': ({ numbers, dir }) =>
    numbers.length === 3 &&
    dir === 'asc' &&
    numbers.every((x) => inRange(x, 100, 999) && x % 10 === 0) &&
    new Set(numbers.map((x) => Math.floor(x / 100))).size === 3,

  'add-1000-fara': (q) => plainOp(q, { maxA: 899 }) && !q.text.includes('−'),
  'sub-1000-fara': (q) => plainOp(q) && q.text.includes('−'),

  'op-zeci-sute': (q) => {
    const [, b] = terms(q.text);
    return plainOp(q) && (b % 100 === 0 ? b <= 800 : b % 10 === 0 && b < 100);
  },

  'cmp-1000': ({ left, right }) => [left, right].every((x) => inRange(Number(x), 85, 999)),

  'sort-4-1000': ({ numbers, dir }) => numbers.length === 4 && dir === 'asc' && numbers.every((x) => inRange(x, 100, 999)),

  'sir-1000': (q) => {
    if (q.figure) return false;
    const items = q.prompt.replace(/^Ce (urmează|lipsește)\? /, '').split(', ');
    if (items.length < 3 || items.some((x) => x !== '?' && !/^\d+$/.test(x))) return false;
    // „Ce urmează?” arată primii trei termeni, răspunsul vine la final; „Ce lipsește?” are semnul întrebării în mijloc
    const shown = items.map((x) => (x === '?' ? null : Number(x)));
    const full = shown.includes(null) ? shown : [...shown, null];
    const hole = full.indexOf(null);
    if (full.length !== 4 || hole < 1) return false;
    const pair = [0, 1, 2].find((i) => full[i] !== null && full[i + 1] !== null);
    if (pair === undefined) return false;
    const step = full[pair + 1] - full[pair];
    const answer = full[hole - 1] !== null ? full[hole - 1] + step : full[hole + 1] - step;
    const all = full.map((x, i) => (i === hole ? answer : x));
    return (
      [10, -10, 100, -100].includes(step) &&
      all.every((x, i) => i === 0 || x - all[i - 1] === step) &&
      all.every((x) => inRange(x, 110, 990)) &&
      // la pasul de 10, șirul nu trece peste sută
      (Math.abs(step) === 100 || Math.floor(all[0] / 100) === Math.floor(all[3] / 100)) &&
      numberAnswer(q, answer)
    );
  },

  'rotunjire-sute': (q) => {
    const [n] = numbersIn(q.prompt);
    const rounded = Math.round(n / 100) * 100;
    return (
      !q.figure &&
      inRange(n, 101, 999) &&
      n % 100 !== 50 && // numerele de la jumătate ar avea două răspunsuri la fel de bune
      n % 100 !== 0 &&
      q.prompt === `Cât e ${n} rotunjit la sute?` &&
      numberAnswer(q, rounded)
    );
  },

  'add-3op-1000': ({ text, answer }) => {
    const t = terms(text);
    return (
      t.length === 3 &&
      t.every((x) => x >= 1) &&
      inRange(answer, 100, 999) &&
      answer === t.reduce((s, x) => s + x, 0) &&
      // nicio coloană nu trece de 9
      [1, 10, 100].every((p) => t.reduce((s, x) => s + (Math.floor(x / p) % 10), 0) < 10)
    );
  },

  'cmp-expr-1000': ({ left, right }) => {
    const sides = [left, right];
    const values = sides.map((x) => calc(x));
    const plain = sides.every((x) => !/[+−]/.test(x) || crossings(x.includes('−') ? '-' : '+', ...terms(x)) === 0);
    return sides.some((x) => /[+−]/.test(x)) && plain && values.every((v) => inRange(v, 100, 999)) && Math.abs(values[0] - values[1]) <= 20;
  },

  'sort-4-1000-dir': ({ numbers }) => numbers.length === 4 && numbers.every((x) => inRange(x, 100, 999)),

  'add-1000-cu': ({ text, answer }) => {
    const [a, b] = terms(text);
    const [, , ua] = szu(a);
    const [, , ub] = szu(b);
    // o singură trecere, la unități
    return !text.includes('−') && inRange(answer, 100, 999) && crossings('+', a, b) === 1 && ua + ub >= 10;
  },

  'sub-1000-cu': ({ text, answer }) => {
    const [a, b] = terms(text);
    const [, , ua] = szu(a);
    const [, , ub] = szu(b);
    // un singur împrumut, luat din zeci
    return text.includes('−') && inRange(answer, 100, 999) && crossings('-', a, b) === 1 && ua < ub;
  },
};
