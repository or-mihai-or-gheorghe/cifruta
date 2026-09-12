import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLogic } from '../site/js/core/registry.js';
import { blankLabel } from '../site/js/types/fill/logic.js';
import { normalizeTest } from '../site/js/core/spec.js';
import demo from '../site/data/demo.js';
import '../site/js/visuals/all.js';

const parts = Object.fromEntries(
  normalizeTest(demo).exercises.flatMap((ex) => ex.parts.map((p) => [`${ex.id}.${p.id}`, p])),
);
const evalPart = (key, answer) => getLogic(parts[key].type).evaluate(parts[key], answer);

test('fiecare exemplu din demo e valid, soluția ia totul, golul nimic', () => {
  for (const [key, part] of Object.entries(parts)) {
    const logic = getLogic(part.type);
    assert.deepEqual(logic.validate(part), [], key);
    const full = logic.evaluate(part, logic.solution(part));
    assert.equal(full.earned, full.total, `${key}: soluția`);
    assert.equal(logic.evaluate(part, logic.empty(part)).earned, 0, `${key}: gol`);
    assert.equal(logic.answered(part, logic.solution(part)), logic.count(part), `${key}: answered`);
  }
});

test('fill: semnele <, >, = se deduc; termenii adunării pot fi inversați', () => {
  const inline = parts['fill.a'];
  const key = getLogic('fill').solution(inline);
  assert.equal(key.a, 69);
  assert.equal(key.c, '<');
  assert.equal(key.d, '=');
  const steps = evalPart('fill-steps.a', { a: '12', b: '18', c: '30', d: '30', e: '15', f: '15' });
  assert.equal(steps.earned, steps.total);
  const wrong = evalPart('fill.a', { b: '60' });
  assert.equal(wrong.items.find((i) => i.id === 'b').feedback, 'Ai adunat. Numărul lipsă este o parte: 42 − 18.');
});

test('fill: validatorul prinde greșelile de conținut', () => {
  const logic = getLogic('fill');
  const bad = { type: 'fill', rows: ['27 + 42 = [[a]]'], blanks: { a: { answer: 68 } } };
  assert.ok(logic.validate(bad).some((e) => e.includes('falsă')));
  const ambiguous = { type: 'fill', rows: ['10 [[s]] 0 = 10'], blanks: { s: { kind: 'sign', answer: '+' } } };
  assert.ok(logic.validate(ambiguous).some((e) => e.includes('2 variante')));
  const riddle = {
    type: 'fill',
    rows: ['Sunt [[a]]'],
    blanks: { a: { answer: 98, search: { from: 10, to: 99, rules: [{ rule: 'parity', even: false }, { rule: 'digitsDistinct' }], pick: 'max' } } },
  };
  assert.ok(logic.validate(riddle).some((e) => e.includes('căutarea')));
});

test('order: credit pentru cel mai lung subșir în ordine; indicii unice', () => {
  const order = parts['order.a'];
  const res = evalPart('order.a', ['v2', 'v6', 'v4', 'v7', 'v1', 'v3', 'v5']); // doar 92 și 81 inversate
  assert.equal(res.earned, 6);
  const logic = getLogic('order');
  assert.deepEqual(logic.validate(order), []);
  const clues = {
    type: 'order',
    items: ['radu', 'ana', 'ioana', 'dan', 'maria'].map((id) => ({ id, text: id })),
    key: ['radu', 'ana', 'ioana', 'dan', 'maria'],
    constraints: [
      { rule: 'first', a: 'radu' },
      { rule: 'before', a: 'ana', b: 'dan' },
      { rule: 'after', a: 'maria', b: 'dan' },
      { rule: 'rightAfter', a: 'ioana', b: 'ana' },
    ],
  };
  assert.deepEqual(logic.validate(clues), []);
  assert.ok(logic.validate({ ...clues, constraints: clues.constraints.slice(0, 2) }).some((e) => e.includes('ordini')));
  const nine = Array.from({ length: 9 }, (_, i) => `c${i}`);
  const big = { type: 'order', items: nine.map((id) => ({ id, text: id })), key: nine, constraints: [{ rule: 'first', a: 'c0' }] };
  assert.ok(logic.validate(big).some((e) => e.includes('cel mult 8')));
});

