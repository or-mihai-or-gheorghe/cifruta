// Animalele avatarului. Pentru fiecare: ancorele accesoriilor (`a`) și părțile desenate: în spatele umerilor (`behind`: coada),
// umerii (`bust`, dacă diferă de cei obișnuiți), din spate (`back`: urechi, coamă, lână), capul (`head`) și fața (`face`); `front`
// stă peste accesorii (cornul unicornului). Fiecare parte primește nuanțele blănii (`c`: cele alese sau cele naturale) și ancorele;
// ce nu ține de blană (ciocul, nasul, petele pandei, interiorul urechilor) are culoarea lui. `fur` = paleta proprie a unui animal
// fără culoare naturală în listă.
// Ancorele: ochii la (50 ± eyeDx, eyeY); `top` e creștetul, unde stă o pălărie, pentru un cap lat de `headW`; `neckY` e gâtul;
// `earY` și `earDx` așază cupele căștilor, când nu stau lângă ochi. `place` mută sau micșorează un accesoriu pe acest animal:
// { hat, face, neck: { dx, dy, s } }.

import { bust, cheeks, eyes, pair, r2 } from './avatar-parts.js';
import { C, st } from './palette.js';

const ink = (d, w = 1.5) => `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** Centrele a `n` bucle pe un cerc (lâna oii, coama leului), începând de sus. */
const ring = (cx, cy, radius, n) =>
  Array.from({ length: n }, (_, i) => {
    const t = ((-90 + (360 / n) * i) * Math.PI) / 180;
    return [r2(cx + radius * Math.cos(t)), r2(cy + radius * Math.sin(t))];
  });

/** Țepi în zigzag pe un arc de cerc, între unghiurile `from` și `to` (în grade, cu y în jos). */
function spikes(cx, cy, inner, outer, from, to, n) {
  const points = Array.from({ length: 2 * n + 1 }, (_, i) => {
    const t = ((from + ((to - from) * i) / (2 * n)) * Math.PI) / 180;
    const r = i % 2 ? outer : inner;
    return `${r2(cx + r * Math.cos(t))} ${r2(cy + r * Math.sin(t))}`;
  });
  return `M${points.join(' L')} Z`;
}

const QUILLS = spikes(50, 54, 22, 32, 148, 392, 13);
const WOOL = ring(50, 50, 25, 10);
const MANE = ring(50, 52, 29, 12);

export const ANIMAL_ART = {
  veverita: {
    a: { eyeY: 48, eyeDx: 9.5, top: 27, headW: 50, neckY: 77 },
    behind: (c) => `<path d="M66 90 C86 88 94 66 87 48 C81 34 66 35 66 47 C66 56 77 57 78 67 C79 77 72 84 62 87 Z" fill="${c.dark}" ${st(2.5)}/>
      <path d="M73 83 C86 79 90 64 86 53" fill="none" stroke="${c.main}" stroke-width="4" stroke-linecap="round"/>`,
    back: (c) =>
      pair(
        `<path d="M31 37 C25 25 27 14 33 11 C40 16 43 26 42 33 Z" fill="${c.main}" ${st(2.5)}/>` +
          `<path d="M34 31 C31 24 32 18 35 15 C38 19 39 25 38.5 29 Z" fill="${C.pink}"/>${ink('M33 11 C31 6 34 4 37 6', 2)}`,
      ),
    head: (c) => `<circle cx="50" cy="52" r="25" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}${cheeks(a)}
      <ellipse cx="50" cy="60" rx="12" ry="9" fill="${c.light}"/><ellipse cx="50" cy="55.5" rx="3.8" ry="2.8" fill="${C.ink}"/>
      <rect x="47.6" y="61" width="4.8" height="4.8" rx="1" fill="${C.white}" stroke="${C.ink}" stroke-width="1"/>
      ${ink('M43 59 Q46.5 63 50 59.5 Q53.5 63 57 59', 1.8)}`,
  },
  iepure: {
    a: { eyeY: 51, eyeDx: 9, top: 28, headW: 48, neckY: 77 },
    back: (c) =>
      pair(
        `<path d="M40 36 C33 26 26 10 30 4 C35 -1 43 12 47 31 Z" fill="${c.main}" ${st(2.5)}/>` +
          `<path d="M40.5 30 C35 22 31 12 32.5 8 C35.5 6 40.5 16 43.5 28 Z" fill="${C.pink}"/>`,
      ),
    head: (c) => `<ellipse cx="50" cy="53" rx="24" ry="24.5" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}${cheeks(a, 16, 9)}
      <ellipse cx="46" cy="62" rx="5.5" ry="4.2" fill="${c.light}"/><ellipse cx="54" cy="62" rx="5.5" ry="4.2" fill="${c.light}"/>
      <path d="M47 58 Q50 56.5 53 58 Q50 61.5 47 58 Z" fill="${C.pinkDark}"/>
      ${ink('M50 60.5 V63 M46 64 Q48 66 50 63 Q52 66 54 64')}
      <rect x="48.2" y="65" width="3.6" height="3.6" rx="1" fill="${C.white}" stroke="${C.ink}" stroke-width="1"/>`,
  },
  vulpe: {
    a: { eyeY: 48, eyeDx: 9, top: 27, headW: 50, neckY: 77 },
    back: (c) =>
      pair(
        `<path d="M28 40 C22 26 22 12 26 6 C36 12 44 22 46 30 Z" fill="${c.main}" ${st(2.5)}/>` +
          `<path d="M31 34 C28 25 28 16 30 12 C36 17 40 23 41.5 28 Z" fill="${c.light}"/>` +
          `<path d="M26 6 C29.5 8.2 32.5 10.8 35 13.5 L23.3 14 C23.3 11 24.5 7.5 26 6 Z" fill="${C.coal}"/>` +
          `<path d="M28 40 C22 26 22 12 26 6 C36 12 44 22 46 30" fill="none" ${st(2.5)}/>`,
      ),
    head: (c) =>
      `<path d="M50 27 C66 27 76 38 76 50 C76 58 72 63 66 67 C60 72 55 76 50 77 C45 76 40 72 34 67 C28 63 24 58 24 50 C24 38 34 27 50 27 Z" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<path d="M26.5 54 C34 56 43 59 50 66 C57 59 66 56 73.5 54 C72 62 62 73 50 75.5 C38 73 28 62 26.5 54 Z" fill="${c.light}"/>
      ${eyes(a)}${cheeks(a, 16, 8, 3.6)}
      <ellipse cx="50" cy="63.5" rx="3.6" ry="2.6" fill="${C.ink}"/>${ink('M50 66 V68 M46.5 69 Q48.5 70.5 50 68 Q51.5 70.5 53.5 69')}`,
  },
  urs: {
    a: { eyeY: 48, eyeDx: 9.5, top: 26, headW: 52, neckY: 78 },
    back: (c) => pair(`<circle cx="29" cy="32" r="9" fill="${c.main}" ${st(2.5)}/><circle cx="29" cy="32" r="4.8" fill="${c.light}"/>`),
    head: (c) => `<circle cx="50" cy="52" r="26" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}${cheeks(a)}
      <ellipse cx="50" cy="61" rx="11.5" ry="9" fill="${c.light}"/>
      <ellipse cx="50" cy="57.5" rx="4.6" ry="3.3" fill="${C.ink}"/><ellipse cx="48.6" cy="56.4" rx="1.4" ry="0.8" fill="${C.white}" opacity=".6"/>
      ${ink('M50 60.8 V63 M46 64.5 Q48 66.5 50 63 Q52 66.5 54 64.5', 1.6)}`,
  },
  arici: {
    a: { eyeY: 50, eyeDx: 8, top: 23, headW: 46, neckY: 78 },
    back: (c) => `<path d="${QUILLS}" fill="${c.main}" ${st(2.5)}/>`,
    head: (c) => `<circle cx="50" cy="54" r="23" fill="${c.light}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}${cheeks(a, 14, 8, 3.4)}
      <path d="M41 60 C43 54.5 57 54.5 59 60 C58 66.5 54 70 50 70 C46 70 42 66.5 41 60 Z" fill="${c.light}" ${st(2)}/>
      <ellipse cx="50" cy="67" rx="3.3" ry="2.5" fill="${C.ink}"/>${ink('M46 72.5 Q50 75 54 72.5', 1.6)}`,
  },
  pisica: {
    a: { eyeY: 50, eyeDx: 9.5, top: 29, headW: 52, neckY: 77 },
    back: (c) =>
      pair(
        `<path d="M27 43 C24 31 25 19 28 12 C36 15 43 22 46 29 Z" fill="${c.main}" ${st(2.5)}/>` +
          `<path d="M30.5 37 C29 29 29.5 22 31 17.5 C36 20.5 40 24.5 42 28.5 Z" fill="${C.pink}"/>`,
      ),
    head: (c) => `<ellipse cx="50" cy="53" rx="27" ry="24" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<path d="M50 30.5 V36 M44 31.5 L45.2 36 M56 31.5 L54.8 36" stroke="${c.dark}" stroke-width="2.2" stroke-linecap="round"/>
      ${eyes(a)}${cheeks(a, 17, 9, 3.6)}
      <path d="M47 58 H53 L50 61.5 Z" fill="${C.pinkDark}" stroke="${C.pinkDark}" stroke-width="1.2" stroke-linejoin="round"/>
      ${ink('M50 61.5 V63 M45.5 64 Q47.8 66.5 50 63 Q52.2 66.5 54.5 64')}
      ${ink('M34 58 L23 56 M34 61 L23 62 M66 58 L77 56 M66 61 L77 62', 1.2)}`,
  },
  caine: {
    fur: { main: C.brownLight, dark: C.brown, light: C.cream },
    a: { eyeY: 48, eyeDx: 9, top: 26, headW: 50, neckY: 77 },
    head: (c) => `<circle cx="50" cy="51" r="25" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${pair(`<path d="M31 31 C20 31 14 44 17 58 C19 66 26 67 29 60 C31 54 33 43 35 36 Z" fill="${c.dark}" ${st(2.5)}/>`)}
      ${eyes(a)}${cheeks(a, 14, 10, 3.4)}
      <ellipse cx="50" cy="61" rx="12" ry="9" fill="${c.light}"/>
      <path d="M47.6 64.6 C47.6 69.5 52.4 69.5 52.4 64.6 Z" fill="${C.pinkDark}" stroke="${C.ink}" stroke-width="1.2"/>
      <ellipse cx="50" cy="56.5" rx="5" ry="3.6" fill="${C.ink}"/><ellipse cx="48.6" cy="55.4" rx="1.5" ry="0.9" fill="${C.white}" opacity=".6"/>
      ${ink('M50 60 V62.5 M45.5 63.5 Q47.8 66 50 62.5 Q52.2 66 54.5 63.5')}`,
  },
  rata: {
    a: { eyeY: 46, eyeDx: 9, top: 25, headW: 50, neckY: 77 },
    back: (c) => `<path d="M49 30 C45 22 44 15 48 11 C51 15 52 22 51 30 Z M50 30 C51 21 54 15 59 14 C59 20 56 26 52 31 Z" fill="${c.main}" ${st(2)}/>`,
    head: (c) => `<circle cx="50" cy="51" r="26" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}${cheeks(a, 18, 9)}
      <path d="M37 64 C38 69 44 72 50 72 C56 72 62 69 63 64 Z" fill="${C.orangeDark}" ${st(2)}/>
      <path d="M35 62 C35 56 43 55 50 55 C57 55 65 56 65 62 C65 65 58 66 50 66 C42 66 35 65 35 62 Z" fill="${C.orange}" ${st(2)}/>
      <circle cx="46" cy="59.5" r="1" fill="${C.ink}"/><circle cx="54" cy="59.5" r="1" fill="${C.ink}"/>`,
  },
  lup: {
    fur: { main: C.grayDark, dark: C.coalLight, light: C.grayLight },
    a: { eyeY: 49, eyeDx: 9, top: 28, headW: 50, neckY: 77 },
    back: (c) =>
      pair(
        `<path d="M27 41 C23 27 24 13 28 6 C37 12 44 21 46 29 Z" fill="${c.main}" ${st(2.5)}/>` +
          `<path d="M30.5 35 C28.5 26 29 17 31 12 C36 17 40 22 42 27 Z" fill="${c.light}"/>`,
      ),
    head: (c) =>
      `<path d="M50 28 C65 28 75 38 75 50 L80 58 L73 60 L76 66 L66 68 C61 73 56 76 50 76 C44 76 39 73 34 68 L24 66 L27 60 L20 58 L25 50 C25 38 35 28 50 28 Z" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<path d="M31 57 C38 59 45 62 50 67 C55 62 62 59 69 57 C68 64 60 73 50 74.5 C40 73 32 64 31 57 Z" fill="${c.light}"/>
      ${eyes(a)}${cheeks(a, 15, 9, 3.2)}
      <ellipse cx="50" cy="63" rx="4" ry="2.8" fill="${C.ink}"/>${ink('M50 65.5 V67.5 M46.5 68.5 Q48.5 70 50 67.5 Q51.5 70 53.5 68.5')}`,
  },
  cal: {
    a: { eyeY: 45, eyeDx: 9, top: 22, headW: 40, neckY: 80 },
    back: (c) =>
      pair(
        `<path d="M37 27 C34 19 35 12 38 9 C42 13 44 19 44 25 Z" fill="${c.main}" ${st(2.5)}/>` +
          `<path d="M38.6 23 C37.2 18 37.6 14 39 12 C41 15 42 19 42 22 Z" fill="${c.dark}"/>`,
      ),
    head: (c) =>
      `<path d="M50 22 C62 22 68 32 68 44 C68 54 64 60 63 68 C62 76 58 80 50 80 C42 80 38 76 37 68 C36 60 32 54 32 44 C32 32 38 22 50 22 Z" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<path d="M42 25 C41 18 46 14 50 17 C53 12 59 15 57 21 C61 23 60 29 55 30 C54 27 51 26 48 30 C46 28 43 28 42 25 Z" fill="${c.dark}" ${st(2)}/>
      ${eyes(a)}${cheeks(a, 12, 9, 3.2)}
      <ellipse cx="50" cy="71" rx="12.5" ry="8.5" fill="${c.light}"/>
      <ellipse cx="45.5" cy="70.5" rx="1.6" ry="2.4" fill="${C.ink}"/><ellipse cx="54.5" cy="70.5" rx="1.6" ry="2.4" fill="${C.ink}"/>
      ${ink('M45.5 75.5 Q50 78 54.5 75.5')}`,
  },
  oaie: {
    a: { eyeY: 54, eyeDx: 6.5, top: 21, headW: 50, neckY: 76 },
    back: (c) =>
      `${WOOL.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.5" fill="${c.main}" ${st(2.5)}/>`).join('')}<circle cx="50" cy="50" r="25" fill="${c.main}"/>` +
      pair(`<ellipse cx="30" cy="53" rx="7.5" ry="4" transform="rotate(-20 30 53)" fill="${C.skin}" ${st(2)}/>`),
    head: () => `<ellipse cx="50" cy="58" rx="14.5" ry="16.5" fill="${C.skin}" ${st(2.5)}/>`,
    face: (c, a) => `${[[42.5, 40, 7], [50, 37, 7.5], [57.5, 40, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.main}" ${st(2)}/>`).join('')}
      ${eyes(a)}${cheeks(a, 10, 8, 2.8)}
      <path d="M47.5 64 Q50 62.5 52.5 64 Q50 67 47.5 64 Z" fill="${C.pinkDark}"/>${ink('M50 66.5 V68 M47 69 Q48.5 70.5 50 68 Q51.5 70.5 53 69', 1.4)}`,
  },
  gaina: {
    a: { eyeY: 50, eyeDx: 9, top: 27, headW: 50, neckY: 77 },
    back: () => `<path d="M40 31 C37 23 43 18 47 23 C47 15 56 15 55.5 22.5 C59 17.5 66 21 62 29 Z" fill="${C.red}" ${st(2)}/>`,
    head: (c) => `<circle cx="50" cy="52" r="25" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}${cheeks(a, 16, 8)}
      <path d="M47.5 63 C46 67.5 47 72 50 72 C53 72 54 67.5 52.5 63 Z" fill="${C.red}" ${st(1.8)}/>
      <path d="M44.5 57 Q50 55 55.5 57 L50 65 Z" fill="${C.orange}" ${st(1.8)}/>`,
  },
  vaca: {
    a: { eyeY: 46, eyeDx: 9, top: 25, headW: 48, neckY: 76 },
    back: (c) =>
      pair(
        `<path d="M34 31 C30 25 30 18 34 14 C36 19 39 23 42 27 Z" fill="${C.cream}" ${st(2)}/>` +
          `<ellipse cx="24" cy="44" rx="8.5" ry="4.5" transform="rotate(-25 24 44)" fill="${c.main}" ${st(2)}/>` +
          `<ellipse cx="24.5" cy="44" rx="4.5" ry="2" transform="rotate(-25 24.5 44)" fill="${C.pink}"/>`,
      ),
    head: (c) => `<circle cx="50" cy="49" r="24" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<path d="M34 30 C41 27 45 33 41 37 C37 40.5 31 37 32 33 Z" fill="${C.coal}"/>
      <path d="M61 55 C67 53 72 58 70 62.5 C68 66 62 64 61 60 Z" fill="${C.coal}"/>
      ${eyes(a)}
      <ellipse cx="50" cy="63" rx="15" ry="9.5" fill="${C.pink}" ${st(2.5)}/>
      <ellipse cx="44.5" cy="62" rx="2" ry="2.8" fill="${C.pinkDark}"/><ellipse cx="55.5" cy="62" rx="2" ry="2.8" fill="${C.pinkDark}"/>
      ${ink('M45 67.5 Q50 70.5 55 67.5', 1.6)}`,
  },
  porc: {
    a: { eyeY: 47, eyeDx: 9, top: 26, headW: 52, neckY: 78 },
    back: (c) =>
      pair(
        `<path d="M28 39 C24 30 25 21 29 16 C36 19 41 25 44 31 Z" fill="${c.main}" ${st(2.5)}/>` +
          `<path d="M30.5 33.5 C28.5 27.5 29 22.5 31 19.5 C35.5 22 38.5 25.5 40.5 29.5 Z" fill="${c.dark}"/>`,
      ),
    head: (c) => `<circle cx="50" cy="52" r="26" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}
      <circle cx="31.5" cy="56" r="4" fill="${C.pinkDark}" opacity=".55"/><circle cx="68.5" cy="56" r="4" fill="${C.pinkDark}" opacity=".55"/>
      <ellipse cx="50" cy="60" rx="10" ry="7.5" fill="${c.dark}" ${st(2.2)}/>
      <ellipse cx="46.3" cy="60" rx="1.8" ry="2.8" fill="${C.ink}"/><ellipse cx="53.7" cy="60" rx="1.8" ry="2.8" fill="${C.ink}"/>
      ${ink('M45 70 Q50 73 55 70', 1.6)}`,
  },
  leu: {
    fur: { main: C.yellow, dark: C.orangeDark, light: C.cream },
    a: { eyeY: 50, eyeDx: 8.5, top: 24, headW: 46, neckY: 77 },
    back: (c) =>
      `${MANE.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5" fill="${c.dark}" ${st(2.5)}/>`).join('')}<circle cx="50" cy="52" r="29.5" fill="${c.dark}"/>` +
      pair(`<circle cx="33" cy="33" r="6.5" fill="${c.main}" ${st(2)}/><circle cx="33" cy="33" r="3.2" fill="${c.light}"/>`),
    head: (c) => `<circle cx="50" cy="53" r="22" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}${cheeks(a, 13, 8, 3.2)}
      <ellipse cx="45.5" cy="61.5" rx="6" ry="4.8" fill="${c.light}"/><ellipse cx="54.5" cy="61.5" rx="6" ry="4.8" fill="${c.light}"/>
      <path d="M46.5 56.5 H53.5 L50 60.5 Z" fill="${C.brownDark}" stroke="${C.brownDark}" stroke-width="1.2" stroke-linejoin="round"/>
      ${ink('M50 60.5 V63 M46 64.5 Q48 66.5 50 63 Q52 66.5 54 64.5')}`,
  },
  tigru: {
    a: { eyeY: 48, eyeDx: 9.5, top: 26, headW: 52, neckY: 78 },
    back: (c) => pair(`<circle cx="30" cy="31" r="8" fill="${c.main}" ${st(2.5)}/><circle cx="30" cy="31" r="4" fill="${c.light}"/>`),
    head: (c) => `<circle cx="50" cy="52" r="26" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<path d="M50 27 V34 M42.5 28.5 L44.5 34 M57.5 28.5 L55.5 34 M25 48 L33 50.5 M25.5 55 L32.5 55.5 M75 48 L67 50.5 M74.5 55 L67.5 55.5" stroke="${C.coal}" stroke-width="2.4" stroke-linecap="round"/>
      ${eyes(a)}${cheeks(a, 16, 11, 3.2)}
      <ellipse cx="50" cy="61" rx="12" ry="9" fill="${C.white}"/>
      <path d="M46.5 56 H53.5 L50 60 Z" fill="${C.pinkDark}" stroke="${C.pinkDark}" stroke-width="1.2" stroke-linejoin="round"/>
      ${ink('M50 60 V62.5 M46 64 Q48 66 50 62.5 Q52 66 54 64')}`,
  },
  panda: {
    a: { eyeY: 49, eyeDx: 10, top: 26, headW: 52, neckY: 78 },
    bust: (c) => bust({ main: C.coal, light: c.main }),
    back: () => pair(`<circle cx="30" cy="31" r="8.5" fill="${C.coal}" ${st(2.5)}/>`),
    head: (c) => `<circle cx="50" cy="52" r="26" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${pair(`<ellipse cx="40" cy="49.5" rx="6.8" ry="8.8" transform="rotate(25 40 49.5)" fill="${C.coal}"/>`)}
      ${eyes(a, 'patch')}${cheeks(a, 18, 9, 3.4)}
      <ellipse cx="50" cy="62" rx="9.5" ry="7" fill="${c.light}"/>
      <ellipse cx="50" cy="58.5" rx="4" ry="2.9" fill="${C.coal}"/>
      ${ink('M50 61.3 V63.3 M46.5 64.5 Q48.2 66.2 50 63.3 Q51.8 66.2 53.5 64.5')}`,
  },
  koala: {
    a: { eyeY: 50, eyeDx: 10, top: 29, headW: 48, neckY: 77 },
    back: (c) => pair(`<circle cx="25" cy="39" r="12" fill="${c.main}" ${st(2.5)}/><circle cx="26" cy="40" r="7" fill="${c.light}"/>`),
    head: (c) => `<circle cx="50" cy="53" r="24" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}${cheeks(a, 16, 9, 3.4)}
      <path d="M44 54.5 C44 49.5 56 49.5 56 54.5 L55.5 62 C55 66.5 45 66.5 44.5 62 Z" fill="${C.coal}" ${st(1.5)}/>
      <ellipse cx="47.5" cy="54" rx="1.6" ry="2.4" fill="${C.white}" opacity=".35"/>
      ${ink('M45.5 69.5 Q50 72 54.5 69.5', 1.6)}`,
  },
  pinguin: {
    fur: { main: C.coal, dark: C.ink, light: C.white },
    a: { eyeY: 49, eyeDx: 8, top: 25, headW: 52, neckY: 77 },
    head: (c) => `<circle cx="50" cy="51" r="26" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<path d="M50 37 C44 30 31 33 30 47 C29 61 39 72 50 72 C61 72 71 61 70 47 C69 33 56 30 50 37 Z" fill="${c.light}"/>
      ${eyes(a)}${cheeks(a, 13, 9, 3.2)}
      <path d="M44 56.5 Q50 54 56 56.5 Q50 64 44 56.5 Z" fill="${C.orange}" ${st(1.8)}/>`,
  },
  bufnita: {
    a: { eyeY: 49, eyeDx: 10, top: 27, headW: 52, neckY: 78 },
    bust: (c) =>
      bust(c) +
      `<path d="M44 82 L46 85 L48 82 M52 82 L54 85 L56 82 M48 88 L50 91 L52 88" fill="none" stroke="${c.dark}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    back: (c) => pair(`<path d="M30 35 C26 27 26 19 29 12 C35 17 40 24 42 30 Z" fill="${c.main}" ${st(2.5)}/>`),
    head: (c) => `<ellipse cx="50" cy="52" rx="27" ry="25" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<circle cx="40" cy="49" r="10.5" fill="${c.light}" ${st(2)}/><circle cx="60" cy="49" r="10.5" fill="${c.light}" ${st(2)}/>
      <path d="M30 38 Q40 33 50 39 Q60 33 70 38" fill="none" stroke="${c.dark}" stroke-width="2.4" stroke-linecap="round"/>
      ${eyes(a, 'big')}
      <path d="M46.5 57.5 H53.5 L50 64 Z" fill="${C.yellowDark}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`,
  },
  broasca: {
    a: { eyeY: 39, eyeDx: 13, top: 24, headW: 40, neckY: 78, earY: 58, earDx: 31 },
    head: (c) => `<ellipse cx="50" cy="57" rx="30" ry="20" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<circle cx="37" cy="40" r="10" fill="${c.main}" ${st(2.5)}/><circle cx="63" cy="40" r="10" fill="${c.main}" ${st(2.5)}/>
      ${eyes(a, 'white')}${cheeks(a, 21, 22, 4.5)}
      ${ink('M33 61 Q50 73 67 61', 2.2)}
      <circle cx="46.5" cy="53" r="1.1" fill="${C.ink}"/><circle cx="53.5" cy="53" r="1.1" fill="${C.ink}"/>`,
  },
  maimuta: {
    a: { eyeY: 50, eyeDx: 7, top: 25, headW: 50, neckY: 76, earY: 53, earDx: 31 },
    back: (c) => pair(`<circle cx="23" cy="52" r="9" fill="${c.main}" ${st(2.5)}/><circle cx="23.5" cy="52" r="5" fill="${c.light}"/>`),
    head: (c) => `<circle cx="50" cy="50" r="25" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<path d="M46 27 C45 21 51 19 52.5 24 C55 20 60 22 58 28 Z" fill="${c.main}" ${st(2)}/>
      <path d="M50 44 C46 36.5 33.5 37.5 33.5 48 C33.5 58 40 70 50 73 C60 70 66.5 58 66.5 48 C66.5 37.5 54 36.5 50 44 Z" fill="${c.light}"/>
      ${eyes(a)}${cheeks(a, 11, 9, 3)}
      <circle cx="47.8" cy="59" r="1.1" fill="${C.ink}"/><circle cx="52.2" cy="59" r="1.1" fill="${C.ink}"/>
      ${ink('M43 64 Q50 69.5 57 64', 1.8)}`,
  },
  elefant: {
    a: { eyeY: 47, eyeDx: 10, top: 25, headW: 48, neckY: 79 },
    back: (c) =>
      pair(
        `<path d="M31 36 C14 24 3 38 5 55 C7 70 20 76 31 67 Z" fill="${c.main}" ${st(2.5)}/>` +
          `<path d="M29 42 C18 35 11 45 12 55 C13 64 21 68 28 62 Z" fill="${C.pink}" opacity=".75"/>`,
      ),
    head: (c) => `<ellipse cx="50" cy="50" rx="24" ry="24.5" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `${eyes(a)}${cheeks(a, 17, 10, 3.6)}
      <path d="M45 56 C44 63 44 69 47 73 C50 76 56 76 59 72 C60 70 58.5 68.5 57 69.5 C55 71 53 70.5 52.5 68 C52 64 55 60 55 56 Z" fill="${c.main}" ${st(2.5)}/>
      <path d="M45.5 62 H51.5 M46 66.5 H51.5" stroke="${c.dark}" stroke-width="1.4" stroke-linecap="round"/>`,
  },
  unicorn: {
    a: { eyeY: 49, eyeDx: 8.5, top: 28, headW: 46, neckY: 77 },
    back: (c) =>
      pair(
        `<path d="M36 30 C33 23 34 16 37 12 C42 16 45 22 45 28 Z" fill="${c.main}" ${st(2.5)}/>` +
          `<path d="M38 26 C36.5 21 37 17 38.5 15 C41 18 42.5 21.5 42.5 25 Z" fill="${C.pink}"/>`,
      ) +
      `<path d="M52 26 C40 18 24 24 22 38 C30 34 38 34 44 36 Z" fill="${C.pink}" ${st(2)}/>
      <path d="M40 32 C28 30 18 40 19 54 C25 48 31 46 36 46 Z" fill="${C.purpleLight}" ${st(2)}/>
      <path d="M34 44 C24 46 18 58 22 70 C26 62 31 58 36 57 Z" fill="${C.blueLight}" ${st(2)}/>`,
    head: (c) => `<ellipse cx="50" cy="52" rx="23" ry="25" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<path d="M44 30 C48 25.5 57 26 58.5 32 C54 30.5 50.5 32.5 48.5 36.5 C47.5 33.5 45.5 31.5 44 30 Z" fill="${C.pink}" ${st(1.8)}/>
      ${eyes(a)}${cheeks(a, 13, 9, 3.2)}
      <ellipse cx="50" cy="65" rx="11" ry="8" fill="${C.pinkLight}"/>
      <ellipse cx="46.5" cy="64.5" rx="1.2" ry="1.8" fill="${C.ink}"/><ellipse cx="53.5" cy="64.5" rx="1.2" ry="1.8" fill="${C.ink}"/>
      ${ink('M46 69.5 Q50 72 54 69.5')}`,
    front: () => `<path d="M46.5 31 L50 11 L53.5 31 Z" fill="${C.yellow}" ${st(2)}/>
      <path d="M47.3 26.5 L52.7 24.5 M48 21 L52 19.5 M48.8 16 L51.2 15" stroke="${C.yellowDark}" stroke-width="1.5" stroke-linecap="round"/>`,
  },
};
