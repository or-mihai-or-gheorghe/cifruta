// Pornirea aplicației: antet, router, încărcarea paginilor.

import './visuals/all.js';
import { clear, h } from './core/dom.js';
import { onRouteChange } from './core/router.js';
import { setSoundEnabled, soundEnabled } from './core/sound.js';
import { emojiHTML } from './visuals/emoji.js';
import { art } from './components/ui.js';

const PAGES = {
  '': () => import('./pages/home.js'),
  sectiune: () => import('./pages/section.js'),
  test: () => import('./pages/player.js'),
  rezultate: () => import('./pages/review.js'),
  atelier: () => import('./pages/atelier.js'),
};

// butonul de sunet („Sunete” apăsat = pornite)
const soundBtn = h('button', { type: 'button', class: 'c-btn c-btn--ghost c-btn--icon c-sound', 'data-testid': 'sound-toggle', onClick: () => { setSoundEnabled(!soundEnabled()); paintSound(); } });
function paintSound() {
  const on = soundEnabled();
  soundBtn.innerHTML = emojiHTML(on ? 'sunet' : 'mut');
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.setAttribute('aria-label', on ? 'Sunete pornite. Apasă ca să le oprești.' : 'Sunete oprite. Apasă ca să le pornești.');
  soundBtn.title = on ? 'Sunete pornite' : 'Sunete oprite';
}
paintSound();

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
      h('nav', { class: 'l-cluster', 'aria-label': 'Navigare' }, h('a', { class: 'c-btn c-btn--ghost c-btn--sm', href: '#/' }, 'Teste'), soundBtn),
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
let navigation = 0; // doar ultima navigare are voie să afișeze pagina

onRouteChange(async (route) => {
  const id = ++navigation;
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  const load = PAGES[route.name] ?? (() => import('./pages/not-found.js'));
  try {
    const page = (await load()).default;
    if (id !== navigation) return;
    // fiecare pagină primește un container nou: o pagină depășită scrie într-un nod detașat
    const host = h('div', { class: 'l-page' });
    main.replaceChildren(host);
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
    const done = await page(host, route.params);
    if (id === navigation) cleanup = done;
    else if (typeof done === 'function') done();
  } catch (err) {
    console.error(err);
    if (id !== navigation) return;
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
