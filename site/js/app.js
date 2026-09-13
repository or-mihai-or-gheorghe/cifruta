// Pornirea aplicației: antet, router, încărcarea paginilor. Contul familiei (dacă există o sesiune) se confirmă în fundal.

import './visuals/all.js';
import { clear, h } from './core/dom.js';
import { currentRoute, onRouteChange } from './core/router.js';
import { setSoundEnabled, soundEnabled } from './core/sound.js';
import { emojiHTML } from './visuals/emoji.js';
import { art } from './components/ui.js';
import { accountState, activeProfile, bootAccount, onAccountChange } from './cloud/account.js';
import { cloudConfigured } from './cloud/config.js';

const PAGES = {
  '': () => import('./pages/home.js'),
  sectiune: () => import('./pages/section.js'),
  test: () => import('./pages/player.js'),
  rezultate: () => import('./pages/review.js'),
  atelier: () => import('./pages/atelier.js'),
  fulger: () => import('./pages/fulger.js'),
  profil: () => import('./pages/profil.js'),
  clasament: () => import('./pages/clasament.js'),
  admin: () => import('./pages/admin.js'),
  confidentialitate: () => import('./pages/confidentialitate.js'),
};

// sesiunea contului se citește înainte de prima pagină, ca paginile să arate din prima rezultatele profilului care joacă
bootAccount();

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

// clasamentul (doar în cont) și contul: „Intră” sau avatarul și porecla profilului care joacă (pe telefon, doar iconițele)
const boardsLink = h(
  'a',
  { class: 'c-btn c-btn--ghost c-btn--sm c-nav-board', href: '#/clasament', 'data-testid': 'nav-board', title: 'Clasament' },
  h('span', { 'aria-hidden': 'true', html: emojiHTML('trofeu') }),
  h('span', { class: 'c-nav-board__text' }, 'Clasament'),
);
const accountLink = h('a', { class: 'c-btn c-btn--ghost c-btn--sm c-account', href: '#/profil', 'data-testid': 'nav-account' });
function paintAccount() {
  const s = accountState();
  const profile = activeProfile();
  boardsLink.hidden = !cloudConfigured() || !s.user;
  accountLink.hidden = !cloudConfigured();
  const [icon, text, title] = !s.user
    ? ['familie', 'Intră', 'Intră în contul familiei']
    : profile
      ? [profile.avatar, profile.nickname, `Joacă: ${profile.nickname}. Contul familiei`]
      : ['familie', 'Contul', 'Contul familiei'];
  accountLink.replaceChildren(h('span', { class: 'c-account__icon', 'aria-hidden': 'true', html: emojiHTML(icon) }), h('span', { class: 'c-account__text' }, text));
  accountLink.title = title;
  accountLink.classList.toggle('is-signed', Boolean(s.user));
}
paintAccount();

/** Un mesaj scurt jos pe ecran (de exemplu, „Ai ieșit din cont”); pagina contului îl arată în pagină. */
function toast(text) {
  const el = h('div', { class: 'c-toast', role: 'status', 'data-testid': 'toast' }, text);
  document.body.append(el);
  setTimeout(() => el.remove(), 6000);
}
let lastNotice = null;
onAccountChange((s) => {
  paintAccount();
  if (s.notice && s.notice !== lastNotice && currentRoute().name !== 'profil') toast(s.notice);
  lastNotice = s.notice;
});

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
      h(
        'nav',
        { class: 'l-cluster', 'aria-label': 'Navigare' },
        h('a', { class: 'c-btn c-btn--ghost c-btn--sm c-nav-home', href: '#/' }, 'Teste'),
        h(
          'a',
          { class: 'c-btn c-btn--ghost c-btn--sm c-nav-fulger', href: '#/fulger', 'data-testid': 'nav-fulger', title: 'Jocuri fulger' },
          h('span', { 'aria-hidden': 'true', html: emojiHTML('fulger') }),
          h('span', { class: 'c-nav-fulger__text' }, 'Jocuri fulger'),
        ),
        boardsLink,
        accountLink,
        soundBtn,
      ),
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
      h('span', { class: 'l-cluster' }, h('a', { href: '#/confidentialitate', 'data-testid': 'footer-privacy' }, 'Confidențialitate'), h('a', { href: '#/atelier' }, 'Atelier pentru autori')),
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
