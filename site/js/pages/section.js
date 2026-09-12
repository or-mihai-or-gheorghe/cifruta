// Pagina unei secțiuni: subsecțiunile și testele lor.

import { h } from '../core/dom.js';
import { findSection } from '../core/loader.js';
import { cantitate } from '../core/ro.js';
import { bestScore, getDraft } from '../core/storage.js';
import { gradeFor } from '../core/scoring.js';
import { historyBox } from '../components/history.js';
import { art, backLink, chip } from '../components/ui.js';

function testCard(test) {
  const best = bestScore(test.id);
  const draft = getDraft(test.id);
  const status =
    best >= 0
      ? chip(`cel mai bun scor: ${best} · ${gradeFor(best).label}`, '', 'stea')
      : draft?.version === test.version
        ? chip('început — continuă', 'c-chip--soon')
        : chip('nou');
  return h(
    'a',
    { class: 'c-card c-card--link', href: `#/test/${test.id}`, 'data-theme': test.theme, 'data-testid': `test-card-${test.id}` },
    h('div', { class: 'c-card__media' }, art({ v: 'scene', theme: test.theme, decorative: true }, { fallbackEmoji: 'veverita' })),
    h('h3', { class: 'c-card__title' }, test.title),
    test.subtitle ? h('p', { class: 'c-card__text' }, test.subtitle) : null,
    h('div', { class: 'c-card__footer l-cluster' }, chip(`~${test.estMin} min`, '', 'ceas'), chip(cantitate(test.exercises, 'exercițiu', 'exerciții')), status),
  );
}

export default function section(container, [id]) {
  const sec = findSection(id);
  if (!sec) {
    location.hash = '#/';
    return;
  }
  document.title = `${sec.title} — Cifruța`;
  container.append(
    h(
      'div',
      { class: 'l-container l-stack l-stack--lg' },
      h('div', { class: 'l-stack l-stack--sm' }, backLink('#/', 'Toate secțiunile'), h('h1', {}, sec.title), h('p', { class: 'u-muted u-big' }, sec.subtitle)),
      ...sec.groups.map((group) =>
        h(
          'section',
          { class: 'l-stack' },
          h('div', { class: 'c-section-head' }, h('h2', {}, group.title), group.tests.length ? null : chip('în curând', 'c-chip--soon')),
          group.tests.length
            ? h('div', { class: 'l-grid anim-stagger', style: { '--grid-min': '17rem' } }, group.tests.map(testCard))
            : h('p', { class: 'c-card c-card--soon u-muted' }, 'Pregătim testele pentru această temă. Revino curând!'),
        ),
      ),
      historyBox(sec.groups.flatMap((g) => g.tests), {
        label: 'Șterge toate rezultatele din secțiune',
        text: `Se șterg toate rezultatele din secțiunea „${sec.title}” (și ciornele începute).`,
        testIds: sec.groups.flatMap((g) => g.tests.map((t) => t.id)),
        testid: `clear-section-${sec.id}`,
      }),
    ),
  );
}
