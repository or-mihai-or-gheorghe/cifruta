// Contul familiei: intrarea cu Google, profilurile copiilor, profilul care joacă și rolurile (administrator, cont blocat).
// Firebase se încarcă doar când e nevoie: la o sesiune salvată în browser sau când părintele deschide pagina contului.
// Paginile citesc sincron starea (accountState) și se abonează la schimbări (onAccountChange).

import fulgerConfig from '../../data/fulger.js';
import { avatarId, parseAvatar } from '../core/avatar.js';
import { currentRoute, refresh } from '../core/router.js';
import { clearAccountCopies, clearScopeData, moveDrafts, readScopeData, setScope, writeScopeData } from '../core/storage.js';
import { cloudConfigured, USE_EMULATOR } from './config.js';
import { loadFirebase } from './firebase.js';
import { cleanNickname, combineData, freeProfileId, isRetiredBoard, shownBoards, signInError } from './logic.js';
import { readSession, sessionProfile, writeSession } from './session.js';
import { deleteProfileCloud, flush, requestBoards, startSync, stopSync, uploadAll } from './sync.js';

const OFF = { status: 'off', user: null, consent: false, admin: false, blocked: false, profiles: [], pid: null, error: null, notice: null };
// paginile care citesc rezultatele la afișare și se pot reîncărca fără să întrerupă copilul (nu un test, nu o rundă)
const QUIET = new Set(['', 'sectiune', 'fulger']);

let state = { ...OFF };
let fb = null;
let connecting = null;
let adoption = 0;
const listeners = new Set();

function set(changes) {
  state = { ...state, ...changes };
  for (const fn of listeners) {
    try {
      fn(state);
    } catch (err) {
      console.error(err);
    }
  }
}

/** Starea contului: { status: 'off' | 'loading' | 'ready' | 'error', user, consent, admin, blocked, profiles, pid, error, notice }. */
export const accountState = () => state;
export const activeProfile = () => state.profiles.find((p) => p.id === state.pid) ?? null;
/** { db, f, auth, a } după încărcarea Firebase (pentru clasament și administrare). */
export const firebaseHandles = () => fb;

export function onAccountChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const byId = (a, b) => a.id.localeCompare(b.id);

function refreshIfSafe() {
  const route = currentRoute();
  // pagina jocului (#/fulger și #/fulger/<temă>) se poate reîncărca; runda (#/fulger/<temă>/<nivel>) nu
  const quiet = QUIET.has(route.name) && (route.params.length === 0 || (route.name === 'fulger' && route.params.length === 1));
  if (!quiet || document.body.classList.contains('is-game')) return;
  refresh();
}

// Ieșirea voluntară din altă filă șterge sesiunea comună (cifruta:session). Fila asta află prin evenimentul `storage`, oprește
// sincronizarea și își șterge ea copiile profilurilor: ștergerea făcută de cealaltă filă se poate pierde dacă fila asta tocmai scria.
if (typeof addEventListener === 'function') {
  addEventListener('storage', (e) => {
    if (e.key !== 'cifruta:session' || e.newValue !== null || !state.user) return;
    const { uid } = state.user;
    adoption++; // o preluare a contului aflată în curs se oprește
    stopSync();
    setScope(null);
    clearAccountCopies(uid);
    set({ ...OFF, notice: 'Ai ieșit din cont în altă filă. Rezultatele noi se păstrează doar în acest browser.' });
    refreshIfSafe();
  });
}

/** La pornire, înainte de prima pagină: scopul datelor vine din sesiunea salvată, iar contul se confirmă în fundal. */
export function bootAccount() {
  const session = readSession();
  setScope(sessionProfile(session));
  if (!session) return;
  state = {
    ...OFF,
    status: 'loading',
    user: { uid: session.uid, email: session.email ?? '', name: session.name ?? '' },
    pid: session.pid ?? null,
    profiles: session.pid ? [{ id: session.pid, nickname: session.nickname, avatar: session.avatar }] : [],
  };
  if (cloudConfigured()) connect();
}

