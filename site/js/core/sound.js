// Sunete scurte, sintetizate în browser (WebAudio, fără fișiere). Pornesc doar după un gest al copilului
// și pot fi oprite din antet; preferința stă în localStorage (cifruta:sound). Fără sunet, site-ul merge la fel.

import { prefersReducedMotion } from './dom.js';
import { getPref, setPref } from './storage.js';

// [frecvență Hz, început s, durată s, formă, volum, alunecare spre Hz]
const NOTES = {
  tap: [[520, 0, 0.06, 'triangle', 0.05]],
  place: [[392, 0, 0.08], [523, 0.07, 0.1]],
  done: [[659, 0, 0.09], [880, 0.09, 0.16]],
  level: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.22]],
  win: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.32]],
  yes: [[660, 0, 0.1], [990, 0.1, 0.18]],
  no: [[220, 0, 0.22, 'sine', 0.08, 160]],
  // Calcul fulger
  ready: [[392, 0, 0.14, 'triangle', 0.08]],
  go: [[784, 0, 0.1, 'triangle', 0.09], [1047, 0.1, 0.24, 'triangle', 0.09]],
  hit: [[659, 0, 0.08, 'triangle', 0.07]],
  star: [[1319, 0, 0.08, 'sine', 0.07], [1760, 0.08, 0.16, 'sine', 0.06]],
  combo: [[523, 0, 0.07], [659, 0.06, 0.07], [784, 0.12, 0.07], [1047, 0.18, 0.18]],
  powerdown: [[660, 0, 0.32, 'sine', 0.07, 220]],
  tick: [[880, 0, 0.05, 'triangle', 0.06]],
  buzzer: [[392, 0, 0.16, 'triangle', 0.1], [262, 0.16, 0.34, 'triangle', 0.1]],
};

// `step` urcă sunetul pe o scară pentatonică de cel mult o octavă (seria din Calcul fulger sună tot mai sus, fără să devină stridentă)
const PENTATONIC = [0, 2, 4, 7, 9, 12];

let ctx = null;
const saved = getPref('sound', null);
let enabled = saved ? saved === 'on' : !prefersReducedMotion(); // implicit oprit la mișcare redusă

function tone(freq, at, dur, type = 'sine', gain = 0.11, slideTo) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  vol.gain.setValueAtTime(0.0001, t);
  vol.gain.exponentialRampToValueAtTime(gain, t + 0.005); // atac scurt, fără pocnet
  vol.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(vol).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Cântă un sunet după nume (tap, place, done, level, win, yes, no; în Calcul fulger și ready, go, hit, star, combo, powerdown, tick, buzzer). */
export function play(name, { step = 0 } = {}) {
  if (!enabled || !NOTES[name]) return;
  try {
    ctx ??= new (window.AudioContext ?? window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const k = 2 ** (PENTATONIC[Math.min(Math.max(0, step), PENTATONIC.length - 1)] / 12);
    for (const [freq, at, dur, type, gain, slideTo] of NOTES[name]) tone(freq * k, at, dur, type, gain, slideTo && slideTo * k);
  } catch {
    /* fără audio (browser vechi, politici de redare): continuăm în liniște */
  }
}

export const soundEnabled = () => enabled;

/** Pornește sunetul chiar în timpul unui gest (clic, ridicarea degetului): Safari pe iOS nu pornește audio din alte momente. */
export function unlockSound() {
  if (!enabled) return;
  try {
    ctx ??= new (window.AudioContext ?? window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    /* fără audio */
  }
}

export function setSoundEnabled(on) {
  enabled = on;
  setPref('sound', on ? 'on' : 'off');
  if (on) play('tap'); // confirmă că s-a pornit
}
