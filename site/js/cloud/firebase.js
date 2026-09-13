// Cifruța în cloud: încarcă Firebase JS SDK la cerere (modulele oficiale de pe gstatic), o singură dată, și pregătește
// aplicația, autentificarea și Firestore. Vizitatorii fără cont nu încarcă nimic din toate acestea.

import { EMULATOR, firebaseConfig, SDK_URL, USE_EMULATOR } from './config.js';

let loading = null;

/** Promisiune memorată: { app, auth, db, a (funcțiile de autentificare), f (funcțiile Firestore) }. */
export function loadFirebase() {
  loading ??= (async () => {
    const [appSdk, a, f] = await Promise.all([
      import(`${SDK_URL}/firebase-app.js`),
      import(`${SDK_URL}/firebase-auth.js`),
      import(`${SDK_URL}/firebase-firestore.js`),
    ]);
    const app = appSdk.initializeApp(firebaseConfig);
    const auth = a.getAuth(app);
    auth.languageCode = 'ro';
    const db = f.initializeFirestore(app, { ignoreUndefinedProperties: true });
    if (USE_EMULATOR) {
      a.connectAuthEmulator(auth, EMULATOR.auth, { disableWarnings: true });
      f.connectFirestoreEmulator(db, EMULATOR.firestoreHost, EMULATOR.firestorePort);
    }
    return { app, auth, db, a, f };
  })().catch((err) => {
    loading = null; // o rețea căzută nu blochează încercările următoare
    throw err;
  });
  return loading;
}
