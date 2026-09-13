// Sesiunea contului, citită sincron la pornire, fără Firebase: cine e în cont și ce profil joacă. Așa paginile arată din prima
// datele profilului, iar Firebase confirmă contul în fundal.

const KEY = 'cifruta:session';

/** { uid, email, name, pid, nickname, avatar } sau null. */
export function readSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && typeof s.uid === 'string' ? s : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    /* stocare blocată: contul merge până la reîncărcare */
  }
}

/** Profilul activ din sesiune, pentru scopul datelor: { uid, pid } sau null. */
export const sessionProfile = (s = readSession()) => (s?.pid ? { uid: s.uid, pid: s.pid } : null);
