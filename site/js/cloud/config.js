// Configurația Firebase. Cheia (apiKey) e goală în git: la publicare o scrie fluxul .github/workflows/pages.yml, din secretul FIREBASE_API_KEY.

export const SDK_VERSION = '12.19.0';
export const SDK_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;

const PRODUCTION = {
  apiKey: '',
  authDomain: 'primary-school-math.firebaseapp.com',
  projectId: 'primary-school-math',
  storageBucket: 'primary-school-math.firebasestorage.app',
  messagingSenderId: '966131905013',
  appId: '1:966131905013:web:c3d6d308df51dccba5b0bc',
};

// ?emulator=1: emulatoarele locale (teste)
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

/** Fără cheie, contul și clasamentele nu apar. */
export const cloudConfigured = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
