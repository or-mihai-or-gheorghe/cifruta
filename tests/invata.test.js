// Învață: lecțiile (site/data/invata.js) și logica lor (site/js/invata/). Provocările trebuie să se poată rezolva din interfață, în
// ordine, iar textele sunt verificate ca ale testelor (diacritice, NFC, mini-markup, date JSON).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import data from '../site/data/invata.js';
import CONCEPTS from '../site/data/concepts.js';
import { findNonJSON, lintText, walkTexts } from '../site/js/core/lint.js';
import { markupErrors, plain } from '../site/js/core/markup.js';
import { chapterConcepts, findLesson, lessonErrors, paramsOf, pickCorrect, playableChapters, reachable, search, widgetOf } from '../site/js/invata/logic.js';
import { WIDGETS } from '../site/js/invata/registry.js';
import { keyStep, percentOf, valueAt } from '../site/js/invata/ruler.js';
import { NBSP, equation, keepMath, repeatedSum, spokenMath } from '../site/js/invata/text.js';
import '../site/js/visuals/all.js';
import { visualErrors, visualLabel, visualSVG } from '../site/js/visuals/index.js';
import array, { litCells, pairsLeft } from '../site/js/invata/widgets/array/logic.js';
import jumps from '../site/js/invata/widgets/jumps/logic.js';

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const lessons = playableChapters(data).flatMap((chapter) => chapter.lessons.map((lesson) => ({ chapter, lesson })));

test('învață: capitolele au id-uri permanente, iar cele „în curând” n-au lecții', () => {
  const ids = data.chapters.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'id-uri de capitol repetate');
  for (const c of data.chapters) {
    assert.match(c.id, ID, c.id);
    assert.ok(c.title && c.text && c.icon, `${c.id}: titlul, textul și iconița`);
    if (c.soon) assert.equal(c.lessons, undefined, `${c.id}: un capitol „în curând” n-are lecții`);
    else assert.ok(c.lessons.length >= 3, `${c.id}: cel puțin 3 lecții`);
  }
  assert.ok(playableChapters(data).length >= 1);
});

test('învață: fiecare lecție se poate parcurge din interfață, provocare după provocare', () => {
  for (const { chapter, lesson } of lessons) {
    assert.deepEqual(lessonErrors(lesson), [], `${chapter.id}/${lesson.id}`);
    assert.ok(lesson.tasks.length >= 3 && lesson.tasks.length <= 4, `${lesson.id}: 3–4 provocări`);
    assert.ok(lesson.notes.length >= 1 && lesson.notes.length <= 3, `${lesson.id}: 1–3 lucruri în „Ce am aflat”`);
  }
  for (const chapter of playableChapters(data)) {
    const ids = chapter.lessons.map((l) => l.id);
    assert.equal(new Set(ids).size, ids.length, `${chapter.id}: id-uri de lecție repetate`);
  }
});

test('învață: alegerile au răspunsul pe locuri diferite, iar conceptele lecțiilor există', () => {
  const places = lessons.flatMap(({ lesson }) => lesson.tasks.filter((t) => t.pick).map((t) => pickCorrect(t)[0]));
  if (places.length >= 3) assert.ok(new Set(places).size > 1, `răspunsul alegerilor stă mereu pe locul ${places[0] + 1}`);
  for (const { lesson } of lessons) {
    assert.ok(lesson.concepts.length >= 1, `${lesson.id}: concepte`);
    for (const id of lesson.concepts) assert.ok(CONCEPTS[id], `${lesson.id}: concept necunoscut ${id}`);
  }
  for (const chapter of playableChapters(data)) assert.ok(chapterConcepts(chapter).length >= 2, `${chapter.id}: „Ce învățăm”`);
});

