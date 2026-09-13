// Jocuri fulger: efecte mici de joc — particule, „+N” care zboară în coș, insigne, bannere și ștampila de final.
// Nodurile se șterg singure. La mișcare redusă nu apar particulele și zborul; insignele și bannerele apar fără animație.

import { h, prefersReducedMotion } from '../core/dom.js';
import { emojiHTML } from '../visuals/emoji.js';
import { visualSVG } from '../visuals/index.js';

/** Centrul elementului, în coordonatele stratului de efecte. */
function center(el, layer) {
  const a = el.getBoundingClientRect();
  const b = layer.getBoundingClientRect();
  return { x: a.left + a.width / 2 - b.left, y: a.top + a.height / 2 - b.top };
}

function spawn(layer, el, ms) {
  layer.append(el);
  if (ms) setTimeout(() => el.remove(), ms);
  return el;
}

let nutSVG = null;

/** Particule (alune și stele) care țâșnesc din centrul lui `from`. */
export function burst(layer, from, count = 6) {
  if (prefersReducedMotion()) return;
  nutSVG ??= visualSVG({ v: 'alune', n: 1 });
  const { x, y } = center(from, layer);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI + Math.random() * 0.5;
    const dist = 50 + Math.random() * 40;
    const nut = i % 2 === 0;
    const style = {
      '--x': `${Math.round(x)}px`,
      '--y': `${Math.round(y)}px`,
      '--dx': `${Math.round(Math.cos(angle) * dist)}px`,
      '--dy': `${Math.round(Math.sin(angle) * dist)}px`,
      '--rot': `${Math.round(Math.random() * 360 - 180)}deg`,
    };
    spawn(layer, h('i', { class: `fg-particle fg-particle--${nut ? 'nut' : 'star'}`, html: nut ? nutSVG : null, style }), 700);
  }
}

/** „+N” pornește din `from` și zboară până la `to` (coșul cu alune). */
export function flyTo(layer, from, to, text, { gold = false } = {}) {
  if (prefersReducedMotion()) return;
  const a = center(from, layer);
  const b = center(to, layer);
  const style = { '--x': `${Math.round(a.x)}px`, '--y': `${Math.round(a.y)}px`, '--dx': `${Math.round(b.x - a.x)}px`, '--dy': `${Math.round(b.y - a.y)}px` };
  spawn(layer, h('span', { class: `fg-fly${gold ? ' is-gold' : ''}`, style }, text), 650);
}

/** Insignă scurtă în colțul de sus al lui `anchor` („Fulger!”, „Rapid!”). */
export function badge(layer, anchor, text, { icon = null, cls = '' } = {}) {
  layer.querySelector('.fg-badge')?.remove();
  const box = anchor.getBoundingClientRect();
  const base = layer.getBoundingClientRect();
  const style = { '--r': `${Math.round(base.right - box.right + 10)}px`, '--y': `${Math.round(box.top - base.top + 10)}px` };
  spawn(layer, h('span', { class: `fg-badge ${cls}`, style, 'data-testid': 'fg-badge' }, icon ? h('span', { class: 'fg-badge__icon', html: emojiHTML(icon) }) : null, text), 900);
}

/** Text mare chiar deasupra lui `anchor` (cardul întrebării), ca să nu acopere întrebarea următoare. */
export function banner(layer, anchor, text, { turbo = false } = {}) {
  layer.querySelector('.fg-banner')?.remove();
  const style = { '--y': `${Math.round(anchor.getBoundingClientRect().top - layer.getBoundingClientRect().top - 6)}px` };
  spawn(layer, h('div', { class: `fg-banner${turbo ? ' is-turbo' : ''}`, style, 'data-testid': 'fg-banner' }, text), 950);
}

/** Ștampila de la final („TIMP!”); rămâne până la rezultate. */
export function stamp(layer, text) {
  return spawn(layer, h('div', { class: 'fg-stamp', 'data-testid': 'fg-stamp' }, text), 0);
}
