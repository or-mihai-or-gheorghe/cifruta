// Oraș și transport: harta liniilor (tramvai, metrou, autobuz) și indicatoare de kilometri.

import { registerVisual } from './index.js';
import { C, has, list, num, st, txt } from './palette.js';

const GROUP = 'Oraș și transport';
const LINE_COLORS = { rosie: C.red, albastra: C.blue, verde: C.greenDark, galbena: C.yellowDark, mov: C.purple, portocalie: C.orange, gri: C.gray };
const colorOf = (c) => LINE_COLORS[c] ?? C.gray;

export const DEMO_MAP = {
  w: 320,
  h: 200,
  stops: [
    { id: 'gara', label: 'Gara', x: 40, y: 70 },
    { id: 'piata', label: 'Piața Mare', x: 130, y: 70 },
    { id: 'parc', label: 'Parcul', x: 230, y: 70 },
    { id: 'muzeu', label: 'Muzeul', x: 130, y: 20, side: 'top' },
    { id: 'teatru', label: 'Teatrul', x: 130, y: 140 },
  ],
  lines: [
    { id: 'rosie', label: 'tramvaiul 3', color: 'rosie', stops: ['gara', 'piata', 'parc'] },
    { id: 'albastra', label: 'metroul M1', color: 'albastra', stops: ['muzeu', 'piata', 'teatru'] },
  ],
};

const stopsOf = (p) => (Array.isArray(p.stops) && p.stops.length ? p.stops : DEMO_MAP.stops);
const linesOf = (p) => (Array.isArray(p.lines) && p.lines.length ? p.lines : DEMO_MAP.lines);

/** Harta unei rețele de linii: stațiile (id, label, x, y), liniile (culoare + stații), un traseu evidențiat (path). */
registerVisual('route-map', {
  group: GROUP,
  check: (p) => {
    const ids = new Set(stopsOf(p).map((s) => s.id));
    return [...list(p.path), ...linesOf(p).flatMap((l) => l.stops ?? []), ...(Array.isArray(p.segments) ? p.segments.flatMap((s) => [s.a, s.b]) : [])].filter((id) => !ids.has(id)).map((id) => `stație necunoscută „${id}”`);
  },
  defaults: { w: 320, h: 200 },
  viewBox: (p) => `0 0 ${num(p.w, 320)} ${num(p.h, 200)}`,
  label: (p) => {
    const byId = Object.fromEntries(stopsOf(p).map((s) => [s.id, s]));
    const name = (id) => byId[id]?.label ?? id;
    const lines = linesOf(p).map((l) => `linia ${l.color ?? l.id} (${l.label ?? l.id}): ${l.stops.map(name).join(', ')}`).join('; ');
    const path = list(p.path);
    const segs = (Array.isArray(p.segments) ? p.segments : []).map((s) => `${name(s.a)}–${name(s.b)} ${s.n}${p.unit ? ` ${p.unit}` : ''}`).join(', ');
    return `hartă cu ${lines}${segs ? `; lungimi: ${segs}` : ''}${path.length ? `; traseu: ${path.map(name).join(' → ')}` : ''}`;
  },
  render: (p) => {
    const stops = stopsOf(p);
    const lines = linesOf(p);
    const byId = Object.fromEntries(stops.map((s) => [s.id, s]));
    const path = list(p.path).filter((id) => byId[id]);
    const onLines = {};
    for (const l of lines) for (const id of l.stops) (onLines[id] ??= []).push(l);
    let out = `<rect width="${num(p.w, 320)}" height="${num(p.h, 200)}" rx="10" fill="${C.cream}" opacity=".7"/>`;
    for (const l of lines) {
      const pts = l.stops.map((id) => byId[id]).filter(Boolean);
      if (pts.length < 2) continue;
      out += `<polyline points="${pts.map((s) => `${s.x},${s.y}`).join(' ')}" fill="none" stroke="${colorOf(l.color)}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    if (path.length >= 2) {
      const pts = path.map((id) => byId[id]);
      out += `<polyline class="v-route-map__path" points="${pts.map((s) => `${s.x},${s.y}`).join(' ')}" fill="none" stroke="${C.ink}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" opacity=".18"/>`;
      out += `<polyline points="${pts.map((s) => `${s.x},${s.y}`).join(' ')}" fill="none" stroke="${C.white}" stroke-width="3" stroke-dasharray="7 6" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    // lungimea fiecărui segment (pași, minute, km), pe o etichetă albă la mijlocul lui
    for (const sg of Array.isArray(p.segments) ? p.segments : []) {
      const a = byId[sg.a];
      const b = byId[sg.b];
      if (!a || !b) continue;
      const t = Math.min(0.9, Math.max(0.1, Number(sg.at ?? 0.5))); // `at` mută eticheta pe segment, departe de numele stațiilor
      const [mx, my] = [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t];
      const w = 10 + String(sg.n).length * 7;
      out += `<rect x="${mx - w / 2}" y="${my - 9}" width="${w}" height="18" rx="9" fill="${C.white}" ${st(1.5)}/>` + txt(mx, my + 0.5, sg.n, { size: 11 });
    }
    for (const s of stops) {
      const transfer = (onLines[s.id]?.length ?? 0) > 1;
      const fill = s.id === p.from ? C.green : s.id === p.to ? C.red : C.white;
      out += `<circle cx="${s.x}" cy="${s.y}" r="${transfer ? 10 : 8}" fill="${fill}" ${st(2.5)}/>`;
      if (transfer) out += `<circle cx="${s.x}" cy="${s.y}" r="4.5" fill="${C.white}" ${st(1.5)}/>`;
      const side = s.side ?? 'bottom';
      const [lx, ly, anchor] = side === 'top' ? [s.x, s.y - 22, 'middle'] : side === 'left' ? [s.x - 16, s.y, 'end'] : side === 'right' ? [s.x + 16, s.y, 'start'] : [s.x, s.y + 24, 'middle'];
      out += txt(lx, ly, s.label ?? s.id, { size: 11, anchor });
      const k = path.indexOf(s.id);
      if (k >= 0) {
        out += `<circle cx="${s.x + 12}" cy="${s.y - 12}" r="7.5" fill="${C.ink}"/>`;
        out += txt(s.x + 12, s.y - 12, k + 1, { size: 9, fill: C.white });
      }
    }
    return out;
  },
  demos: [{}, { path: 'gara,piata,teatru', from: 'gara', to: 'teatru' }],
});

/** Indicator rutier: „Brăduț 145 km”. */
registerVisual('signpost', {
  group: GROUP,
  defaults: { unit: 'km' },
  viewBox: '0 0 120 92',
  check: (p) => (has(p.n) && !Number.isFinite(Number(p.n)) ? ['n trebuie să fie un număr'] : []),
  label: (p) => `indicator: ${p.label ?? ''} ${has(p.n) ? `${p.n} ${p.unit}` : ''}`.trim(),
  // numărul e informația de care are nevoie copilul: scris mare, sub numele locului
  render: (p) => `
    <rect x="56" y="54" width="8" height="36" fill="${C.brown}" ${st(1.5)}/>
    <path d="M4 6 H102 L116 30 L102 54 H4 Z" fill="${C.green}" ${st(2)}/>
    ${txt(53, 18, p.label ?? '', { size: 12 })}
    ${has(p.n) ? txt(53, 39, `${p.n} ${p.unit}`, { size: 20, weight: 800 }) : ''}`,
  demos: [{ label: 'Brăduț', n: 145 }, { label: 'Lacu Verde', n: 95 }],
});
