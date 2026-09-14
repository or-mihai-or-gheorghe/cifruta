// Jocuri fulger: medaliile (modul pur, fără DOM). 3 stele la un nivel al unei teme aduc medalia metalului acelui nivel (bronz la Ușor,
// argint la Intermediar, aur la Avansat); aceeași medalie la mai multe teme aduce medaliile în plus (data/fulger.js, `medals`).
// Stelele nu se salvează, deci medaliile temelor se deduc din recorduri și se unesc cu cele salvate; la finalul unei runde se anunță
// doar cele noi, dar se salvează toate cele câștigate, ca să ajungă în cloud odată cu runda. La încărcarea paginii nu se scrie nimic.

import config from '../../data/fulger.js';
import scoring from '../../data/scoring.js';
import { cantitate } from '../core/ro.js';
import { playableTopics, starsFor } from './engine.js';
import { recordKey } from './records.js';

const levelLabel = (id) => scoring.levels.find((l) => l.id === id)?.label ?? id;

/** Metalul unui nivel ({ id, level, of, name }) sau null. */
export const metalOf = (levelId) => config.medals.metals.find((m) => m.level === levelId) ?? null;

/**
 * Catalogul medaliilor, în ordinea de afișare: pe fiecare metal, medaliile temelor jucabile, apoi cele în plus (după prag).
 * { id, kind: 'topic' | 'extra', metal, level, topic?, count?, title, short?, text, visual }
 */
export function medalCatalog(topics = playableTopics()) {
  return config.medals.metals.flatMap((metal) => [
    ...topics.map((topic) => ({
      id: `${metal.id}:${topic.id}`,
      kind: 'topic',
      metal: metal.id,
      level: metal.level,
      topic: topic.id,
      title: `Medalia ${metal.of}`,
      short: topic.short,
      text: `3 stele la nivelul ${levelLabel(metal.level)}.`,
      visual: { v: 'award', metal: metal.id, form: 'medalie', ...(topic.icon ? { icon: topic.icon } : {}) },
    })),
    ...config.medals.extras.map((extra) => ({
      id: `${metal.id}-${extra.id}`,
      kind: 'extra',
      metal: metal.id,
      level: metal.level,
      count: extra.count,
      title: extra.titles[metal.id],
      text: `Medalia ${metal.of} la ${cantitate(extra.count, 'temă', 'teme')}.`,
      visual: { v: 'award', metal: metal.id, form: extra.id, ...(extra.id === 'cupa' ? { n: extra.count } : {}) },
    })),
  ]);
}

/** Câte medalii de teme ale metalului sunt în setul câștigat. */
export const metalCount = (won, metalId, topics = playableTopics()) => topics.filter((t) => won.has(`${metalId}:${t.id}`)).length;

/**
 * Medaliile câștigate (Set de id-uri, în ordinea catalogului): cele salvate care sunt în catalog, medaliile temelor cu recordul la toate
 * stelele și treptele în plus atinse de numărul medaliilor de teme ale metalului (cu tot cu cele salvate). `best` și `stored` vin din
 * getFulger(), deci au deja cheile „temă:nivel”; id-urile necunoscute (și cele de dinainte de v0.13.0) nu contează.
 */
export function medalsWon(best = {}, stored = {}, topics = playableTopics()) {
  const catalog = medalCatalog(topics);
  const saved = (id) => Object.hasOwn(stored ?? {}, id);
  const mastered = (m) => {
    const lvl = topics.find((t) => t.id === m.topic)?.levels?.find((l) => l.id === m.level);
    return Boolean(lvl) && starsFor(lvl, best?.[recordKey(m.topic, m.level)]?.alune ?? 0) === lvl.stars.length;
  };
  const won = new Set(catalog.filter((m) => m.kind === 'topic' && (saved(m.id) || mastered(m))).map((m) => m.id));
  return new Set(catalog.filter((m) => (m.kind === 'topic' ? won.has(m.id) : saved(m.id) || metalCount(won, m.metal, topics) >= m.count)).map((m) => m.id));
}

/**
 * Medaliile unei runde terminate cu `total` la cheia „temă:nivel”: `fresh` = descrierile de anunțat (câștigate acum, necâștigate
 * înainte), `unsaved` = id-urile câștigate și încă nesalvate, care se salvează cu runda. Recordul nou se socotește ca în saveFulgerRound.
 */
export function medalsAfterRound({ best = {}, medals = {} } = {}, key, total, topics = playableTopics()) {
  const record = total > (best[key]?.alune ?? 0);
  const after = record ? { ...best, [key]: { ...best[key], alune: total } } : best;
  const before = medalsWon(best, medals, topics);
  const now = medalsWon(after, medals, topics);
  return {
    fresh: medalCatalog(topics).filter((m) => now.has(m.id) && !before.has(m.id)),
    unsaved: [...now].filter((id) => !Object.hasOwn(medals, id)),
  };
}
