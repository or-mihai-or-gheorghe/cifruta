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

/**
 * Numeral + substantiv cu acordul corect în română:
 * cantitate(1, 'leu', 'lei') → „1 leu”, (5) → „5 lei”, (19) → „19 lei”, (20) → „20 de lei”, (101) → „101 lei”.
 */
export function cantitate(n, singular, plural) {
  if (Math.abs(n) === 1) return `${n} ${singular}`;
  const r = Math.abs(n) % 100;
  const de = Number.isInteger(n) && (r >= 20 || (r === 0 && n !== 0));
  return `${formatNumber(n)} ${de ? 'de ' : ''}${plural}`;
}

const SINGULAR = { lei: 'leu', bani: 'ban', grade: 'grad', minute: 'minut', ore: 'oră', puncte: 'punct', ouă: 'ou', mere: 'măr', litri: 'litru', centimetri: 'centimetru', pași: 'pas', metri: 'metru' };

/** Forma de singular pentru unitățile folosite în conținut: singularOf('grade') → „grad”. */
export const singularOf = (plural) => SINGULAR[plural] ?? plural;

/** Număr scris românește, cu virgulă zecimală și cel mult o zecimală: 2.7 → „2,7”, 4 → „4”. */
export const formatNumber = (x, digits = 1) => String(Math.round(x * 10 ** digits) / 10 ** digits).replace('.', ',');

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

/** Data și ora, scurt, românește: „12 sept. 2026, 14:05”. */
export function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

/** Numărul de cuvinte dintr-un text simplu. */
export const wordCount = (s) => nfc(s).trim().split(/\s+/).filter(Boolean).length;
