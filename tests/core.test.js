import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calc, holds, relation } from '../site/js/core/expr.js';
import { lintText } from '../site/js/core/lint.js';
import { md, markupErrors, plain } from '../site/js/core/markup.js';
import { cantitate, fixCedilla, formatNumber, numberToWords, sameText, singularOf } from '../site/js/core/ro.js';
import { check, minPieces, moneyCombos, moneyKey, searchNumbers } from '../site/js/core/rules.js';
import { gradeFor, scoreTest } from '../site/js/core/scoring.js';
import { getLogic } from '../site/js/core/registry.js';
import { normalizeTest } from '../site/js/core/spec.js';
import demo from '../site/data/demo.js';
import '../site/js/visuals/all.js';

test('expr: calcule și relații', () => {
  assert.equal(calc('38 + 7'), 45);
  assert.equal(calc('80 − 26'), 54); // minus Unicode
  assert.equal(calc('(35 + 36) - (7 + 8)'), 56);
  assert.equal(calc('3 × 4 : 2'), 6);
  assert.equal(calc('⭐ + 27', { '⭐': 37 }), 64);
  assert.equal(calc('☀️ + 1', { '☀': 5 }), 6); // selectorul de variantă U+FE0F e ignorat
  assert.ok(holds('23 + 16 = 16 + 23'));
  assert.ok(holds('36 < 38 < 40'));
  assert.ok(!holds('45 + 15 = 30'));
  assert.equal(relation(47, 74), '<');
  assert.throws(() => calc('7 zeci'));
  assert.throws(() => calc('7 : 2'));
});

test('ro: acordul numeral + substantiv, numere în litere, comparare', () => {
  const lei = (n) => cantitate(n, 'leu', 'lei');
  assert.equal(lei(0), '0 lei');
  assert.equal(lei(1), '1 leu');
  assert.equal(lei(2), '2 lei');
  assert.equal(lei(19), '19 lei');
  assert.equal(lei(20), '20 de lei');
  assert.equal(lei(21), '21 de lei');
  assert.equal(lei(100), '100 de lei');
  assert.equal(lei(101), '101 lei');
  assert.equal(lei(120), '120 de lei');
  assert.equal(cantitate(1, 'minut', 'minute'), '1 minut');
  assert.equal(cantitate(44, 'minut', 'minute'), '44 de minute');
  assert.equal(cantitate(1, singularOf('grade'), 'grade'), '1 grad');
  assert.equal(cantitate(2.7, 'punct', 'puncte'), '2,7 puncte');
  assert.equal(formatNumber(0.7), '0,7');
  assert.equal(formatNumber(4), '4');
  assert.equal(numberToWords(14), 'paisprezece');
  assert.equal(numberToWords(16), 'șaisprezece');
  assert.equal(numberToWords(18), 'optsprezece');
  assert.equal(numberToWords(46), 'patruzeci și șase');
  assert.equal(numberToWords(60), 'șaizeci');
  assert.equal(numberToWords(101), 'o sută unu');
  assert.equal(numberToWords(253), 'două sute cincizeci și trei');
  assert.equal(numberToWords(1000), 'o mie');
  assert.equal(fixCedilla('şi ţară'), 'și țară');
  assert.ok(sameText(' Iarna ', 'iarna'));
  assert.ok(!sameText('primavara', 'primăvara'));
  assert.ok(sameText('primavara', 'primăvara', { ignoreDiacritics: true }));
});

test('rules: condiții pentru numere și bani', () => {
  assert.ok(check({ rule: 'parity', even: true }, 58));
  assert.ok(!check({ rule: 'range', min: 50, max: 70, inclusive: false }, 50));
  assert.ok(check({ rule: 'range', min: 50, max: 70, inclusive: false }, 51));
  assert.ok(!check({ rule: 'digitsDistinct' }, 99));
  assert.ok(check({ rule: 'holds', expr: 'u = z + 3' }, 47));
  const riddle = searchNumbers({ from: 31, to: 39, rules: [{ rule: 'parity', even: false }, { rule: 'digitSum', value: 10 }] });
  assert.deepEqual(riddle, [37]);
  assert.equal(minPieces(35, [1, 5, 10, 20, 50]), 3);
  const combos = moneyCombos(12, [1, 5, 10]).map(moneyKey);
  assert.ok(combos.includes('10x1,1x2'));
  assert.ok(combos.includes('5x2,1x2'));
  assert.equal(combos[0], '10x1,1x2'); // cele mai puține bancnote primele
});

test('markup: escapare, formatare, tokenuri', () => {
  assert.equal(md('<script>'), '&lt;script&gt;');
  assert.equal(md('**42** și ==zeci==').includes('<strong>42</strong>'), true);
  assert.match(md('{{e:mar}}'), /<img class="c-emoji" src="assets\/emoji\/1f34e.svg" alt="măr"/);
  assert.match(md('{{z:4}}'), /c-pv--z/);
  assert.match(md('{{v:star n=47}}'), /<svg/);
  assert.deepEqual(markupErrors('{{e:nuexista}}'), ['token necunoscut {{e:nuexista}}']);
  assert.equal(plain('**Atinge** {{e:mar}}'), 'Atinge 🍎');
});

test('lint: diacritice și sedilă', () => {
  assert.deepEqual(lintText('Câte mere și pere?'), []);
  assert.equal(lintText('Cate mere').length, 1);
  assert.equal(lintText('mere si pere').length, 1);
  assert.equal(lintText('şi').length, 1);
});

test('scoring: calificative și scor total', () => {
  assert.equal(gradeFor(49).code, 'EX');
  assert.equal(gradeFor(50).code, 'S');
  assert.equal(gradeFor(69).code, 'S');
  assert.equal(gradeFor(70).code, 'B');
  assert.equal(gradeFor(89).code, 'B');
  assert.equal(gradeFor(90).code, 'FB');
  const t = normalizeTest(demo);
  const solution = {};
  const empty = {};
  for (const ex of t.exercises) {
    solution[ex.id] = {};
    empty[ex.id] = {};
    for (const p of ex.parts) {
      solution[ex.id][p.id] = getLogic(p.type).solution(p);
      empty[ex.id][p.id] = getLogic(p.type).empty(p);
    }
  }
  const full = scoreTest(t, solution);
  assert.equal(full.score, 100);
  assert.ok(Object.values(full.levels).every((l) => l.star));
  assert.equal(scoreTest(t, empty).score, 10);
});
