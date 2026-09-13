// Calcul fulger: hub-ul cu nivelurile (#/fulger), runda (#/fulger/<nivel>) și rezultatele ei.

import config from '../../data/fulger.js';
import { clearHistoryButton } from '../components/history.js';
import { backLink, callout, chip, confetti, levelInfo, levelPill, mascot, stars } from '../components/ui.js';
import { countUp, h, pop, prefersReducedMotion } from '../core/dom.js';
import { seededRandom } from '../core/rng.js';
import { cantitate, formatDateTime, formatNumber } from '../core/ro.js';
import { refresh } from '../core/router.js';
import { play } from '../core/sound.js';
import { clearFulger, getFulger, saveFulgerRound } from '../core/storage.js';
import { levelConfig, medalsFor, practiceFor, starsFor } from '../fulger/engine.js';
import { KINDS } from '../fulger/kinds.js';
import { mountArena } from '../fulger/view.js';
import { emojiHTML } from '../visuals/emoji.js';
import { visualSVG } from '../visuals/index.js';

const alune = (n) => cantitate(n, 'alună', 'alune');

export default function fulger(container, [levelId] = []) {
  const lvl = levelId ? levelConfig(levelId) : null;
  return lvl ? roundPage(container, lvl) : hubPage(container);
}

// ——— Hub ———

function hubPage(container) {
  document.title = 'Calcul fulger — Cifruța';
  const data = getFulger();
  const how = [
    ['cronometru', '2 minute', 'Rezolvă cât mai multe operații.'],
    ['foc', 'Serii', 'Corect de mai multe ori la rând: alunele cresc de 1,5, de 2, apoi de 3 ori.'],
    ['fulger', 'Fulgere', 'Repede și în serie: alune duble.'],
  ];
  container.append(
    h(
      'div',
      { class: 'l-container l-stack l-stack--lg' },
      backLink('#/', 'Pagina de început'),
      h(
        'section',
        { class: 'fg-hub__hero anim-fade-up' },
        h('div', { class: 'fg-hub__bolt', 'aria-hidden': 'true', html: emojiHTML('fulger') }),
        h('div', { class: 'l-stack l-stack--sm' }, h('h1', { class: 'fg-hub__title' }, 'Calcul fulger'), h('p', { class: 'fg-hub__text' }, 'Câte operații rezolvi în 2 minute? Strânge alune, fă serii și bate-ți recordul!')),
        h('div', { class: 'fg-hub__mascot', 'aria-hidden': 'true', html: visualSVG({ v: 'mascot', mood: 'sarbatoreste' }) }),
      ),
      h(
        'ul',
        { class: 'fg-how' },
        how.map(([icon, title, text]) =>
          h('li', { class: 'fg-how__item' }, h('span', { class: 'fg-how__icon', 'aria-hidden': 'true', html: emojiHTML(icon) }), h('span', {}, h('strong', { class: 'fg-how__title' }, title), h('span', { class: 'fg-how__text' }, text))),
        ),
      ),
      h('div', { class: 'l-grid anim-stagger', style: { '--grid-min': '15rem' } }, config.levels.map((l) => levelCard(l, data))),
      medalShelf(data),
      parentsBox(data),
    ),
  );
}

/** O întrebare-exemplu ca plăcuță: 7 + 5, 14 ◻ 17, 12 · 9 · 15. */
function sample(kind, seed) {
  const q = KINDS[kind].generate(seededRandom(seed));
  const content = q.mode === 'choice' ? q.text : q.mode === 'compare' ? [q.left, h('span', { class: 'fg-box', 'aria-label': 'căsuță' }), q.right] : q.numbers.join(' · ');
  return h('li', { class: 'fg-sample' }, content);
}

function levelCard(lvl, data) {
  const best = data.best[lvl.id]?.alune ?? null;
  const examples = ['choice', 'compare', 'sort'].map((mode) => lvl.mix.find((m) => KINDS[m.kind].mode === mode)?.kind).filter(Boolean);
  return h(
    'article',
    { class: 'c-card fg-level', 'data-level': lvl.id, 'data-testid': `fg-card-${lvl.id}` },
    h('div', { class: 'fg-level__head' }, levelPill(lvl.id), stars(best === null ? 0 : starsFor(lvl.id, best))),
    h('ul', { class: 'fg-samples', 'aria-label': 'Exemple de întrebări' }, examples.map((kind, i) => sample(kind, 11 + i))),
    h('p', { class: 'fg-level__best', 'data-testid': `fg-best-${lvl.id}` }, best === null ? chip('Nou!', 'c-chip--soon') : chip(`Record: ${alune(best)}`, '', 'trofeu')),
    h('a', { class: 'c-btn c-btn--primary c-btn--lg fg-level__play', href: `#/fulger/${lvl.id}`, 'data-testid': `fg-level-${lvl.id}` }, 'Joacă'),
  );
}