test('învață: textele sunt scurte, cu diacritice corecte, NFC și doar mini-markup', () => {
  assert.deepEqual(findNonJSON(data), []);
  const errors = [];
  walkTexts(data, (text, path) => {
    for (const e of [...lintText(text), ...markupErrors(text)]) errors.push(`${path}: ${e}`);
  });
  assert.deepEqual(errors, []);
  for (const { lesson } of lessons) {
    assert.ok(plain(lesson.intro).length <= 90, `${lesson.id}: indicația are ${plain(lesson.intro).length} de caractere (cel mult 90)`);
    for (const t of lesson.tasks) assert.ok(plain(t.ask).length <= 60, `${lesson.id}/${t.id}: cerința are ${plain(t.ask).length} de caractere (cel mult 60)`);
  }
});

test('învață: findLesson găsește lecțiile, nu și capitolele „în curând”', () => {
  const first = lessons[0];
  const found = findLesson(data, first.chapter.id, first.lesson.id);
  assert.equal(found.lesson, first.lesson);
  assert.equal(found.index, 0);
  assert.equal(findLesson(data, first.chapter.id, 'nu-exista').lesson, null);
  assert.equal(findLesson(data, 'impartirea'), null);
  assert.equal(findLesson(data, 'nu-exista'), null);
});

test('învață: textele calculelor nu se rup în locuri greșite', () => {
  assert.equal(equation(3, 4, 12), `3${NBSP}×${NBSP}4${NBSP}=${NBSP}12`);
  assert.equal(repeatedSum(4, 3, 12), `4${NBSP}+ 4${NBSP}+ 4${NBSP}=${NBSP}12`);
  assert.equal(repeatedSum(4, 1, 4), null);
  assert.equal(spokenMath(equation(3, 4, '?')), '3 ori 4 egal cât');
});

test('învață: dreptunghiul — farfuriile, careul, tăietura și harta', () => {
  const plates = { skin: 'plates', rows: 3, cols: 4, item: 'mar' };
  const t = array.texts(plates, array.initial(plates));
  assert.equal(t.reading, '3 farfurii cu câte 4 mere');
  assert.equal(plain(t.sum), plain(repeatedSum(4, 3, 12)));
  assert.deepEqual(t.totals, [4, 8, 12]);
  assert.equal(array.texts({ ...plates, rows: 1, cols: 1 }, { rows: 1, cols: 1 }).reading, '1 farfurie cu câte 1 măr');

  const grid = { skin: 'grid', rows: 4, cols: 6, item: 'stea', flip: true };
  const flipped = array.apply(grid, array.initial(grid), { do: 'flip' });
  assert.deepEqual([flipped.rows, flipped.cols, flipped.flipped], [6, 4, true]);
  assert.equal(array.texts(grid, flipped).reading, '6 rânduri cu câte 4 stele');
  assert.deepEqual(array.apply(grid, flipped, { tap: [1, 8] }), { rows: 2, cols: 9, flipped: true, item: 'stea' });
  assert.equal(array.texts(grid, array.apply(grid, flipped, { set: 'item', value: 'patrat' })).reading, '6 rânduri cu câte 4 pătrățele');

  const split = { skin: 'split', rows: 7, cols: 6, cut: 5 };
  const s = array.initial(split);
  assert.equal(array.texts(split, s).equation.replaceAll(NBSP, ' '), '7 × 6 = 5 × 6 + 2 × 6 = 30 + 12 = 42');
  assert.ok(array.texts(split, s, ['product']).equation.endsWith('?'), 'produsul ascuns');
  assert.equal(array.apply(split, s, { set: 'rows', value: 3 }).cut, 2, 'tăietura rămâne în dreptunghi');

  // harta: × 1, × 2, × 5, × 10 (40 de căsuțe), pătratele (46), întoarse (70) → 30 de căsuțe, adică 15 calcule
  assert.equal(litCells(['x1', 'x2', 'x5', 'x10']).size, 40);
  assert.equal(litCells(['x1', 'x2', 'x5', 'x10', 'patrate']).size, 46);
  const all = litCells(['x1', 'x2', 'x5', 'x10', 'patrate', 'intoarse']);
  assert.equal(all.size, 70);
  assert.equal(pairsLeft(all), 15);
  assert.equal(pairsLeft(new Set()), 55);
  const table = { skin: 'table', rows: 6, cols: 7 };
  const lit = { ...array.initial(table), lit: ['x1', 'x2', 'x5', 'x10', 'patrate', 'intoarse'] };
  assert.match(array.texts(table, lit).extra, /70 de căsuțe din 100.*15 calcule/);
  assert.deepEqual(array.check({ skin: 'grid', rows: 11, cols: 2, item: 'mar' }).length, 1);
  assert.deepEqual(array.check({ skin: 'plates', rows: 7, cols: 2, item: 'mar' }).length, 1);
  assert.deepEqual(array.check({ skin: 'split', rows: 4, cols: 2, cut: 4 }).length, 1);
});

