// Peisaje mici (bannere) pentru cardurile testelor.

import { registerVisual } from './index.js';
import { C, st, txt } from './palette.js';

const GROUP = 'Peisaje';

// Părțile care se mișcă (raze, nori, barcă, rachetă, firmă, copac) stau în grupuri cu clasă, animate din CSS.
// Grupul care se rotește nu are copii cu atributul `transform` (razele sunt calculate), altfel Chromium le strică.
const sunRays = (cx, cy, r) =>
  `<g class="v-scene__rays">${Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const [sx, cy1] = [Math.sin(a), -Math.cos(a)];
    return `<line x1="${(cx + (r + 4) * sx).toFixed(1)}" y1="${(cy + (r + 4) * cy1).toFixed(1)}" x2="${(cx + (r + 11) * sx).toFixed(1)}" y2="${(cy + (r + 11) * cy1).toFixed(1)}" stroke="${C.orange}" stroke-width="3.5" stroke-linecap="round"/>`;
  }).join('')}</g>` +
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.yellow}" ${st(2)}/>`;

const cloud = (x, y, s = 1) =>
  `<g class="v-scene__cloud"><path transform="translate(${x} ${y}) scale(${s})" d="M6 20 C0 20 0 10 8 10 C8 2 20 0 24 7 C28 0 42 2 40 12 C48 12 48 20 42 20 Z" fill="${C.white}" ${st(2)}/></g>`;

