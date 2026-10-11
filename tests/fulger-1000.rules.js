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
export function numberAnswer(q, expected) {
  const nums = optionValues(q);
  return (
    Number.isInteger(expected) &&
    nums.every(Number.isInteger) &&
    nums.every((n, i) => i === 0 || n > nums[i - 1]) &&
    Number(q.options[q.answer].text) === expected
  );
}

// Formele fixe ale variantelor (deplasările față de cea mai mică). Cu răspunsul pe un loc la întâmplare, forma nu-l arată.
const GRID = [0, 10, 100, 110]; // o zece și o sută
const GRID10 = [0, 1, 10, 11]; // o unitate și o zece
const LINE = [0, 1, 2, 3]; // patru numere la rând
const TENS = [0, 10, 20, 30]; // patru zeci la rând
const HUNDREDS = [0, 100, 200, 300]; // patru sute la rând
const PLACE = [0, 1, 10, 100]; // câte o greșeală pe fiecare ordin
const SHAPES = [GRID, GRID10, LINE, TENS, HUNDREDS, PLACE];

/** Variantele au una dintre formele date și îl cuprind pe răspuns. */
export function isShape(values, answer, shapes = SHAPES) {
  const v = [...values].sort((a, b) => a - b);
  return v.length === 4 && v.includes(answer) && shapes.some((shape) => shape.every((d, i) => v[i] - v[0] === d));
}

/** O unitate și o zece în aceeași sută cu răspunsul (numerele citite, când sutele se văd sau se aud). */
export const inSameHundred = (values, answer) => isShape(values, answer, [GRID10]) && values.every((x) => Math.floor(x / 100) === Math.floor(answer / 100));

/** Calculul trece peste ordin: la doi termeni, pe coloane; la trei, o coloană adună peste 9. */
function hasCrossing(text) {
  const nums = text.split(/ [+−] /).map(Number);
  if (nums.length === 2) return crossings(text.includes('−') ? '-' : '+', nums[0], nums[1]) > 0;
  return [1, 10, 100].some((p) => nums.reduce((s, x) => s + (Math.floor(x / p) % 10), 0) >= 10);
}

/**
 * Variantele unui calcul (`choice`), între `min` și `max`, într-o formă a familiei potrivite calculului, ca nici unitățile să nu dea
 * răspunsul: sute rotunde → sute la rând; unitățile rezultatului vizibile în calcul (scăzătorul rotund, sau la adunare cel mult un
 * termen cu unități) → pătratul cu zeci și sute sau zeci la rând; cu trecere → pătratul, unități și zeci sau zeci la rând (fără numere
 * la rând); altfel, pătratul, unități și zeci sau numere la rând. Cu `plausible`, nicio variantă absurdă (o sumă mai mică decât un termen, o diferență mai mare
 * decât descăzutul) ori de câte ori o formă a familiei are măcar trei locuri pentru răspuns printre variantele plauzibile. La calculele
 * cu o cifră (`plausible: false`), orice formă.
 */
export function calcOptions({ text, answer, choices }, max, { min = 0, plausible = true } = {}) {
  const nums = text.split(/ [+−] /).map(Number);
  const minus = text.includes('−');
  const inside = choices.every((c) => c >= min && c <= max);
  if (!plausible) return isShape(choices, answer) && inside;
  const keepsUnits = minus ? nums[1] % 10 === 0 : nums.filter((n) => n % 10 !== 0).length <= 1;
  const family = nums.every((n) => n % 100 === 0) ? [HUNDREDS] : keepsUnits ? [GRID, TENS] : hasCrossing(text) ? [GRID, GRID10, TENS] : [GRID, GRID10, LINE];
  const lo = Math.max(min, minus ? 0 : Math.max(...nums) + 1);
  const hi = Math.min(max, minus ? nums[0] - 1 : max);
  const room = family.some((shape) => shape.filter((d) => answer - d >= lo && answer - d + shape.at(-1) <= hi).length >= 3);
  return isShape(choices, answer, family) && inside && (!room || choices.every((c) => c >= lo && c <= hi));
}

/**
 * Variantele „în pătrat” ale unui calcul: {x, x + 10, x + 100, x + 110}, cu răspunsul printre ele, toate între 0 și 999 și niciuna
 * egală cu un termen (forma nu arată răspunsul, iar unitățile sunt aceleași la toate).
 */
