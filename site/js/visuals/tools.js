// Unelte de matematică: numărătoare, cofraje, axa numerelor, termometru, riglă, ceas, balanță, model cu bare.

import { cantitate } from '../core/ro.js';
import { registerVisual } from './index.js';
import { C, has, list, num, st, txt } from './palette.js';

const GROUP = 'Unelte de matematică';
const PLACE = { S: { color: C.s, one: 'sută', name: 'sute' }, Z: { color: C.z, one: 'zece', name: 'zeci' }, U: { color: C.u, one: 'unitate', name: 'unități' } };

// ——— Numărătoarea pozițională ———
const placesOf = (p) => String(p.places ?? 'ZU').toUpperCase().split('').filter((x) => PLACE[x]);

registerVisual('abacus', {
  group: GROUP,
  defaults: { places: 'ZU' },
  viewBox: (p) => `0 0 ${20 + 45 * placesOf(p).length} 142`,
  label: (p) => `numărătoare cu ${placesOf(p).map((k) => cantitate(num(p[k], 0), PLACE[k].one, PLACE[k].name)).join(', ')}`,
  render: (p) => {
    const places = placesOf(p);
    const width = 20 + 45 * places.length;
    let out = `<rect x="6" y="116" width="${width - 12}" height="8" rx="4" fill="${C.brown}" ${st(2)}/>`;
    places.forEach((k, i) => {
      const x = 32.5 + 45 * i;
      const count = Math.max(0, Math.min(9, num(p[k], 0)));
      out += `<line x1="${x}" y1="12" x2="${x}" y2="116" stroke="${C.gray}" stroke-width="4" stroke-linecap="round"/>`;
      for (let b = 0; b < count; b++) {
        out += `<ellipse cx="${x}" cy="${110 - 11 * b}" rx="16" ry="5.5" fill="${PLACE[k].color}" ${st(1.5)}/>`;
      }
      out += `<rect x="${x - 13}" y="126" width="26" height="15" rx="3" fill="${PLACE[k].color}" ${st(1.5)}/>`;
      out += txt(x, 134, k, { size: 11, fill: C.white });
    });
    return out;
  },
  demos: [{ places: 'ZU', Z: 4, U: 6 }, { places: 'SZU', S: 2, Z: 5, U: 3 }],
});

// ——— Cofraje cu ouă ———
function eggs(x, y, count, cols = 5) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const cx = x + 10 + (i % cols) * 17.5;
    const cy = y + 12 + Math.floor(i / cols) * 20;
    out += `<ellipse cx="${cx}" cy="${cy}" rx="6.5" ry="8" fill="${C.white}" ${st(1.8)}/>`;
  }
  return out;
}

const cartonSlots = (p) => num(p.full, 0) + (num(p.loose, 0) > 0 ? 1 : 0);

registerVisual('egg-carton', {
  group: GROUP,
  viewBox: (p) => {
    const slots = Math.max(1, cartonSlots(p));
    return `0 0 ${Math.min(slots, 3) * 100 + 4} ${Math.ceil(slots / 3) * 56 + 4}`;
  },
  label: (p) => `${cantitate(num(p.full, 0), 'cofraj plin', 'cofraje pline')} cu câte 10 ouă și ${cantitate(num(p.loose, 0), 'ou separat', 'ouă separate')}`,
  render: (p) => {
    const full = num(p.full, 0);
    const loose = Math.min(10, num(p.loose, 0));
    let out = '';
    for (let i = 0; i < cartonSlots(p); i++) {
      const x = 4 + (i % 3) * 100;
      const y = 4 + Math.floor(i / 3) * 56;
      if (i < full) {
        out += `<rect x="${x}" y="${y}" width="92" height="46" rx="8" fill="${C.brownLight}" ${st(2.5)}/>`;
        out += eggs(x + 1, y + 1, 10);
      } else {
        out += `<rect x="${x}" y="${y}" width="92" height="46" rx="8" fill="none" stroke="${C.gray}" stroke-width="2" stroke-dasharray="5 4"/>`;
        out += eggs(x + 1, y + 1, loose);
      }
    }
    return out;
  },
  demos: [{ full: 3, loose: 7 }, { full: 5, loose: 2 }],
});

