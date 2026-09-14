// Avatarul desenat: modelul din core/avatar.js (listele, textul canonic, numele, alegerea la întâmplare).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ANIMALS, animalOf, AVATAR_PATTERN, avatarId, avatarLabel, BACKGROUNDS, COLORS, colorWord, DEFAULT_BACKGROUND, DEFAULT_LOOK, defaultLook, FACES,
  HATS, isAvatar, lookColor, NECKS, parseAvatar, randomLook, SLOTS,
} from '../site/js/core/avatar.js';
import { seededRandom } from '../site/js/core/rng.js';

const LEGACY = ['veverita', 'iepure', 'vulpe', 'urs', 'arici', 'pisica', 'caine', 'rata', 'lup', 'cal', 'oaie', 'gaina'];

// Id-urile publicate: stau în profiluri și în clasamente, iar regulile verifică avatarul la fiecare scriere a profilului (și la
// contoare), deci niciunul nu se mai scoate. Un id nou se adaugă aici când se publică.
const PUBLISHED = {
  animal: [...LEGACY, 'vaca', 'porc', 'leu', 'tigru', 'panda', 'koala', 'pinguin', 'bufnita', 'broasca', 'maimuta', 'elefant', 'unicorn'],
  culoare: ['alb', 'gri', 'maro', 'rosu', 'portocaliu', 'galben', 'verde', 'turcoaz', 'albastru', 'mov', 'roz'],
  fundal: ['albastru', 'verde', 'galben', 'crem', 'roz', 'mov', 'turcoaz', 'gri', 'noapte'],
  cap: ['coroana', 'joben', 'fundita', 'casti', 'sapca', 'floare', 'petrecere', 'caciula'],
  fata: ['ochelari', 'soare', 'inimioare', 'masca'],
  gat: ['papion', 'fular', 'medalie', 'clopotel'],
};

const ids = (list) => list.map((x) => x.id);

function randomLooks(n, seed) {
  const rand = seededRandom(seed);
  return Array.from({ length: n }, () => randomLook({ animal: ANIMALS[Math.floor(rand() * ANIMALS.length)].id }, rand));
}

test('avatar: listele au id-uri scurte și unice, nume corecte în română, genuri și ambele forme ale culorilor', () => {
  for (const list of [ANIMALS, COLORS, BACKGROUNDS, HATS, FACES, NECKS]) {
    assert.equal(new Set(ids(list)).size, list.length);
    for (const x of list) {
      assert.match(x.id, /^[a-z]+$/);
      assert.ok(!['fara', 'natural'].includes(x.id), `${x.id} e rezervat`);
      for (const text of [x.label, x.m, x.f].filter((t) => t !== undefined)) {
        assert.ok(text && text === text.normalize('NFC') && !/[şţŞŢ]/.test(text), `${x.id}: „${text}”`);
      }
    }
  }
  assert.deepEqual(ids(ANIMALS).slice(0, LEGACY.length), LEGACY, 'avatarele de dinainte de v0.12 rămân primele, în ordinea lor');
  for (const a of ANIMALS) {
    assert.ok(a.label && ['m', 'f'].includes(a.gender), a.id);
    assert.ok(a.natural === null || COLORS.some((c) => c.id === a.natural), `${a.id}: culoarea naturală`);
  }
  for (const c of COLORS) assert.ok(c.m && c.f, c.id);
  for (const list of [BACKGROUNDS, HATS, FACES, NECKS]) for (const x of list) assert.ok(x.label, x.id);
  assert.deepEqual(SLOTS.map((s) => s.key), ['culoare', 'fundal', 'cap', 'fata', 'gat']);
  assert.ok(BACKGROUNDS.some((b) => b.id === DEFAULT_BACKGROUND));
});

test('avatar: id-urile publicate nu dispar niciodată', () => {
  const lists = { animal: ANIMALS, culoare: COLORS, fundal: BACKGROUNDS, cap: HATS, fata: FACES, gat: NECKS };
  for (const [slot, published] of Object.entries(PUBLISHED)) {
    for (const id of published) assert.ok(ids(lists[slot]).includes(id), `${slot}: „${id}” a fost publicat și nu se mai scoate`);
  }
});

test('avatar: avatarele vechi înseamnă aspectul implicit, iar textul canonic trece neschimbat prin citire și scriere', () => {
  for (const id of LEGACY) {
    assert.deepEqual(parseAvatar(id), { ...DEFAULT_LOOK, animal: id });
    assert.equal(avatarId(parseAvatar(id)), id);
    assert.ok(isAvatar(id), id);
  }
  for (const look of randomLooks(2000, 7)) {
    const id = avatarId(look);
    assert.ok(isAvatar(id), id);
    assert.equal(avatarId(parseAvatar(id)), id);
    assert.ok(id.length <= 120, id);
  }
  const full = 'vulpe.culoare-albastru.fundal-noapte.cap-coroana.fata-ochelari.gat-papion';
  assert.deepEqual(parseAvatar(full), { animal: 'vulpe', color: 'albastru', background: 'noapte', hat: 'coroana', face: 'ochelari', neck: 'papion' });
  assert.equal(avatarId(parseAvatar(full)), full);
});

