// Date și grafice: grafic cu bare, pictogramă, bețișoare, cerc cu felii, tabel, podium.
// Toate sunt desene „cu date”: schimbarea lor într-un test publicat cere versiune nouă.

import { escapeHTML } from '../core/dom.js';
import { hasEmoji } from './emoji.js';
import { registerVisual } from './index.js';
import { C, emojiImage, has, list, num, st, txt } from './palette.js';

const GROUP = 'Date și grafice';
const COLORS = [C.blue, C.red, C.yellow, C.green, C.purple, C.orange, C.teal, C.pink];
const nums = (v) => list(v).map((x) => num(x, 0));
// listă fără golurile scoase: emoji-ul gol al unei categorii nu trebuie să mute emoji-urile celorlalte
const raw = (v) => (Array.isArray(v) ? v : has(v) ? String(v).split(',') : []).map((x) => String(x ?? '').trim());
const pairs = (p) => list(p.labels).map((label, i) => ({ id: raw(p.ids)[i] || label, label, value: nums(p.values)[i] ?? 0, emoji: raw(p.emojis)[i] || raw(p.emoji)[i] || raw(p.emoji)[0] || '' }));

/** Verificările comune ale seriilor de date: etichete, valori numerice, emoji cunoscute, liste de aceeași lungime. */
function checkSeries(p) {
  const errors = [];
  const labels = list(p.labels);
  const values = raw(p.values).filter((x) => x !== '');
  if (!labels.length) errors.push('lipsesc etichetele (labels)');
  if (values.length !== labels.length) errors.push(`labels are ${labels.length} elemente, iar values are ${values.length}`);
  if (values.some((x) => !Number.isFinite(Number(x)))) errors.push('values trebuie să conțină doar numere');
  for (const key of ['emojis', 'emoji']) {
    const names = raw(p[key]);
    if (names.length > 1 && names.length !== labels.length) errors.push(`${key} are ${names.length} elemente, iar labels are ${labels.length}`);
    for (const n of names) if (n && !hasEmoji(n)) errors.push(`emoji necunoscut „${n}”`);
  }
  return errors;
}
const describe = (rows) => rows.map((r) => `${r.label} ${r.value}`).join(', ');

