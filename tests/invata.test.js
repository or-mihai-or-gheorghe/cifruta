// Învață: lecțiile (site/data/invata.js) și logica lor (site/js/invata/). Provocările trebuie să se poată rezolva din interfață, în
// ordine, iar textele sunt verificate ca ale testelor (diacritice, NFC, mini-markup, date JSON).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import data from '../site/data/invata.js';
import CONCEPTS from '../site/data/concepts.js';
import { findNonJSON, lintText, walkTexts } from '../site/js/core/lint.js';
import { markupErrors, plain } from '../site/js/core/markup.js';
import { chapterConcepts, findLesson, hideable, lessonErrors, paramsOf, pickAnswer, pickCorrect, playableChapters, reachable, search, startState, widgetOf } from '../site/js/invata/logic.js';
import { WIDGETS } from '../site/js/invata/registry.js';
import { shareTens } from '../site/js/invata/widgets/imparte/logic.js';
import { bars } from '../site/js/invata/widgets/bare/logic.js';
import { backwards, steps } from '../site/js/invata/widgets/masina/logic.js';
import { keyStep, percentOf, valueAt } from '../site/js/invata/ruler.js';
import { NBSP, equation, keepMath, repeatedSum, spokenMath } from '../site/js/invata/text.js';
import '../site/js/visuals/all.js';
import { visualErrors, visualLabel, visualSVG } from '../site/js/visuals/index.js';
import array, { litCells, pairsLeft } from '../site/js/invata/widgets/array/logic.js';
import jumps from '../site/js/invata/widgets/jumps/logic.js';
import parts, { narrate, relevel } from '../site/js/invata/widgets/parts/logic.js';
import wall from '../site/js/invata/widgets/wall/logic.js';
import { compareFractions, equalParts, equivalents, parseFraction, reduce, sameValue } from '../site/js/invata/fractions.js';

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
  // niciun loc nu ține mai mult de 60% din răspunsuri (altfel copilul ghicește „a doua”)
  const most = Math.max(...[0, 1, 2, 3].map((i) => places.filter((x) => x === i).length));
  assert.ok(most <= Math.ceil(places.length * 0.6), `răspunsurile alegerilor: ${places.join(', ')}`);
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
    // „Ce învățăm”: scopul lecției și ce înseamnă desenul; indicația: ce face fiecare glisor și buton (două propoziții scurte)
    assert.ok(lesson.goal && plain(lesson.goal).length <= 170, `${lesson.id}: „Ce învățăm” lipsește sau e prea lung (${plain(lesson.goal ?? '').length})`);
    assert.ok(plain(lesson.intro).length <= 170, `${lesson.id}: indicația are ${plain(lesson.intro).length} de caractere (cel mult 170)`);
    for (const t of lesson.tasks) assert.ok(plain(t.ask).length <= 60, `${lesson.id}/${t.id}: cerința are ${plain(t.ask).length} de caractere (cel mult 60)`);
  }
});

test('învață: id-urile lecțiilor sunt unice în toată secțiunea (cardurile și testele E2E le caută după id)', () => {
  const ids = lessons.map(({ lesson }) => lesson.id);
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
});

test('învață: findLesson găsește lecțiile, nu și capitolele „în curând”', () => {
  const first = lessons[0];
  const found = findLesson(data, first.chapter.id, first.lesson.id);
  assert.equal(found.lesson, first.lesson);
  assert.equal(found.index, 0);
  assert.equal(findLesson(data, first.chapter.id, 'nu-exista').lesson, null);
  // un capitol „în curând” n-are lecții (azi toate capitolele se joacă, deci unul închipuit)
  assert.equal(findLesson({ chapters: [{ id: 'viitor', title: 'Viitor', icon: 'idee', soon: true, text: 'În curând.' }] }, 'viitor'), null);
  assert.equal(findLesson(data, 'impartirea', 'impartim-egal').index, 0);
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
  assert.equal(jumps.texts({ step: 5, count: 1 }, { step: 5, count: 1 }).reading, '1 săritură de câte 5');
});

