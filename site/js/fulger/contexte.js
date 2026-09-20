// Jocuri fulger: temele de date ale graficelor (ce se numără, cu ce unitate și cu ce cuvinte se întreabă). Genul decide „Câte / Câți”
// și „mai multe / mai mulți”; unitățile sunt [singular, plural], pentru `cantitate()` („1 carte”, „20 de cărți”). Totul e pur.

import { cantitate } from '../core/ro.js';
import { DAYS } from '../visuals/grafice.js';

export const cate = (f) => (f ? 'Câte' : 'Câți');
export const multe = (f) => (f ? 'mai multe' : 'mai mulți');

/** Categorii numărate: graficul arată câte sunt din fiecare. `name` = pluralul, `sg` = singularul, `f` = „câte”. */
export const COUNT_SETS = [
  {
    id: 'fructe',
    total: ['fruct', 'fructe'],
    where: 'au cules copiii',
    totalLine: (n) => `Au cules ${cantitate(n, 'fruct', 'fructe')}.`,
    most: 'Din ce fruct sunt cele mai multe?',
    least: 'Din ce fruct sunt cele mai puține?',
    items: [
      { id: 'mar', emoji: 'mar', name: 'mere', sg: 'măr', f: true },
      { id: 'para', emoji: 'para', name: 'pere', sg: 'pară', f: true },
      { id: 'cirese', emoji: 'cirese', name: 'cireșe', sg: 'cireașă', f: true },
      { id: 'banana', emoji: 'banana', name: 'banane', sg: 'banană', f: true },
      { id: 'portocala', emoji: 'portocala', name: 'portocale', sg: 'portocală', f: true },
      { id: 'lamaie', emoji: 'lamaie', name: 'lămâi', sg: 'lămâie', f: true },
      { id: 'capsuni', emoji: 'capsuni', name: 'căpșuni', sg: 'căpșună', f: true },
    ],
  },
  {
    id: 'ferma',
    total: ['animal', 'animale'],
    where: 'sunt la fermă',
    totalLine: (n) => `La fermă sunt ${cantitate(n, 'animal', 'animale')}.`,
    most: 'Care animale sunt cele mai multe?',
    least: 'Care animale sunt cele mai puține?',
    items: [
      { id: 'oaie', emoji: 'oaie', name: 'oi', sg: 'oaie', f: true },
      { id: 'vaca', emoji: 'vaca', name: 'vaci', sg: 'vacă', f: true },
      { id: 'gaina', emoji: 'gaina', name: 'găini', sg: 'găină', f: true },
      { id: 'rata', emoji: 'rata', name: 'rațe', sg: 'rață', f: true },
      { id: 'cal', emoji: 'cal', name: 'cai', sg: 'cal', f: false },
      { id: 'porc', emoji: 'porc', name: 'porci', sg: 'porc', f: false },
      { id: 'iepure', emoji: 'iepure', name: 'iepuri', sg: 'iepure', f: false },
    ],
  },
  {
    id: 'legume',
    total: ['legumă', 'legume'],
    where: 'au cules copiii',
    totalLine: (n) => `Au cules ${cantitate(n, 'legumă', 'legume')}.`,
    most: 'Din ce legumă sunt cele mai multe?',
    least: 'Din ce legumă sunt cele mai puține?',
    items: [
      { id: 'morcov', emoji: 'morcov', name: 'morcovi', sg: 'morcov', f: false },
      { id: 'rosie', emoji: 'rosie', name: 'roșii', sg: 'roșie', f: true },
      { id: 'castravete', emoji: 'castravete', name: 'castraveți', sg: 'castravete', f: false },
      { id: 'ardei', emoji: 'ardei', name: 'ardei', sg: 'ardei', f: false },
      { id: 'salata', emoji: 'salata', name: 'salate', sg: 'salată', f: true },
    ],
  },
];

