// Atelierul autorilor: componentele CSS, banca vizuală și câte un exemplu viu din fiecare tip de exercițiu.

import demoTest from '../../data/demo.js';
import { h } from '../core/dom.js';
import { md } from '../core/markup.js';
import { evaluateExercise } from '../core/scoring.js';
import { normalizeTest } from '../core/spec.js';
import { mountExercise } from '../components/exercise.js';
import { callout, chip, levelPill, mascot, stars } from '../components/ui.js';
import { listVisuals, visualSVG } from '../visuals/index.js';

const TABS = [
  ['componente', 'Componente'],
  ['vizualuri', 'Vizualuri'],
  ['tipuri', 'Tipuri de exerciții'],
];

function components() {
  return h(
    'div',
    { class: 'l-stack l-stack--lg' },
    h('section', { class: 'l-stack' }, h('h2', {}, 'Butoane'), h('div', { class: 'l-cluster' },
      h('button', { class: 'c-btn' }, 'Normal'),
      h('button', { class: 'c-btn c-btn--primary' }, 'Principal'),
      h('button', { class: 'c-btn c-btn--accent' }, 'Accent'),
      h('button', { class: 'c-btn c-btn--ok' }, 'Corect'),
      h('button', { class: 'c-btn c-btn--ghost' }, 'Discret'),
      h('button', { class: 'c-btn c-btn--primary c-btn--lg' }, 'Mare'),
      h('button', { class: 'c-btn c-btn--sm' }, 'Mic'),
      h('button', { class: 'c-btn', disabled: true }, 'Dezactivat'),
    )),
    h('section', { class: 'l-stack' }, h('h2', {}, 'Niveluri, pastile, stele'), h('div', { class: 'l-cluster' },
      levelPill('usor'), levelPill('intermediar'), levelPill('avansat'), chip('⏱ ~43 min'), chip('în curând', 'c-chip--soon'), stars(2, 3),
    )),
    h('section', { class: 'l-stack' }, h('h2', {}, 'Mini-markup'), h('p', { class: 'u-big', html: md('**Tare**, ==evidențiat==, emoji {{e:mar}} {{e:stea}}, jetoane {{s:3}} {{z:4}} {{u:7}} și vizual inline {{v:star n=47}}') })),
    h('section', { class: 'l-stack' }, h('h2', {}, 'Mesaje'),
      callout('idea', 'idee', 'Ideea: comparăm întâi zecile.'),
      callout('ok', 'proba', 'Proba: 24 + 18 = 42.'),
      callout('warn', 'capcana', 'Capcana: „cu 8 mai puține decât” — cine are mai multe?'),
      callout('bad', 'trist', 'Încă nu. Mai privim o dată unitățile.'),
    ),
    h('section', { class: 'l-stack' }, h('h2', {}, 'Mascota'), h('div', { class: 'l-grid', style: { '--grid-min': '14rem' } },
      ['vesela', 'ganditoare', 'sarbatoreste', 'incurajeaza'].map((mood) => mascot(mood, `Stare: **${mood}**`)),
    )),
    h('section', { class: 'l-stack' }, h('h2', {}, 'Harta de progres'), h('div', { class: 'c-progress' },
      h('div', { class: 'c-progress__group', 'data-level': 'usor' }, h('span', { class: 'c-progress__dot is-done' }, '1'), h('span', { class: 'c-progress__dot is-partial' }, '2'), h('span', { class: 'c-progress__dot is-current' }, '3')),
      h('div', { class: 'c-progress__group', 'data-level': 'intermediar' }, h('span', { class: 'c-progress__dot' }, '4')),
      h('div', { class: 'c-progress__group', 'data-level': 'avansat' }, h('span', { class: 'c-progress__dot' }, '5')),
    )),
  );
}

function visuals() {
  const groups = {};
  for (const v of listVisuals()) (groups[v.group] ??= []).push(v);
  return h(
    'div',
    { class: 'l-stack l-stack--lg' },
    Object.entries(groups).map(([group, items]) =>
      h('section', { class: 'l-stack' }, h('h2', {}, group), h('div', { class: 'l-grid', style: { '--grid-min': '11rem' } },
        items.flatMap((v) => v.demos.map((params) =>
          h('figure', { class: 'c-card u-center', style: { margin: 0 }, 'data-testid': `visual-${v.name}` },
            h('div', { html: visualSVG({ v: v.name, ...params }) }),
            h('figcaption', { class: 'u-small' }, h('strong', {}, v.name), h('br'), h('code', {}, JSON.stringify(params))),
          ),
        )),
      )),
    ),
  );
}

async function types() {
  const test = normalizeTest(demoTest);
  const wrap = h('div', { class: 'l-stack l-stack--lg' }, h('p', { class: 'u-muted' }, 'Fiecare exemplu este definit în site/data/demo.js. Butoanele de mai jos sunt doar pentru autori.'));
  const ctls = {};
  for (const [i, ex] of test.exercises.entries()) {
    const box = h('div', { class: 'l-stack', 'data-testid': `demo-${ex.id}` });
    wrap.append(box);
    let ctl = await mountExercise(box, ex, { number: i + 1, seed: 7 });
    ctls[ex.id] = ctl;
    const status = h('span', { class: 'u-muted', 'data-testid': `demo-status-${ex.id}` });
    box.append(h('div', { class: 'l-cluster' },
      h('button', { class: 'c-btn c-btn--primary c-btn--sm', 'data-testid': `demo-check-${ex.id}`, onClick: () => {
        const res = evaluateExercise(ex, ctl.get());
        ctl.showResults(res);
        status.textContent = `${Math.round(res.earned * 10) / 10} din ${res.total}`;
      } }, 'Verifică'),
      h('button', { class: 'c-btn c-btn--sm', onClick: () => ctl.showSolution() }, 'Soluția'),
      h('button', { class: 'c-btn c-btn--ghost c-btn--sm', onClick: async () => {
        ctl.destroy();
        ctl.el.remove();
        ctl = await mountExercise(box, ex, { number: i + 1, seed: 7 });
        ctls[ex.id] = ctl;
        box.prepend(ctl.el);
        status.textContent = '';
      } }, 'Resetează'),
      status,
    ));
  }
  if (new URLSearchParams(location.search).has('debug')) {
    window.__dbg = { answer: (id) => JSON.parse(JSON.stringify(ctls[id].get())), evaluate: (id) => evaluateExercise(test.exercises.find((e) => e.id === id), ctls[id].get()) };
  }
  return wrap;
}

export default async function atelier(container, [tab = 'componente']) {
  document.title = 'Atelier — Cifruța';
  const body = tab === 'vizualuri' ? visuals() : tab === 'tipuri' ? await types() : components();
  container.append(
    h(
      'div',
      { class: 'l-container l-stack l-stack--lg' },
      h('div', { class: 'l-stack l-stack--sm' }, h('h1', {}, 'Atelier pentru autori'), h('p', { class: 'u-muted' }, 'Catalog viu al componentelor, desenelor și tipurilor de exerciții.')),
      h('nav', { class: 'c-tabs' }, TABS.map(([id, label]) => h('a', { class: `c-tab${id === tab ? ' is-active' : ''}`, href: `#/atelier/${id}` }, label))),
      body,
    ),
  );
  return () => delete window.__dbg;
}
