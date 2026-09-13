// Modelul pur al formelor (site/js/core/forme.js): contururi, cheia canonică, axele de simetrie, măsurătorile și numele.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { axesCount, glyphKey, glyphName, isAxis, measure, outline, ROTS, SHAPES } from '../site/js/core/forme.js';

test('forme: orice contur, oricum rotit, oglindit sau micșorat, rămâne în cutia 100 × 100', () => {
  for (const [shape, s] of Object.entries(SHAPES)) {
    for (const variant of [null, ...Object.keys(s.variants ?? {})]) {
      for (const rot of ROTS) {
        for (const flip of [false, true]) {
          for (const size of ['mare', 'mic']) {
            const pts = outline({ shape, variant, rot, flip, size });
            assert.ok(pts.length >= 3 && pts.every(([x, y]) => x >= 5 && x <= 95 && y >= 5 && y <= 95), `${shape}~${variant} ${rot} ${flip} ${size}`);
          }
        }
      }
    }
  }
});

test('forme: cheia canonică ține cont de simetriile figurii', () => {
  const k = (g) => glyphKey({ fill: 'plin', color: 'rosu', ...g });
  assert.equal(k({ shape: 'patrat', rot: 90 }), k({ shape: 'patrat' }));
  assert.notEqual(k({ shape: 'patrat', rot: 45 }), k({ shape: 'patrat' }));
  assert.equal(k({ shape: 'dreptunghi', rot: 180 }), k({ shape: 'dreptunghi' }));
  assert.notEqual(k({ shape: 'dreptunghi', rot: 90 }), k({ shape: 'dreptunghi' }));
  assert.equal(k({ shape: 'cerc', rot: 135, flip: true }), k({ shape: 'cerc' }));
  assert.equal(k({ shape: 'sageata', flip: true }), k({ shape: 'sageata', rot: 180 }));
  assert.equal(k({ shape: 'triunghi', flip: true }), k({ shape: 'triunghi' }));
  assert.notEqual(k({ shape: 'triunghi', rot: 90 }), k({ shape: 'triunghi' }));
  const turns = ROTS.map((rot) => k({ shape: 'paralelogram', rot }));
  assert.ok(!turns.includes(k({ shape: 'paralelogram', flip: true })), 'paralelogramul în oglindă nu e o rotire a lui');
  assert.equal(glyphKey({ shape: 'cerc', fill: 'gol', color: 'rosu' }), glyphKey({ shape: 'cerc', fill: 'gol', color: 'verde' }));
  assert.notEqual(k({ shape: 'stea', size: 'mic' }), k({ shape: 'stea' }));
  assert.notEqual(k({ shape: 'triunghi', variant: 'ascutit' }), k({ shape: 'triunghi' }));
});

test('forme: axele de simetrie și măsurătorile figurilor', () => {
  const axes = (shape, extra = {}) => axesCount({ shape, ...extra });
  assert.deepEqual(
    [axes('patrat'), axes('dreptunghi'), axes('triunghi', { variant: 'ascutit' }), axes('paralelogram'), axes('romb'), axes('cruce'), axes('patrat', { rot: 45 }), axes('semicerc'), axes('casa'), axes('trapez')],
    [4, 2, 1, 0, 2, 4, 4, 1, 1, 1],
  );
  assert.ok(isAxis({ shape: 'dreptunghi' }, 'v') && !isAxis({ shape: 'dreptunghi' }, 'd1'), 'diagonala dreptunghiului nu e axă');
  assert.ok(!isAxis({ shape: 'patrat' }, 'v-off') && isAxis({ shape: 'triunghi', variant: 'ascutit', rot: 90 }, 'h'));
  const sq = measure({ shape: 'patrat', rot: 45 });
  assert.deepEqual([sq.vertices, sq.rightAngles, sq.equalSides], [4, 4, true]);
  const re = measure({ shape: 'dreptunghi', variant: 'ingust', rot: 90 });
  assert.deepEqual([re.vertices, re.rightAngles, re.equalSides], [4, 4, false]);
  const rh = measure({ shape: 'romb' });
  assert.deepEqual([rh.vertices, rh.rightAngles, rh.equalSides], [4, 0, true]);
  assert.equal(measure({ shape: 'triunghi', variant: 'dreptunghic' }).rightAngles, 1);
  assert.ok(measure({ shape: 'oval' }).curved && !measure({ shape: 'trapez' }).curved);
});

test('forme: numele pentru cititorul de ecran', () => {
  assert.equal(glyphName({ shape: 'patrat', fill: 'plin', color: 'rosu' }), 'pătrat, roșu, plin');
  assert.equal(glyphName({ shape: 'stea', fill: 'dungi', color: 'galben', size: 'mic' }), 'stea mică, galbenă, cu dungi');
  assert.equal(glyphName({ shape: 'triunghi', fill: 'gol', rot: 180 }), 'triunghi, gol, răsturnat');
  assert.equal(glyphName({ shape: 'patrat', fill: 'plin', color: 'albastru', rot: 90 }), 'pătrat, albastru, plin'); // rotit, dar arată la fel
  assert.equal(glyphName({ shape: 'sageata', fill: 'plin', color: 'verde', rot: 270 }), 'săgeată, verde, plină, întoarsă spre stânga');
});
