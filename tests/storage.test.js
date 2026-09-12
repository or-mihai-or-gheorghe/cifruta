import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addAttempt, clearHistory, getAttempt, isUnsaved, lastAttempt, listAttempts, listDrafts, saveDraft, updateAttempt } from '../site/js/core/storage.js';
import { formatDateTime } from '../site/js/core/ro.js';

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

test('storage: ciornele se listează și se șterg odată cu istoricul', () => {
  globalThis.localStorage = fakeStorage();
  saveDraft('t1', { testId: 't1', current: 2 });
  saveDraft('t2', { testId: 't2', current: 0 });
  assert.deepEqual(listDrafts().map((d) => d.testId).sort(), ['t1', 't2']);
  clearHistory(['t1']);
  assert.deepEqual(listDrafts().map((d) => d.testId), ['t2']);
  clearHistory();
  assert.deepEqual(listDrafts(), []);
  delete globalThis.localStorage;
});

test('ro: formatDateTime', () => {
  const s = formatDateTime('2026-09-12T14:05:00');
  assert.ok(s.includes('2026') && s.includes('14:05'), s);
  assert.equal(formatDateTime('nu-e-dată'), '');
});
