// Regulile tipurilor temei „Adunări și scăderi până la 1000” (js/fulger/kinds-calcule-1000.js), verificate de tests/fulger.test.js
// pe întrebările generate. Fiecare regulă citește singură datele întrebării (calculul, cerința, desenul, variantele) și recalculează
// răspunsul cu codul ei: trecerile le numără pe coloane (`crossings`), cifra lipsă o caută printre cele 10 cifre, estimarea o rotunjește.
// Verifică și forma variantelor, ca să nu arate răspunsul: „în pătrat” la calcule, ferestre de patru valori la rând, nicio variantă
// egală cu un termen, calculul greșit fără o greșeală vizibilă din ochi.

import { crossings, isGrid, numberAnswer } from './fulger-1000.rules.js';

const terms = (text) => text.split(/ [+−] /).map(Number);
const opOf = (text) => (text.includes('−') ? '-' : '+');
const inRange = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
const value = (op, a, b) => (op === '+' ? a + b : a - b);
const round100 = (n) => Math.round(n / 100) * 100;
const optionValues = (q) => q.choices.map((id) => Number(q.options[id].text));
/** Patru valori la rând, cu pasul dat. */
const isWindow = (values, step) => values.length === 4 && values.every((x, i) => i === 0 || x - values[i - 1] === step);

/** Coloanele (0 = unități) în care calculul trece peste ordin, numărate la fel ca `crossings`. */
function crossingPlaces(op, a, b) {
  const places = [];
  let carry = 0;
  for (let i = 0, x = a, y = b; x > 0 || y > 0; i++, x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    const d = op === '+' ? (x % 10) + (y % 10) + carry : (x % 10) - (y % 10) - carry;
    carry = op === '+' ? (d >= 10 ? 1 : 0) : d < 0 ? 1 : 0;
    if (carry) places.push(i);
  }
  return places;
}

/** Un calcul cu doi termeni, cu numărul de treceri cerut, rezultatul între 110 și 889 și variantele „în pătrat”. */
function gridTwoTerms({ text, answer, choices }, { op, count, minA = 100, minB = 10 }) {
  const t = terms(text);
  const [a, b] = t;
  return (
    t.length === 2 &&
    opOf(text) === op &&
    a >= minA &&
    b >= minB &&
    answer === value(op, a, b) &&
    inRange(answer, 110, 889) &&
    crossings(op, a, b) === count &&
    isGrid(choices, answer, t)
  );
}

/** „a op b = c” dintr-o variantă-calcul. */
function parseCalc(text) {
  const m = /^(\d+) ([+−]) (\d+) = (\d+)$/.exec(text);
  return m && { a: Number(m[1]), op: m[2] === '+' ? '+' : '-', b: Number(m[3]), c: Number(m[4]) };
}

