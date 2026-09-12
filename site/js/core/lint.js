// Verificări de text pentru conținutul testelor (rulate de `npm test`).

const CEDILLA = /[şţŞŢ]/;
const MISSING_DIACRITICS =
  /\b(si|numar|numarul|cati|cate|pana|dupa|fara|decat|cand|calculeaza|gaseste|ordoneaza|uneste|raspuns|raspunsul|intrebare|aceeasi|fiecarui|urmatorul|in total)\b/i;

export const WORD_LIMITS = { usor: 20, intermediar: 35, avansat: 50 };
export const NEGATION = /(^|[\s„(])(nu|niciodată|nicio|niciun)(?=[\s,.!?”)]|$)/i;

export function lintText(s) {
  const errors = [];
  if (CEDILLA.test(s)) errors.push('folosește ș/ț cu virgulă, nu ş/ţ cu sedilă');
  if (s !== s.normalize('NFC')) errors.push('text ne-normalizat (NFC)');
  const m = MISSING_DIACRITICS.exec(s);
  if (m) errors.push(`posibil cuvânt fără diacritice: „${m[0]}”`);
  return errors;
}

// câmpuri care conțin identificatori, nu text pentru copii. Se sar doar când au valori simple:
// `constraints[].a` e un id, dar `blanks.a` e o casetă cu mesaje care trebuie verificate. `key` se sare mereu.
const ID_KEYS = new Set(['id', 'type', 'layout', 'kind', 'level', 'v', 'bin', 'color', 'skin', 'rule', 'direction',
  'concepts', 'a', 'b', 'of', 'theme', 'places', 'tool', 'file', 'expr', 'calc', 'checks', 'correct', 'if', 'name', 'style',
  'from', 'to', 'via', 'avoid', 'stops', 'include', 'exclude', 'lines', 'ids', 'hide', 'emoji', 'emojis', 'icon', 'path']);

const isScalar = (v) => v === null || typeof v !== 'object';
const skipped = (k, v) => k === 'key' || (ID_KEYS.has(k) && (isScalar(v) || (Array.isArray(v) && v.every(isScalar))));

/** Parcurge toate textele dintr-un obiect: fn(text, cale) */
export function walkTexts(value, fn, path = '') {
  if (typeof value === 'string') fn(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => walkTexts(v, fn, `${path}[${i}]`));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) if (!skipped(k, v)) walkTexts(v, fn, path ? `${path}.${k}` : k);
  }
}

/** Găsește funcții sau valori ne-serializabile. */
export function findNonJSON(value, path = '') {
  if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) return [path || '(rădăcină)'];
  if (typeof value === 'number' && !Number.isFinite(value)) return [path];
  if (Array.isArray(value)) return value.flatMap((v, i) => findNonJSON(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => (v === undefined ? [] : findNonJSON(v, path ? `${path}.${k}` : k)));
  }
  return [];
}