export function isGrid(values, answer, terms = []) {
  const v = [...values].sort((a, b) => a - b);
  return (
    v.length === 4 &&
    v[1] - v[0] === 10 &&
    v[2] - v[0] === 100 &&
    v[3] - v[0] === 110 &&
    v[0] >= 0 &&
    v[3] <= 999 &&
    v.includes(answer) &&
    !v.some((x) => terms.includes(x))
  );
}

/** Câte treceri peste ordin are calculul: la adunare, coloanele care trec de 9; la scădere, împrumuturile. */
export function crossings(op, a, b) {
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
    const n = 100 * s + 10 * z + u;
    // numele desenului spune mărgelele, nu numărul (numărul e chiar răspunsul); variantele de trei cifre, într-o formă fixă
    const spoken = typeof f.alt === 'string' && !f.alt.includes(String(n));
    return inRange(s, 1, 9) && inRange(z, 0, 9) && inRange(u, 0, 9) && spoken && numberAnswer(q, n) && isShape(optionValues(q), n) && optionValues(q).every((x) => inRange(x, 100, 999));
  },

  'nr-litere': (q) => {
    const n = Number(q.options[q.answer]?.text);
    // variantele în aceeași sută (sutele se aud în cuvinte), fără 4007 și 47 (care se deosebeau după lungime), într-o formă fixă
    return (
      !q.figure &&
      inRange(n, 100, 999) &&
      q.prompt === `Scrie cu cifre: ${numberToWords(n)}` &&
      numberAnswer(q, n) &&
      inSameHundred(optionValues(q), n)
    );
  },

  'op-sute': ({ text, answer, choices }) => {
    const [a, b] = terms(text);
    const op = text.includes('−') ? '-' : '+';
    // variantele sunt sute la rând, niciuna 0
    return (
      a % 100 === 0 &&
      b % 100 === 0 &&
      inRange(answer, 400, 700) &&
      crossings(op, a, b) === 0 &&
      choices.every((c) => c % 100 === 0 && c > 0) &&
      calcOptions({ text, answer, choices }, 1000, { min: 100, plausible: false })
    );
  },

  'nr-extins': ({ text, answer, choices }) => {
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
      answer === parts.reduce((s, x) => s + x, 0) &&
      inSameHundred(choices, answer)
    );
  },

  'cmp-sute': ({ left, right }) => [left, right].every((x) => inRange(Number(x), 100, 999) && Number(x) % 10 === 0),

  'sort-3-sute': ({ numbers, dir }) =>
    numbers.length === 3 &&
    dir === 'asc' &&
    numbers.every((x) => inRange(x, 100, 999) && x % 10 === 0) &&
    new Set(numbers.map((x) => Math.floor(x / 100))).size === 3,

  // al doilea termen are cel puțin 3: cu 1 sau 2, variantele plauzibile n-ar încăpea în jurul răspunsului
  'add-1000-fara': (q) => plainOp(q, { maxA: 899 }) && !q.text.includes('−') && terms(q.text)[1] >= 3 && calcOptions(q, 999),
  'sub-1000-fara': (q) => plainOp(q) && q.text.includes('−') && terms(q.text)[1] >= 3 && calcOptions(q, 999),

  'op-zeci-sute': (q) => {
    const [, b] = terms(q.text);
    return plainOp(q) && (b % 100 === 0 ? b <= 800 : b % 10 === 0 && b < 100) && calcOptions(q, 999);
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

  'add-3op-1000': ({ text, answer, choices }) => {
    const t = terms(text);
    return (
      calcOptions({ text, answer, choices }, 999) &&
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

  'add-1000-cu': ({ text, answer, choices }) => {
    const [a, b] = terms(text);
    const [, , ua] = szu(a);
    const [, , ub] = szu(b);
    // o singură trecere, la unități; variantele într-o formă fixă, plauzibile, fără termenii calculului
    return !text.includes('−') && inRange(answer, 110, 889) && crossings('+', a, b) === 1 && ua + ub >= 10 && calcOptions({ text, answer, choices }, 999) && !choices.some((c) => c === a || c === b);
  },

  'sub-1000-cu': ({ text, answer, choices }) => {
    const [a, b] = terms(text);
    const [, , ua] = szu(a);
    const [, , ub] = szu(b);
    // un singur împrumut, luat din zeci; variantele într-o formă fixă, plauzibile, fără termenii calculului
    return text.includes('−') && inRange(answer, 110, 889) && crossings('-', a, b) === 1 && ua < ub && calcOptions({ text, answer, choices }, 999) && !choices.some((c) => c === a || c === b);
  },
};