export const CALC_1000_RULES = {
  'zeci-peste-suta': (q) => {
    const [a, b] = terms(q.text);
    const op = opOf(q.text);
    // zeci rotunde, o singură trecere (la zeci), toate variantele rotunde (unitățile nu deosebesc nimic) și fără termenii calculului
    return (
      terms(q.text).length === 2 &&
      q.answer === value(op, a, b) &&
      inRange(q.answer, 110, 890) &&
      a % 10 === 0 &&
      b % 10 === 0 &&
      b < 100 &&
      crossings(op, a, b) === 1 &&
      crossingPlaces(op, a, b)[0] === 1 &&
      q.choices.every((c) => c % 10 === 0 && c !== a && c !== b)
    );
  },

  'nr-regrupat': (q) => {
    const m = /^Cât fac (.+)\?$/.exec(q.prompt);
    if (q.figure || !m) return false;
    const UNITS = { sută: [100, true], sute: [100, false], zece: [10, true], zeci: [10, false], unitate: [1, true], unități: [1, false] };
    const parts = m[1].split(/, | și /).map((p) => /^(\d+) (\S+)$/.exec(p));
    if (parts.length < 2 || parts.some((p) => !p || !UNITS[p[2]])) return false;
    // acordul („1 sută”, „13 zeci”), ordinele de la mare la mic, fiecare o dată, și cel puțin unul cu 10 sau mai mult
    const orders = parts.map((p) => UNITS[p[2]][0]);
    const counts = parts.map((p) => Number(p[1]));
    const agreed = parts.every((p, i) => (counts[i] === 1) === UNITS[p[2]][1] && counts[i] >= 1 && counts[i] <= 19);
    const n = counts.reduce((s, c, i) => s + c * orders[i], 0);
    return (
      agreed &&
      orders.every((o, i) => i === 0 || o < orders[i - 1]) &&
      parts.some((p, i) => orders[i] < 100 && counts[i] >= 10) &&
      orders[0] === 100 &&
      inRange(n, 110, 889) &&
      numberAnswer(q, n) &&
      isGrid(optionValues(q), n)
    );
  },

  'pana-la-suta': (q) => {
    const m = /^Cât adaugi la (\d+) ca să ajungi la (\d+)\?$/.exec(q.prompt);
    if (q.figure || !m) return false;
    const [n, target] = [Number(m[1]), Number(m[2])];
    const options = optionValues(q);
    // patru numere din 10 în 10 (cu aceleași unități), sub 100: nimic nu se elimină din ochi
    return (
      n % 100 !== 0 &&
      target === Math.ceil(n / 100) * 100 &&
      inRange(n, 101, 989) &&
      target - n >= 10 &&
      numberAnswer(q, target - n) &&
      isWindow(options, 10) &&
      options[0] >= 10 &&
      options[3] <= 99
    );
  },

  'cmp-fara-calcul-1000': ({ left, right }) => {
    const sides = [left, right].map((s) => ({ op: opOf(s), t: terms(s) }));
    if (sides.some((s) => s.t.length !== 2 || s.t.some((x) => !inRange(x, 1, 999)))) return false;
    const values = sides.map((s) => value(s.op, ...s.t));
    if (values.some((v) => !inRange(v, 100, 999))) return false;
    const [[a1, b1], [a2, b2]] = sides.map((s) => s.t);
    const near = (x, y) => Math.abs(x - y) <= 90;
    // se compară fără calcul: același prim termen, același descăzut sau scăzător, termenii schimbați, ori compensați
    if (sides[0].op !== sides[1].op) return false;
    if (sides[0].op === '+') {
      const sameFirst = a1 === a2 && b1 !== b2 && near(b1, b2);
      const swapped = a1 === b2 && b1 === a2 && a1 !== b1;
      const balanced = a1 + b1 === a2 + b2 && a1 !== a2 && Math.abs(a1 - a2) <= 10;
      return sameFirst || swapped || balanced;
    }
    return (a1 === a2 && b1 !== b2 && near(b1, b2)) || (b1 === b2 && a1 !== a2 && near(a1, a2));
  },

  'add-1000-o-trecere': (q) => gridTwoTerms(q, { op: '+', count: 1, minB: 11 }),
  'sub-1000-un-imprumut': (q) => gridTwoTerms(q, { op: '-', count: 1, minA: 201, minB: 11 }),

  'cifra-lipsa-1000': (q) => {
    const f = q.figure;
    const s = q.solved;
    if (q.prompt !== 'Ce cifră lipsește?' || f?.v !== 'column-op' || s?.v !== 'column-op') return false;
    const op = f.op === '-' ? '-' : f.op === '+' ? '+' : null;
    const rows = [...String(f.terms).split(','), String(f.result)];
    if (!op || rows.length !== 3 || rows.join('').split('?').length !== 2 || rows.some((r) => !/^[\d?]{3}$/.test(r))) return false;
    // exact o cifră face calculul adevărat, fără 0 în față
    const fits = [];
    for (let d = 0; d <= 9; d++) {
      const [a, b, c] = rows.map((r) => r.replace('?', String(d)));
      if ([a, b, c].some((x) => x[0] === '0')) continue;
      if (value(op, Number(a), Number(b)) === Number(c)) fits.push(d);
    }
    if (fits.length !== 1) return false;
    const [a, b, c] = rows.map((r) => Number(r.replace('?', String(fits[0]))));
    // rezolvarea: același calcul, întreg, cu coloana cifrei găsite evidențiată
    const row = rows.findIndex((r) => r.includes('?'));
    const place = 2 - rows[row].indexOf('?');
    const solvedOk = s.op === f.op && s.terms === `${a},${b}` && String(s.result) === String(c) && String(s.mark).toLowerCase() === 'uzs'[place];
    // cifra lipsă stă în coloana trecerii sau în cea din stânga ei: fără trecere, ar fi doar o adunare de cifre
    const crossing = crossingPlaces(op, a, b);
    const options = optionValues(q);
    return (
      solvedOk &&
      crossing.length === 1 &&
      [crossing[0], crossing[0] + 1].includes(place) &&
      numberAnswer(q, fits[0]) &&
      q.choices.every((id) => /^\d$/.test(q.options[id].text)) &&
      isWindow(options, 1)
    );
  },

  'calcul-gresit-1000': (q) => {
    if (q.prompt !== 'Care calcul e greșit?' || q.figure) return false;
    const calcs = q.choices.map((id) => parseCalc(q.options[id].text));
    if (calcs.some((c) => !c)) return false;
    const wrong = calcs.filter((c) => value(c.op, c.a, c.b) !== c.c);
    if (wrong.length !== 1 || q.options[q.answer].text !== `${wrong[0].a} ${wrong[0].op === '+' ? '+' : '−'} ${wrong[0].b} = ${wrong[0].c}`) return false;
    // fiecare calcul are o singură trecere; cel greșit are greșeala tipică a coloanei unde trece și nu se vede din ochi (o sumă mai
    // mare decât fiecare termen, o diferență mai mică decât descăzutul)
    const w = wrong[0];
    const step = 10 ** (crossingPlaces(w.op, w.a, w.b)[0] + 1);
    const typical = w.op === '+' ? w.c === w.a + w.b - step : w.c === w.a - w.b + step;
    const plausible = w.op === '+' ? w.c > w.a && w.c > w.b : w.c < w.a;
    return typical && plausible && calcs.every((c) => crossings(c.op, c.a, c.b) === 1 && inRange(value(c.op, c.a, c.b), 100, 999));
  },

  'estimare-sute': (q) => {
    const m = /^Cam cât face (\d+) ([+−]) (\d+)\?$/.exec(q.prompt);
    if (q.figure || !m) return false;
    const [a, op, b] = [Number(m[1]), m[2] === '+' ? '+' : '-', Number(m[3])];
    const exact = value(op, a, b);
    const estimate = value(op, round100(a), round100(b));
    const far = (n) => Math.abs((n % 100) - 50) >= 15;
    const cut = (n) => Math.floor(n / 100) * 100;
    const options = optionValues(q);
    return (
      far(a) && far(b) && far(exact) && a % 100 !== 0 && b % 100 !== 0 &&
      estimate === round100(exact) && // estimarea dă chiar suta rezultatului
      value(op, cut(a), cut(b)) !== estimate && // trunchierea dă altceva
      isWindow(options, 100) && // patru sute la rând, între 100 și 900
      options[0] >= 100 &&
      options[3] <= 900 &&
      numberAnswer(q, estimate)
    );
  },

  'add-1000-doua-treceri': (q) => gridTwoTerms(q, { op: '+', count: 2, minB: 11 }),
  'sub-1000-doua-imprumuturi': (q) => gridTwoTerms(q, { op: '-', count: 2, minA: 201, minB: 101 }),

  'add-3op-1000-cu': ({ text, answer, choices }) => {
    const t = terms(text);
    return (
      t.length === 3 &&
      !text.includes('−') &&
      t.every((x) => x >= 11) &&
      answer === t.reduce((s, x) => s + x, 0) &&
      inRange(answer, 110, 889) &&
      // cel puțin o coloană trece de 9
      [1, 10, 100].some((p) => t.reduce((s, x) => s + (Math.floor(x / p) % 10), 0) >= 10) &&
      isGrid(choices, answer, t)
    );
  },

  'compensare-1000': (q) => {
    const [a, b] = terms(q.text);
    const op = opOf(q.text);
    // al doilea termen e la 1–3 de o sută întreagă: sub ea la adunare, sub ea sau peste ea la scădere
    const off = b % 100;
    const nearRound = off >= 97 || (op === '-' && off >= 1 && off <= 3);
    return nearRound && b >= 97 && crossings(op, a, b) >= 1 && q.answer === value(op, a, b) && inRange(q.answer, 110, 889) && isGrid(q.choices, q.answer, [a, b]);
  },

  'pana-la-1000': (q) => {
    const m = /^Cât adaugi la (\d+) ca să ajungi la 1000\?$/.exec(q.prompt);
    if (q.figure || !m) return false;
    const n = Number(m[1]);
    return inRange(n, 111, 890) && n % 100 !== 0 && numberAnswer(q, 1000 - n) && isGrid(optionValues(q), 1000 - n, [n]);
  },
};
