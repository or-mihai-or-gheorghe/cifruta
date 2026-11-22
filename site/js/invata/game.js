// Învață: jocul unui capitol (#/invata/<capitol>/<joc>, de ex. tabla în 2 minute). E o rundă de 2 minute din Jocuri fulger, cu un
// singur tip de întrebări, care numără doar răspunsurile corecte: fără alune, stele, medalii și clasament (arena cu `count`). Rundele
// stau doar în browser, ca progresul lecțiilor (`cifruta:invata-jocuri`); la final se văd numărul, recordul, rundele de până acum și
// greșelile. Modulul se încarcă doar când jocul e deschis (pages/invata.js), pentru că aduce tipurile Jocurilor fulger.

import { callout, chip, confetti, mascot } from '../components/ui.js';
import { countUp, h, prefersReducedMotion } from '../core/dom.js';
import { cantitate, formatNumber } from '../core/ro.js';
import { refresh } from '../core/router.js';
import { play } from '../core/sound.js';
import { getGames, saveGameRound } from '../core/storage.js';
import { mistakesSection } from '../fulger/mistakes.js';
import { mountArena } from '../fulger/view.js';
import { emojiHTML } from '../visuals/emoji.js';

/** Câte runde arată „Rundele tale”. */
const SHOWN_ROUNDS = 10;

/** Jocul de pe ecran: curățenia unuia vechi nu atinge clasa și depanarea celui nou. */
let shown = null;

/** „37 de înmulțiri corecte” (substantivul jocului e feminin: înmulțire, împărțire). */
const counter = (game) => (n) => cantitate(n, `${game.noun[0]} corectă`, `${game.noun[1]} corecte`);
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Pornește jocul în `container` (gazda paginii, ca arena să umple ecranul) și întoarce curățenia. */
export function mountGame(container, chapter, { debug = false } = {}) {
  const { game } = chapter;
  const key = `${chapter.id}/${game.id}`;
  const right = counter(game);
  const token = {};
  shown = token;
  document.title = `${game.title} · Învață — Cifruța`;
  const before = getGames()[key] ?? { best: null, rounds: [] };
  const best = before.best?.correct ?? null;
  document.body.classList.add('is-game');
  let arena = mountArena(container, {
    topic: key, // nu e o temă a Jocurilor fulger: nivelul vine gata făcut din `count`
    level: 'usor', // doar culorile
    best,
    count: {
      kind: game.kind,
      title: game.title,
      text: game.rules,
      goal: best ? `Recordul tău: ${right(best)}. Poți mai mult?` : `Prima rundă: câte ${game.noun[1]} faci corect?`,
      quit: `#/invata/${chapter.id}`,
    },
    onEnd(summary) {
      arena?.destroy();
      arena = null;
      document.body.classList.remove('is-game');
      container.replaceChildren();
      window.scrollTo(0, 0);
      results(container, chapter, summary, before);
    },
  });
  if (debug) window.__dbg = { fulger: arena.debug };
  return () => {
    arena?.destroy();
    arena = null;
    if (shown !== token) return;
    shown = null;
    document.body.classList.remove('is-game');
    if (debug) delete window.__dbg;
  };
}

