import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addAttempt, clearHistory, getAttempt, isUnsaved, lastAttempt, listAttempts, updateAttempt } from '../site/js/core/storage.js';

/** Un localStorage de test; cu `full: true` orice scriere aruncă (spațiu plin sau stocare blocată). */
function fakeStorage({ full = false } = {}) {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      if (full) throw new Error('QuotaExceededError');
      map.set(k, String(v));
    },
    removeItem: (k) => map.delete(k),
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
  };
}

test('storage: încercarea rămâne în memorie când stocarea nu scrie', () => {
  globalThis.localStorage = fakeStorage();
  assert.equal(addAttempt({ id: 'a1', testId: 't', score: 50 }), true);
  assert.equal(lastAttempt('t').id, 'a1');
  assert.ok(!isUnsaved(lastAttempt('t')));

  globalThis.localStorage = fakeStorage({ full: true });
  assert.equal(addAttempt({ id: 'a2', testId: 't', score: 80 }), false);
  assert.equal(lastAttempt('t').id, 'a2');
  assert.ok(isUnsaved(lastAttempt('t')));
  assert.equal(listAttempts('t').length, 1); // stocarea e goală, încercarea vine din memorie
  assert.equal(lastAttempt('altul'), null);
  updateAttempt('a2', { feeling: 'vesel' });
  assert.equal(getAttempt('a2').feeling, 'vesel');
  clearHistory(['t']);
  assert.equal(lastAttempt('t'), null);
  delete globalThis.localStorage;
});
