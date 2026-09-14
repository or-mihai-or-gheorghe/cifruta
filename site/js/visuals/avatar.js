// Avatarul desenat al unui profil (vizualul `avatar`, cu parametrul `avatar` = textul din profil). Straturile, din spate în față:
// discul fundalului, umerii, părțile din spate ale animalului, capul, fața, apoi accesoriile de față, de gât și de cap.
// Textul se citește cu parseAvatar, deci în SVG ajung doar id-uri din listele din core/avatar.js. Fără id-uri și fără clipPath:
// același avatar poate apărea de oricâte ori pe pagină. Mărimea vine din container (.v-svg are lățimea 100%).

import { animalOf, avatarId, avatarLabel, isAvatar, parseAvatar } from '../core/avatar.js';
import { ANIMAL_ART, GENERIC } from './avatar-animals.js';
import { bust, DISC, FUR, r2 } from './avatar-parts.js';
import { registerVisual, visualSVG } from './index.js';
import { C, st } from './palette.js';

const BACKGROUND_FILL = {
  albastru: C.blueLight, verde: C.grassLight, galben: C.yellowLight, crem: C.cream, roz: C.pink,
  mov: C.purpleLight, turcoaz: C.tealLight, gri: C.grayLight, noapte: C.space,
};
const NIGHT_STARS = [[21, 27, 1.7], [77, 21, 1.4], [13, 52, 1.2], [87, 47, 1.6], [31, 14, 1.1], [66, 13, 1]];

function background(id) {
  const stars = id === 'noapte' ? NIGHT_STARS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.yellow}"/>`).join('') : '';
  return `<circle cx="${DISC.cx}" cy="${DISC.cy}" r="${DISC.r}" fill="${BACKGROUND_FILL[id] ?? BACKGROUND_FILL.albastru}" ${st(2.5)}/>${stars}`;
}

// ——— accesoriile: fiecare desenat o dată, în jurul ancorei (0, 0), apoi așezat și scalat pe animal ———

const flower = [0, 60, 120, 180, 240, 300].map((d) => `<ellipse cx="0" cy="-5.2" rx="3.3" ry="4.8" fill="${C.white}" ${st(1.4)} transform="rotate(${d})"/>`).join('');

