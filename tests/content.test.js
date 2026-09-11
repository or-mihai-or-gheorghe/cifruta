// Validarea conținutului: fiecare test publicat din catalog (și demo-ul) trebuie să treacă toate verificările.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import catalog from '../site/data/catalog.js';
import concepts from '../site/data/concepts.js';
import demo from '../site/data/demo.js';
import { validateTest } from '../site/js/core/spec.js';
import '../site/js/visuals/all.js';

const entries = catalog.sections.flatMap((s) => s.groups.flatMap((g) => g.tests));

function report(name, result) {
  for (const w of result.warnings) console.log(`  ⚠ ${name}: ${w}`);
  assert.deepEqual(result.errors, [], `${name}: erori de conținut`);
}

test('demo: toate tipurile de exerciții sunt valide', () => {
  report('demo', validateTest(demo, { concepts }));
});

for (const entry of entries) {
  test(`test ${entry.id}: ${entry.title}`, async () => {
    const mod = await import(`../site/data/${entry.file}`);
    const t = mod.default;
    assert.equal(t.id, entry.id, 'id-ul din catalog diferă de cel din fișier');
    assert.equal(t.version, entry.version, 'versiunea din catalog diferă de cea din fișier');
    const result = validateTest(t, { concepts });
    report(entry.id, result);
    assert.equal(result.totalMin, entry.estMin, 'estMin din catalog diferă de suma exercițiilor');
  });
}
