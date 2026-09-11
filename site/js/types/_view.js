// Ajutoare comune pentru partea vizuală (DOM) a tipurilor de exerciții.

import { h } from '../core/dom.js';
import { md } from '../core/markup.js';
import { emojiHTML } from '../visuals/emoji.js';
import { hasVisual, visualSVG } from '../visuals/index.js';

/** Fața unui element: desen/emoji + text. item = { text?, emoji?, visual? } */
export function itemFace(item, { cls = 'ex-face' } = {}) {
  const parts = [];
  if (item.visual && hasVisual(item.visual.v)) parts.push(h('span', { class: `${cls}__art`, html: visualSVG(item.visual) }));
  else if (item.emoji) parts.push(h('span', { class: `${cls}__art`, html: emojiHTML(item.emoji, { cls: 'c-emoji' }) }));
  if (item.text !== undefined && item.text !== '') parts.push(h('span', { class: `${cls}__text`, html: md(String(item.text)) }));
  return h('span', { class: cls }, parts);
}

/** Marchează un element ca bun / greșit / răspuns corect neales, cu icon (nu doar culoare). */
export function setState(el, state) {
  el.classList.remove('is-correct', 'is-wrong', 'is-missed');
  el.querySelector(':scope > .ex-state')?.remove();
  if (!state) return;
  el.classList.add(`is-${state}`);
  const icon = { correct: '✓', wrong: '✗', missed: '✓' }[state];
  const label = { correct: 'corect', wrong: 'greșit', missed: 'răspunsul corect' }[state];
  el.append(h('span', { class: 'ex-state', 'aria-label': label, title: label }, icon));
}

export function feedbackBox(text) {
  return text ? h('p', { class: 'ex-feedback', html: `${emojiHTML('idee')} ${md(text)}` }) : null;
}

/** Afișează valoarea corectă lângă o casetă / un element greșit. */
export const expectedTag = (text) => h('span', { class: 'ex-expected', 'aria-label': `corect: ${text}` }, text);

export const isLocked = (m) => m !== 'solve';
