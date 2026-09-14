// Atelierul autorilor: componentele CSS, banca vizuală și câte un exemplu viu din fiecare tip de exercițiu.

import demoTest from '../../data/demo.js';
import { h } from '../core/dom.js';
import { md } from '../core/markup.js';
import { evaluateExercise } from '../core/scoring.js';
import { cantitate, formatNumber } from '../core/ro.js';
import { normalizeTest } from '../core/spec.js';
import { mountExercise } from '../components/exercise.js';
import { callout, chip, levelPill, mascot, stars } from '../components/ui.js';
import { seededRandom } from '../core/rng.js';
import { artHTML, aspect } from '../fulger/art.js';
import { playableTopics } from '../fulger/engine.js';
import { KINDS } from '../fulger/kinds.js';
import { listVisuals, visualSVG } from '../visuals/index.js';
import { ANIMALS, avatarId, BACKGROUNDS, COLORS, colorWord, SLOTS } from '../core/avatar.js';
import { avatarStudio } from '../components/avatar-studio.js';
import { avatarSVG } from '../visuals/avatar.js';

const TABS = [
  ['componente', 'Componente'],
  ['vizualuri', 'Vizualuri'],
  ['tipuri', 'Tipuri de exerciții'],
  ['fulger', 'Jocuri fulger'],
  ['avatare', 'Avatare'],
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
      levelPill('usor'), levelPill('intermediar'), levelPill('avansat'), chip('~45 min', '', 'ceas'), chip('în curând', 'c-chip--soon'), stars(2, 3),
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
            h('figcaption', { class: 'u-small u-break' }, h('strong', {}, v.name), h('br'), h('code', {}, JSON.stringify(params))),
          ),
        )),
      )),
    ),
  );
}

async function types(wrap, ctls) {
  const test = normalizeTest(demoTest);
  wrap.append(h('p', { class: 'u-muted' }, 'Fiecare exemplu este definit în site/data/demo.js. Butoanele de mai jos sunt doar pentru autori.'));
  for (const [i, ex] of test.exercises.entries()) {
    const box = h('div', { class: 'l-stack', 'data-testid': `demo-${ex.id}` });
    wrap.append(box);
    let ctl = await mountExercise(box, ex, { number: i + 1, seed: 7 });
    ctls[ex.id] = ctl;
    if (!wrap.isConnected) return; // s-a schimbat pagina în timpul montării
    const status = h('span', { class: 'u-muted', 'data-testid': `demo-status-${ex.id}` });
    box.append(h('div', { class: 'l-cluster' },
      h('button', { class: 'c-btn c-btn--primary c-btn--sm', 'data-testid': `demo-check-${ex.id}`, onClick: () => {
        const res = evaluateExercise(ex, ctl.get());
        ctl.showResults(res);
        status.textContent = `${formatNumber(res.earnedPoints)} din ${cantitate(res.points, 'punct', 'puncte')}`;
      } }, 'Verifică'),
      h('button', { class: 'c-btn c-btn--sm', onClick: () => ctl.showSolution() }, 'Soluția'),
      h('button', { class: 'c-btn c-btn--ghost c-btn--sm', onClick: async () => {
        ctl.destroy();
        ctl.el.remove();
        ctl = await mountExercise(box, ex, { number: i + 1, seed: 7 });
        ctls[ex.id] = ctl;
        if (!wrap.isConnected) return ctl.destroy();
        box.prepend(ctl.el);
        status.textContent = '';
      } }, 'Resetează'),
      status,
    ));
  }
  if (new URLSearchParams(location.search).has('debug')) {
    window.__dbg = { answer: (id) => JSON.parse(JSON.stringify(ctls[id].get())), evaluate: (id) => evaluateExercise(test.exercises.find((e) => e.id === id), ctls[id].get()) };
  }
}

