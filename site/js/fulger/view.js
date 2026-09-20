// Jocuri fulger: arena unei runde (DOM). Semaforul de start, bara de sus (timp, serie, alune, pauză), pista spre stele și
// record, întrebarea cu variantele sau plăcile, efectele și sunetele. Timpul rundei curge într-o singură buclă
// requestAnimationFrame și stă pe loc în pauză; motorul (engine.js) hotărăște alunele și pauzele de după răspunsuri.

import config from '../../data/fulger.js';
import { confetti, levelInfo, levelPill, stars } from '../components/ui.js';
import { countUp, h, pop, prefersReducedMotion } from '../core/dom.js';
import { cantitate, formatNumber } from '../core/ro.js';
import { play, unlockSound } from '../core/sound.js';
import { emojiHTML } from '../visuals/emoji.js';
import { visualSVG } from '../visuals/index.js';
import { artHTML, artName, aspect, isChart, promptHTML, promptLength, promptSpoken } from './art.js';
import { badge, banner, burst, flyTo, stamp } from './effects.js';
import { createRound, levelConfig, nextStar, streakTier, TURBO_FROM } from './engine.js';
import { KINDS } from './kinds.js';

const RING = 97.4; // lungimea cercului cu raza 15.5 din inel, ca în player
const SIGNS = ['<', '=', '>'];
const SIGN_LABELS = { '<': 'mai mic', '=': 'egal', '>': 'mai mare' };
const SIGN_NAMES = { '<': 'mai mic decât', '=': 'egal cu', '>': 'mai mare decât' };
const KEYS = ['1', '2', '3', '4'];
const CHEERS = { 3: 'Ai prins o serie!', 5: 'Alunele valorează dublu!', 10: 'Turbo! Alunele valorează triplu!' };
const COMFORT = ['Nu-i nimic!', 'Data viitoare iese!', 'Respiră și continuă!'];
const STAR_WORDS = ['Prima', 'A doua', 'A treia'];

const spoken = (text) => String(text).replace(/−/g, 'minus');
const pick = (list) => list[Math.floor(Math.random() * list.length)];
/** Plăcile unei ordonări: numerele (la calcule) sau id-urile plăcuțelor desenate (la grafice). */
const tilesOf = (q) => q.tiles ?? q.numbers;
/** Întrebare cu variante numerice (șiruri, rotunjire, numere scrise cu litere): numerele sunt conținutul, nu desene sau nume. */
const numericOptions = (q) => q.mode === 'figure' && q.choices.every((id) => /^\d+$/.test(String(q.options[id].text ?? '')));
/** O latură a comparării: textul unui calcul sau desenele de pe un grafic, unite cu „+”. */
const sideText = (side, plus = ' + ') => (Array.isArray(side) ? side.map(artName).join(plus) : side);
const SEPARATORS = { asc: '<', desc: '>', path: '→' };

/** Răspunsul corect, scris pentru copil. */
function answerText(q) {
  if (q.mode === 'figure') return artName(q.options[q.answer]);
  if (q.mode === 'choice') return String(q.answer);
  if (q.mode === 'compare') return `${sideText(q.left)} ${q.answer} ${sideText(q.right)}`;
  if (q.tiles) return q.answer.map((id) => artName(q.options[id])).join(q.dir === 'path' ? ', ' : ` ${SEPARATORS[q.dir]} `);
  return q.answer.join(q.dir === 'asc' ? ' < ' : ' > ');
}

/** Atingerea contează la `pointerdown` (reacție imediată); `click` rămâne pentru tastatură și cititoare de ecran. */
function press(el, fn) {
  let downAt = -Infinity;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    downAt = performance.now();
    fn();
  });
  el.addEventListener('click', () => {
    if (performance.now() - downAt > 700) fn();
  });
}

/** Desenul unei variante în buton; o variantă-text rămâne text, ca cifrele. */
function optionArt(spec) {
  if (!spec.v && !spec.emoji) return h('span', {}, spec.text);
  return h('span', { class: 'fg-opt__art', 'aria-hidden': 'true', style: { '--ar': String(aspect(spec)) }, html: artHTML(spec) });
}

/** Un emoji sau un text mic, pentru rândul de răspuns și pentru casetele ordonării. */
const tinyArt = (spec) => (spec.emoji ? h('span', { class: 'fg-strip__art', html: artHTML(spec) }) : h('span', {}, spec.text));

