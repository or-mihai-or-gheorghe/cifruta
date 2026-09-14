// Avatarele desenate: nuanțele blănii, discul fundalului, umerii, ochii, obrajii și oglindirea, folosite de visuals/avatar.js și
// visuals/avatar-animals.js. Desenul are viewBox-ul 0 0 100 100; discul fundalului are centrul (50, 53) și raza 45.

import { C, st } from './palette.js';

/** Nuanțele fiecărei culori din core/avatar.js: blana (main), umbrele și petele (dark), botul, burta și interiorul urechilor (light). */
export const FUR = {
  alb: { main: C.white, dark: C.gray, light: C.cream },
  gri: { main: C.gray, dark: C.grayDark, light: C.grayLight },
  maro: { main: C.brown, dark: C.brownDark, light: C.brownLight },
  rosu: { main: C.red, dark: C.redDark, light: C.redLight },
  portocaliu: { main: C.orange, dark: C.orangeDark, light: C.cream },
  galben: { main: C.yellow, dark: C.yellowDark, light: C.cream },
  verde: { main: C.green, dark: C.greenDark, light: C.grassLight },
  turcoaz: { main: C.teal, dark: C.tealDark, light: C.tealLight },
  albastru: { main: C.blue, dark: C.blueDark, light: C.sky },
  mov: { main: C.purple, dark: C.purpleDark, light: C.purpleLight },
  roz: { main: C.pink, dark: C.pinkDark, light: C.pinkLight },
};

export const DISC = { cx: 50, cy: 53, r: 45 };

/** Număr rotunjit la două zecimale, pentru coordonatele calculate. */
export const r2 = (n) => Math.round(n * 100) / 100;

/** Partea din stânga și copia ei oglindită față de axa x = 50. */
export const pair = (svg) => `${svg}<g transform="matrix(-1 0 0 1 100 0)">${svg}</g>`;

/** Punctul din stânga de pe marginea discului, la înălțimea y. */
export const discLeft = (y) => r2(DISC.cx - Math.sqrt(DISC.r ** 2 - (y - DISC.cy) ** 2));

/** Umerii: o movilă de la gât (`top`) până la marginea discului, cu burta (`light`) la mijloc. */
export function bust(c, { top = 73, chest = true } = {}) {
  const y = 86;
  const left = discLeft(y);
  const right = r2(100 - left);
  return (
    `<path d="M${left} ${y} C${r2(left + 2)} ${top + 5} 32 ${top} 50 ${top} C68 ${top} ${r2(right - 2)} ${top + 5} ${right} ${y} ` +
    `A${DISC.r} ${DISC.r} 0 0 1 ${left} ${y} Z" fill="${c.main}" ${st(2.5)}/>` +
    (chest ? `<ellipse cx="50" cy="89.5" rx="11" ry="6.5" fill="${c.light}"/>` : '')
  );
}

/**
 * Ochii la (50 ± eyeDx, eyeY): `dot` ca la mascotă, `big` mai mari (bufnița), `white` cu albul ochiului (ochii broaștei),
 * `patch` mici și albi, pe petele închise ale pandei.
 */
export function eyes(a, style = 'dot') {
  const y = a.eyeY;
  const one = (x) => {
    if (style === 'white') {
      return `<circle cx="${x}" cy="${y}" r="5.4" fill="${C.white}" ${st(1.8)}/><circle cx="${x}" cy="${r2(y + 0.5)}" r="3.2" fill="${C.ink}"/>` +
        `<circle cx="${r2(x + 1.1)}" cy="${r2(y - 0.7)}" r="1.1" fill="${C.white}"/>`;
    }
    if (style === 'patch') {
      return `<circle cx="${x}" cy="${y}" r="3.4" fill="${C.white}"/><circle cx="${x}" cy="${r2(y + 0.3)}" r="2.1" fill="${C.ink}"/>` +
        `<circle cx="${r2(x + 0.7)}" cy="${r2(y - 0.5)}" r="0.7" fill="${C.white}"/>`;
    }
    const r = style === 'big' ? 5.4 : 4.2;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.ink}"/><circle cx="${r2(x + r / 3)}" cy="${r2(y - r / 3)}" r="${r2(r / 3)}" fill="${C.white}"/>`;
  };
  return one(r2(50 - a.eyeDx)) + one(r2(50 + a.eyeDx));
}

/** Obrajii roz, la (50 ± dx, eyeY + dy). */
export const cheeks = (a, dx = a.eyeDx + 8, dy = 8, r = 4) =>
  [50 - dx, 50 + dx].map((x) => `<circle cx="${r2(x)}" cy="${r2(a.eyeY + dy)}" r="${r}" fill="${C.pink}" opacity=".85"/>`).join('');

/** Un zâmbet cu centrul la (50, y). */
export const smile = (y, w = 4.5, depth = 3.5, width = 1.8) =>
  `<path d="M${r2(50 - w)} ${y} Q50 ${r2(y + depth)} ${r2(50 + w)} ${y}" fill="none" stroke="${C.ink}" stroke-width="${width}" stroke-linecap="round"/>`;
