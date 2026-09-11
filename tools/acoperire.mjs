// Tabelul „teste × concepte” din docs/curriculum.md, generat din etichetele exercițiilor (între marcaje).
// Rulează: npm run acoperire        → actualizează tabelul
//          node tools/acoperire.mjs --check → eșuează dacă tabelul nu e la zi (rulat de npm test)

import { readFile, writeFile } from 'node:fs/promises';

import catalog from '../site/data/catalog.js';
import concepts from '../site/data/concepts.js';

const DOC = new URL('../docs/curriculum.md', import.meta.url);
const START = '<!-- acoperire:start -->';
const END = '<!-- acoperire:end -->';

const entries = catalog.sections.filter((s) => !s.hidden).flatMap((s) => s.groups.flatMap((g) => g.tests));
const tests = await Promise.all(entries.map(async (e) => (await import(`../site/data/${e.file}`)).default));

const rows = Object.entries(concepts).flatMap(([id, concept]) => {
  // numerele exercițiilor (1, 2, …) care au eticheta, pentru fiecare test
  const cells = tests.map((t) => t.exercises.flatMap((ex, i) => ((ex.concepts ?? []).includes(id) ? [i + 1] : [])));
  if (!cells.some((c) => c.length)) return [];
  return [`| \`${id}\`${concept.grade === 2 ? ' (II)' : ''} | ${cells.map((c) => c.join(', ') || '—').join(' | ')} |`];
});

// conceptele din clasa pregătitoare și clasa I pe care nu le folosește încă niciun test
const used = new Set(tests.flatMap((t) => t.exercises.flatMap((ex) => ex.concepts ?? [])));
const uncovered = Object.entries(concepts).filter(([id, c]) => c.grade <= 1 && !used.has(id)).map(([id]) => `\`${id}\``);

const table = [
  `${tests.map((t, i) => `T${i + 1} „${t.title}”`).join(' · ')}.`,
  'Numărul este al exercițiului în test. Tabelul se generează din etichetele testelor cu `npm run acoperire`;',
  'nu îl edita de mână.',
  '',
  `| Concept | ${tests.map((_, i) => `T${i + 1}`).join(' | ')} |`,
  `|-|${tests.map(() => '-|').join('')}`,
  ...rows,
  '',
  `**Neacoperite încă (clasa pregătitoare și clasa I), candidate pentru testele următoare:** ${uncovered.join(', ') || '—'}.`,
].join('\n');

const doc = await readFile(DOC, 'utf8');
const start = doc.indexOf(START);
const end = doc.indexOf(END);
if (start < 0 || end < start) throw new Error(`docs/curriculum.md: lipsesc marcajele ${START} și ${END}`);
const next = `${doc.slice(0, start + START.length)}\n${table}\n${doc.slice(end)}`;

if (next === doc) console.log('Tabelul de acoperire e la zi.');
else if (process.argv.includes('--check')) {
  console.error('Tabelul de acoperire din docs/curriculum.md nu e la zi. Rulează: npm run acoperire');
  process.exit(1);
} else {
  await writeFile(DOC, next);
  console.log('Tabelul de acoperire a fost actualizat.');
}
