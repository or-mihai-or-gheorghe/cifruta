// Învață: glisorul ca riglă (pur). Gradațiile 1…count stau la mijlocul căsuțelor desenului, deci mânerul valorii v stă la
// (v − 0,5) / count din lungimea pistei, iar o apăsare la distanța `offset` de începutul pistei alege căsuța de sub deget.

/** Valoarea de sub deget, între `min` și `max` (gradațiile din afara intervalului se văd, dar nu se pot alege). */
export function valueAt(offset, length, count, min, max) {
  const v = Math.floor((offset / length) * count) + 1;
  return Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
}

/** Poziția mânerului, în procente din lungimea pistei. */
export const percentOf = (value, count) => ((value - 0.5) / count) * 100;

/** Pasul tastelor: săgețile merg după direcția de pe ecran (la glisorul vertical, valorile cresc în jos). */
export function keyStep(key, vertical) {
  const steps = vertical
    ? { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, PageDown: 5, PageUp: -5 }
    : { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 };
  if (key === 'Home') return -Infinity;
  if (key === 'End') return Infinity;
  return steps[key] ?? 0;
}
