// Afișarea unui exercițiu complet (antet, context, părți a/b/c), folosită de player, revizuire și atelier.

import { h } from '../core/dom.js';
import { md } from '../core/markup.js';
import { getLogic, loadView } from '../core/registry.js';
import { hashString } from '../core/rng.js';
import { emojiHTML } from '../visuals/emoji.js';
import { hasVisual, visualSVG } from '../visuals/index.js';
import { levelPill } from './ui.js';

const LETTERS = 'abcdefgh';

const placeholderView = {
  mount(el, part) {
    el.append(h('p', { class: 'c-callout c-callout--warn' }, `Interfața pentru tipul „${part.type}” este în lucru.`));
    return { get: () => null, set() {}, mode() {}, showResult() {}, destroy() {} };
  },
};

/**
 * mountExercise(host, exercise, { number, answers, onChange(partId, answer), seed, mode })
 * → { get(), set(answers), mode(m), showResults(evaluation), showSolution(), destroy() }
 */
export async function mountExercise(host, exercise, { number, answers = {}, onChange, seed = 1, mode = 'solve' } = {}) {
  const card = h('article', { class: 'ex-card anim-fade-up', 'data-level': exercise.level, 'data-testid': `exercise-${exercise.id}` });
  card.append(
    h(
      'header',
      { class: 'ex-head' },
      number ? h('span', { class: 'ex-num', 'aria-hidden': 'true' }, number) : null,
      h('h2', { class: 'ex-title' }, number ? h('span', { class: 'u-visually-hidden' }, `Exercițiul ${number}: `) : null, exercise.title),
      levelPill(exercise.level),
    ),
  );

  if (exercise.context) {
    const visual = exercise.context.visual && hasVisual(exercise.context.visual.v) ? visualSVG(exercise.context.visual) : null;
    card.append(
      h(
        'div',
        { class: 'ex-context' },
        visual ? h('div', { class: 'ex-context__visual', html: visual }) : null,
        exercise.context.text ? h('p', { class: 'ex-context__text', html: md(exercise.context.text) }) : null,
      ),
    );
  }

  const current = {};
  const controllers = {};
  const multi = exercise.parts.length > 1;

  for (const [i, part] of exercise.parts.entries()) {
    const view = await loadView(part.type).catch((err) => {
      console.warn(`Tipul „${part.type}” nu are încă interfață:`, err.message);
      return placeholderView;
    });
    const body = h('div', { class: 'ex-part__body', 'data-type': part.type });
    const howto = view.howto?.(part);
    card.append(
      h(
        'section',
        { class: 'ex-part', 'data-testid': `part-${exercise.id}-${part.id}` },
        part.prompt
          ? h('p', { class: 'ex-prompt' }, multi ? h('span', { class: 'ex-part__letter' }, `${LETTERS[i]})`) : null, h('span', { html: md(part.prompt) }))
          : null,
        howto ? h('p', { class: 'ex-howto', html: `${emojiHTML('deget')} ${howto}` }) : null,
        body,
      ),
    );
    current[part.id] = answers?.[part.id] ?? getLogic(part.type).empty(part);
    controllers[part.id] = view.mount(body, part, {
      seed: hashString(`${seed}:${exercise.id}:${part.id}`),
      onChange: (ans) => {
        current[part.id] = ans;
        onChange?.(part.id, ans);
      },
    });
    if (answers?.[part.id] !== undefined && answers[part.id] !== null) controllers[part.id].set(answers[part.id]);
    controllers[part.id].mode(mode);
  }

  host.append(card);

  return {
    el: card,
    get: () => ({ ...current }),
    set(all = {}) {
      for (const part of exercise.parts) {
        current[part.id] = all[part.id] ?? getLogic(part.type).empty(part);
        controllers[part.id].set(current[part.id]);
      }
    },
    mode(m) {
      for (const c of Object.values(controllers)) c.mode(m);
    },
    showResults(evaluation) {
      for (const part of exercise.parts) controllers[part.id].showResult(evaluation.parts[part.id]);
    },
    showSolution() {
      for (const part of exercise.parts) {
        const logic = getLogic(part.type);
        const solution = logic.solution(part);
        current[part.id] = solution;
        controllers[part.id].set(solution);
        controllers[part.id].mode('solution');
        controllers[part.id].showResult(logic.evaluate(part, solution));
      }
    },
    destroy() {
      for (const c of Object.values(controllers)) c.destroy?.();
    },
  };
}
