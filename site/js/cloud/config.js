// Cifruța în cloud: configurația Firebase. Valorile sunt publice (le vede oricine deschide site-ul); accesul la date îl hotărăsc
// regulile din firestore.rules. Cu ?emulator=1 în adresă, site-ul folosește emulatoarele locale (teste), niciodată datele reale.

export const SDK_VERSION = '12.19.0';
export const SDK_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;

// Proiectul real: se completează după crearea lui în consola Firebase (Project settings → Your apps → Web app).
const PRODUCTION = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

const EMULATED = {
  apiKey: 'demo-key',
  authDomain: 'demo-cifruta.firebaseapp.com',
  projectId: 'demo-cifruta',
  appId: 'demo-app',
};

const search = typeof location === 'undefined' ? '' : location.search;
export const USE_EMULATOR = new URLSearchParams(search).has('emulator');
export const firebaseConfig = USE_EMULATOR ? EMULATED : PRODUCTION;
export const EMULATOR = { auth: 'http://127.0.0.1:9099', firestoreHost: '127.0.0.1', firestorePort: 8085 };

/** Există un proiect configurat? Până atunci butonul „Intră” nu apare și site-ul merge ca înainte. */
export const cloudConfigured = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
