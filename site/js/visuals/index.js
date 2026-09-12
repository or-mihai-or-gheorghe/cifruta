// Banca vizuală: generatoare SVG parametrice, pure (întorc text SVG), înregistrate după nume.
// Folosire: visualSVG({ v: 'flower', n: 47 }) · în markup: {{v:flower n=47}}

import { escapeHTML } from '../core/dom.js';

const registry = new Map();
let counter = 0;

/**
 * registerVisual('flower', {
 *   group: 'Suporturi pentru numere',
 *   defaults: { color: 'roz' },
 *   label: (p) => `floare cu numărul ${p.n}`,
 *   render: (p, { uid }) => '<g>…</g>',   // conținutul, desenat într-un viewBox
 *   viewBox: '0 0 100 100',               // sau funcție (p) => '…'
 *   demos: [{ n: 47 }],
 * })
 */
export function registerVisual(name, def) {
  registry.set(name, def);
}

export const hasVisual = (name) => registry.has(name);

/** Erorile de parametri ale unui desen cu date (def.check), pentru validarea conținutului. */
export function visualErrors(spec) {
  const { v, class: cls, ...params } = spec ?? {};
  const def = registry.get(v);
  if (!def?.check) return [];
  try {
    return def.check({ ...(def.defaults ?? {}), ...params }) ?? [];
  } catch (e) {
    return [`parametri greșiți (${e.message})`];
  }
}

export function visualSVG(spec) {
  const { v, class: cls, ...params } = spec ?? {};
  const def = registry.get(v);
  if (!def) throw new Error(`Vizual necunoscut: ${v}`);
  const p = { ...(def.defaults ?? {}), ...params };
  const uid = `${v}${++counter}`;
  const label = def.label ? def.label(p) : v;
  const viewBox = typeof def.viewBox === 'function' ? def.viewBox(p) : (def.viewBox ?? '0 0 100 100');
  const body = def.render(p, { uid });
  return `<svg class="v-svg v-${escapeHTML(v)}${cls ? ` ${escapeHTML(cls)}` : ''}" viewBox="${viewBox}" role="img" aria-label="${escapeHTML(label)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

export function visualLabel(spec) {
  const { v, ...params } = spec ?? {};
  const def = registry.get(v);
  if (!def) return v;
  const p = { ...(def.defaults ?? {}), ...params };
  return def.label ? def.label(p) : v;
}

export const listVisuals = () =>
  [...registry.entries()].map(([name, def]) => ({ name, group: def.group ?? 'Altele', demos: def.demos ?? [{}] }));

/** Text centrat în SVG (pentru numere pe flori, stele etc.). */
export const svgText = (x, y, text, { size = 30, cls = 'v-num', weight = 700 } = {}) =>
  `<text x="${x}" y="${y}" class="${cls}" font-size="${size}" font-weight="${weight}" text-anchor="middle" dominant-baseline="central">${escapeHTML(text)}</text>`;
