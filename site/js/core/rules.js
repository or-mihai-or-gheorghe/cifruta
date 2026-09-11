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
      // n = numărul; u, z, s, m = cifrele unităților, zecilor, sutelor, miilor (1000 → m = 1, s = 0)
      const n = Number(v);
      return holds(rule.expr, { ...env, n, u: n % 10, z: Math.floor(n / 10) % 10, s: Math.floor(n / 100) % 10, m: Math.floor(n / 1000) % 10 });
    }
    // regulile compuse primesc valoarea deja extrasă prin `of`
    case 'all':
      return rule.rules.every((r) => check(r, v, env));
    case 'any':
      return rule.rules.some((r) => check(r, v, env));
    case 'not':
      return !check(rule.inner, v, env);
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

// ——— Trecerea peste ordin ———

/**
 * true dacă adunarea sau scăderea se face „cu trecere peste ordin”, pe coloane:
 * la adunare, suma cifrelor unei coloane e cel puțin 10 (7 + 5, 28 + 12);
 * la scădere, o cifră a descăzutului e mai mică decât cifra scăzătorului (24 − 18, 100 − 50).
 */
export function trecere(op, a, b) {
  for (let x = Math.abs(a), y = Math.abs(b); x > 0 || y > 0; x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    if (op === '+' ? (x % 10) + (y % 10) >= 10 : x % 10 < y % 10) return true;
  }
  return false;
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

/**
 * Combinațiile care dau exact suma, cele cu mai puține bucăți primele.
 * limit: câte combinații sunt necesare (se oprește când le are); maxPieces: cel mult atâtea bucăți.
 * Caută pe rând combinațiile cu 1, 2, 3… bucăți, de la bancnota cea mai mare, și abandonează ramurile imposibile.
 */
export function moneyCombos(target, allowed, { limit = Infinity, maxPieces = Infinity } = {}) {
  const ds = [...new Set(allowed.map(Number))].sort((a, b) => b - a);
  const smallest = ds.at(-1);
  const res = [];
  const combo = {};
  function rec(i, rest, pieces) {
    if (rest === 0) {
      if (pieces === 0) res.push({ ...combo });
      return;
    }
    if (i >= ds.length || rest > pieces * ds[i] || rest < pieces * smallest) return;
    const d = ds[i];
    for (let c = Math.min(pieces, Math.floor(rest / d)); c >= 0 && res.length < limit; c--) {
      if (c) combo[d] = c;
      rec(i + 1, rest - c * d, pieces - c);
      delete combo[d];
    }
  }
  const most = Math.min(maxPieces, Math.floor(target / smallest));
  for (let k = 1; k <= most && res.length < limit; k++) rec(0, target, k);
  return res;
}
