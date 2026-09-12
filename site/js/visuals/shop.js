// Magazin: raft cu produse și etichete de preț, bon de casă, listă de cumpărături.

import { cantitate } from '../core/ro.js';
import { registerVisual } from './index.js';
import { C, emojiImage, has, list, num, st, txt } from './palette.js';

const GROUP = 'Magazin';
const lei = (n) => cantitate(num(n, 0), 'leu', 'lei');

// products: 'minge:120,carte:60' sau [{ emoji, price, label? }]
const productsOf = (p) =>
  (Array.isArray(p.products) ? p.products : list(p.products).map((s) => ({ emoji: s.split(':')[0].trim(), price: s.split(':')[1] })))
    .map((x) => ({ emoji: x.emoji, price: num(x.price, 0), label: x.label ?? x.emoji }));

registerVisual('shelf', {
  group: GROUP,
  defaults: { perRow: 3 },
  viewBox: (p) => `0 0 320 ${10 + 84 * Math.ceil(productsOf(p).length / Math.max(1, num(p.perRow, 3)))}`,
  label: (p) => `raft cu produse: ${productsOf(p).map((x) => `${x.label} ${lei(x.price)}`).join(', ')}`,
  render: (p) => {
    const items = productsOf(p);
    const perRow = Math.max(1, num(p.perRow, 3));
    const slot = 300 / perRow;
    let out = '';
    items.forEach((it, i) => {
      const row = Math.floor(i / perRow);
      const cx = 10 + slot * ((i % perRow) + 0.5);
      const y = 8 + row * 84;
      if (i % perRow === 0) out += `<rect x="6" y="${y + 60}" width="308" height="9" rx="2" fill="${C.brownLight}" ${st(1.5)}/>`;
      out += emojiImage(it.emoji, cx - 20, y + 16, 40);
      out += `<path d="M${cx - 42} ${y + 68} L${cx - 33} ${y + 58} H${cx + 42} V${y + 78} H${cx - 33} Z" fill="${C.yellow}" ${st(1.5)}/>`;
      out += txt(cx + 4, y + 68, lei(it.price), { size: 11 });
    });
    return out;
  },
  demos: [{ products: 'minge:120,carte:60,robot:250' }, { products: 'minge:120,carte:60,robot:250,puzzle:150,cuburi:340,cana:40' }],
});

// lines: 'Ghete|230,Rucsac|128' sau ['Ghete|230', …]; total: opțional (poate fi intenționat greșit, pentru „găsește greșeala”)
const linesOf = (p) => (Array.isArray(p.lines) ? p.lines : list(p.lines)).map((s) => String(s).split('|').map((x) => x.trim()));
registerVisual('receipt', {
  group: GROUP,
  defaults: { title: 'BON' },
  viewBox: (p) => `0 0 200 ${72 + 22 * linesOf(p).length}`,
  // total: lipsă → suma rândurilor; un număr → tipărit ca atare (poate fi greșit intenționat); '?' → de aflat
  label: (p) => `bon: ${linesOf(p).map(([name, n]) => `${name} ${lei(n)}`).join(', ')}; total ${p.total === '?' ? 'de aflat' : lei(has(p.total) ? p.total : linesOf(p).reduce((s, [, n]) => s + num(n, 0), 0))}`,
  render: (p) => {
    const lines = linesOf(p);
    const total = p.total === '?' ? '?' : has(p.total) ? num(p.total, 0) : lines.reduce((s, [, n]) => s + num(n, 0), 0);
    const h = 72 + 22 * lines.length;
    const zig = Array.from({ length: 10 }, (_, i) => `L${18 + i * 18} ${h - 2} L${27 + i * 18} ${h - 8}`).join(' ');
    let out = `<path d="M9 4 H191 V${h - 8} ${zig} L9 ${h - 8} Z" fill="${C.white}" ${st(2)}/>`;
    out += txt(100, 20, p.title, { size: 13, weight: 800 });
    lines.forEach(([name, n], i) => {
      const y = 44 + i * 22;
      out += txt(20, y, name, { size: 12, anchor: 'start', weight: 500 });
      out += `<line x1="${24 + name.length * 7}" y1="${y + 4}" x2="140" y2="${y + 4}" stroke="${C.gray}" stroke-width="1" stroke-dasharray="2 3"/>`;
      out += txt(180, y, n, { size: 12, anchor: 'end' });
    });
    const ty = 44 + lines.length * 22;
    out += `<line x1="20" y1="${ty - 12}" x2="180" y2="${ty - 12}" stroke="${C.ink}" stroke-width="1.5"/>`;
    out += txt(20, ty + 2, 'TOTAL', { size: 12, anchor: 'start', weight: 800 });
    out += txt(180, ty + 2, total === '?' ? '?' : `${total} lei`, { size: 13, anchor: 'end', weight: 800 });
    return out;
  },
  demos: [{ lines: 'Ghete|230,Rucsac|128,Penar|41' }, { lines: 'Ghete|230,Rucsac|128,Penar|41', total: 499 }],
});

// lines: 'rucsac 128 lei,ghete 230 lei' sau listă; checked: câte rânduri sunt bifate (de la început)
registerVisual('note-list', {
  group: GROUP,
  defaults: { title: 'Lista', checked: 0 },
  viewBox: (p) => `0 0 200 ${46 + 24 * list(p.lines).length}`,
  label: (p) => `listă „${p.title}”: ${list(p.lines).join(', ')}`,
  render: (p) => {
    const lines = list(p.lines);
    const checked = num(p.checked, 0);
    const h = 46 + 24 * lines.length;
    let out = `<rect x="8" y="6" width="184" height="${h - 10}" rx="8" fill="${C.cream}" ${st(2)}/>`;
    out += `<rect x="8" y="6" width="184" height="26" rx="8" fill="${C.yellow}" ${st(2)}/>`;
    out += txt(100, 19, p.title, { size: 13, weight: 800 });
    lines.forEach((line, i) => {
      const y = 46 + i * 24;
      out += `<rect x="20" y="${y - 7}" width="14" height="14" rx="3" fill="${C.white}" ${st(1.5)}/>`;
      if (i < checked) out += `<path d="M23 ${y} L27 ${y + 4} L32 ${y - 5}" fill="none" stroke="${C.greenDark}" stroke-width="2.5" stroke-linecap="round"/>`;
      out += txt(42, y, line, { size: 12, anchor: 'start', weight: 500 });
    });
    return out;
  },
  demos: [{ title: 'De cumpărat', lines: 'rucsac 128 lei,ghete 230 lei,penar 41 lei', checked: 1 }],
});