/** O latură a comparării desenate: emoji-uri sau texte, unite cu „+”. */
const sideArt = (list) =>
  h('span', { class: 'fg-strip__side' }, list.flatMap((spec, i) => (i ? [h('span', { class: 'fg-sign' }, '+'), tinyArt(spec)] : [tinyArt(spec)])));

export function mountArena(host, { topic, topicTitle = '', level, best = null, seed, onEnd }) {
  const lvl = levelConfig(topic, level);
  const round = createRound({ topic, level, seed });
  const reduced = prefersReducedMotion();
  const timers = new Set();
  const later = (ms, fn) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  let phase = 'ready'; // ready → countdown → playing ⇄ paused → over
  let elapsed = 0; // timpul rundei, fără pauze
  let last = 0;
  let frame = 0;
  let tasks = []; // { at, fn } pe timpul rundei, deci stau pe loc în pauză
  const after = (ms, fn) => tasks.push({ at: elapsed + ms, fn });
  let question = null;
  let enabled = false;
  let askedAt = 0;
  let taps = [];
  let buttons = [];
  let slot = null;
  let slots = [];
  let figure = null; // desenul unei întrebări cu figuri; la răspuns devine desenul rezolvat
  let bolt = null;
  let boltBar = null;
  let cooldown = null;
  let alune = 0;
  let turbo = false;
  let shownSecond = null;
  let litStars = 0;
  let nutsShown = 1;
  let passedRecord = false;
  let spokeAt = -Infinity;
  let sayTimer = 0;

  // ——— bara de sus ———
  const timeText = h('span', { class: 'c-countdown__time', 'data-testid': 'fg-time' });
  const timer = h(
    'div',
    { class: 'c-countdown fg-timer', role: 'timer', 'aria-label': `Timpul rămas din cele ${config.durationMs / 60000} minute` },
    h('span', { class: 'c-countdown__ring', 'aria-hidden': 'true', html: '<svg viewBox="0 0 36 36"><circle class="c-countdown__track" cx="18" cy="18" r="15.5"/><circle class="c-countdown__fill" cx="18" cy="18" r="15.5"/></svg>' }),
    timeText,
  );
  const ringFill = timer.querySelector('.c-countdown__fill');
  const streakCount = h('span', { class: 'fg-streak__count', 'data-testid': 'fg-streak' }, '0');
  const streakMult = h('span', { class: 'fg-streak__mult', 'data-testid': 'fg-mult' });
  const flame = h('span', { class: 'fg-streak__flame', 'aria-hidden': 'true' }, h('span', { class: 'fg-streak__fire', html: emojiHTML('foc') }));
  const streakBox = h('div', { class: 'fg-streak is-off', title: 'Răspunsuri corecte la rând' }, flame, streakCount, streakMult);
  const basketArt = h('span', { class: 'fg-basket__art', 'aria-hidden': 'true', html: visualSVG({ v: 'alune', n: 1 }) });
  const basketNum = h('span', { class: 'fg-basket__num', 'data-testid': 'fg-alune' }, '0');
  const basket = h('div', { class: 'fg-basket', title: 'Alune' }, basketArt, h('span', {}, basketNum, h('span', { class: 'fg-basket__best' }, best ? `Record: ${best}` : 'alune')));
  const pauseBtn = h(
    'button',
    { type: 'button', class: 'c-btn c-btn--ghost c-btn--icon fg-pause', 'aria-label': 'Pauză', 'data-testid': 'fg-pause', onClick: () => pause() },
    h('span', { class: 'fg-pause__icon', 'aria-hidden': 'true' }, h('i'), h('i')),
  );

  // ——— pista: stelele nivelului și recordul ———
  const trackMax = Math.max(lvl.stars.at(-1), best ?? 0) * 1.1;
  const place = (v) => `${Math.min(100, (v / trackMax) * 100).toFixed(2)}%`;
  const marks = lvl.stars.map((s, i) => h('span', { class: 'fg-track__mark', style: { left: place(s) }, 'data-testid': `fg-mark-${i + 1}` }, stars(0, 1)));
  const flag = best ? h('span', { class: 'fg-track__flag', style: { left: place(best) }, html: emojiHTML('steag') }) : null;
  const track = h(
    'div',
    { class: 'fg-track', 'aria-hidden': 'true' },
    h('span', { class: 'fg-track__rail' }, h('span', { class: 'fg-track__fill' })),
    marks,
    flag,
    h('span', { class: 'fg-track__lane' }, h('span', { class: 'fg-track__runner', html: visualSVG({ v: 'mascot', mood: 'vesela' }) })),
  );

  // ——— scena ———
  const card = h('div', { class: 'fg-card', 'data-testid': 'fg-card' });
  const answers = h('div', { class: 'fg-answers', 'data-testid': 'fg-answers', 'aria-busy': 'true' });
  const coolBar = h('span', { class: 'fg-cooldown__bar' });
  const coolText = h('span', { class: 'fg-cooldown__text', 'data-testid': 'fg-hopa' });
  const cool = h('div', { class: 'fg-cooldown' }, h('span', { class: 'fg-cooldown__rail' }, coolBar), coolText);
  const say = h('div', { class: 'fg-say', 'aria-hidden': 'true' });
  const buddy = h('div', { class: 'fg-buddy', 'aria-hidden': 'true', html: visualSVG({ v: 'mascot', mood: 'vesela' }) });
  const live = h('div', { class: 'u-visually-hidden', 'aria-live': 'polite' });
  const fx = h('div', { class: 'fg-fx', 'aria-hidden': 'true' });
  const overlay = h('div', { class: 'fg-overlay' });
  const bubbles = Array.from({ length: 7 }, (_, i) =>
    h('i', { style: { left: `${(i * 37 + 5) % 100}%`, top: `${(i * 53 + 11) % 100}%`, '--s': `${2 + ((i * 7) % 5)}rem`, '--t': `${5 + (i % 4)}s`, animationDelay: `${-i * 0.7}s` } }),
  );
  const arena = h(
    'div',
    { class: 'fg-arena', 'data-level': level, 'data-testid': 'fg-arena' },
    h('div', { class: 'fg-bg', 'aria-hidden': 'true' }, bubbles),
    h('div', { class: 'fg-stripes', 'aria-hidden': 'true' }),
    h('div', { class: 'fg-vignette', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'fg-arena__inner' },
      h('h1', { class: 'u-visually-hidden' }, `Jocuri fulger · ${topicTitle ? `${topicTitle} · ` : ''}${levelInfo(level)?.label ?? level}`),
      h('div', { class: 'fg-hud' }, timer, streakBox, basket, pauseBtn),
      track,
      h('div', { class: 'fg-stage' }, say, buddy, card, answers, cool),
    ),
    fx,
    overlay,
    live,
  );
  host.append(arena);
  // pe iOS sunetul pornește doar dintr-un gest încheiat; răspunsurile se iau la pointerdown, deci deblocăm la ridicarea degetului
  arena.addEventListener('pointerup', unlockSound);
  arena.addEventListener('touchend', unlockSound, { passive: true });

  // ——— start ———
  /** Ținta de pe panoul de start: recordul și steaua următoare. */
  function goal() {
    const next = nextStar(lvl, best ?? 0);
    const record = best ? `Recordul tău: ${cantitate(best, 'alună', 'alune')}. ` : '';
    const star = next ? `${STAR_WORDS[next.index]} stea: ${cantitate(next.at, 'alună', 'alune')}.` : 'Ai toate stelele: poți bate recordul?';
    return h('p', { class: 'fg-panel__goal', 'data-testid': 'fg-goal' }, record + star);
  }

  function showReady() {
    const start = h('button', { type: 'button', class: 'c-btn c-btn--primary c-btn--lg', 'data-testid': 'fg-start', onClick: () => countdown() }, 'Start');
    overlay.replaceChildren(
      h(
        'div',
        { class: 'fg-panel anim-bounce-in' },
        h('div', { class: 'fg-panel__art', 'aria-hidden': 'true', html: visualSVG({ v: 'mascot', mood: 'vesela' }) }),
        h('h2', { class: 'fg-panel__title' }, 'Jocuri fulger'),
        topicTitle ? h('p', { class: 'u-small u-muted', 'data-testid': 'fg-topic' }, topicTitle) : null,
        levelPill(level),
        h('p', { class: 'fg-panel__text' }, 'Ai 2 minute. Răspunde corect de mai multe ori la rând: alunele cresc, iar fulgerul le dublează!'),
        goal(),
        start,
        h('p', { class: 'u-small u-muted fg-keys-hint' }, 'La tastatură: Enter pornește, 1–4 alege, Esc pune pauză.'),
      ),
    );
    start.focus({ preventScroll: true });
  }

  function countdown() {
    if (phase !== 'ready') return;
    phase = 'countdown';
    unlockSound(); // încă suntem în clicul pe Start
    const lights = [0, 1, 2].map(() => h('span', { class: 'fg-light' }));
    const word = h('div', { class: 'fg-go', 'data-testid': 'fg-go' });
    overlay.replaceChildren(h('div', { class: 'fg-panel fg-panel--bare' }, h('div', { class: 'fg-lights', 'aria-hidden': 'true' }, lights), word));
    const steps = [['Pe locuri…', 'is-red', 'ready'], ['Fiți gata…', 'is-yellow', 'ready'], ['START!', 'is-green', 'go']];
    const gap = reduced ? 350 : 600;
    const light = ([text, cls, sound], i) => {
      lights[i].classList.add(cls);
      word.textContent = text;
      pop(word, 'is-slam');
      play(sound);
      live.textContent = text;
    };
    steps.forEach((step, i) => (i ? later(i * gap, () => light(step, i)) : light(step, i))); // prima lumină sună chiar în clic
    later(steps.length * gap + 100, startPlay);
  }

  function startPlay() {
    phase = 'playing';
    overlay.hidden = true;
    overlay.replaceChildren();
    arena.classList.add('is-playing');
    last = performance.now();
    frame = requestAnimationFrame(tick);
    nextQuestion();
    if (document.hidden) pause(); // pagina s-a ascuns în timpul semaforului
  }

  // ——— timpul ———
  function tick(now) {
    frame = requestAnimationFrame(tick);
    const dt = Math.max(0, Math.min(250, now - last)); // după o oprire lungă a paginii timpul nu sare, și nici nu merge înapoi
    last = now;
    if (phase === 'playing') advance(dt);
  }

  function advance(dt) {
    elapsed += dt;
    const due = tasks.filter((t) => t.at <= elapsed);
    tasks = tasks.filter((t) => t.at > elapsed);
    for (const t of due) t.fn();
    paint();
    if (phase === 'playing' && elapsed >= config.durationMs) timeUp();
  }

  function paint() {
    const remaining = Math.max(0, config.durationMs - elapsed);
    const second = Math.ceil(remaining / 1000);
    if (second !== shownSecond) {
      shownSecond = second;
      timeText.textContent = `${Math.floor(second / 60)}:${String(second % 60).padStart(2, '0')}`;
      if (phase === 'playing' && remaining > 0 && remaining <= config.sprintMs) {
        if (!arena.classList.contains('is-final')) {
          arena.classList.add('is-final');
          timer.classList.add('is-low');
          react('incurajeaza', 'Sprint final!');
          live.textContent = 'Mai sunt 10 secunde. Sprint final!';
        }
        pop(timeText, 'anim-tick');
        play('tick', { step: second <= 3 ? 4 : 0 });
      }
    }
    ringFill.style.strokeDashoffset = (RING * (1 - remaining / config.durationMs)).toFixed(2);
    if (boltBar && enabled && question) {
      const fast = KINDS[question.kind].fastMs;
      const t = elapsed - askedAt;
      const left = t <= fast ? 1 - t / fast : 1 - (t - fast) / fast;
      bolt.classList.toggle('is-rapid', t > fast);
      bolt.classList.toggle('is-gone', left <= 0);
      boltBar.style.transform = `scaleX(${Math.max(0, left).toFixed(3)})`;
    }
    if (cooldown) coolBar.style.transform = `scaleX(${Math.max(0, 1 - (elapsed - cooldown.from) / cooldown.ms).toFixed(3)})`;
  }

  // ——— întrebările ———
  function nextQuestion(kind = null) {
    if (phase === 'over') return;
    question = round.next(kind);
    taps = [];
    enabled = false;
    cooldown = null;
    cool.classList.remove('is-on');
    coolText.textContent = '';
    renderQuestion(question);
    after(config.inputDelayMs, () => {
      if (!question) return;
      enabled = true;
      askedAt = elapsed;
      answers.setAttribute('aria-busy', 'false');
    });
  }

  function renderQuestion(q) {
    slot = null;
    slots = [];
    figure = q.figure
      ? h('div', { class: `fg-fig${isChart(q.figure) ? ' fg-fig--chart' : ''}`, 'data-testid': 'fg-figure', 'aria-hidden': 'true', style: { '--ar': String(aspect(q.figure)) }, html: artHTML(q.figure) })
      : null;
    let body;
    let strip = null;
    if (q.mode === 'figure') {
      // numere fără desen: cerința e singură în card (un șir, o rotunjire), deci se scrie mai mare
      const solo = !q.figure && numericOptions(q);
      const prompt = h('p', { class: `fg-prompt${solo ? ' fg-prompt--solo' : ''}${promptLength(q.prompt) > 45 ? ' fg-prompt--long' : ''}`, html: promptHTML(q.prompt) });
      body = h('div', { class: 'fg-q fg-q--figure', 'data-testid': 'fg-question' }, prompt, figure);
    } else if (q.figure) {
      // comparare sau ordonare pe un desen: cardul are doar desenul, iar legenda și operanzii stau în rândul de deasupra butoanelor
      // (așa cardul rămâne cât la întrebările cu variante, iar pe telefonul culcat rândul stă în coloana variantelor)
      body = h('div', { class: 'fg-q fg-q--figure fg-q--drawn', 'data-testid': 'fg-question' }, figure);
      const caption = h('span', { class: 'fg-strip__caption', html: promptHTML(q.prompt) });
      if (q.mode === 'compare') {
        slot = h('span', { class: 'fg-q__slot fg-q__slot--sign' });
        strip = h('div', { class: 'fg-strip', 'data-testid': 'fg-strip' }, caption, h('span', { class: 'fg-strip__row' }, sideArt(q.left), slot, sideArt(q.right)));
      } else {
        slots = q.answer.map(() => h('span', { class: 'fg-slot' }));
        const sign = SEPARATORS[q.dir];
        strip = h('div', { class: 'fg-strip fg-strip--sort', 'data-testid': 'fg-strip' }, caption, h('span', { class: 'fg-slots' }, slots.flatMap((s, i) => (i ? [h('span', { class: 'fg-sign' }, sign), s] : [s]))));
      }
    } else if (q.mode === 'choice') {
      slot = h('span', { class: 'fg-q__slot' }, '?');
      body = h('div', { class: 'fg-q', 'data-testid': 'fg-question' }, h('span', {}, q.text), h('span', { 'aria-hidden': 'true' }, '='), slot);
    } else if (q.mode === 'compare') {
      slot = h('span', { class: 'fg-q__slot fg-q__slot--sign' });
      body = h('div', { class: 'fg-q', 'data-testid': 'fg-question' }, h('span', {}, q.left), slot, h('span', {}, q.right));
    } else {
      slots = q.answer.map(() => h('span', { class: 'fg-slot' }));
      const sign = q.dir === 'asc' ? '<' : '>';
      body = h(
        'div',
        { class: 'fg-q fg-q--sort', 'data-testid': 'fg-question' },
        h('span', { class: `fg-dir${q.dir === 'desc' ? ' is-desc' : ''}`, 'data-testid': 'fg-dir' }, q.dir === 'asc' ? 'Crescător: de la mic la mare' : 'Descrescător: de la mare la mic'),
        h('span', { class: 'fg-slots' }, slots.flatMap((s, i) => (i ? [h('span', { class: 'fg-sign' }, sign), s] : [s]))),
      );
    }
    // bara fulgerului apare doar când răspunsul ar continua o serie (atunci contează viteza)
    boltBar = round.streak >= 1 ? h('span', { class: 'fg-bolt__bar' }) : null;
    bolt = boltBar ? h('div', { class: 'fg-bolt', 'aria-hidden': 'true', 'data-testid': 'fg-bolt' }, h('span', { class: 'fg-bolt__icon', html: emojiHTML('fulger') }), h('span', { class: 'fg-bolt__rail' }, boltBar)) : null;
    card.className = 'fg-card';
    card.replaceChildren(...[body, bolt].filter(Boolean));
    if (!reduced) pop(card, 'is-enter');

    const drawnOption = (spec) => ({ art: spec, name: artName(spec), label: spec.note });
    const options =
      q.mode === 'figure'
        ? q.choices.map((id) => drawnOption(q.options[id]))
        : q.mode === 'choice'
          ? q.choices.map((v) => ({ text: String(v), name: String(v) }))
          : q.mode === 'compare'
            ? SIGNS.map((s) => ({ text: s, name: SIGN_NAMES[s], label: SIGN_LABELS[s] }))
            : q.tiles
              ? q.tiles.map((id) => drawnOption(q.options[id]))
              : q.numbers.map((n) => ({ text: String(n), name: `placa ${n}` }));
    buttons = options.map((o, i) => {
      const btn = h(
        'button',
        { type: 'button', class: 'fg-opt', 'data-testid': `fg-opt-${i}`, 'aria-label': o.name },
        h('span', { class: 'fg-opt__key', 'aria-hidden': 'true' }, KEYS[i]),
        o.art ? optionArt(o.art) : h('span', {}, o.text),
        o.label ? h('span', { class: 'fg-opt__label', 'aria-hidden': 'true' }, o.label) : null,
      );
      press(btn, () => choose(i));
      return btn;
    });
    // variantele cu piese sau rețele (multe căsuțe mici) stau pe două coloane pe telefoanele înalte, ca să iasă mai mari
    const detailed = q.mode === 'figure' && q.choices.some((id) => q.options[id].v === 'cell-grid');
    // numerele lungi (patru cifre) n-ar încăpea în patru butoane pe un telefon îngust
    const wide = numericOptions(q) && q.choices.some((id) => q.options[id].text.length >= 4);
    answers.className = `fg-answers fg-answers--${q.mode}${detailed ? ' fg-answers--detailed' : ''}${wide ? ' fg-answers--wide' : ''}${strip ? ' fg-answers--strip' : ''}`;
    answers.style.setProperty('--n', String(buttons.length));
    answers.setAttribute('aria-busy', 'true');
    answers.replaceChildren(...[strip, ...buttons].filter(Boolean));
    const said = promptSpoken(q.prompt);
    live.textContent =
      q.mode === 'figure'
        ? `${said}${q.figure ? ` ${artName(q.figure)}.` : ''} Variante: ${options.map((o) => o.name).join('; ')}.`
        : q.figure && q.mode === 'compare'
          ? `${said} ${artName(q.figure)}. Compară ${sideText(q.left, ' plus ')} cu ${sideText(q.right, ' plus ')}.`
          : q.figure
            ? `${said} ${artName(q.figure)}. Plăcuțe: ${options.map((o) => o.name).join(', ')}.`
            : q.mode === 'choice'
          ? `${spoken(q.text)} fac?`
          : q.mode === 'compare'
            ? `Compară ${spoken(q.left)} cu ${spoken(q.right)}.`
            : `Ordonează ${q.dir === 'asc' ? 'crescător' : 'descrescător'}: ${q.numbers.join(', ')}.`;
  }

  function choose(i) {
    if (phase !== 'playing' || !enabled || !question || !buttons[i]) return;
    const q = question;
    const btn = buttons[i];
    if (q.mode !== 'sort') {
      finish(q.mode === 'compare' ? SIGNS[i] : q.choices[i], btn);
      return;
    }
    const value = tilesOf(q)[i];
    if (taps.includes(value)) return;
    taps.push(value);
    if (value !== q.answer[taps.length - 1]) {
      finish([...taps], btn);
      return;
    }
    const target = slots[taps.length - 1];
    fillSlot(target, q, value);
    target.classList.add('is-filled');
    btn.classList.add('is-used');
    if (taps.length === q.answer.length) finish([...taps], btn);
    else play('place');
  }

  function finish(given, btn) {
    enabled = false;
    const res = round.answer(given, elapsed - askedAt);
    question = null;
    boltBar = null;
    answers.setAttribute('aria-busy', 'true');
    if (res.correct) celebrate(res, btn);
    else miss(res, btn);
    after(res.pauseMs, () => nextQuestion());
  }

  /** O casetă a ordonării: numărul sau desenul plăcuței. */
  function fillSlot(el, q, value) {
    if (q.tiles) el.replaceChildren(tinyArt(q.options[value]));
    else el.textContent = String(value);
  }

  function reveal(q) {
    if (figure && q.solved) {
      figure.innerHTML = artHTML(q.solved);
      figure.classList.add('is-shown');
    }
    if (slot) {
      slot.textContent = String(q.answer);
      slot.classList.add('is-shown');
    }
    q.mode === 'sort' &&
      q.answer.forEach((v, i) => {
        fillSlot(slots[i], q, v);
        slots[i].classList.remove('is-filled');
        slots[i].classList.add('is-shown');
      });
  }

  function celebrate(res, btn) {
    reveal(res.question);
    btn.classList.add('is-correct');
    const before = alune;
    alune += res.alune;
    countUp(basketNum, alune, 450, before);
    burst(fx, btn);
    flyTo(fx, btn, basketNum, `+${res.alune}`, { gold: res.turbo });
    later(reduced ? 0 : 480, () => pop(basket, 'anim-pop'));
    if (res.speed) {
      const tier = config.speed.find((s) => s.id === res.speed);
      badge(fx, card, tier.label, { icon: res.speed === 'fulger' ? 'fulger' : null, cls: res.speed });
    }
    live.textContent = `Corect! ${cantitate(res.alune, 'alună', 'alune')}. Serie: ${res.streak}.`;
    play('hit', { step: res.streak - 1 });
    paintStreak(res.streak);
    paintProgress();
    if (res.milestone) {
      const { label, mult } = res.milestone;
      banner(fx, card, CHEERS[res.streak] ? `${label} ×${formatNumber(mult)}` : label, { turbo: res.milestone.turbo });
      play('combo');
      confetti({ count: 28 });
      react('sarbatoreste');
      live.textContent += ` ${CHEERS[res.streak] ?? label}`;
    }
  }

  function miss(res, btn) {
    const q = res.question;
    reveal(q);
    btn.classList.add('is-wrong');
    if (q.choices) buttons[q.choices.indexOf(q.answer)].classList.add('is-answer');
    if (q.mode === 'compare') buttons[SIGNS.indexOf(q.answer)].classList.add('is-answer');
    play('no');
    paintStreak(0);
    answers.classList.add('is-cooling');
    cooldown = { from: elapsed, ms: res.pauseMs };
    cool.classList.add('is-on');
    if (res.guarded) {
      coolText.textContent = 'Hopa, prea repede! Citește, apoi alege.';
      react('ganditoare');
    } else if (elapsed - spokeAt > 15000) {
      react('incurajeaza', pick(COMFORT));
    }
    live.textContent = `${res.guarded ? 'Prea repede. ' : ''}Răspunsul corect: ${spoken(answerText(q))}.`;
  }

  function paintStreak(streak) {
    const tier = streakTier(streak);
    streakCount.textContent = String(streak);
    streakMult.textContent = tier ? `×${formatNumber(tier.mult)}` : '';
    streakBox.classList.toggle('is-off', streak === 0);
    flame.style.setProperty('--flame', String(1 + 0.15 * (tier ? config.streak.indexOf(tier) + 1 : 0)));
    if (streak > 0) pop(streakCount, 'anim-tick');
    const on = streak >= TURBO_FROM;
    if (on !== turbo) {
      turbo = on;
      arena.classList.toggle('is-turbo', on);
      if (!on) play('powerdown');
    }
  }

  function paintProgress() {
    track.style.setProperty('--p', Math.min(1, alune / trackMax).toFixed(4));
    while (litStars < lvl.stars.length && alune >= lvl.stars[litStars]) {
      marks[litStars].querySelector('.c-star')?.classList.add('is-on');
      marks[litStars].classList.add('is-lit');
      play('star');
      litStars++;
    }
    const nuts = alune >= lvl.stars[1] ? 3 : alune >= lvl.stars[0] ? 2 : 1;
    if (nuts !== nutsShown) {
      nutsShown = nuts;
      basketArt.innerHTML = visualSVG({ v: 'alune', n: nuts });
    }
    if (best && !passedRecord && alune > best) {
      passedRecord = true;
      flag?.classList.add('is-passed');
      live.textContent += ' Ai depășit recordul!';
      later(reduced ? 0 : 500, () => {
        banner(fx, card, 'Record depășit!');
        play('win');
        confetti({ count: 50 });
      });
    }
  }

  /** Mascota își schimbă fața pentru o clipă; cu `text` apare și bula ei. */
  function react(mood, text = '') {
    buddy.innerHTML = visualSVG({ v: 'mascot', mood });
    if (text) {
      spokeAt = elapsed;
      say.textContent = text;
      say.classList.add('is-on');
    }
    clearTimeout(sayTimer);
    timers.delete(sayTimer);
    sayTimer = later(1500, () => {
      say.classList.remove('is-on');
      buddy.innerHTML = visualSVG({ v: 'mascot', mood: 'vesela' });
    });
  }

  // ——— pauza și finalul ———
  function pause() {
    if (phase !== 'playing') return;
    phase = 'paused';
    arena.classList.add('is-paused');
    const resumeBtn = h('button', { type: 'button', class: 'c-btn c-btn--primary c-btn--lg', 'data-testid': 'fg-resume', onClick: () => resume() }, 'Continuă');
    overlay.hidden = false;
    overlay.replaceChildren(
      h(
        'div',
        { class: 'fg-panel anim-bounce-in', 'data-testid': 'fg-paused' },
        h('div', { class: 'fg-panel__art', 'aria-hidden': 'true', html: visualSVG({ v: 'mascot', mood: 'ganditoare' }) }),
        h('h2', { class: 'fg-panel__title' }, 'Pauză'),
        h('p', { class: 'fg-panel__text' }, 'Ceasul stă pe loc. Continuă când ești gata.'),
        resumeBtn,
        h('a', { class: 'c-btn c-btn--ghost', href: `#/fulger/${topic}`, 'data-testid': 'fg-quit' }, 'Ieși din joc'),
      ),
    );
    resumeBtn.focus({ preventScroll: true });
    live.textContent = 'Pauză. Ceasul stă pe loc.';
  }

  function resume() {
    if (phase !== 'paused' || overlay.querySelector('.fg-go')) return;
    const word = h('div', { class: 'fg-go' }, 'START!');
    overlay.replaceChildren(h('div', { class: 'fg-panel fg-panel--bare' }, word));
    pop(word, 'is-slam');
    play('go');
    later(reduced ? 0 : 450, () => {
      if (phase !== 'paused') return;
      overlay.hidden = true;
      overlay.replaceChildren();
      arena.classList.remove('is-paused');
      phase = 'playing';
      last = performance.now();
      if (document.hidden) pause(); // pagina s-a ascuns chiar în timpul lui „START!”
    });
  }

  function timeUp() {
    phase = 'over';
    enabled = false;
    tasks = [];
    cooldown = null;
    elapsed = config.durationMs;
    paint();
    arena.classList.remove('is-final', 'is-turbo');
    arena.classList.add('is-over');
    answers.setAttribute('aria-busy', 'true');
    stamp(fx, 'TIMP!');
    play('buzzer');
    live.textContent = 'Timpul a expirat!';
    later(reduced ? 400 : 1100, () => onEnd(round.summary()));
  }

  function onKey(e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.target?.closest?.('input, textarea, select')) return;
    const onControl = Boolean(e.target?.closest?.('button, a, summary'));
    if (phase === 'ready' && e.key === 'Enter' && !onControl) {
      e.preventDefault();
      countdown();
    } else if (phase === 'paused' && e.key === 'Escape') {
      e.preventDefault();
      resume();
    } else if (phase === 'playing') {
      if (e.key === 'Escape') {
        e.preventDefault();
        pause();
        return;
      }
      let index = KEYS.indexOf(e.key);
      if (index < 0 && question?.mode === 'compare') index = SIGNS.indexOf(e.key);
      if (index >= 0 && index < buttons.length) {
        e.preventDefault();
        choose(index);
      }
    }
  }
  const onVisibility = () => {
    if (document.hidden) pause();
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);

  /** Pentru E2E (?debug=1): starea rundei și scurtături. */
  const debug = {
    state() {
      const q = question;
      return {
        phase,
        enabled,
        streak: round.streak,
        alune,
        turbo,
        remainingMs: Math.max(0, Math.round(config.durationMs - elapsed)),
        kind: q?.kind ?? null,
        mode: q?.mode ?? null,
        answerIndex: !q ? null : q.choices ? q.choices.indexOf(q.answer) : q.mode === 'compare' ? SIGNS.indexOf(q.answer) : null,
        wrongIndex: !q ? null : q.choices ? q.choices.findIndex((c) => c !== q.answer) : q.mode === 'compare' ? SIGNS.findIndex((s) => s !== q.answer) : tilesOf(q).findIndex((n) => n !== q.answer[0]),
        order: q?.mode === 'sort' ? q.answer.map((v) => tilesOf(q).indexOf(v)) : null,
        figure: Boolean(q?.figure),
        solved: Boolean(q?.solved),
        drawn: Boolean(q?.figure) && q?.mode !== 'figure',
        buttons: buttons.length,
      };
    },
    start: () => countdown(),
    force(kind) {
      if (phase === 'playing' && KINDS[kind]) nextQuestion(kind);
    },
    elapse(ms) {
      if (phase === 'playing') advance(ms);
    },
    setStreak(n) {
      round.setStreak(n);
      paintStreak(n);
    },
  };

  function destroy() {
    phase = 'over';
    cancelAnimationFrame(frame);
    for (const id of timers) clearTimeout(id);
    timers.clear();
    tasks = [];
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
  }

  paint();
  showReady();
  return { destroy, debug };
}
