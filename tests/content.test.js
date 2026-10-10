// Validarea conținutului: fiecare test publicat din catalog (și demo-ul) trebuie să treacă toate verificările.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import catalog from '../site/data/catalog.js';
import concepts from '../site/data/concepts.js';
import demo from '../site/data/demo.js';
import { trace } from '../site/js/core/expr.js';
import { getLogic } from '../site/js/core/registry.js';
import { treceri } from '../site/js/core/rules.js';
import { normalizeTest, validateTest } from '../site/js/core/spec.js';
import '../site/js/visuals/all.js';

const entries = catalog.sections.flatMap((s) => s.groups.flatMap((g) => g.tests.map((t) => ({ ...t, section: s.id }))));

// Regulile unei secțiuni: calculele rămân în 0–max, trecerile peste ordin pe calcul au un plafon pe nivel, iar exercițiile de
// explorarea mediului sunt între med[0] și med[1].
const SECTION_RULES = {
  'adunare-scadere-1000': { max: 1000, treceri: { usor: 1, intermediar: 1, avansat: 3 }, med: [1, 2] },
};

function sectionErrors(raw, rules) {
  const errors = [];
  let med = 0;
  for (const ex of normalizeTest(raw).exercises) {
    if ((ex.concepts ?? []).some((c) => c.startsWith('med.'))) med++;
    for (const part of ex.parts) {
      for (const src of getLogic(part.type).expressions?.(part) ?? []) {
        let ops = [];
        try {
          ops = trace(src);
        } catch {
          continue; // expresiile greșite sunt raportate de validarea tipului
        }
        for (const { op, a, b } of ops) {
          const shown = `${a} ${op === '-' ? '−' : '+'} ${b}`;
          const result = op === '+' ? a + b : a - b;
          if ([a, b, result].some((n) => n < 0 || n > rules.max)) errors.push(`${ex.id}: ${shown} iese din 0–${rules.max}`);
          const n = treceri(op, a, b).length;
          const cap = rules.treceri[ex.level];
          if (n > cap) errors.push(`${ex.id}: ${shown} are ${n} treceri peste ordin (la ${ex.level} cel mult ${cap})`);
        }
      }
    }
  }
  if (med < rules.med[0] || med > rules.med[1]) errors.push(`exerciții de explorarea mediului: ${med} (trebuie ${rules.med[0]}–${rules.med[1]})`);
  return [...new Set(errors)]; // același calcul poate veni și din rând, și din `expr`
}

function report(name, result) {
  for (const w of result.warnings) console.log(`  ⚠ ${name}: ${w}`);
  assert.deepEqual(result.errors, [], `${name}: erori de conținut`);
}

test('demo: toate tipurile de exerciții sunt valide', () => {
  report('demo', validateTest(demo, { concepts }));
});

test('regula secțiunii prinde trecerile prea multe, calculele peste 1000 și lipsa exercițiilor de mediu', () => {
  const ex = (id, level, row, concepts = ['mat.op1000.cu-trecere']) => ({ id, level, estMin: 1, concepts, title: id, type: 'fill', rows: [row], blanks: { a: { expr: row.split('=')[0] } } });
  const fake = { exercises: [ex('e1', 'usor', '347 + 285 = [[a]]'), ex('e2', 'intermediar', '403 − 158 = [[a]]'), ex('e3', 'avansat', '625 + 456 = [[a]]')] };
  assert.deepEqual(sectionErrors(fake, SECTION_RULES['adunare-scadere-1000']), [
    'e1: 347 + 285 are 2 treceri peste ordin (la usor cel mult 1)',
    'e2: 403 − 158 are 2 treceri peste ordin (la intermediar cel mult 1)',
    'e3: 625 + 456 iese din 0–1000',
    'exerciții de explorarea mediului: 0 (trebuie 1–2)',
  ]);
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
    assert.equal(entry.estMin, 45, 'fiecare test durează exact 45 de minute');
    assert.equal(t.exercises.length, entry.exercises, 'numărul de exerciții din catalog diferă de cel din fișier');
    const rules = SECTION_RULES[entry.section];
    if (rules) assert.deepEqual(sectionErrors(t, rules), [], `${entry.id}: regulile secțiunii`);
  });
}