test('învață: căutarea trece doar prin acțiunile interfeței', () => {
  for (const [name, W] of Object.entries(WIDGETS)) {
    for (const { lesson } of lessons.filter(({ lesson }) => lesson.widget.w === name)) {
      const params = paramsOf(lesson);
      const states = reachable(W, params);
      assert.ok(states.length >= 10 && states.length <= 20000, `${lesson.id}: ${states.length} stări`);
      for (const s of states.slice(0, 50)) for (const a of W.actions(params, s)) assert.doesNotThrow(() => W.apply(params, s, a));
      // și din punctul de plecare pe care și-l aduce o provocare (`start`): o ecuație nouă, alt număr de obiecte
      for (const t of lesson.tasks.filter((x) => x.start)) {
        for (const s of reachable(W, params, startState(W.initial(params), t)).slice(0, 50)) {
          for (const a of W.actions(params, s)) assert.doesNotThrow(() => W.apply(params, s, a), `${lesson.id}/${t.id}`);
        }
      }
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
  // pe hartă, căsuțele știute arată produsul: acolo nu se poate ascunde
  const table = { id: 'proba', widget: { w: 'array', skin: 'table', rows: 2, cols: 3 }, tasks: [{ id: 'a', ask: 'x', pick: [12, 13], rule: 'produs', of: [3, 4], hide: ['product'] }] };
  assert.match(lessonErrors(table).join(), /nu se poate ascunde/);
  assert.match(errs([{ id: 'A b', ask: 'x', want: { rows: 5, cols: 5 } }]), /id lipsă, greșit/);
  assert.match(lessonErrors({ id: 'x', widget: { w: 'nimic' }, tasks: [] }).join(), /widget necunoscut/);
  // `start`: doar mărimi pe care starea le are, iar provocarea nu e rezolvată chiar de punctul ei de plecare
  assert.equal(errs([{ id: 'a', ask: 'x', start: { rows: 2 }, want: { rows: 5, cols: 4 } }]), '');
  assert.match(errs([{ id: 'a', ask: 'x', start: { culoare: 2 }, want: { rows: 5 } }]), /câmpuri pe care widgetul nu le știe \(culoare\)/);
  assert.match(errs([{ id: 'a', ask: 'x', start: { rows: 5, cols: 5 }, want: { rows: 5, cols: 5 } }]), /deja rezolvată/);
  // `collect` își numără soluțiile din starea pusă de `start`
  assert.equal(errs([{ id: 'a', ask: 'x', start: { rows: 2 }, collect: { product: 12 }, by: ['rows', 'cols'], need: 3 }]), '');
});

test('învață: alegerile cu câtul și cu termenul necunoscut își socotesc răspunsul', () => {
  const cat = { id: 'c', ask: 'x', pick: [3, 4, 18], rule: 'cat', of: [24, 6] };
  assert.deepEqual(pickCorrect(cat), [1]);
  assert.equal(pickAnswer(cat), '24 : 6 = 4. Proba: 4 × 6 = 24.');
  assert.deepEqual(pickCorrect({ ...cat, of: [25, 6] }), [], 'o împărțire neexactă n-are cât în tablă');
  const box = { id: 'n', ask: 'x', pick: [4, 13, 22], rule: 'necunoscut', of: ['□ + 9 = 13'] };
  assert.deepEqual(pickCorrect(box), [0]);
  assert.equal(pickAnswer(box), '□ = 4, pentru că 4 + 9 = 13.');
  assert.deepEqual(pickCorrect({ ...box, pick: [5, 6, 49], of: ['□ × 7 = 42'] }), [1]);
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
  // împărțirea nu se rupe nici ea, dar două puncte lipite de cuvânt rămân cum sunt; căsuța e un număr ca oricare altul
  assert.equal(keepMath('Proba: 24 : 6 = 4.'), `Proba: 24${NBSP}:${NBSP}6${NBSP}=${NBSP}4.`);
  assert.equal(keepMath('□ + 7 = 15'), `□${NBSP}+ 7${NBSP}=${NBSP}15`);
  assert.equal(spokenMath('24 : 6 = ? Proba: 4 × 6 = 24.'), '24 împărțit la 6 egal cât Proba: 4 ori 6 egal 24.');
  assert.equal(spokenMath('□ + 7 = 15'), 'căsuța plus 7 egal 15');
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

test('învață: desenele din alegeri și din `show` sunt valide, iar numele lor nu spun dacă părțile sunt egale', () => {
  for (const { lesson } of lessons) {
    for (const t of lesson.tasks) {
      const drawings = [...(t.pick ?? []).filter((o) => o && typeof o === 'object'), ...(t.show ? [t.show] : [])];
      for (const d of drawings) {
        assert.deepEqual(visualErrors(d), [], `${lesson.id}/${t.id}`);
        assert.doesNotMatch(visualLabel(d), /egal/, `${lesson.id}/${t.id}: numele desenului nu dă răspunsul`);
      }
    }
  }
});

test('învață: fracțiile — simplificarea, fracțiile egale, compararea', () => {
  assert.deepEqual(reduce([2, 4]), [1, 2]);
  assert.deepEqual(reduce([0, 7]), [0, 1]);
  assert.deepEqual(reduce([6, 6]), [1, 1]);
  assert.deepEqual(equivalents([3, 6]).map(([n, d]) => `${n}/${d}`), ['1/2', '2/4', '3/6', '4/8', '5/10']);
  assert.deepEqual(equivalents([2, 3]).map(([n, d]) => `${n}/${d}`), ['2/3', '4/6', '6/9']);
  assert.deepEqual(equivalents([1, 7]).map(([n, d]) => `${n}/${d}`), ['1/7']);
  assert.ok(sameValue([2, 4], [5, 10]));
  assert.ok(compareFractions([1, 3], [1, 5]) > 0);
  assert.deepEqual(parseFraction('3/5'), [3, 5]);
  assert.equal(parseFraction('3/0'), null);
  assert.ok(equalParts({ shape: 'square', parts: 2, cut: 'diagonal' }));
  assert.ok(!equalParts({ shape: 'circle', parts: 2, sizes: [1, 2] }));
});

test('învață: întregul tăiat — tăiatul în două păstrează bucățile colorate, textele spun fracția', () => {
  const p = { shape: 'square', parts: 1, cut: true, shapes: ['square', 'circle'] };
  let s = parts.initial(p);
  s = parts.apply(p, s, { set: 'level', value: 2 });
  s = parts.apply(p, s, { toggle: 1 });
  assert.equal(parts.derive(p, s).value, '1/2');
  const halves = s;
  s = parts.apply(p, s, { set: 'level', value: 4 });
  assert.deepEqual(s.on, [2, 3], 'jumătatea colorată devine două sferturi');
  assert.equal(parts.derive(p, s).value, '1/2');
  assert.equal(parts.texts(p, s).reading, 'două sferturi, adică o jumătate');
  assert.equal(parts.texts(p, s).equation, '{{f:2/4}} = {{f:1/2}}');
  assert.equal(narrate(halves, s), 'Ai tăiat fiecare bucată în două: acum sunt patru sferturi. Partea colorată e aceeași: {{f:1/2}} = {{f:2/4}}.');
  // înapoi la jumătăți: jumătatea colorată rămâne; un sfert singur nu mai încape într-o jumătate
  assert.deepEqual(parts.apply(p, s, { set: 'level', value: 2 }).on, [1]);
  assert.deepEqual(relevel([2], 4, 2), []);
  assert.match(narrate({ parts: 4, on: [2] }, { parts: 2, on: [] }), /doar pe jumătate nu mai e colorată/);
  assert.equal(narrate(s, { ...s, on: [3] }), null, 'fără o treaptă nouă, nimic de povestit');
  assert.deepEqual(parts.apply(p, s, { set: 'level', value: 3 }), s, 'doar treptele 1, 2, 4 și 8');
  assert.deepEqual(parts.apply(p, s, { set: 'level', value: 1 }), { shape: 'square', parts: 1, on: [] });
  const q = { shape: 'bar', parts: 2, min: 1, max: 10, shapes: ['bar', 'circle'] };
  let t = parts.apply(q, parts.initial(q), { set: 'count', value: 2 });
  assert.equal(parts.texts(q, t).reading, 'două jumătăți, adică un întreg');
  t = parts.apply(q, t, { set: 'parts', value: 5 });
  assert.deepEqual(t.on, [], 'alt număr de părți șterge culoarea');
  assert.equal(parts.texts(q, parts.apply(q, t, { set: 'count', value: 3 })).reading, 'trei cincimi');
  assert.equal(parts.texts(q, { shape: 'bar', parts: 1, on: [] }).equation, 'un întreg');
  assert.equal(parts.check({ shape: 'circle', parts: 3, cut: true, shapes: ['circle'] }).length, 1, 'la tăiatul în două, părțile sunt 1, 2, 4 sau 8');
});

test('învață: zidul fracțiilor arată fracțiile egale, cu cea aleasă întâi', () => {
  const p = { den: 3, num: 1 };
  assert.equal(wall.texts(p, { den: 6, num: 3 }).equation, '{{f:3/6}} = {{f:1/2}} = {{f:2/4}} = {{f:4/8}} = {{f:5/10}}');
  assert.equal(wall.texts(p, { den: 6, num: 3 }).spoken, 'trei șesimi: la fel de mult ca o jumătate, ca două sferturi, ca patru optimi, ca cinci zecimi');
  assert.equal(wall.texts(p, { den: 7, num: 2 }).equation, '{{f:2/7}}');
  assert.deepEqual(wall.apply(p, { den: 8, num: 7 }, { set: 'den', value: 4 }), { den: 4, num: 4 }, 'numărătorul rămâne în rând');
  assert.deepEqual(wall.apply(p, { den: 8, num: 7 }, { tap: [9, 4] }), { den: 10, num: 5 });
});

test('învață: fracția dintr-o mulțime — farfuriile colorate', () => {
  const p = { skin: 'plates', mark: true, rows: 3, cols: 4, item: 'mar' };
  let s = array.apply(p, array.initial(p), { mark: 1 });
  assert.equal(s.marked, 2);
  assert.deepEqual(array.derive(p, s), { rows: 3, cols: 4, product: 12, marked: 2, part: 8 });
  assert.equal(array.texts(p, s).equation, '{{f:2/3}} din 12 mere = 8 mere');
  assert.equal(array.texts(p, s).spoken, 'două treimi din 12 mere înseamnă 8 mere');
  const three = array.apply(p, s, { set: 'marked', value: 3 });
  assert.deepEqual([array.apply(p, three, { set: 'rows', value: 2 }).marked, array.apply(p, three, { set: 'rows', value: 1 }).rows], [2, 2], 'cel mult câte farfurii sunt, iar farfuriile sunt cel puțin două');
});

test('învață: regulile alegerilor cu fracții', () => {
  const half = { v: 'fraction', shape: 'square', parts: 2, cut: 'diagonal' };
  const bent = { v: 'fraction', shape: 'circle', parts: 2, sizes: [1, 2] };
  assert.deepEqual(pickCorrect({ pick: [bent, half], rule: 'jumatati' }), [1]);
  assert.deepEqual(pickCorrect({ pick: ['1/5', '1/3', '1/4'], rule: 'mai-mare' }), [1]);
  assert.deepEqual(pickCorrect({ pick: ['1/2', '2/4'], rule: 'mai-mare' }), [], 'la egalitate nu e niciuna mai mare');
  assert.deepEqual(pickCorrect({ pick: ['2/5', '3/5', '6/10'], rule: 'valoare', of: [3, 5] }), [1]);
});

test('învață: „Bravo!” după o alegere spune răspunsul ales, nu desenul', () => {
  assert.equal(pickAnswer({ pick: [54, 56, 63], rule: 'produs', of: [7, 8] }), '7 × 8 = 56');
  assert.equal(pickAnswer({ pick: ['1/5', '1/3'], rule: 'mai-mare' }), '{{f:1/3}} e mai mare decât {{f:1/5}}.');
  assert.equal(pickAnswer({ pick: ['3/5', '2/5'], rule: 'valoare', of: [3, 5] }), '{{f:3/5}}: trei cincimi.');
  assert.match(pickAnswer({ pick: [{ v: 'fraction', shape: 'bar', parts: 2 }], rule: 'jumatati' }), /jumătăți/);
  for (const { lesson } of lessons) for (const t of lesson.tasks.filter((x) => x.pick)) assert.ok(pickAnswer(t), `${lesson.id}/${t.id}`);
});

test('învață: o provocare ascunde doar ce toate desenele chiar ascund', () => {
  assert.deepEqual(hideable(array, { skin: 'split' }), ['product']);
  assert.deepEqual(hideable(array, { skin: 'table' }), [], 'pe hartă, căsuțele știute arată produsul');
  assert.deepEqual(hideable(array, { skin: 'plates', mark: true }), []);
  assert.deepEqual(hideable(jumps, {}), [], 'veverița stă pe numărul la care ajunge');
  assert.deepEqual(hideable(wall, {}), ['same']);
  const t = wall.texts({}, { den: 2, num: 1 }, ['same']);
  assert.equal(t.equation, '{{f:1/2}}', 'fără lista fracțiilor egale');
  assert.equal(t.spoken, 'o jumătate');
  assert.equal(wall.texts({}, { den: 2, num: 1 }).spoken, 'o jumătate: la fel de mult ca două sferturi, ca trei șesimi, ca patru optimi, ca cinci zecimi');
  assert.equal(array.check({ skin: 'plates', mark: true, rows: 1, cols: 3, item: 'mar' }).length, 1, 'cel puțin două farfurii la fracții');
});

test('învață: împărțirea — farfuriile, pungile și pachetele de bețișoare', () => {
  const W = WIDGETS.imparte;
  const nbsp = (t) => t.replaceAll(NBSP, ' ');
  // părți egale: câte una pe fiecare farfurie, pe rând; ce nu ajunge rămâne în coș
  assert.deepEqual(W.derive({ mode: 'parti', total: 12 }, { total: 12, by: 3 }), { total: 12, plates: 3, each: 4, left: 0, exact: true });
  assert.deepEqual(W.derive({ mode: 'parti', total: 12 }, { total: 12, by: 5 }), { total: 12, plates: 5, each: 2, left: 2, exact: false });
  assert.equal(nbsp(W.texts({ mode: 'parti', total: 12 }, { total: 12, by: 3 }).equation), '12 : 3 = 4');
  assert.equal(nbsp(W.texts({ mode: 'parti', total: 12 }, { total: 12, by: 3 }).extra), 'Proba: 3 × 4 = 12.');
  assert.equal(nbsp(W.texts({ mode: 'parti', total: 12 }, { total: 12, by: 5 }).equation), '12 : 5 = 2 și rămân 2');
  // rezultatul ascuns nu apare nici în calcul, nici în citire, nici în legendă
  const hidden = W.texts({ mode: 'parti', total: 18 }, { total: 18, by: 6 }, ['each']);
  assert.equal(nbsp(hidden.equation), '18 : 6 = ?');
  assert.ok(!/\b3\b/.test(hidden.reading) && !hidden.legend.some(([, text]) => /\b3\b/.test(text)), JSON.stringify(hidden));
  // prin cuprindere: pungile, cu scăderea repetată (spusă în cuvinte când e lungă)
  const bags = W.texts({ mode: 'grupe', total: 12 }, { total: 12, by: 3 });
  assert.equal(nbsp(bags.sum), '12 − 3 − 3 − 3 − 3 = 0');
  assert.equal(W.texts({ mode: 'grupe', total: 24 }, { total: 24, by: 1 }).sum, 'Din 24 scazi 1 de 24 de ori și rămân 0.');
  assert.equal(W.texts({ mode: 'grupe', total: 24 }, { total: 24, by: 6 }, ['bags']).sum, undefined, 'scăderea repetată ar număra pungile');
  // zecile, apoi unitățile: pachetele care nu ajung pe toate farfuriile se desfac
  assert.deepEqual(shareTens(84, 4), { tensEach: 2, unitsEach: 1, broken: 0, left: 0, each: 21 });
  assert.deepEqual(shareTens(84, 3), { tensEach: 2, unitsEach: 8, broken: 2, left: 0, each: 28 });
  assert.deepEqual(shareTens(84, 9), { tensEach: 0, unitsEach: 9, broken: 8, left: 3, each: 9 });
  const zeci = W.texts({ mode: 'parti', total: 84, zeci: true }, { total: 84, by: 3 });
  assert.equal(zeci.reading, '84 de bețișoare pe 3 farfurii: câte 2 pachete și 8 bețișoare pe fiecare');
  assert.equal(zeci.extra, '2 pachete n-au ajuns pe toate farfuriile: le-am desfăcut în 20 de bețișoare.');
  // glisorul: 1–10; parametrii greșiți se văd
  assert.equal(W.apply({ mode: 'parti', total: 12 }, { total: 12, by: 3 }, { set: 'by', value: 14 }).by, 10);
  assert.deepEqual(W.hideable({ mode: 'grupe' }), ['bags']);
  assert.match(W.check({ mode: 'grupe', total: 12, zeci: true }).join(), /doar pentru modul parti/);
  assert.match(W.check({ mode: 'parti', total: 40 }).join(), /între 1 și 30/);
  assert.match(W.check({ mode: 'impartit', total: 12 }).join(), /mod necunoscut/);
});

test('învață: harta tablei citită pe dos — împărțirea și proba, fără trucurile înmulțirii', () => {
  const W = WIDGETS.array;
  const p = { skin: 'table', rows: 1, cols: 1, read: 'div' };
  const t = W.texts(p, { rows: 6, cols: 4, lit: [] });
  assert.equal(t.equation.replaceAll(NBSP, ' '), '24 : 6 = 4');
  assert.equal(t.extra.replaceAll(NBSP, ' '), 'Proba: 4 × 6 = 24.');
  assert.ok(!W.actions(p, W.initial(p)).some((a) => a.toggle), 'fără butoanele strategiilor');
  assert.match(W.check({ skin: 'grid', rows: 2, cols: 2, item: 'mar', read: 'div' }).join(), /doar pentru aspectul table/);
  assert.match(W.check({ ...p, read: 'impartire' }).join(), /doar pentru aspectul table/);
});

test('învață: balanța — ghicitul înclină balanța, iar luatul din ambele talere o lasă dreaptă', () => {
  const W = WIDGETS.balanta;
  const nbsp = (t) => t.replaceAll(NBSP, ' ');
  const p = { mode: 'guess', eq: '□ + 7 = 15' };
  const at = (guess) => ({ ...W.initial(p), guess });
  // prea puține nuci în sac: talerul cu sacul (stânga) e mai ușor, deci coboară dreapta
  assert.ok(W.tilt(p, at(5)) > 0 && W.tilt(p, at(10)) < 0 && W.tilt(p, at(8)) === 0);
  assert.equal(nbsp(W.texts(p, at(5)).equation), '5 + 7 < 15');
  assert.equal(nbsp(W.texts(p, at(8)).equation), '8 + 7 = 15');
  assert.deepEqual(W.derive(p, at(8)), { guess: 8, taken: 0, balanced: true, alone: false, bag: 8 });
  // luatul din ambele talere: ecuația se micșorează, balanța rămâne dreaptă
  const q = { mode: 'take', eq: '8 + 4 = □ + 5' };
  assert.deepEqual(W.controls(q, W.initial(q)), [{ id: 'taken', min: 0, max: 5, axis: 'cols' }]);
  assert.equal(nbsp(W.texts(q, { ...W.initial(q), taken: 3 }).equation), '9 = □ + 2');
  const alone = { ...W.initial(q), taken: 5 };
  assert.equal(W.derive(q, alone).alone, true);
  assert.equal(W.tilt(q, alone), 0);
  assert.equal(nbsp(W.texts(q, alone).extra), '□ = 12 − 5 = 7. Proba: 7 + 5 = 12.');
  assert.match(W.check({ mode: 'guess', eq: '□ − 7 = 8' }).join(), /doar adunări/);
  assert.match(W.check({ mode: 'guess', eq: '□ + 2 = 15' }).join(), /între 0 și 10/);
});

test('învață: barele — partea care lipsește, scăzătorul și descăzutul', () => {
  const W = WIDGETS.bare;
  const nbsp = (t) => t.replaceAll(NBSP, ' ');
  const texts = (eq, guess, lo = 0) => W.texts({ eq, lo }, { eq, lo, guess });
  assert.equal(nbsp(texts('□ + 7 = 15', 5).equation), '5 + 7 < 15');
  assert.equal(texts('□ + 7 = 15', 8).extra, 'Termenul necunoscut: □ = 15 − 7 = 8.');
  assert.equal(nbsp(texts('15 − □ = 9', 4).equation), '15 − 4 > 9');
  assert.equal(texts('15 − □ = 8', 7).extra, 'Scăzătorul: □ = 15 − 8 = 7.');
  assert.equal(texts('□ − 7 = 8', 15, 10).extra, 'Descăzutul: □ = 8 + 7 = 15.');
  assert.deepEqual(bars('□ − 7 = 8', 12), { top: 12, bottom: [8, 7], unknownTop: true, unknownAt: -1 });
  assert.deepEqual(W.controls({}, { eq: '□ − 7 = 8', lo: 10, guess: 10 }), [{ id: 'guess', min: 10, max: 20, axis: 'cols' }]);
  assert.match(W.check({ eq: '□ − 7 = 8', lo: 0 }).join(), /nu e pe glisor/);
  assert.match(W.check({ eq: '□ × 7 = 42' }).join(), /ecuație greșită/);
});

test('învață: mașina de numere — înainte, blocată la împărțiri neexacte, și pe dos', () => {
  const W = WIDGETS.masina;
  const nbsp = (t) => t.replaceAll(NBSP, ' ');
  const p = { ops: [['+', 20], ['−', 8]], out: 50, lo: 30 };
  const s = { ...W.initial(p), input: 38, back: true };
  assert.equal(nbsp(W.texts(p, s).equation), '38 + 20 = 58, 58 − 8 = 50');
  assert.equal(nbsp(W.texts(p, s).extra), 'Pe dos: 50 + 8 = 58, 58 − 20 = 38. A intrat 38.');
  assert.deepEqual(W.derive(p, s), { input: 38, fits: true, back: true });
  const div = { ops: [[':', 3]], out: 6, lo: 10 };
  assert.equal(W.texts(div, { ...W.initial(div), input: 13 }).reading, 'Mașina s-a oprit: 13 nu se împarte exact la 3.');
  assert.deepEqual(backwards([['×', 4]], 24), [24, 6]);
  assert.deepEqual(steps([[':', 3]], 13), [13, null]);
  assert.ok(W.actions(div, W.initial(div)).some((a) => a.toggle === 'back'));
  assert.match(W.check({ ops: [['×', 4]], out: 25 }).join(), /nu se poate merge pe dos/);
  assert.match(W.check({ ops: [['×', 4]], out: 80 }).join(), /nu e pe glisor/);
});
