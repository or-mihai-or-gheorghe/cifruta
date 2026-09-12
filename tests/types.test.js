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