/** Încarcă Firebase și află cine e în cont (o singură dată); întoarce starea. */
export function connect() {
  if (!cloudConfigured()) return Promise.resolve(state);
  connecting ??= loadFirebase().then(
    (loaded) => {
      fb = loaded;
      // doar pe emulator (E2E); flush așteaptă întâi confirmarea contului, ca după o reîncărcare sincronizarea să fie pornită
      if (USE_EMULATOR) window.__cloud = { signInAs, state: () => state, flush: async () => (await connect(), flush()) };
      return new Promise((resolve) => {
        fb.a.onAuthStateChanged(fb.auth, (user) => {
          adopt(user).finally(() => resolve(state));
        });
      });
    },
    (err) => {
      console.error(err);
      connecting = null;
      set({ status: state.user ? 'error' : 'off', error: 'Nu mă pot conecta la serviciul de conturi. Rezultatele se păstrează în acest browser.' });
      return state;
    },
  );
  return connecting;
}

async function adopt(user) {
  const token = ++adoption;
  const session = readSession();
  if (!user) {
    // Scopul revine mereu la „fără cont”, ca nimic să nu mai intre în profil. Fără sesiune comună, dar cu fila încă în cont, altă filă
    // a ieșit voluntar: ștergem și aici copiile profilurilor (fila asta le-a putut rescrie între timp). Cu sesiunea încă prezentă
    // (intrarea a expirat), copiile rămân, ca rezultatele din coadă să urce la intrarea următoare.
    stopSync();
    const wasIn = Boolean(session || state.user);
    if (!session && state.user) clearAccountCopies(state.user.uid);
    writeSession(null);
    setScope(null);
    set({ ...OFF, notice: wasIn ? 'Ai ieșit din cont. Rezultatele noi se păstrează doar în acest browser.' : state.notice, error: wasIn ? null : state.error });
    if (wasIn) refreshIfSafe();
    return;
  }
  const { db, f } = fb;
  const me = { uid: user.uid, email: user.email ?? '', name: user.displayName ?? '' };
  if (session && session.uid !== user.uid) {
    stopSync();
    writeSession(null);
    setScope(null);
  }
  set({ status: 'loading', user: me, error: null });
  try {
    const ref = f.doc(db, 'users', me.uid);
    const snap = await f.getDoc(ref);
    if (!snap.exists()) {
      await f.setDoc(ref, { email: me.email, name: me.name.slice(0, 80), createdAt: f.serverTimestamp(), lastSeenAt: f.serverTimestamp() });
    } else {
      f.updateDoc(ref, { lastSeenAt: f.serverTimestamp() }).catch(() => {});
    }
    const [adminSnap, blockedSnap, profilesSnap] = await Promise.all([
      f.getDoc(f.doc(db, 'admins', me.uid)).catch(() => null),
      f.getDoc(f.doc(db, 'blocked', me.uid)).catch(() => null),
      f.getDocs(f.collection(db, 'users', me.uid, 'profiles')),
    ]);
    if (token !== adoption) return;
    const account = snap.exists() ? snap.data() : {};
    const profiles = profilesSnap.docs.map((d) => ({ ...d.data(), id: d.id })).sort(byId);
    set({ status: 'ready', consent: Boolean(account.consentAt), admin: Boolean(adminSnap?.exists()), blocked: Boolean(blockedSnap?.exists()), profiles, notice: null });
    const current = readSession();
    await activate(profiles.some((p) => p.id === current?.pid) ? current.pid : (profiles[0]?.id ?? null));
  } catch (err) {
    if (token !== adoption) return;
    console.error(err);
    set({ status: 'error', error: 'Nu am putut încărca contul. Verifică internetul și încearcă din nou.' });
  }
}

/** Profilul care joacă: scopul datelor, sesiunea din browser și sincronizarea lui. */
async function activate(pid) {
  const token = adoption;
  const { uid, email, name } = state.user;
  const profile = state.profiles.find((p) => p.id === pid) ?? null;
  const before = readSession();
  writeSession({ uid, email, name, pid: profile?.id ?? null, nickname: profile?.nickname ?? null, avatar: profile?.avatar ?? null });
  const moved = before?.uid !== uid || (before?.pid ?? null) !== (profile?.id ?? null);
  stopSync();
  setScope(profile ? { uid, pid: profile.id } : null);
  set({ pid: profile?.id ?? null });
  if (!profile) {
    if (moved) refreshIfSafe();
    return;
  }
  const changed = await startSync({
    ...fb,
    uid,
    pid: profile.id,
    blocked: () => state.blocked,
    onProfile: (changes) => patchProfile(profile.id, changes),
    onGone: () => adopt(fb.auth.currentUser),
  });
  if (token === adoption && (changed || moved)) refreshIfSafe();
}

