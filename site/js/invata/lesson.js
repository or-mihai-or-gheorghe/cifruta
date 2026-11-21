// Învață: cadrul unei lecții. Cifruța spune în balon indicația, provocarea curentă și „Bravo!”; widgetul stă în scenă, iar
// provocările se verifică doar la commit (degetul ridicat, o tastă, o atingere). Calculul se anunță într-o regiune `role="status"`.
// Fără cronometre: copilul trece la provocarea următoare cu „Mai departe”. La final, „Ce am aflat” și lecția următoare.

import { h, pop } from '../core/dom.js';
import { md, plain } from '../core/markup.js';
import { play } from '../core/sound.js';
import { backLink, confetti } from '../components/ui.js';
import { emojiHTML } from '../visuals/emoji.js';
import { visualLabel, visualSVG } from '../visuals/index.js';
import { matches, paramsOf, pickAnswer, pickCorrect, search, solutionKey, widgetOf } from './logic.js';
import { markTask } from './progress.js';
import { VIEWS } from './registry.js';
import { keepMath } from './text.js';

/** O variantă a unei alegeri: un desen din bancă, o fracție („2/3”) sau un număr. */
function optionHTML(option) {
  // desenul se dimensionează prin container (.v-svg are width: 100% în stratul visuals, care câștigă)
  if (option && typeof option === 'object' && option.v) return `<span class="iv-option__art">${visualSVG(option)}</span>`;
  if (typeof option === 'string' && /^\d+\/\d+$/.test(option)) return md(`{{f:${option}}}`);
  return md(String(option));
}