/** Pe cap: (0, 0) e creștetul unui cap lat de 50. */
const HAT_ART = {
  coroana: `<path d="M-15 8 L-17 -9 L-8 -1 L0 -14 L8 -1 L17 -9 L15 8 Q0 11 -15 8 Z" fill="${C.yellow}" ${st(2)}/>
    <path d="M-15.3 4.5 Q0 7.5 15.3 4.5" fill="none" stroke="${C.yellowDark}" stroke-width="2"/>
    <circle cx="-17" cy="-9" r="2.3" fill="${C.yellow}" ${st(1.5)}/><circle cx="0" cy="-14" r="2.3" fill="${C.yellow}" ${st(1.5)}/><circle cx="17" cy="-9" r="2.3" fill="${C.yellow}" ${st(1.5)}/>
    <circle cx="0" cy="1.5" r="2.4" fill="${C.red}" ${st(1.2)}/><circle cx="-8.5" cy="3" r="1.7" fill="${C.blue}" ${st(1)}/><circle cx="8.5" cy="3" r="1.7" fill="${C.green}" ${st(1)}/>`,
  joben: `<ellipse cx="0" cy="3" rx="21" ry="4.5" fill="${C.coal}" ${st(2)}/>
    <path d="M-12 3 L-11 -18 Q0 -21 11 -18 L12 3 Q0 6 -12 3 Z" fill="${C.coal}" ${st(2)}/>
    <path d="M-11.8 -2 Q0 1 11.8 -2 L11.9 2 Q0 5 -11.9 2 Z" fill="${C.red}"/>
    <path d="M-7 -15 V-5" stroke="${C.white}" stroke-width="2" opacity=".35" stroke-linecap="round"/>`,
  fundita: `<g transform="translate(-14 3) rotate(-15)">
    <path d="M-2 2 L-6 11 L-1.5 9.5 Z M2 2 L6 11 L1.5 9.5 Z" fill="${C.redDark}" ${st(1.5)}/>
    <path d="M0 0 C-4 -9 -15 -10 -15 -2 C-15 6 -5 6 0 0 Z M0 0 C4 -9 15 -10 15 -2 C15 6 5 6 0 0 Z" fill="${C.red}" ${st(2)}/>
    <ellipse cx="0" cy="0" rx="3.6" ry="4.2" fill="${C.redDark}" ${st(1.8)}/></g>`,
  sapca: `<path d="M7 5 C15 2 27 3 31 8 C23 11 12 10 5 8.5 Z" fill="${C.blueDark}" ${st(2)}/>
    <path d="M-17 8.5 C-18 -12 17 -12 17 8.5 Q0 11.5 -17 8.5 Z" fill="${C.blue}" ${st(2)}/>
    <path d="M0 -6.5 V9" stroke="${C.blueDark}" stroke-width="1.5"/><circle cx="0" cy="-7" r="2" fill="${C.blueDark}" ${st(1.2)}/>`,
  floare: `<g transform="translate(15 1)">${flower}<circle cx="0" cy="0" r="3.4" fill="${C.yellow}" ${st(1.4)}/></g>`,
  petrecere: `<g transform="rotate(8)">
    <path d="M-11 7 L0 -17 L11 7 Q0 10 -11 7 Z" fill="${C.purple}" ${st(2)}/>
    <path d="M-7.1 -1 Q0 1.5 7.1 -1" fill="none" stroke="${C.yellow}" stroke-width="2.2"/><path d="M-3.4 -9 Q0 -7.5 3.4 -9" fill="none" stroke="${C.yellow}" stroke-width="2"/>
    <circle cx="0" cy="-18" r="3.2" fill="${C.pink}" ${st(1.5)}/></g>`,
  caciula: `<path d="M-19 9 C-20 -13 20 -13 19 9 Z" fill="${C.red}" ${st(2)}/>
    <path d="M-8 -5 C-7 -1 -7 4 -7 8 M0 -7 V8 M8 -5 C7 -1 7 4 7 8" fill="none" stroke="${C.redDark}" stroke-width="1.5"/>
    <rect x="-21" y="4" width="42" height="9" rx="4.5" fill="${C.white}" ${st(2)}/><circle cx="0" cy="-11" r="5" fill="${C.white}" ${st(2)}/>`,
};

/** Căștile au două ancore: banda peste creștet și cupele pe marginile capului (implicit lângă ochi; pe animal, `earY` și `earDx`). */
function headphones(a, t) {
  const half = r2(a.earDx ?? (a.headW / 2 + 1.5) * t.s);
  const cupY = r2((a.earY ?? a.eyeY + 2) - a.top);
  const band = `M${-half} ${r2(cupY - 5)} C${-half} -12 ${half} -12 ${half} ${r2(cupY - 5)}`;
  const cup = (x) =>
    `<rect x="${r2(x - 4.5)}" y="${r2(cupY - 8)}" width="9" height="16" rx="4.5" fill="${C.red}" ${st(2)}/>` +
    `<rect x="${r2(x - 1.8)}" y="${r2(cupY - 5)}" width="3.6" height="10" rx="1.8" fill="${C.redDark}"/>`;
  return (
    `<g transform="translate(${r2(50 + t.dx)} ${r2(a.top + t.dy)})">` +
    `<path d="${band}" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="${band}" fill="none" stroke="${C.blueDark}" stroke-width="3.2" stroke-linecap="round"/>${cup(-half)}${cup(half)}</g>`
  );
}

const heart = 'M0 5.5 C-7.5 0.5 -8.5 -4.5 -5 -6.5 C-2.8 -7.7 -0.9 -6.5 0 -4.5 C0.9 -6.5 2.8 -7.7 5 -6.5 C8.5 -4.5 7.5 0.5 0 5.5 Z';

