// Pagina principală: salutul mascotei și secțiunile.

import { h } from '../core/dom.js';
import { catalog } from '../core/loader.js';
import { art, chip, mascot } from '../components/ui.js';

export default function home(container) {
  document.title = 'Cifruța — exerciții pentru clasa a II-a';

  const sections = catalog.sections.filter((s) => !s.hidden).map((section) => {
    const count = section.groups.reduce((n, g) => n + g.tests.length, 0);
    const soon = count === 0;
    return h(
      'a',
      {
        class: `c-card c-card--link${soon ? ' c-card--soon' : ''}`,
        href: `#/sectiune/${section.id}`,
        'data-level': section.color === 'brand' ? null : section.color,
        'data-testid': `section-${section.id}`,
      },
      art({ v: 'level-icon', level: section.color === 'brand' ? 'usor' : section.color, decorative: true }, { fallbackEmoji: section.icon, cls: 'c-card__icon' }),
      h('h2', { class: 'c-card__title' }, section.title),
      h('p', { class: 'c-card__text' }, section.subtitle),
      h('div', { class: 'c-card__footer l-cluster' }, soon ? chip('în curând', 'c-chip--soon') : chip(`${count} ${count === 1 ? 'test' : 'teste'}`)),
    );
  });

  container.append(
    h(
      'div',
      { class: 'l-container l-stack l-stack--lg' },
      h(
        'section',
        { class: 'c-hero anim-fade-up' },
        art({ v: 'mascot', mood: 'vesela', decorative: true }, { cls: 'c-hero__art anim-float' }),
        h(
          'div',
          { class: 'l-stack' },
          h('h1', { class: 'c-hero__title' }, 'Bună! Eu sunt Cifruța.'),
          h('p', { class: 'c-hero__text' }, 'Adun alune și rezolv probleme. Alege un test și hai să gândim împreună! La final vezi rezultatele și explicațiile.'),
        ),
      ),
      h('div', { class: 'l-grid anim-stagger', style: { '--grid-min': '15rem' } }, sections),
      mascot('incurajeaza', 'Sfat: citește cu atenție fiecare cerință. Poți sări peste un exercițiu și poți reveni la el oricând.'),
    ),
  );
}
