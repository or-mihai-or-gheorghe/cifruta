// Pornirea aplicației: antet, router, încărcarea paginilor.

import './visuals/all.js';
import { clear, h } from './core/dom.js';
import { onRouteChange } from './core/router.js';
import { art } from './components/ui.js';

const PAGES = {
  '': () => import('./pages/home.js'),
  sectiune: () => import('./pages/section.js'),
  test: () => import('./pages/player.js'),
  rezultate: () => import('./pages/review.js'),
  atelier: () => import('./pages/atelier.js'),
};

const app = document.getElementById('app');
const main = h('main', { class: 'l-main', id: 'continut', tabindex: '-1' });

app.replaceChildren(
  h(
    'header',
    { class: 'l-header' },
    h(
      'div',
      { class: 'l-container l-header__inner' },
      h(
        'a',
        { class: 'c-logo', href: '#/' },
        art({ v: 'mascot', mood: 'vesela', decorative: true }, { cls: 'c-logo__art' }),
        h('span', {}, 'Cifruța', h('span', { class: 'c-logo__sub' }, 'exerciții pentru clasa a II-a')),
      ),
      h('nav', { class: 'l-cluster', 'aria-label': 'Navigare' }, h('a', { class: 'c-btn c-btn--ghost c-btn--sm', href: '#/' }, 'Teste')),
    ),
  ),
  main,
  h(
    'footer',
    { class: 'l-footer' },
    h(
      'div',
      { class: 'l-container l-cluster l-cluster--between' },
      h('span', {}, 'Cifruța · exerciții originale după programa de Matematică și explorarea mediului'),
      h('a', { href: '#/atelier' }, 'Atelier pentru autori'),
    ),
  ),
);

let cleanup = null;

onRouteChange(async (route) => {
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  const load = PAGES[route.name] ?? (() => import('./pages/not-found.js'));
  try {
    const page = (await load()).default;
    clear(main);
    window.scrollTo(0, 0);
    cleanup = await page(main, route.params);
  } catch (err) {
    console.error(err);
    clear(main).append(
      h(
        'div',
        { class: 'l-container l-container--narrow l-stack u-center' },
        h('h1', {}, 'Ceva nu a mers'),
        h('p', {}, 'Reîncarcă pagina. Dacă problema continuă, întoarce-te la lista de teste.'),
        h('p', {}, h('a', { class: 'c-btn c-btn--primary', href: '#/' }, 'Înapoi la teste')),
      ),
    );
  }
});