test('mark: atingerile greșite scad din credit', () => {
  const allMarked = evalPart('mark.a', ['s1', 's2', 's3', 's4', 's5']);
  assert.equal(allMarked.earned, 1); // 3 corecte − 2 greșite
  assert.equal(allMarked.total, 3);
});

test('money: două feluri trebuie să fie diferite', () => {
  const same = evalPart('money.a', { f1: { 10: 1, 1: 2 }, f2: { 10: 1, 1: 2 } });
  assert.equal(same.earned, 1);
  assert.equal(same.items[1].feedback, 'Acest fel l-ai folosit deja. Caută altul!');
  const wrongSum = evalPart('money.a', { f1: { 10: 1 } });
  assert.equal(wrongSum.items[0].feedback, 'Ai pus 10 lei, dar trebuiau 12 lei.');
});

test('răspunsurile malformate nu primesc puncte', () => {
  // choice: o variantă corectă aleasă de două ori nu ține loc de două variante; alegerea simplă nu e un tablou
  const doubled = evalPart('choice.b', { i1: ['triunghi', 'triunghi'] });
  assert.equal(doubled.items[0].ok, false);
  assert.ok(doubled.earned < 1);
  assert.equal(evalPart('choice.a', { i1: ['50'] }).earned, 0);
  assert.equal(evalPart('choice.a', { i1: '50' }).earned, 1);
  // build: bile negative sau fracționare
  assert.equal(evalPart('build.a', { i1: { Z: 5, U: -4 } }).earned, 0);
  assert.equal(evalPart('build.a', { i1: { Z: 4.5, U: 1 } }).earned, 0);
  assert.equal(evalPart('build.a', { i1: { Z: 4, U: 6 } }).earned, 1);
  assert.ok(getLogic('build').validate({ ...parts['build.a'], items: [{ id: 'i1', label: 'zero', target: 0 }] }).length > 0);
  // money: bancnote care nu sunt pe tavă, cantități negative sau fracționare
  const notOnTray = evalPart('money.a', { f1: { 2: 6 }, f2: { 20: 1, 5: -2, 1: 2 } }); // ambele fac 12
  assert.equal(notOnTray.earned, 0);
  assert.equal(notOnTray.items[0].feedback, 'Folosește doar bancnotele de pe tavă.');
  assert.equal(evalPart('money.a', { f1: { 10: 1, 1: 1.5, 5: 0.1 } }).earned, 0);
  // order: același element de mai multe ori
  assert.equal(evalPart('order.a', ['v2', 'v2', 'v2', 'v2', 'v2', 'v2', 'v2']).earned, 0);
  assert.equal(evalPart('order.a', ['v2', 'v6', 'v4', 'v7', 'v1', 'v5', 'zz']).earned, 0);
  // clock: ora 33 nu e 9
  assert.equal(evalPart('clock.a', { i1: { h: 33, m: 30 } }).earned, 0);
  assert.equal(evalPart('clock.a', { i1: { h: 9, m: 90 } }).earned, 0);
  // slider: doar numere de pe axă
  assert.equal(evalPart('slider.a', { i1: '48' }).earned, 0);
  assert.equal(evalPart('slider.a', { i1: 48 }).earned, 1);
  // fill: tablouri în loc de text, termeni inversați cu forme nevalide
  assert.equal(evalPart('fill.a', { a: ['69'], c: ['<'], e: ['−'] }).earned, 0);
  const swapped = evalPart('fill-steps.a', { a: '12', b: '18', c: '30', d: '30', e: '15', f: '15' });
  assert.equal(swapped.earned, swapped.total);
  const swappedBad = evalPart('fill-steps.a', { a: '12.0', b: ' 1.8e1 ' });
  assert.equal(swappedBad.items.filter((i) => ['a', 'b'].includes(i.id) && i.ok).length, 0);
});

