// Jocuri fulger: meniul temelor de pe pagina jocului (#/fulger). Pe ecranele late stă pe margine, în stânga coloanei (în afara ei,
// deci coloana nu se mișcă), lipit sub antet cât derulezi; pe cele înguste e butonul „Teme” din colțul de jos, care deschide lista.
// O alegere derulează pagina la temă fără s-o mai construiască (adresa se schimbă cu replaceState, deci „Înapoi” după o rundă și
// reîncărcarea duc tot acolo), iar tema la care ai ajuns e marcată (`aria-current`). Lista deschisă are clasa `is-open`, nu `hidden`:
// `[hidden]` are `!important` în stratul de bază și ar ascunde și meniul de pe margine.

import { h, prefersReducedMotion } from '../core/dom.js';
import { emojiHTML } from '../visuals/emoji.js';

/** Cât din ecran, sub antet, trebuie să fi trecut începutul unei secțiuni ca ea să fie „cea de acum”. */
const READ_LINE = 0.25;

/**
 * Meniul. `targets`: [{ id, label, icon, el, hash }] în ordinea din pagină: `el` e secțiunea (cu titlul ei `h2`), `hash` adresa pusă
 * după alegere. Întoarce { el, start, destroy }: `start()` pornește urmărirea derulării după ce pagina e în document.
 */
export function topicNav(targets) {
  let open = false;
  let frame = 0;
  const toggle = h(
    'button',
    { type: 'button', class: 'fg-nav__toggle', 'aria-expanded': 'false', 'aria-controls': 'fg-nav-list', 'data-testid': 'fg-nav-toggle', onClick: () => setOpen(!open) },
    h('span', { class: 'fg-nav__bars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
    'Teme',
  );
  const items = targets.map((t) => {
    const content = [h('span', { class: 'fg-nav__icon', 'aria-hidden': 'true', html: emojiHTML(t.icon) }), h('span', { class: 'fg-nav__label' }, t.label)];
    // o temă are adresa ei (se poate deschide și într-o filă nouă); raftul medaliilor n-are, deci e un buton
    const el = t.hash === '#/fulger'
      ? h('button', { type: 'button', class: 'fg-nav__link', 'data-testid': `fg-nav-${t.id}` }, content)
      : h('a', { class: 'fg-nav__link', href: t.hash, 'data-testid': `fg-nav-${t.id}` }, content);
    el.addEventListener('click', (e) => pick(e, t));
    return { ...t, link: el };
  });
  const panel = h('div', { class: 'fg-nav__panel', id: 'fg-nav-list' }, h('p', { class: 'fg-nav__title', 'aria-hidden': 'true' }, 'Teme'), items.map((t) => t.link));
  const nav = h('nav', { class: 'fg-nav', 'aria-label': 'Temele jocurilor', 'data-testid': 'fg-nav' }, toggle, panel);

  function setOpen(value) {
    open = value;
    nav.classList.toggle('is-open', value);
    toggle.setAttribute('aria-expanded', String(value));
  }

  function pick(e, t) {
    // Ctrl/Cmd/Shift + clic pe o temă: o deschide browserul (în filă nouă), ca pe orice legătură
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setOpen(false);
    t.el.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
    history.replaceState(null, '', t.hash);
    const heading = t.el.querySelector('h2');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    mark(t);
  }

  /** Tema de acum: ultima al cărei început a trecut de antet plus un sfert din ecran (niciuna, sus, lângă titlul paginii). */
  function update() {
    frame = 0;
    const line = (document.querySelector('.l-header')?.offsetHeight ?? 0) + innerHeight * READ_LINE;
    let current = null;
    for (const t of items) if (t.el.getBoundingClientRect().top <= line) current = t;
    mark(current);
  }

  function mark(current) {
    for (const t of items) {
      if (t === current || t.id === current?.id) t.link.setAttribute('aria-current', 'location');
      else t.link.removeAttribute('aria-current');
    }
  }

  const onScroll = () => {
    frame ||= requestAnimationFrame(update);
  };
  const onKey = (e) => {
    if (open && e.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  };
  // un clic pe stratul de sub listă (`::before` al meniului deschis) cade chiar pe meniu: închide lista, fără să atingă ce e dedesubt
  nav.addEventListener('click', (e) => {
    if (e.target === nav) setOpen(false);
  });
  // cu Tab mai departe de listă, ea se închide (un clic pe stratul de sub ea mută focusul pe pagină, fără `relatedTarget`: îl
  // închide clicul de mai sus, ca atingerea să nu treacă la ce e dedesubt)
  nav.addEventListener('focusout', (e) => {
    if (open && e.relatedTarget && !nav.contains(e.relatedTarget)) setOpen(false);
  });

  return {
    el: nav,
    start() {
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll, { passive: true });
      document.addEventListener('keydown', onKey);
      onScroll();
    },
    destroy() {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
