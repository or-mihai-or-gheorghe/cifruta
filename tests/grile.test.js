// Piesele din căsuțe (core/grile.js): rotiri, oglindiri, orientări și numărul pieselor de n căsuțe.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cellsKey, connected, freeKey, isChiral, mirror, orientations, polyominoes, rotate, rotations, sameFree, sameRotated, size } from '../site/js/core/grile.js';

const L = [[0, 0], [1, 0], [2, 0], [2, 1]];
const T = [[0, 0], [0, 1], [0, 2], [1, 1]];
const O = [[0, 0], [0, 1], [1, 0], [1, 1]];

test('grile: rotirea, oglindirea și orientările unei piese', () => {
  assert.deepEqual(rotate([[0, 0], [0, 1]]), [[0, 0], [1, 0]]); // două căsuțe culcate devin o coloană
  assert.deepEqual(rotate(L), [[0, 0], [0, 1], [0, 2], [1, 0]]); // L rotit spre dreapta: bara sus, piciorul în stânga jos
  assert.equal(cellsKey(rotate(rotate(rotate(rotate(L))))), cellsKey(L));
  assert.deepEqual(size(L), [3, 2]);
  assert.deepEqual([rotations(L).length, orientations(L).length, orientations(T).length, orientations(O).length], [4, 8, 4, 1]);
  assert.ok(isChiral(L) && !isChiral(T) && !isChiral(O));
  assert.ok(sameFree(L, mirror(L)) && !sameRotated(L, mirror(L)) && sameRotated(L, rotate(L)));
  assert.equal(freeKey(mirror(rotate(L))), freeKey(L));
  assert.ok(connected(L) && !connected([[0, 0], [1, 1]]) && !connected([]));
});

test('grile: piesele diferite de 1–6 căsuțe', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => polyominoes(n).length), [1, 1, 2, 5, 12, 35]);
  for (const piece of polyominoes(5)) assert.ok(piece.length === 5 && connected(piece) && cellsKey(piece) === freeKey(piece), cellsKey(piece));
  // în oglindă diferite: L și S dintre cele de 4 căsuțe; F, L, N, P, Y, Z dintre cele de 5
  assert.deepEqual([polyominoes(4).filter(isChiral).length, polyominoes(5).filter(isChiral).length], [2, 6]);
});
