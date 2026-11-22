// Învață: lecțiile interactive. #/invata arată capitolele desfășurate (ca Jocurile fulger), cu „Ce învățăm” și cardurile lecțiilor;
// #/invata/<capitol> e aceeași pagină, derulată la capitol; #/invata/<capitol>/<lecție> deschide lecția (js/invata/lesson.js), iar
// #/invata/<capitol>/<joc> jocul capitolului, dacă are unul (tabla în 2 minute, js/invata/game.js).

import data from '../../data/invata.js';
import concepts from '../../data/concepts.js';
import { h } from '../core/dom.js';
import { md } from '../core/markup.js';
import { cantitate } from '../core/ro.js';
import { redirect } from '../core/router.js';
import { backLink, chip } from '../components/ui.js';
import { emojiHTML } from '../visuals/emoji.js';
import { visualSVG } from '../visuals/index.js';
import { chapterConcepts, findLesson, playableChapters } from '../invata/logic.js';
import { mountLesson } from '../invata/lesson.js';
import { doneTasks, isLessonDone, lessonsDone } from '../invata/progress.js';
import { getGames, getLessons } from '../core/storage.js';

const debug = () => new URLSearchParams(location.search).has('debug');

export default async function invata(container, [chapterId, lessonId] = []) {
  if (!chapterId) return hub(container);
  const found = findLesson(data, chapterId, lessonId);
  if (!found) return redirect('invata');
  if (lessonId === undefined) return hub(container, found.chapter);
  if (found.chapter.game?.id === lessonId) return gamePage(container, found.chapter);
  if (!found.lesson) return redirect(`invata/${chapterId}`);
  return lessonPage(container, found);
}

/** Cardul jocului unui capitol, după lecții: ⚡ în locul numărului, iar jos recordul sau „Nou”. */
function gameCard(chapter, games) {
  const { game } = chapter;
  const best = games[`${chapter.id}/${game.id}`]?.best?.correct ?? null;
  const state = best === null ? chip('Nou', 'c-chip--soon') : chip(`Recordul tău: ${cantitate(best, game.noun[0], game.noun[1])}`, '', 'trofeu');
  state.dataset.testid = `iv-game-state-${chapter.id}`;
  return h(
    'a',
    { class: 'iv-card iv-card--game', href: `#/invata/${chapter.id}/${game.id}`, 'data-testid': `iv-game-${chapter.id}` },
    h('span', { class: 'iv-card__num', 'aria-hidden': 'true', html: emojiHTML('fulger') }),
    h('span', { class: 'iv-card__icon', 'aria-hidden': 'true', html: emojiHTML(game.icon) }),
    h('h3', { class: 'iv-card__title' }, game.title),
    h('p', { class: 'iv-card__text' }, game.text),
    h('div', { class: 'iv-card__foot' }, state),
  );
}

/** Jocul capitolului: modulul lui aduce tipurile Jocurilor fulger, deci se încarcă doar acum (calea scrisă întreagă primește `?v=`). */
async function gamePage(container, chapter) {
  const { mountGame } = await import('../invata/game.js');
  if (!container.isConnected) return null; // între timp s-a deschis altă pagină: jocul nu mai pornește
  return mountGame(container, chapter, { debug: debug() });
}

/** Cardul unei lecții: numărul, iconița, titlul, indicația și cât s-a făcut din ea. */
function lessonCard(chapter, lesson, i, all) {
  const done = doneTasks(chapter, lesson, all).length;
  const finished = isLessonDone(chapter, lesson, all);
  const state = finished ? chip('✓ Gata', 'c-chip--ok') : done ? chip(`${done} din ${cantitate(lesson.tasks.length, 'provocare', 'provocări')}`) : chip('Nouă', 'c-chip--soon');
  state.dataset.testid = `iv-card-state-${lesson.id}`;
  return h(
    'a',
    { class: `iv-card${finished ? ' is-done' : ''}`, href: `#/invata/${chapter.id}/${lesson.id}`, 'data-testid': `iv-card-${lesson.id}` },
    h('span', { class: 'iv-card__num', 'aria-hidden': 'true' }, String(i + 1)),
    h('span', { class: 'iv-card__icon', 'aria-hidden': 'true', html: emojiHTML(lesson.icon) }),
    h('h3', { class: 'iv-card__title' }, lesson.title),
    h('p', { class: 'iv-card__text', html: md(lesson.goal) }),
    h('div', { class: 'iv-card__foot' }, state),
  );
}