test('choice multiplu, match cu mesaj țintit, ceas, numărătoare', () => {
  const multi = evalPart('choice.b', { i1: ['triunghi', 'patrat'] });
  assert.equal(multi.earned, 0);
  const match = evalPart('match.a', { l1: 'r42', l2: 'r54', l3: 'r74' });
  assert.equal(match.earned, 2);
  assert.equal(match.items[2].feedback, 'Ai uitat zecea nouă: 8 + 6 = 14.');
  assert.equal(evalPart('clock.a', { i1: { h: 21, m: 30 } }).earned, 1);
  assert.equal(evalPart('build.a', { i1: { Z: 4, U: 6 } }).earned, 1);
  assert.equal(evalPart('build.a', { i1: { Z: 6, U: 4 } }).earned, 0);
});

test('fill: eticheta casetei vine din șablon (pentru cititorul de ecran)', () => {
  const inline = { type: 'fill', rows: ['40 + 8 = [[a]]', { t: '7 zeci [[b]] 70', label: 'Compară' }], blanks: { a: { answer: 48 }, b: { kind: 'relation' } } };
  assert.equal(blankLabel(inline, 'a'), '40 + 8 = …');
  assert.equal(blankLabel(inline, 'b'), 'Compară: 7 zeci … 70');
  assert.equal(blankLabel({ ...inline, blanks: { ...inline.blanks, a: { answer: 48, label: 'Suma' } } }, 'a'), 'Suma');
  const table = { type: 'fill', layout: 'table', head: ['Ziua', 'Pepeni'], rows: [['vineri', '26'], ['în total', '[[t]]']], blanks: { t: { answer: 26 } } };
  assert.equal(blankLabel(table, 't'), 'în total, Pepeni');
  const tree = { type: 'fill', layout: 'tree', labels: ['zeci', 'unități'], trees: [{ top: '47', left: '[[z]]', right: '[[u]]' }], blanks: { z: { answer: 40 }, u: { answer: 7 } } };
  assert.equal(blankLabel(tree, 'z'), 'zeci din 47');
  assert.equal(blankLabel(tree, 'u'), 'unități din 47');
  const chain = { type: 'fill', layout: 'chain', chains: [{ start: '25', steps: [{ op: '+18', out: '[[x]]' }, { op: '-3', out: '[[y]]' }] }], blanks: { x: { answer: 43 }, y: { answer: 40 } } };
  assert.equal(blankLabel(chain, 'x'), '25 +18 = …');
  assert.equal(blankLabel(chain, 'y'), '… -3 = …');
});