/** Voturi: copiii își aleg preferatul. `the` = forma articulată („câinele”), `name` = numele din legendă. */
export const VOTE_SETS = [
  {
    id: 'animale',
    items: [
      { id: 'caine', emoji: 'caine', name: 'câine', the: 'câinele' },
      { id: 'pisica', emoji: 'pisica', name: 'pisică', the: 'pisica' },
      { id: 'iepure', emoji: 'iepure', name: 'iepure', the: 'iepurele' },
      { id: 'urs', emoji: 'urs', name: 'urs', the: 'ursul' },
      { id: 'vulpe', emoji: 'vulpe', name: 'vulpe', the: 'vulpea' },
      { id: 'leu', emoji: 'leu', name: 'leu', the: 'leul' },
    ],
  },
  {
    id: 'deserturi',
    items: [
      { id: 'inghetata', emoji: 'inghetata', name: 'înghețată', the: 'înghețata' },
      { id: 'prajitura', emoji: 'prajitura', name: 'prăjitură', the: 'prăjitura' },
      { id: 'ciocolata', emoji: 'ciocolata', name: 'ciocolată', the: 'ciocolata' },
      { id: 'gogoasa', emoji: 'gogoasa', name: 'gogoașă', the: 'gogoașa' },
      { id: 'biscuit', emoji: 'biscuit', name: 'biscuit', the: 'biscuitul' },
    ],
  },
  {
    id: 'sporturi',
    items: [
      { id: 'fotbal', emoji: 'fotbal', name: 'fotbal', the: 'fotbalul' },
      { id: 'baschet', emoji: 'baschet', name: 'baschet', the: 'baschetul' },
      { id: 'inot', emoji: 'inot', name: 'înot', the: 'înotul' },
      { id: 'dans', emoji: 'dans', name: 'dans', the: 'dansul' },
      { id: 'alergare', emoji: 'alergare', name: 'alergare', the: 'alergarea' },
    ],
  },
];

export const VOTE = ['vot', 'voturi'];
export const CHILD = ['copil', 'copii'];

/** Perechi de nume pentru două serii (scurte: încap în legenda graficului). */
export const NAMES = [
  ['Ana', 'Dan'],
  ['Maria', 'Radu'],
  ['Ioana', 'Mihai'],
  ['Ema', 'Luca'],
  ['Sara', 'Tudor'],
  ['Irina', 'Vlad'],
];

/** Lunile din anul școlar (fără diacritice problematice în prescurtări). */
export const MONTHS = ['septembrie', 'octombrie', 'noiembrie', 'martie', 'aprilie', 'mai', 'iunie'];
export const WEEK = ['luni', 'marti', 'miercuri', 'joi', 'vineri'];
export const dayOption = (id) => ({ text: DAYS[id][0], note: DAYS[id][1], alt: DAYS[id][1] });
export const dateOption = (d, month) => ({ text: String(d), note: month, alt: `${d} ${month}` });

/**
 * O singură serie în timp (zilele săptămânii): cine face ce, cu întrebările potrivite. `step` și `lines` dau scara (valorile stau
 * pe liniile grilei), `f` = „câte”.
 */
export const DAY_SERIES = [
  {
    id: 'carti',
    unit: ['carte', 'cărți'],
    f: true,
    value: (d) => `Câte cărți a citit Ana ${d}?`,
    most: 'În ce zi a citit Ana cele mai multe cărți?',
    least: 'În ce zi a citit Ana cele mai puține cărți?',
    diff: (a, b) => `Cu câte cărți a citit Ana mai mult ${a} decât ${b}?`,
    above: (k) => `În câte zile a citit Ana peste ${cantitate(k, 'carte', 'cărți')}?`,
    steps: [1],
  },
  {
    id: 'alune',
    unit: ['alună', 'alune'],
    f: true,
    value: (d) => `Câte alune a strâns Cifruța ${d}?`,
    most: 'În ce zi a strâns Cifruța cele mai multe alune?',
    least: 'În ce zi a strâns Cifruța cele mai puține alune?',
    diff: (a, b) => `Cu câte alune a strâns mai mult ${a} decât ${b}?`,
    above: (k) => `În câte zile a strâns Cifruța peste ${cantitate(k, 'alună', 'alune')}?`,
    steps: [2, 5],
  },
  {
    id: 'vizitatori',
    unit: ['vizitator', 'vizitatori'],
    f: false,
    value: (d) => `Câți vizitatori au venit ${d}?`,
    most: 'În ce zi au venit cei mai mulți vizitatori?',
    least: 'În ce zi au venit cei mai puțini vizitatori?',
    diff: (a, b) => `Cu câți vizitatori au venit mai mulți ${a} decât ${b}?`,
    above: (k) => `În câte zile au venit peste ${cantitate(k, 'vizitator', 'vizitatori')}?`,
    steps: [5, 10],
  },
  {
    id: 'inghetate',
    unit: ['înghețată', 'înghețate'],
    f: true,
    value: (d) => `Câte înghețate s-au vândut ${d}?`,
    most: 'În ce zi s-au vândut cele mai multe înghețate?',
    least: 'În ce zi s-au vândut cele mai puține înghețate?',
    diff: (a, b) => `Cu câte înghețate au vândut mai mult ${a} decât ${b}?`,
    above: (k) => `În câte zile s-au vândut peste ${cantitate(k, 'înghețată', 'înghețate')}?`,
    steps: [2, 10],
  },
];

