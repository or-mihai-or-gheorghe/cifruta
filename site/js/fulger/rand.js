// Jocuri fulger: ajutoare pentru generatoarele cu sămânță (`rand` din core/rng.js). Aceeași ordine a apelurilor dă aceleași întrebări.

export const int = (rand, min, max) => min + Math.floor(rand() * (max - min + 1));
export const pickOne = (rand, list) => list[Math.floor(rand() * list.length)];

export function shuffle(rand, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `count` numere diferite între `min` și `max`. */
export function distinct(rand, count, min, max) {
  const set = new Set();
  while (set.size < count) set.add(int(rand, min, max));
  return [...set];
}

/**
 * Patru variante numerice în ordine crescătoare: răspunsul și trei greșeli. Poziția răspunsului se alege întâi, la întâmplare
 * (altfel ar sta mereu la mijloc), apoi greșelile de sub și de peste el; greșelile tipice au întâietate față de vecinii ±1, ±2, ±3, ±10.
 */
export function withChoices(rand, answer, typical = [], { min = 0, max = 100 } = {}) {
  const ok = (w) => Number.isInteger(w) && w >= min && w <= max && w !== answer;
  const near = [1, 2, 3, 10].flatMap((d) => [answer - d, answer + d]);
  const side = (inSide) => [
    ...new Set([...shuffle(rand, typical.filter((w) => ok(w) && inSide(w))), ...shuffle(rand, near.filter((w) => ok(w) && inSide(w)))]),
  ];
  const below = side((w) => w < answer);
  const above = side((w) => w > answer);
  for (const pos of shuffle(rand, [0, 1, 2, 3])) {
    if (below.length >= pos && above.length >= 3 - pos) return [...below.slice(0, pos), answer, ...above.slice(0, 3 - pos)].sort((a, b) => a - b);
  }
  throw new Error(`fulger: nu găsesc variante pentru ${answer}`);
}

/**
 * Formele variantelor: deplasările față de cea mai mică, crescătoare. `grid`: o zece și o sută (transportul uitat sau dublat la zeci și
 * la sute); `grid10`: o unitate și o zece; `line`: patru numere la rând; `tens`: patru zeci la rând; `hundreds`: patru sute la rând;
 * `place`: câte o greșeală pe fiecare ordin (unități, zeci, sute), pentru numerele citite pe numărătoare.
 */
export const SHAPES = {
  grid: [0, 10, 100, 110],
  grid10: [0, 1, 10, 11],
  line: [0, 1, 2, 3],
  tens: [0, 10, 20, 30],
  hundreds: [0, 100, 200, 300],
  place: [0, 1, 10, 100],
};

/** Un rând al tablei înmulțirii: patru multipli la rând ai unui factor (deplasările față de cel mai mic). */
export const row = (step) => [0, step, 2 * step, 3 * step];

/**
 * Variantele unei forme cu răspunsul pe locul `slot`, dacă toate stau între `min` și `max`; altfel null. La înmulțire, locul se alege
 * înaintea calculului, iar generatorul caută un calcul care încape cu răspunsul acolo (locul nu se vede nici din formă, nici din calcul).
 */
export function placeAt(answer, shape, slot, { min = 0, max = Infinity } = {}) {
  const values = shape.map((d) => answer - shape[slot] + d);
  return values[0] >= min && values.at(-1) <= max ? values : null;
}

/**
 * Patru variante într-o formă fixă, cu răspunsul pe un loc al formei ales la întâmplare dintre cele care țin toate variantele între
 * `min` și `max`. Locul răspunsului nu se vede din formă: un copil care alege după tipar (mijlocul a trei numere egal depărtate, mai
 * marele din doi vecini) nimerește cam o dată din patru.
 */
export function shapeChoices(rand, answer, shape, { min = 0, max = Infinity } = {}) {
  const fits = shape.filter((d) => answer - d >= min && answer - d + shape.at(-1) <= max);
  if (!fits.length) throw new Error(`fulger: forma [${shape}] nu încape în jurul lui ${answer}`);
  const base = answer - fits[int(rand, 0, fits.length - 1)];
  return shape.map((d) => base + d);
}

/**
 * Patru variante „în pătrat”: răspunsul și vecinii lui cu o zece și cu o sută ({x, x + 10, x + 100, x + 110}), cu răspunsul într-un
 * colț la întâmplare; unitățile sunt aceleași la toate. Răspunsul trebuie să stea între 110 și 889, ca toate colțurile să încapă.
 */
export const gridChoices = (rand, answer) => shapeChoices(rand, answer, SHAPES.grid, { max: 999 });