function medal(m, won) {
  return h(
    'li',
    { class: `fg-medal${won ? ' is-won' : ''}`, 'data-testid': `fg-medal-${m.id}` },
    h('span', { class: 'fg-medal__icon', 'aria-hidden': 'true', html: emojiHTML(m.icon) }),
    h('strong', { class: 'fg-medal__title' }, m.title),
    h('span', { class: 'fg-medal__text' }, m.text),
    h('span', { class: 'u-visually-hidden' }, won ? 'Câștigată.' : 'Încă necâștigată.'),
  );
}

function medalShelf(data) {
  const won = config.medals.filter((m) => data.medals[m.id]).length;
  return h(
    'section',
    { class: 'l-stack l-stack--sm' },
    h('h2', { class: 'fg-h2' }, `Medaliile tale (${won} din ${config.medals.length})`),
    h('ul', { class: 'fg-medals' }, config.medals.map((m) => medal(m, Boolean(data.medals[m.id])))),
  );
}

function parentsBox(data) {
  const rounds = data.rounds.slice(-10).reverse();
  const practice = practiceFor(data.rounds);
  return h(
    'details',
    { class: 'c-explain', 'data-testid': 'parents' },
    h('summary', {}, 'Pentru părinți'),
    h(
      'div',
      { class: 'c-explain__body' },
      h('p', { class: 'u-small u-muted' }, 'Rundele se salvează doar în acest browser. O stea înseamnă un copil sigur pe răspunsuri, trei stele unul sigur și foarte rapid; atingerile la întâmplare nu ajung la stele.'),
      rounds.length
        ? h(
            'ul',
            { class: 'c-history' },
            rounds.map((r) =>
              h(
                'li',
                { class: 'c-history__row' },
                h('span', {}, h('strong', {}, levelInfo(r.level)?.label ?? r.level), ` — ${formatDateTime(r.at)} · ${alune(r.total)} · ${r.correct} corecte din ${r.correct + r.wrong}`),
                stars(r.stars ?? 0),
              ),
            ),
          )
        : h('p', { class: 'u-muted' }, 'Nu există runde salvate.'),
      practice.length ? h('p', {}, h('strong', {}, 'De exersat: '), practice.map((p) => `${p.label} (${p.correct} din ${p.total})`).join(' · ')) : null,
      rounds.length
        ? h('div', { class: 'l-cluster' }, clearHistoryButton({ label: 'Șterge rundele', title: 'Ștergi rundele?', text: 'Se șterg rundele, recordurile și medaliile de la Calcul fulger.', testid: 'fg-clear', action: clearFulger }))
        : null,
    ),
  );
}

// ——— Runda ———

function roundPage(container, lvl) {
  document.title = `Calcul fulger · ${levelInfo(lvl.id)?.label ?? lvl.id} — Cifruța`;
  document.body.classList.add('is-game');
  const pending = new Set(); // opririle numărătorii de la rezultate
  let arena = mountArena(container, {
    level: lvl.id,
    best: getFulger().best[lvl.id]?.alune ?? null,
    onEnd(summary) {
      arena?.destroy();
      arena = null;
      document.body.classList.remove('is-game');
      container.replaceChildren();
      window.scrollTo(0, 0);
      results(container, lvl, summary, pending);
    },
  });
  if (new URLSearchParams(location.search).has('debug')) window.__dbg = { fulger: arena.debug };
  return () => {
    arena?.destroy();
    for (const stop of pending) stop();
    document.body.classList.remove('is-game');
    delete window.__dbg;
  };
}

// ——— Rezultatele ———