/** Jocuri fulger: câte 12 întrebări (semințele 1–12) din fiecare tip cu figuri, cu varianta corectă încadrată, ca itemii nepotriviți să se vadă din ochi. */
function fulgerReview() {
  const art = (spec, cls) =>
    spec.v || spec.emoji ? h('span', { class: cls, 'aria-hidden': 'true', style: { '--ar': String(aspect(spec)) }, html: artHTML(spec) }) : h('span', { class: `${cls} fg-review__text` }, spec.text);
  return h(
    'div',
    { class: 'l-stack l-stack--lg' },
    h('p', { class: 'u-muted' }, 'Câte 12 întrebări din fiecare tip cu figuri (semințele 1–12), cu varianta corectă încadrată în verde.'),
    playableTopics().map((topic) => {
      const kinds = [...new Set(topic.levels.flatMap((l) => l.mix.map((m) => m.kind)))].filter((kind) => KINDS[kind].mode === 'figure');
      if (!kinds.length) return null;
      return h(
        'section',
        { class: 'l-stack' },
        h('h2', {}, topic.title),
        kinds.map((kind) =>
          h(
            'div',
            { class: 'l-stack l-stack--sm', 'data-testid': `review-${kind}` },
            h('h3', {}, `${KINDS[kind].label} `, h('code', {}, kind)),
            h(
              'div',
              { class: 'l-grid', style: { '--grid-min': '14rem' } },
              Array.from({ length: 12 }, (_, i) => {
                const q = KINDS[kind].generate(seededRandom(i + 1));
                return h(
                  'figure',
                  { class: 'c-card fg-review' },
                  h('figcaption', { class: 'u-small' }, h('strong', {}, `${i + 1}. `), q.prompt),
                  q.figure ? art(q.figure, 'fg-review__fig') : null,
                  h('div', { class: 'fg-review__opts' }, q.choices.map((c) => h('span', { class: `fg-review__opt${c === q.answer ? ' is-answer' : ''}` }, art(q.options[c], 'fg-review__art')))),
                );
              }),
            ),
          ),
        ),
      );
    }),
  );
}

/** Avatarele: fiecare animal în fiecare culoare și cu fiecare accesoriu, plus fundalurile, ca un desen nepotrivit să se vadă din ochi. */
function avatarReview() {
  const cell = (look) => h('span', { class: 'av-cell', title: avatarId(look), html: avatarSVG(avatarId(look)) });
  const matrix = (testid, heads, rows) =>
    h(
      'div',
      { class: 'av-matrix-wrap' },
      h(
        'div',
        { class: 'av-matrix', style: { '--cols': String(heads.length) }, 'data-testid': testid },
        h('span'),
        heads.map((head) => h('span', { class: 'av-matrix__head' }, head)),
        rows.flatMap(([name, looks]) => [h('span', { class: 'av-matrix__name' }, name), ...looks.map(cell)]),
      ),
    );
  const worn = SLOTS.slice(2).flatMap((slot) => slot.list.map((x) => ({ field: slot.field, id: x.id })));
  const section = (title, content) => h('section', { class: 'l-stack' }, h('h2', {}, title), content);
  const label = (id) => ANIMALS.find((a) => a.id === id).label;
  const code = h('code', { 'data-testid': 'avatar-code' }, 'veverita');
  const studio = avatarStudio({ value: 'veverita', onChange: (value) => { code.textContent = value; } });
  return h(
    'div',
    { class: 'l-stack l-stack--lg', 'data-testid': 'avatar-review' },
    section('Atelierul avatarului', h('div', { class: 'c-card l-stack' }, studio.el, h('p', { class: 'u-small u-muted' }, 'Textul salvat în profil: ', code))),
    h('p', { class: 'u-muted' }, 'Mai jos, fiecare animal în fiecare culoare și cu fiecare accesoriu, plus fundalurile: un desen nepotrivit se vede din ochi.'),
    section('Culorile', matrix('avatar-matrix-colors', ['naturală', ...COLORS.map((c) => colorWord(c.id, 'm'))], ANIMALS.map((a) => [a.label, [{ animal: a.id }, ...COLORS.map((c) => ({ animal: a.id, color: c.id }))]]))),
    section('Accesoriile', matrix('avatar-matrix', worn.map((x) => x.id), ANIMALS.map((a) => [a.label, worn.map((x) => ({ animal: a.id, [x.field]: x.id }))]))),
    section('Fundalurile', matrix('avatar-matrix-backgrounds', BACKGROUNDS.map((b) => b.id), ['veverita', 'pinguin', 'panda', 'broasca'].map((id) => [label(id), BACKGROUNDS.map((b) => ({ animal: id, background: b.id }))]))),
  );
}

export default async function atelier(container, [tab = 'componente']) {
  document.title = 'Atelier — Cifruța';
  const body = h('div', { class: 'l-stack l-stack--lg' });
  container.append(
    h(
      'div',
      { class: 'l-container l-stack l-stack--lg' },
      h('div', { class: 'l-stack l-stack--sm' }, h('h1', {}, 'Atelier pentru autori'), h('p', { class: 'u-muted' }, 'Catalog viu al componentelor, desenelor și tipurilor de exerciții.')),
      h('nav', { class: 'c-tabs' }, TABS.map(([id, label]) => h('a', { class: `c-tab${id === tab ? ' is-active' : ''}`, href: `#/atelier/${id}` }, label))),
      body,
    ),
  );
  const ctls = {};
  if (tab === 'vizualuri') body.append(visuals());
  else if (tab === 'fulger') body.append(fulgerReview());
  else if (tab === 'avatare') body.append(avatarReview());
  else if (tab === 'tipuri') await types(body, ctls);
  else body.append(components());
  return () => {
    Object.values(ctls).forEach((c) => c.destroy());
    delete window.__dbg;
  };
}
