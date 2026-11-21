// Învață: lecțiile interactive (schelet; capitolele vin din data/invata.js).

import { h } from '../core/dom.js';
import { backLink, mascot } from '../components/ui.js';

export default function invata(container) {
  document.title = 'Învață — Cifruța';
  container.append(
    h(
      'div',
      { class: 'l-container l-stack l-stack--lg' },
      backLink('#/', 'Pagina de început'),
      h('h1', {}, 'Învață cu Cifruța'),
      mascot('vesela', 'Lecțiile vin în curând.'),
    ),
  );
}