export async function mountLesson(host, { chapter, lesson, index }) {
  const W = widgetOf(lesson);
  const params = paramsOf(lesson);
  const tasks = lesson.tasks;
  let state = W.initial(params);
  let current = 0;
  let phase = 'task'; // task → won (Bravo) → task … → done (Ce am aflat)
  let found = new Map(); // soluțiile găsite la `collect`: cheie → calculul arătat
  let hint = '';
  let already = false; // provocarea era deja îndeplinită când a apărut

  const mascotArt = h('div', { class: 'c-mascot__art anim-float', 'aria-hidden': 'true' });
  const bubble = h('div', { class: 'c-bubble iv-bubble', 'data-testid': 'iv-bubble' });
  const dots = h('ol', { class: 'iv-dots', 'data-testid': 'iv-dots' });
  const status = h('p', { class: 'u-visually-hidden', role: 'status', 'data-testid': 'iv-status' });
  const stage = h('div', { class: 'iv-stage', 'data-testid': 'iv-stage' });
  /** Regiunea de stare: calculul după un gest, dar și indiciul, „Bravo!” și provocarea nouă. */
  const say = (text) => {
    status.textContent = text;
  };
  const prev = chapter.lessons[index - 1];
  const next = chapter.lessons[index + 1];
  const link = (l, dir) => h('a', { class: `iv-lesson__link iv-lesson__link--${dir}`, href: `#/invata/${chapter.id}/${l.id}`, 'data-testid': `iv-${dir}` }, dir === 'prev' ? `← ${l.title}` : `${l.title} →`);
  const root = h(
    'div',
    { class: 'l-container iv-lesson', 'data-testid': `iv-lesson-${lesson.id}` },
    h('div', { class: 'iv-lesson__head' }, backLink(`#/invata/${chapter.id}`, chapter.title), h('span', { class: 'iv-lesson__count' }, `Lecția ${index + 1} din ${chapter.lessons.length}`)),
    h('h1', { class: 'iv-lesson__title' }, h('span', { class: 'iv-lesson__icon', 'aria-hidden': 'true', html: emojiHTML(lesson.icon) }), lesson.title),
    h('div', { class: 'iv-lesson__body' }, h('div', { class: 'iv-lesson__guide' }, h('div', { class: 'c-mascot iv-guide' }, mascotArt, bubble)), stage),
    status,
    h('nav', { class: 'iv-lesson__nav', 'aria-label': 'Lecțiile capitolului' }, prev ? link(prev, 'prev') : h('span'), next ? link(next, 'next') : h('span')),
  );
  host.append(root);

  const hiddenNow = () => (phase === 'task' ? (tasks[current].hide ?? []) : []);
  const setMood = (mood) => {
    mascotArt.innerHTML = visualSVG({ v: 'mascot', mood });
  };

  function dispatch(action, { commit = true } = {}) {
    const nextState = W.apply(params, state, action);
    if (JSON.stringify(nextState) !== JSON.stringify(state)) {
      state = nextState;
      view.render(state, { hidden: hiddenNow() });
    }
    if (commit) {
      say(W.texts(params, state, hiddenNow()).spoken);
      check();
    }
  }

  const view = (await VIEWS[lesson.widget.w]()).mount(stage, params, { logic: W, dispatch });
  view.render(state, { hidden: hiddenNow() });

  /** Provocarea curentă e îndeplinită de starea de acum? (doar la commit, ca să nu se rezolve din greșeală în timpul tragerii) */
  function check() {
    if (phase !== 'task') return;
    const t = tasks[current];
    const d = W.derive(params, state);
    if (t.want && matches(t.want, d)) return win();
    if (t.collect) collect(d);
  }

  function collect(d) {
    const t = tasks[current];
    if (!matches(t.collect, d)) return;
    const key = solutionKey(t, d);
    if (found.has(key)) return;
    found.set(key, W.texts(params, state).equation);
    play('place');
    if (found.size >= t.need) win();
    else paintTask(true);
  }

  function win() {
    const t = tasks[current];
    markTask(chapter, lesson, t.id);
    phase = current === tasks.length - 1 ? 'done' : 'won';
    view.render(state, { hidden: [] });
    setMood('sarbatoreste');
    if (phase === 'done') {
      play('level');
      confetti({ count: 50 });
    } else play('yes');
    paint();
    say(phase === 'done' ? 'Bravo! Ai terminat lecția.' : `Bravo! ${plain(wonText())}`);
    bubble.querySelector('[data-focus]')?.focus({ preventScroll: true });
  }

  /** Ce se spune la „Bravo!”: la o alegere, răspunsul ales; altfel, calculul din desen. */
  function wonText() {
    const t = tasks[current];
    if (t.pick) return pickAnswer(t);
    const w = W.texts(params, state);
    return w.reading ? `${w.reading}: ${w.equation}` : w.equation;
  }


  function choose(i, button) {
    if (phase !== 'task') return;
    if (pickCorrect(tasks[current]).includes(i)) {
      button.classList.add('is-correct');
      return win();
    }
    button.classList.add('is-wrong');
    button.disabled = true;
    hint = tasks[current].hint ?? 'Încă nu. Mai încearcă!';
    play('no');
    setMood('incurajeaza');
    paintTask();
    say(plain(hint));
    // butonul apăsat s-a stins: focusul trece pe prima variantă rămasă, nu cade pe pagină
    bubble.querySelector('.iv-option:not([disabled])')?.focus({ preventScroll: true });
  }

  function nextTask() {
    current += 1;
    phase = 'task';
    found = new Map();
    hint = '';
    already = false;
    setMood('vesela');
    view.render(state, { hidden: hiddenNow() });
    paint();
    const t = tasks[current];
    const d = W.derive(params, state);
    // desenul îndeplinește deja provocarea (copilul a făcut-o înainte): „Bravo!”, fără alt gest
    if (t.want && matches(t.want, d)) {
      already = true;
      return win();
    }
    // la „Găsește toate…”, dreptunghiul de pe ecran contează deja, dacă e o soluție
    if (t.collect && matches(t.collect, d)) {
      found.set(solutionKey(t, d), W.texts(params, state).equation);
      paintTask();
    }
    say(plain(t.ask));
    bubble.querySelector('[data-testid=iv-ask]')?.focus({ preventScroll: true });
  }

  /** „Încă o dată”: lecția reîncepe de la desenul de la început (altfel prima provocare ar fi deja rezolvată). */
  function restart() {
    state = W.initial(params);
    view.render(state, { hidden: [] });
    current = -1;
    nextTask();
  }

  // ——— balonul ——— (replaceChildren ar scrie „null” pentru null: lista se filtrează)
  const fill = (...nodes) => bubble.replaceChildren(...nodes.filter(Boolean));

  function paintTask(popLast = false) {
    const t = tasks[current];
    const parts = [
      // indicația Cifruței (cum se folosește desenul) stă deasupra primei provocări
      current === 0 ? h('p', { class: 'iv-intro', 'data-testid': 'iv-intro', html: md(keepMath(lesson.intro)) }) : null,
      dots,
      h('p', { class: 'iv-ask', 'data-testid': 'iv-ask', tabindex: '-1', html: md(keepMath(t.ask)) }),
    ];
    if (t.collect) {
      const chips = [...found.values()].map((text) => h('li', { class: 'iv-found is-found' }, `${text} ✓`));
      for (let i = found.size; i < t.need; i++) chips.push(h('li', { class: 'iv-found' }, '?'));
      parts.push(h('ul', { class: 'iv-founds', 'data-testid': 'iv-founds', 'aria-label': `Găsite: ${found.size} din ${t.need}` }, chips));
      if (popLast && found.size) requestAnimationFrame(() => pop(bubble.querySelectorAll('.iv-found.is-found')[found.size - 1]));
    }
    // desenul despre care întreabă o alegere („Ce fracție e colorată?”)
    if (t.show) parts.push(h('div', { class: 'iv-show', 'aria-hidden': 'true', html: visualSVG(t.show) }), h('p', { class: 'u-visually-hidden' }, visualLabel(t.show)));
    if (t.pick) {
      const options = h(
        'div',
        { class: 'iv-options', role: 'group', 'aria-label': 'Variantele' },
        t.pick.map((option, i) => {
          const b = h('button', { type: 'button', class: `c-btn iv-option${option?.v ? ' iv-option--art' : ''}`, 'data-testid': `iv-option-${i}`, html: optionHTML(option) });
          b.addEventListener('click', () => choose(i, b));
          return b;
        }),
      );
      // variantele deja încercate rămân stinse
      const old = bubble.querySelectorAll('.iv-option');
      old.forEach((b, i) => {
        if (b.disabled) {
          options.children[i].disabled = true;
          options.children[i].classList.add('is-wrong');
        }
      });
      parts.push(options);
    }
    if (hint) parts.push(h('p', { class: 'iv-hint', 'data-testid': 'iv-hint', html: md(keepMath(hint)) }));
    fill(...parts);
  }

  function paintWon() {
    const t = W.texts(params, state);
    const pick = Boolean(tasks[current].pick);
    fill(
      h('p', { class: 'iv-bravo', 'data-testid': 'iv-bravo' }, 'Bravo!'),
      already ? h('p', { class: 'iv-intro' }, 'Ai făcut-o deja, înainte să ți-o cer.') : null,
      // la o alegere, răspunsul ales; altfel, calculul din desen (text simplu sau mini-markup, la fracții)
      h('p', { class: 'iv-ask', 'data-testid': 'iv-won-text', html: md(keepMath(wonText())) }),
      !pick && t.extra ? h('p', { class: 'iv-ask' }, t.extra) : null,
      h('button', { type: 'button', class: 'c-btn c-btn--primary', 'data-testid': 'iv-continue', 'data-focus': '', onClick: nextTask }, 'Mai departe →'),
    );
  }

  function paintDone() {
    fill(
      h('p', { class: 'iv-bravo', 'data-testid': 'iv-done' }, 'Ai terminat lecția!'),
      h('p', { class: 'iv-notes__title' }, 'Ce am aflat'),
      h('ul', { class: 'iv-notes', 'data-testid': 'iv-notes' }, lesson.notes.map((n) => h('li', { html: md(keepMath(n)) }))),
      h(
        'div',
        { class: 'iv-bubble__actions' },
        next
          ? h('a', { class: 'c-btn c-btn--primary', href: `#/invata/${chapter.id}/${next.id}`, 'data-testid': 'iv-next-lesson', 'data-focus': '' }, `Lecția următoare: ${next.title}`)
          : h('a', { class: 'c-btn c-btn--primary', href: `#/invata/${chapter.id}`, 'data-testid': 'iv-chapter-end', 'data-focus': '' }, `Înapoi la ${chapter.title}`),
        h('button', { type: 'button', class: 'c-btn', 'data-testid': 'iv-again', onClick: restart }, 'Încă o dată'),
      ),
    );
  }

  function paintDots() {
    dots.setAttribute('aria-label', `Provocarea ${Math.min(current + 1, tasks.length)} din ${tasks.length}`);
    dots.setAttribute('role', 'img');
    dots.replaceChildren(
      ...tasks.map((t, i) => {
        const done = i < current || (i === current && phase !== 'task');
        return h('li', { class: `iv-dot${done ? ' is-done' : ''}${i === current && phase === 'task' ? ' is-current' : ''}`, 'aria-hidden': 'true' }, done ? '✓' : String(i + 1));
      }),
    );
  }

  function paint() {
    paintDots();
    if (phase === 'task') paintTask();
    else if (phase === 'won') paintWon();
    else paintDone();
  }

  setMood('vesela');
  paint();
  say(`${plain(lesson.intro)} ${plain(tasks[0].ask)}`);

  return {
    /** Pentru E2E (?debug=1): doar citește. */
    debug: {
      state: () => state,
      derived: () => W.derive(params, state),
      task: () => ({ index: current, id: tasks[current]?.id, phase, found: [...found.keys()], hide: phase === 'task' ? (tasks[current]?.hide ?? []) : [] }),
      /** Starea-țintă cea mai apropiată pentru provocarea curentă (la `collect`, o soluție încă negăsită); la `pick`, locul corect. */
      solution() {
        const t = tasks[current];
        if (t.pick) return { pick: pickCorrect(t)[0] };
        const ok = t.want ? (d) => matches(t.want, d) : (d) => matches(t.collect, d) && !found.has(solutionKey(t, d));
        return search(W, params, state, ok);
      },
      controls: () => W.controls(params, state).map((c) => c.id),
    },
    destroy() {
      view.destroy();
      root.remove();
    },
  };
}
