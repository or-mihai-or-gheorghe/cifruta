// Playerul: un exercițiu pe ecran, harta cu buline pe niveluri, ecrane între niveluri, ciornă salvată automat.

import config from '../../data/scoring.js';
import { clear, h, pop } from '../core/dom.js';
import { findTest, loadTest } from '../core/loader.js';
import { getLogic } from '../core/registry.js';
import { cantitate } from '../core/ro.js';
import { newSeed } from '../core/rng.js';
import { play } from '../core/sound.js';
import { progressOf, scoreTest } from '../core/scoring.js';
import { addAttempt, clearDraft, getDraft, saveDraft } from '../core/storage.js';
import { mountExercise } from '../components/exercise.js';
import { confirmModal } from '../components/modal.js';
import { art, backLink, confetti, levelInfo, levelPill, mascot } from '../components/ui.js';

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
  const finishTop = h('button', { class: 'c-btn c-btn--accent ex-player__finish', 'data-testid': 'finish-top', onClick: () => finish() }, 'Vezi rezultatele');

  // cronometrul discret: numără invers minutele estimate, doar cât timp copilul lucrează la un exercițiu; la 0 nu trimite nimic
  const totalMs = totalMin * 60000;
  const RING = 97.4; // lungimea cercului cu raza 15.5 din inel
  const countTime = h('span', { class: 'c-countdown__time' });
  const countNote = h('span', { class: 'c-countdown__note u-small' });
  const countLive = h('span', { class: 'u-visually-hidden', 'aria-live': 'polite' });
  const countdown = h(
    'div',
    { class: 'c-countdown', role: 'timer', 'aria-label': `Timp rămas din cele ${totalMin} de minute`, 'data-testid': 'countdown', hidden: true },
    h('span', { class: 'c-countdown__ring', 'aria-hidden': 'true', html: '<svg viewBox="0 0 36 36"><circle class="c-countdown__track" cx="18" cy="18" r="15.5"/><circle class="c-countdown__fill" cx="18" cy="18" r="15.5"/></svg>' }),
    countTime,
    countNote,
    countLive,
  );
  const countFill = countdown.querySelector('.c-countdown__fill');
  let lastMinute = -1;
  let warned = false; // „Mai ai 5 minute” și „timpul a trecut” se anunță o singură dată, exact la prag
  let ended = false;
  function paintCountdown() {
    const remaining = Math.max(0, totalMs - draft.activeMs);
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    countTime.textContent = `${m}:${String(s).padStart(2, '0')}`;
    countFill.style.strokeDashoffset = (RING * (1 - remaining / totalMs)).toFixed(2);
    const over = remaining === 0;
    const low = !over && remaining <= 5 * 60000;
    countdown.classList.toggle('is-low', low);
    countdown.classList.toggle('is-over', over);
    countNote.textContent = over ? 'Timpul a trecut, dar poți continua.' : '';
    const first = lastMinute < 0; // la prima afișare (sau la reluare) pragurile deja trecute nu se mai anunță
    if (m !== lastMinute) {
      if (!first) pop(countTime, 'anim-tick');
      lastMinute = m;
    }
    if ((low || over) && !warned) {
      warned = true;
      if (!first) {
        countLive.textContent = 'Mai ai 5 minute.';
        pop(countdown, 'anim-pop'); // o singură reacție, apoi doar culoarea se schimbă
      }
    }
    if (over && !ended) {
      ended = true;
      if (!first) countLive.textContent = 'Timpul estimat a trecut. Poți continua în liniște.';
    }
  }
  container.append(
    h(
      'div',
      { class: 'l-container ex-player', 'data-theme': test.theme },
      h(
        'div',
        { class: 'ex-player__top' },
        h('div', { class: 'l-stack l-stack--sm' }, backLink(`#/sectiune/${entry.section.id}`, entry.section.title), h('h1', { class: 'ex-player__title' }, test.title)),
        finishTop,
      ),
      h('div', { class: 'ex-player__bar' }, map, countdown),
      stage,
      nav,
    ),
  );

  let controller = null;
  let renderToken = 0;

  // se numără doar timpul petrecut pe exerciții: nu intro-ul, pauza dintre niveluri sau fereastra de confirmare
  const timer = setInterval(() => {
    if (document.visibilityState !== 'visible' || !controller || document.querySelector('dialog[open]')) return;
    draft.activeMs += 1000;
    const ex = test.exercises[draft.current];
    if (ex) draft.msByExercise[ex.id] = (draft.msByExercise[ex.id] ?? 0) + 1000;
    if (draft.activeMs % 5000 === 0) save();
    paintCountdown();
  }, 1000);

  // bulinele se creează o dată și se actualizează pe loc (focusul de pe o bulină nu se pierde)
  const dots = test.exercises.map((ex, i) => h('button', { type: 'button', class: 'c-progress__dot', 'data-testid': `dot-${i + 1}`, onClick: () => show(i) }, i + 1));
  map.append(
    ...config.levels
      .map((lvl) => {
        const own = dots.filter((_, i) => test.exercises[i].level === lvl.id);
        return own.length ? h('div', { class: 'c-progress__group', 'data-level': lvl.id, title: lvl.label }, own) : null;
      })
      .filter(Boolean),
  );

  function renderMap() {
    for (const [i, ex] of test.exercises.entries()) {
      const p = progressOf(ex, draft.answers[ex.id]);
      const done = p.done >= p.count;
      const dot = dots[i];
      dot.classList.toggle('is-done', done);
      dot.classList.toggle('is-partial', p.done > 0 && !done);
      dot.classList.toggle('is-current', i === draft.current);
      dot.setAttribute('aria-label', `Exercițiul ${i + 1}, nivel ${levelInfo(ex.level).label}${done ? ', terminat' : ''}`);
      if (i === draft.current) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    }
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
    finishTop.hidden = index < 0; // pe intro nu are sens „Vezi rezultatele”
    countdown.hidden = index < 0;
    if (index >= 0) paintCountdown();
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
        const wasDone = isDone(ex, draft.answers);
        (draft.answers[ex.id] ??= {})[partId] = answer;
        save();
        renderMap();
        renderReady(index);
        if (!wasDone && isDone(ex, draft.answers)) play('done');
      },
    });
    if (token !== renderToken || !container.isConnected) return ctl.destroy();
    controller = ctl;
    stage.append(host);
    renderNav(index);
    // cititoarele de ecran anunță exercițiul nou; Tab continuă din exercițiu
    const title = ctl.el.querySelector('.ex-title');
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
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
    renderReady(index);
  }

  // când exercițiul e complet, butonul de mers mai departe se „anunță” cu o mică săltare
  function renderReady(index) {
    nav.lastElementChild?.classList.toggle('is-ready', isDone(test.exercises[index], draft.answers));
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
    // sărbătorim doar un nivel chiar terminat; cu exerciții sărite, pauza e neutră (fără confetti și sunet)
    const left = test.exercises.filter((ex) => ex.level === from && !isDone(ex, draft.answers)).length;
    const bravo = left === 0;
    const icon = art({ v: 'level-icon', level: to, decorative: true }, { cls: `ex-break__icon${bravo ? ' anim-bounce-in' : ''}` });
    if (bravo) icon.style.animationDelay = '200ms';
    const leftText = left === 1 ? 'Un exercițiu a rămas neterminat' : `${cantitate(left, 'exercițiu', 'exerciții')} au rămas neterminate`;
    stage.append(
      h(
        'section',
        { class: `ex-break ${bravo ? 'anim-bounce-in' : 'anim-fade-up'}`, 'data-level': to, 'data-variant': bravo ? 'bravo' : 'neutru', 'data-testid': 'level-break' },
        bravo
          ? mascot('sarbatoreste', `Bravo! Ai terminat nivelul **${levelInfo(from).label}**. Urmează nivelul **${levelInfo(to).label}**.`, { center: true })
          : mascot('vesela', `Ai ajuns la capătul nivelului **${levelInfo(from).label}**. Urmează nivelul **${levelInfo(to).label}**.`, { center: true }),
        icon,
        levelPill(to),
        bravo
          ? h('p', { class: 'u-muted' }, 'Ce zici de o mică pauză? Ridică-te, întinde-te ca o veveriță și respiră adânc de trei ori.')
          : h('p', { class: 'u-muted' }, `${leftText} la nivelul ${levelInfo(from).label}. Poți reveni oricând, din bulinele de sus.`),
        h('button', { class: 'c-btn c-btn--primary c-btn--lg', 'data-testid': 'continue', onClick: () => show(nextIndex) }, 'Continuă'),
      ),
    );
    if (bravo) {
      confetti({ count: 24 });
      play('level');
    }
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
    const saved = addAttempt({
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
    submitted = saved; // fără salvare, ciorna rămâne: rezultatul se vede acum, din memorie, dar nu intră în istoric
    clearInterval(timer);
    if (saved) clearDraft(testId);
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
      elapse(ms) {
        draft.activeMs += ms;
        save();
        paintCountdown();
      },
      current: () => draft.current,
      goto: (i) => show(i),
      resetBreaks() {
        draft.seenBreaks = [];
        save();
      },
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
