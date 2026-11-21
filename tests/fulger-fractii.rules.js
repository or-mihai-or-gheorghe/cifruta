// Regulile tipurilor temei „Fracțiile” (js/fulger/kinds-fractii.js), verificate de tests/fulger.test.js pe întrebările generate. Fiecare
// regulă recalculează răspunsul din desen (câte bucăți are întregul, câte sunt colorate; câte grupe și câte în grupă), din cerință și din
// `ask`, cu codul ei: o singură variantă are valoarea cerută, iar fracțiile egale nu stau două printre variante.

import { numberAnswer } from './fulger-1000.rules.js';

const inRange = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
/** O fracție „n/d” ca pereche, sau null. */
const pair = (text) => {
  const m = /^(\d+)\/(\d+)$/.exec(String(text ?? ''));
  return m ? [Number(m[1]), Number(m[2])] : null;
};
const same = ([a, b], [c, d]) => a * d === b * c;
/** Fracția arătată de un desen `fraction`: [colorate, bucăți]. */
const shown = (spec) => (spec?.v === 'fraction' && !spec.sizes ? [spec.on.length, spec.parts] : null);
const optionsOf = (q) => q.choices.map((id) => q.options[id]);

/** Variantele-fracție: toate subunitare, cu valori diferite între ele; răspunsul e singura cu valoarea `target`. */
function fractionOptions(q, target) {
  const values = optionsOf(q).map((o) => pair(o.frac));
  if (values.some((v) => !v || v[0] < 1 || v[0] >= v[1] || v[1] > 10)) return false;
  if (values.some((v, i) => values.some((w, j) => j > i && same(v, w)))) return false;
  const hits = values.filter((v) => same(v, target));
  return hits.length === 1 && same(pair(q.options[q.answer].frac), target);
}

/** Variantele-desen: întregi tăiați în bucăți egale, cu fracții diferite ca valoare; răspunsul e singurul cu valoarea `target`. */
function drawingOptions(q, target) {
  const values = optionsOf(q).map(shown);
  if (values.some((v) => !v || v[0] < 1 || v[0] >= v[1])) return false;
  if (values.some((v, i) => values.some((w, j) => j > i && same(v, w)))) return false;
  return values.filter((v) => same(v, target)).length === 1 && same(shown(q.options[q.answer]), target);
}

/** O întrebare „din număr”: grupele desenate dau totalul, iar răspunsul e n grupe din d (variantele, patru numere la rând). */
function fromNumber(q, [n, d], prompt) {
  const g = q.figure;
  if (g?.v !== 'groups' || g.n !== d || !q.solved?.counts || /\d+ (?:grupe )?cu câte/.test(g.alt ?? '')) return false;
  const total = g.n * g.each;
  const values = optionsOf(q).map((o) => Number(o.text));
  return (
    prompt.test(q.prompt) &&
    Number(q.prompt.match(/din (\d+)\?$/)?.[1]) === total &&
    numberAnswer(q, n * g.each) &&
    values.every((v, i) => i === 0 || v - values[i - 1] === 1) &&
    values[0] >= 1
  );
}

export const FRACTII_RULES = {
  'fr-parte': (q) => {
    const f = shown(q.figure);
    return Boolean(f) && [2, 4].includes(f[1]) && q.prompt === 'Ce parte e colorată?' && fractionOptions(q, f);
  },
  'fr-unde': (q) => {
    const target = q.prompt === 'Unde e colorată jumătatea?' ? [1, 2] : q.prompt === 'Unde e colorat un sfert?' ? [1, 4] : null;
    return Boolean(target) && q.ask?.target === target.join('/') && drawingOptions(q, target);
  },
  'fr-jumatate-din': (q) => {
    const of = q.prompt.startsWith('Cât e jumătate din') ? [1, 2] : q.prompt.startsWith('Cât e un sfert din') ? [1, 4] : null;
    return Boolean(of) && fromNumber(q, of, /^Cât e (jumătate|un sfert) din \d+\?$/);
  },
  'fr-ce-fractie': (q) => {
    const f = shown(q.figure);
    return Boolean(f) && inRange(f[1], 3, 10) && q.prompt === 'Ce fracție e colorată?' && q.options[q.answer].frac === `${f[0]}/${f[1]}` && fractionOptions(q, f);
  },
  'fr-arata': (q) => {
    const m = /^Care desen arată \{\{f:(\d+)\/(\d+)\}\}\?$/.exec(q.prompt);
    return Boolean(m) && drawingOptions(q, [Number(m[1]), Number(m[2])]) && shown(q.options[q.answer]).join('/') === `${m[1]}/${m[2]}`;
  },
  'fr-din-numar': (q) => {
    const m = /^Cât e \{\{f:1\/(\d)\}\} din \d+\?$/.exec(q.prompt);
    return Boolean(m) && inRange(Number(m[1]), 3, 6) && fromNumber(q, [1, Number(m[1])], /./);
  },
  'fr-egale': (q) => {
    const m = /^Care e egală cu \{\{f:(\d+)\/(\d+)\}\}\?$/.exec(q.prompt);
    if (!m) return false;
    const given = [Number(m[1]), Number(m[2])];
    // desenul arată fracția dată, iar răspunsul are alt numitor (nu e chiar fracția dată)
    return same(shown(q.figure), given) && fractionOptions(q, given) && pair(q.options[q.answer].frac)[1] !== given[1];
  },
  'fr-din-numar-n': (q) => {
    const m = /^Cât fac \{\{f:(\d+)\/(\d+)\}\} din \d+\?$/.exec(q.prompt);
    return Boolean(m) && Number(m[1]) >= 2 && fromNumber(q, [Number(m[1]), Number(m[2])], /./);
  },
  'fr-compara': (q) => {
    const most = q.prompt === 'Care fracție e cea mai mare?';
    if (!most && q.prompt !== 'Care fracție e cea mai mică?') return false;
    const values = optionsOf(q).map((o) => pair(o.frac));
    if (values.some((v) => !v)) return false;
    // același numărător sau același numitor la toate, iar cea cerută e una singură
    const sameN = values.every((v) => v[0] === values[0][0]);
    const sameD = values.every((v) => v[1] === values[0][1]);
    const value = ([n, d]) => n / d;
    const best = most ? Math.max(...values.map(value)) : Math.min(...values.map(value));
    const answer = pair(q.options[q.answer].frac);
    return (sameN || sameD) && values.filter((v) => value(v) === best).length === 1 && value(answer) === best;
  },
};
