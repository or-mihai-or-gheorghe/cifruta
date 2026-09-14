// Jocuri fulger: medaliile pe niveluri (bronz, argint, aur) și medaliile în plus (js/fulger/medals.js).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import config from '../site/data/fulger.js';
import { lintText } from '../site/js/core/lint.js';
import { playableTopics } from '../site/js/fulger/engine.js';
import { medalCatalog, medalsAfterRound, medalsWon, metalCount, metalOf } from '../site/js/fulger/medals.js';
import { LEGACY_TOPIC, LEVEL_IDS, normalizeFulger, recordKey } from '../site/js/fulger/records.js';
import '../site/js/visuals/all.js';
import { visualErrors, visualSVG } from '../site/js/visuals/index.js';

const OLD = ['prima-cursa', 'in-flacari', 'de-neoprit', 'fulgerul', 'fara-gres', 'campionul'];
const topics = playableTopics();
const third = (topicId, level) => topics.find((t) => t.id === topicId).levels.find((l) => l.id === level).stars.at(-1);
const record = (topicId, level, alune = third(topicId, level)) => [recordKey(topicId, level), { alune, at: '2026-09-14T10:00:00.000Z' }];
const bestOf = (...entries) => Object.fromEntries(entries);
const isExtra = (id) => !id.includes(':');

test('medalii: catalogul are, pe fiecare metal, medalia fiecărei teme jucabile și medaliile în plus, cu id-uri permanente', () => {
  const catalog = medalCatalog();
  const { metals, extras } = config.medals;
  assert.equal(catalog.length, metals.length * (topics.length + extras.length));
  assert.equal(new Set(catalog.map((m) => m.id)).size, catalog.length, 'id-uri unice');
  assert.deepEqual(metals.map((m) => m.level), LEVEL_IDS, 'bronz, argint, aur: câte un metal pe nivel, în ordine');
  assert.ok(extras.every((e, i) => e.count >= 2 && e.count <= topics.length && (i === 0 || e.count > extras[i - 1].count)), 'pragurile cresc și se pot atinge cu temele jucabile');
  for (const m of catalog) {
    assert.match(m.id, m.kind === 'topic' ? /^(bronz|argint|aur):[a-z0-9]+(-[a-z0-9]+)*$/ : /^(bronz|argint|aur)-[a-z]+$/, m.id);
    for (const text of [m.title, m.short, m.text].filter(Boolean)) assert.deepEqual(lintText(text), [], `${m.id}: „${text}”`);
    assert.deepEqual(visualErrors(m.visual), [], m.id);
    assert.match(visualSVG(m.visual), /aria-label="[^"]+"/, m.id);
    assert.ok(!OLD.includes(m.id), `${m.id}: id vechi`);
  }
  assert.deepEqual(
    catalog.slice(0, topics.length + extras.length).map((m) => m.id),
    [...topics.map((t) => `bronz:${t.id}`), 'bronz-dublu', 'bronz-colectie', 'bronz-cupa'],
    'pe fiecare metal: temele în ordinea din date, apoi medaliile în plus',
  );
  const bronz = catalog.filter((m) => m.metal === 'bronz');
  assert.deepEqual(bronz.filter((m) => m.kind === 'extra').map((m) => m.title), ['Bronz dublu', 'Colecția de bronz', 'Cupa de bronz']);
  assert.equal(bronz.find((m) => m.id === 'bronz-dublu').text, 'Medalia de bronz la 2 teme.');
  assert.deepEqual([bronz[0].title, bronz[0].short, bronz[0].text], ['Medalia de bronz', topics[0].short, '3 stele la nivelul Ușor.']);
  assert.equal(catalog.find((m) => m.id === `aur:${topics[0].id}`).text, '3 stele la nivelul Avansat.');
  assert.deepEqual([metalOf('usor')?.id, metalOf('intermediar')?.id, metalOf('avansat')?.id, metalOf('altceva')], ['bronz', 'argint', 'aur', null]);
});