// ——— Cadrul de zece ———
registerVisual('ten-frame', {
  group: GROUP,
  viewBox: '0 0 110 52',
  label: (p) => `cadru de zece cu ${cantitate(num(p.n, 0), 'jeton', 'jetoane')}`,
  render: (p) => {
    const n = Math.max(0, Math.min(10, num(p.n, 0)));
    let out = `<rect x="3" y="3" width="104" height="46" rx="5" fill="${C.white}" ${st(2.5)}/>`;
    for (let c = 1; c < 5; c++) out += `<line x1="${3 + c * 20.8}" y1="3" x2="${3 + c * 20.8}" y2="49" stroke="${C.ink}" stroke-width="1.5"/>`;
    out += `<line x1="3" y1="26" x2="107" y2="26" stroke="${C.ink}" stroke-width="1.5"/>`;
    for (let i = 0; i < n; i++) out += `<circle cx="${13.4 + (i % 5) * 20.8}" cy="${14.5 + Math.floor(i / 5) * 23}" r="7.5" fill="${C.red}" ${st(1.5)}/>`;
    return out;
  },
  demos: [{ n: 7 }],
});

// ——— Axa numerelor ———
registerVisual('number-line', {
  group: GROUP,
  defaults: { min: 0, max: 100, minor: 10, labels: '0,50,100' },
  viewBox: '0 0 320 72',
  label: (p) => `axa numerelor de la ${num(p.min, 0)} la ${num(p.max, 100)}${has(p.marker) ? `, cu un semn la ${p.marker}` : ''}`,
  render: (p) => {
    const min = num(p.min, 0);
    const max = num(p.max, 100);
    const minor = Math.max(1, num(p.minor, 10));
    const labels = list(p.labels).map(Number);
    const x = (v) => 16 + ((v - min) / (max - min)) * 280;
    let out = `<line x1="10" y1="44" x2="306" y2="44" ${st(3)}/><path d="M304 38 L314 44 L304 50 Z" fill="${C.ink}"/>`;
    for (let v = min; v <= max + 1e-9; v += minor) {
      const major = labels.includes(v);
      out += `<line x1="${x(v)}" y1="${major ? 34 : 38}" x2="${x(v)}" y2="${major ? 54 : 50}" stroke="${C.ink}" stroke-width="${major ? 2.5 : 1.8}" stroke-linecap="round"/>`;
    }
    for (const v of labels) out += txt(x(v), 64, v, { size: 12 });
    if (has(p.marker)) {
      const mx = x(num(p.marker, min));
      out += p.icon === 'racheta'
        ? `<image href="assets/emoji/1f680.svg" x="${mx - 11}" y="4" width="22" height="22"/><path d="M${mx - 5} 28 L${mx + 5} 28 L${mx} 36 Z" fill="${C.red}"/>`
        : `<circle cx="${mx}" cy="18" r="9" fill="${C.red}" ${st(2)}/><path d="M${mx - 5} 26 L${mx + 5} 26 L${mx} 36 Z" fill="${C.red}" ${st(1.5)}/>`;
    }
    return out;
  },
  demos: [{ marker: 48, icon: 'racheta' }, { min: 20, max: 100, minor: 5, labels: '20,40,60,80,100' }],
});

// ——— Termometrul ———
registerVisual('thermometer', {
  group: GROUP,
  defaults: { min: 0, max: 40, minor: 2, major: 10 },
  viewBox: '0 0 90 222',
  label: (p) => `termometru${has(p.value) ? ` care arată ${cantitate(num(p.value, 0), 'grad', 'grade')}` : ''}`,
  render: (p, { uid }) => {
    const min = num(p.min, 0);
    const max = num(p.max, 40);
    const minor = Math.max(1, num(p.minor, 2));
    const major = Math.max(minor, num(p.major, 10));
    const y = (v) => 172 - ((v - min) / (max - min)) * 150;
    let out = `<rect x="28" y="10" width="22" height="176" rx="11" fill="${C.white}" ${st(3)}/>`;
    if (has(p.value)) out += `<rect x="34" y="${y(num(p.value, min))}" width="10" height="${190 - y(num(p.value, min))}" rx="5" fill="${C.red}"/>`;
    out += `<circle cx="39" cy="196" r="17" fill="${C.red}" ${st(3)}/><rect x="34" y="176" width="10" height="16" fill="${C.red}"/>`;
    for (let v = min; v <= max + 1e-9; v += minor) {
      const isMajor = (v - min) % major === 0;
      out += `<line x1="52" y1="${y(v)}" x2="${isMajor ? 64 : 58}" y2="${y(v)}" stroke="${C.ink}" stroke-width="${isMajor ? 2.2 : 1.4}"/>`;
      if (isMajor) out += txt(76, y(v), v, { size: 12 });
    }
    return `<g id="${uid}-scale">${out}</g>`;
  },
  demos: [{ value: 24 }],
});

