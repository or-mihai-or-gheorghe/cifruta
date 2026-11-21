// Învață: fracțiile (pur). O fracție e [numărător, numitor]; textul ei e „n/d”, ca în mini-markup ({{f:n/d}}).

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** Fracția simplificată: [2, 4] → [1, 2]; 0/d → [0, 1]. */
export function reduce([n, d]) {
  if (n === 0) return [0, 1];
  const g = gcd(n, d);
  return [n / g, d / g];
}

export const fractionText = ([n, d]) => `${n}/${d}`;

/** „3/5” → [3, 5]; altfel null. */
export function parseFraction(text) {
  const m = /^(\d+)\/(\d+)$/.exec(String(text ?? ''));
  return m && Number(m[2]) > 0 ? [Number(m[1]), Number(m[2])] : null;
}

/** Aceeași valoare (2/4 și 1/2). */
export const sameValue = (a, b) => a[0] * b[1] === b[0] * a[1];

/** Compararea: negativ, 0 sau pozitiv, ca la sortare. */
export const compareFractions = (a, b) => a[0] * b[1] - b[0] * a[1];

/** Fracțiile egale cu n/d, cu numitorul până la `max`, în ordinea numitorilor: 1/2 → 1/2, 2/4, 3/6, 4/8, 5/10. */
export function equivalents([n, d], max = 10) {
  const [a, b] = reduce([n, d]);
  const out = [];
  for (let k = 1; b * k <= max; k++) out.push([a * k, b * k]);
  return n === 0 ? [[0, d]] : out;
}

/** Un desen `fraction` din bancă e tăiat în părți egale? (fără `sizes` diferite; fâșiile, careul și diagonalele pătratului sunt egale) */
export const equalParts = (spec) => !Array.isArray(spec.sizes) || new Set(spec.sizes.map(Number)).size <= 1;
