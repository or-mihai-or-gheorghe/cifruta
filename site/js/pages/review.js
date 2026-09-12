// Rezultatele unui test: rezumat, autoevaluare, zona pentru părinți și revizuirea fiecărui exercițiu.
// Rezumatul vine din încercarea salvată, deci arată același scor ca cardul testului. Lista pe exerciții
// se reconstruiește doar dacă testul nu s-a schimbat de atunci.

import concepts from '../../data/concepts.js';
import config from '../../data/scoring.js';
import { countUp, h, pop } from '../core/dom.js';
import { md } from '../core/markup.js';
import { findTest, loadTest } from '../core/loader.js';
import { cantitate, formatNumber } from '../core/ro.js';
import { evaluateExercise, gradeFor, reached } from '../core/scoring.js';
import { play } from '../core/sound.js';
import { clearDraft, isUnsaved, lastAttempt, updateAttempt } from '../core/storage.js';
import { mountExercise } from '../components/exercise.js';
import { clearHistoryButton } from '../components/history.js';
import { art, backLink, callout, confetti, levelPill, stars } from '../components/ui.js';
import { emojiHTML } from '../visuals/emoji.js';

const statusOf = (fraction) => (reached(fraction, 1) ? 'correct' : reached(0, fraction) ? 'wrong' : 'partial');
const STATUS_ICON = { correct: '✓', wrong: '✗', partial: '◐' };
const MOOD = { FB: 'sarbatoreste', B: 'vesela', S: 'incurajeaza', EX: 'incurajeaza' };
const minutes = (ms) => cantitate(Math.max(1, Math.round(ms / 60000)), 'minut', 'minute');

function explanation(ex) {
  const e = ex.explain ?? {};
  return h(
    'div',
    { class: 'c-explain__body' },
    e.idea ? callout('idea', 'idee', md(e.idea)) : null,
    e.steps?.length ? h('ol', { class: 'c-steps' }, e.steps.map((s) => h('li', { html: md(s) }))) : null,
    e.check ? callout('ok', 'proba', `<strong>Proba:</strong> ${md(e.check)}`) : null,
    e.trap ? callout('warn', 'capcana', `<strong>Atenție la capcană:</strong> ${md(e.trap)}`) : null,
  );
}

