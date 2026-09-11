// mark — atinge (colorează) elementele potrivite; cu paletă: alege întâi culoarea.

import { h } from '../../core/dom.js';
import { md, plain } from '../../core/markup.js';
import { hasVisual, visualSVG } from '../../visuals/index.js';
import { isLocked, itemFace, setState } from '../_view.js';

const SHAPES = ['●', '▲', '■', '◆']; // fiecare culoare din paletă are și o formă, pentru cine nu deosebește culorile

export default {
  howto: (part) => (part.palette ? 'Alege o culoare, apoi atinge elementele. Atinge din nou ca să ștergi culoarea.' : 'Atinge elementele potrivite. Atinge din nou ca să renunți.'),

  mount(el, part, ctx) {
    let mode = 'solve';
    let marked = new Set();
    let colors = {};
    let brush = part.palette?.[0]?.id ?? null;
    const shapeOf = (color) => SHAPES[part.palette.findIndex((p) => p.id === color) % SHAPES.length];
    const labelOf = (color) => plain(part.palette.find((p) => p.id === color)?.label ?? color);

    const palette = part.palette
      ? h('div', { class: 'ex-palette', role: 'radiogroup', 'aria-label': 'Culori' },
          part.palette.map((p) => h('button', {
            type: 'button',
            class: `ex-palette__btn is-color-${p.id}${p.id === brush ? ' is-selected' : ''}`,
            role: 'radio',
            'aria-checked': String(p.id === brush),
            'data-color': p.id,
            'data-testid': `brush-${p.id}`,
            onClick: () => {
              brush = p.id;
              for (const b of palette.children) {
                const on = b.dataset.color === brush;
                b.classList.toggle('is-selected', on);
                b.setAttribute('aria-checked', String(on));
              }
            },
          }, h('span', { class: 'ex-palette__swatch', 'aria-hidden': 'true' }, shapeOf(p.id)), h('span', { html: md(p.label) }))))
      : null;

    const items = {};
    const grid = h('div', { class: `ex-mark${part.palette ? ' ex-mark--palette' : ''}` }, part.items.map((it) => {
      const visual = it.visual ?? (part.itemVisual ? { ...part.itemVisual, n: it.n } : null);
      const face = visual && hasVisual(visual.v)
        ? h('span', { class: 'ex-face' }, h('span', { class: 'ex-face__art', html: visualSVG(visual) }), it.text ? h('span', { class: 'ex-face__text', html: md(it.text) }) : null)
        : itemFace({ ...it, text: it.text ?? it.n });
      items[it.id] = h('button', { type: 'button', class: 'ex-mark__item', 'aria-pressed': 'false', 'data-testid': `mark-${it.id}`, onClick: () => tap(it.id) }, face,
        part.palette ? h('span', { class: 'ex-mark__tag' }) : null);
      return items[it.id];
    }));
    el.append(...[palette, grid].filter(Boolean));

    function tap(id) {
      if (isLocked(mode)) return;
      if (part.palette) {
        colors = { ...colors };
        if (colors[id] === brush) delete colors[id];
        else colors[id] = brush;
        ctx.onChange(colors);
      } else {
        marked.has(id) ? marked.delete(id) : marked.add(id);
        ctx.onChange([...marked]);
      }
      paint();
      items[id].classList.add('anim-pop');
      setTimeout(() => items[id].classList.remove('anim-pop'), 320);
    }

    function paint() {
      for (const [id, btn] of Object.entries(items)) {
        const on = part.palette ? Boolean(colors[id]) : marked.has(id);
        btn.classList.toggle('is-marked', on);
        btn.setAttribute('aria-pressed', String(on));
        for (const p of part.palette ?? []) btn.classList.toggle(`is-color-${p.id}`, colors[id] === p.id);
        if (part.palette) btn.querySelector('.ex-mark__tag').replaceChildren(...(colors[id] ? [h('span', { 'aria-hidden': 'true' }, shapeOf(colors[id])), ` ${labelOf(colors[id])}`] : []));
      }
    }

    return {
      get: () => (part.palette ? colors : [...marked]),
      set(a) {
        if (part.palette) colors = { ...(a ?? {}) };
        else marked = new Set(Array.isArray(a) ? a : []);
        paint();
      },
      mode(m) {
        mode = m;
        for (const b of Object.values(items)) b.disabled = isLocked(m);
        for (const b of palette?.children ?? []) b.disabled = isLocked(m);
      },
      showResult(res) {
        for (const r of res.items) {
          const btn = items[r.id];
          if (part.palette) setState(btn, r.given === null && r.expected === null ? null : r.ok ? 'correct' : 'wrong');
          else if (r.given) setState(btn, r.ok ? 'correct' : 'wrong');
          else setState(btn, r.expected ? 'missed' : null);
        }
      },
      destroy() {},
    };
  },
};
