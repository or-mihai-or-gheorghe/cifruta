// Mascota originală „Veverița Cifruța” și iconițele nivelurilor.

import { registerVisual } from './index.js';
import { C, num, st, txt } from './palette.js';

const GROUP = 'Mascotă și niveluri';
const MOODS = {
  vesela: 'zâmbește',
  ganditoare: 'se gândește',
  sarbatoreste: 'sărbătorește',
  incurajeaza: 'te încurajează',
};

// Părțile care se mișcă stau în grupuri `v-mascot__…`, fără atribut `transform` (regula din CLAUDE.md); mișcarea lor se pornește
// din CSS, doar în containerele mari (`--mascot-play`, site/css/05-visuals.css). Detaliile fine (mustăți, sprâncene, degete) stau
// în `v-mascot__fine`, ascuns la mărimile mici, unde ar deveni o pată.

const eye = (x, dx = 0, dy = 0) =>
  `<g class="v-mascot__eye"><circle cx="${x + dx}" cy="${42 + dy}" r="4.5" fill="${C.ink}"/>` +
  `<circle cx="${x + dx + 1.5}" cy="${40.5 + dy}" r="1.7" fill="${C.white}"/>` +
  `<circle cx="${x + dx - 1.7}" cy="${43.8 + dy}" r="0.9" fill="${C.white}" opacity=".6"/></g>`;
const happyEye = (x) => `<path d="M${x - 4.5} 43 Q${x} 37 ${x + 4.5} 43" fill="none" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round"/>`;
const paw = (x, y) =>
  `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="4.5" fill="${C.orange}" ${st(2)}/>` +
  `<g class="v-mascot__fine"><path d="M${x - 2} ${y - 2.8} V${y - 0.4} M${x + 2} ${y - 2.8} V${y - 0.4}" fill="none" stroke="${C.orangeDark}" stroke-width="1.4" stroke-linecap="round"/></g>`;
const nut = (x, y) =>
  `<g class="v-mascot__nut"><ellipse cx="${x}" cy="${y}" rx="8" ry="9" fill="${C.brown}" ${st(2)}/>` +
  `<path d="M${x - 8} ${y - 3} C${x - 7} ${y - 12} ${x + 7} ${y - 12} ${x + 8} ${y - 3} C${x + 3} ${y - 5} ${x - 3} ${y - 5} ${x - 8} ${y - 3} Z" fill="${C.brownLight}" ${st(1.5)}/>` +
  `<ellipse cx="${x - 3}" cy="${y + 2.5}" rx="1.6" ry="2.8" fill="${C.white}" opacity=".3"/></g>`;

// coada, cu două smocuri; urechile, fiecare cu ancora ei; corpul, care respiră (tălpile rămân pe loc)
const TAIL = `
  <g class="v-mascot__tail">
    <path d="M62 106 C94 110 116 88 112 60 C109 36 94 20 78 24 C64 28 60 40 68 48 C74 56 88 54 90 66 C92 80 80 90 62 88 Z" fill="${C.orangeDark}" ${st(2.5)}/>
    <path d="M72 98 C94 98 106 82 104 62 C102 46 92 34 80 34" fill="none" stroke="${C.orange}" stroke-width="6" stroke-linecap="round"/>
    <g class="v-mascot__fine"><path d="M84 95 C89 91 91 86 90 81 M102 81 C105 75 105 69 103 64" fill="none" stroke="${C.orange}" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>
  </g>`;
const EARS = `
  <g class="v-mascot__ear v-mascot__ear--l">
    <path d="M31 36 C24 22 27 10 34 7 C41 13 43 24 41 31 Z" fill="${C.orange}" ${st(2.5)}/>
    <path d="M34 28 C31 21 32 15 35 12 C38 16 39 22 38 26 Z" fill="${C.pink}"/>
    <path d="M34 7 C32 3 35 1 38 3" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="v-mascot__ear v-mascot__ear--r">
    <path d="M69 36 C76 22 73 10 66 7 C59 13 57 24 59 31 Z" fill="${C.orange}" ${st(2.5)}/>
    <path d="M66 28 C69 21 68 15 65 12 C62 16 61 22 62 26 Z" fill="${C.pink}"/>
    <path d="M66 7 C68 3 65 1 62 3" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>
  </g>`;
const BODY = `
  <ellipse cx="41" cy="108" rx="10" ry="5" fill="${C.orangeDark}" ${st(2)}/><ellipse cx="61" cy="108" rx="10" ry="5" fill="${C.orangeDark}" ${st(2)}/>
  <g class="v-mascot__body">
    <ellipse cx="51" cy="84" rx="25" ry="24" fill="${C.orange}" ${st(2.5)}/>
    <ellipse cx="51" cy="90" rx="15" ry="16" fill="${C.cream}"/>
    <path d="M38 80 Q43 73.5 47 79 Q51 73 55 79 Q59 73.5 64 80 Q51 87 38 80 Z" fill="${C.white}" opacity=".45"/>
    <ellipse cx="51" cy="69" rx="17" ry="5.5" fill="${C.orangeDark}" opacity=".3"/>
  </g>`;
