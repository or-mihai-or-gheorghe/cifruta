// Emoji folosite în site. Se afișează din SVG-uri locale (Noto Emoji, Apache-2.0),
// ca să arate la fel pe toate dispozitivele. Lista de coduri e folosită și de tools/fetch_assets.py.

import { escapeHTML } from '../core/dom.js';

export const EMOJI = {
  mar: { char: '🍎', code: '1f34e', label: 'măr' },
  para: { char: '🍐', code: '1f350', label: 'pară' },
  cirese: { char: '🍒', code: '1f352', label: 'cireșe' },
  pepene: { char: '🍉', code: '1f349', label: 'pepene' },
  morcov: { char: '🥕', code: '1f955', label: 'morcov' },
  stea: { char: '⭐', code: '2b50', label: 'stea' },
  luna: { char: '🌙', code: '1f319', label: 'lună' },
  soare: { char: '☀️', code: '2600', label: 'soare' },
  nor: { char: '☁️', code: '2601', label: 'nor' },
  racheta: { char: '🚀', code: '1f680', label: 'rachetă' },
  planeta: { char: '🪐', code: '1fa90', label: 'planetă' },
  astronaut: { char: '🧑‍🚀', code: '1f9d1_200d_1f680', label: 'astronaut' },
  valiza: { char: '🧳', code: '1f9f3', label: 'valiză' },
  scoica: { char: '🐚', code: '1f41a', label: 'scoică' },
  inghetata: { char: '🍦', code: '1f366', label: 'înghețată' },
  plaja: { char: '🏖️', code: '1f3d6', label: 'plajă' },
  termometru: { char: '🌡️', code: '1f321', label: 'termometru' },
  cos: { char: '🧺', code: '1f9fa', label: 'coș' },
  ou: { char: '🥚', code: '1f95a', label: 'ou' },
  branza: { char: '🧀', code: '1f9c0', label: 'brânză' },
  rosie: { char: '🍅', code: '1f345', label: 'roșie' },
  ceas: { char: '⏰', code: '23f0', label: 'ceas' },
  bani: { char: '💰', code: '1f4b0', label: 'bani' },
  vaca: { char: '🐄', code: '1f404', label: 'vacă' },
  oaie: { char: '🐑', code: '1f411', label: 'oaie' },
  gaina: { char: '🐔', code: '1f414', label: 'găină' },
  cal: { char: '🐴', code: '1f434', label: 'cal' },
  porc: { char: '🐷', code: '1f437', label: 'porc' },
  iepure: { char: '🐰', code: '1f430', label: 'iepure' },
  pisica: { char: '🐱', code: '1f431', label: 'pisică' },
  caine: { char: '🐶', code: '1f436', label: 'câine' },
  rata: { char: '🦆', code: '1f986', label: 'rață' },
  lup: { char: '🐺', code: '1f43a', label: 'lup' },
  vulpe: { char: '🦊', code: '1f98a', label: 'vulpe' },
  urs: { char: '🐻', code: '1f43b', label: 'urs' },
  arici: { char: '🦔', code: '1f994', label: 'arici' },
  miere: { char: '🍯', code: '1f36f', label: 'miere' },
  lapte: { char: '🥛', code: '1f95b', label: 'lapte' },
  veverita: { char: '🐿️', code: '1f43f', label: 'veveriță' },
  bravo: { char: '👏', code: '1f44f', label: 'bravo' },
  idee: { char: '💡', code: '1f4a1', label: 'idee' },
  calcul: { char: '🧮', code: '1f9ee', label: 'socotitoare' },
  capcana: { char: '⚠️', code: '26a0', label: 'atenție' },
  proba: { char: '🔍', code: '1f50d', label: 'verificare' },
  muschi: { char: '💪', code: '1f4aa', label: 'putere' },
  petrecere: { char: '🎉', code: '1f389', label: 'sărbătoare' },
  deget: { char: '👆', code: '1f446', label: 'deget' },
  trist: { char: '😟', code: '1f61f', label: 'îngrijorat' },
  neutru: { char: '😐', code: '1f610', label: 'așa și așa' },
  vesel: { char: '🙂', code: '1f642', label: 'mulțumit' },
};

export const hasEmoji = (name) => Object.hasOwn(EMOJI, name);

export function emojiHTML(name, { cls = 'c-emoji' } = {}) {
  const e = EMOJI[name];
  if (!e) return escapeHTML(name);
  return `<img class="${cls}" src="assets/emoji/${e.code}.svg" alt="${escapeHTML(e.label)}" draggable="false">`;
}
