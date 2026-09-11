// money — alege portofelul, apoi atinge bancnotele ca să le pui; atinge o bancnotă din portofel ca s-o scoți.

import { h } from '../../core/dom.js';
import { md } from '../../core/markup.js';
import { cuDe } from '../../core/ro.js';
import { moneySum } from '../../core/rules.js';
import { visualSVG } from '../../visuals/index.js';
import { feedbackBox, isLocked, setState } from '../_view.js';

export default {
  howto: (part) =>
    part.items.length > 1
      ? 'Alege un portofel, apoi atinge bancnotele de mai jos. Atinge o bancnotă din portofel ca s-o scoți.'
      : 'Atinge bancnotele de mai jos ca să le pui în portofel. Atinge o bancnotă din portofel ca s-o scoți.',

  mount(el, part, ctx) {
    let answer = {};
    let mode = 'solve';
    let active = part.items[0].id;
    const wallets = {};

    const walletList = h('div', { class: 'ex-wallets' }, part.items.map((item) => {
      const pieces = h('div', { class: 'ex-wallet__pieces' });
      const sum = h('span', { class: 'ex-wallet__sum' });
      const wallet = h(
        'div',
        { class: 'ex-wallet', role: 'button', tabindex: '0', 'aria-label': `Portofel: ${item.label}`, 'data-testid': `wallet-${item.id}` },
        h('div', { class: 'ex-wallet__head' }, h('span', { class: 'ex-wallet__label', html: md(item.label) }), sum),
        pieces,
        h('div', { class: 'ex-wallet__note' }),
      );
      wallet.addEventListener('click', (e) => {
        if (e.target.closest('.ex-piece')) return;
        activate(item.id);
      });
      wallet.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(item.id); } });
      wallets[item.id] = { wallet, pieces, sum };
      return wallet;
    }));

    const tray = h('div', { class: 'ex-money-tray', 'aria-label': 'Bancnote' }, part.allowed.map((value) =>
      h('button', {
        type: 'button',
        class: 'ex-note',
        'aria-label': `adaugă ${cuDe(value, 'lei')}`,
        'data-testid': `note-${value}`,
        html: visualSVG({ v: 'banknote', value }),
        onClick: () => add(value),
      })));

    el.append(walletList, h('p', { class: 'ex-money-tray__title u-small u-muted' }, 'Bancnote:'), tray);

    function activate(id) {
      if (isLocked(mode)) return;
      active = id;
      paint();
    }

    function add(value) {
      if (isLocked(mode)) return;
      const combo = { ...(answer[active] ?? {}) };
      combo[value] = (combo[value] ?? 0) + 1;
      answer = { ...answer, [active]: combo };
      paint();
      ctx.onChange(answer);
    }

    function remove(id, value) {
      if (isLocked(mode)) return;
      const combo = { ...(answer[id] ?? {}) };
      combo[value] -= 1;
      if (combo[value] <= 0) delete combo[value];
      answer = { ...answer, [id]: combo };
      active = id;
      paint();
      ctx.onChange(answer);
    }

    function paint() {
      for (const [id, w] of Object.entries(wallets)) {
        const combo = answer[id] ?? {};
        w.wallet.classList.toggle('is-active', id === active && part.items.length > 1);
        const notes = Object.entries(combo)
          .sort((a, b) => Number(b[0]) - Number(a[0]))
          .flatMap(([value, count]) => Array.from({ length: count }, () => Number(value)));
        w.pieces.replaceChildren(...(notes.length
          ? notes.map((value) => h('button', { type: 'button', class: 'ex-piece', 'aria-label': `scoate ${cuDe(value, 'lei')}`, html: visualSVG({ v: 'banknote', value }), onClick: () => remove(id, value) }))
          : [h('span', { class: 'ex-wallet__empty' }, 'Gol')]));
        w.sum.textContent = `Ai pus: ${cuDe(moneySum(combo), 'lei')}`;
      }
    }
    paint();

    return {
      get: () => answer,
      set(a) {
        answer = JSON.parse(JSON.stringify(a ?? {}));
        paint();
      },
      mode(m) {
        mode = m;
        for (const b of el.querySelectorAll('button')) b.disabled = isLocked(m);
        if (isLocked(m)) for (const w of Object.values(wallets)) w.wallet.classList.remove('is-active');
      },
      showResult(res) {
        for (const x of res.items) {
          setState(wallets[x.id].wallet, x.ok ? 'correct' : 'wrong');
          wallets[x.id].wallet.querySelector('.ex-wallet__note').replaceChildren(feedbackBox(x.feedback) ?? '');
        }
      },
      destroy() {},
    };
  },
};
