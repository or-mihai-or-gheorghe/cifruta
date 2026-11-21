// Regulile tipurilor temei „Înmulțirea” (js/fulger/kinds-inmultire.js), verificate de tests/fulger.test.js pe întrebările generate.
// Fiecare regulă citește singură textul calculului, cerința sau desenul și recalculează răspunsul, intervalele și forma variantelor cu
// codul ei, fără generatoarele din site.

import { numberAnswer } from './fulger-1000.rules.js';

const inRange = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
const round10 = (x) => x % 10 === 0;

/** Factorii unui produs scris „a × b”, sau null. */
function factors(text) {
  const m = /^(\d+) × (\d+)$/.exec(String(text));
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/** Valoarea unei laturi de comparat: un număr, un produs „a × b” sau o sumă „x + y”; null altfel. */
function sideValue(text) {
  const f = factors(text);
  if (f) return f[0] * f[1];
  const sum = /^(\d+) \+ (\d+)$/.exec(text);
  if (sum) return Number(sum[1]) + Number(sum[2]);
  return /^\d+$/.test(text) ? Number(text) : null;
}

const rel = (a, b) => (a < b ? '<' : a > b ? '>' : '=');

/** Patru variante crescătoare, la pas egal (`step`), cu răspunsul printre ele, între `min` (exclus) și `max`. */
function stepped(choices, answer, step, { above, max }) {
  return (
    choices.length === 4 &&
    choices.includes(answer) &&
    choices.every((x, i) => i === 0 || x - choices[i - 1] === step) &&
    choices[0] > above &&
    choices[3] <= max
  );
}

/** Un calcul „o cifră × două cifre”: [cifra, numărul] dacă factorii au forma asta. */
function oneByTwo(text) {
  const f = factors(text);
  if (!f) return null;
  const [a, n] = [Math.min(...f), Math.max(...f)];
  return inRange(a, 2, 9) && inRange(n, 10, 99) ? [a, n] : null;
}

/** „□ × 6 = 42” (o ecuație cu căsuța): o singură căsuță, factorul cunoscut, produsul și factorul care lipsește. */
function missing(q) {
  const m = q.mode === 'choice' && /^(□|\d+) × (□|\d+) = (\d+)$/.exec(q.text);
  if (!m || [m[1], m[2]].filter((x) => x === '□').length !== 1) return null;
  const known = Number(m[1] === '□' ? m[2] : m[1]);
  const total = Number(m[3]);
  return total % known === 0 ? { known, total, factor: total / known } : null;
}

/** Variantele factorului lipsă: patru numere la rând, între 1 și 10 (factorul vizibil poate fi printre ele). */
function missingOptions(q, { factor }) {
  const values = q.choices;
  return q.answer === factor && values[0] >= 1 && values[3] <= 10 && values.every((x, i) => i === 0 || x - values[i - 1] === 1);
}

/** Pluralele care cer „Câți” (masculine); celelalte obiecte numărate cer „Câte”. */
const CATI = new Set(['pești', 'biscuiți']);
/** Ce arată fiecare emoji al grupelor (pluralul din cerință). */
const PLURAL = {
  mar: 'mere',
  para: 'pere',
  portocala: 'portocale',
  lamaie: 'lămâi',
  banana: 'banane',
  ou: 'ouă',
  stea: 'stele',
  balon: 'baloane',
  lalea: 'lalele',
  creion: 'creioane',
  castana: 'castane',
  peste: 'pești',
  biscuit: 'biscuiți',
};
const NBSP = ' ';

export const INMULTIRE_RULES = {
  'inm-tabla': ({ text, answer, choices }) => {
    const f = factors(text);
    if (!f || !f.every((x) => inRange(x, 2, 9)) || answer !== f[0] * f[1]) return false;
    // un rând al tablei: multiplii unuia dintre factori
    return f.some((step) => stepped(choices, answer, step, { above: Math.max(...f), max: 81 }));
  },
  'inm-adunare-repetata': (q) => {
    // suma, cu spații nedespărțite: stă pe un singur rând, ca niciun termen să nu rămână singur pe rândul următor
    const m = new RegExp(`^Cum scrii ca înmulțire\\? (\\d(?:${NBSP}\\+${NBSP}\\d)+)$`).exec(q.prompt);
    if (!m) return false;
    const terms = m[1].split(`${NBSP}+${NBSP}`).map(Number);
    const t = terms[0];
    if (!terms.every((x) => x === t) || !inRange(t, 2, 9) || !inRange(terms.length, 2, 6)) return false;
    const options = q.choices.map((id) => factors(q.options[id].text));
    // variantele „k × t”, cu k la rând (de la 2) și același termen: o singură variantă e egală cu suma, iar „t × n” nu apare
    return (
      options.every((f) => f && f[1] === t) &&
      options[0][0] >= 2 &&
      options.every((f, i) => i === 0 || f[0] - options[i - 1][0] === 1) &&
      options.filter((f) => f[0] * f[1] === t * terms.length).length === 1 &&
      q.options[q.answer].text === `${terms.length} × ${t}`
    );
  },
  'inm-grupe': (q) => {
    const { figure: g, solved } = q;
    if (g?.v !== 'groups' || !inRange(g.n, 2, 6) || !inRange(g.each, 2, 6)) return false;
    // cerința numește obiectele desenului, cu „Câte / Câți” potrivit; desenul rezolvat e același, cu numărătoarea
    const plural = g.unit?.[1];
    if (PLURAL[g.emoji] !== plural || q.prompt !== `${CATI.has(plural) ? 'Câți' : 'Câte'} ${plural} sunt în total?`) return false;
    if (JSON.stringify(solved) !== JSON.stringify({ ...g, counts: true })) return false;
    // variantele: multipli ai mărimii grupei, de la 2 la 6 grupe
    const values = q.choices.map((id) => Number(q.options[id].text));
    return numberAnswer(q, g.n * g.each) && values[0] >= 2 * g.each && values[3] <= 6 * g.each && values.every((x, i) => i === 0 || x - values[i - 1] === g.each);
  },
  'inm-factor-lipsa': (q) => {
    const m = missing(q);
    return Boolean(m) && inRange(m.known, 2, 9) && inRange(m.factor, 2, 9) && missingOptions(q, m);
  },
  'cmp-inm-tabla': ({ left, right, answer }) => {
    const [lv, rv] = [sideValue(left), sideValue(right)];
    const [lf, rf] = [factors(left), factors(right)];
    const tabla = (f) => f && f.every((x) => inRange(x, 2, 9));
    if (lv === null || rv === null || answer !== rel(lv, rv)) return false;
    // un fapt din tablă față de un număr apropiat (cel mult 3)
    if (!lf || !rf) return (tabla(lf) || tabla(rf)) && Math.abs(lv - rv) <= 3;
    if (!tabla(lf) || !tabla(rf)) return false;
    // două fapte: aceiași factori, același produs, un factor comun și celălalt mai departe cu 1–2, sau produse apropiate (cel mult 9:
    // și același produs din alți factori, cu un factor schimbat cu 1)
    const shared = lf.some((x) => rf.includes(x)) && Math.abs(lf[0] + lf[1] - rf[0] - rf[1]) <= 2;
    return lv === rv || shared || Math.abs(lv - rv) <= 9;
  },
  'inm-zeci': ({ text, answer, choices }) => {
    const f = oneByTwo(text);
    if (!f || !round10(f[1]) || answer !== f[0] * f[1] || answer > 200) return false;
    const [a, t] = f;
    // multiplii zecii rotunde (de cel puțin 2 ori) sau ai lui 10 × a
    return stepped(choices, answer, t, { above: 2 * t - 1, max: 200 }) || stepped(choices, answer, 10 * a, { above: t, max: 200 });
  },
  'inm-1x2': ({ text, answer, choices }) => {
    const f = oneByTwo(text);
    // patru zeci la rând, cu aceleași unități (transportul uitat sau dublat)
    return Boolean(f) && f[1] >= 11 && !round10(f[1]) && answer === f[0] * f[1] && answer <= 200 && stepped(choices, answer, 10, { above: f[1], max: 200 });
  },
  'cmp-inm-200': ({ left, right, answer }) => {
    const [lv, rv] = [sideValue(left), sideValue(right)];
    if (lv === null || rv === null || answer !== rel(lv, rv)) return false;
    const [lf, rf] = [oneByTwo(left), oneByTwo(right)];
    if (![lf, rf].filter(Boolean).every(([a, n]) => a * n <= 200)) return false;
    // un produs față de zecea apropiată (cel mult 15 mai departe, cel mult 200)
    if (!lf || !rf) return Boolean(lf || rf) && /^\d+$/.test(lf ? right : left) && round10(lf ? rv : lv) && Math.abs(lv - rv) <= 15 && Math.max(lv, rv) <= 200;
    // același produs (uneori cu numărul de două cifre schimbat cu 1), sau același factor de o cifră și celălalt mai departe cu 1–3
    return lv === rv || (lf[0] === rf[0] && Math.abs(lf[1] - rf[1]) <= 3) || Math.abs(lv - rv) <= 9;
  },
  'inm-1x2-500': ({ text, answer, choices }) => {
    const f = oneByTwo(text);
    return (
      Boolean(f) && f[0] >= 3 && f[1] >= 11 && !round10(f[1]) && answer === f[0] * f[1] && inRange(answer, 110, 500) && stepped(choices, answer, 10, { above: f[1], max: 500 })
    );
  },
  'inm-11': ({ text, answer, choices }) => {
    const f = factors(text);
    if (!f || !f.includes(11)) return false;
    const n = f[0] === 11 ? f[1] : f[0];
    return inRange(n, 12, 90) && answer === 11 * n && stepped(choices, answer, 10, { above: n, max: 999 });
  },
  'inm-zeci-2x2': ({ text, answer, choices }) => {
    const f = factors(text);
    if (!f || !f.every((x) => inRange(x, 10, 99)) || !f.some(round10) || answer !== f[0] * f[1] || !inRange(answer, 110, 1000)) return false;
    // × 10 (celălalt factor nerotund): zeci la rând; altfel sute la rând, cu aceleași zeci (12 × 20: 140, 240, 340, 440)
    const step = f.includes(10) && !f.every(round10) ? 10 : 100;
    return stepped(choices, answer, step, { above: Math.max(...f), max: 1000 });
  },
  'cmp-inm-1000': ({ left, right, answer }) => {
    const [lv, rv] = [sideValue(left), sideValue(right)];
    if (lv === null || rv === null || answer !== rel(lv, rv) || lv > 1000 || rv > 1000) return false;
    const [lf, rf] = [factors(left), factors(right)];
    // măcar o latură e o înmulțire cu un factor de două cifre (niciunul de trei); o sumă stă doar față de „11 × n” (× 10 + încă o dată)
    if (![lf, rf].some((f) => f && f.some((x) => x >= 10)) || [lf, rf].some((f) => f && f.some((x) => x > 99))) return false;
    const sum = [left, right].find((s) => s.includes('+'));
    if (sum) {
      const eleven = factors(sum === left ? right : left);
      const [x, y] = sum.split(' + ').map(Number);
      const n = eleven?.includes(11) ? (eleven[0] === 11 ? eleven[1] : eleven[0]) : null;
      return n !== null && Math.abs(x - 10 * n) <= 10 && Math.abs(y - n) <= 1;
    }
    return true;
  },
  'inm-factor-lipsa-mare': (q) => {
    const m = missing(q);
    const known = m && ((round10(m.known) && inRange(m.known, 20, 90)) || inRange(m.known, 11, 19));
    return Boolean(known) && inRange(m.factor, 2, 9) && m.total <= 1000 && missingOptions(q, m);
  },
};
