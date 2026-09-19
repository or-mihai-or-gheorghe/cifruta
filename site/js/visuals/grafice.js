// Grafice pentru Jocurile fulger (și pentru teste): bare cu una sau două serii, pictogramă cu legendă, tabel cu numere sau
// bețișoare, cerc cu felii egale, grafic în timp cu una sau două serii și două cercuri (Venn). Sunt desenate pentru telefon:
// 320 de unități lățime, etichete de cel puțin 18, numere de cel puțin 20, emoji de cel puțin 24 (tests/visuals.test.js).
// Culoarea nu e singurul indiciu: a doua serie are dungi sau linie punctată cu pătrate, feliile au emoji, cercul al doilea e punctat.
// Numele citit de cititorul de ecran spune datele, niciodată rezultatul unei întrebări (cel mai mare, totalul).

import { cantitate } from '../core/ro.js';
import { EMOJI, hasEmoji } from './emoji.js';
import { registerVisual } from './index.js';
import { C, emojiImage, has, st, txt } from './palette.js';

const GROUP = 'Grafice pentru jocuri';
/** Culorile seriilor, în ordine fixă (validate pentru daltonism): albastru, portocaliu, verde, indigo. */
export const SERIES = [C.series1, C.series2, C.series3, C.series4];
export const SIZE = { label: 18, num: 20, big: 26, emoji: 28, small: 24 };
/** Zilele săptămânii: prescurtarea de pe axă și numele întreg. */
export const DAYS = {
  luni: ['Lu', 'luni'],
  marti: ['Ma', 'marți'],
  miercuri: ['Mi', 'miercuri'],
  joi: ['Jo', 'joi'],
  vineri: ['Vi', 'vineri'],
  sambata: ['Sâ', 'sâmbătă'],
  duminica: ['Du', 'duminică'],
};

const arr = (v) => (Array.isArray(v) ? v : []);
export const r1 = (n) => Math.round(n * 10) / 10;
const unitPl = (u) => (Array.isArray(u) ? u[1] : (u ?? ''));
const isNat = (n) => Number.isInteger(n) && n >= 0;
/** Lățimea aproximativă a unui text (Andika aldin), pentru așezarea legendelor. */
export const textWidth = (s, size) => String(s).length * size * 0.56;
/** Numele unei categorii pentru cititorul de ecran: numele dat, eticheta emoji-ului sau textul. */
export const nameOf = (c) => c?.name ?? (c?.emoji ? EMOJI[c.emoji]?.label : null) ?? c?.text ?? String(c?.id ?? '');
/** Pastilă albă cu un număr (valoarea arătată în desenul rezolvat, minutele de pe hartă, alunele de pe crengi). */
export const pill = (x, y, s, size = SIZE.num) => {
  const w = r1(14 + textWidth(s, size));
  return `<rect x="${r1(x - w / 2)}" y="${r1(y - 13)}" width="${w}" height="26" rx="13" fill="${C.white}" ${st(1.5)}/>` + txt(r1(x), r1(y), s, { size });
};

function checkCats(cats, { min = 1, max = 5, what = 'categorii' } = {}) {
  const errors = [];
  if (cats.length < min || cats.length > max) errors.push(`între ${min} și ${max} ${what} (acum ${cats.length})`);
  const ids = cats.map((c) => c?.id);
  if (ids.some((id) => !has(id)) || new Set(ids.map(String)).size !== ids.length) errors.push(`${what}: fiecare are un id unic`);
  for (const c of cats) if (c?.emoji && !hasEmoji(c.emoji)) errors.push(`emoji necunoscut „${c.emoji}”`);
  return errors;
}

function checkSeries(series, n) {
  const errors = [];
  if (series.length < 1 || series.length > 2) errors.push(`una sau două serii (acum ${series.length})`);
  for (const s of series) {
    const values = arr(s?.values);
    if (values.length !== n) errors.push(`seria „${s?.id}” are ${values.length} valori, iar axa are ${n}`);
    if (!values.every(isNat)) errors.push(`seria „${s?.id}”: valorile sunt numere naturale`);
    if (series.length > 1 && !has(s?.name)) errors.push(`seria „${s?.id}” are nevoie de nume (legenda)`);
  }
  if (new Set(series.map((s) => s?.id)).size !== series.length) errors.push('seriile au id-uri diferite');
  return errors;
}

