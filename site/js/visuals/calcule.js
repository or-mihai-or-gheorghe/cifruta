// Calcule desenate: un calcul în scris, pe coloane, ca în caiet. Rezultatul poate fi greșit intenționat (pentru „Cine s-a
// grăbit și a greșit?”), ascuns („?”) sau calculat; `carries` scrie deasupra ce se ține minte, `mark` evidențiază o coloană.

import { LOCURI, marcajeTrecere } from '../core/rules.js';
import { registerVisual } from './index.js';
import { bool, C, has, list, st, txt } from './palette.js';

const GROUP = 'Unelte de matematică';
const CELL = 24;
const ROW = 30;

const opOf = (p) => (String(p.op ?? '+').replace(/[−–]/g, '-').trim() === '-' ? '-' : '+');
const termsOf = (p) => list(p.terms).map((t) => Number(t));
const computed = (p) => {
  const terms = termsOf(p);
  return opOf(p) === '+' ? terms.reduce((s, t) => s + t, 0) : terms[0] - terms[1];
};
const resultOf = (p) => (has(p.result) ? String(p.result).trim() : String(computed(p)));
const widthOf = (p) => Math.max(...termsOf(p).map((t) => String(t).length), resultOf(p).length);
const rowsOf = (p) => termsOf(p).length + 1 + (bool(p.carries) ? 1 : 0);

registerVisual('column-op', {
  group: GROUP,
  defaults: { op: '+', terms: '347,285' },
  check: (p) => {
    const errors = [];
    const terms = termsOf(p);
    if (!['+', '-', '−'].includes(String(p.op ?? '+').trim())) errors.push('op este + sau −');
    if (terms.length < 2 || terms.length > 3 || terms.some((t) => !Number.isInteger(t) || t < 0 || t > 1000)) errors.push('terms: 2–3 numere întregi între 0 și 1000');
    if (opOf(p) === '-' && (terms.length !== 2 || terms[0] < terms[1])) errors.push('la scădere sunt doi termeni, iar primul e cel mai mare');
    if (has(p.result) && p.result !== '?' && !/^\d{1,4}$/.test(String(p.result).trim())) errors.push('result este „?” sau un număr de 1–4 cifre');
    if (has(p.mark) && !LOCURI.slice(0, widthOf(p)).includes(String(p.mark).toLowerCase())) errors.push('mark este o coloană desenată: U, Z, S sau M');
    return errors;
  },
  viewBox: (p) => `0 0 ${widthOf(p) * CELL + 34} ${rowsOf(p) * ROW + 10}`,
  label: (p) => `calcul în scris: ${termsOf(p).join(opOf(p) === '+' ? ' + ' : ' − ')} = ${resultOf(p) === '?' ? 'necunoscut' : resultOf(p)}`,
  render: (p) => {
    const cols = widthOf(p);
    const terms = termsOf(p);
    const x = (k) => 6 + (cols - 1 - k) * CELL + CELL / 2; // coloana k, numărată de la unități
    let y = 6;
    let out = '';
    if (has(p.mark)) {
      const k = LOCURI.indexOf(String(p.mark).toLowerCase());
      out += `<rect x="${x(k) - CELL / 2 + 1}" y="2" width="${CELL - 2}" height="${rowsOf(p) * ROW + 6}" rx="6" fill="${C.yellowLight}"/>`;
    }
    if (bool(p.carries)) {
      const marks = marcajeTrecere(opOf(p), terms);
      for (const [place, v] of Object.entries(marks)) {
        const k = LOCURI.indexOf(place);
        out += `<circle cx="${x(k)}" cy="${y + ROW / 2}" r="10" fill="${C.white}" ${st(1.5)}/>` + txt(x(k), y + ROW / 2, v, { size: v.length > 1 ? 11 : 14, fill: C.purpleDark });
      }
      y += ROW;
    }
    const digitsRow = (s, yy) => {
      const d = String(s);
      return [...d].map((c, i) => txt(x(d.length - 1 - i), yy + ROW / 2, c, { size: 22 })).join('');
    };
    terms.forEach((t, i) => {
      out += digitsRow(t, y);
      if (i === 0) out += txt(cols * CELL + 20, y + ROW / 2, opOf(p) === '-' ? '−' : '+', { size: 22, fill: C.purpleDark });
      y += ROW;
    });
    out += `<line x1="4" y1="${y + 1}" x2="${cols * CELL + 8}" y2="${y + 1}" ${st(2.5)}/>`;
    out += digitsRow(resultOf(p), y + 3);
    return out;
  },
  demos: [
    { op: '+', terms: '347,285' },
    { op: '-', terms: '452,176', result: '324' },
    { op: '-', terms: '403,158', carries: true },
    { op: '+', terms: '235,178,296', result: '?' },
    { op: '+', terms: '245,186', result: '321', mark: 'Z' },
  ],
});
