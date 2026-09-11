// Mini-markup sigur pentru textele din teste (HTML-ul este escapat întâi):
//   **tare**   ==evidențiat==   \n (rând nou)
//   {{e:mar}}               emoji din visuals/emoji.js
//   {{v:flower n=47}}       vizual din banca vizuală
//   {{s:3}} {{z:4}} {{u:7}} jetoane colorate pentru sute / zeci / unități

import { escapeHTML } from './dom.js';
import { EMOJI, emojiHTML, hasEmoji } from '../visuals/emoji.js';
import { hasVisual, visualLabel, visualSVG } from '../visuals/index.js';

const TOKEN = /\{\{\s*([a-z]+)\s*:\s*([^}]*?)\s*\}\}/g;

function parseParams(body) {
  const [name, ...pairs] = body.split(/\s+/);
  const params = {};
  for (const pair of pairs) {
    const [k, ...rest] = pair.split('=');
    const raw = rest.join('=');
    params[k] = raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw.replace(/_/g, ' ');
  }
  return { name, params };
}

function renderToken(kind, body) {
  if (kind === 'e') return hasEmoji(body) ? emojiHTML(body) : null;
  if (kind === 'v') {
    const { name, params } = parseParams(body);
    return hasVisual(name) ? `<span class="v-inline">${visualSVG({ v: name, ...params })}</span>` : null;
  }
  if (kind === 's' || kind === 'z' || kind === 'u') {
    return `<span class="c-pv c-pv--${kind}">${escapeHTML(body)}</span>`;
  }
  return null;
}

export function md(src) {
  const escaped = escapeHTML(src)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/\n/g, '<br>');
  return escaped.replace(TOKEN, (match, kind, body) => renderToken(kind, body) ?? match);
}

/** Text simplu (pentru aria-label și numărarea cuvintelor). */
export function plain(src) {
  return String(src ?? '')
    .replace(TOKEN, (match, kind, body) => {
      if (kind === 'e') return EMOJI[body]?.char ?? body;
      if (kind === 'v') {
        const { name, params } = parseParams(body);
        return hasVisual(name) ? visualLabel({ v: name, ...params }) : body;
      }
      return body;
    })
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/==(.+?)==/g, '$1');
}

/** Tokenuri necunoscute dintr-un text (folosit de validator). */
export function markupErrors(src) {
  const errors = [];
  for (const [, kind, body] of String(src ?? '').matchAll(TOKEN)) {
    if (renderToken(kind, body) === null) errors.push(`token necunoscut {{${kind}:${body}}}`);
  }
  return errors;
}
