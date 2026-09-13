// Clasamentele, doar pentru cei intrați în cont: Calcul fulger pe fiecare nivel (săptămâna aceasta și tot timpul) și stelele de
// la teste. Primele TOP intrări vin dintr-o interogare; locul unui profil propriu aflat mai jos, dintr-o numărare pe server.
// Intrările le scrie cloud/sync.js; aici doar se citesc, cu o memorie scurtă, ca schimbarea filelor să nu recitească tot.

import { entryId, isoWeek, rankEntries, TESTS_BOARD } from './logic.js';

export const TOP = 20;
const FRESH_MS = 60_000;
const cache = new Map();

/** Id-ul clasamentului pentru filele paginii: { game: 'fulger' | 'teste', level, period: 'week' | 'all' }. */
export const boardId = ({ game, level, period }) => (game === 'teste' ? TESTS_BOARD : `fulger-${level}-${period === 'all' ? 'all' : isoWeek()}`);

/**
 * Primele TOP intrări, cu locul (la scor egal același loc; primul ajuns stă mai sus), și locurile profilurilor familiei aflate
 * mai jos: { top: [...], own: [...] }.
 */
export async function loadBoard({ db, f }, board, uid, pids = [], { force = false } = {}) {
  const key = `${board}|${uid}|${pids.join(',')}`;
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < FRESH_MS) return hit.data;
  const entries = f.collection(db, 'leaderboards', board, 'entries');
  const snap = await f.getDocs(f.query(entries, f.orderBy('score', 'desc'), f.orderBy('updatedAt', 'asc'), f.limit(TOP)));
  const top = rankEntries(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
  const own = [];
  for (const id of pids.map((pid) => entryId(uid, pid)).filter((id) => !top.some((e) => e.id === id))) {
    const mine = await f.getDoc(f.doc(entries, id));
    if (!mine.exists()) continue;
    const entry = { ...mine.data(), id };
    const above = await f.getCountFromServer(f.query(entries, f.where('score', '>', entry.score)));
    own.push({ ...entry, place: above.data().count + 1 });
  }
  const data = { top, own: own.sort((a, b) => a.place - b.place) };
  cache.set(key, { at: Date.now(), data });
  return data;
}

export const forgetBoards = () => cache.clear();
