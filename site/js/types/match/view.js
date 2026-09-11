// match — unește cu săgeți: atinge un element din stânga, apoi perechea lui din dreapta (sau trage).

import { createDnd } from '../../core/dnd.js';
import { h } from '../../core/dom.js';
import { shuffled } from '../../core/rng.js';
import { feedbackBox, isLocked, itemFace, setState } from '../_view.js';

const PAIR_COLORS = ['#5b5bd6', '#e07b39', '#1b8fcb', '#b04fa8', '#2e9e44', '#a86b3c', '#35339a', '#d99a00'];

export default {
  howto: () => 'Atinge un element din stânga, apoi perechea lui din dreapta. Atinge din nou ca să schimbi.',

  mount(el, part, ctx) {
    let answer = {};
    let mode = 'solve';
    let result = null;
    const leftOrder = part.shuffleLeft ? shuffled(part.left.map((l) => l.id), ctx.seed) : part.left.map((l) => l.id);
    const rightOrder = part.shuffle === false ? part.right.map((r) => r.id) : shuffled(part.right.map((r) => r.id), ctx.seed + 3);
    const leftById = Object.fromEntries(part.left.map((l) => [l.id, l]));
    const rightById = Object.fromEntries(part.right.map((r) => [r.id, r]));
    const colorOf = (leftId) => PAIR_COLORS[leftOrder.indexOf(leftId) % PAIR_COLORS.length];

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ex-match__lines');
    svg.setAttribute('aria-hidden', 'true');
    const leftEls = {};
    const rightEls = {};
    const leftCol = h('div', { class: 'ex-match__col' }, leftOrder.map((id) => {
      leftEls[id] = h('button', { type: 'button', class: 'ex-match__item ex-match__item--left ex-drag', 'aria-pressed': 'false', 'data-id': id, 'data-testid': `left-${id}` },
        itemFace(leftById[id]), h('span', { class: 'ex-match__badge', 'aria-hidden': 'true' }));
      return leftEls[id];
    }));
    const rightCol = h('div', { class: 'ex-match__col' }, rightOrder.map((id) => {
      rightEls[id] = h('button', { type: 'button', class: 'ex-match__item ex-match__item--right ex-drop', 'data-id': id, 'data-testid': `right-${id}` },
        h('span', { class: 'ex-match__badges', 'aria-hidden': 'true' }), itemFace(rightById[id]));
      return rightEls[id];
    }));
    const board = h('div', { class: 'ex-match' }, leftCol, rightCol);
    board.prepend(svg);
    const notes = h('div', { class: 'l-stack l-stack--sm' });
    el.append(board, notes);

    function draw() {
      const box = board.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.replaceChildren();
      for (const [l, r] of Object.entries(answer)) {
        const a = leftEls[l]?.getBoundingClientRect();
        const b = rightEls[r]?.getBoundingClientRect();
        if (!a || !b) continue;
        const x1 = a.right - box.left;
        const y1 = a.top + a.height / 2 - box.top;
        const x2 = b.left - box.left;
        const y2 = b.top + b.height / 2 - box.top;
        const state = result?.items.find((i) => i.id === l);
        const color = state ? (state.ok ? 'var(--c-ok)' : 'var(--c-bad)') : colorOf(l);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const mid = (x1 + x2) / 2;
        path.setAttribute('d', `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2 - 8} ${y2}`);
        path.setAttribute('stroke', color);
        path.setAttribute('class', 'ex-match__line');
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        head.setAttribute('d', `M${x2 - 12} ${y2 - 7} L${x2} ${y2} L${x2 - 12} ${y2 + 7} Z`);
        head.setAttribute('fill', color);
        svg.append(path, head);
      }
    }

    function paint() {
      const byRight = {};
      for (const [l, r] of Object.entries(answer)) (byRight[r] ??= []).push(l);
      for (const [id, btn] of Object.entries(leftEls)) {
        const on = Boolean(answer[id]);
        btn.classList.toggle('is-linked', on);
        btn.style.setProperty('--pair', colorOf(id));
        btn.querySelector('.ex-match__badge').textContent = on ? String(leftOrder.indexOf(id) + 1) : '';
      }
      for (const [id, btn] of Object.entries(rightEls)) {
        const links = byRight[id] ?? [];
        btn.classList.toggle('is-linked', links.length > 0);
        btn.querySelector('.ex-match__badges').replaceChildren(
          ...links.map((l) => h('span', { class: 'ex-match__badge', style: { '--pair': colorOf(l) } }, String(leftOrder.indexOf(l) + 1))),
        );
      }
      requestAnimationFrame(draw);
    }

    const dnd = createDnd(board, {
      items: '.ex-drag',
      zones: '.ex-drop',
      locked: () => isLocked(mode),
      onDrop(item, zone) {
        const l = item.dataset.id;
        const r = zone.dataset.id;
        answer = { ...answer };
        if (answer[l] === r) delete answer[l];
        else answer[l] = r;
        paint();
        ctx.onChange(answer);
      },
    });

    const resize = new ResizeObserver(() => draw());
    resize.observe(board);
    document.fonts?.ready.then(draw);
    paint();

    return {
      get: () => answer,
      set(a) {
        answer = { ...(a ?? {}) };
        paint();
      },
      mode(m) {
        mode = m;
        for (const b of [...Object.values(leftEls), ...Object.values(rightEls)]) b.disabled = isLocked(m);
      },
      showResult(res) {
        result = res;
        const messages = [];
        for (const r of res.items) {
          const btn = leftEls[r.id];
          btn.querySelector('.ex-expected')?.remove();
          setState(btn, r.ok ? 'correct' : 'wrong');
          if (!r.ok) btn.append(h('span', { class: 'ex-expected' }, String(rightById[r.expected]?.text ?? r.expected)));
          if (r.feedback) messages.push(r.feedback);
        }
        notes.replaceChildren(...messages.map(feedbackBox));
        draw();
      },
      destroy() {
        resize.disconnect();
        dnd.destroy();
      },
    };
  },
};