/** Pe față: (0, 0) e între ochi, pentru ochii la ±9,5. */
const FACE_ART = {
  ochelari: `<path d="M-16 -1.5 L-20.5 -4 M16 -1.5 L20.5 -4" stroke="${C.blueDark}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="-9.5" cy="0" r="6.6" fill="${C.white}" fill-opacity=".35" stroke="${C.blueDark}" stroke-width="2.6"/>
    <circle cx="9.5" cy="0" r="6.6" fill="${C.white}" fill-opacity=".35" stroke="${C.blueDark}" stroke-width="2.6"/>
    <path d="M-2.9 -0.6 Q0 -2.8 2.9 -0.6" fill="none" stroke="${C.blueDark}" stroke-width="2.4" stroke-linecap="round"/>`,
  soare: `<path d="M-17 -5 L-21 -6.5 M17 -5 L21 -6.5" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>
    <path d="M-17 -5.5 H-2.6 C-2.6 2.5 -5.2 6.5 -9.8 6.5 C-14.6 6.5 -17 2 -17 -5.5 Z M17 -5.5 H2.6 C2.6 2.5 5.2 6.5 9.8 6.5 C14.6 6.5 17 2 17 -5.5 Z" fill="${C.coal}" ${st(1.8)}/>
    <path d="M-2.6 -4 Q0 -5.5 2.6 -4" fill="none" stroke="${C.ink}" stroke-width="2"/>
    <path d="M-15 -3 H-11 M4.5 -3 H8.5" stroke="${C.white}" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>`,
  inimioare: `<path d="M-17 -2.5 L-20.5 -4.5 M17 -2.5 L20.5 -4.5" stroke="${C.redDark}" stroke-width="2" stroke-linecap="round"/>
    <path d="${heart}" transform="translate(-9.5 0.8)" fill="${C.red}" fill-opacity=".5" stroke="${C.redDark}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${heart}" transform="translate(9.5 0.8)" fill="${C.red}" fill-opacity=".5" stroke="${C.redDark}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-2 -1.5 Q0 -3 2 -1.5" fill="none" stroke="${C.redDark}" stroke-width="2.2" stroke-linecap="round"/>`,
  masca: `<path d="M-24 -3.5 L-19 -1.5 M-23.5 1.5 L-19 0" stroke="${C.purple}" stroke-width="2.4" stroke-linecap="round"/>
    <path fill-rule="evenodd" d="M-19.5 -1.5 C-18 -9 -6.5 -9.5 0 -5 C6.5 -9.5 18 -9 19.5 -1.5 C18.5 6.5 7 7.5 0 3.5 C-7 7.5 -18.5 6.5 -19.5 -1.5 Z M-15 0 A5.5 4.6 0 1 0 -4 0 A5.5 4.6 0 1 0 -15 0 Z M4 0 A5.5 4.6 0 1 0 15 0 A5.5 4.6 0 1 0 4 0 Z" fill="${C.purple}" ${st(1.8)}/>`,
};

/** La gât: (0, 0) e sub bărbie, pentru un cap lat de 50. */
const NECK_ART = {
  papion: `<path d="M0 0 L-11.5 -6.5 Q-13.5 0 -11.5 6.5 Z M0 0 L11.5 -6.5 Q13.5 0 11.5 6.5 Z" fill="${C.red}" ${st(2)}/>
    <rect x="-3.4" y="-3.8" width="6.8" height="7.6" rx="2.2" fill="${C.redDark}" ${st(1.6)}/>`,
  fular: `<path d="M5 3 L14 3.5 L15.5 15 L7.5 15 Z" fill="${C.teal}" ${st(2)}/>
    <path d="M8.5 15.5 V17 M11.5 15.5 V17 M14.5 15.5 V17" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M9 8.5 L14.3 8.8 M9.6 12 L14.8 12.2" stroke="${C.yellow}" stroke-width="2.2"/>
    <path d="M-19 -4 C-8 2 8 2 19 -4 L19 3 C8 9 -8 9 -19 3 Z" fill="${C.teal}" ${st(2)}/>
    <path d="M-11 0 V5 M-2 1.6 V6.6 M7 1 V6" stroke="${C.yellow}" stroke-width="2.4"/>`,
  medalie: `<path d="M-8 -3 L-2.5 10 L1.5 10 L-3.5 -3 Z" fill="${C.blue}" ${st(1.5)}/><path d="M8 -3 L2.5 10 L-1.5 10 L3.5 -3 Z" fill="${C.red}" ${st(1.5)}/>
    <circle cx="0" cy="12.5" r="5.8" fill="${C.yellow}" ${st(2)}/>
    <path d="M0 9.3 L1 11.5 L3.3 11.7 L1.6 13.2 L2.1 15.5 L0 14.3 L-2.1 15.5 L-1.6 13.2 L-3.3 11.7 L-1 11.5 Z" fill="${C.yellowDark}"/>`,
  clopotel: `<path d="M-17 -3 Q0 5 17 -3 L17 2.5 Q0 10.5 -17 2.5 Z" fill="${C.red}" ${st(2)}/>
    <path d="M-4.6 12 C-4.6 7 -3 5.2 0 5.2 C3 5.2 4.6 7 4.6 12 L6 13.5 H-6 Z" fill="${C.yellow}" ${st(1.8)}/><circle cx="0" cy="14.8" r="1.7" fill="${C.ink}"/>`,
};