test('învață: săriturile ajung la produs, cu numărătoarea din pas în pas', () => {
  const p = { step: 3, count: 4 };
  const t = jumps.texts(p, jumps.initial(p));
  assert.equal(t.reading, '4 sărituri de câte 3');
  assert.equal(t.equation.replaceAll(NBSP, ' '), '4 × 3 = 12');
  assert.deepEqual(t.landings, [3, 6, 9, 12]);
  assert.deepEqual(jumps.texts(p, jumps.initial(p), ['end']).landings, [3, 6, 9, '?']);
  assert.equal(jumps.texts({ step: 5, count: 1 }, { step: 5, count: 1 }).reading, '1 săritură de câte 5');
});

test('învață: căutarea trece doar prin acțiunile interfeței', () => {
  for (const [name, W] of Object.entries(WIDGETS)) {
    for (const { lesson } of lessons.filter(({ lesson }) => lesson.widget.w === name)) {
      const params = paramsOf(lesson);
      const states = reachable(W, params);
      assert.ok(states.length >= 10 && states.length <= 20000, `${lesson.id}: ${states.length} stări`);
      for (const s of states.slice(0, 50)) for (const a of W.actions(params, s)) assert.doesNotThrow(() => W.apply(params, s, a));
    }
  }
  const lesson = lessons.find(({ lesson }) => lesson.id === 'randuri-coloane').lesson;
  const W = widgetOf(lesson);
  const params = paramsOf(lesson);
  const found = search(W, params, W.initial(params), (d) => d.product === 24);
  assert.equal(W.derive(params, found).product, 24);
});

test('învață: lessonErrors prinde provocările care nu merg', () => {
  const errs = (tasks) => lessonErrors({ id: 'proba', widget: { w: 'array', skin: 'grid', rows: 3, cols: 4, item: 'mar' }, tasks }).join(' | ');
  assert.equal(errs([{ id: 'a', ask: 'x', want: { rows: 5, cols: 5 } }]), '');
  assert.match(errs([{ id: 'a', ask: 'x', want: { rows: 3, cols: 4 } }]), /deja rezolvată/);
  assert.match(errs([{ id: 'a', ask: 'x', want: { rows: 11 } }]), /nu se poate rezolva/);
  assert.match(errs([{ id: 'a', ask: 'x', want: { culoare: 1 } }]), /nu e o mărime/);
  // cea mai apropiată soluție pentru „5 rânduri”, din 3 × 4, e 5 × 4, care rezolvă deja provocarea următoare
  assert.match(errs([{ id: 'a', ask: 'x', want: { rows: 5 } }, { id: 'b', ask: 'y', want: { rows: 5, cols: 4 } }]), /b: e deja rezolvată/);
  assert.match(errs([{ id: 'a', ask: 'x', collect: { product: 7 }, by: ['rows', 'cols'], need: 3 }]), /are 2 soluții, cere 3/);
  assert.match(errs([{ id: 'a', ask: 'x', pick: [12, 12], rule: 'produs', of: [3, 4] }]), /repetate/);
  assert.match(errs([{ id: 'a', ask: 'x', pick: [11, 13], rule: 'produs', of: [3, 4] }]), /are 0 variante corecte/);
  assert.match(errs([{ id: 'a', ask: 'x', pick: [12, 13], rule: 'produs', of: [3, 4], hide: ['rows'] }]), /nu se poate ascunde/);
  assert.match(errs([{ id: 'A b', ask: 'x', want: { rows: 5, cols: 5 } }]), /id lipsă, greșit/);
  assert.match(lessonErrors({ id: 'x', widget: { w: 'nimic' }, tasks: [] }).join(), /widget necunoscut/);
});

