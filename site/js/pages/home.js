// Pagina principală: salutul mascotei și secțiunile.

import { h } from '../core/dom.js';
import { allTests, catalog } from '../core/loader.js';
import { historyBox } from '../components/history.js';
import { cantitate } from '../core/ro.js';
import { getFulger, getLessons } from '../core/storage.js';
import { art, chip, mascot } from '../components/ui.js';
import { playableTopics, topicTotal } from '../fulger/engine.js';
import invataData from '../../data/invata.js';
import { playableChapters } from '../invata/logic.js';
import { lessonsDone } from '../invata/progress.js';
import { medalsWon } from '../fulger/medals.js';
import { emojiHTML } from '../visuals/emoji.js';

/** Cardul Jocurilor fulger, cu totalul recordurilor pe fiecare temă și numărul medaliilor câștigate. */
function fulgerCard() {
  const { best, medals } = getFulger();
  const won = medalsWon(best, medals).size;
  const medalChip = won ? chip(cantitate(won, 'medalie', 'medalii'), '', 'medalie') : null;
  if (medalChip) medalChip.dataset.testid = 'fulger-medals';
  return h(
    'a',
    { class: 'fg-home anim-fade-up', href: '#/fulger', 'data-testid': 'fulger-card' },
    h('div', { class: 'fg-home__bolt', 'aria-hidden': 'true', html: emojiHTML('fulger') }),
    h(
      'div',
      { class: 'fg-home__body l-stack l-stack--sm' },
      h('h2', { class: 'fg-home__title' }, 'Jocuri fulger'),
      h('p', { class: 'fg-home__text' }, 'Câte întrebări rezolvi în 2 minute? Calcule, șiruri, forme, drumuri, grafice și hărți. Strânge alune, fă serii și bate-ți recordul!'),
    ),
    h(
      'div',
      { class: 'fg-home__levels l-cluster' },
      playableTopics().map((t) => {
        const total = topicTotal(t.id, best);
        return total ? chip(`${t.short}: ${cantitate(total, 'alună', 'alune')}`, '', 'trofeu') : chip(`${t.short}: nou`, 'c-chip--soon');
      }),
      medalChip,
    ),
    h('span', { class: 'c-btn c-btn--accent c-btn--lg fg-home__cta', 'aria-hidden': 'true' }, 'Joacă'),
  );
}

/** Cardul secțiunii Învață, cu lecțiile terminate din fiecare capitol. */
function invataCard() {
  const all = getLessons();
  return h(
    'a',
    { class: 'fg-home iv-home anim-fade-up', href: '#/invata', 'data-testid': 'invata-card' },
    h('div', { class: 'fg-home__bolt', 'aria-hidden': 'true', html: emojiHTML('idee') }),
    h(
      'div',
      { class: 'fg-home__body l-stack l-stack--sm' },
      h('h2', { class: 'fg-home__title' }, 'Învață cu Cifruța'),
      h('p', { class: 'fg-home__text' }, 'Lecții cu desene pe care le miști tu: înmulțirea, cu rânduri și coloane și harta tablei, fracțiile, de la jumătate la zidul fracțiilor, și împărțirea, cu nuci pe farfurii.'),
    ),
    h(
      'div',
      { class: 'fg-home__levels l-cluster' },
      playableChapters(invataData).map((c) => {
        const done = lessonsDone(c, all);
        return done ? chip(`${c.short}: ${done} din ${cantitate(c.lessons.length, 'lecție', 'lecții')}`, done === c.lessons.length ? 'c-chip--ok' : '') : chip(`${c.short}: nou`, 'c-chip--soon');
      }),
    ),
    h('span', { class: 'c-btn c-btn--accent c-btn--lg fg-home__cta', 'aria-hidden': 'true' }, 'Învață'),
  );
}

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
      h('div', { class: 'c-card__icon', 'aria-hidden': 'true', html: emojiHTML(section.icon) }),
      h('h2', { class: 'c-card__title' }, section.title),
      h('p', { class: 'c-card__text' }, section.subtitle),
      h('div', { class: 'c-card__footer l-cluster' }, soon ? chip('în curând', 'c-chip--soon') : chip(cantitate(count, 'test', 'teste'))),
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
      fulgerCard(),
      invataCard(),
      h('div', { class: 'l-grid anim-stagger', style: { '--grid-min': '15rem' } }, sections),
      mascot('incurajeaza', 'Sfat: citește cu atenție fiecare cerință. Poți sări peste un exercițiu și poți reveni la el oricând.'),
      historyBox(allTests(), {
        label: 'Șterge toate rezultatele',
        text: 'Se șterg toate rezultatele și ciornele, din toate secțiunile.',
        testIds: null,
        testid: 'clear-all',
      }),
    ),
  );
}