// ——— Rigla ———
registerVisual('ruler', {
  group: GROUP,
  defaults: { length: 10, from: 0, to: 7, object: 'creion' },
  viewBox: '0 0 320 92',
  label: (p) => `riglă în centimetri; creionul începe la ${num(p.from, 0)} și se termină la ${num(p.to, 7)}`,
  render: (p) => {
    const length = Math.max(1, num(p.length, 10));
    const from = num(p.from, 0);
    const to = num(p.to, 7);
    const x = (c) => 20 + c * (280 / length);
    let out = `<rect x="8" y="50" width="304" height="38" rx="4" fill="${C.yellow}" ${st(2.5)}/>`;
    for (let h = 0; h <= length * 2; h++) {
      const c = h / 2;
      out += `<line x1="${x(c)}" y1="50" x2="${x(c)}" y2="${h % 2 === 0 ? 64 : 58}" stroke="${C.ink}" stroke-width="${h % 2 === 0 ? 2 : 1.3}"/>`;
      if (h % 2 === 0) out += txt(x(c), 76, c, { size: 11 });
    }
    const a = x(from);
    const b = x(to);
    out += `<line x1="${a}" y1="42" x2="${a}" y2="50" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    out += `<line x1="${b}" y1="42" x2="${b}" y2="50" stroke="${C.ink}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    out += `<rect x="${a}" y="22" width="10" height="16" rx="3" fill="${C.pink}" ${st(2)}/>`;
    out += `<rect x="${a + 10}" y="22" width="6" height="16" fill="${C.gray}" ${st(2)}/>`;
    out += `<rect x="${a + 16}" y="22" width="${Math.max(4, b - a - 32)}" height="16" fill="${C.orange}" ${st(2)}/>`;
    out += `<path d="M${b - 16} 22 L${b} 30 L${b - 16} 38 Z" fill="${C.skin}" ${st(2)}/><path d="M${b - 5} 27.5 L${b} 30 L${b - 5} 32.5 Z" fill="${C.ink}"/>`;
    return out;
  },
  demos: [{ from: 0, to: 7 }, { from: 2, to: 9 }],
});

// ——— Ceasul ———
const clockLabel = (h, m) => {
  const hh = h % 12 === 0 ? 12 : h % 12;
  if (m === 30) return `ora ${hh} și jumătate`;
  if (m === 0) return `ora ${hh}`;
  return `ora ${hh} și ${cantitate(m, 'minut', 'minute')}`;
};