test('învață: glisorul e rigla desenului (poziția, valoarea de sub deget, tastele)', () => {
  // 10 căsuțe pe o pistă de 300 px: mânerul valorii 3 stă la mijlocul căsuței a treia
  assert.equal(percentOf(3, 10), 25);
  assert.equal(valueAt(0, 300, 10, 1, 10), 1);
  assert.equal(valueAt(89, 300, 10, 1, 10), 3);
  assert.equal(valueAt(299, 300, 10, 1, 10), 10);
  assert.equal(valueAt(-40, 300, 10, 1, 10), 1, 'înainte de pistă: minimul');
  assert.equal(valueAt(400, 300, 10, 1, 10), 10, 'după pistă: maximul');
  assert.equal(valueAt(10, 300, 10, 2, 6), 2, 'gradațiile din afara intervalului nu se pot alege');
  assert.equal(valueAt(299, 300, 10, 2, 6), 6);
  // glisorul vertical crește în jos: ↓ adaugă, ↑ scoate; cel orizontal, ca de obicei
  assert.equal(keyStep('ArrowDown', true), 1);
  assert.equal(keyStep('ArrowUp', true), -1);
  assert.equal(keyStep('ArrowRight', false), 1);
  assert.equal(keyStep('ArrowDown', false), -1);
  assert.equal(keyStep('PageDown', true), 5);
  assert.equal(keyStep('Home', false), -Infinity);
  assert.equal(keyStep('End', true), Infinity);
  assert.equal(keyStep('a', true), 0);
});

test('învață: textele lecțiilor țin calculele pe un rând', () => {
  assert.equal(keepMath('Găsește pe hartă 6 × 7.'), `Găsește pe hartă 6${NBSP}×${NBSP}7.`);
  assert.equal(keepMath('7 × 6 = 5 × 6 + 2 × 6'), `7${NBSP}×${NBSP}6${NBSP}=${NBSP}5${NBSP}×${NBSP}6${NBSP}+ 2${NBSP}×${NBSP}6`);
  assert.equal(keepMath('Arată 5 + 5.'), `Arată 5${NBSP}+ 5.`);
  assert.equal(keepMath('fără calcule'), 'fără calcule');
});

test('învață: desenul săriturilor arată axa până la 10 × pasul, fără să spună unde ajunge veverița', () => {
  const spec = { v: 'skip-line', step: 3, count: 4 };
  assert.deepEqual(visualErrors(spec), []);
  assert.equal(visualLabel(spec), 'axa numerelor de la 0 la 30, din 3 în 3; veverița face 4 sărituri de câte 3');
  const svg = visualSVG(spec);
  assert.equal((svg.match(/v-skip-line__hop/g) ?? []).length, 4, 'câte un arc pe săritură');
  assert.equal((svg.match(/<text /g) ?? []).length, 11, 'numerele 0, 3, … 30');
  assert.ok(svg.includes('1f43f.svg'), 'veverița');
  assert.equal(visualErrors({ v: 'skip-line', step: 11, count: 2 }).length, 1);
  assert.ok(visualSVG({ ...spec, fresh: 3 }).includes('is-new'), 'săritura nouă are animația ei');
});
