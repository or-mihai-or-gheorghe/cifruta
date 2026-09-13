// Legătura spre clasament din hub și din rezultate: „Vezi clasamentul” în cont, „Intră ca să apari în clasament” fără cont.
// Fără configurarea Firebase nu apare deloc.

import { accountState } from '../cloud/account.js';
import { cloudConfigured } from '../cloud/config.js';
import { h } from '../core/dom.js';
import { emojiHTML } from '../visuals/emoji.js';

/**
 * `route`: restul adresei clasamentului, de exemplu „fulger/usor/week” sau „teste”.
 * `row: 'start' | 'center'` pune legătura pe un rând al ei (în coloanele l-stack butonul nu se mai întinde).
 */
export function boardLink(route, { cls = 'c-btn', row = null } = {}) {
  if (!cloudConfigured()) return null;
  const signed = Boolean(accountState().user);
  const link = h(
    'a',
    { class: `${cls} c-board-link`, href: signed ? `#/clasament/${route}` : '#/profil', 'data-testid': 'board-link' },
    h('span', { class: 'c-board-link__icon', 'aria-hidden': 'true', html: emojiHTML('trofeu') }),
    signed ? 'Vezi clasamentul' : 'Intră ca să apari în clasament',
  );
  return row ? h('div', { class: `l-cluster${row === 'center' ? ' l-cluster--center' : ''}` }, link) : link;
}
