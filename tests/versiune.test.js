// Versiunea din adresele modulelor, pusă la publicare (tools/versiune.mjs): fiecare publicare are alte adrese, deci un browser nu
// amestecă module vechi, ținute în cache, cu module noi.

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { unversioned, versioned } from '../tools/versiune.mjs';

test('versiune: importurile relative primesc ?v=, celelalte rămân la fel', () => {
  const js = [
    "import { h } from '../core/dom.js';",
    "import './visuals/all.js';",
    'export { a } from "./a.js";',
    "const page = () => import('./pages/home.js');",
    'const view = await import(`../types/${type}/view.js`);',
    'const test = await import(`../../data/${entry.file}?v=${entry.version}`);',
    'import(`${SDK_URL}/firebase-app.js`);',
    "const name = 'nu-e-import.js';",
  ].join('\n');
  const out = versioned('js', js, 'abc1234').split('\n');
  assert.equal(out[0], "import { h } from '../core/dom.js?v=abc1234';");
  assert.equal(out[1], "import './visuals/all.js?v=abc1234';");
  assert.equal(out[2], 'export { a } from "./a.js?v=abc1234";');
  assert.equal(out[3], "const page = () => import('./pages/home.js?v=abc1234');");
  assert.equal(out[4], 'const view = await import(`../types/${type}/view.js?v=abc1234`);');
  assert.equal(out[5], 'const test = await import(`../../data/${entry.file}?v=${entry.version}`);', 'testele își au deja versiunea');
  assert.equal(out[6], 'import(`${SDK_URL}/firebase-app.js`);', 'adresele absolute rămân');
  assert.equal(out[7], "const name = 'nu-e-import.js';");
  assert.deepEqual(unversioned(out.join('\n')), []);
  assert.equal(versioned('html', '<script type="module" src="js/app.js"></script><link rel="stylesheet" href="css/main.css" />', 'v1'), '<script type="module" src="js/app.js?v=v1"></script><link rel="stylesheet" href="css/main.css?v=v1" />');
  assert.equal(versioned('css', "@import url('00-tokens.css') layer(tokens);", 'v1'), "@import url('00-tokens.css?v=v1') layer(tokens);");
});

test('versiune: în site, niciun import relativ nu scapă de rescriere', () => {
  const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
  for (const file of walk('site').filter((f) => f.endsWith('.js'))) {
    const text = readFileSync(file, 'utf8');
    // orice „from '…'” sau „import('…')” relativ trebuie să fie prins de rescriere (altfel ar rămâne fără versiune)
    const relative = [...text.matchAll(/\b(?:from|import)\s*\(?\s*['"`](\.{1,2}\/[^'"`\n]+)['"`]/g)].map((m) => m[1]).filter((p) => !p.includes('?'));
    assert.deepEqual(unversioned(versioned('js', text, 'x')), [], file);
    for (const path of relative) assert.ok(path.endsWith('.js'), `${file}: import relativ neobișnuit „${path}”`);
  }
});