const topOf = (p) => Math.max(0, ...arr(p.series).flatMap((s) => arr(s.values)));
const scaleMax = (p) => Math.max(Number(p.max) || 0, Math.ceil(topOf(p) / p.step) * p.step, p.step);
function checkScale(p) {
  if (!(Number(p.step) > 0)) return ['step trebuie să fie pozitiv'];
  const lines = scaleMax(p) / p.step;
  return lines > 7 ? [`prea multe linii pe grilă (${lines}); cel mult 7, ca numerele să se citească`] : [];
}

// ——— Axa valorilor, comună barelor și graficului în timp ———
const X0 = 50;
const X1 = 312;
const Y1 = 46;

function grid(p, y0) {
  const max = scaleMax(p);
  const y = (v) => r1(y0 - (v / max) * (y0 - Y1));
  let out = '';
  for (let v = 0; v <= max; v += p.step) {
    out += `<line x1="${X0}" y1="${y(v)}" x2="${X1}" y2="${y(v)}" stroke="${v === 0 ? C.ink : C.gray}" stroke-width="${v === 0 ? 2.5 : 1.2}" stroke-linecap="round"/>`;
    out += txt(X0 - 8, y(v), v, { size: SIZE.label, anchor: 'end', weight: 600 });
  }
  if (has(unitPl(p.unit))) out += txt(6, 16, unitPl(p.unit), { size: SIZE.label, anchor: 'start' });
  return { y, max, out };
}

/** Legenda a două serii, aliniată la dreapta, sus: semnul seriei și numele ei. */
function legend(series, swatch) {
  let x = X1;
  let out = '';
  for (let k = series.length - 1; k >= 0; k--) {
    x -= textWidth(series[k].name, SIZE.label);
    out += txt(r1(x), 16, series[k].name, { size: SIZE.label, anchor: 'start' });
    x -= 30;
    out += swatch(k, r1(x), 16);
    x -= 14;
  }
  return out;
}

