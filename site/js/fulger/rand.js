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
