// Ajutoare pentru limba română: normalizare, comparare tolerantă, „de” după numerale, numere în litere.

export const nfc = (s) => String(s ?? '').normalize('NFC');

/** Înlocuiește ş ţ (cu sedilă) cu ș ț (cu virgulă). */
export const fixCedilla = (s) =>
  nfc(s).replace(/ş/g, 'ș').replace(/ţ/g, 'ț').replace(/Ş/g, 'Ș').replace(/Ţ/g, 'Ț');

export const stripDiacritics = (s) =>
  fixCedilla(s)
    .replace(/[ăâ]/g, 'a').replace(/[ĂÂ]/g, 'A')
    .replace(/î/g, 'i').replace(/Î/g, 'I')
    .replace(/ș/g, 's').replace(/Ș/g, 'S')
    .replace(/ț/g, 't').replace(/Ț/g, 'T');

/** Compară două texte ignorând spațiile și literele mari; opțional și diacriticele. */
export function sameText(a, b, { ignoreDiacritics = false } = {}) {
  const norm = (x) => {
    const t = fixCedilla(x).trim().replace(/\s+/g, ' ').toLocaleLowerCase('ro');
    return ignoreDiacritics ? stripDiacritics(t) : t;
  };
  return norm(a) === norm(b);
}

/** 19 lei, 20 de lei, 100 de lei, 101 lei */
export function cuDe(n, noun) {
  const r = Math.abs(n) % 100;
  const de = r >= 20 || (r === 0 && n !== 0);
  return `${n} ${de ? 'de ' : ''}${noun}`;
}

const UNITS = ['zero', 'unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă'];
const TEENS = ['zece', 'unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece',
  'șaisprezece', 'șaptesprezece', 'optsprezece', 'nouăsprezece'];
const TENS = ['', '', 'douăzeci', 'treizeci', 'patruzeci', 'cincizeci', 'șaizeci', 'șaptezeci', 'optzeci', 'nouăzeci'];
const HUNDREDS = ['', 'o sută', 'două sute', 'trei sute', 'patru sute', 'cinci sute', 'șase sute',
  'șapte sute', 'opt sute', 'nouă sute'];

function below100(n) {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u ? `${TENS[t]} și ${UNITS[u]}` : TENS[t];
}

/** Numere 0–1000 scrise cu litere: 46 → „patruzeci și șase” */
export function numberToWords(n) {
  if (!Number.isInteger(n) || n < 0 || n > 1000) throw new Error(`numberToWords: ${n} în afara 0–1000`);
  if (n === 1000) return 'o mie';
  if (n < 100) return below100(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  return r ? `${HUNDREDS[h]} ${below100(r)}` : HUNDREDS[h];
}

/** Numărul de cuvinte dintr-un text simplu. */
export const wordCount = (s) => nfc(s).trim().split(/\s+/).filter(Boolean).length;
