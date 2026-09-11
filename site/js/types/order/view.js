// order — carduri care se mută: atinge un card, apoi locul unde îl vrei (sau trage-l).

import { createDnd } from '../../core/dnd.js';
import { h } from '../../core/dom.js';
import { plain } from '../../core/markup.js';
import { shuffled } from '../../core/rng.js';
import { hasVisual, visualSVG } from '../../visuals/index.js';
import { isLocked, itemFace, setState } from '../_view.js';
import { isPermutation, keyOf } from './logic.js';

export default {
  howto: () => 'Atinge un card, apoi atinge locul unde vrei să-l muți. Poți și să-l tragi.',

  mount(el, part, ctx) {
    const byId = Object.fromEntries(part.items.map((it) => [it.id, it]));
    const key = keyOf(part);
    let start = shuffled(part.items.map((i) => i.id), ctx.seed);
    if (start.join() === key.join()) start = [...start.slice(1), start[0]];
    let order = [...start];
    let touched = false;
    let mode = 'solve';

    const row = h('div', { class: `ex-order${part.direction ? '' : ' ex-order--names'}`, role: 'list' });
    const hint = h('p', { class: 'ex-order__ends u-small u-muted' });
    if (part.direction) hint.textContent = part.direction === 'asc' ? '← cel mai mic … cel mai mare →' : '← cel mai mare … cel mai mic →';
    const reveal = h('div', { class: 'ex-order__reveal' });
    el.append(hint, row, reveal);

    const cards = {};
    const slots = {}; // elementul de listă care conține cardul
    for (const id of part.items.map((i) => i.id)) {
      const item = byId[id];
      const visual = item.visual ?? (part.itemVisual ? { ...part.itemVisual, n: item.text } : null);
      const face = visual && hasVisual(visual.v)
        ? h('span', { class: 'ex-face' }, h('span', { class: 'ex-face__art', html: visualSVG(visual) }))
        : itemFace({ ...item, tag: undefined });
      cards[id] = h('button', { type: 'button', class: 'ex-order__card ex-drag ex-drop', 'aria-pressed': 'false', 'data-id': id, 'data-testid': `order-${id}` }, face);
      slots[id] = h('div', { class: 'ex-order__slot', role: 'listitem' }, cards[id]);
    }

    const label = () => order.forEach((id, i) => cards[id].setAttribute('aria-label', `${plain(String(byId[id].text ?? id))}, poziția ${i + 1}`));
    const paint = () => {
      row.replaceChildren(...order.map((id) => slots[id]));
      label();
    };
    paint();

    const dnd = createDnd(row, {
      items: '.ex-drag',
      zones: '.ex-drop',
      locked: () => isLocked(mode),
      onDrop(item, zone) {
        const from = order.indexOf(item.dataset.id);
        const to = order.indexOf(zone.dataset.id);
        if (from < 0 || to < 0 || from === to) return;
        const keepFocus = row.contains(document.activeElement);
        order.splice(from, 1);
        order.splice(to, 0, item.dataset.id);
        touched = true;
        // mută doar cardul ales (celelalte rămân pe loc) și păstrează focusul pe el, pentru tastatură
        row.insertBefore(slots[item.dataset.id], slots[order[to + 1]] ?? null);
        label();
        if (keepFocus) item.focus();
        item.classList.add('anim-pop');
        setTimeout(() => item.classList.remove('anim-pop'), 320);
        ctx.onChange([...order]);
      },
    });

    return {
      get: () => (touched ? [...order] : null),
      set(a) {
        if (isPermutation(a, start)) {
          order = [...a];
          touched = true;
        } else {
          order = [...start];
          touched = false;
        }
        paint();
      },
      mode(m) {
        mode = m;
        row.classList.toggle('is-locked', isLocked(m));
        if (isLocked(m)) dnd.cancel();
        for (const c of Object.values(cards)) c.disabled = isLocked(m);
      },
      showResult(res) {
        for (const r of res.items) setState(cards[r.id], res.earned === res.total ? 'correct' : r.ok ? null : 'wrong');
        const correctText = key.map((id) => plain(String(byId[id].text ?? id))).join(part.direction === 'desc' ? ' > ' : part.direction ? ' < ' : ', ');
        const parts = [h('p', {}, h('strong', {}, 'Ordinea corectă: '), correctText)];
        if (part.reveal?.word) {
          parts.push(h('p', { class: 'ex-word', 'aria-label': `Cuvântul secret: ${part.reveal.word}` },
            [...part.reveal.word].map((ch, i) => h('span', { class: 'ex-word__letter anim-flip-in', style: { animationDelay: `${i * 90}ms` } }, ch))));
        }
        reveal.replaceChildren(...parts);
      },
      destroy: () => dnd.destroy(),
    };
  },
};
