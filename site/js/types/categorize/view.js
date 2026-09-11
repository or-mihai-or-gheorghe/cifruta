// categorize — pune fiecare element în coșul potrivit (atinge elementul, apoi coșul; sau trage-l).

import { createDnd } from '../../core/dnd.js';
import { h } from '../../core/dom.js';
import { md, plain } from '../../core/markup.js';
import { shuffled } from '../../core/rng.js';
import { hasVisual, visualSVG } from '../../visuals/index.js';
import { isLocked, itemFace, setState } from '../_view.js';

export default {
  howto: () => 'Atinge un element, apoi atinge coșul în care se potrivește. Poți și să-l tragi.',

  mount(el, part, ctx) {
    let answer = {};
    let mode = 'solve';
    const order = part.shuffle === false ? part.items.map((i) => i.id) : shuffled(part.items.map((i) => i.id), ctx.seed);
    const byId = Object.fromEntries(part.items.map((i) => [i.id, i]));

    // Enter/Space pe coș sau pe tavă pune elementul ridicat; tastele apăsate pe un element din coș îi aparțin elementului
    const pressable = (node) => node.addEventListener('keydown', (e) => {
      if (e.target !== node || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      node.click();
    });
    const tray = h('div', { class: 'ex-tray ex-drop', 'data-bin': '', role: 'button', tabindex: '0', 'aria-label': 'Elemente de sortat. Pune aici un element ca să-l scoți din coș.', 'data-testid': 'tray' });
    pressable(tray);
    const bins = {};
    const binList = h(
      'div',
      { class: 'ex-bins' },
      part.bins.map((b) => {
        const content = h('div', { class: 'ex-bin__items' });
        const bin = h(
          'div',
          { class: 'ex-bin ex-drop', 'data-bin': b.id, role: 'button', tabindex: '0', 'aria-label': `Coșul: ${b.label}`, 'data-testid': `bin-${b.id}` },
          h('div', { class: 'ex-bin__head' }, b.visual && hasVisual(b.visual.v) ? h('span', { class: 'ex-bin__art', html: visualSVG(b.visual) }) : null, h('span', { html: md(b.label) })),
          content,
        );
        pressable(bin);
        bins[b.id] = { el: bin, content };
        return bin;
      }),
    );
    el.append(tray, binList);

    const chips = {};
    for (const id of order) {
      chips[id] = h('button', { type: 'button', class: 'ex-chip ex-drag', 'aria-pressed': 'false', 'data-id': id, 'data-testid': `item-${id}` }, itemFace(byId[id]));
    }

    function paint() {
      tray.replaceChildren(...order.filter((id) => !answer[id]).map((id) => chips[id]));
      if (!tray.children.length) tray.append(h('span', { class: 'ex-tray__empty' }, 'Toate elementele sunt în coșuri.'));
      for (const b of part.bins) bins[b.id].content.replaceChildren(...order.filter((id) => answer[id] === b.id).map((id) => chips[id]));
    }
    paint();

    const dnd = createDnd(el, {
      items: '.ex-drag',
      zones: '.ex-drop',
      locked: () => isLocked(mode),
      onDrop(item, zone) {
        const id = item.dataset.id;
        const bin = zone.closest('[data-bin]')?.dataset.bin ?? '';
        if (bin) answer = { ...answer, [id]: bin };
        else {
          answer = { ...answer };
          delete answer[id];
        }
        paint();
        ctx.onChange(answer);
      },
    });

    return {
      get: () => answer,
      set(a) {
        answer = { ...(a ?? {}) };
        paint();
      },
      mode(m) {
        mode = m;
        el.classList.toggle('is-locked', isLocked(m));
        if (isLocked(m)) dnd.cancel();
        tray.tabIndex = isLocked(m) ? -1 : 0;
        for (const b of Object.values(bins)) b.el.tabIndex = isLocked(m) ? -1 : 0;
        for (const c of Object.values(chips)) c.disabled = isLocked(m);
      },
      showResult(res) {
        for (const r of res.items) {
          const chip = chips[r.id];
          chip.querySelector('.ex-chip__expected')?.remove();
          setState(chip, r.given === null ? 'wrong' : r.ok ? 'correct' : 'wrong');
          if (!r.ok) {
            const label = part.bins.find((b) => b.id === r.expected)?.label ?? r.expected;
            chip.append(h('span', { class: 'ex-chip__expected' }, `→ ${plain(label)}`));
          }
        }
      },
      destroy: () => dnd.destroy(),
    };
  },
};