// sprâncene, mustăți și linia botului: se văd de la ~4,5rem în sus
const FINE = `
  <g class="v-mascot__fine">
    <path d="M35.5 33.5 Q41 30.5 46 33 M64.5 33.5 Q59 30.5 54 33" fill="none" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
    <path d="M33 53 L21 51 M33 57 L20.5 58.5 M67 53 L79 51 M67 57 L79.5 58.5" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
    <path d="M50 53 V55.5" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
  </g>`;
/** Capul, cu urechile și fața dată (ochi, dinți, gură): tot ce se înclină odată cu el. */
const head = (face) => `
  <g class="v-mascot__head">${EARS}
    <circle cx="50" cy="46" r="25" fill="${C.orange}" ${st(2.5)}/>
    <ellipse cx="50" cy="56" rx="13" ry="10" fill="${C.cream}"/>
    <circle cx="32" cy="54" r="4.5" fill="${C.pink}" opacity=".85"/><circle cx="68" cy="54" r="4.5" fill="${C.pink}" opacity=".85"/>
    <ellipse cx="50" cy="50" rx="4" ry="3" fill="${C.ink}"/>
    ${FINE}${face}
  </g>`;

/** Un confetti: dreptunghiul rotit se coace în colțuri, ca desenul să n-aibă niciun atribut `transform`. */
function confettiPiece([x, y, fill, deg]) {
  const [cx, cy, r] = [x + 3.5, y + 2, (deg * Math.PI) / 180];
  const points = [[-3.5, -2], [3.5, -2], [3.5, 2], [-3.5, 2]]
    .map(([px, py]) => `${(cx + px * Math.cos(r) - py * Math.sin(r)).toFixed(1)},${(cy + px * Math.sin(r) + py * Math.cos(r)).toFixed(1)}`)
    .join(' ');
  return `<polygon class="v-mascot__confetti" points="${points}" fill="${fill}"/>`;
}

