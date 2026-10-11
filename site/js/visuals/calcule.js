// Calcule desenate: un calcul în scris, pe coloane, ca în caiet. Rezultatul poate fi greșit intenționat (pentru „Cine s-a
// grăbit și a greșit?”), ascuns („?”) sau calculat; `carries` scrie deasupra ce se ține minte, `mark` evidențiază o coloană.
// O singură cifră se poate ascunde, într-un termen sau în rezultat („3?7”, „6?2”): se desenează ca o casetă punctată.

import { LOCURI, marcajeTrecere } from '../core/rules.js';
import { registerVisual } from './index.js';
import { bool, C, has, list, st, txt } from './palette.js';

const GROUP = 'Unelte de matematică';
const CELL = 24;
const ROW = 30;

const opOf = (p) => (String(p.op ?? '+').replace(/[−–]/g, '-').trim() === '-' ? '-' : '+');
/** Termenii ca text, cum se desenează: numerele fără zerouri în față, iar cei cu o cifră lipsă așa cum sunt scriși („3?7”). */
const textsOf = (p) => list(p.terms).map((t) => (t.includes('?') ? t : String(Number(t))));
const termsOf = (p) => list(p.terms).map((t) => Number(t));
/** Tot rezultatul e necunoscut (un singur „?”), spre deosebire de o cifră lipsă din el („6?2”). */
const unknownResult = (p) => has(p.result) && String(p.result).trim() === '?';
/** Câte cifre lipsesc din termeni și din rezultat. */
const holesOf = (p) => [...textsOf(p), unknownResult(p) ? '' : String(p.result ?? '')].join('').split('?').length - 1;
const computed = (p) => {
  const terms = termsOf(p);
  return opOf(p) === '+' ? terms.reduce((s, t) => s + t, 0) : terms[0] - terms[1];
};
const resultOf = (p) => (has(p.result) ? String(p.result).trim() : String(computed(p)));
const widthOf = (p) => Math.max(...textsOf(p).map((t) => t.length), resultOf(p).length);
const rowsOf = (p) => textsOf(p).length + 1 + (bool(p.carries) ? 1 : 0);

/** Cifrele care, puse în locul lui „?”, fac calculul adevărat (fără 0 în fața unui număr). */
function completions(p) {
  const texts = textsOf(p);
  const result = resultOf(p);
  const found = [];
  for (let d = 0; d <= 9; d++) {
    const filled = [...texts, result].map((s) => s.replace('?', String(d)));
    if (filled.some((s) => s.length > 1 && s[0] === '0')) continue;
    const nums = filled.map(Number);
    const value = nums.at(-1);
    const terms = nums.slice(0, -1);
    if (terms.some((t) => t > 1000)) continue;
    if ((opOf(p) === '+' ? terms.reduce((s, t) => s + t, 0) : terms[0] - terms[1]) === value) found.push(d);
  }
  return found;
}

/** Numele unui număr cu o cifră lipsă, pentru cititorul de ecran: „3?7” → „3, cifra lipsă, 7”. */
const spoken = (s) =>
  s.includes('?')
    ? s
        .split('?')
        .map((part, i) => (i ? ['cifra lipsă', part] : [part]))
        .flat()
        .filter(Boolean)
        .join(', ')
    : s;

