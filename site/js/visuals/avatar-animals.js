// Animalele avatarului. Pentru fiecare: ancorele accesoriilor (`a`) și părțile desenate peste umeri: din spate (`back`: urechi, coamă),
// capul (`head`) și fața (`face`); `front` stă peste accesorii. Fiecare parte primește nuanțele blănii (`c`: cele alese sau cele
// naturale) și ancorele; ce nu ține de blană (ciocul, nasul, interiorul urechilor) are culoarea lui.
// Ancorele: ochii la (50 ± eyeDx, eyeY); `top` e creștetul, unde stă o pălărie, pentru un cap lat de `headW`; `neckY` e gâtul.
// `place` mută sau micșorează un accesoriu pe acest animal: { hat, face, neck: { dx, dy, s } }. `fur` = paleta proprie (fără culoare naturală).

import { cheeks, eyes, pair, smile } from './avatar-parts.js';
import { C, st } from './palette.js';

/** Un animal încă nedesenat: cap rotund, cu urechi rotunde. */
export const GENERIC = {
  a: { eyeY: 49, eyeDx: 9.5, top: 25, headW: 50, neckY: 77 },
  back: (c) => pair(`<circle cx="30" cy="31" r="8.5" fill="${c.main}" ${st(2.5)}/><circle cx="30" cy="31" r="4.5" fill="${c.light}"/>`),
  head: (c) => `<circle cx="50" cy="51" r="26" fill="${c.main}" ${st(2.5)}/>`,
  face: (c, a) =>
    `${eyes(a)}${cheeks(a)}<ellipse cx="50" cy="60" rx="11" ry="8.5" fill="${c.light}"/><ellipse cx="50" cy="56.5" rx="4" ry="3" fill="${C.ink}"/>${smile(61.5, 4, 3)}`,
};

export const ANIMAL_ART = {
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
      <path d="M50 60.5 V63 M46 64 Q48 66 50 63 Q52 66 54 64" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="48.2" y="65" width="3.6" height="3.6" rx="1" fill="${C.white}" stroke="${C.ink}" stroke-width="1"/>`,
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
  broasca: {
    a: { eyeY: 39, eyeDx: 13, top: 24, headW: 40, neckY: 78, earY: 58, earDx: 31 },
    head: (c) => `<ellipse cx="50" cy="57" rx="30" ry="20" fill="${c.main}" ${st(2.5)}/>`,
    face: (c, a) => `<circle cx="37" cy="40" r="10" fill="${c.main}" ${st(2.5)}/><circle cx="63" cy="40" r="10" fill="${c.main}" ${st(2.5)}/>
      ${eyes(a, 'white')}${cheeks(a, 21, 22, 4.5)}
      <path d="M33 61 Q50 73 67 61" fill="none" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="46.5" cy="53" r="1.1" fill="${C.ink}"/><circle cx="53.5" cy="53" r="1.1" fill="${C.ink}"/>`,
  },
};
