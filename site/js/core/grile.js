// Piese din căsuțe (poliomino) pentru Jocurile fulger (pur, fără DOM). O piesă e o listă de căsuțe [rând, coloană]: normalizare,
// rotire, oglindire, orientări, cheia unei piese oricum ar fi așezată și toate piesele de n căsuțe legate pe laturi.

/** Căsuțele mutate lângă colțul de sus-stânga, în ordine (rând, apoi coloană). */
export function normalize(cells) {
  const r0 = Math.min(...cells.map(([r]) => r));
  const c0 = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [r - r0, c - c0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** Cheia piesei așezate așa cum e (două piese cu aceeași cheie arată la fel, în aceeași poziție). */
export const cellsKey = (cells) => normalize(cells).map(([r, c]) => `${r}.${c}`).join(' ');

/** [rânduri, coloane] ocupate de piesă. */
export function size(cells) {
  const n = normalize(cells);
  return [Math.max(...n.map(([r]) => r)) + 1, Math.max(...n.map(([, c]) => c)) + 1];
}

/** Rotită cu un sfert, în sensul acelor de ceas. */
export const rotate = (cells) => normalize(cells.map(([r, c]) => [c, -r]));

/** Oglindită față de o linie verticală (stânga ↔ dreapta). */
export const mirror = (cells) => normalize(cells.map(([r, c]) => [r, -c]));

function unique(pieces) {
  const out = new Map();
  for (const p of pieces) out.set(cellsKey(p), normalize(p));
  return [...out.values()];
}

/** Rotirile diferite ale piesei (1, 2 sau 4). */
export function rotations(cells) {
  const list = [normalize(cells)];
  for (let i = 1; i < 4; i++) list.push(rotate(list[i - 1]));
  return unique(list);
}

/** Toate orientările: rotirile piesei și ale imaginii ei în oglindă. */
export const orientations = (cells) => unique([...rotations(cells), ...rotations(mirror(cells))]);

/** Cheia piesei oricum ar fi rotită sau întoarsă (cea mai mică dintre orientări). */
export const freeKey = (cells) => orientations(cells).map(cellsKey).sort()[0];

/** Aceeași piesă, doar rotită. */
export const sameRotated = (a, b) => rotations(a).some((o) => cellsKey(o) === cellsKey(b));

/** Aceeași piesă, rotită sau întoarsă. */
export const sameFree = (a, b) => freeKey(a) === freeKey(b);

/** Piesa în oglindă nu se obține prin rotire (L, S, …). */
export const isChiral = (cells) => !sameRotated(cells, mirror(cells));

const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Căsuțele sunt legate pe laturi. */
export function connected(cells) {
  if (!cells.length) return false;
  const left = new Set(cells.map(([r, c]) => `${r}.${c}`));
  const stack = [cells[0]];
  left.delete(`${cells[0][0]}.${cells[0][1]}`);
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of SIDES) {
      const k = `${r + dr}.${c + dc}`;
      if (left.delete(k)) stack.push([r + dr, c + dc]);
    }
  }
  return left.size === 0;
}

const polyCache = new Map();

/** Toate piesele diferite (oricum ar fi rotite sau întoarse) de n căsuțe, fiecare în orientarea cu cheia cea mai mică: 1, 1, 2, 5, 12, 35. */
export function polyominoes(n) {
  if (!polyCache.has(n)) {
    let level = [[[0, 0]]];
    for (let k = 1; k < n; k++) {
      const next = new Map();
      for (const piece of level) {
        for (const [r, c] of piece) {
          for (const [dr, dc] of SIDES) {
            if (piece.some(([pr, pc]) => pr === r + dr && pc === c + dc)) continue;
            const grown = [...piece, [r + dr, c + dc]];
            const key = freeKey(grown);
            if (!next.has(key)) next.set(key, orientations(grown).find((o) => cellsKey(o) === key));
          }
        }
      }
      level = [...next.values()];
    }
    polyCache.set(n, level);
  }
  return polyCache.get(n);
}

/**
 * Cele 6 căsuțe se pliază într-un cub: rostogolim un cub de la o căsuță la vecinele ei și ținem minte fața de jos; o desfășurare
 * bună pune fiecare față jos o singură dată. Starea cubului: [jos, nord, est], iar fața opusă lui f este 5 − f.
 */
export function isCubeNet(cells) {
  if (cells.length !== 6 || !connected(cells)) return false;
  const key = ([r, c]) => `${r}.${c}`;
  const inside = new Set(cells.map(key));
  const state = new Map([[key(cells[0]), [0, 1, 2]]]);
  const queue = [cells[0]];
  while (queue.length) {
    const [r, c] = queue.shift();
    const [down, north, east] = state.get(key([r, c]));
    // spre est coboară fața de est, iar cea de sus ajunge la est; la fel pe celelalte laturi
    const rolls = [[0, 1, [east, north, 5 - down]], [0, -1, [5 - east, north, down]], [1, 0, [5 - north, down, east]], [-1, 0, [north, 5 - down, east]]];
    for (const [dr, dc, next] of rolls) {
      const k = key([r + dr, c + dc]);
      if (inside.has(k) && !state.has(k)) {
        state.set(k, next);
        queue.push([r + dr, c + dc]);
      }
    }
  }
  return new Set([...state.values()].map(([down]) => down)).size === 6;
}
