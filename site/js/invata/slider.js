// Învață: glisorul, orizontal sau vertical, desenat ca o riglă. Sub el stă un <input type="range"> nativ, ascuns vizual: focusul,
// tastatura și cititoarele de ecran merg prin el (VoiceOver și TalkBack îl schimbă nativ), iar pista desenată primește degetul și
// mouse-ul. Gradațiile 1…count stau la mijlocul căsuțelor desenului de lângă el (js/invata/ruler.js).
// În timpul tragerii, `onInput` doar previzualizează; `onCommit` vine la ridicarea degetului, la o tastă sau la o atingere: abia
// atunci se verifică provocările (trecerea de la 2 la 8 nu rezolvă din greșeală „4”).

import { h } from '../core/dom.js';
import { play } from '../core/sound.js';
import { keyStep, valueAt } from './ruler.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * @param {object} o
 * @param {string} o.id           numele valorii („rows”); testid-ul e `iv-slider-<id>`
 * @param {string} o.label        numele pentru cititorul de ecran („Rânduri”)
 * @param {number} o.min, o.max   intervalul care se poate alege
 * @param {number} [o.count]      câte gradații are rigla (implicit `max`; cele din afara intervalului apar stinse)
 * @param {boolean} [o.vertical]  valorile cresc în jos, iar săgețile merg după direcția de pe ecran
 * @param {(v: number) => string} [o.valueText]  textul citit („3 rânduri”)
 * @param {[string, string]} [o.steppers]        butoane − și + la capete, cu numele lor
 * @param {string} [o.tone]       culoarea: `rows`, `cols` sau `cut`
 */
export function slider({ id, label, min, max, count = max, value, vertical = false, valueText = String, steppers = null, tone = 'cols', onInput, onCommit }) {
  let lo = min;
  let hi = max;
  let current = value;
  let dragging = null;
  let lastSound = 0;

  const input = h('input', { type: 'range', class: 'u-visually-hidden', min: lo, max: hi, step: 1, value: current, 'aria-label': label });
  const num = h('span', { class: 'iv-slider__num' }, String(current));
  const ticks = Array.from({ length: count }, (_, i) => h('li', {}, String(i + 1)));
  const track = h(
    'div',
    { class: 'iv-slider__track', 'aria-hidden': 'true' },
    h('span', { class: 'iv-slider__fill' }),
    h('ol', { class: 'iv-slider__ticks' }, ticks),
    h('span', { class: 'iv-slider__thumb' }, num),
  );
  const step = (delta, sign) =>
    h('button', { type: 'button', class: 'c-btn c-btn--icon iv-slider__step', tabindex: '-1', 'aria-hidden': 'true', title: steppers[delta > 0 ? 1 : 0], onClick: () => change(current + delta, true) }, sign);
  const el = h(
    'div',
    { class: `iv-slider iv-slider--${vertical ? 'v' : 'h'}`, 'data-testid': `iv-slider-${id}`, 'data-tone': tone },
    steppers ? step(-1, '−') : null,
    track,
    steppers ? step(1, '+') : null,
    input,
  );

  function paint() {
    input.min = lo;
    input.max = hi;
    input.value = current;
    input.setAttribute('aria-valuetext', valueText(current));
    num.textContent = String(current);
    el.style.setProperty('--value', current);
    el.style.setProperty('--count', count);
    ticks.forEach((li, i) => li.classList.toggle('is-off', i + 1 < lo || i + 1 > hi));
    for (const b of el.querySelectorAll('.iv-slider__step')) b.disabled = b.textContent === '−' ? current <= lo : current >= hi;
  }

  function sound() {
    const now = performance.now();
    if (now - lastSound < 60) return;
    lastSound = now;
    play('tap', { step: Math.round(((current - 1) / Math.max(1, count - 1)) * 5) });
  }

  /** Schimbă valoarea; `commit` = gest încheiat (tastă, atingere, deget ridicat). */
  function change(v, commit) {
    const next = clamp(v, lo, hi);
    if (next !== current) {
      current = next;
      paint();
      sound();
      onInput?.(current);
    }
    if (commit) onCommit?.(current);
  }

  function follow(e) {
    const r = track.getBoundingClientRect();
    const offset = vertical ? e.clientY - r.top : e.clientX - r.left;
    change(valueAt(offset, vertical ? r.height : r.width, count, lo, hi), false);
  }

  track.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button > 0) return;
    e.preventDefault();
    input.focus({ preventScroll: true });
    dragging = { pointerId: e.pointerId, start: current };
    track.setPointerCapture?.(e.pointerId);
    el.classList.add('is-dragging');
    follow(e);
  });
  track.addEventListener('pointermove', (e) => {
    if (dragging?.pointerId === e.pointerId) follow(e);
  });
  track.addEventListener('pointerup', (e) => {
    if (dragging?.pointerId !== e.pointerId) return;
    follow(e);
    dragging = null;
    el.classList.remove('is-dragging');
    onCommit?.(current);
  });
  // gestul întrerupt (pagina a preluat degetul, alt deget, fereastra a pierdut focusul): valoarea se întoarce
  const cancel = (e) => {
    if (dragging?.pointerId !== e.pointerId) return;
    const back = dragging.start;
    dragging = null;
    el.classList.remove('is-dragging');
    change(back, false);
  };
  track.addEventListener('pointercancel', cancel);
  track.addEventListener('lostpointercapture', cancel);

  input.addEventListener('keydown', (e) => {
    const delta = keyStep(e.key, vertical);
    if (!delta) return;
    e.preventDefault();
    change(delta === Infinity ? hi : delta === -Infinity ? lo : current + delta, true);
  });
  // schimbările care nu vin din tastatură (cititoarele de ecran pe telefon)
  input.addEventListener('input', () => change(input.valueAsNumber, true));

  paint();
  return {
    el,
    input,
    get: () => current,
    /** Valoarea venită din altă parte (o atingere pe desen, „Întoarce”), fără sunet și fără anunț. */
    set(v) {
      current = clamp(v, lo, hi);
      paint();
    },
    setRange(newMin, newMax) {
      [lo, hi] = [newMin, newMax];
      current = clamp(current, lo, hi);
      paint();
    },
  };
}