function patchProfile(pid, changes) {
  set({ profiles: state.profiles.map((p) => (p.id === pid ? { ...p, ...changes } : p)) });
  if (pid === state.pid && ('nickname' in changes || 'avatar' in changes)) {
    const session = readSession();
    if (session) writeSession({ ...session, nickname: changes.nickname ?? session.nickname, avatar: changes.avatar ?? session.avatar });
  }
}

// ——— acțiunile părintelui ———

/** Fereastra Google; contul se preia în onAuthStateChanged. Întoarce false dacă nu s-a intrat (mesajul e în state.error). */
export async function signIn() {
  set({ error: null, notice: null });
  try {
    if (!fb) await connect();
    if (!fb) return false;
    const provider = new fb.a.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await fb.a.signInWithPopup(fb.auth, provider);
    return true;
  } catch (err) {
    const message = signInError(err?.code);
    if (message) set({ error: message });
    return false;
  }
}

/** Doar pe emulator (E2E): intrarea cu un cont Google de test, fără fereastră. */
async function signInAs(email, name = email.split('@')[0]) {
  await connect();
  const credential = fb.a.GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true, name }));
  await fb.a.signInWithCredential(fb.auth, credential);
  return new Promise((resolve) => {
    const done = (s) => s.status === 'ready' && s.user?.email === email;
    if (done(state)) return resolve(true);
    const stop = onAccountChange((s) => {
      if (done(s)) {
        stop();
        resolve(true);
      }
    });
  });
}

/**
 * Ieșirea din cont: golește întâi coada (cel mult 5 s). Cu rezultate netrimise și fără `force`, întoarce { ok: false, pending }.
 * Apoi șterge din browser copiile profilurilor acestui cont (dispozitivele pot fi folosite de mai multe familii).
 */
export async function signOut({ force = false } = {}) {
  const pending = await flush({ timeout: 5000 });
  if (pending > 0 && !force) return { ok: false, pending };
  const uid = state.user?.uid;
  stopSync();
  writeSession(null);
  setScope(null);
  if (uid) clearAccountCopies(uid);
  set({ ...OFF });
  if (fb) await fb.a.signOut(fb.auth);
  refresh();
  return { ok: true, pending: 0 };
}

export async function giveConsent() {
  const { db, f } = fb;
  await f.updateDoc(f.doc(db, 'users', state.user.uid), { consentAt: f.serverTimestamp() });
  set({ consent: true });
}

export async function addProfile({ nickname, avatar, showOnBoards = true }) {
  const { db, f } = fb;
  const id = freeProfileId(state.profiles);
  if (!id) throw new Error('Ai deja 6 profiluri.');
  const data = { nickname: cleanNickname(nickname), avatar: avatarId(parseAvatar(avatar)), showOnBoards, attempts: 0, rounds: 0, boards: [] };
  try {
    await f.setDoc(f.doc(db, 'users', state.user.uid, 'profiles', id), { ...data, createdAt: f.serverTimestamp() });
  } catch (err) {
    // de pe alt dispozitiv s-a creat între timp un profil cu același id: lista se reîncarcă
    adopt(fb.auth.currentUser);
    throw err;
  }
  const profile = { ...data, id };
  set({ profiles: [...state.profiles, profile].sort(byId) });
  return profile;
}

/**
 * Porecla, avatarul și prezența în clasament, într-o tranzacție cu intrările din clasamente: o poreclă nouă ajunge în toate
 * clasamentele profilului, un avatar nou doar în cele afișate (săptămânile trecute păstrează avatarul de atunci), iar la ieșirea
 * din clasament intrările se șterg.
 */