test('avatar: forma canonică pune locurile în ordine și scoate ce e implicit; isAvatar cere forma canonică', () => {
  const cases = [
    ['vulpe.cap-coroana.culoare-albastru', 'vulpe.culoare-albastru.cap-coroana'],
    ['oaie.culoare-alb', 'oaie'],
    ['vulpe.culoare-portocaliu.gat-fular', 'vulpe.gat-fular'],
    ['vulpe.fundal-albastru', 'vulpe'],
    ['vulpe.culoare-natural.cap-fara', 'vulpe'],
    ['urs.cap-coroana.cap-joben', 'urs.cap-joben'],
  ];
  for (const [input, canonical] of cases) {
    assert.equal(avatarId(parseAvatar(input)), canonical, input);
    assert.equal(isAvatar(input), false, input);
    assert.equal(isAvatar(canonical), true, canonical);
  }
  assert.equal(avatarId({ animal: 'urs', color: 'maro', background: 'albastru', hat: null }), 'urs');
  assert.equal(avatarId({ animal: 'caine', color: 'maro' }), 'caine.culoare-maro'); // câinele are paleta lui: orice culoare se scrie
  assert.equal(avatarId({ animal: 'lup', hat: 'fara', face: 'masca' }), 'lup.fata-masca');
  assert.equal(lookColor({ animal: 'vulpe', color: 'portocaliu' }), null);
  assert.equal(lookColor({ animal: 'urs', color: 'portocaliu' }), 'portocaliu');
  assert.ok(!isAvatar(42) && !isAvatar(null) && !isAvatar(''));
});

test('avatar: citirea e tolerantă: ignoră ce nu cunoaște și nu aruncă', () => {
  for (const bad of [null, undefined, 42, {}, [], '', '.', 'x'.repeat(10000), 'dragon', '__proto__', 'constructor.cap-toString', 'vulpe.__proto__-x.cap-constructor']) {
    assert.ok(isAvatar(avatarId(parseAvatar(bad))), String(bad).slice(0, 30));
  }
  assert.deepEqual(parseAvatar('dragon.cap-coroana'), { ...DEFAULT_LOOK, hat: 'coroana' });
  assert.deepEqual(parseAvatar('vulpe.cap-constructor.aripi-mari.gat-papion'), { ...DEFAULT_LOOK, animal: 'vulpe', neck: 'papion' });
  assert.equal(animalOf('toString').id, 'veverita');
  assert.equal(animalOf(undefined).id, 'veverita');
});

test('avatar: numele se acordă cu animalul și leagă accesoriile cu „și”', () => {
  assert.equal(avatarLabel('vulpe.culoare-albastru.cap-coroana.fata-ochelari.gat-papion'), 'vulpe albastră cu coroană, ochelari și papion');
  assert.equal(avatarLabel('urs.culoare-galben.fundal-noapte'), 'urs galben, pe fundal de noapte');
  assert.equal(avatarLabel('panda.gat-fular'), 'panda cu fular');
  assert.equal(avatarLabel('pisica.culoare-roz'), 'pisică roz');
  assert.equal(avatarLabel('gaina.cap-caciula.fata-soare'), 'găină cu căciulă cu moț și ochelari de soare');
  assert.equal(avatarLabel('rata.culoare-rosu.fundal-verde'), 'rață roșie, pe fundal verde');
  assert.equal(avatarLabel('caine'), 'câine');
  assert.equal(avatarLabel('oaie.culoare-alb'), 'oaie');
  assert.equal(colorWord('portocaliu', 'f'), 'portocalie');
  assert.equal(colorWord('portocaliu', 'm'), 'portocaliu');
  assert.equal(colorWord('nimic', 'm'), '');
  for (const look of randomLooks(300, 11)) {
    const label = avatarLabel(avatarId(look));
    assert.ok(label === label.normalize('NFC') && !/[şţŞŢ]|undefined|null|\s{2}| ,/.test(label), label);
  }
});

test('avatar: „La întâmplare” păstrează animalul, alege doar id-uri bune și lasă accesoriile deoparte cam o dată din două', () => {
  const rand = seededRandom(3);
  const n = 3000;
  let bare = 0;
  for (let i = 0; i < n; i++) {
    const look = randomLook({ ...DEFAULT_LOOK, animal: 'oaie', hat: 'joben' }, rand);
    assert.equal(look.animal, 'oaie');
    assert.notEqual(look.color, 'alb'); // culoarea naturală se alege ca „naturală” (null)
    assert.ok(isAvatar(avatarId(look)));
    bare += [look.hat, look.face, look.neck].filter((x) => x === null).length;
  }
  assert.ok(Math.abs(bare / (3 * n) - 0.5) < 0.05, `accesorii lipsă: ${bare / (3 * n)}`);
});

test('avatar: un profil nou primește primul animal pe care nu-l are alt profil, cu aspectul implicit', () => {
  assert.deepEqual(defaultLook([]), { ...DEFAULT_LOOK });
  assert.equal(defaultLook(['veverita', 'iepure.cap-coroana']).animal, 'vulpe');
  assert.equal(defaultLook(ids(ANIMALS)).animal, 'veverita');
  assert.ok(AVATAR_PATTERN.test(avatarId(defaultLook(['veverita']))));
});