test('mark: regulile de set acceptă orice selecție bună și explică prima regulă încălcată', () => {
  const ok = evalPart('mark-rules.a', ['p1', 'p2', 'p4']); // 30 + 45 + 20 = 95
  assert.equal(ok.earned, 1);
  assert.equal(ok.feedback, null);
  assert.match(ok.summary, /3 jucării, împreună 95 de lei/);
  assert.equal(evalPart('mark-rules.a', ['p4', 'p6']).earned, 1); // 25 de lei
  const few = evalPart('mark-rules.a', ['p3']);
  assert.equal(few.earned, 0);
  assert.match(few.feedback, /Ai ales 1 jucărie; trebuie cel puțin 2 jucării/);
  const much = evalPart('mark-rules.a', ['p3', 'p5']); // 140
  assert.equal(much.earned, 0);
  assert.match(much.feedback, /140 de lei, mai mult decât 100 de lei/);
  assert.equal(evalPart('mark-rules.a', []).earned, 0);
  assert.equal(evalPart('mark-rules.a', 'p1,p2').earned, 0); // formă greșită
  assert.equal(evalPart('mark-rules.a', ['p1', 'p1', 'p4', 'x']).earned, 1); // dublurile și id-urile străine se ignoră
  const sol = getLogic('mark').solution(parts['mark-rules.a']);
  assert.equal(evalPart('mark-rules.a', sol).earned, 1);
  assert.equal(sol.length, 2); // cea mai scurtă selecție bună

  const base = parts['mark-rules.a'];
  const withInclude = { ...base, rules: { ...base.rules, include: ['p3'], exclude: ['p6'] } };
  assert.match(getLogic('mark').evaluate(withInclude, ['p1', 'p2']).feedback, /Trebuie să alegi și „robot/);
  assert.match(getLogic('mark').evaluate(withInclude, ['p3', 'p6']).feedback, /nu are voie/);
  assert.equal(getLogic('mark').evaluate(withInclude, ['p3', 'p4']).earned, 1);
  assert.ok(getLogic('mark').validate({ ...base, rules: { count: { min: 2 }, sum: { max: 10 } } }).some((e) => e.includes('nicio selecție')));
  assert.ok(getLogic('mark').validate({ ...base, rules: { sum: { max: 100 } } }).some((e) => e.includes('count.min')));
  assert.ok(getLogic('mark').validate({ ...base, rules: { count: { min: 1 } }, key: ['p1'] }).some((e) => e.includes('nu se combină')));
});

test('route: drumul cerut ia tot, alt drum bun ia jumătate, drumurile rupte nimic', () => {
  const logic = getLogic('route');
  const part = parts['route.a'];
  assert.deepEqual(logic.solution(part), ['gara', 'piata', 'teatru']);
  assert.equal(evalPart('route.a', ['gara', 'piata', 'teatru']).earned, 1);
  const long = evalPart('route.a', ['gara', 'piata', 'parc', 'lac', 'teatru']);
  assert.equal(long.earned, 0.5);
  assert.match(long.items[0].feedback, /mai puține stații/);
  const broken = evalPart('route.a', ['gara', 'teatru']);
  assert.equal(broken.earned, 0);
  assert.match(broken.items[0].feedback, /nu e nicio linie/);
  assert.match(evalPart('route.a', ['piata', 'teatru']).items[0].feedback, /Pornește de la stația Gara/);
  assert.match(evalPart('route.a', ['gara', 'piata']).items[0].feedback, /nu ajunge la Teatrul/);
  assert.equal(evalPart('route.a', ['gara', 'piata', 'gara', 'piata', 'teatru']).earned, 0);
  assert.equal(evalPart('route.a', 'gara,piata,teatru').earned, 0);
  assert.equal(evalPart('route.a', null).earned, 0);
  assert.equal(logic.answered(part, ['gara']), 0);
  assert.equal(logic.answered(part, ['gara', 'piata']), 1);

  // reguli: orice drum bun ia tot
  const rules = { ...part, key: undefined, rules: { maxStops: 5 } };
  assert.equal(logic.validate(rules).length, 0);
  assert.equal(logic.evaluate(rules, ['gara', 'piata', 'teatru']).earned, 1);
  assert.equal(logic.evaluate(rules, ['gara', 'piata', 'parc', 'lac', 'teatru']).earned, 1);
  const via = { ...rules, rules: { via: ['parc'], maxStops: 5 } };
  assert.equal(logic.evaluate(via, ['gara', 'piata', 'parc', 'lac', 'teatru']).earned, 1);
  assert.match(logic.evaluate(via, ['gara', 'piata', 'teatru']).items[0].feedback, /prin Parcul/);
  assert.deepEqual(logic.solution(via), ['gara', 'piata', 'parc', 'lac', 'teatru']);
  const avoid = { ...rules, rules: { avoid: ['piata'] } };
  assert.ok(logic.validate(avoid).some((e) => e.includes('niciun drum')));
  const noChange = { ...rules, rules: { maxChanges: 0 } };
  assert.ok(logic.validate(noChange).some((e) => e.includes('niciun drum'))); // Gara e doar pe tramvai, Teatrul doar pe metrou

  // validator: cheia trebuie să fie singurul drum cel mai scurt
  assert.ok(logic.validate({ ...part, key: ['gara', 'piata', 'parc', 'lac', 'teatru'] }).some((e) => e.includes('mai scurt')));
  assert.ok(logic.validate({ ...part, key: ['gara', 'teatru'] }).some((e) => e.includes('nicio linie')));
  assert.ok(logic.validate({ ...part, key: undefined }).some((e) => e.includes('e nevoie')));
  assert.ok(logic.validate({ ...part, to: 'gara' }).some((e) => e.includes('diferite')));
});