/** Rezultatele rundei: numărul mare, recordul, Cifruța, seria și timpul mediu, rundele de până acum și greșelile. */
function results(container, chapter, summary, before) {
  const { game } = chapter;
  const key = `${chapter.id}/${game.id}`;
  const right = counter(game);
  const at = new Date().toISOString();
  const last = before.rounds.at(-1)?.correct ?? null;
  // o rundă fără niciun răspuns (copilul n-a atins nimic) nu se salvează
  const saved = summary.answered > 0 ? saveGameRound(key, { at, correct: summary.correct, wrong: summary.wrong, bestStreak: summary.bestStreak }) : null;
  const record = Boolean(saved?.record);
  const now = getGames()[key] ?? { best: null, rounds: [] };
  const reduced = prefersReducedMotion();
  const kind = summary.byKind[game.kind];
  const avg = kind?.total ? kind.ms / kind.total / 1000 : null;
  const gain = last !== null ? summary.correct - last : 0;

  const num = h('span', { 'data-testid': 'iv-game-correct' }, reduced ? String(summary.correct) : '0');
  const card = h(
    'section',
    { class: 'fg-score-card iv-game-card', 'data-level': 'usor', 'data-testid': 'iv-game-results' },
    h('h1', { class: 'fg-score-card__title' }, 'Gata, timpul a expirat!'),
    h('p', { class: 'u-small u-muted' }, game.title),
    h('div', { class: 'fg-total' }, h('span', { class: 'fg-total__art', 'aria-hidden': 'true', html: emojiHTML('bravo') }), num),
    h('p', { class: 'iv-game-card__unit' }, `${right(summary.correct).replace(/^\d+ /, '')} în 2 minute`),
    summary.answered ? h('p', { class: 'u-muted' }, `din ${cantitate(summary.answered, 'răspuns', 'răspunsuri')}`) : null,
    record ? h('div', { class: 'fg-ribbon', 'data-testid': 'iv-game-record' }, saved.previous === null ? 'Primul tău record!' : 'Record nou!') : null,
    !record && now.best ? h('p', { class: 'u-muted', 'data-testid': 'iv-game-best' }, `Recordul tău: ${right(now.best.correct)}`) : null,
  );
  const [mood, message] =
    summary.answered === 0
      ? ['incurajeaza', 'Timpul a trecut fără răspunsuri. Apasă „Mai joc o dată” când ești gata!']
      : record && saved.previous !== null
        ? ['sarbatoreste', `Record nou! ${capitalize(right(summary.correct))} în 2 minute.`]
        : record
          ? ['sarbatoreste', 'Primul tău record! Data viitoare încearcă să-l bați.']
          : gain > 0
            ? ['vesela', `${capitalize(right(gain))} în plus față de data trecută!`]
            : ['incurajeaza', 'Fiecare rundă te face mai rapid. Mai încercăm?'];
  const again = h('button', { type: 'button', class: 'c-btn c-btn--primary c-btn--lg', 'data-testid': 'iv-game-again', onClick: () => refresh() }, 'Mai joc o dată');
  container.append(
    h(
      'div',
      { class: 'l-container l-container--narrow l-stack l-stack--lg fg-results iv-game-results' },
      card,
      saved && !saved.saved ? callout('warn', 'capcana', 'Runda nu s-a putut salva în acest browser (stocare plină sau blocată).') : null,
      h('div', { class: 'l-cluster l-cluster--center' }, again, h('a', { class: 'c-btn c-btn--lg', href: `#/invata/${chapter.id}`, 'data-testid': 'iv-game-back' }, `Înapoi la ${chapter.title}`)),
      mascot(mood, message, { center: true }),
      summary.answered
        ? h(
            'div',
            { class: 'l-cluster l-cluster--center' },
            chip(`Cea mai lungă serie: ${summary.bestStreak}`, '', 'foc'),
            avg !== null ? chip(`În medie ${formatNumber(avg)} s pe ${game.noun[0]}`, '', 'cronometru') : null,
            last !== null ? chip(`Data trecută: ${last}`, '', 'steag') : null,
          )
        : null,
      history(now, saved ? at : null, right),
      mistakesSection(summary),
    ),
  );
  if (!reduced) countUp(num, summary.correct, 900);
  if (record) {
    play('win');
    confetti({ count: 60 });
  }
  again.focus({ preventScroll: true });
}

/** „Rundele tale”: ultimele runde ca bare, cu runda de acum („acum”) și recordul (🏆) marcate; de la două runde încolo. */
function history({ best, rounds }, currentAt, right) {
  if (rounds.length < 2) return null;
  const list = rounds.slice(-SHOWN_ROUNDS);
  const max = Math.max(1, ...list.map((r) => r.correct));
  const day = (iso) => new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long' }).format(new Date(iso));
  return h(
    'section',
    { class: 'iv-runs', 'aria-labelledby': 'iv-runs-title', 'data-testid': 'iv-game-history' },
    h('h2', { class: 'fg-h2', id: 'iv-runs-title' }, 'Rundele tale'),
    h(
      'ol',
      { class: 'iv-runs__list' },
      list.map((r) => {
        const isNow = r.at === currentAt;
        const isBest = best !== null && r.correct === best.correct;
        return h(
          'li',
          { class: `iv-runs__item${isNow ? ' is-now' : ''}${isBest ? ' is-best' : ''}`, style: { '--h': (r.correct / max).toFixed(3) } },
          h('span', { class: 'iv-runs__num', 'aria-hidden': 'true' }, isBest ? h('span', { class: 'iv-runs__mark', html: emojiHTML('trofeu') }) : null, String(r.correct)),
          h('span', { class: 'iv-runs__bar', 'aria-hidden': 'true' }),
          h('span', { class: 'iv-runs__label', 'aria-hidden': 'true' }, isNow ? 'acum' : ''),
          h('span', { class: 'u-visually-hidden' }, `${capitalize(right(r.correct))}, ${isNow ? 'acum' : day(r.at)}${isBest ? ', recordul' : ''}.`),
        );
      }),
    ),
  );
}