const place = (x, y, s, body) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2(s)})">${body}</g>`;
const tweak = (art, slot) => ({ dx: 0, dy: 0, s: 1, ...(art.place?.[slot] ?? {}) });

function hatSVG(id, art) {
  if (!id) return '';
  const t = tweak(art, 'hat');
  if (id === 'casti') return headphones(art.a, t);
  return place(50 + t.dx, art.a.top + t.dy, (art.a.headW / 50) * t.s, HAT_ART[id]);
}

function faceSVG(id, art) {
  if (!id) return '';
  const t = tweak(art, 'face');
  return place(50 + t.dx, art.a.eyeY + t.dy, (art.a.eyeDx / 9.5) * t.s, FACE_ART[id]);
}

function neckSVG(id, art) {
  if (!id) return '';
  const t = tweak(art, 'neck');
  return place(50 + t.dx, art.a.neckY + t.dy, (art.a.headW / 50) * t.s, NECK_ART[id]);
}

// paleta proprie a unui animal fără culoare naturală în listă, dacă desenul lui nu are `fur`: diferită de toate culorile din listă
const OWN_FUR = { main: C.brownLight, dark: C.brown, light: C.cream };

function render(p) {
  const look = parseAvatar(p.avatar);
  const art = ANIMAL_ART[look.animal] ?? GENERIC;
  const c = look.color ? FUR[look.color] : (art.fur ?? FUR[animalOf(look.animal).natural] ?? OWN_FUR);
  return [
    background(look.background),
    art.bust ? art.bust(c, art.a) : bust(c),
    art.back ? art.back(c, art.a) : '',
    art.head(c, art.a),
    art.face(c, art.a),
    faceSVG(look.face, art),
    neckSVG(look.neck, art),
    hatSVG(look.hat, art),
    art.front ? art.front(c, art.a) : '',
  ].join('');
}

registerVisual('avatar', {
  group: 'Avatare',
  defaults: { avatar: 'veverita' },
  label: (p) => avatarLabel(p.avatar),
  check: (p) => (isAvatar(p.avatar) ? [] : [`avatar necunoscut sau necanonic: ${p.avatar}`]),
  render,
  demos: [
    'iepure',
    'rata.cap-coroana.gat-papion',
    'elefant.culoare-albastru.fundal-galben.cap-joben.fata-ochelari.gat-fular',
    'broasca.fundal-noapte.cap-petrecere.fata-soare.gat-medalie',
    'vulpe.culoare-mov.fundal-roz.cap-fundita.fata-inimioare.gat-clopotel',
    'urs.culoare-verde.fundal-turcoaz.cap-casti.fata-masca',
    'pisica.culoare-portocaliu.fundal-crem.cap-sapca',
    'veverita.culoare-rosu.fundal-gri.cap-floare',
    'unicorn.fundal-mov.cap-caciula',
    'leu.culoare-turcoaz.fundal-verde',
    'oaie.culoare-roz',
    'panda.culoare-galben',
    'caine.culoare-gri',
    'pinguin.culoare-maro',
    'urs.culoare-alb',
  ].map((avatar) => ({ avatar })),
});

/** Avatarul ca SVG, din orice text (se citește tolerant, deci un avatar necunoscut devine cel implicit). */
export const avatarSVG = (value, { cls } = {}) => visualSVG({ v: 'avatar', avatar: avatarId(parseAvatar(value)), ...(cls ? { class: cls } : {}) });
