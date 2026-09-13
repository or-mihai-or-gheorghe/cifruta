// Administrarea, doar pentru contul din admins/{uid}: conturile, blocarea, poreclele nepotrivite și ștergerea datelor.
// Regulile Firestore îi permit adminului doar atât: `blocked` pe cont, `nickname` pe profil și pe intrări, citiri și ștergeri.

import { entryId } from './logic.js';
import { deleteProfileCloud } from './sync.js';

const toDate = (t) => (t?.toDate ? t.toDate() : null);

/** Conturile, cele văzute recent primele. */
export async function listUsers({ db, f }, max = 100) {
  const snap = await f.getDocs(f.query(f.collection(db, 'users'), f.orderBy('lastSeenAt', 'desc'), f.limit(max)));
  return snap.docs.map((d) => ({ ...d.data(), uid: d.id, lastSeen: toDate(d.data().lastSeenAt) }));
}

export async function listProfiles({ db, f }, uid) {
  const snap = await f.getDocs(f.collection(db, 'users', uid, 'profiles'));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => a.id.localeCompare(b.id));
}

const entryRefs = ({ db, f }, uid, profiles) => profiles.flatMap((p) => (p.boards ?? []).map((board) => f.doc(db, 'leaderboards', board, 'entries', entryId(uid, p.id))));

/** Blocarea oprește scrierile contului (prin reguli) și îi scoate intrările din clasamente; deblocarea doar le permite din nou. */
export async function setBlocked(fb, uid, blocked) {
  const { db, f } = fb;
  const refs = blocked ? entryRefs(fb, uid, await listProfiles(fb, uid)) : [];
  const batch = f.writeBatch(db);
  batch.update(f.doc(db, 'users', uid), { blocked });
  for (const ref of refs) batch.delete(ref);
  await batch.commit();
}

/** O poreclă nepotrivită: profilul și intrările lui din clasamente, într-o tranzacție. */
export async function renameProfile({ db, f }, uid, pid, nickname) {
  const ref = f.doc(db, 'users', uid, 'profiles', pid);
  await f.runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Profilul nu mai există.');
    const entries = [];
    for (const board of snap.data().boards ?? []) entries.push(await tx.get(f.doc(db, 'leaderboards', board, 'entries', entryId(uid, pid))));
    tx.update(ref, { nickname });
    for (const entry of entries) if (entry.exists()) tx.update(entry.ref, { nickname });
  });
}

/** Scoate intrările unui profil din clasamente (cât timp contul nu e blocat, rundele noi le pot aduce înapoi). */
export async function removeEntries(fb, uid, profile) {
  const batch = fb.f.writeBatch(fb.db);
  for (const ref of entryRefs(fb, uid, [profile])) batch.delete(ref);
  await batch.commit();
}

/** Datele din cloud ale unui cont: profilurile cu tot ce țin de ele, apoi documentul contului. Contul Google se oprește din consolă. */
export async function deleteUserData(fb, uid) {
  for (const p of await listProfiles(fb, uid)) await deleteProfileCloud(fb, uid, p.id, p.boards ?? []);
  await fb.f.deleteDoc(fb.f.doc(fb.db, 'users', uid));
}
