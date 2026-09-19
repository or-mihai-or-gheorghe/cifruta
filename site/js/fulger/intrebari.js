// Jocuri fulger: forma comună a întrebărilor desenate (grafice, hărți, arbori): variante numerice, variante desenate, comparări și
// ordonări făcute pe un desen. Fiecare întrebare poartă `ask` (ce se întreabă), din care regulile din teste găsesc singure răspunsul.

import { artId, figureQuestion } from './kinds-forme.js';
import { shuffle, withChoices } from './rand.js';

export const REL = (a, b) => (a < b ? '<' : a > b ? '>' : '=');

/** Întrebare cu variante numerice, crescătoare, cu răspunsul pe o poziție la întâmplare (sau cu variantele date în `fixed`). */
export function numberQuestion(kind, rand, { prompt, figure, solved, key, answer, typical = [], min = 0, max = 100, fixed = null, ask }) {
  const values = fixed ?? withChoices(rand, answer, typical, { min, max });
  const options = values.map((n) => ({ text: String(n) }));
  return {
    kind,
    mode: 'figure',
    key: `${kind}:${key}`,
    prompt,
    figure,
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