function results(container, lvl, summary, pending) {
  const before = getFulger();
  const at = new Date().toISOString();
  const last = before.rounds.filter((r) => r.level === lvl.id).at(-1)?.total ?? null;
  let saved = null;
  let earned = [];
  if (summary.answered > 0) {
    const previous = before.best[lvl.id]?.alune ?? 0;
    const best = summary.total > previous ? { ...before.best, [lvl.id]: { alune: summary.total, at } } : before.best;
    earned = medalsFor(summary, { rounds: before.rounds.length + 1, best }).filter((id) => !before.medals[id]);
    const round = { level: lvl.id, at, total: summary.total, correct: summary.correct, wrong: summary.wrong, bestStreak: summary.bestStreak, fast: summary.fast, stars: summary.stars, byKind: summary.byKind };
    saved = saveFulgerRound(round, { keep: config.keepRounds, medals: earned });
  }
  const reduced = prefersReducedMotion();
  const record = Boolean(saved?.record);
  const gain = last !== null ? summary.total - last : 0;

  const rows = [
    { icon: 'bravo', label: 'Răspunsuri corecte', value: summary.correct, suffix: ` din ${summary.answered}` },
    { nut: true, label: 'Alune din răspunsuri', value: summary.base },
    { icon: 'fulger', label: 'Bonus viteză', value: summary.speedBonus, prefix: '+' },
    { icon: 'foc', label: 'Bonus serie', value: summary.streakBonus, prefix: '+' },
    { icon: 'tinta', label: 'Bonus precizie', value: summary.precisionBonus, prefix: '+', hint: summary.precisionBonus ? null : 'la 9 din 10 corecte' },
  ].map((r) => {
    const num = h('span', {}, reduced ? String(r.value) : '0');
    const el = h(
      'li',
      { class: `fg-tally__row${reduced ? ' is-in' : ''}` },
      h(
        'span',
        { class: 'fg-tally__label' },
        h('span', { class: 'fg-tally__icon', 'aria-hidden': 'true', html: r.nut ? visualSVG({ v: 'alune', n: 1 }) : emojiHTML(r.icon) }),
        r.label,
        r.hint ? h('small', { class: 'u-muted' }, `(${r.hint})`) : null,
      ),
      h('span', { class: 'fg-tally__value' }, r.prefix ?? '', num, r.suffix ?? ''),
    );
    return { ...r, el, num };
  });
  const totalNum = h('span', { 'data-testid': 'fg-total' }, reduced ? String(summary.total) : '0');
  const total = h('div', { class: 'fg-total' }, h('span', { class: 'fg-total__art', 'aria-hidden': 'true', html: visualSVG({ v: 'alune', n: 3 }) }), totalNum, h('span', { class: 'u-visually-hidden' }, ' alune'));
  const starBox = stars(reduced ? summary.stars : 0, 3, { label: `${summary.stars} din 3 stele` });
  // în numărătoare: panglica are locul rezervat în card; mascota și medaliile stau sub butoane și apar pe rând
  const ribbon = record ? h('div', { class: `fg-ribbon${reduced ? '' : ' is-waiting'}`, 'data-testid': 'fg-record' }, saved.previous === null ? 'Primul tău record!' : 'Record nou!') : null;
  const medalEls = earned.map((id) => {
    const el = medal(config.medals.find((m) => m.id === id), true);
    el.hidden = !reduced;
    return el;
  });
  const medalBox = medalEls.length
    ? h('section', { class: 'l-stack l-stack--sm fg-new-medals', hidden: !reduced }, h('h2', { class: 'fg-h2' }, medalEls.length === 1 ? 'Medalie nouă!' : 'Medalii noi!'), h('ul', { class: 'fg-medals' }, medalEls))
    : null;
  const reveal = (el) => {
    if (!el || !(el.hidden || el.classList.contains('is-waiting'))) return;
    el.hidden = false;
    el.classList.remove('is-waiting');
    el.classList.add('is-in');
  };

  const [mood, message] =
    summary.answered === 0
      ? ['incurajeaza', 'Timpul a trecut fără răspunsuri. Apasă „Mai joc o dată” când ești gata!']
      : record && saved.previous !== null
        ? ['sarbatoreste', `Record nou! Ai strâns ${alune(summary.total)}.`]
        : summary.stars === 3
          ? ['sarbatoreste', 'Trei stele! Ești fulgerul Cifruței!']
          : summary.stars > 0
            ? ['vesela', `Bravo! Ai prins ${cantitate(summary.stars, 'stea', 'stele')}.`]
            : gain > 0
              ? ['incurajeaza', `Ai strâns cu ${alune(gain)} mai mult decât data trecută!`]
              : ['incurajeaza', 'Fiecare rundă te face mai rapid. Mai încercăm?'];

  const again = h('button', { type: 'button', class: 'c-btn c-btn--primary c-btn--lg fg-again', 'data-testid': 'fg-again', onClick: () => refresh() }, 'Mai joc o dată');
  const kindRows = Object.entries(summary.byKind).map(([kind, k]) =>
    h('tr', {}, h('td', {}, KINDS[kind].label), h('td', {}, `${k.correct} din ${k.total}`), h('td', {}, `${formatNumber(k.ms / k.total / 1000)} s`)),
  );
  const card = h(
    'section',
    { class: 'fg-score-card', 'data-level': lvl.id, 'data-testid': 'fg-results' },
    h('h1', { class: 'fg-score-card__title' }, 'Gata, timpul a expirat!'),
    levelPill(lvl.id),
    h('ol', { class: 'fg-tally' }, rows.map((r) => r.el)),
    total,
    starBox,
    ribbon,
    !record && saved?.previous ? h('p', { class: 'u-muted' }, `Recordul tău: ${alune(saved.previous)}`) : null,
  );
  const buddy = mascot(mood, message, { center: true });
  buddy.classList.add('fg-results__buddy');
  buddy.hidden = !reduced;
  container.append(
    h(
      'div',
      { class: 'l-container l-container--narrow l-stack l-stack--lg fg-results' },
      card,
      saved && !saved.saved ? callout('warn', 'capcana', 'Runda nu s-a putut salva în acest browser (stocare plină sau blocată).') : null,
      h('div', { class: 'l-cluster l-cluster--center' }, again, h('a', { class: 'c-btn c-btn--lg', href: '#/fulger', 'data-testid': 'fg-levels' }, 'Alt nivel')),
      buddy,
      summary.answered
        ? h(
            'div',
            { class: 'l-cluster l-cluster--center' },
            chip(`Cea mai lungă serie: ${summary.bestStreak}`, '', 'foc'),
            chip(cantitate(summary.fast, 'fulger', 'fulgere'), '', 'fulger'),
            last !== null ? chip(`Data trecută: ${alune(last)}`, '', 'steag') : null,
          )
        : null,
      medalBox,
      summary.answered
        ? h(
            'details',
            { class: 'c-explain', 'data-testid': 'parents' },
            h('summary', {}, 'Pentru părinți'),
            h(
              'div',
              { class: 'c-explain__body' },
              h('p', { class: 'u-small u-muted' }, 'Pe tipuri de întrebări: răspunsurile corecte și timpul mediu de gândire (fără pauze).'),
              h('div', { class: 'fg-table-wrap' }, h('table', { class: 'fg-table' }, h('thead', {}, h('tr', {}, h('th', {}, 'Întrebări'), h('th', {}, 'Corecte'), h('th', {}, 'Timp mediu'))), h('tbody', {}, kindRows))),
            ),
          )
        : null,
    ),
  );

  if (reduced) {
    again.focus({ preventScroll: true });
    return;
  }

  // numărătoarea de arcade: rândurile, totalul, stelele, recordul, medaliile; o atingere sare direct la final
  const ids = [];
  let t = 300;
  const step = (fn, gap) => {
    ids.push(setTimeout(fn, t));
    t += gap;
  };
  for (const r of rows) {
    step(() => {
      r.el.classList.add('is-in');
      countUp(r.num, r.value, 320);
      if (r.value > 0) play('tap');
    }, 380);
  }
  step(() => {
    countUp(totalNum, summary.total, 800);
    pop(total, 'anim-pop');
  }, 950);
  for (let i = 0; i < summary.stars; i++) {
    step(() => {
      starBox.children[i].classList.add('is-on', 'is-stamped');
      play('star');
    }, 320);
  }
  step(() => reveal(buddy), 350);
  if (ribbon) {
    step(() => {
      reveal(ribbon);
      play('win');
      confetti({ count: 90 });
    }, 550);
  }
  for (const el of medalEls) {
    step(() => {
      reveal(medalBox);
      reveal(el);
      play('level');
    }, 450);
  }
  step(() => end(), 0);

  function end() {
    stop();
    for (const r of rows) {
      r.el.classList.add('is-in');
      countUp(r.num, r.value, 0, r.value);
    }
    countUp(totalNum, summary.total, 0, summary.total);
    [...starBox.children].forEach((s, i) => s.classList.toggle('is-on', i < summary.stars));
    for (const el of [ribbon, buddy, medalBox, ...medalEls]) reveal(el);
    again.focus({ preventScroll: true });
  }
  function skip(e) {
    if (e.type === 'keydown' && !['Enter', ' ', 'Escape'].includes(e.key)) return;
    if (e.type === 'keydown') e.preventDefault();
    end();
  }
  function stop() {
    for (const id of ids) clearTimeout(id);
    container.removeEventListener('pointerdown', skip);
    document.removeEventListener('keydown', skip);
    pending.delete(stop);
  }
  container.addEventListener('pointerdown', skip);
  document.addEventListener('keydown', skip);
  pending.add(stop);
}
