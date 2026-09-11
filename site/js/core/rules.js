// Reguli declarative pentru răspunsuri deschise și pentru verificarea automată a conținutului.

import { holds } from './expr.js';

const digitsOf = (n) => String(Math.abs(Number(n))).split('').map(Number);

export function check(rule, value, env = {}) {
  if (value === null || value === undefined || value === '') return false;
  const v = rule.of ? value?.[rule.of] : value;
  switch (rule.rule) {
    case 'equals':
      return typeof rule.value === 'number' ? Number(v) === rule.value : String(v) === String(rule.value);
    case 'oneOf':
      return rule.values.some((x) => String(x) === String(v));
    case 'range': {
      const n = Number(v);
      return rule.inclusive === false ? n > rule.min && n < rule.max : n >= rule.min && n <= rule.max;
    }
    case 'parity':
      return Math.abs(Number(v)) % 2 === (rule.even ? 0 : 1);
    case 'digitsDistinct': {
      const d = digitsOf(v);
      return new Set(d).size === d.length;
    }
    case 'digitCount':
      return digitsOf(v).length === rule.value;
    case 'digitSum':
      return digitsOf(v).reduce((a, b) => a + b, 0) === rule.value;
    case 'holds': {
      const n = Number(v);
      return holds(rule.expr, { ...env, n, z: Math.floor(n / 10) % 10, u: n % 10, s: Math.floor(n / 100) % 10 });
    }
    case 'all':
      return rule.rules.every((r) => check(r, value, env));
    case 'any':
      return rule.rules.some((r) => check(r, value, env));
    case 'not':
      return !check(rule.inner, value, env);
    default:
      throw new Error(`Regulă necunoscută: ${rule.rule}`);
  }
}

/** Toate numerele din [from, to] care respectă regulile. */
export function searchNumbers({ from, to, rules }) {
  const out = [];
  for (let n = from; n <= to; n++) if (rules.every((r) => check(r, n))) out.push(n);
  return out;
}

// ——— Bani ———

export const moneySum = (combo) =>
  Object.entries(combo ?? {}).reduce((s, [d, c]) => s + Number(d) * Number(c), 0);

export const moneyPieces = (combo) =>
  Object.values(combo ?? {}).reduce((s, c) => s + Number(c), 0);

/** Cheie canonică pentru o combinație: {"10":1,"5":0,"1":2} → "10x1,1x2" */
export const moneyKey = (combo) =>
  Object.entries(combo ?? {})
    .filter(([, c]) => Number(c) > 0)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([d, c]) => `${d}x${c}`)
    .join(',');

/** Cel mai mic număr de bancnote/monede cu care se poate plăti exact suma. */
export function minPieces(target, allowed) {
  const best = Array(target + 1).fill(Infinity);
  best[0] = 0;
  for (let s = 1; s <= target; s++) {
    for (const d of allowed) if (d <= s && best[s - d] + 1 < best[s]) best[s] = best[s - d] + 1;
  }
  return best[target];
}

/** Toate combinațiile (ordonate după numărul de bucăți) care dau exact suma. */
export function moneyCombos(target, allowed) {
  const ds = [...allowed].map(Number).sort((a, b) => b - a);
  const res = [];
  (function rec(i, rest, combo) {
    if (rest === 0) { res.push({ ...combo }); return; }
    if (i >= ds.length) return;
    const d = ds[i];
    for (let c = Math.floor(rest / d); c >= 0; c--) {
      const next = { ...combo };
      if (c) next[d] = c;
      rec(i + 1, rest - c * d, next);
    }
  })(0, target, {});
  return res.sort((a, b) => moneyPieces(a) - moneyPieces(b));
}