function hub(container, focus = null) {
  document.title = 'Învață — Cifruța';
  const all = getLessons();
  const games = getGames();
  const chapters = playableChapters(data).map((chapter) => {
    const done = lessonsDone(chapter, all);
    return h(
      'section',
      { class: 'iv-chapter', 'aria-labelledby': `iv-cap-${chapter.id}`, 'data-testid': `iv-chapter-${chapter.id}` },
      h(
        'div',
        { class: 'iv-chapter__head' },
        h('span', { class: 'c-card__icon', 'aria-hidden': 'true', html: emojiHTML(chapter.icon) }),
        h('h2', { class: 'iv-chapter__title', id: `iv-cap-${chapter.id}` }, chapter.title),
        chip(`${done} din ${cantitate(chapter.lessons.length, 'lecție', 'lecții')}`, done === chapter.lessons.length ? 'c-chip--ok' : ''),
      ),
      h('p', { class: 'iv-chapter__text' }, chapter.text),
      h(
        'div',
        { class: 'iv-chapter__learn' },
        h('h3', { class: 'iv-chapter__label' }, 'Ce învățăm'),
        h('ul', { class: 'fg-concepts' }, chapterConcepts(chapter).map((id) => h('li', {}, chip(concepts[id]?.title ?? id)))),
      ),
      h(
        'div',
        { class: 'l-grid anim-stagger iv-cards', style: { '--grid-min': '15rem' } },
        chapter.lessons.map((l, i) => lessonCard(chapter, l, i, all)),
        chapter.game ? gameCard(chapter, games) : null,
      ),
      chapter.practice
        ? h('p', { class: 'iv-chapter__practice' }, h('a', { class: 'c-btn', href: `#/fulger/${chapter.practice}`, 'data-testid': `iv-practice-${chapter.id}` }, h('span', { 'aria-hidden': 'true', html: emojiHTML('fulger') }), 'Exersează pe viteză, în Jocuri fulger'))
        : null,
    );
  });
  const soon = data.chapters.filter((c) => c.soon);
  container.append(
    h(
      'div',
      { class: 'l-container l-stack l-stack--lg' },
      backLink('#/', 'Pagina de început'),
      h(
        'section',
        { class: 'iv-hub__hero anim-fade-up' },
        h('div', { class: 'iv-hub__bulb', 'aria-hidden': 'true', html: emojiHTML('idee') }),
        h(
          'div',
          { class: 'l-stack l-stack--sm' },
          h('h1', { class: 'iv-hub__title' }, 'Învață cu Cifruța'),
          h('p', { class: 'iv-hub__text' }, 'Lecții cu desene pe care le miști tu: glisoare, atingeri și provocări mici. Vezi cum se face calculul, apoi încearcă singur.'),
        ),
        h('div', { class: 'iv-hub__mascot', 'aria-hidden': 'true', html: visualSVG({ v: 'mascot', mood: 'vesela' }) }),
      ),
      ...chapters,
      soon.length
        ? h(
            'section',
            { class: 'l-stack', 'aria-labelledby': 'iv-curand' },
            h('h2', { class: 'fg-h2', id: 'iv-curand' }, 'În curând'),
            h(
              'div',
              { class: 'l-grid', style: { '--grid-min': '15rem' } },
              soon.map((c) =>
                h(
                  'article',
                  { class: 'c-card c-card--soon', 'data-testid': `iv-soon-${c.id}` },
                  h('div', { class: 'c-card__icon', 'aria-hidden': 'true', html: emojiHTML(c.icon) }),
                  h('h3', { class: 'c-card__title' }, c.title),
                  h('p', { class: 'c-card__text' }, c.text),
                  h('div', { class: 'c-card__footer l-cluster' }, chip('în curând', 'c-chip--soon')),
                ),
              ),
            ),
          )
        : null,
    ),
  );
  const target = focus && container.querySelector(`[data-testid="iv-chapter-${focus.id}"]`);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  if (debug()) window.__dbg = { invata: { lessons: playableChapters(data).flatMap((c) => c.lessons.map((l) => ({ chapter: c.id, lesson: l.id, tasks: l.tasks.length }))) } };
  return () => {
    if (debug()) delete window.__dbg;
  };
}

/** Lecția de pe ecran: dacă alta s-a deschis cât timp se încărca, curățenia celei vechi nu atinge clasa și depanarea celei noi. */
let shown = null;

async function lessonPage(container, found) {
  document.title = `${found.lesson.title} · Învață — Cifruța`;
  const token = {};
  shown = token;
  const lesson = await mountLesson(container, found);
  if (shown === token) {
    document.body.classList.add('is-lesson');
    if (debug()) window.__dbg = { invata: lesson.debug };
  }
  return () => {
    lesson.destroy();
    if (shown !== token) return;
    shown = null;
    document.body.classList.remove('is-lesson');
    if (debug()) delete window.__dbg;
  };
}
