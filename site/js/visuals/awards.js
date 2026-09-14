// Medaliile și cupele Jocurilor fulger (vizualul `award`): medalia unei teme, de bronz, argint sau aur, cu emoji-ul temei în mijloc,
// și medaliile în plus pentru aceeași medalie la mai multe teme: două medalii suprapuse, trei pe o bară, cupa cu numărul temelor.
// Fără id-uri și fără `transform`: pozițiile se calculează, ca același desen să poată apărea de mai multe ori pe pagină.

import { EMOJI } from './emoji.js';
import { registerVisual, svgText } from './index.js';
import { C, emojiImage, has, st } from './palette.js';

const METALS = {
  bronz: { label: 'de bronz', main: C.medalBronz, dark: C.medalBronzDark, light: C.medalBronzLight },
  argint: { label: 'de argint', main: C.medalArgint, dark: C.medalArgintDark, light: C.medalArgintLight },
  aur: { label: 'de aur', main: C.medalAur, dark: C.medalAurDark, light: C.medalAurLight },
};
const FORMS = ['medalie', 'dublu', 'colectie', 'cupa'];

const r2 = (n) => Math.round(n * 100) / 100;
const metalOf = (p) => (Object.hasOwn(METALS, p.metal) ? METALS[p.metal] : METALS.aur);
const formOf = (p) => (FORMS.includes(p.form) ? p.form : 'medalie');

/** Steaua cu 5 colțuri, cu centrul (cx, cy) și raza exterioară r. */
function starPath(cx, cy, r) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 ? r * 0.45 : r;
    const a = ((-90 + i * 36) * Math.PI) / 180;
    return `${r2(cx + radius * Math.cos(a))} ${r2(cy + radius * Math.sin(a))}`;
  });
  return `M${points.join(' L')} Z`;
}

/** O medalie mică (pentru formele în plus): panglica dreaptă, albastră și roșie, marginea, fața, luciul și o stea. */
function smallMedal(cx, cy, r, top, m) {
  const w = r2(r * 0.4);
  const bottom = r2(cy - r + 4);
  return (
    `<rect x="${r2(cx - w)}" y="${top}" width="${w}" height="${r2(bottom - top)}" fill="${C.blue}" ${st(1.5)}/>` +
    `<rect x="${cx}" y="${top}" width="${w}" height="${r2(bottom - top)}" fill="${C.red}" ${st(1.5)}/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${m.dark}" ${st(2)}/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r2(r * 0.78)}" fill="${m.main}"/>` +
    `<path d="M${r2(cx - r * 0.55)} ${r2(cy - r * 0.1)} A${r2(r * 0.6)} ${r2(r * 0.6)} 0 0 1 ${r2(cx - r * 0.05)} ${r2(cy - r * 0.6)}" fill="none" stroke="${m.light}" stroke-width="${r2(r * 0.14)}" stroke-linecap="round" opacity=".85"/>` +
    `<path d="${starPath(cx, cy + r * 0.05, r * 0.42)}" fill="${m.light}" ${st(1.2)}/>`
  );
}

const DRAW = {
  medalie: (m, p) => {
    const center = has(p.icon) && EMOJI[p.icon] ? emojiImage(p.icon, 35, 49, 30) : `<path d="${starPath(50, 65, 14)}" fill="${m.light}" ${st(1.5)}/>`;
    return `<path d="M27 3 H43 L59 44 H43 Z" fill="${C.blue}" ${st(2)}/><path d="M73 3 H57 L41 44 H57 Z" fill="${C.red}" ${st(2)}/>
      <circle cx="50" cy="64" r="32" fill="${m.dark}" ${st(2.5)}/>
      <circle cx="50" cy="64" r="26" fill="${m.main}"/>
      <circle cx="50" cy="64" r="29" fill="none" stroke="${m.light}" stroke-width="1.6" stroke-dasharray="2 3"/>
      <path d="M30 56 A21 21 0 0 1 52 43" fill="none" stroke="${m.light}" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>
      ${center}`;
  },
  dublu: (m) => smallMedal(36, 46, 22, 3, m) + smallMedal(64, 70, 22, 22, m),
  colectie: (m) =>
    `<rect x="8" y="5" width="84" height="11" rx="5.5" fill="${C.red}" ${st(2)}/><rect x="10" y="8.5" width="80" height="4" fill="${C.blue}"/>` +
    smallMedal(25, 55, 16, 15, m) +
    smallMedal(75, 55, 16, 15, m) +
    smallMedal(50, 64, 20, 15, m),
  cupa: (m, p) => {
    const handle = (d) => `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${m.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
    return `${handle('M29 22 C13 22 13 45 33 47')}${handle('M71 22 C87 22 87 45 67 47')}
      <path d="M28 14 H72 V34 C72 52 62 62 50 62 C38 62 28 52 28 34 Z" fill="${m.main}" ${st(2.5)}/>
      <rect x="24" y="10" width="52" height="8" rx="2" fill="${m.dark}" ${st(2)}/>
      <path d="M36 23 C35 34 38 44 44 50" fill="none" stroke="${m.light}" stroke-width="3" stroke-linecap="round" opacity=".85"/>
      <path d="${starPath(51, 36, 9)}" fill="${m.light}" ${st(1.2)}/>
      <path d="M45 62 H55 L57 72 H43 Z" fill="${m.dark}" ${st(2)}/>
      <rect x="30" y="72" width="40" height="8" rx="2" fill="${m.main}" ${st(2)}/>
      <rect x="24" y="80" width="52" height="14" rx="3" fill="${C.brown}" ${st(2)}/>
      ${has(p.n) ? `<rect x="40" y="82" width="20" height="10" rx="2" fill="${C.white}" ${st(1.5)}/>${svgText(50, 87.5, String(p.n), { size: 9 })}` : ''}`;
  },
};

registerVisual('award', {
  group: 'Medalii și cupe',
  defaults: { metal: 'aur', form: 'medalie' },
  label: (p) => {
    const m = metalOf(p);
    const form = formOf(p);
    if (form === 'dublu') return `două medalii ${m.label}`;
    if (form === 'colectie') return `trei medalii ${m.label}`;
    if (form === 'cupa') return `cupă ${m.label}${has(p.n) ? ` cu numărul ${p.n}` : ''}`;
    return `medalie ${m.label}${has(p.icon) && EMOJI[p.icon] ? ` cu ${EMOJI[p.icon].label}` : ''}`;
  },
  check: (p) =>
    [
      !Object.hasOwn(METALS, p.metal) && `metal necunoscut: ${p.metal}`,
      !FORMS.includes(p.form) && `formă necunoscută: ${p.form}`,
      has(p.icon) && !EMOJI[p.icon] && `emoji necunoscut: ${p.icon}`,
    ].filter(Boolean),
  render: (p) => DRAW[formOf(p)](metalOf(p), p),
  demos: [
    { metal: 'bronz', icon: 'calcul' },
    { metal: 'argint', icon: 'puzzle' },
    { metal: 'aur', icon: 'robot' },
    { metal: 'bronz', form: 'dublu' },
    { metal: 'argint', form: 'colectie' },
    { metal: 'aur', form: 'cupa', n: 5 },
  ],
});
