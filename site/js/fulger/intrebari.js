// Jocuri fulger: formele comune ale întrebărilor. Cu calcule: `choice` (un calcul și patru rezultate), `compare` (două laturi și un
// semn) și `sorting` (plăci puse în ordine). Desenate (grafice, hărți, arbori): variante numerice, variante desenate, comparări și
// ordonări făcute pe un desen. Fiecare întrebare desenată poartă `ask` (ce se întreabă), din care regulile din teste găsesc singure
// răspunsul.

import { calc, relation } from '../core/expr.js';
import { artId, figureQuestion } from './kinds-forme.js';
import { shuffle, withChoices } from './rand.js';

export const REL = (a, b) => (a < b ? '<' : a > b ? '>' : '=');

// ——— calcule ———

/** Un calcul („38 + 47”) cu patru rezultate crescătoare, dintre care unul e cel bun. */
export function choice(kind, rand, text, typical, max) {
  const answer = calc(text);
  return { kind, mode: 'choice', key: `${kind}:${text}`, text, answer, choices: withChoices(rand, answer, typical, { max }) };
}

/** Două laturi de comparat (numere sau calcule) și semnul dintre ele. */
export function compare(kind, left, right) {
  const [l, r] = [String(left), String(right)];
  return { kind, mode: 'compare', key: `${kind}:${l}|${r}`, left: l, right: r, answer: relation(calc(l), calc(r)) };
}

/** Plăci de pus în ordine, niciodată deja în ordinea cerută. */
export function sorting(kind, rand, values, dir = 'asc') {
  const answer = [...values].sort((a, b) => (dir === 'asc' ? a - b : b - a));
  let numbers = shuffle(rand, values);
  while (numbers.every((n, i) => n === answer[i])) numbers = shuffle(rand, values);
  return { kind, mode: 'sort', key: `${kind}:${dir}:${numbers.join(',')}`, dir, numbers, answer };
}

// ——— întrebări cu desen ———

/**
 * Întrebare cu variante numerice, crescătoare, cu răspunsul pe o poziție la întâmplare (sau cu variantele date în `fixed`).
 * `max` mărginește variantele: la numerele de trei cifre se dă explicit, altfel `withChoices` nu găsește patru variante.
 * Desenul e opțional: unele întrebări au doar cerința (un șir de numere, o rotunjire).
 */
export function numberQuestion(kind, rand, { prompt, figure = null, solved, key, answer, typical = [], min = 0, max = 100, fixed = null, ask }) {
  const values = fixed ?? withChoices(rand, answer, typical, { min, max });
  const options = values.map((n) => ({ text: String(n) }));
  return {
    kind,
    mode: 'figure',
    key: `${kind}:${key}`,
    prompt,
    ...(figure && { figure }),
    ...(solved && { solved }),
    choices: options.map(artId),
    options: Object.fromEntries(options.map((o) => [artId(o), o])),
    answer: artId({ text: String(answer) }),
    ask,
  };
}

/**
 * Întrebare cu variante desenate (emoji, zile, date, insigne): răspunsul și primii trei distractori diferiți, amestecați. Cu `order`
 * (rangul unei variante), variantele care au o ordine firească (zilele, datele) stau în ordinea lor.
 */
export function pickQuestion(kind, rand, { ask, order = null, ...rest }) {
  const q = figureQuestion(kind, rand, rest);
  if (q && order) q.choices.sort((x, y) => order(q.options[x]) - order(q.options[y]));
  return q && { ...q, ask };
}

/** Comparare pe desen: laturile sunt liste de 1–2 desene (emoji, zile, nume), iar răspunsul vine din valori. */
export const drawnCompare = (kind, { prompt, figure, solved, left, right, lv, rv, key, ask }) => ({
  kind,
  mode: 'compare',
  key: `${kind}:${key}`,
  prompt,
  figure,
  ...(solved && { solved }),
  left,
  right,
  answer: REL(lv, rv),
  ask,
});

/**
 * Ordonare pe desen: plăcuțele sunt id-uri (cu desenele lor în `options`), iar răspunsul e ordinea lor după `value` (crescător,
 * descrescător sau, la `path`, crescător după locul pe drum). Plăcuțele nu stau niciodată deja în ordine.
 */
export function drawnSort(kind, rand, { prompt, figure, solved, dir, items, key, ask }) {
  const answer = [...items].sort((a, b) => (dir === 'desc' ? b.value - a.value : a.value - b.value)).map((i) => i.id);
  let tiles = shuffle(rand, answer);
  while (tiles.every((t, i) => t === answer[i])) tiles = shuffle(rand, answer);
  return {
    kind,
    mode: 'sort',
    key: `${kind}:${key}:${tiles.join(',')}`,
    prompt,
    dir,
    figure,
    ...(solved && { solved }),
    tiles,
    options: Object.fromEntries(items.map((i) => [i.id, i.spec])),
    answer,
    ask,
  };
}
