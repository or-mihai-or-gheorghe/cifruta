// Clasamentul (#/clasament/fulger/<nivel>/<week|all> și #/clasament/teste), doar pentru cei intrați în cont: porecla, avatarul
// și scorul. Primele 20 de locuri, apoi locurile profilurilor familiei aflate mai jos.

import fulgerConfig from '../../data/fulger.js';
import { accountState, activeProfile, firebaseHandles, onAccountChange } from '../cloud/account.js';
import { boardId, loadBoard } from '../cloud/boards.js';
import { cloudConfigured } from '../cloud/config.js';
import { backLink, callout, chip, levelInfo } from '../components/ui.js';
import { escapeHTML, h } from '../core/dom.js';
import { cantitate } from '../core/ro.js';
import { emojiHTML } from '../visuals/emoji.js';

const LEVEL_IDS = fulgerConfig.levels.map((l) => l.id);
const PODIUM = ['aur', 'argint', 'bronz'];

export default function clasament(container, [game = 'fulger', level = LEVEL_IDS[0], period = 'week']) {
  const view = game === 'teste' ? { game: 'teste' } : { game: 'fulger', level: LEVEL_IDS.includes(level) ? level : LEVEL_IDS[0], period: period === 'all' ? 'all' : 'week' };
  document.title = 'Clasament — Cifruța';
  const root = h('div', { class: 'l-container l-container--narrow l-stack l-stack--lg', 'data-testid': 'leaderboard' });
  container.append(root);
  let alive = true;
  let lastKey = null;

  const pill = (href, label, active, testid, lvl = null) =>
    h('a', { class: `lb-pill${active ? ' is-active' : ''}`, href, 'aria-current': active ? 'true' : null, 'data-testid': testid, 'data-level': lvl }, label);

  function tabs() {
    const tab = (href, label, active, testid) => h('a', { class: `c-tab${active ? ' is-active' : ''}`, href, 'aria-current': active ? 'page' : null, 'data-testid': testid }, label);
    const fulger = view.game === 'fulger';
    return h(
      'div',
      { class: 'l-stack l-stack--sm' },
      h('nav', { class: 'c-tabs', 'aria-label': 'Jocul' }, tab(`#/clasament/fulger/${view.level ?? LEVEL_IDS[0]}/${view.period ?? 'week'}`, 'Calcul fulger', fulger, 'lb-tab-fulger'), tab('#/clasament/teste', 'Stele la teste', !fulger, 'lb-tab-teste')),
      fulger
        ? h(
            'div',
            { class: 'l-cluster lb-filters' },
            h('div', { class: 'l-cluster', role: 'group', 'aria-label': 'Nivelul' }, LEVEL_IDS.map((id) => pill(`#/clasament/fulger/${id}/${view.period}`, levelInfo(id)?.label ?? id, id === view.level, `lb-level-${id}`, id))),
            h('div', { class: 'l-cluster', role: 'group', 'aria-label': 'Perioada' }, pill(`#/clasament/fulger/${view.level}/week`, 'Săptămâna aceasta', view.period === 'week', 'lb-week'), pill(`#/clasament/fulger/${view.level}/all`, 'Tot timpul', view.period === 'all', 'lb-all')),
          )
        : h('p', { class: 'u-small u-muted' }, 'Pentru fiecare test contează cea mai bună încercare: o stea pe fiecare nivel, cel mult 3 stele pe test.'),
    );
  }

  function row(e, s) {
    const mine = e.uid === s.user.uid;
    const active = mine && e.pid === s.pid;
    const tests = view.game === 'teste';
    return h(
      'li',
      { class: `lb-row${mine ? ' is-mine' : ''}${active ? ' is-active' : ''}`, 'data-testid': `lb-row-${e.id}` },
      h('span', { class: 'u-visually-hidden' }, `Locul ${e.place}: `),
      e.place <= 3
        ? h('span', { class: 'lb-place lb-place--medal', 'aria-hidden': 'true', html: emojiHTML(PODIUM[e.place - 1]) })
        : h('span', { class: 'lb-place', 'aria-hidden': 'true' }, String(e.place)),
      h('span', { class: 'lb-avatar', 'aria-hidden': 'true', html: emojiHTML(e.avatar) }),
      h('span', { class: 'lb-name' }, h('strong', { class: 'u-break' }, e.nickname), active ? chip('tu', 'c-chip--ok') : mine ? chip('familia ta') : null),
      h(
        'span',
        { class: 'lb-score' },
        tests ? cantitate(e.score, 'stea', 'stele') : cantitate(e.score, 'alună', 'alune'),
        h('small', { class: 'u-muted' }, tests ? `la ${cantitate(e.tests ?? 0, 'test', 'teste')}` : `serie de ${e.bestStreak ?? 0}`),
      ),
    );
  }

  function empty() {
    const tests = view.game === 'teste';
    return h(
      'div',
      { class: 'c-card u-center lb-empty', 'data-testid': 'lb-empty' },
      h('p', {}, tests ? 'Încă nu are nimeni stele aici. Rezolvă un test și fii primul!' : view.period === 'week' ? 'Săptămâna aceasta n-a jucat încă nimeni la acest nivel. Fii primul!' : 'Încă n-a jucat nimeni la acest nivel. Fii primul!'),
      h('div', { class: 'l-cluster l-cluster--center' }, h('a', { class: 'c-btn c-btn--primary', href: tests ? '#/' : `#/fulger/${view.level}` }, tests ? 'Alege un test' : 'Joacă')),
    );
  }

  async function fill(list, s) {
    try {
      const { top, own } = await loadBoard(firebaseHandles(), boardId(view), s.user.uid, s.profiles.map((p) => p.id));
      if (!alive || !list.isConnected) return;
      list.replaceChildren(
        ...[
          top.length ? h('ol', { class: 'lb-list', 'data-testid': 'lb-list' }, top.map((e) => row(e, s))) : empty(),
          own.length ? h('ol', { class: 'lb-list lb-list--own', 'data-testid': 'lb-own', 'aria-label': 'Locurile familiei tale' }, own.map((e) => row(e, s))) : null,
        ].filter(Boolean),
      );
    } catch (err) {
      console.error(err);
      if (!alive || !list.isConnected) return;
      list.replaceChildren(
        callout('bad', 'capcana', 'Nu am putut încărca clasamentul. Verifică internetul și încearcă din nou.'),
        h('div', { class: 'l-cluster l-cluster--center' }, h('button', { type: 'button', class: 'c-btn', onClick: () => { lastKey = null; render(); } }, 'Încearcă din nou')),
      );
    }
  }

  function body(s) {
    if (!cloudConfigured()) return [callout('idea', 'idee', 'Clasamentul va fi disponibil în curând.')];
    if (!s.user) {
      return [
        h(
          'section',
          { class: 'c-card acc-signin', 'data-testid': 'lb-invite' },
          h('div', { class: 'lb-lock', 'aria-hidden': 'true', html: emojiHTML('lacat') }),
          h('h2', {}, 'Clasamentul se vede după ce intri în cont'),
          h('p', { class: 'u-muted' }, 'Un părinte intră cu Google și face profiluri pentru copii. În clasament apar doar porecla, avatarul și scorul.'),
          h('a', { class: 'c-btn c-btn--primary c-btn--lg', href: '#/profil', 'data-testid': 'lb-sign-in' }, 'Intră în contul familiei'),
        ),
      ];
    }
    if (s.status === 'error') return [callout('bad', 'capcana', escapeHTML(s.error ?? 'Contul nu s-a putut încărca.'))];
    if (s.status !== 'ready') return [h('p', { class: 'c-card u-center u-muted' }, 'Se încarcă…')];
    const list = h('div', { class: 'lb-board', 'aria-live': 'polite' }, h('p', { class: 'u-center u-muted', 'data-testid': 'lb-loading' }, 'Se încarcă clasamentul…'));
    fill(list, s);
    const me = activeProfile();
    return [
      tabs(),
      me && !me.showOnBoards ? callout('idea', 'idee', `Profilul <strong>${escapeHTML(me.nickname)}</strong> nu apare în clasament. Poți schimba asta din <a href="#/profil">contul familiei</a>.`) : null,
      list,
    ];
  }

  function render() {
    const s = accountState();
    const key = JSON.stringify([s.status, s.user?.uid, s.pid, s.profiles.map((p) => [p.id, p.showOnBoards])]);
    if (key === lastKey) return;
    lastKey = key;
    root.replaceChildren(
      backLink('#/', 'Înapoi la teste'),
      h('h1', { class: 'lb-title' }, h('span', { 'aria-hidden': 'true', html: emojiHTML('trofeu') }), 'Clasament'),
      ...body(s).filter(Boolean), // replaceChildren ar scrie „null”
    );
  }

  const stop = onAccountChange(render);
  render();
  return () => {
    alive = false;
    stop();
  };
}