/** Două serii (două persoane), pe zile ale unei luni. `a` și `b` sunt numele celor doi. */
export const PAIR_SERIES = [
  {
    id: 'carti',
    unit: ['carte', 'cărți'],
    sum: (a, b, d) => `Câte cărți au citit ${a} și ${b} pe ${d}?`,
    diff: (a, b, d) => `Cu cât a citit ${a} mai mult decât ${b} pe ${d}?`,
    dayMore: (a, b, k) => `În ce zi a citit ${a} cu ${cantitate(k, 'carte', 'cărți')} mai mult decât ${b}?`,
    countDays: (a, b) => `În câte zile a citit ${a} mai mult decât ${b}?`,
    dayEqual: 'În ce zi au citit la fel de multe cărți?',
    dayMaxTotal: 'În ce zi au citit împreună cele mai multe cărți?',
    firstN: (a, n) => `Câte cărți a citit ${a} în primele ${n} zile?`,
    steps: [1],
  },
  {
    id: 'puncte',
    unit: ['punct', 'puncte'],
    sum: (a, b, d) => `Câte puncte au făcut ${a} și ${b} pe ${d}?`,
    diff: (a, b, d) => `Cu cât a făcut ${a} mai mult decât ${b} pe ${d}?`,
    dayMore: (a, b, k) => `În ce zi a făcut ${a} cu ${cantitate(k, 'punct', 'puncte')} mai mult decât ${b}?`,
    countDays: (a, b) => `În câte zile a făcut ${a} mai multe puncte decât ${b}?`,
    dayEqual: 'În ce zi au făcut la fel de multe puncte?',
    dayMaxTotal: 'În ce zi au făcut împreună cele mai multe puncte?',
    firstN: (a, n) => `Câte puncte a făcut ${a} în primele ${n} zile?`,
    steps: [2, 5],
  },
  {
    id: 'sarituri',
    unit: ['săritură', 'sărituri'],
    sum: (a, b, d) => `Câte sărituri au făcut ${a} și ${b} pe ${d}?`,
    diff: (a, b, d) => `Cu cât a sărit ${a} mai mult decât ${b} pe ${d}?`,
    dayMore: (a, b, k) => `Când a sărit ${a} cu ${cantitate(k, 'săritură', 'sărituri')} mai mult decât ${b}?`,
    countDays: (a, b) => `În câte zile a sărit ${a} mai mult decât ${b}?`,
    dayEqual: 'În ce zi au făcut la fel de multe sărituri?',
    dayMaxTotal: 'În ce zi au făcut împreună cele mai multe sărituri?',
    firstN: (a, n) => `Câte sărituri a făcut ${a} în primele ${n} zile?`,
    steps: [5, 10],
  },
];

/** Două cercuri: copii care au ales, au sau fac ceva. `a`, `b`: emoji și numele (fără articol). */
export const VENN_SETS = [
  { id: 'animale', verb: 'au', a: { emoji: 'pisica', name: 'pisică' }, b: { emoji: 'caine', name: 'câine' } },
  { id: 'fructe', verb: 'au ales', a: { emoji: 'mar', name: 'mere' }, b: { emoji: 'para', name: 'pere' } },
  { id: 'sport', verb: 'fac', a: { emoji: 'fotbal', name: 'fotbal' }, b: { emoji: 'inot', name: 'înot' } },
  { id: 'desert', verb: 'au ales', a: { emoji: 'inghetata', name: 'înghețată' }, b: { emoji: 'prajitura', name: 'prăjitură' } },
];