registerVisual('mascot', {
  group: GROUP,
  defaults: { mood: 'vesela' },
  viewBox: '0 0 120 120',
  label: (p) => `Veverița Cifruța ${MOODS[p.mood] ?? MOODS.vesela}`,
  render: (p) => {
    const mood = MOODS[p.mood] ? p.mood : 'vesela';
    const teeth = `<rect x="47.5" y="57" width="5" height="5" rx="1" fill="${C.white}" stroke="${C.ink}" stroke-width="1"/>`;
    const smile = `<path d="M43 55 Q46.5 59 50 55.5 Q53.5 59 57 55" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`;

    if (mood === 'vesela') {
      return `${TAIL}${BODY}${head(`${eye(41)}${eye(59)}${teeth}${smile}`)}${nut(51, 80)}${paw(41, 82)}${paw(61, 82)}`;
    }
    if (mood === 'ganditoare') {
      const mouth = `<path d="M45 57.5 Q50 56 55 57.5" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`;
      return `${TAIL}${BODY}${head(`${eye(41, -1.5, -2)}${eye(59, -1.5, -2)}${teeth}${mouth}`)}
        ${nut(46, 82)}${paw(38, 84)}${paw(62, 64)}
        <g class="v-mascot__think">
          <circle cx="76" cy="16" r="2.5" fill="${C.white}" ${st(1.5)}/><circle cx="85" cy="11" r="3.5" fill="${C.white}" ${st(1.5)}/>
          <ellipse cx="104" cy="13" rx="14" ry="11" fill="${C.white}" ${st(2)}/>${txt(104, 14, '?', { size: 15, weight: 800 })}
        </g>`;
    }
    if (mood === 'sarbatoreste') {
      const confetti = [
        [12, 16, C.yellow, 20], [98, 8, C.blue, -25], [20, 80, C.green, 40], [8, 50, C.purple, -10],
        [30, 4, C.pink, 60], [106, 104, C.yellow, 15], [90, 18, C.green, 50], [14, 104, C.blue, -35],
      ].map(confettiPiece).join('');
      const face = `${happyEye(41)}${happyEye(59)}
        <path d="M43 55 Q50 68 57 55 Z" fill="${C.ink}"/><path d="M46.5 60 Q50 64.5 53.5 60 Z" fill="${C.pink}"/>`;
      return `${confetti}${TAIL}
        <path d="M34 76 L22 58 M68 76 L80 58" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M34 76 L22 58 M68 76 L80 58" stroke="${C.orange}" stroke-width="5" stroke-linecap="round"/>
        ${BODY}${head(face)}${paw(22, 56)}${paw(80, 56)}`;
    }
    // incurajeaza
    const mouth = `<path d="M42 55 Q50 64 58 55" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
    return `${TAIL}${BODY}${head(`${happyEye(41)}${eye(59)}${teeth}${mouth}`)}
      <g class="v-mascot__wave">
        <path d="M70 84 L84 66" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/><path d="M70 84 L84 66" stroke="${C.orange}" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="85" cy="63" rx="6" ry="7" fill="${C.orange}" ${st(2)}/>
        <path d="M85 56 V50" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="M85 56 V50" stroke="${C.orange}" stroke-width="3.5" stroke-linecap="round"/>
      </g>
      ${nut(46, 82)}${paw(38, 84)}
      <g class="v-mascot__spark"><path d="M100 44 L102.5 50 L109 50.5 L104 54.5 L105.5 61 L100 57.5 L94.5 61 L96 54.5 L91 50.5 L97.5 50 Z" fill="${C.yellow}" ${st(1.5)}/></g>`;
  },
  demos: Object.keys(MOODS).map((mood) => ({ mood })),
});

const LEVELS = {
  usor: {
    label: 'nivel ușor',
    bg: 'var(--v-lvl-usor, #D6ECFF)',
    draw: () => `
      <path d="M50 72 V50" stroke="${C.greenDark}" stroke-width="4" stroke-linecap="round"/>
      <path d="M50 56 C40 44 28 46 24 52 C32 60 44 60 50 56 Z" fill="${C.green}" ${st(2)}/>
      <path d="M50 50 C58 36 72 36 76 42 C70 52 58 54 50 50 Z" fill="${C.green}" ${st(2)}/>
      <path d="M24 80 C30 68 70 68 76 80 Z" fill="${C.brown}" ${st(2.5)}/>`,
  },
  intermediar: {
    label: 'nivel intermediar',
    bg: 'var(--v-lvl-intermediar, #E8DEFF)',
    draw: () => `
      <path d="M50 76 V20" stroke="${C.greenDark}" stroke-width="4" stroke-linecap="round"/>
      <path d="M50 66 C40 54 28 56 22 62 C30 70 42 70 50 66 Z M50 56 C60 44 72 46 78 52 C70 60 58 60 50 56 Z M50 42 C42 30 30 32 26 38 C32 46 44 46 50 42 Z M50 32 C58 20 70 22 74 28 C68 36 56 36 50 32 Z" fill="${C.green}" ${st(2)}/>
      <path d="M50 22 C46 14 48 8 52 6 C56 10 56 16 50 22 Z" fill="${C.green}" ${st(2)}/>
      <path d="M26 84 C32 72 68 72 74 84 Z" fill="${C.brown}" ${st(2.5)}/>`,
  },
  avansat: {
    label: 'nivel avansat',
    bg: 'var(--v-lvl-avansat, #DCDDF7)',
    draw: () => `
      <path d="M44 86 L46 58 L54 58 L56 86 Z" fill="${C.brown}" ${st(2.5)}/>
      <path d="M50 14 C64 14 72 24 72 34 C82 38 84 54 74 60 C70 68 58 68 50 64 C42 68 30 68 26 60 C16 54 18 38 28 34 C28 24 36 14 50 14 Z" fill="${C.green}" ${st(2.5)}/>
      <circle cx="40" cy="40" r="4" fill="${C.red}" ${st(1.5)}/><circle cx="60" cy="34" r="4" fill="${C.red}" ${st(1.5)}/><circle cx="58" cy="54" r="4" fill="${C.red}" ${st(1.5)}/>`,
  },
};

registerVisual('level-icon', {
  group: GROUP,
  defaults: { level: 'usor' },
  label: (p) => (LEVELS[p.level] ?? LEVELS.usor).label,
  render: (p) => {
    const lvl = LEVELS[p.level] ?? LEVELS.usor;
    return `<circle cx="50" cy="50" r="46" fill="${lvl.bg}" ${st(2.5)}/>${lvl.draw()}`;
  },
  demos: Object.keys(LEVELS).map((level) => ({ level })),
});

// Alunele din Calcul fulger (coșul, particulele, totalul): 1–3 alune, desenate ca aluna din lăbuțele mascotei.
const bigNut = (x, y, s) =>
  `<ellipse cx="${x}" cy="${y}" rx="${8 * s}" ry="${9 * s}" fill="${C.brown}" ${st(2.5)}/>` +
  `<path d="M${x - 8 * s} ${y - 3 * s} C${x - 7 * s} ${y - 12 * s} ${x + 7 * s} ${y - 12 * s} ${x + 8 * s} ${y - 3 * s} C${x + 3 * s} ${y - 5 * s} ${x - 3 * s} ${y - 5 * s} ${x - 8 * s} ${y - 3 * s} Z" fill="${C.brownLight}" ${st(2.5)}/>` +
  `<ellipse cx="${x - 3 * s}" cy="${y + 2 * s}" rx="${1.6 * s}" ry="${2.8 * s}" fill="${C.white}" opacity=".35"/>`;
const NUT_PILES = {
  1: [[50, 58, 3.6]],
  2: [[33, 62, 2.4], [67, 58, 2.4]],
  3: [[50, 46, 2.1], [28, 68, 2.1], [72, 68, 2.1]],
};
const nutCount = (p) => Math.min(3, Math.max(1, Math.round(num(p.n, 1))));

registerVisual('alune', {
  group: GROUP,
  defaults: { n: 1 },
  label: (p) => (nutCount(p) === 1 ? 'o alună' : `${nutCount(p)} alune`),
  render: (p) => NUT_PILES[nutCount(p)].map(([x, y, s]) => bigNut(x, y, s)).join(''),
  demos: [{ n: 1 }, { n: 2 }, { n: 3 }],
});