export async function updateProfile(pid, { nickname, avatar, showOnBoards }) {
  const { db, f } = fb;
  const uid = state.user.uid;
  const ref = f.doc(db, 'users', uid, 'profiles', pid);
  const next = { nickname: cleanNickname(nickname), avatar: avatarId(parseAvatar(avatar)), showOnBoards };
  const result = await f.runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Profilul nu mai există.');
    const current = snap.data();
    const boards = current.boards ?? [];
    const entryRef = (b) => f.doc(db, 'leaderboards', b, 'entries', `${uid}_${pid}`);
    // clasamentele de dinainte de teme nu se mai pot scrie (nici redenumi): rămân în listă, iar operația `boards` le mută în temă
    const retired = boards.filter(isRetiredBoard);
    const live = boards.filter((b) => !isRetiredBoard(b));
    const leaving = current.showOnBoards && !showOnBoards;
    const touched = leaving ? [] : next.nickname !== current.nickname ? live : next.avatar !== current.avatar ? shownBoards(live) : [];
    const entries = await Promise.all(touched.map((b) => tx.get(entryRef(b))));
    const changes = { ...next };
    if (leaving) changes.boards = [];
    else if (touched.length) {
      // doar clasamentele citite pot ieși din listă, când intrarea lor nu mai există
      const gone = new Set(touched.filter((_, i) => !entries[i].exists()));
      changes.boards = [...live.filter((b) => !gone.has(b)), ...retired].sort();
    }
    tx.update(ref, changes);
    if (leaving) for (const b of boards) tx.delete(entryRef(b));
    for (const e of entries) if (e.exists()) tx.update(e.ref, { nickname: next.nickname, avatar: next.avatar, updatedAt: f.serverTimestamp() });
    return { changes, boards: !leaving && (retired.length > 0 || (!current.showOnBoards && showOnBoards)) };
  });
  patchProfile(pid, result.changes);
  if (result.boards && pid === state.pid) requestBoards();
}

/** Șterge un profil cu toate rezultatele lui, din cloud și din browser. */
export async function removeProfile(pid) {
  const { db, f } = fb;
  const uid = state.user.uid;
  if (pid === state.pid) stopSync();
  const snap = await f.getDoc(f.doc(db, 'users', uid, 'profiles', pid));
  await deleteProfileCloud(fb, uid, pid, snap.data()?.boards ?? []);
  clearScopeData({ uid, pid });
  const profiles = state.profiles.filter((p) => p.id !== pid);
  set({ profiles });
  if (pid === state.pid || !state.pid) await activate(profiles[0]?.id ?? null);
}

export async function playAs(pid) {
  if (pid === state.pid) return;
  await flush({ timeout: 3000 });
  await activate(pid);
}

/** Rezultatele salvate în browser fără cont. */
export function anonymousCounts() {
  const { attempts, fulger } = readScopeData(null);
  return { attempts: attempts.length, rounds: fulger.rounds.length };
}

/** Mută rezultatele fără cont în profil (o singură dată) și le trimite în cloud. */
export async function moveAnonymousInto(pid) {
  if (state.pid !== pid) await activate(pid);
  const profile = { uid: state.user.uid, pid };
  writeScopeData(profile, combineData(readScopeData(profile), readScopeData(null), fulgerConfig.keepRounds));
  moveDrafts(null, profile);
  clearScopeData(null);
  uploadAll();
}

/**
 * Șterge profilurile, rezultatele, intrările din clasamente, documentul contului și contul din Firebase Authentication.
 * Dacă Google cere o intrare recentă și fereastra nu se poate deschide, aruncă { code: 'cifruta/reauth' }: datele sunt deja șterse,
 * iar un clic nou termină ștergerea contului.
 */
export async function deleteAccount() {
  const { db, f, a, auth } = fb;
  const uid = state.user.uid;
  stopSync();
  const profiles = await f.getDocs(f.collection(db, 'users', uid, 'profiles'));
  for (const d of profiles.docs) await deleteProfileCloud(fb, uid, d.id, d.data().boards ?? []);
  await f.deleteDoc(f.doc(db, 'users', uid));
  try {
    await a.deleteUser(auth.currentUser);
  } catch (err) {
    if (err?.code !== 'auth/requires-recent-login') throw err;
    try {
      await a.reauthenticateWithPopup(auth.currentUser, new a.GoogleAuthProvider());
      await a.deleteUser(auth.currentUser);
    } catch {
      throw Object.assign(new Error('Google cere să intri din nou în cont.'), { code: 'cifruta/reauth' });
    }
  }
  writeSession(null);
  setScope(null);
  clearAccountCopies(uid);
  set({ ...OFF, notice: 'Contul și toate datele lui au fost șterse.' });
  refresh();
}