registerVisual('clock', {
  group: GROUP,
  defaults: { numbers: true },
  label: (p) => (has(p.h) ? `ceas care arată ${clockLabel(num(p.h, 0), num(p.m, 0))}` : 'ceas'),
  render: (p) => {
    let out = `<circle cx="50" cy="50" r="46" fill="${C.white}" ${st(3.5)}/>`;
    for (let i = 0; i < 60; i += 5) {
      out += `<line x1="50" y1="7" x2="50" y2="${i % 15 === 0 ? 14 : 11}" stroke="${C.ink}" stroke-width="${i % 15 === 0 ? 2.5 : 1.5}" transform="rotate(${i * 6} 50 50)"/>`;
    }
    if (p.numbers !== false && p.numbers !== 'false') {
      for (let n = 1; n <= 12; n++) {
        const a = (n * 30 * Math.PI) / 180;
        out += txt((50 + 33 * Math.sin(a)).toFixed(1), (50 - 33 * Math.cos(a)).toFixed(1), n, { size: 10 });
      }
    }
    if (has(p.h)) {
      const h = num(p.h, 0);
      const m = num(p.m, 0);
      out += `<line x1="50" y1="50" x2="50" y2="31" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" transform="rotate(${(h % 12) * 30 + m * 0.5} 50 50)"/>`;
      out += `<line x1="50" y1="50" x2="50" y2="22" stroke="${C.blueDark}" stroke-width="3" stroke-linecap="round" transform="rotate(${m * 6} 50 50)"/>`;
    }
    return `${out}<circle cx="50" cy="50" r="3.5" fill="${C.ink}"/>`;
  },
  demos: [{ h: 9, m: 30 }, { h: 7, m: 0 }, {}],
});

// ——— Balanța ———
registerVisual('balance', {
  group: GROUP,
  viewBox: '0 0 160 110',
  label: (p) => `balanță: în stânga ${p.left ?? ''}, în dreapta ${p.right ?? ''}`,
  render: (p) => {
    const left = String(p.left ?? '');
    const right = String(p.right ?? '');
    const both = left !== '' && right !== '' && !Number.isNaN(Number(left)) && !Number.isNaN(Number(right));
    const tilt = both ? Math.sign(Number(right) - Number(left)) * 8 : 0;
    const pan = (x, text) => `
      <line x1="${x}" y1="30" x2="${x - 18}" y2="62" stroke="${C.ink}" stroke-width="1.5"/><line x1="${x}" y1="30" x2="${x + 18}" y2="62" stroke="${C.ink}" stroke-width="1.5"/>
      <path d="M${x - 26} 62 H${x + 26} C${x + 22} 74 ${x - 22} 74 ${x - 26} 62 Z" fill="${C.yellow}" ${st(2)}/>
      <rect x="${x - 24}" y="40" width="48" height="20" rx="5" fill="${C.white}" ${st(2)}/>
      ${txt(x, 50, text, { size: text.length > 6 ? 9 : 12 })}`;
    return `
      <path d="M80 30 L96 100 H64 Z" fill="${C.gray}" ${st(2.5)}/><rect x="52" y="98" width="56" height="8" rx="4" fill="${C.brown}" ${st(2)}/>
      <g transform="rotate(${tilt} 80 30)">
        <line x1="24" y1="30" x2="136" y2="30" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
        ${pan(28, left)}${pan(132, right)}
      </g>
      <circle cx="80" cy="30" r="5" fill="${C.ink}"/>`;
  },
  demos: [{ left: '64', right: '39 + ?' }, { left: 20, right: 35 }],
});

// ——— Modelul cu bare ———
registerVisual('bar-model', {
  group: GROUP,
  defaults: { parts: '18,12', total: '?' },
  viewBox: '0 0 300 90',
  label: (p) => `model cu bare: părțile ${list(p.parts).join(' și ')}${has(p.total) ? `, totalul ${p.total}` : ''}`,
  render: (p) => {
    const parts = list(p.parts);
    const numeric = parts.every((v) => !Number.isNaN(Number(v)) && Number(v) > 0);
    const weights = parts.map((v) => (numeric ? Number(v) : 1));
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    let x = 10;
    let out = '';
    parts.forEach((v, i) => {
      const w = (weights[i] / sum) * 280;
      out += `<rect x="${x}" y="44" width="${w}" height="34" fill="${i % 2 ? C.purpleLight : C.blueLight}" ${st(2.5)}/>`;
      out += txt(x + w / 2, 61, v, { size: 14 });
      x += w;
    });
    if (has(p.total)) {
      out += `<path d="M10 38 V30 H290 V38 M150 30 V22" fill="none" ${st(2)}/>`;
      out += `<rect x="130" y="2" width="40" height="18" rx="5" fill="${C.yellow}" ${st(2)}/>${txt(150, 11, p.total, { size: 12 })}`;
    }
    return out;
  },
  demos: [{ parts: '18,12', total: '?' }, { parts: '45,?', total: '60' }],
});

