// Componente mici de interfață, folosite în mai multe pagini.

import config from '../../data/scoring.js';
import { h, prefersReducedMotion } from '../core/dom.js';
import { md } from '../core/markup.js';
import { cantitate } from '../core/ro.js';
import { emojiHTML } from '../visuals/emoji.js';
import { hasVisual, visualSVG } from '../visuals/index.js';

export const levelInfo = (id) => config.levels.find((l) => l.id === id);

/** Desen din banca vizuală, cu rezervă (emoji) dacă desenul nu există încă. */
export function art(spec, { fallbackEmoji = 'veverita', cls = '' } = {}) {
  const html = hasVisual(spec.v) ? visualSVG(spec) : emojiHTML(fallbackEmoji, { cls: 'c-emoji u-w-full' });
  return h('div', { class: cls, html, 'aria-hidden': spec.decorative ? 'true' : null });
}

export function levelPill(levelId) {
  const lvl = levelInfo(levelId);
  return h(
    'span',
    { class: 'c-level', 'data-level': levelId },
    art({ v: 'level-icon', level: levelId, decorative: true }, { fallbackEmoji: 'deget', cls: 'c-level__icon' }),
    lvl?.label ?? levelId,
  );
}

const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z';

export function stars(on, total = 3, { label } = {}) {
  return h(
    'span',
    { class: 'c-stars', role: 'img', 'aria-label': label ?? `${on} din ${cantitate(total, 'stea', 'stele')}` },
    Array.from({ length: total }, (_, i) =>
      h('span', { class: `c-star${i < on ? ' is-on' : ''}`, html: `<svg viewBox="0 0 24 24"><path d="${STAR_PATH}"/></svg>` }),
    ),
  );
}

export function mascot(mood, message, { center = false } = {}) {
  return h(
    'div',
    { class: `c-mascot${center ? ' c-mascot--center' : ''}` },
    art({ v: 'mascot', mood, decorative: true }, { fallbackEmoji: 'veverita', cls: 'c-mascot__art anim-float' }),
    message ? h('div', { class: 'c-bubble anim-fade-up', style: { animationDelay: '150ms' }, html: md(message) }) : null,
  );
}

export function callout(kind, emojiName, html) {
  return h(
    'div',
    { class: `c-callout c-callout--${kind}` },
    h('span', { class: 'c-callout__icon', html: emojiHTML(emojiName) }),
    h('div', { html }),
  );
}

export const chip = (text, cls = '') => h('span', { class: `c-chip ${cls}` }, text);

export function backLink(href, text) {
  return h('a', { class: 'c-back', href }, '← ', text);
}

/** Ploaie scurtă de confetti (culorile vin din CSS); nimic la mișcare redusă. */
export function confetti({ count = 60, container = document.body } = {}) {
  if (prefersReducedMotion()) return;
  const layer = h('div', { class: 'anim-confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < count; i++) {
    layer.append(
      h('i', {
        style: {
          left: `${Math.random() * 100}%`,
          '--dx': `${(Math.random() - 0.5) * 30}vw`,
          '--rot': `${360 + Math.random() * 540}deg`,
          '--delay': `${Math.random() * 0.4}s`,
          '--fall': `${1.4 + Math.random() * 0.8}s`,
        },
      }),
    );
  }
  container.append(layer);
  setTimeout(() => layer.remove(), 2600);
}