const stripes = (uid) =>
  `<defs><pattern id="${uid}-s" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
  `<rect width="8" height="8" fill="${SERIES[1]}"/><rect width="3" height="8" fill="${C.white}" opacity=".55"/></pattern></defs>`;

const describeSeries = (series, xs) =>
  series.map((s) => `${series.length > 1 ? `${s.name}: ` : ''}${xs.map((x, i) => `${x} ${s.values[i]}`).join(', ')}`).join('; ');

// ——— Bare: una sau două serii (a doua cu dungi), bară ascunsă cu „?”, bare marcate cu valoarea lor ———
// cats: [{ id, emoji? | text?, name? }] · series: [{ id, name, values }] · step, max, unit [sg, pl] · month (categoriile sunt zile ale lunii)
// hide: id-ul barei ascunse (o singură serie) · mark: [{ cat, s? }] barele evidențiate în desenul rezolvat
registerVisual('chart-bars', {
  group: GROUP,
  defaults: { step: 1 },
  viewBox: '0 0 320 210',
  check: (p) => {
    const cats = arr(p.cats);
    const errors = [...checkCats(cats), ...checkSeries(arr(p.series), cats.length), ...checkScale(p)];
    if (has(p.hide) && (arr(p.series).length > 1 || !cats.some((c) => c.id === p.hide))) errors.push(`bara ascunsă „${p.hide}” nu există (sau sunt două serii)`);
    return errors;
  },
  label: (p) => {
    const cats = arr(p.cats).map((c) => (p.month ? `${c.text ?? c.id} ${p.month}` : nameOf(c)));
    const series = arr(p.series).map((s) => ({ ...s, values: s.values.map((v, i) => (arr(p.cats)[i]?.id === p.hide ? 'necunoscut' : v)) }));
    return `grafic cu bare${has(unitPl(p.unit)) ? `, ${unitPl(p.unit)}` : ''} (o linie = ${p.step}): ${describeSeries(series, cats)}`;
  },
  render: (p, { uid }) => {
    const cats = arr(p.cats);
    const series = arr(p.series);
    const two = series.length > 1;
    const y0 = p.month ? 158 : cats.some((c) => c.emoji) ? 170 : 178;
    const { y, max, out: axis } = grid(p, y0);
    const marks = new Set(arr(p.mark).map((m) => `${m.cat}|${m.s ?? series[0]?.id}`));
    const slot = (X1 - X0) / cats.length;
    let out = (two ? stripes(uid) : '') + axis;
    cats.forEach((c, i) => {
      const cx = X0 + slot * (i + 0.5);
      const gw = Math.min(slot * 0.74, two ? 66 : 46);
      const bw = two ? (gw - 3) / 2 : gw;
      const pills = [];
      series.forEach((s, k) => {
        const v = s.values[i];
        const x = r1(two ? cx - gw / 2 + k * (bw + 3) : cx - bw / 2);
        if (!two && p.hide === c.id) {
          out += `<rect x="${x}" y="${y(max)}" width="${r1(bw)}" height="${r1(y0 - y(max))}" rx="4" fill="${C.grayLight}" stroke="${C.grayDark}" stroke-width="2" stroke-dasharray="6 5"/>`;
          out += txt(r1(cx), r1((y0 + y(max)) / 2), '?', { size: SIZE.big });
          return;
        }
        const marked = marks.has(`${c.id}|${s.id}`);
        const faded = marks.size > 0 && !marked;
        if (v > 0) {
          out += `<rect class="v-chart-bars__bar" data-value="${v}" x="${x}" y="${y(v)}" width="${r1(bw)}" height="${r1(y0 - y(v))}" rx="3" fill="${k ? `url(#${uid}-s)` : SERIES[0]}" ${st(marked ? 3.5 : 2)}${faded ? ' opacity=".35"' : ''}/>`;
        }
        if (marked) pills.push({ x: x + bw / 2, v });
      });
      // valorile barelor marcate stau deasupra celei mai înalte (în ea, dacă ar ajunge la rândul de sus, cu unitatea): la două serii
      // una lângă alta, iar la valori egale una singură
      if (pills.length) {
        const top = Math.min(...pills.map((m) => y(m.v))) - 18;
        const py = top < Y1 - 8 ? top + 36 : top;
        const shown = pills.length === 2 && pills[0].v === pills[1].v ? [{ x: cx, v: pills[0].v }] : pills;
        if (shown.length === 2) {
          const d = Math.max(16 + (textWidth(shown[0].v, SIZE.num) + textWidth(shown[1].v, SIZE.num)) / 2, shown[1].x - shown[0].x) / 2;
          [shown[0].x, shown[1].x] = [cx - d, cx + d];
        }
        for (const m of shown) out += pill(r1(m.x), r1(py), m.v);
      }
      out += c.emoji ? emojiImage(c.emoji, r1(cx - 14), y0 + 5, SIZE.emoji) : txt(r1(cx), y0 + 16, c.text ?? c.name, { size: SIZE.label });
    });
    if (p.month) out += txt((X0 + X1) / 2, y0 + 40, p.month, { size: SIZE.label });
    if (two) out += legend(series, (k, x, cy) => `<rect x="${x}" y="${cy - 8}" width="20" height="16" rx="3" fill="${k ? `url(#${uid}-s)` : SERIES[0]}" ${st(1.5)}/>`);
    return out;
  },
  demos: [
    { cats: [{ id: 'mar', emoji: 'mar', name: 'mere' }, { id: 'para', emoji: 'para', name: 'pere' }, { id: 'cirese', emoji: 'cirese', name: 'cireșe' }, { id: 'banana', emoji: 'banana', name: 'banane' }], series: [{ id: 's', values: [8, 5, 10, 3] }], step: 2, unit: ['fruct', 'fructe'] },
    { cats: [{ id: 'mar', emoji: 'mar', name: 'mere' }, { id: 'para', emoji: 'para', name: 'pere' }, { id: 'cirese', emoji: 'cirese', name: 'cireșe' }], series: [{ id: 's', values: [40, 25, 30] }], step: 10, hide: 'para', unit: ['vizitator', 'vizitatori'] },
    { cats: [8, 9, 10, 11].map((d) => ({ id: String(d), text: String(d) })), month: 'iunie', series: [{ id: 'ana', name: 'Ana', values: [3, 5, 2, 6] }, { id: 'dan', name: 'Dan', values: [4, 2, 2, 5] }], step: 1, unit: ['carte', 'cărți'], mark: [{ cat: '10', s: 'ana' }, { cat: '10', s: 'dan' }] },
  ],
});

// ——— Grafic în timp: zilele săptămânii (days) sau zile ale unei luni (dates + month), una sau două serii ———
// seria 1: linie plină cu cercuri; seria 2: linie punctată cu pătrate · mark: [{ s?, x }] punctele evidențiate, cu valoarea lor
const xsOf = (p) =>
  Array.isArray(p.days)
    ? p.days.map((d) => ({ id: d, short: DAYS[d]?.[0] ?? d, name: DAYS[d]?.[1] ?? d }))
    : arr(p.dates).map((d) => ({ id: d, short: String(d), name: `${d} ${p.month}` }));

registerVisual('chart-line', {
  group: GROUP,
  defaults: { step: 1 },
  viewBox: '0 0 320 210',
  check: (p) => {
    const xs = xsOf(p);
    const errors = [...checkSeries(arr(p.series), xs.length), ...checkScale(p)];
    if (xs.length < 3 || xs.length > 7) errors.push(`între 3 și 7 zile (acum ${xs.length})`);
    if (Array.isArray(p.days) && p.days.some((d) => !DAYS[d])) errors.push('zile necunoscute');
    if (!Array.isArray(p.days) && !has(p.month)) errors.push('zilele lunii cer și luna (month)');
    return errors;
  },
  label: (p) => `grafic în timp${has(unitPl(p.unit)) ? `, ${unitPl(p.unit)}` : ''} (o linie = ${p.step}): ${describeSeries(arr(p.series), xsOf(p).map((x) => x.name))}`,
  render: (p) => {
    const xs = xsOf(p);
    const series = arr(p.series);
    const y0 = Array.isArray(p.days) ? 178 : 158;
    const { y, out: axis } = grid(p, y0);
    const slot = (X1 - X0) / xs.length;
    const cx = (i) => r1(X0 + slot * (i + 0.5));
    let out = axis;
    // seria a doua (pătrate) stă sub prima (cercuri): la valori egale se văd amândouă semnele
    for (let k = series.length - 1; k >= 0; k--) {
      const pts = series[k].values.map((v, i) => [cx(i), y(v)]);
      out += `<polyline points="${pts.map((q) => q.join(',')).join(' ')}" fill="none" stroke="${SERIES[k]}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"${k ? ' stroke-dasharray="9 6"' : ''}/>`;
      for (const [px, py] of pts) {
        out += k
          ? `<rect x="${r1(px - 7.5)}" y="${r1(py - 7.5)}" width="15" height="15" fill="${SERIES[k]}" stroke="${C.white}" stroke-width="2"/>`
          : `<circle cx="${px}" cy="${py}" r="7.5" fill="${SERIES[k]}" stroke="${C.white}" stroke-width="2"/>`;
      }
    }
    const marks = arr(p.mark)
      .map((m) => ({ k: Math.max(0, series.findIndex((s) => s.id === (m.s ?? series[0]?.id))), i: xs.findIndex((x) => String(x.id) === String(m.x)) }))
      .filter((m) => m.i >= 0 && series[m.k])
      .map((m) => ({ ...m, v: series[m.k].values[m.i] }));
    for (const m of marks) {
      const [px, py] = [cx(m.i), y(m.v)];
      out += `<circle cx="${px}" cy="${py}" r="12" fill="none" ${st(3)}/>`;
      // două serii marcate în aceeași zi: valoarea mai mare deasupra punctului ei, cea mai mică dedesubt (la valori egale, o singură
      // pastilă); lângă rândul de sus sau lângă zilele de pe axă, pastila trece alături de punct, spre interiorul graficului
      const twin = marks.find((o) => o !== m && o.i === m.i);
      if (twin && twin.v === m.v && twin.k < m.k) continue;
      const up = py - 28 >= Y1 - 8;
      const down = py + 41 <= y0 + 4;
      const side = r1(px + (m.i === xs.length - 1 ? -1 : 1) * (22 + textWidth(m.v, SIZE.num) / 2));
      if (twin && twin.v < m.v) out += up ? pill(px, py - 28, m.v) : pill(side, py, m.v);
      else if (twin && twin.v > m.v) out += down ? pill(px, py + 28, m.v) : pill(side, py, m.v);
      else out += pill(px, up ? py - 28 : py + 28, m.v);
    }
    xs.forEach((x, i) => (out += txt(cx(i), y0 + 16, x.short, { size: SIZE.label })));
    if (!Array.isArray(p.days)) out += txt((X0 + X1) / 2, y0 + 40, p.month, { size: SIZE.label });
    if (series.length > 1) {
      out += legend(series, (k, x, cy) =>
        `<line x1="${x}" y1="${cy}" x2="${x + 24}" y2="${cy}" stroke="${SERIES[k]}" stroke-width="3.5"${k ? ' stroke-dasharray="6 4"' : ''}/>` +
        (k ? `<rect x="${x + 5}" y="${cy - 7}" width="14" height="14" fill="${SERIES[k]}" stroke="${C.white}" stroke-width="2"/>` : `<circle cx="${x + 12}" cy="${cy}" r="7" fill="${SERIES[k]}" stroke="${C.white}" stroke-width="2"/>`),
      );
    }
    return out;
  },
  demos: [
    { days: ['luni', 'marti', 'miercuri', 'joi', 'vineri'], series: [{ id: 'alune', values: [4, 7, 5, 9, 6] }], step: 2, unit: ['alună', 'alune'] },
    { dates: [8, 9, 10, 11, 12], month: 'iunie', series: [{ id: 'ana', name: 'Ana', values: [3, 5, 4, 6, 2] }, { id: 'dan', name: 'Dan', values: [2, 5, 1, 3, 4] }], step: 1, unit: ['carte', 'cărți'], mark: [{ s: 'ana', x: 10 }, { s: 'dan', x: 10 }] },
  ],
});

// ——— Pictogramă: pe fiecare rând, simboluri întregi (un simbol = 1, 2, 5 sau 10), cu legenda dedesubt ———
// rows: [{ id, emoji? | name }] · values · symbol (emoji-ul comun; altfel emoji-ul rândului) · each · unit [sg, pl] · mark: [id]
registerVisual('chart-picto', {
  group: GROUP,
  defaults: { each: 1 },
  viewBox: (p) => `0 0 320 ${56 + 42 * arr(p.rows).length}`,
  check: (p) => {
    const rows = arr(p.rows);
    const values = arr(p.values);
    const each = Number(p.each);
    const errors = checkCats(rows, { min: 2, max: 5, what: 'rânduri' });
    if (values.length !== rows.length) errors.push(`rows are ${rows.length} rânduri, iar values ${values.length}`);
    if (![1, 2, 5, 10].includes(each)) errors.push('each este 1, 2, 5 sau 10');
    if (!values.every((v) => isNat(v) && v % each === 0)) errors.push('valorile sunt multipli de each (doar simboluri întregi)');
    if (values.some((v) => v / each > 8)) errors.push('cel mult 8 simboluri pe rând');
    if (has(p.symbol) ? !hasEmoji(p.symbol) : rows.some((r) => !r.emoji)) errors.push('simbolul lipsește sau e necunoscut');
    if (!Array.isArray(p.unit)) errors.push('unit este [singular, plural]');
    return errors;
  },
  label: (p) => {
    const each = Number(p.each);
    // câte simboluri are fiecare rând (cu un simbol = 5, valoarea ar fi chiar răspunsul întrebării)
    const count = (v) => (each === 1 ? v : cantitate(v / each, 'simbol', 'simboluri'));
    return `pictogramă, un simbol = ${cantitate(each, ...arr(p.unit))}: ${arr(p.rows).map((r, i) => `${nameOf(r)} ${count(arr(p.values)[i])}`).join(', ')}`;
  },
  render: (p) => {
    const rows = arr(p.rows);
    const marks = new Set(arr(p.mark));
    let out = '';
    rows.forEach((r, i) => {
      const y = 8 + i * 42;
      out += `<rect x="4" y="${y}" width="312" height="38" rx="8" fill="${i % 2 ? C.white : C.cream}" ${marks.has(r.id) ? st(3.5) : ''}/>`;
      out += r.emoji ? emojiImage(r.emoji, 10, y + 5, SIZE.emoji) : txt(12, y + 19, r.name, { size: SIZE.label, anchor: 'start' });
      const symbol = p.symbol ?? r.emoji;
      for (let k = 0; k < p.values[i] / p.each; k++) out += emojiImage(symbol, 84 + k * 28, y + 6, 26);
    });
    const ly = 14 + rows.length * 42;
    out += `<rect x="4" y="${ly}" width="312" height="36" rx="8" fill="${C.white}" ${st(1.5)}/>`;
    const amount = cantitate(Number(p.each), ...p.unit);
    out += p.symbol
      ? emojiImage(p.symbol, 14, ly + 5, 26) + txt(48, ly + 18, `= ${amount}`, { size: SIZE.label, anchor: 'start' })
      : txt(14, ly + 18, `un simbol = ${amount}`, { size: SIZE.label, anchor: 'start' });
    return out;
  },
  demos: [
    { rows: [{ id: 'ana', name: 'Ana' }, { id: 'dan', name: 'Dan' }, { id: 'ema', name: 'Ema' }], values: [10, 25, 15], symbol: 'mar', each: 5, unit: ['măr', 'mere'] },
    { rows: [{ id: 'mar', emoji: 'mar', name: 'mere' }, { id: 'para', emoji: 'para', name: 'pere' }, { id: 'cirese', emoji: 'cirese', name: 'cireșe' }], values: [5, 7, 3], each: 1, unit: ['fruct', 'fructe'], mark: ['para'] },
  ],
});

// ——— Tabel: prima coloană numește rândul (emoji sau text), celelalte au numere sau bețișoare ({ tally: n }, grupe de 5) ———
// cols: capul tabelului (fără prima coloană sau cu ea) · rows: [{ id, emoji? | name, cells }] · mark: [{ r, c }]
const TABLE_TOP = (p) => (arr(p.cols).length ? 36 : 0);
registerVisual('chart-table', {
  group: GROUP,
  viewBox: (p) => `0 0 320 ${TABLE_TOP(p) + 46 * arr(p.rows).length + 6}`,
  check: (p) => {
    const rows = arr(p.rows);
    const errors = checkCats(rows, { min: 2, max: 5, what: 'rânduri' });
    const width = arr(rows[0]?.cells).length;
    if (width < 1 || width > 3) errors.push('între 1 și 3 coloane de date');
    for (const r of rows) {
      const cells = arr(r.cells);
      if (cells.length !== width) errors.push(`rândul „${r.id}” are ${cells.length} celule, primul ${width}`);
      for (const c of cells) if (!(isNat(c) || (isNat(c?.tally) && c.tally <= 20 && width === 1))) errors.push(`rândul „${r.id}”: celulele sunt numere sau, într-o singură coloană, { tally: 0–20 }`);
    }
    if (arr(p.cols).length && arr(p.cols).length !== width + 1) errors.push('cols numește toate coloanele, începând cu prima');
    return errors;
  },
  label: (p) => {
    const cols = arr(p.cols);
    // cu mai multe coloane (zilele), fiecare număr își spune coloana; cu una, capul tabelului o singură dată
    const wide = cols.length > 2;
    const head = (j) => Object.values(DAYS).find(([short]) => short === cols[j + 1])?.[1] ?? cols[j + 1];
    const cell = (c, j) => `${wide ? `${head(j)} ` : ''}${isNat(c?.tally) ? cantitate(c.tally, 'bețișor', 'bețișoare') : c}`;
    const title = cols.length && !wide ? ` (${cols.join(', ')})` : '';
    return `tabel${title}: ${arr(p.rows).map((r) => `${nameOf(r)}: ${arr(r.cells).map(cell).join(', ')}`).join('; ')}`;
  },
  render: (p) => {
    const rows = arr(p.rows);
    const cols = arr(p.cols);
    const width = arr(rows[0]?.cells).length;
    const labelW = 92;
    const cw = (312 - labelW) / width;
    const top = TABLE_TOP(p);
    const marks = new Set(arr(p.mark).map((m) => `${m.r}|${m.c}`));
    let out = '';
    if (cols.length) {
      cols.forEach((c, j) => {
        const x = j === 0 ? 4 : 4 + labelW + (j - 1) * cw;
        const w = j === 0 ? labelW : cw;
        out += `<rect x="${r1(x)}" y="4" width="${r1(w)}" height="36" fill="${C.yellowLight}" ${st(1.5)}/>` + txt(r1(x + w / 2), 22, c, { size: SIZE.label });
      });
    }
    rows.forEach((r, i) => {
      const y = top + 4 + i * 46;
      out += `<rect x="4" y="${y}" width="${labelW}" height="46" fill="${C.cream}" ${st(1.5)}/>`;
      out += r.emoji ? emojiImage(r.emoji, 4 + labelW / 2 - 14, y + 9, SIZE.emoji) : txt(4 + labelW / 2, y + 23, r.name, { size: SIZE.label });
      arr(r.cells).forEach((c, j) => {
        const x = 4 + labelW + j * cw;
        const marked = marks.has(`${r.id}|${j}`);
        out += `<rect x="${r1(x)}" y="${y}" width="${r1(cw)}" height="46" fill="${marked ? C.yellowLight : C.white}" ${st(marked ? 3 : 1.5)}/>`;
        if (isNat(c?.tally)) out += tally(x + 12, y + 10, c.tally);
        else out += txt(r1(x + cw / 2), y + 23, c, { size: SIZE.num });
      });
    });
    return out;
  },
  demos: [
    { cols: ['Animal', 'Voturi'], rows: [{ id: 'caine', emoji: 'caine', name: 'câine', cells: [{ tally: 12 }] }, { id: 'pisica', emoji: 'pisica', name: 'pisică', cells: [{ tally: 7 }] }, { id: 'iepure', emoji: 'iepure', name: 'iepure', cells: [{ tally: 9 }] }] },
    { cols: ['', 'Lu', 'Ma', 'Mi'], rows: [{ id: 'ana', name: 'Ana', cells: [4, 7, 2] }, { id: 'dan', name: 'Dan', cells: [6, 3, 5] }, { id: 'ema', name: 'Ema', cells: [8, 1, 4] }], mark: [{ r: 'dan', c: 1 }] },
  ],
});

/** Bețișoare în grupe de 5 (patru în picioare, al cincilea tăiat), începând din colțul (x, y). */
function tally(x, y, n) {
  let out = '';
  let cx = x;
  for (let k = 0; k < n; k++) {
    if (k % 5 === 4) {
      out += `<line x1="${r1(cx - 32)}" y1="${y + 22}" x2="${r1(cx - 2)}" y2="${y + 4}" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`;
      cx += 12;
    } else {
      out += `<line x1="${r1(cx)}" y1="${y}" x2="${r1(cx)}" y2="${y + 26}" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`;
      cx += 8;
    }
  }
  return out;
}

// ——— Cerc cu felii egale: fiecare grupă are câteva felii, fiecare felie valorează `each` (fără fracții) ———
// groups: [{ id, emoji, name, n }] (2–4 grupe, 3–8 felii) · each · unit [sg, pl] · mark: [id] grupele evidențiate
registerVisual('chart-pie', {
  group: GROUP,
  defaults: { each: 1 },
  viewBox: '0 0 320 190',
  check: (p) => {
    const groups = arr(p.groups);
    const errors = checkCats(groups, { min: 2, max: 4, what: 'grupe' });
    const total = groups.reduce((s, g) => s + (Number(g.n) || 0), 0);
    if (groups.some((g) => !Number.isInteger(g.n) || g.n < 1)) errors.push('fiecare grupă are cel puțin o felie');
    if (total < 3 || total > 8) errors.push(`între 3 și 8 felii (acum ${total})`);
    if (groups.some((g) => !g.emoji)) errors.push('fiecare grupă are un emoji');
    if (![1, 2, 5, 10].includes(Number(p.each))) errors.push('each este 1, 2, 5 sau 10');
    if (!Array.isArray(p.unit)) errors.push('unit este [singular, plural]');
    return errors;
  },
  label: (p) =>
    `cerc cu felii egale, o felie = ${cantitate(Number(p.each), ...arr(p.unit))}: ${arr(p.groups).map((g) => `${nameOf(g)} ${cantitate(g.n, 'felie', 'felii')}`).join(', ')}`,
  render: (p) => {
    const groups = arr(p.groups);
    const slices = groups.flatMap((g, gi) => Array.from({ length: g.n }, () => gi));
    const n = slices.length;
    const [cx, cy, r] = [92, 96, 84];
    const marks = new Set(arr(p.mark));
    let out = '';
    const at = (a, rr) => [r1(cx + rr * Math.cos(a)), r1(cy + rr * Math.sin(a))];
    slices.forEach((gi, i) => {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const a1 = a0 + (2 * Math.PI) / n;
      const [x0, y0] = at(a0, r);
      const [x1, y1] = at(a1, r);
      const faded = marks.size > 0 && !marks.has(groups[gi].id);
      out += `<path d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="${SERIES[gi]}" stroke="${C.white}" stroke-width="2.5"${faded ? ' opacity=".35"' : ''}/>`;
    });
    out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${st(2.5)}/>`;
    // conturul grupelor marcate: felie cu felie, peste marginea albă
    slices.forEach((gi, i) => {
      if (!marks.has(groups[gi].id)) return;
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const [x0, y0] = at(a0, r);
      const [x1, y1] = at(a0 + (2 * Math.PI) / n, r);
      out += `<path d="M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z" fill="none" ${st(3.5)}/>`;
    });
    slices.forEach((gi, i) => {
      const [ex, ey] = at(-Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / n, r * 0.6);
      out += `<circle cx="${ex}" cy="${ey}" r="16" fill="${C.white}"/>` + emojiImage(groups[gi].emoji, r1(ex - 12), r1(ey - 12), SIZE.small);
    });
    out += txt(252, 20, 'o felie =', { size: SIZE.label });
    out += txt(252, 46, cantitate(Number(p.each), ...p.unit), { size: SIZE.num });
    groups.forEach((g, gi) => {
      const y = 76 + gi * 32;
      if (marks.has(g.id)) out += `<rect x="182" y="${y - 15}" width="134" height="30" rx="8" fill="none" ${st(3)}/>`;
      out += emojiImage(g.emoji, 188, y - 14, SIZE.emoji);
      out += txt(224, y, nameOf(g), { size: SIZE.label, anchor: 'start' });
    });
    return out;
  },
  demos: [
    { groups: [{ id: 'inghetata', emoji: 'inghetata', name: 'înghețată', n: 3 }, { id: 'fructe', emoji: 'mar', name: 'fructe', n: 2 }, { id: 'prajitura', emoji: 'prajitura', name: 'prăjitură', n: 2 }], each: 2, unit: ['copil', 'copii'] },
    { groups: [{ id: 'fotbal', emoji: 'fotbal', name: 'fotbal', n: 4 }, { id: 'baschet', emoji: 'baschet', name: 'baschet', n: 1 }, { id: 'inot', emoji: 'inot', name: 'înot', n: 3 }], each: 5, unit: ['copil', 'copii'], mark: ['inot'] },
  ],
});

