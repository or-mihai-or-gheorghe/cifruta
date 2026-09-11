// Natură și corp: organe, plantă, legume, surse de energie, Soare/Pământ/Lună, țarcuri cu animale.

import { EMOJI } from './emoji.js';
import { registerVisual } from './index.js';
import { bool, C, emojiImage, list, ST, st, txt } from './palette.js';

const GROUP = 'Natură și corp';
const tube = (d, color, w = 7) =>
  `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w + 4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;

const ORGANS = {
  inima: {
    label: 'inima',
    draw: () => `
      ${tube('M40 18 V6', C.blueDark)}${tube('M58 18 V8 Q58 4 64 4', C.redDark)}
      <path d="M50 90 C22 70 8 52 8 34 C8 18 20 10 32 10 C40 10 46 14 50 20 C54 14 60 10 68 10 C80 10 92 18 92 34 C92 52 78 70 50 90 Z" fill="${C.red}" ${st(3)}/>
      <path d="M22 32 C23 24 29 19 36 19" fill="none" stroke="${C.white}" stroke-width="4" opacity=".5" stroke-linecap="round"/>`,
  },
  plamanii: {
    label: 'plămânii',
    draw: () => `
      <path d="M42 30 C28 22 10 38 10 62 C10 82 22 92 34 90 C44 88 46 80 46 70 L46 40 C46 34 45 31 42 30 Z" fill="${C.pink}" ${st(3)}/>
      <path d="M58 30 C72 22 90 38 90 62 C90 82 78 92 66 90 C56 88 54 80 54 70 L54 40 C54 34 55 31 58 30 Z" fill="${C.pink}" ${st(3)}/>
      <rect x="45" y="4" width="10" height="34" rx="5" fill="${C.grayLight}" ${ST}/>
      <path d="M50 36 L36 50 M36 50 L30 62 M36 50 L38 66 M50 36 L64 50 M64 50 L70 62 M64 50 L62 66" fill="none" stroke="${C.pinkDark}" stroke-width="3" stroke-linecap="round"/>`,
  },
  creierul: {
    label: 'creierul',
    draw: () => `
      ${tube('M54 72 L58 92', C.pinkDark, 6)}
      <path d="M22 60 C8 56 8 34 22 30 C22 16 38 10 48 16 C56 6 76 8 80 22 C94 24 96 46 86 54 C90 68 76 78 64 72 C56 82 38 82 32 72 C24 72 20 66 22 60 Z" fill="${C.pink}" ${st(3)}/>
      <path d="M50 18 C44 30 56 38 50 50 C46 58 52 66 50 76 M24 42 C32 38 36 46 42 44 M22 54 C30 58 38 52 44 58 M58 28 C64 34 72 28 78 34 M58 48 C66 44 72 54 82 48 M60 62 C66 58 70 66 78 62" fill="none" stroke="${C.pinkDark}" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  stomacul: {
    label: 'stomacul',
    draw: () => `
      <path d="M38 4 H50 V14 C50 22 58 24 66 26 C84 30 92 46 88 64 C84 82 66 92 48 88 C38 86 34 80 28 80 C22 80 18 84 18 92 H8 C8 78 16 70 28 70 C34 70 38 74 44 76 C40 60 30 50 32 34 C33 24 38 20 38 14 Z" fill="${C.orange}" ${st(3)}/>
      <path d="M50 40 C60 44 70 54 70 64 M44 52 C52 58 58 66 58 76" fill="none" stroke="${C.orangeDark}" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  rinichii: {
    label: 'rinichii',
    draw: () => `
      <path d="M42 54 C48 62 48 78 46 96 M58 54 C52 62 52 78 54 96" fill="none" stroke="${C.yellowDark}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M34 14 C18 14 10 30 10 48 C10 68 20 84 34 84 C44 84 46 74 42 66 C38 58 38 44 42 36 C46 26 44 14 34 14 Z" fill="${C.redDark}" ${st(3)}/>
      <path d="M66 14 C82 14 90 30 90 48 C90 68 80 84 66 84 C56 84 54 74 58 66 C62 58 62 44 58 36 C54 26 56 14 66 14 Z" fill="${C.redDark}" ${st(3)}/>
      <path d="M24 32 C20 40 20 50 22 58 M76 32 C80 40 80 50 78 58" fill="none" stroke="${C.white}" stroke-width="3" opacity=".4" stroke-linecap="round"/>`,
  },
};

registerVisual('organ', {
  group: GROUP,
  defaults: { name: 'inima' },
  label: (p) => (ORGANS[p.name] ?? ORGANS.inima).label,
  render: (p) => (ORGANS[p.name] ?? ORGANS.inima).draw(),
  demos: Object.keys(ORGANS).map((name) => ({ name })),
});

registerVisual('plant', {
  group: GROUP,
  defaults: { labels: true },
  viewBox: (p) => (bool(p.labels, true) ? '0 0 184 200' : '0 0 120 200'),
  label: () => 'plantă cu rădăcină, tulpină, frunze, floare și fruct',
  render: (p) => {
    const petals = [0, 72, 144, 216, 288]
      .map((a) => `<ellipse cx="60" cy="20" rx="6.5" ry="10" fill="${C.pink}" ${st(2)} transform="rotate(${a} 60 32)"/>`)
      .join('');
    let out = `
      <rect x="4" y="130" width="112" height="66" rx="8" fill="${C.brownLight}"/>
      <path d="M4 130 H116" stroke="${C.brown}" stroke-width="3"/>
      <path d="M60 130 V178 M60 146 L42 164 L34 172 M60 150 L78 170 L88 176 M60 162 L50 186 M60 166 L70 188" fill="none" stroke="${C.brown}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M60 130 C58 110 62 80 60 36" fill="none" stroke="${C.greenDark}" stroke-width="5" stroke-linecap="round"/>
      <path d="M59 96 C44 84 26 88 20 96 C30 106 48 106 59 96 Z" fill="${C.green}" ${st(2.5)}/>
      <path d="M61 78 C76 64 94 68 100 76 C90 88 72 88 61 78 Z" fill="${C.green}" ${st(2.5)}/>
      <path d="M61 110 C70 110 76 106 82 100" fill="none" stroke="${C.greenDark}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="85" cy="110" r="9" fill="${C.red}" ${st(2.5)}/><path d="M80 101 L85 104 L90 101" fill="none" stroke="${C.greenDark}" stroke-width="2.5" stroke-linecap="round"/>
      ${petals}<circle cx="60" cy="32" r="6" fill="${C.yellow}" ${st(2)}/>`;
    if (bool(p.labels, true)) {
      const lead = (x1, y1, y2, text) =>
        `<line x1="${x1}" y1="${y1}" x2="118" y2="${y2}" stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="3 2"/>${txt(122, y2, text, { size: 12, anchor: 'start' })}`;
      out += lead(70, 28, 24, 'floare') + lead(98, 76, 62, 'frunză') + lead(94, 110, 100, 'fruct') + lead(62, 120, 128, 'tulpină') + lead(80, 172, 164, 'rădăcină');
    }
    return out;
  },
  demos: [{ labels: true }, { labels: false }],
});

const VEG = {
  morcov: {
    label: 'morcov',
    draw: () => `
      <path d="M50 30 C44 18 36 10 28 8 M50 30 C50 16 52 8 56 4 M50 30 C58 20 66 14 74 12" fill="none" stroke="${C.greenDark}" stroke-width="4" stroke-linecap="round"/>
      <path d="M30 30 C30 25 70 25 70 30 C68 52 58 78 50 96 C42 78 32 52 30 30 Z" fill="${C.orange}" ${st(3)}/>
      <path d="M38 44 L46 44 M54 56 L62 56 M42 68 L50 68" stroke="${C.orangeDark}" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  ridiche: {
    label: 'ridiche',
    draw: () => `
      <path d="M50 38 C40 22 26 18 20 24 C28 32 40 34 50 38 Z M50 38 C60 20 76 16 82 22 C74 30 62 34 50 38 Z" fill="${C.green}" ${ST}/>
      <path d="M50 86 L50 98" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="50" cy="62" r="26" fill="${C.red}" ${st(3)}/>
      <path d="M34 78 C42 88 58 88 66 78 C58 82 42 82 34 78 Z" fill="${C.white}"/>
      <ellipse cx="38" cy="54" rx="4" ry="7" fill="${C.white}" opacity=".45"/>`,
  },
  sfecla: {
    label: 'sfeclă',
    draw: () => `
      <path d="M50 40 C38 24 24 20 18 26 C26 34 38 36 50 40 Z M50 40 C62 22 78 18 84 24 C76 32 64 36 50 40 Z" fill="${C.green}" ${ST}/>
      <path d="M50 40 L28 26 M50 40 L78 24" stroke="${C.redDark}" stroke-width="2" stroke-linecap="round"/>
      <path d="M50 88 C50 94 46 98 42 99" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="50" cy="64" r="25" fill="var(--v-beet, #9B2D5E)" ${st(3)}/>
      <ellipse cx="40" cy="56" rx="4" ry="7" fill="${C.white}" opacity=".35"/>`,
  },
  salata: {
    label: 'salată',
    draw: () => `
      <path d="M50 90 C20 90 8 70 12 52 C14 40 24 34 30 40 C28 28 38 20 46 26 C50 16 62 16 66 26 C74 20 86 28 82 40 C90 36 96 48 90 60 C92 76 78 90 50 90 Z" fill="${C.green}" ${st(3)}/>
      <path d="M50 88 C34 86 28 72 32 60 C36 50 46 50 50 58 C54 50 64 50 68 60 C72 72 66 86 50 88 Z" fill="${C.grass}" ${ST}/>
      <path d="M50 86 V62 M24 58 C30 62 34 70 36 78 M76 58 C70 62 66 70 64 78" fill="none" stroke="${C.greenDark}" stroke-width="2" stroke-linecap="round"/>`,
  },
  spanac: {
    label: 'spanac',
    draw: () => `
      <path d="M50 96 L50 62 M50 96 L31 58 M50 96 L69 58" stroke="${C.greenDark}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M50 62 C36 52 36 22 50 8 C64 22 64 52 50 62 Z" fill="${C.greenDark}" ${ST}/>
      <path d="M30 60 C14 54 10 30 20 16 C34 24 40 46 30 60 Z M70 60 C86 54 90 30 80 16 C66 24 60 46 70 60 Z" fill="${C.greenDark}" ${ST}/>
      <path d="M50 58 V16 M29 56 L21 22 M71 56 L79 22" stroke="${C.green}" stroke-width="2" stroke-linecap="round"/>`,
  },
  varza: {
    label: 'varză',
    draw: () => `
      <circle cx="50" cy="54" r="38" fill="${C.grass}" ${st(3)}/>
      <path d="M50 18 C32 30 32 72 50 90 M50 18 C68 30 68 72 50 90 M14 52 C28 44 40 58 50 54 C60 58 72 44 86 52" fill="none" stroke="${C.greenDark}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M20 70 C12 58 12 38 24 28 M80 70 C88 58 88 38 76 28" fill="none" stroke="${C.greenDark}" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  rosie: {
    label: 'roșie',
    draw: () => `
      <path d="M50 28 C28 26 10 40 10 60 C10 80 28 92 50 92 C72 92 90 80 90 60 C90 40 72 26 50 28 Z" fill="${C.red}" ${st(3)}/>
      <path d="M50 36 L38 26 L46 28 L50 16 L54 28 L62 26 Z" fill="${C.green}" ${st(2)}/>
      <ellipse cx="30" cy="54" rx="5" ry="9" fill="${C.white}" opacity=".45"/>`,
  },
  ardei: {
    label: 'ardei',
    draw: () => `
      <path d="M50 24 C50 14 54 8 60 6" fill="none" stroke="${C.greenDark}" stroke-width="5" stroke-linecap="round"/>
      <path d="M30 28 C22 28 14 40 16 58 C18 78 28 94 40 92 C46 91 48 86 50 86 C52 86 54 91 60 92 C72 94 82 78 84 58 C86 40 78 28 70 28 C62 28 58 24 50 24 C42 24 38 28 30 28 Z" fill="${C.red}" ${st(3)}/>
      <path d="M50 32 C46 50 46 70 50 86" fill="none" stroke="${C.redDark}" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="50" cy="27" rx="11" ry="4.5" fill="${C.green}" ${st(2)}/>`,
  },
  castravete: {
    label: 'castravete',
    draw: () => `
      <g transform="rotate(-30 50 50)">
        <rect x="8" y="36" width="84" height="28" rx="14" fill="${C.green}" ${st(3)}/>
        <path d="M16 44 H84" stroke="${C.grass}" stroke-width="3" stroke-linecap="round"/>
        ${[24, 38, 52, 66, 78].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 56 : 52}" r="1.8" fill="${C.greenDark}"/>`).join('')}
        <path d="M92 50 H98" stroke="${C.greenDark}" stroke-width="4" stroke-linecap="round"/>
      </g>`,
  },
};

registerVisual('vegetable', {
  group: GROUP,
  defaults: { name: 'morcov' },
  label: (p) => (VEG[p.name] ?? VEG.morcov).label,
  render: (p) => (VEG[p.name] ?? VEG.morcov).draw(),
  demos: Object.keys(VEG).map((name) => ({ name })),
});

const sun = () =>
  Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="6" x2="50" y2="17" stroke="${C.orange}" stroke-width="5" stroke-linecap="round" transform="rotate(${i * 30} 50 50)"/>`).join('') +
  `<circle cx="50" cy="50" r="26" fill="${C.yellow}" ${st(3)}/>`;

const ENERGY = {
  soare: { label: 'Soarele', draw: sun },
  vant: {
    label: 'vântul (turbină eoliană)',
    draw: () => `
      <path d="M4 30 C14 26 22 34 32 30 M8 48 C16 44 22 52 32 48 M4 66 C12 62 20 70 28 66" fill="none" stroke="${C.blue}" stroke-width="3" stroke-linecap="round"/>
      <path d="M56 42 L62 42 L67 94 L51 94 Z" fill="${C.grayLight}" ${ST}/>
      ${[0, 120, 240].map((a) => `<path d="M59 38 C55 26 55 12 59 4 C63 12 63 26 59 38 Z" fill="${C.white}" ${st(2)} transform="rotate(${a} 59 38)"/>`).join('')}
      <circle cx="59" cy="38" r="5" fill="${C.gray}" ${st(2)}/>
      <path d="M38 94 H82" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`,
  },
  apa: {
    label: 'apa râului (hidrocentrală)',
    draw: () => `
      <path d="M4 40 H36 L30 80 H4 Z" fill="${C.blue}"/>
      <path d="M58 60 C70 60 74 70 84 70 C90 70 94 68 96 66 V84 H56 Z" fill="${C.blueLight}"/>
      <path d="M34 30 L60 30 L68 82 L26 82 Z" fill="${C.gray}" ${ST}/>
      <rect x="37" y="16" width="20" height="14" fill="${C.yellow}" ${st(2)}/>
      <path d="M49 18 L43 25 H47 L44 30 L52 22 H48 Z" fill="${C.ink}"/>
      <rect x="4" y="80" width="92" height="14" rx="4" fill="${C.blue}" ${ST}/>
      <path d="M10 87 C16 84 20 90 26 87 M60 87 C66 84 70 90 76 87 M8 52 C14 49 18 55 24 52" fill="none" stroke="${C.white}" stroke-width="2" stroke-linecap="round"/>`,
  },
  carbune: {
    label: 'cărbunele',
    draw: () => `
      <polygon points="16,80 24,58 42,52 52,66 46,86 26,88" fill="var(--v-coal, #4B4453)" ${ST}/>
      <polygon points="46,86 52,66 70,56 88,70 84,88 60,92" fill="var(--v-coal, #4B4453)" ${ST}/>
      <polygon points="34,58 44,36 62,34 70,56 52,66 42,52" fill="var(--v-coal-light, #6E6778)" ${ST}/>
      <path d="M46 42 L56 40 M60 64 L72 62 M26 66 L36 62" stroke="${C.gray}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
  },
  petrol: {
    label: 'petrolul',
    draw: () => `
      <rect x="28" y="14" width="44" height="78" rx="7" fill="var(--v-oil, #3E3A46)" ${st(3)}/>
      <path d="M28 34 H72 M28 72 H72" stroke="${C.gray}" stroke-width="3"/>
      <path d="M50 42 C44 50 42 55 42 59 C42 64 46 67 50 67 C54 67 58 64 58 59 C58 55 56 50 50 42 Z" fill="${C.yellow}"/>`,
  },
  gaze: {
    label: 'gazele naturale',
    draw: () => `
      <rect x="22" y="82" width="56" height="10" rx="5" fill="${C.gray}" ${st(2)}/>
      <path d="M50 10 C62 28 76 40 74 60 C72 76 62 82 50 82 C38 82 28 76 26 60 C24 44 38 36 42 22 C46 30 50 32 50 10 Z" fill="${C.blue}" ${st(2.5)}/>
      <path d="M50 40 C58 52 64 58 62 68 C60 76 56 78 50 78 C44 78 40 76 38 68 C36 58 44 52 50 40 Z" fill="${C.blueLight}"/>`,
  },
};

registerVisual('energy', {
  group: GROUP,
  defaults: { name: 'soare' },
  label: (p) => `sursă de energie: ${(ENERGY[p.name] ?? ENERGY.soare).label}`,
  render: (p) => (ENERGY[p.name] ?? ENERGY.soare).draw(),
  demos: Object.keys(ENERGY).map((name) => ({ name })),
});

const SKY = {
  soare: { label: 'Soarele', draw: sun },
  pamant: {
    label: 'Pământul',
    draw: () => `
      <circle cx="50" cy="50" r="40" fill="${C.blue}" ${st(3)}/>
      <path d="M26 30 C34 22 46 26 44 36 C42 44 50 48 46 56 C42 62 30 60 26 50 C22 42 20 36 26 30 Z" fill="${C.green}" ${st(2)}/>
      <path d="M60 58 C68 52 80 56 80 66 C80 76 70 84 62 80 C56 76 54 64 60 58 Z" fill="${C.green}" ${st(2)}/>
      <path d="M58 24 C64 20 72 24 70 30 C68 34 60 34 58 24 Z" fill="${C.green}" ${st(2)}/>
      <path d="M30 70 H46 M56 42 H70" stroke="${C.white}" stroke-width="4" stroke-linecap="round" opacity=".8"/>`,
  },
  luna: {
    label: 'Luna',
    draw: () => `
      <circle cx="50" cy="50" r="38" fill="${C.grayLight}" ${st(3)}/>
      <circle cx="36" cy="38" r="8" fill="${C.gray}" ${st(1.5)}/><circle cx="62" cy="62" r="10" fill="${C.gray}" ${st(1.5)}/>
      <circle cx="64" cy="32" r="5" fill="${C.gray}" ${st(1.5)}/><circle cx="34" cy="66" r="4" fill="${C.gray}" ${st(1.5)}/>`,
  },
};

registerVisual('sky-body', {
  group: GROUP,
  defaults: { name: 'soare' },
  label: (p) => (SKY[p.name] ?? SKY.soare).label,
  render: (p) => (SKY[p.name] ?? SKY.soare).draw(),
  demos: Object.keys(SKY).map((name) => ({ name })),
});

const FARM_DEFAULT = 'gaina,pisica,rata,caine,cal,oaie,porc,vaca,iepure';
const ROWS = ['sus', 'mijloc', 'jos'];

registerVisual('farm-grid', {
  group: GROUP,
  defaults: { cells: FARM_DEFAULT, labels: false },
  viewBox: (p) => (bool(p.labels) ? '0 0 306 242' : '0 0 242 242'),
  label: (p) => {
    const cells = list(p.cells);
    return `țarcuri cu animale — ${ROWS.map((r, i) => `${r}: ${cells.slice(i * 3, i * 3 + 3).map((c) => EMOJI[c]?.label ?? c).join(', ')}`).join('; ')}`;
  },
  render: (p) => {
    const cells = list(p.cells);
    const ox = bool(p.labels) ? 64 : 0;
    let out = `<rect x="${ox + 2}" y="2" width="238" height="238" rx="12" fill="${C.grass}" ${st(2.5)}/>`;
    for (let i = 0; i < 9; i++) {
      const x = ox + 6 + (i % 3) * 78;
      const y = 6 + Math.floor(i / 3) * 78;
      out += `<rect x="${x}" y="${y}" width="74" height="74" rx="6" fill="var(--v-grass-light, #C4EBB2)" stroke="${C.brown}" stroke-width="4"/>`;
      out += `<path d="M${x + 4} ${y + 26} H${x + 70} M${x + 4} ${y + 50} H${x + 70}" stroke="${C.brownLight}" stroke-width="2" stroke-dasharray="6 4" opacity=".7"/>`;
      if (cells[i]) out += EMOJI[cells[i]] ? emojiImage(cells[i], x + 11, y + 11, 52) : txt(x + 37, y + 37, cells[i], { size: 12 });
    }
    if (bool(p.labels)) ROWS.forEach((r, i) => { out += txt(32, 45 + i * 78, r, { size: 15 }); });
    return out;
  },
  demos: [{}, { labels: true }],
});
