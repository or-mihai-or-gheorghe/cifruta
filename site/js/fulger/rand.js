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