test('chart: credit pe bară cu cheie; cu reguli, orice grafic bun ia tot', () => {
  const logic = getLogic('chart');
  const part = parts['chart.a'];
  assert.deepEqual(logic.solution(part), { mere: 3, pere: 2, banane: 4 });
  assert.equal(evalPart('chart.a', { mere: 3, pere: 2, banane: 4 }).earned, 3);
  const two = evalPart('chart.a', { mere: 3, pere: 5, banane: 4 });
  assert.equal(two.earned, 2);
  assert.equal(two.items.find((i) => i.id === 'pere').expected, 2);
  assert.equal(evalPart('chart.a', { mere: 3.5, pere: 2, banane: 4 }).earned, 2); // valoare nevalidă
  assert.equal(evalPart('chart.a', null).earned, 0);
  assert.equal(evalPart('chart.a', [3, 2, 4]).earned, 0);
  assert.equal(logic.answered(part, { mere: 3 }), 1);

  const rules = { ...part, key: undefined, rules: [{ rule: 'total', value: 6 }, { rule: 'more', a: 'mere', b: 'pere' }, { rule: 'least', a: 'pere' }, { rule: 'each', min: 1 }] };
  assert.equal(logic.validate(rules).length, 0);
  assert.equal(logic.evaluate(rules, { mere: 3, pere: 1, banane: 2 }).earned, 1);
  assert.equal(logic.evaluate(rules, { mere: 2, pere: 1, banane: 3 }).earned, 1);
  assert.match(logic.evaluate(rules, { mere: 3, pere: 1, banane: 3 }).items[0].feedback, /împreună 7, dar trebuie să facă 6/);
  assert.match(logic.evaluate(rules, { mere: 1, pere: 2, banane: 3 }).items[0].feedback, /mere trebuie să aibă mai mult decât pere/);
  assert.match(logic.evaluate(rules, {}).items[0].feedback, /apăsând \+/);
  assert.match(logic.evaluate(rules, { mere: 12, pere: 1, banane: 2 }).items[0].feedback, /nu se poate desena/);
  const sol = logic.solution(rules);
  assert.equal(logic.evaluate(rules, sol).earned, 1);
  assert.equal(logic.count(rules), 1);

  const given = { ...part, key: { banane: 4 }, given: { mere: 3, pere: 2 } };
  assert.equal(logic.validate(given).length, 0);
  assert.equal(logic.count(given), 1);
  assert.equal(logic.evaluate(given, { banane: 4 }).earned, 1);
  assert.equal(logic.evaluate(given, { banane: 4, mere: 9 }).earned, 1); // barele date nu se pot schimba

  assert.ok(logic.validate({ ...part, max: 7, step: 2 }).some((e) => e.includes('multiplu')));
  assert.ok(logic.validate({ ...part, key: { mere: 3, pere: 2 } }).some((e) => e.includes('lipsește valoarea')));
  assert.ok(logic.validate({ ...rules, rules: [{ rule: 'each', max: 6 }] }).some((e) => e.includes('barele goale')));
  assert.ok(logic.validate({ ...rules, rules: [{ rule: 'total', value: 100 }] }).some((e) => e.includes('nicio combinație')));
  assert.ok(logic.validate({ ...rules, max: 100, step: 1, categories: Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, label: `c${i}` })), rules: [{ rule: 'total', value: 5 }] }).some((e) => e.includes('prea multe')));
});