const SCENES = {
  mare: {
    label: 'marea și plaja',
    draw: () => `
      <rect width="300" height="120" fill="${C.sky}"/>
      ${sunRays(254, 30, 15)}${cloud(40, 18)}${cloud(150, 8, 0.8)}
      <path d="M0 62 C20 56 40 68 60 62 C80 56 100 68 120 62 C140 56 160 68 180 62 C200 56 220 68 240 62 C260 56 280 68 300 62 V96 H0 Z" fill="${C.blue}"/>
      <path d="M0 74 C20 70 40 78 60 74 C80 70 100 78 120 74 C140 70 160 78 180 74 C200 70 220 78 240 74 C260 70 280 78 300 74" fill="none" stroke="${C.white}" stroke-width="2" opacity=".6"/>
      <g class="v-scene__boat">
        <line x1="168" y1="66" x2="168" y2="36" stroke="${C.ink}" stroke-width="2"/>
        <path d="M170 38 L170 62 L188 62 Z" fill="${C.white}" ${st(2)}/>
        <path d="M150 66 H188 L181 77 H157 Z" fill="${C.red}" ${st(2)}/>
      </g>
      <path d="M0 94 C60 84 140 100 200 90 C240 86 280 88 300 92 V120 H0 Z" fill="${C.yellow}"/>
      <line x1="62" y1="80" x2="68" y2="114" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M32 86 C38 66 84 62 94 78 Z" fill="${C.red}" ${st(2)}/>
      <path d="M48 81 C54 70 66 67 72 72 L63 78 Z" fill="${C.white}" opacity=".8"/>
      <path d="M226 108 C226 96 244 96 244 108 Z" fill="${C.pink}" ${st(2)}/>
      <path d="M235 97 V108 M230 99 L232 108 M240 99 L238 108" stroke="${C.pinkDark}" stroke-width="1.5"/>`,
  },
  piata: {
    label: 'piața',
    draw: () => {
      const scallops = Array.from({ length: 12 }, (_, i) => `Q${45.5 + i * 19} 52 ${55 + i * 19} 40`).join(' ');
      const stripes = Array.from({ length: 6 }, (_, i) => `<rect x="${55 + i * 38}" y="26" width="19" height="14" fill="${C.white}"/>`).join('');
      const fruits = [
        ...[70, 82, 94, 76, 88].map((x, i) => `<circle cx="${x}" cy="${i < 3 ? 64 : 56}" r="6.5" fill="${C.red}" ${st(1.8)}/>`),
        ...[130, 142, 136].map((x, i) => `<ellipse cx="${x}" cy="${i < 2 ? 63 : 55}" rx="5.5" ry="7" fill="${C.yellow}" ${st(1.8)}/>`),
        `<ellipse cx="190" cy="60" rx="16" ry="11" fill="${C.green}" ${st(2)}/><path d="M178 56 C186 60 194 60 202 56 M180 64 C188 66 194 66 200 64" fill="none" stroke="${C.greenDark}" stroke-width="2"/>`,
        ...[226, 238, 232].map((x, i) => `<circle cx="${x}" cy="${i < 2 ? 64 : 56}" r="6" fill="${C.orange}" ${st(1.8)}/>`),
      ].join('');
      return `
        <rect width="300" height="120" fill="${C.sky}"/>
        <rect y="100" width="300" height="20" fill="${C.grayLight}"/>
        <rect x="46" y="36" width="6" height="66" fill="${C.brown}" ${st(1.5)}/><rect x="248" y="36" width="6" height="66" fill="${C.brown}" ${st(1.5)}/>
        <rect x="36" y="26" width="228" height="14" fill="${C.red}" ${st(2)}/>${stripes}
        <path d="M36 40 ${scallops} Z" fill="${C.red}" ${st(2)}/>
        <g class="v-scene__sign"><rect x="118" y="4" width="64" height="18" rx="5" fill="${C.yellow}" ${st(2)}/>${txt(150, 13, 'PIAȚA', { size: 11, weight: 800 })}</g>
        ${fruits}
        <rect x="40" y="70" width="220" height="10" rx="3" fill="${C.brownLight}" ${st(2)}/>
        <rect x="52" y="80" width="196" height="20" fill="${C.brown}" ${st(2)}/>`;
    },
  },
  spatiu: {
    label: 'spațiul cu o rachetă și planete',
    draw: () => {
      const stars = [[20, 20], [70, 12], [110, 36], [200, 14], [280, 24], [260, 100], [130, 104], [30, 60], [180, 90], [96, 80], [230, 48]]
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 2.2 : 1.4}" fill="${i % 2 ? C.white : C.yellow}"/>`).join('');
      return `
        <rect width="300" height="120" fill="var(--v-space, #2B2552)"/><g class="v-scene__stars">${stars}</g>
        <circle cx="40" cy="30" r="15" fill="${C.grayLight}"/><circle cx="47" cy="25" r="13" fill="var(--v-space, #2B2552)"/>
        <ellipse cx="244" cy="72" rx="36" ry="9" fill="none" stroke="${C.yellow}" stroke-width="4"/>
        <circle cx="244" cy="70" r="21" fill="${C.orange}" ${st(2)}/>
        <path d="M208 72 A36 9 0 0 0 280 72" fill="none" stroke="${C.yellow}" stroke-width="4"/>
        <circle cx="62" cy="94" r="12" fill="${C.teal}" ${st(2)}/>
        <g class="v-scene__rocket"><g transform="translate(150 58) rotate(40)">
          <path d="M-8 28 C-6 40 -3 44 0 50 C3 44 6 40 8 28 Z" fill="${C.orange}"/>
          <path d="M-12 12 L-22 30 L-12 26 Z M12 12 L22 30 L12 26 Z" fill="${C.red}" ${st(1.5)}/>
          <path d="M0 -34 C12 -24 16 -6 13 28 L-13 28 C-16 -6 -12 -24 0 -34 Z" fill="${C.grayLight}" ${st(2)}/>
          <path d="M0 -34 C7 -28 10 -22 12 -16 L-12 -16 C-10 -22 -7 -28 0 -34 Z" fill="${C.red}" ${st(1.5)}/>
          <circle cx="0" cy="2" r="7" fill="${C.blueLight}" ${st(1.5)}/>
        </g></g>`;
    },
  },
  ferma: {
    label: 'ferma',
    draw: () => {
      const posts = Array.from({ length: 7 }, (_, i) => `<rect x="${16 + i * 22}" y="80" width="6" height="24" rx="1" fill="${C.brownLight}" ${st(1.5)}/>`).join('');
      return `
        <rect width="300" height="120" fill="${C.sky}"/>
        ${sunRays(40, 28, 14)}${cloud(110, 12, 0.9)}
        <path d="M0 78 C50 58 110 66 160 76 C210 64 260 60 300 72 V120 H0 Z" fill="${C.grass}"/>
        <path d="M0 98 C80 90 200 102 300 94 V120 H0 Z" fill="${C.green}"/>
        <rect x="14" y="86" width="140" height="5" fill="${C.brownLight}" ${st(1.2)}/><rect x="14" y="96" width="140" height="5" fill="${C.brownLight}" ${st(1.2)}/>
        ${posts}
        <rect x="172" y="50" width="70" height="52" fill="${C.red}" ${st(2)}/>
        <path d="M164 52 L207 24 L250 52 Z" fill="${C.redDark}" ${st(2)}/>
        <rect x="199" y="36" width="16" height="11" fill="${C.yellow}" ${st(1.5)}/>
        <rect x="194" y="72" width="26" height="30" fill="${C.white}" ${st(2)}/>
        <path d="M194 72 L220 102 M220 72 L194 102" stroke="${C.red}" stroke-width="2.5"/>
        <g class="v-scene__tree"><rect x="270" y="72" width="7" height="28" fill="${C.brown}" ${st(1.5)}/>
        <circle cx="273" cy="62" r="17" fill="${C.greenDark}" ${st(2)}/></g>`;
    },
  },
  magazin: {
    label: 'magazinul',
    draw: () => {
      const scallops = Array.from({ length: 9 }, (_, i) => `Q${70 + i * 20} 58 ${80 + i * 20} 46`).join(' ');
      const apples = [88, 100, 112, 94, 106].map((x, i) => `<circle cx="${x}" cy="${i < 3 ? 84 : 76}" r="5" fill="${C.red}" ${st(1.5)}/>`).join('');
      return `
        <rect width="300" height="120" fill="${C.sky}"/>
        <rect y="100" width="300" height="20" fill="${C.grayLight}"/>
        <rect x="60" y="34" width="180" height="68" fill="${C.cream}" ${st(2)}/>
        <rect x="60" y="34" width="180" height="12" fill="${C.red}" ${st(2)}/>
        <path d="M60 46 ${scallops} Z" fill="${C.red}" ${st(2)}/>
        <rect x="78" y="60" width="66" height="34" fill="${C.blueLight}" ${st(2)}/>
        <rect x="80" y="88" width="62" height="6" fill="${C.brownLight}"/>
        ${apples}
        <rect x="120" y="64" width="18" height="14" fill="${C.yellow}" ${st(1.5)}/>
        <rect x="166" y="58" width="36" height="44" fill="${C.brown}" ${st(2)}/>
        <circle cx="196" cy="82" r="2.2" fill="${C.yellow}"/>
        <g class="v-scene__sign"><rect x="105" y="8" width="90" height="20" rx="5" fill="${C.yellow}" ${st(2)}/>${txt(150, 18, 'MAGAZIN', { size: 11, weight: 800 })}</g>
        <path d="M250 74 H286 L280 96 H256 Z" fill="${C.white}" ${st(2)}/>
        <line x1="286" y1="74" x2="294" y2="62" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="260" cy="103" r="4" fill="${C.ink}"/><circle cx="278" cy="103" r="4" fill="${C.ink}"/>`;
    },
  },
  oras: {
    label: 'orașul cu tramvai',
    draw: () => {
      const windows = (x, y, w, h, cols, rows) =>
        Array.from({ length: cols * rows }, (_, i) => `<rect x="${x + 6 + (i % cols) * ((w - 12) / cols)}" y="${y + 6 + Math.floor(i / cols) * ((h - 12) / rows)}" width="${(w - 12) / cols - 4}" height="${(h - 12) / rows - 4}" rx="1" fill="${C.yellow}"/>`).join('');
      return `
        <rect width="300" height="120" fill="${C.sky}"/>
        ${cloud(200, 8, 0.8)}
        <rect x="20" y="44" width="42" height="56" fill="${C.grayLight}" ${st(2)}/>${windows(20, 44, 42, 56, 2, 3)}
        <rect x="70" y="24" width="52" height="76" fill="${C.blueLight}" ${st(2)}/>${windows(70, 24, 52, 76, 2, 4)}
        <rect x="130" y="50" width="38" height="50" fill="${C.pink}" ${st(2)}/>${windows(130, 50, 38, 50, 2, 2)}
        <rect x="176" y="32" width="56" height="68" fill="${C.cream}" ${st(2)}/>${windows(176, 32, 56, 68, 3, 3)}
        <rect x="240" y="56" width="44" height="44" fill="${C.grayLight}" ${st(2)}/>${windows(240, 56, 44, 44, 2, 2)}
        <rect y="100" width="300" height="20" fill="${C.gray}"/>
        <line x1="0" y1="110" x2="300" y2="110" stroke="${C.white}" stroke-width="2" stroke-dasharray="12 10"/>
        <g class="v-scene__tram">
          <line x1="150" y1="72" x2="150" y2="62" stroke="${C.ink}" stroke-width="2"/>
          <rect x="104" y="72" width="92" height="28" rx="6" fill="${C.red}" ${st(2)}/>
          <rect x="112" y="78" width="16" height="12" rx="2" fill="${C.blueLight}" ${st(1.5)}/>
          <rect x="134" y="78" width="16" height="12" rx="2" fill="${C.blueLight}" ${st(1.5)}/>
          <rect x="156" y="78" width="16" height="12" rx="2" fill="${C.blueLight}" ${st(1.5)}/>
          <rect x="178" y="78" width="10" height="12" rx="2" fill="${C.blueLight}" ${st(1.5)}/>
          <circle cx="120" cy="101" r="4" fill="${C.ink}"/><circle cx="180" cy="101" r="4" fill="${C.ink}"/>
        </g>`;
    },
  },
  scoala: {
    label: 'școala',
    draw: () => `
      <rect width="300" height="120" fill="${C.sky}"/>
      ${sunRays(40, 28, 14)}${cloud(200, 8, 0.8)}
      <rect y="96" width="300" height="24" fill="${C.grass}"/>
      <rect x="70" y="42" width="160" height="54" fill="${C.cream}" ${st(2)}/>
      <path d="M62 44 L150 16 L238 44 Z" fill="${C.red}" ${st(2)}/>
      <circle cx="150" cy="34" r="7" fill="${C.white}" ${st(1.5)}/>
      <path d="M150 34 V29 M150 34 H154" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="84" y="54" width="18" height="14" fill="${C.blueLight}" ${st(1.5)}/><rect x="110" y="54" width="18" height="14" fill="${C.blueLight}" ${st(1.5)}/>
      <rect x="172" y="54" width="18" height="14" fill="${C.blueLight}" ${st(1.5)}/><rect x="198" y="54" width="18" height="14" fill="${C.blueLight}" ${st(1.5)}/>
      <rect x="138" y="68" width="24" height="28" fill="${C.brown}" ${st(2)}/>
      <line x1="256" y1="96" x2="256" y2="30" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
      <g class="v-scene__flag"><path d="M258 32 L290 40 L258 48 Z" fill="${C.red}" ${st(1.5)}/></g>
      <circle cx="30" cy="84" r="12" fill="${C.greenDark}" ${st(2)}/><rect x="27" y="90" width="6" height="10" fill="${C.brown}"/>`,
  },
  stadion: {
    label: 'stadionul',
    draw: () => {
      const seats = Array.from({ length: 60 }, (_, i) => `<circle cx="${8 + (i % 20) * 15}" cy="${42 + Math.floor(i / 20) * 9}" r="3" fill="${[C.red, C.blue, C.yellow][(i + Math.floor(i / 20)) % 3]}"/>`).join('');
      return `
        <rect width="300" height="120" fill="${C.sky}"/>
        <rect y="36" width="300" height="32" fill="${C.grayLight}" ${st(2)}/>${seats}
        <ellipse cx="150" cy="96" rx="146" ry="28" fill="${C.orange}" ${st(2)}/>
        <ellipse cx="150" cy="96" rx="112" ry="17" fill="${C.grass}" ${st(2)}/>
        <line x1="150" y1="79" x2="150" y2="113" stroke="${C.white}" stroke-width="2"/>
        <rect x="232" y="84" width="24" height="18" fill="${C.white}" ${st(1.5)}/>
        <path d="M240 84 V102 M248 84 V102 M232 90 H256 M232 96 H256" stroke="${C.gray}" stroke-width="1"/>
        <rect x="40" y="82" width="8" height="20" fill="${C.white}" ${st(1.5)}/><rect x="40" y="82" width="4" height="10" fill="${C.ink}"/><rect x="44" y="92" width="4" height="10" fill="${C.ink}"/>
        <g class="v-scene__ball"><circle cx="150" cy="96" r="9" fill="${C.white}" ${st(2)}/><path d="M150 90 L155 94 L153 100 H147 L145 94 Z" fill="${C.ink}"/></g>`;
    },
  },
};

registerVisual('scene', {
  group: GROUP,
  defaults: { theme: 'mare' },
  viewBox: '0 0 300 120',
  label: (p) => `peisaj: ${(SCENES[p.theme] ?? SCENES.mare).label}`,
  render: (p) => (SCENES[p.theme] ?? SCENES.mare).draw(),
  demos: Object.keys(SCENES).map((theme) => ({ theme })),
});
