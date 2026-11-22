// Învață: ecuația pas cu pas (vederea). Sus, povestea (dacă e una); dedesubt, rândurile rezolvării, cu locul păstrat de la început ca
// pagina să nu se miște când apare un rând nou: ecuația, rândul după trecerea dincolo de egal, rândul după împărțire și proba (care se
// schimbă cât tragi de glisorul lui x). Sub rânduri, întrebarea pasului și variantele lui, ca butoane; apoi glisorul. Rândurile și
// butoanele sunt conținut (nu desen), deci se citesc; litera x e desenată altfel decât semnul ×.

import { h } from '../../../core/dom.js';
import { emojiHTML } from '../../../visuals/emoji.js';
import { legendNodes, mathNodes } from '../../legend.js';
import { slider } from '../../slider.js';
import { SPAN, choices, prompt } from './logic.js';

const LINES = ['eq', 'moved', 'divided', 'proba'];

export function mount(host, params, { logic, dispatch }) {
  let state = logic.initial(params);
  let step = null; // pasul de acum (câte alegeri bune s-au făcut), ca focusul să treacă pe variantele pasului următor
  const send = (commit) => (v) => dispatch({ set: 'x', value: v }, { commit });
  const xs = slider({ id: 'x', label: 'Cât e x', min: state.lo, max: state.lo + SPAN, count: SPAN + 1, origin: state.lo, value: state.x, tone: 'cols', onInput: send(false), onCommit: send(true) });
  const storyIcon = h('span', { class: 'iv-pasi__icon', 'aria-hidden': 'true' });
  const storyText = h('p', { class: 'iv-pasi__story-text' });
  const story = h('div', { class: 'iv-pasi__story', 'data-testid': 'iv-story' }, storyIcon, storyText);
  const lines = Object.fromEntries(LINES.map((k) => [k, h('p', { class: `iv-pasi__line iv-pasi__line--${k}`, 'data-testid': `iv-line-${k}` })]));
  const art = h('div', { class: 'iv-art iv-pasi__art', 'data-testid': 'iv-pasi' }, story, ...LINES.map((k) => lines[k]));
  const ask = h('p', { class: 'iv-pasi__ask', 'data-testid': 'iv-pasi-ask' });
  const options = h('div', { class: 'iv-pasi__options', role: 'group', 'aria-label': 'Variantele pasului' });
  const eq = h('p', { class: 'iv-eq', 'data-testid': 'iv-eq' });
  const legend = h('p', { class: 'iv-legend', 'data-testid': 'iv-legend' });
  const reading = h('p', { class: 'iv-reading', 'data-testid': 'iv-reading' });
  const extra = h('p', { class: 'iv-extra', 'data-testid': 'iv-extra' });
  const root = h(
    'div',
    { class: 'iv-widget iv-pasi', 'data-testid': 'iv-pasi-widget' },
    h('div', { class: 'iv-head' }, eq, legend),
    h(
      'div',
      { class: 'iv-main' },
      art,
      h('div', { class: 'iv-tools iv-pasi__choices' }, ask, options),
      h('div', { class: 'iv-control' }, h('span', { class: 'iv-control__label iv-f--cols' }, 'Cât e x?'), xs.el),
    ),
    h('div', { class: 'iv-foot' }, h('div', { class: 'iv-text' }, reading, extra)),
  );
  host.append(root);

  function render(next) {
    state = next;
    const hadFocus = root.contains(document.activeElement); // înainte ca butoanele să fie înlocuite
    xs.setScale(state.lo, SPAN + 1);
    xs.setRange(state.lo, state.lo + SPAN);
    xs.set(state.x);

    story.hidden = !state.story;
    if (state.story) {
      storyIcon.innerHTML = emojiHTML(state.story.icon);
      storyText.textContent = state.story.text;
    }
    const t = logic.texts(params, state);
    // fiecare rând își păstrează locul și cât nu s-a făcut (gol, nevăzut), ca nimic să nu sară
    for (const k of LINES) {
      lines[k].replaceChildren(...mathNodes(t.lines[k] ?? ' '));
      lines[k].classList.toggle('is-empty', !t.lines[k]);
    }
    art.dataset.solved = String(logic.derive(params, state).solved);

    // variantele pasului de acum: una greșită rămâne marcată până la alegerea următoare
    const list = choices(state);
    ask.textContent = prompt(state);
    options.replaceChildren(
      ...list.map((c, i) =>
        h('button', { type: 'button', class: `c-btn iv-pasi__option${state.wrong && c.why === state.wrong ? ' is-wrong' : ''}`, 'aria-label': c.say, 'data-testid': `iv-choice-${i}`, onClick: () => dispatch({ choose: i }) }, mathNodes(c.text)),
      ),
    );
    // după o alegere bună, focusul trece pe prima variantă a pasului următor (sau pe glisor, după împărțire)
    const now = [state.written, state.moved, state.divided].filter(Boolean).length;
    if (step !== null && now > step && hadFocus) (options.querySelector('button') ?? xs.el.querySelector('input'))?.focus({ preventScroll: true });
    step = now;

    eq.replaceChildren(...mathNodes(t.equation));
    legend.replaceChildren(...legendNodes(t.legend));
    reading.replaceChildren(...mathNodes(t.reading));
    extra.replaceChildren(...mathNodes(t.extra ?? ''));
  }

  render(state);
  return {
    render,
    destroy() {
      root.remove();
    },
  };
}