// ——— Grafic cu bare ———
// values: valorile barelor; hide: barele ascunse (afișate cu „?”); numbers: scrie valorile deasupra barelor
registerVisual('bar-chart', {
  group: GROUP,
  defaults: { step: 1, numbers: false },
  viewBox: '0 0 320 200',
  check: (p) => [...checkSeries(p), ...(num(p.step, 0) > 0 ? [] : ['step trebuie să fie un număr pozitiv'])],
  label: (p) => {
    const hidden = new Set(list(p.hide));
    const step = Math.max(1, num(p.step, 1));
    return `grafic cu bare (o linie = ${step}): ${pairs(p).map((r) => `${r.label} ${hidden.has(r.id) || hidden.has(r.label) ? 'necunoscut' : r.value}`).join(', ')}`;
  },
  render: (p) => {
    const rows = pairs(p);
    const step = Math.max(1, num(p.step, 1));
    const hidden = new Set(list(p.hide));
    const top = Math.max(...rows.map((r) => r.value), step);
    const max = Math.max(num(p.max, 0), Math.ceil(top / step) * step, step);
    const x0 = 44;
    const y0 = 150;
    const plotW = 266;
    const plotH = 128;
    const y = (v) => y0 - (v / max) * plotH;
    const lines = max / step;
    const every = lines > 10 ? Math.ceil(lines / 10) : 1;
    let out = `<rect x="${x0}" y="${y0 - plotH}" width="${plotW}" height="${plotH}" fill="${C.white}" opacity=".6"/>`;
    for (let v = 0; v <= max + 1e-9; v += step) {
      const i = Math.round(v / step);
      out += `<line x1="${x0}" y1="${y(v)}" x2="${x0 + plotW}" y2="${y(v)}" stroke="${C.gray}" stroke-width="${v === 0 ? 2.5 : 1}"/>`;
      if (i % every === 0) out += txt(x0 - 8, y(v), v, { size: 11, anchor: 'end' });
    }
    out += `<line x1="${x0}" y1="${y0 - plotH - 6}" x2="${x0}" y2="${y0}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
    const slot = plotW / Math.max(1, rows.length);
    const bw = Math.min(52, slot * 0.62);
    rows.forEach((r, i) => {
      const cx = x0 + slot * (i + 0.5);
      const isHidden = hidden.has(r.id) || hidden.has(r.label);
      if (isHidden) {
        out += `<rect class="v-bar-chart__bar" data-id="${escapeHTML(r.id)}" x="${cx - bw / 2}" y="${y(max) + 4}" width="${bw}" height="${plotH - 4}" rx="4" fill="${C.grayLight}" stroke="${C.gray}" stroke-width="2" stroke-dasharray="6 5"/>`;
        out += txt(cx, y0 - plotH / 2, '?', { size: 26, fill: C.gray });
      } else {
        const h = Math.max(0, y0 - y(Math.min(r.value, max)));
        out += `<rect class="v-bar-chart__bar" data-id="${escapeHTML(r.id)}" x="${cx - bw / 2}" y="${y0 - h}" width="${bw}" height="${h}" rx="4" fill="${COLORS[i % COLORS.length]}" ${st(2)}/>`;
        if (p.numbers === true || p.numbers === 'true') out += txt(cx, y0 - h - 10, r.value, { size: 13 });
      }
      if (r.emoji) out += emojiImage(r.emoji, cx - 11, y0 + 6, 22);
      out += txt(cx, y0 + (r.emoji ? 38 : 16), r.label, { size: 11 });
    });
    return out;
  },
  demos: [
    { labels: 'mere,banane,pere', values: '8,6,2', step: 2, emojis: 'mar,banana,para' },
    { labels: 'aur,argint,bronz', values: '6,4,8', step: 2, max: 10, hide: 'bronz' },
  ],
});

// ——— Pictogramă: un simbol înseamnă `each` (1, 2, 5 sau 10) ———
registerVisual('pictogram', {
  group: GROUP,
  defaults: { each: 1, emoji: 'mar', unit: 'copii' },
  check: (p) => [...checkSeries(p), ...(num(p.each, 0) >= 1 ? [] : ['each trebuie să fie cel puțin 1'])],
  viewBox: (p) => `0 0 320 ${52 + 34 * list(p.labels).length}`,
  label: (p) => `pictogramă (un simbol = ${num(p.each, 1)}): ${describe(pairs(p))}`,
  render: (p) => {
    const rows = pairs(p);
    const each = Math.max(1, num(p.each, 1));
    const most = Math.max(1, ...rows.map((r) => Math.ceil(r.value / each)));
    const size = Math.max(12, Math.min(24, Math.floor(220 / most) - 3)); // simbolurile încap pe rând
    let out = '';
    rows.forEach((r, i) => {
      const y = 8 + i * 34;
      out += `<rect x="4" y="${y}" width="312" height="30" rx="6" fill="${i % 2 ? C.white : C.cream}" opacity=".8"/>`;
      out += txt(10, y + 15, r.label, { size: 12, anchor: 'start' });
      const count = Math.ceil(r.value / each);
      for (let k = 0; k < count; k++) {
        const x = 96 + k * (size + 3);
        const whole = (k + 1) * each <= r.value;
        out += whole
          ? emojiImage(r.emoji, x, y + 3, size)
          : `<g opacity=".55">${emojiImage(r.emoji, x, y + 3, size)}</g>`;
      }
    });
    const ly = 12 + rows.length * 34;
    out += `<rect x="4" y="${ly}" width="312" height="32" rx="6" fill="${C.white}" ${st(1.5)}/>`;
    if (new Set(rows.map((r) => r.emoji)).size === 1) {
      out += emojiImage(rows[0]?.emoji, 12, ly + 4, 24);
      out += txt(44, ly + 16, `= ${each} ${p.unit}`, { size: 12, anchor: 'start' });
    } else {
      out += txt(14, ly + 16, `Fiecare simbol = ${each} ${p.unit}`, { size: 12, anchor: 'start' });
    }
    return out;
  },
  demos: [
    { labels: 'mere,pere,banane', values: '8,2,6', emoji: 'mar', each: 2 },
    { labels: 'Roșie,Albastră', values: '15,20', emoji: 'apa', each: 5, unit: 'sticle' },
  ],
});

// ——— Bețișoare (grupe de 5) ———
registerVisual('tally', {
  group: GROUP,
  check: checkSeries,
  viewBox: (p) => `0 0 320 ${12 + 34 * list(p.labels).length}`,
  label: (p) => `bețișoare: ${describe(pairs(p))}`,
  render: (p) => {
    let out = '';
    pairs(p).forEach((r, i) => {
      const y = 8 + i * 34;
      out += `<rect x="4" y="${y}" width="312" height="30" rx="6" fill="${i % 2 ? C.white : C.cream}" opacity=".8"/>`;
      out += txt(10, y + 15, r.label, { size: 12, anchor: 'start' });
      let x = 100;
      for (let k = 0; k < r.value; k++) {
        const inGroup = k % 5;
        if (inGroup === 4) {
          out += `<line x1="${x - 34}" y1="${y + 24}" x2="${x - 2}" y2="${y + 6}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
          x += 14;
        } else {
          out += `<line x1="${x}" y1="${y + 5}" x2="${x}" y2="${y + 25}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
          x += 8;
        }
      }
    });
    return out;
  },
  demos: [{ labels: 'mere,banane,struguri', values: '8,6,4' }],
});

// ——— Cerc împărțit în felii egale (jumătate, sfert) ———
registerVisual('pie', {
  group: GROUP,
  defaults: { slices: 4, filled: 1 },
  viewBox: '0 0 120 120',
  check: (p) => (num(p.filled, 0) <= num(p.slices, 4) ? [] : ['filled nu poate fi mai mare decât slices']),
  label: (p) => `cerc împărțit în ${num(p.slices, 4)} felii egale, ${num(p.filled, 0)} colorate${has(p.labels) ? `: ${list(p.labels).join(', ')}` : ''}`,
  render: (p) => {
    const n = Math.max(2, num(p.slices, 4));
    const filled = Math.max(0, Math.min(n, num(p.filled, 0)));
    const labels = list(p.labels);
    const r = 50;
    let out = '';
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const a1 = a0 + (2 * Math.PI) / n;
      const [x0, y0, x1, y1] = [60 + r * Math.cos(a0), 60 + r * Math.sin(a0), 60 + r * Math.cos(a1), 60 + r * Math.sin(a1)].map((v) => v.toFixed(1));
      out += `<path d="M60 60 L${x0} ${y0} A${r} ${r} 0 ${n === 2 ? 1 : 0} 1 ${x1} ${y1} Z" fill="${i < filled ? COLORS[i % COLORS.length] : C.white}" ${st(2)}/>`;
      if (labels[i]) {
        const am = (a0 + a1) / 2;
        out += txt((60 + r * 0.62 * Math.cos(am)).toFixed(1), (60 + r * 0.62 * Math.sin(am)).toFixed(1), labels[i], { size: 10 });
      }
    }
    return out;
  },
  demos: [{ slices: 4, filled: 1 }, { slices: 4, filled: 2, labels: '6 h,6 h,6 h,6 h' }, { slices: 8, filled: 3 }],
});

// ——— Tabel de date: head 'Tren|Pleacă|Ajunge', rows ['R1|8:00|10:30', …] sau 'R1|8:00|10:30;R2|…' ———
const cells = (s) => String(s ?? '').split('|').map((x) => x.trim());
const rowsOf = (p) => (Array.isArray(p.rows) ? p.rows : String(p.rows ?? '').split(';')).map(cells).filter((r) => r.some((c) => c !== ''));
registerVisual('data-table', {
  group: GROUP,
  check: (p) => {
    const width = has(p.head) ? cells(p.head).length : null;
    return width === null ? [] : rowsOf(p).filter((r) => r.length !== width).map((r) => `rândul „${r.join('|')}” are ${r.length} celule, capul tabelului ${width}`);
  },
  viewBox: (p) => `0 0 320 ${14 + 28 * (rowsOf(p).length + (has(p.head) ? 1 : 0))}`,
  label: (p) => `tabel: ${[has(p.head) ? cells(p.head) : null, ...rowsOf(p)].filter(Boolean).map((r) => r.join(', ')).join('; ')}`,
  render: (p) => {
    const head = has(p.head) ? cells(p.head) : null;
    const body = rowsOf(p);
    const cols = Math.max(head?.length ?? 0, ...body.map((r) => r.length), 1);
    const cw = 304 / cols;
    const highlight = num(p.highlight, -1);
    let out = '';
    const row = (cellsIn, y, isHead, hi) => {
      cellsIn.forEach((c, j) => {
        out += `<rect x="${8 + j * cw}" y="${y}" width="${cw}" height="28" fill="${isHead ? C.yellow : hi ? C.cream : C.white}" ${st(1.5)}/>`;
        out += txt(8 + j * cw + cw / 2, y + 14, c, { size: c.length > 14 ? 9 : 12, weight: isHead || j === 0 ? 700 : 500 });
      });
    };
    let y = 6;
    if (head) {
      row(head, y, true, false);
      y += 28;
    }
    body.forEach((r, i) => {
      row(r, y, false, i === highlight);
      y += 28;
    });
    return out;
  },
  demos: [
    { head: 'Tren|Pleacă|Ajunge', rows: 'Tren 1|8:00|10:30;Tren 2|9:15|11:15;Tren 3|10:45|12:00' },
    { head: 'Echipa|Puncte', rows: ['Roșie|416', 'Albastră|403', 'Verde|461', 'Galbenă|380'], highlight: 2 },
  ],
});

// ——— Podium ———
registerVisual('podium', {
  group: GROUP,
  viewBox: '0 0 300 150',
  label: (p) => `podium: ${list(p.names).map((n, i) => `locul ${i + 1} ${n}${has(list(p.values)[i]) ? ` cu ${list(p.values)[i]}` : ''}`).join(', ')}`,
  render: (p) => {
    const names = list(p.names);
    const values = list(p.values);
    const blocks = [{ x: 100, h: 70, i: 0, color: C.yellow }, { x: 10, h: 50, i: 1, color: C.grayLight }, { x: 190, h: 38, i: 2, color: C.orangeDark }];
    let out = `<rect y="140" width="300" height="10" fill="${C.brownLight}"/>`;
    for (const b of blocks) {
      if (names[b.i] === undefined) continue;
      out += `<rect x="${b.x}" y="${140 - b.h}" width="100" height="${b.h}" rx="4" fill="${b.color}" ${st(2)}/>`;
      out += txt(b.x + 50, 140 - b.h + 18, b.i + 1, { size: 18 });
      out += txt(b.x + 50, 140 - b.h - 12, names[b.i], { size: 13 });
      if (has(values[b.i])) out += txt(b.x + 50, 140 - b.h - 28, values[b.i], { size: 12, fill: C.ink, weight: 500 });
    }
    return out;
  },
  demos: [{ names: 'Verde,Roșie,Albastră', values: '461,416,403' }],
});
