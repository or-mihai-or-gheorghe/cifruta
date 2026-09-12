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
};

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

/** Cântă un sunet după nume (tap, place, done, level, win, yes, no). */
export function play(name) {
  if (!enabled || !NOTES[name]) return;
  try {
    ctx ??= new (window.AudioContext ?? window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    for (const note of NOTES[name]) tone(...note);
  } catch {
    /* fără audio (browser vechi, politici de redare): continuăm în liniște */
  }
}

export const soundEnabled = () => enabled;

export function setSoundEnabled(on) {
  enabled = on;
  setPref('sound', on ? 'on' : 'off');
  if (on) play('tap'); // confirmă că s-a pornit
}
