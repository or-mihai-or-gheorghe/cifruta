// Playerul: un exercițiu pe ecran, harta cu buline pe niveluri, ecrane între niveluri, ciornă salvată automat.

import config from '../../data/scoring.js';
import { clear, h } from '../core/dom.js';
import { findTest, loadTest } from '../core/loader.js';
import { getLogic } from '../core/registry.js';
import { cantitate } from '../core/ro.js';
import { newSeed } from '../core/rng.js';
import { progressOf, scoreTest } from '../core/scoring.js';
import { addAttempt, clearDraft, getDraft, saveDraft } from '../core/storage.js';
import { mountExercise } from '../components/exercise.js';
import { confirmModal } from '../components/modal.js';
import { art, backLink, levelInfo, levelPill, mascot } from '../components/ui.js';

const isDone = (ex, answers) => {
  const p = progressOf(ex, answers?.[ex.id]);
  return p.done >= p.count;
};

export default async function player(container, [testId]) {
  const entry = findTest(testId);
  if (!entry) {
    location.hash = '#/nu-exista';
    return;
  }
  const test = await loadTest(testId);
  if (!container.isConnected) return; // s-a navigat în altă parte cât se încărca testul
  document.title = `${test.title} — Cifruța`;

  let draft = getDraft(testId);
  if (!draft || draft.version !== test.version) {
    draft = { testId, version: test.version, seed: newSeed(), current: -1, answers: {}, activeMs: 0, msByExercise: {}, seenBreaks: [], startedAt: new Date().toISOString() };
  }
  let submitted = false; // după trimitere, ciorna nu mai trebuie salvată (altfel reapare la redeschidere)
  // ciorna există doar după „Începe testul” (altfel cardul ar arăta „început” la simpla deschidere)
  const save = () => {
    if (!submitted && draft.current >= 0) saveDraft(testId, draft);
  };
  const total = test.exercises.length;
  const totalMin = test.exercises.reduce((s, e) => s + e.estMin, 0);

  const map = h('nav', { class: 'c-progress', 'aria-label': 'Exercițiile testului' });
  const stage = h('div', { class: 'ex-player__stage' });
  const nav = h('div', { class: 'ex-nav' });
  container.append(
    h(
      'div',
      { class: 'l-container ex-player', 'data-theme': test.theme },
      h(
        'div',
        { class: 'ex-player__top' },
        h('div', { class: 'l-stack l-stack--sm' }, backLink(`#/sectiune/${entry.section.id}`, entry.section.title), h('h1', { class: 'ex-player__title' }, test.title)),
        h('button', { class: 'c-btn c-btn--accent', 'data-testid': 'finish-top', onClick: () => finish() }, 'Vezi rezultatele'),
      ),
      map,
      stage,
      nav,
    ),
  );

  let controller = null;
  let renderToken = 0;

  const timer = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    draft.activeMs += 1000;
    const ex = test.exercises[draft.current];
    if (ex) draft.msByExercise[ex.id] = (draft.msByExercise[ex.id] ?? 0) + 1000;
    if (draft.activeMs % 5000 === 0) save();
  }, 1000);

  function renderMap() {
    map.replaceChildren(
      ...config.levels
        .map((lvl) => {
          const dots = test.exercises
            .map((ex, i) => ({ ex, i }))
            .filter(({ ex }) => ex.level === lvl.id)
            .map(({ ex, i }) => {
              const p = progressOf(ex, draft.answers[ex.id]);
              const state = p.done === 0 ? '' : p.done >= p.count ? ' is-done' : ' is-partial';
              return h(
                'button',
                {
                  type: 'button',
                  class: `c-progress__dot${state}${i === draft.current ? ' is-current' : ''}`,
                  'aria-label': `Exercițiul ${i + 1}, nivel ${lvl.label}${p.done >= p.count ? ', terminat' : ''}`,
                  'aria-current': i === draft.current ? 'step' : null,
                  'data-testid': `dot-${i + 1}`,
                  onClick: () => show(i),
                },
                i + 1,
              );
            });
          return dots.length ? h('div', { class: 'c-progress__group', 'data-level': lvl.id, title: lvl.label }, dots) : null;
        })
        .filter(Boolean),
    );
  }

  function resetStage() {
    controller?.destroy();
    controller = null;
    clear(stage);
    nav.replaceChildren();
    window.scrollTo({ top: 0 });
  }

  async function show(index) {
    const token = ++renderToken;
    resetStage();
    draft.current = index;
    save();
    renderMap();
    if (index < 0) return renderIntro();

    const ex = test.exercises[index];
    const host = h('div');
    const ctl = await mountExercise(host, ex, {
      number: index + 1,
      answers: draft.answers[ex.id] ?? {},
      seed: draft.seed,
      onChange: (partId, answer) => {
        (draft.answers[ex.id] ??= {})[partId] = answer;
        save();
        renderMap();
      },
    });
    if (token !== renderToken || !container.isConnected) return ctl.destroy();
    controller = ctl;
    stage.append(host);
    renderNav(index);
  }

  function renderIntro() {
    const levels = config.levels
      .map((l) => {
        const count = test.exercises.filter((e) => e.level === l.id).length;
        return count ? h('span', { class: 'l-cluster' }, levelPill(l.id), h('span', { class: 'u-small u-muted' }, cantitate(count, 'exercițiu', 'exerciții'))) : null;
      })
      .filter(Boolean);
    stage.append(
      h(
        'section',
        { class: 'ex-intro anim-fade-up' },
        h('div', { class: 'ex-intro__scene' }, art({ v: 'scene', theme: test.theme, decorative: true })),
        test.subtitle ? h('p', { class: 'u-big u-muted' }, test.subtitle) : null,
        test.story ? mascot('vesela', test.story) : null,
        h('div', { class: 'ex-intro__levels' }, levels),
        h('p', { class: 'u-muted' }, `Durează cam ${cantitate(totalMin, 'minut', 'minute')}. Poți sări peste un exercițiu și poți reveni oricând. Rezultatele și explicațiile le vezi la final.`),
        h('button', { class: 'c-btn c-btn--primary c-btn--lg', 'data-testid': 'start', onClick: () => show(0) }, Object.keys(draft.answers).length ? 'Continuă testul' : 'Începe testul'),
      ),
    );
  }

  function renderNav(index) {
    const last = index === total - 1;
    nav.replaceChildren(
      h('button', { class: 'c-btn c-btn--lg', disabled: index === 0, 'data-testid': 'prev', onClick: () => show(index - 1) }, '← Înapoi'),
      last
        ? h('button', { class: 'c-btn c-btn--accent c-btn--lg', 'data-testid': 'finish', onClick: () => finish() }, 'Vezi rezultatele')
        : h('button', { class: 'c-btn c-btn--primary c-btn--lg', 'data-testid': 'next', onClick: () => next(index) }, 'Mai departe →'),
    );
  }

  function next(index) {
    const from = test.exercises[index].level;
    const to = test.exercises[index + 1].level;
    if (from !== to && !draft.seenBreaks.includes(to)) renderBreak(from, to, index + 1);
    else show(index + 1);
  }

  function renderBreak(from, to, nextIndex) {
    renderToken++;
    resetStage();
    draft.seenBreaks.push(to);
    save();
    stage.append(
      h(
        'section',
        { class: 'ex-break anim-bounce-in', 'data-level': to, 'data-testid': 'level-break' },
        mascot('sarbatoreste', `Bravo! Ai terminat nivelul **${levelInfo(from).label}**. Urmează nivelul **${levelInfo(to).label}**.`, { center: true }),
        levelPill(to),
        h('p', { class: 'u-muted' }, 'Ce zici de o mică pauză? Ridică-te, întinde-te ca o veveriță și respiră adânc de trei ori.'),
        h('button', { class: 'c-btn c-btn--primary c-btn--lg', 'data-testid': 'continue', onClick: () => show(nextIndex) }, 'Continuă'),
      ),
    );
  }

  async function finish() {
    const unfinished = test.exercises.filter((ex) => !isDone(ex, draft.answers)).length;
    if (unfinished > 0) {
      const ok = await confirmModal({
        title: 'Mai ai exerciții de lucru',
        text: `${unfinished === 1 ? 'Un exercițiu nu este terminat' : `${cantitate(unfinished, 'exercițiu', 'exerciții')} nu sunt terminate`}. Vrei să vezi rezultatele acum?`,
        confirm: 'Vezi rezultatele',
        cancel: 'Mai lucrez',
      });
      if (!ok) return;
    }
    submit();
  }

  function submit() {
    save();
    const result = scoreTest(test, draft.answers);
    addAttempt({
      id: `${testId}-${Date.now()}`,
      testId,
      testVersion: test.version,
      seed: draft.seed,
      startedAt: draft.startedAt,
      submittedAt: new Date().toISOString(),
      activeMs: draft.activeMs,
      msByExercise: draft.msByExercise,
      answers: draft.answers,
      score: result.score,
      grade: result.grade.code,
      earnedPoints: result.earnedPoints,
      totalPoints: result.totalPoints,
      levels: Object.fromEntries(Object.entries(result.levels).map(([k, v]) => [k, { fraction: v.fraction, star: v.star }])),
      concepts: result.concepts,
      exercises: Object.fromEntries(Object.entries(result.exercises).map(([k, v]) => [k, { fraction: v.fraction, points: v.points }])),
      feeling: null,
      secondChance: {},
    });
    submitted = true;
    clearInterval(timer);
    clearDraft(testId);
    location.hash = `#/rezultate/${testId}`;
  }

  if (new URLSearchParams(location.search).has('debug')) {
    window.__dbg = {
      test,
      fillCorrect() {
        for (const ex of test.exercises) {
          draft.answers[ex.id] = Object.fromEntries(ex.parts.map((p) => [p.id, getLogic(p.type).solution(p)]));
        }
        save();
        return show(Math.max(draft.current, 0));
      },
      fillEmpty() {
        draft.answers = {};
        save();
        return show(Math.max(draft.current, 0));
      },
      answers: () => JSON.parse(JSON.stringify(draft.answers)),
      current: () => draft.current,
      goto: (i) => show(i),
      submit,
      finish,
    };
  }

  await show(draft.current);

  return () => {
    clearInterval(timer);
    save();
    controller?.destroy();
    delete window.__dbg;
  };
}
