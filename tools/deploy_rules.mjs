// Publică firestore.rules în proiectul real, prin API-ul Firebase Rules: ce face și `firebase deploy`, fără verificarea serviciilor
// activate (cere `serviceusage.services.get`, pe care contul de serviciu al Admin SDK nu îl are).
// Folosire: GOOGLE_APPLICATION_CREDENTIALS=_firebase_config/<cheia>.json npm run deploy:rules
// (sau cu un cont cu drepturi pe proiect: gcloud auth application-default login). Testează întâi: npm run test:rules.

import { readFileSync } from 'node:fs';

import googleAuth from 'google-auth-library'; // vine cu firebase-tools

const PROJECT = 'primary-school-math';
const API = `https://firebaserules.googleapis.com/v1/projects/${PROJECT}`;

const auth = new googleAuth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'] });
const content = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

try {
  const client = await auth.getClient();
  const { data: ruleset } = await client.request({ method: 'POST', url: `${API}/rulesets`, data: { source: { files: [{ name: 'firestore.rules', content }] } } });
  const { data: release } = await client.request({
    method: 'PATCH',
    url: `${API}/releases/cloud.firestore`,
    data: { release: { name: `projects/${PROJECT}/releases/cloud.firestore`, rulesetName: ruleset.name } },
  });
  console.log(`Regulile Firestore sunt publicate: ${release.rulesetName.split('/').pop()} (${release.updateTime})`);
} catch (err) {
  console.error('Publicarea regulilor a eșuat:', JSON.stringify(err.response?.data?.error ?? err.message, null, 2));
  process.exit(1);
}