registerVisual('column-op', {
  group: GROUP,
  defaults: { op: '+', terms: '347,285' },
  check: (p) => {
    const errors = [];
    const texts = textsOf(p);
    if (!['+', '-', '−'].includes(String(p.op ?? '+').trim())) errors.push('op este + sau −');
    if (!holesOf(p)) {
      const terms = termsOf(p);
      if (terms.length < 2 || terms.length > 3 || terms.some((t) => !Number.isInteger(t) || t < 0 || t > 1000)) errors.push('terms: 2–3 numere întregi între 0 și 1000');
      if (opOf(p) === '-' && (terms.length !== 2 || terms[0] < terms[1])) errors.push('la scădere sunt doi termeni, iar primul e cel mai mare');
      if (has(p.result) && !unknownResult(p) && !/^\d{1,4}$/.test(String(p.result).trim())) errors.push('result este „?” sau un număr de 1–4 cifre');
    } else {
      // o cifră lipsă: rezultatul se scrie, iar calculul se completează într-un singur fel
      if (texts.length < 2 || texts.length > 3 || texts.some((t) => !/^[\d?]{1,4}$/.test(t))) errors.push('terms: 2–3 numere de cel mult 4 cifre, cu „?” în locul cifrei lipsă');
      if (opOf(p) === '-' && texts.length !== 2) errors.push('la scădere sunt doi termeni');
      if (!has(p.result) || unknownResult(p) || !/^[\d?]{1,4}$/.test(String(p.result).trim())) errors.push('cu o cifră lipsă, rezultatul se scrie cu cifre');
      if (holesOf(p) > 1) errors.push('cel mult o cifră lipsă („?”) în tot calculul');
      if (bool(p.carries)) errors.push('carries nu merge cu o cifră lipsă');
      if (!errors.length && completions(p).length !== 1) errors.push(`cifra lipsă trebuie să se poată completa într-un singur fel (are ${completions(p).length})`);
    }
    if (has(p.mark) && !LOCURI.slice(0, widthOf(p)).includes(String(p.mark).toLowerCase())) errors.push('mark este o coloană desenată: U, Z, S sau M');
    return errors;
  },
  viewBox: (p) => `0 0 ${widthOf(p) * CELL + 34} ${rowsOf(p) * ROW + 10}`,
  label: (p) =>
    `calcul în scris: ${textsOf(p).map(spoken).join(opOf(p) === '+' ? ' + ' : ' − ')} = ${unknownResult(p) ? 'necunoscut' : spoken(resultOf(p))}`,
  render: (p) => {
    const cols = widthOf(p);
    const x = (k) => 6 + (cols - 1 - k) * CELL + CELL / 2; // coloana k, numărată de la unități
    let y = 6;
    let out = '';
    if (has(p.mark)) {
      const k = LOCURI.indexOf(String(p.mark).toLowerCase());
      out += `<rect x="${x(k) - CELL / 2 + 1}" y="2" width="${CELL - 2}" height="${rowsOf(p) * ROW + 6}" rx="6" fill="${C.yellowLight}"/>`;
    }
    if (bool(p.carries)) {
      const marks = marcajeTrecere(opOf(p), termsOf(p));
      for (const [place, v] of Object.entries(marks)) {
        const k = LOCURI.indexOf(place);
        out += `<circle cx="${x(k)}" cy="${y + ROW / 2}" r="10" fill="${C.white}" ${st(1.5)}/>` + txt(x(k), y + ROW / 2, v, { size: v.length > 1 ? 11 : 14, fill: C.purpleDark });
      }
      y += ROW;
    }
    // o cifră lipsă e o casetă punctată cu „?”; rezultatul necunoscut în întregime rămâne un „?” simplu
    const hole = (cx, cy) =>
      `<rect x="${cx - 9}" y="${cy - 12}" width="18" height="24" rx="4" fill="${C.white}" stroke="${C.purpleDark}" stroke-width="1.8" stroke-dasharray="4 3"/>` +
      txt(cx, cy, '?', { size: 17, fill: C.purpleDark });
    const digitsRow = (s, yy, holes = true) => {
      const d = String(s);
      return [...d].map((c, i) => (c === '?' && holes ? hole(x(d.length - 1 - i), yy + ROW / 2) : txt(x(d.length - 1 - i), yy + ROW / 2, c, { size: 22 }))).join('');
    };
    textsOf(p).forEach((t, i) => {
      out += digitsRow(t, y);
      if (i === 0) out += txt(cols * CELL + 20, y + ROW / 2, opOf(p) === '-' ? '−' : '+', { size: 22, fill: C.purpleDark });
      y += ROW;
    });
    out += `<line x1="4" y1="${y + 1}" x2="${cols * CELL + 8}" y2="${y + 1}" ${st(2.5)}/>`;
    out += digitsRow(resultOf(p), y + 3, !unknownResult(p));
    return out;
  },
  demos: [
    { op: '+', terms: '347,285' },
    { op: '-', terms: '452,176', result: '324' },
    { op: '-', terms: '403,158', carries: true },
    { op: '+', terms: '235,178,296', result: '?' },
    { op: '+', terms: '245,186', result: '321', mark: 'Z' },
    { op: '+', terms: '3?7,285', result: '632' },
    { op: '-', terms: '603,258', result: '3?5' },
  ],
});
