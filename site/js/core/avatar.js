// Avatarul unui profil: un animal desenat, cu o culoare, un fundal și accesorii pe cap, pe față și la gât, scris ca un singur text
// canonic, `animal[.culoare-C][.fundal-F][.cap-H][.fata-O][.gat-G]` (câmpul `avatar` din profil și din intrările clasamentelor).
// Ce e implicit nu se scrie (culoarea naturală, fundalul albastru, accesoriul lipsă), deci avatarele de dinainte (`vulpe`) rămân valabile.
// Pur, fără DOM (tests/avatar.test.js). Aceleași id-uri stau în firestore.rules (tests/cloud.test.js le compară) și nu se mai scot:
// regulile verifică avatarul la fiecare scriere a profilului. Desenul e în visuals/avatar.js.

/** Animalele, în ordinea din atelier (cele 12 de dinainte de v0.12 primele); `natural` = culoarea lui din listă sau null (paletă proprie). */
export const ANIMALS = [
  { id: 'veverita', label: 'veveriță', gender: 'f', natural: 'portocaliu' },
  { id: 'iepure', label: 'iepure', gender: 'm', natural: 'alb' },
  { id: 'vulpe', label: 'vulpe', gender: 'f', natural: 'portocaliu' },
  { id: 'urs', label: 'urs', gender: 'm', natural: 'maro' },
  { id: 'arici', label: 'arici', gender: 'm', natural: 'maro' },
  { id: 'pisica', label: 'pisică', gender: 'f', natural: 'gri' },
  { id: 'caine', label: 'câine', gender: 'm', natural: null },
  { id: 'rata', label: 'rață', gender: 'f', natural: 'galben' },
  { id: 'lup', label: 'lup', gender: 'm', natural: null },
  { id: 'cal', label: 'cal', gender: 'm', natural: 'maro' },
  { id: 'oaie', label: 'oaie', gender: 'f', natural: 'alb' },
  { id: 'gaina', label: 'găină', gender: 'f', natural: 'alb' },
  { id: 'vaca', label: 'vacă', gender: 'f', natural: 'alb' },
  { id: 'porc', label: 'porc', gender: 'm', natural: 'roz' },
  { id: 'leu', label: 'leu', gender: 'm', natural: null },
  { id: 'tigru', label: 'tigru', gender: 'm', natural: 'portocaliu' },
  { id: 'panda', label: 'panda', gender: 'm', natural: 'alb' },
  { id: 'koala', label: 'koala', gender: 'm', natural: 'gri' },
  { id: 'pinguin', label: 'pinguin', gender: 'm', natural: null },
  { id: 'bufnita', label: 'bufniță', gender: 'f', natural: 'maro' },
  { id: 'broasca', label: 'broască', gender: 'f', natural: 'verde' },
  { id: 'maimuta', label: 'maimuță', gender: 'f', natural: 'maro' },
  { id: 'elefant', label: 'elefant', gender: 'm', natural: 'gri' },
  { id: 'unicorn', label: 'unicorn', gender: 'm', natural: 'alb' },
];

/** Culorile, cu forma de masculin și de feminin: numele se acordă cu animalul („urs albastru”, „vulpe albastră”). */
export const COLORS = [
  { id: 'alb', m: 'alb', f: 'albă' },
  { id: 'gri', m: 'gri', f: 'gri' },
  { id: 'maro', m: 'maro', f: 'maro' },
  { id: 'rosu', m: 'roșu', f: 'roșie' },
  { id: 'portocaliu', m: 'portocaliu', f: 'portocalie' },
  { id: 'galben', m: 'galben', f: 'galbenă' },
  { id: 'verde', m: 'verde', f: 'verde' },
  { id: 'turcoaz', m: 'turcoaz', f: 'turcoaz' },
  { id: 'albastru', m: 'albastru', f: 'albastră' },
  { id: 'mov', m: 'mov', f: 'mov' },
  { id: 'roz', m: 'roz', f: 'roz' },
];

export const DEFAULT_BACKGROUND = 'albastru';

/** Fundalurile; eticheta vine după „pe fundal”. */
export const BACKGROUNDS = [
  { id: 'albastru', label: 'albastru' },
  { id: 'verde', label: 'verde' },
  { id: 'galben', label: 'galben' },
  { id: 'crem', label: 'crem' },
  { id: 'roz', label: 'roz' },
  { id: 'mov', label: 'mov' },
  { id: 'turcoaz', label: 'turcoaz' },
  { id: 'gri', label: 'gri' },
  { id: 'noapte', label: 'de noapte' },
];

export const HATS = [
  { id: 'coroana', label: 'coroană' },
  { id: 'joben', label: 'joben' },
  { id: 'fundita', label: 'fundiță' },
  { id: 'casti', label: 'căști' },
  { id: 'sapca', label: 'șapcă' },
  { id: 'floare', label: 'floare' },
  { id: 'petrecere', label: 'coif de petrecere' },
  { id: 'caciula', label: 'căciulă cu moț' },
];

export const FACES = [
  { id: 'ochelari', label: 'ochelari' },
  { id: 'soare', label: 'ochelari de soare' },
  { id: 'inimioare', label: 'ochelari cu inimioare' },
  { id: 'masca', label: 'mască de supererou' },
];

export const NECKS = [
  { id: 'papion', label: 'papion' },
  { id: 'fular', label: 'fular' },
  { id: 'medalie', label: 'medalie' },
  { id: 'clopotel', label: 'clopoțel' },
];