export default async function review(container, [testId]) {
  const entry = findTest(testId);
  if (!entry) {
    location.hash = '#/nu-exista';
    return;
  }
  const test = await loadTest(testId);
  if (!container.isConnected) return; // s-a navigat în altă parte cât se încărca testul
  const attempt = lastAttempt(testId);
  if (!attempt) {
    location.hash = `#/test/${testId}`;
    return;
  }
  document.title = `Rezultate: ${test.title} — Cifruța`;
  const grade = gradeFor(attempt.score);
  const levels = config.levels.filter((l) => attempt.levels?.[l.id]);
  const starCount = levels.filter((l) => attempt.levels[l.id].star).length;
  const sameVersion = attempt.testVersion === test.version;
  const controllers = [];

  // ——— rezumat ———
  const feelButtons = [
    ['trist', 'Mi-a fost greu'],
    ['neutru', 'A fost așa și așa'],
    ['vesel', 'Mi-a plăcut, a fost ușor'],
  ].map(([emoji, label]) =>
    h('button', {
      type: 'button',
      class: `c-feel__btn${attempt.feeling === emoji ? ' is-selected' : ''}`,
      'aria-label': label,
      'aria-pressed': String(attempt.feeling === emoji),
      title: label,
      'data-testid': `feel-${emoji}`,
      html: emojiHTML(emoji),
      onClick: (e) => {
        updateAttempt(attempt.id, { feeling: emoji });
        for (const b of e.currentTarget.parentElement.children) {
          b.classList.toggle('is-selected', b === e.currentTarget);
          b.setAttribute('aria-pressed', String(b === e.currentTarget));
        }
        pop(e.currentTarget);
      },
    }),
  );

  const practice = Object.entries(attempt.concepts ?? {})
    .filter(([, c]) => c.total && !reached(c.earned / c.total, config.practiceBelow))
    .map(([id]) => concepts[id]?.title ?? id);

  const levelTimes = config.levels
    .map((l) => {
      const ms = test.exercises.filter((e) => e.level === l.id).reduce((s, e) => s + (attempt.msByExercise?.[e.id] ?? 0), 0);
      return ms ? `${l.label}: ${minutes(ms)}` : null;
    })
    .filter(Boolean);

  const scoreNum = h('span', {}, String(attempt.score)); // numără de la 0 după montare
  const summary = h(
    'section',
    { class: 'ex-summary anim-fade-up', 'data-testid': 'summary' },
    art({ v: 'mascot', mood: MOOD[grade.code], decorative: true }, { cls: 'ex-summary__art anim-bounce-in' }),
    h(
      'div',
      { class: 'l-stack' },
      h('h1', {}, 'Rezultatele tale'),
      h(
        'div',
        { class: 'l-cluster' },
        h('p', { class: 'c-score', 'data-testid': 'score', 'data-value': String(attempt.score) }, scoreNum, h('small', {}, ' / 100')),
        h('span', { class: 'c-grade', 'data-grade': grade.code }, grade.code === 'EX' ? '' : `${grade.code} · `, grade.label),
      ),
      h('p', { class: 'u-big' }, grade.message),
      h(
        'div',
        { class: 'ex-levels anim-stagger' },
        levels.map((l) => h('span', { class: 'ex-level-result', 'data-level': l.id }, levelPill(l.id), stars(attempt.levels[l.id].star ? 1 : 0, 1, { label: attempt.levels[l.id].star ? 'stea câștigată' : 'fără stea' }))),
      ),
      h('p', { class: 'u-muted' }, `Ai câștigat ${starCount} din ${cantitate(levels.length, 'stea', 'stele')}. O stea înseamnă cel puțin 80% dintr-un nivel.`),
    ),
  );

  const parents = h(
    'details',
    { class: 'c-explain', 'data-testid': 'parents' },
    h('summary', {}, 'Pentru părinți'),
    h(
      'div',
      { class: 'c-explain__body' },
      h('p', {}, `Timp de lucru: ${minutes(attempt.activeMs ?? 0)}${levelTimes.length ? ` (${levelTimes.join(' · ')})` : ''}. Estimare pentru un elev mediu: ${cantitate(test.exercises.reduce((s, e) => s + e.estMin, 0), 'minut', 'minute')}.`),
      h('p', {}, practice.length ? `De exersat: ${practice.join('; ')}.` : 'Toate conceptele din test au fost stăpânite (peste 70%).'),
      h('div', { class: 'l-cluster' }, clearHistoryButton({
        label: 'Șterge rezultatele acestui test',
        text: `Se șterg toate încercările la „${test.title}” și ciorna începută.`,
        testIds: [testId],
        testid: `clear-test-${testId}`,
        after: () => { location.hash = `#/sectiune/${entry.section.id}`; },
      })),
    ),
  );

  const retake = () =>
    h('button', { class: 'c-btn c-btn--primary', 'data-testid': 'retake', onClick: () => { clearDraft(testId); location.hash = `#/test/${testId}`; } }, 'Reia testul');

  // ——— lista de exerciții ———
  const list = h('div', { class: 'ex-review', 'data-testid': 'review-list' });
  let onlyMistakes = false;
  const filterBtn = h('button', { class: 'c-btn c-btn--sm', 'aria-pressed': 'false', 'data-testid': 'filter-mistakes', onClick: () => {
    onlyMistakes = !onlyMistakes;
    filterBtn.setAttribute('aria-pressed', String(onlyMistakes));
    filterBtn.textContent = onlyMistakes ? 'Arată toate exercițiile' : 'Doar greșelile';
    for (const item of list.children) item.hidden = onlyMistakes && item.dataset.status === 'correct';
  } }, 'Doar greșelile');

  container.append(
    h(
      'div',
      { class: 'l-container l-stack l-stack--lg', 'data-theme': test.theme },
      backLink(`#/sectiune/${entry.section.id}`, entry.section.title),
      summary,
      isUnsaved(attempt)
        ? h('div', { 'data-testid': 'unsaved' }, callout('warn', 'capcana', '<strong>Rezultatul nu a putut fi salvat</strong> în acest browser (spațiu plin sau stocare blocată). Îl vezi acum, dar nu va apărea în istoric. Ciorna cu răspunsurile rămâne.'))
        : null,
      h('section', { class: 'c-card l-stack' }, h('h2', { class: 'u-center' }, 'Cum te-ai simțit?'), h('div', { class: 'c-feel' }, feelButtons)),
      parents,
      sameVersion
        ? [
            h('div', { class: 'l-cluster l-cluster--between' }, h('h2', {}, 'Hai să vedem fiecare exercițiu'), h('div', { class: 'l-cluster' }, filterBtn, retake())),
            list,
          ]
        : h(
            'section',
            { class: 'c-card l-stack', 'data-testid': 'old-version' },
            callout('idea', 'idee', 'Testul a fost actualizat după ce l-ai rezolvat, așa că nu mai putem arăta fiecare exercițiu. Scorul de mai sus rămâne cel obținut atunci.'),
            h('div', { class: 'l-cluster l-cluster--center' }, retake()),
          ),
      h('div', { class: 'l-cluster l-cluster--center' }, h('a', { class: 'c-btn c-btn--lg', href: `#/sectiune/${entry.section.id}` }, 'Înapoi la teste')),
    ),
  );

  countUp(scoreNum, attempt.score);
  play({ FB: 'win', B: 'yes' }[grade.code] ?? 'done');
  // confetti-ul vine după ce scorul a terminat de numărat
  if (attempt.score >= config.confettiAt) setTimeout(() => container.isConnected && confetti(), 650);

  const cleanup = () => controllers.forEach((c) => c.destroy());
  if (!sameVersion) return cleanup;

  for (const [i, ex] of test.exercises.entries()) {
    const r = evaluateExercise(ex, attempt.answers?.[ex.id] ?? {});
    const status = statusOf(r.fraction);
    const item = h('section', { class: 'ex-review__item', 'data-status': status, 'data-testid': `review-${ex.id}` });
    list.append(item);
    const ctl = await mountExercise(item, ex, { number: i + 1, answers: attempt.answers?.[ex.id] ?? {}, mode: 'review', seed: attempt.seed });
    controllers.push(ctl);
    if (!container.isConnected) break; // pagina a fost părăsită în timpul montării
    ctl.el.style.animationDelay = `${Math.min(i, 5) * 60}ms`; // cardurile apar pe rând, nu după cât durează montarea
    ctl.showResults(r);
    ctl.el.querySelector('.ex-head').append(
      h('span', { class: `ex-review__score is-${status}` }, STATUS_ICON[status], ` ${formatNumber(r.earnedPoints)} din ${cantitate(r.points, 'punct', 'puncte')}`),
    );

    const solutionHost = h('div');
    const details = h(
      'details',
      { class: 'c-explain' },
      h('summary', { html: `${emojiHTML('idee')} De ce? Cum rezolvăm` }),
      explanation(ex),
      h('div', { class: 'c-explain__body' }, solutionHost),
    );
    let solutionShown = false;
    details.addEventListener('toggle', async () => {
      if (!details.open || solutionShown) return;
      solutionShown = true;
      solutionHost.append(h('h3', { html: `${emojiHTML('calcul')} Rezolvarea` }));
      const sol = await mountExercise(solutionHost, ex, { mode: 'solution', seed: attempt.seed });
      if (!container.isConnected) return sol.destroy();
      sol.showSolution();
      controllers.push(sol);
    });
    item.append(details);

    if (status !== 'correct') {
      const retryHost = h('div');
      const retryBtn = h('button', { class: 'c-btn c-btn--accent', 'data-testid': `retry-${ex.id}` }, 'Mai încerc o dată');
      retryBtn.addEventListener('click', async () => {
        retryBtn.remove();
        const box = h('div', { class: 'ex-review__retry' }, ex.explain?.idea ? callout('idea', 'idee', `<strong>Indiciu:</strong> ${md(ex.explain.idea)}`) : null);
        retryHost.append(box);
        const again = await mountExercise(box, ex, { seed: attempt.seed + 1 });
        if (!container.isConnected) return again.destroy();
        controllers.push(again);
        const verdict = h('div');
        const check = h('button', { class: 'c-btn c-btn--primary', 'data-testid': `retry-check-${ex.id}` }, 'Verifică');
        check.addEventListener('click', () => {
          const res = evaluateExercise(ex, again.get());
          again.mode('review');
          again.showResults(res);
          check.remove();
          updateAttempt(attempt.id, { secondChance: { ...(lastAttempt(testId)?.secondChance ?? {}), [ex.id]: res.fraction } });
          const won = statusOf(res.fraction) === 'correct';
          const node = won
            ? callout('ok', 'bravo', 'Bravo! Acum ai rezolvat corect. Ai văzut unde era capcana.')
            : callout('warn', 'muschi', 'Încă nu. Deschide „De ce? Cum rezolvăm” și privește rezolvarea pas cu pas.');
          verdict.replaceChildren(node);
          if (won) {
            pop(node);
            confetti({ count: 16 });
          }
          play(won ? 'yes' : 'no');
        });
        box.append(h('div', { class: 'l-cluster' }, check), verdict);
      });
      item.append(h('div', { class: 'ex-review__actions' }, retryBtn), retryHost);
    }
  }

  return cleanup;
}