// ——— Două cercuri (Venn): doar A, amândouă, doar B ———
// a, b: { emoji, name } · counts: { a, ab, b } · mark: 'a' | 'ab' | 'b' | 'A' (tot cercul A) | 'B' | 'all'
const VENN_REGIONS = { a: ['a'], ab: ['ab'], b: ['b'], A: ['a', 'ab'], B: ['ab', 'b'], all: ['a', 'ab', 'b'] };
registerVisual('venn', {
  group: GROUP,
  viewBox: '0 0 320 200',
  check: (p) => {
    const errors = [];
    for (const side of ['a', 'b']) if (!p[side]?.emoji || !hasEmoji(p[side].emoji) || !has(p[side]?.name)) errors.push(`${side}: emoji cunoscut și nume`);
    for (const k of ['a', 'ab', 'b']) if (!isNat(p.counts?.[k]) || p.counts[k] > 30) errors.push(`counts.${k}: număr natural până la 30`);
    if (has(p.mark) && !VENN_REGIONS[p.mark]) errors.push(`mark necunoscut „${p.mark}”`);
    return errors;
  },
  label: (p) => `două cercuri: doar ${p.a?.name} ${p.counts?.a}, ${p.a?.name} și ${p.b?.name} ${p.counts?.ab}, doar ${p.b?.name} ${p.counts?.b}`,
  render: (p) => {
    const marked = new Set(VENN_REGIONS[p.mark] ?? []);
    let out = `<circle cx="124" cy="118" r="74" fill="${SERIES[0]}" fill-opacity=".16" ${st(3)}/>`;
    out += `<circle cx="196" cy="118" r="74" fill="${SERIES[1]}" fill-opacity=".16" stroke="${C.ink}" stroke-width="3" stroke-dasharray="10 6"/>`;
    const title = (side, cx) => {
      const w = 34 + textWidth(p[side].name, SIZE.label);
      const x = cx - w / 2;
      return emojiImage(p[side].emoji, r1(x), 4, SIZE.emoji) + txt(r1(x + 34), 18, p[side].name, { size: SIZE.label, anchor: 'start' });
    };
    out += title('a', 96) + title('b', 224);
    const spots = { a: 86, ab: 160, b: 234 };
    for (const [k, x] of Object.entries(spots)) {
      if (marked.has(k)) out += `<circle cx="${x}" cy="120" r="22" fill="${C.white}" ${st(3)}/>`;
      out += txt(x, 120, p.counts[k], { size: SIZE.big, cls: 'v-num' });
    }
    return out;
  },
  demos: [
    { a: { emoji: 'pisica', name: 'pisică' }, b: { emoji: 'caine', name: 'câine' }, counts: { a: 5, ab: 3, b: 4 } },
    { a: { emoji: 'mar', name: 'mere' }, b: { emoji: 'para', name: 'pere' }, counts: { a: 7, ab: 2, b: 6 }, mark: 'A' },
  ],
});
