// Cifruța în cloud: configurația Firebase. Valorile sunt publice (le vede oricine deschide site-ul); accesul la date îl hotărăsc
// regulile din firestore.rules. Cu ?emulator=1 în adresă, site-ul folosește emulatoarele locale (teste), niciodată datele reale.

export const SDK_VERSION = '12.19.0';
export const SDK_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;

// Proiectul real (consola Firebase → Project settings → Your apps → Web app „Cifruța”).
const PRODUCTION = {
  apiKey: '',
  authDomain: 'primary-school-math.firebaseapp.com',
  projectId: 'primary-school-math',
  storageBucket: 'primary-school-math.firebasestorage.app',
  messagingSenderId: '966131905013',
  appId: '1:966131905013:web:c3d6d308df51dccba5b0bc',
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