test('medalii: 3 stele aduc medalia temei; aceeași medalie la 2, 3 și 5 teme aduce medaliile în plus', () => {
  const [a, b, c, d, e] = topics.map((t) => t.id);
  assert.deepEqual([...medalsWon({}, {})], []);
  assert.deepEqual([...medalsWon(bestOf(record(a, 'usor')), {})], [`bronz:${a}`]);
  assert.deepEqual([...medalsWon(bestOf(record(a, 'usor', third(a, 'usor') - 1)), {})], [], 'sub a treia stea, nicio medalie');
  assert.deepEqual([...medalsWon(bestOf(record(a, 'avansat')), {})], [`aur:${a}`]);
  assert.deepEqual([...medalsWon(bestOf(record(a, 'usor'), record(b, 'usor')), {})], [`bronz:${a}`, `bronz:${b}`, 'bronz-dublu']);
  const five = medalsWon(bestOf(...[a, b, c, d, e].map((t) => record(t, 'usor'))), {});
  assert.deepEqual([...five].filter(isExtra), ['bronz-dublu', 'bronz-colectie', 'bronz-cupa']);
  assert.equal(metalCount(five, 'bronz'), 5);
  const mixed = medalsWon(bestOf(record(a, 'usor'), record(b, 'intermediar')), {});
  assert.deepEqual([...mixed], [`bronz:${a}`, `argint:${b}`], 'metalele nu se adună între ele');
  // medaliile salvate rămân câștigate (și fără record) și numără la medaliile în plus
  assert.deepEqual([...medalsWon({}, { [`aur:${a}`]: 't', [`aur:${b}`]: 't', 'argint-cupa': 't' })], ['argint-cupa', `aur:${a}`, `aur:${b}`, 'aur-dublu']);
  // id-urile vechi, cele necunoscute și temele „în curând” nu contează
  const soonId = config.topics.find((t) => t.soon)?.id ?? 'tema-viitoare';
  const stored = Object.fromEntries([...OLD, 'bronz-mega', `bronz:${soonId}`, 'constructor', '__proto__'].map((id) => [id, 't']));
  assert.deepEqual([...medalsWon(bestOf([recordKey(soonId, 'usor'), { alune: 9999 }]), stored)], []);
  // datele de dinainte de teme: recordul fără temă intră în tema veche
  const legacy = normalizeFulger({ best: { usor: { alune: 9999, at: 'v' } }, medals: { 'prima-cursa': 'v' } });
  assert.deepEqual([...medalsWon(legacy.best, legacy.medals)], [`bronz:${LEGACY_TOPIC}`]);
});

test('medalii: o temă jucabilă nouă aduce singură medaliile ei, iar pragurile rămân', () => {
  const six = [...topics, { ...topics[0], id: 'tema-noua', short: 'Nouă' }];
  const catalog = medalCatalog(six);
  assert.equal(catalog.length, config.medals.metals.length * (six.length + config.medals.extras.length));
  assert.ok(catalog.some((m) => m.id === 'aur:tema-noua'));
  assert.equal(catalog.find((m) => m.id === 'bronz-cupa').count, 5);
  const best = Object.fromEntries(six.slice(0, 5).map((t) => [recordKey(t.id, 'usor'), { alune: t.levels[0].stars.at(-1) }]));
  assert.ok(medalsWon(best, {}, six).has('bronz-cupa'));
});

test('medalii: la finalul rundei se anunță doar medaliile noi, dar se salvează toate cele câștigate', () => {
  const [a, b, c, d, e] = topics.map((t) => t.id);
  const data = { best: bestOf(...[a, b, c, d].map((t) => record(t, 'usor'))), medals: {} };
  const { fresh, unsaved } = medalsAfterRound(data, recordKey(e, 'usor'), third(e, 'usor'));
  assert.deepEqual(fresh.map((m) => m.id), [`bronz:${e}`, 'bronz-cupa'], 'dublu și colecția erau deja câștigate, din recorduri');
  assert.deepEqual(unsaved, [...[a, b, c, d, e].map((t) => `bronz:${t}`), 'bronz-dublu', 'bronz-colectie', 'bronz-cupa']);
  // un record îmbunătățit, deja la trei stele, nu anunță nimic; ce e salvat nu se salvează din nou
  const saved = Object.fromEntries(unsaved.map((id) => [id, 't']));
  const again = medalsAfterRound({ best: { ...data.best, [recordKey(e, 'usor')]: { alune: third(e, 'usor') } }, medals: saved }, recordKey(e, 'usor'), third(e, 'usor') + 50);
  assert.deepEqual([again.fresh, again.unsaved], [[], []]);
  // un total care nu bate recordul nu schimbă nimic
  const low = medalsAfterRound({ best: bestOf(record(a, 'usor', 10)), medals: {} }, recordKey(a, 'usor'), 5);
  assert.deepEqual([low.fresh, low.unsaved], [[], []]);
  // o medalie salvată care nu mai reiese din recorduri nu se anunță din nou
  const kept = medalsAfterRound({ best: {}, medals: { [`argint:${a}`]: 't' } }, recordKey(a, 'intermediar'), 1);
  assert.deepEqual([kept.fresh, kept.unsaved], [[], []]);
});