/** Locurile din text, în ordine: segmentul `cheie-id`, câmpul din aspect, lista și valoarea care nu se scrie. */
export const SLOTS = [
  { key: 'culoare', field: 'color', list: COLORS, none: null },
  { key: 'fundal', field: 'background', list: BACKGROUNDS, none: DEFAULT_BACKGROUND },
  { key: 'cap', field: 'hat', list: HATS, none: null },
  { key: 'fata', field: 'face', list: FACES, none: null },
  { key: 'gat', field: 'neck', list: NECKS, none: null },
];

/** Aspectul implicit: veverița în culoarea ei, pe fundal albastru, fără accesorii. */
export const DEFAULT_LOOK = Object.freeze({ animal: ANIMALS[0].id, color: null, background: DEFAULT_BACKGROUND, hat: null, face: null, neck: null });

// căutare doar în liste (niciodată obiect[text]): un text ca „constructor” nu găsește nimic
const find = (list, id) => (typeof id === 'string' ? (list.find((x) => x.id === id) ?? null) : null);

/** Animalul unui id; un id necunoscut dă veverița. */
export const animalOf = (id) => find(ANIMALS, id) ?? ANIMALS[0];

/** Culoarea unui aspect sau null când e cea naturală a animalului. */
export function lookColor(look) {
  const color = find(COLORS, look?.color);
  return color && color.id !== animalOf(look?.animal).natural ? color.id : null;
}

/** Aspectul din text, tolerant (nu aruncă): animalul necunoscut devine veverița, segmentele necunoscute se ignoră. */
export function parseAvatar(value) {
  const [first, ...segments] = String(value ?? '').slice(0, 200).split('.');
  const look = { ...DEFAULT_LOOK, animal: animalOf(first).id };
  for (const segment of segments) {
    const dash = segment.indexOf('-');
    const slot = dash > 0 ? SLOTS.find((s) => s.key === segment.slice(0, dash)) : null;
    const item = slot ? find(slot.list, segment.slice(dash + 1)) : null;
    if (item) look[slot.field] = item.id;
  }
  return { ...look, color: lookColor(look) };
}

/** Textul canonic al unui aspect: locurile în ordine, fără valorile implicite (același aspect, același text). */
export function avatarId(look) {
  const animal = animalOf(look?.animal);
  const parts = [animal.id];
  for (const slot of SLOTS) {
    const item = find(slot.list, look?.[slot.field]);
    if (item && item.id !== slot.none && !(slot.field === 'color' && item.id === animal.natural)) parts.push(`${slot.key}-${item.id}`);
  }
  return parts.join('.');
}

const choice = (list) => `(${list.map((x) => x.id).join('|')})`;

/** Forma textului, ca în validAvatar() din firestore.rules: locurile în ordine, fără valorile implicite. */
export const AVATAR_PATTERN = new RegExp(
  `^${choice(ANIMALS)}${SLOTS.map((s) => `([.]${s.key}-${choice(s.list.filter((x) => x.id !== s.none))})?`).join('')}$`,
);

/** Un avatar bun de salvat: forma din reguli și textul canonic. */
export const isAvatar = (value) => typeof value === 'string' && AVATAR_PATTERN.test(value) && avatarId(parseAvatar(value)) === value;

/** Numele culorii acordat cu genul animalului: „albastru” / „albastră”. */
export const colorWord = (color, gender) => find(COLORS, color)?.[gender === 'f' ? 'f' : 'm'] ?? '';

const joinWords = (words) => (words.length > 1 ? `${words.slice(0, -1).join(', ')} și ${words.at(-1)}` : (words[0] ?? ''));

/** Numele avatarului, pentru cititorul de ecran: „vulpe albastră cu coroană, ochelari și papion, pe fundal de noapte”. */
export function avatarLabel(value) {
  const look = parseAvatar(value);
  const animal = animalOf(look.animal);
  const worn = [find(HATS, look.hat), find(FACES, look.face), find(NECKS, look.neck)].filter(Boolean).map((x) => x.label);
  return [
    animal.label,
    look.color ? ` ${colorWord(look.color, animal.gender)}` : '',
    worn.length ? ` cu ${joinWords(worn)}` : '',
    look.background !== DEFAULT_BACKGROUND ? `, pe fundal ${find(BACKGROUNDS, look.background).label}` : '',
  ].join('');
}

/** Un aspect la întâmplare pentru același animal: orice culoare și orice fundal, iar fiecare accesoriu lipsește cam o dată din două. */
export function randomLook(look, rand = Math.random) {
  const animal = animalOf(look?.animal);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const worn = (list) => (rand() < 0.5 ? null : pick(list).id);
  return {
    animal: animal.id,
    color: pick([null, ...COLORS.map((c) => c.id).filter((id) => id !== animal.natural)]),
    background: pick(BACKGROUNDS).id,
    hat: worn(HATS),
    face: worn(FACES),
    neck: worn(NECKS),
  };
}

/** Aspectul unui profil nou: primul animal pe care nu-l are încă alt profil (după avatarele lor), cu aspectul implicit. */
export function defaultLook(usedAvatars = []) {
  const used = new Set(usedAvatars.map((a) => parseAvatar(a).animal));
  return { ...DEFAULT_LOOK, animal: (ANIMALS.find((a) => !used.has(a.id)) ?? ANIMALS[0]).id };
}
