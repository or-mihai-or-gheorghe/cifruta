// Banca vizuală: fiecare desen (cu toate demo-urile lui) produce SVG corect și accesibil.

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';

import { EMOJI } from '../site/js/visuals/emoji.js';
import { listVisuals, visualSVG } from '../site/js/visuals/index.js';
import '../site/js/visuals/all.js';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const siteFile = (path) => new URL(`../site/${path}`, import.meta.url);

test('fiecare vizual randează corect toate demo-urile', () => {
  const visuals = listVisuals();
  assert.ok(visuals.length >= 30, `doar ${visuals.length} vizuale`);
  for (const { name, demos } of visuals) {
    for (const params of demos) {
      const where = `${name} ${JSON.stringify(params)}`;
      const svg = visualSVG({ v: name, ...params });
      assert.ok(svg.startsWith('<svg'), where);
      assert.match(svg, /role="img"/, where);
      assert.ok(/aria-label="([^"]+)"/.exec(svg)?.[1].trim(), `${where}: aria-label gol`);
      assert.ok(!/<script/i.test(svg), `${where}: <script>`);
      assert.ok(!svg.replace('xmlns="http://www.w3.org/2000/svg"', '').includes('http'), `${where}: adresă externă`);
      assert.ok(!/NaN|undefined|\[object/.test(svg), `${where}: valoare lipsă în SVG`);
      assert.ok(!/[şţŞŢ]/.test(svg) && svg === svg.normalize('NFC'), `${where}: diacritice greșite`);
      // grupurile animate din CSS (v-nume__parte) nu au voie să poarte atributul transform (Chromium le-ar strica)
      assert.ok(!/<g class="v-[\w-]+__[\w-]+[^"]*"[^>]*\stransform="/.test(svg), `${where}: un grup animat poartă atributul transform`);
      for (const [, id] of svg.matchAll(/\sid="([^"]+)"/g)) {
        assert.match(id, new RegExp(`^${escapeRe(name)}\\d+`), `${where}: id „${id}” fără prefixul unic`);
      }
      for (const [, href] of svg.matchAll(/href="([^"]+)"/g)) {
        assert.ok(existsSync(siteFile(href)), `${where}: lipsește fișierul ${href}`);
      }
    }
  }
});

test('parametrii din markup (text) funcționează ca și cei numerici', () => {
  const fromText = visualSVG({ v: 'number-line', min: '0', max: '100', minor: '10', labels: '0,50,100', marker: '48' });
  const fromNumbers = visualSVG({ v: 'number-line', min: 0, max: 100, minor: 10, labels: [0, 50, 100], marker: 48 });
  assert.equal(fromText.replace(/number-line\d+/g, ''), fromNumbers.replace(/number-line\d+/g, ''));
});

test('fiecare emoji are fișierul SVG local', () => {
  for (const [name, e] of Object.entries(EMOJI)) {
    assert.ok(existsSync(siteFile(`assets/emoji/${e.code}.svg`)), `${name}: lipsește assets/emoji/${e.code}.svg`);
  }
});