test('fill: o casetă apare o singură dată în șabloane', () => {
  const dup = { type: 'fill', rows: ['Adultul are cu [[b]] dinți mai mult: 32 − 20 = [[b]]'], blanks: { b: { answer: 12 } } };
  assert.ok(getLogic('fill').validate(dup).some((e) => e.includes('apare de 2 ori')));
});

test('route: segmente cu lungimi, timp de schimbare, cheie împreună cu reguli', () => {
  const logic = getLogic('route');
  const edges = [['i', 'f'], ['i', 'j'], ['f', 'p'], ['f', 'l'], ['j', 'l'], ['p', 'l'], ['p', 'c'], ['l', 'c']];
  const lengths = [12, 15, 18, 25, 14, 9, 20, 16];
  const map = {
    w: 320,
    h: 200,
    unit: 'pași',
    stops: [['i', 30, 170], ['f', 120, 170], ['j', 30, 80], ['p', 210, 170], ['l', 140, 90], ['c', 280, 60]].map(([id, x, y]) => ({ id, label: { i: 'Intrarea', f: 'Fructe', j: 'Jucării', p: 'Pâine', l: 'Lactate', c: 'Casa' }[id], x, y })),
    lines: edges.map(([a, b]) => ({ id: a + b, label: 'culoar', color: 'gri', stops: [a, b] })),
    segments: edges.map(([a, b], k) => ({ a, b, n: lengths[k] })),
  };
  const part = { type: 'route', map, from: 'i', to: 'c', rules: { via: ['p', 'l'] }, key: ['i', 'f', 'p', 'l', 'c'] };
  assert.deepEqual(logic.validate(part), []);
  assert.equal(logic.evaluate(part, ['i', 'f', 'p', 'l', 'c']).earned, 1);
  const longer = logic.evaluate(part, ['i', 'j', 'l', 'p', 'c']);
  assert.equal(longer.earned, 0.5);
  assert.match(longer.items[0].feedback, /58 de pași/);
  assert.match(logic.evaluate(part, ['i', 'f', 'p', 'c']).items[0].feedback, /prin Lactate/);
  assert.ok(logic.validate({ ...part, key: ['i', 'j', 'l', 'p', 'c'] }).some((e) => e.includes('mai scurt (55 de pași)')));
  assert.ok(logic.validate({ ...part, map: { ...map, segments: map.segments.slice(1) } }).some((e) => e.includes('lipsește lungimea')));
  const limit = { type: 'route', map, from: 'i', to: 'c', rules: { maxTotal: 45 } };
  assert.deepEqual(logic.solution(limit), ['i', 'j', 'l', 'c']);
  assert.match(logic.evaluate(limit, ['i', 'f', 'p', 'c']).items[0].feedback, /50 de pași; sunt permise cel mult 45 de pași/);

  // o schimbare de linie costă timp: pe tramvai până la capăt poate fi mai repede decât o scurtătură cu schimbare
  const city = {
    ...parts['route.a'].map,
    unit: 'minute',
    transfer: 5,
    segments: [{ a: 'gara', b: 'piata', n: 4 }, { a: 'piata', b: 'parc', n: 3 }, { a: 'parc', b: 'lac', n: 3 }, { a: 'muzeu', b: 'piata', n: 2 }, { a: 'piata', b: 'teatru', n: 3 }, { a: 'teatru', b: 'lac', n: 2 }],
  };
  const tram = { type: 'route', map: city, from: 'gara', to: 'lac', key: ['gara', 'piata', 'parc', 'lac'] };
  assert.deepEqual(logic.validate(tram), []);
  assert.ok(logic.validate({ ...tram, map: { ...city, transfer: 0 } }).some((e) => e.includes('mai scurt (9 minute)')));
});
