# Cifruța în cloud: contul familiei, sincronizarea, clasamentul, administrarea

Site-ul rămâne static (GitHub Pages). Fără cont, totul merge ca înainte, iar Firebase nu se încarcă deloc. Cu cont, un **părinte**
intră cu Google și creează **profiluri de copii** (poreclă + avatar, cel mult 6). Rezultatele profilului care joacă se sincronizează
cu Cloud Firestore, iar cei intrați în cont văd clasamentul. Clientul scrie direct în baza de date, deci **regulile Firestore sunt
singura barieră** și au teste automate pe emulator.

## Fișiere

| Fișier | Rol |
|-|-|
| `site/js/cloud/config.js` | `firebaseConfig` (valori publice; `PRODUCTION` se completează după crearea aplicației web) și emulatoarele pentru `?emulator=1` |
| `site/js/cloud/firebase.js` | încarcă Firebase JS SDK 12.19.0 de pe gstatic cu `import()`, doar la nevoie |
| `site/js/cloud/logic.js` | logica pură (testată în Node): porecla, săptămâna ISO, clasamentele păstrate, stelele, îmbinările, coada |
| `site/js/cloud/session.js` | sesiunea sincronă din `cifruta:session`: prima pagină arată direct datele profilului |
| `site/js/cloud/account.js` | intrarea (popup), acordul, profilurile, profilul care joacă, ieșirea, ștergerea contului, `window.__cloud` pe emulator |
| `site/js/cloud/sync.js` | aducerea la activare, trimiterea scrierilor (`onWrite` din `core/storage.js`), coada, tranzacțiile, ștergerea unui profil |
| `site/js/cloud/boards.js` | citirea clasamentelor: primele 20 și locul profilurilor proprii (`getCountFromServer`) |
| `site/js/cloud/admin.js` | operațiile administratorului |
| `site/js/pages/profil.js`, `clasament.js`, `admin.js`, `confidentialitate.js` | paginile `#/profil`, `#/clasament/…`, `#/admin`, `#/confidentialitate` |
| `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc` | regulile, indexul clasamentului, emulatoarele, proiectul `primary-school-math` |
| `tests/cloud.test.js`, `tests/cloud/firestore.rules.mjs`, `tools/e2e_cloud.py` | testele logicii, ale regulilor și E2E pe emulatoare |

## Datele în browser

`core/storage.js` are un **scop**: fără cont, cheile de până acum (`cifruta:attempts`, `cifruta:fulger`, `cifruta:draft:<test>`); pentru
un profil, `cifruta:p:<uid>:<pid>:…`. Sunetul rămâne comun. Paginile citesc tot sincron. După aducerea datelor din cloud, `account.js`
reîncarcă doar paginile liniștite (`#/`, secțiunile, hub-ul Calcul fulger), niciodată un test sau o rundă în desfășurare.

Fiecare scriere (`addAttempt`, `updateAttempt`, `clearHistory`, `saveFulgerRound`, `clearFulger`) se anunță prin `onWrite`.
`sync.js` o pune în coada profilului (`…:pending`, cel mult 200 de operații, cu număr de ordine) și o trimite după 0,8 s.

- **Operații:** `attempt`, `clear-attempts`, `stars`, `round`, `board`, `boards`, `clear-fulger`.
- **La eșec:** operația rămâne în coadă, iar trimiterea se reia după 20 s, 100 s și apoi 5 min, la evenimentul `online` și la activarea
  următoare. Clasamentele nu blochează coada. O operație refuzată de 5 ori, de exemplu cu date invalide, se scoate din coadă.
- **La aducere:** cloudul e sursa. O încercare sau o rundă locală rămâne doar dacă așteaptă în coadă. O ștergere din coadă ascunde
  copiile din cloud până urcă. Recordurile și medaliile se îmbină ca maxim, respectiv cu prima dată.
- **Ieșirea din cont:** coada se golește cel mult 5 s, apoi apare întrebarea „Ieși oricum?”. Copiile profilurilor contului se șterg
  din browser.
- **Primul profil:** rezultatele fără cont se pot muta în profil, o singură dată (`combineData`), și urcă apoi prin coadă.

## Modelul de date (Firestore)

| Cale | Acces | Conținut |
|-|-|-|
| `admins/{uid}` | fiecare își citește doar documentul propriu; se creează din consolă | `{}` |
| `users/{uid}` | proprietarul și adminul; `blocked` îl schimbă doar adminul | `email` (din token), `name`, `createdAt`, `lastSeenAt`, `consentAt`, `blocked` |
| `users/{uid}/profiles/{p1…p6}` | proprietarul, adminul (adminul schimbă doar `nickname`) | `nickname`, `avatar`, `showOnBoards`, `createdAt`, `attempts`, `rounds`, `boards` |
| `…/attempts/{id}` | proprietarul, adminul | încercarea; `answers` ca text JSON (Firestore nu acceptă liste în liste) |
| `…/fulger/{nivel-ms}` | proprietarul, adminul | runda: `level`, `at`, `total`, `correct`, `wrong`, `bestStreak`, `fast`, `stars`, `byKind` |
| `…/state/fulger` | proprietarul, adminul | `best` pe niveluri și `medals` |
| `leaderboards/{board}/entries/{uid}_{pid}` | orice cont autentificat citește; proprietarul scrie, validat; adminul redenumește și șterge | `uid`, `pid`, `nickname`, `avatar`, `score`, `updatedAt`; la fulger și `correct`, `bestStreak`; la teste și `tests` |

**Clasamentele:**
- `fulger-<nivel>-all` și `fulger-<nivel>-<an>-W<săptămâna>` (săptămâna ISO, după ora României). Un profil își păstrează
  intrările doar în ultimele 2 săptămâni ale fiecărui nivel; cele mai vechi se șterg în aceeași tranzacție.
- `teste-stele`: cea mai bună încercare a fiecărui test, cu 0–3 stele, adunate. La 0 stele, intrarea se șterge.

**Scrierile legate între ele merg în tranzacții:**
- încercarea cu contorul;
- runda cu starea și contorul;
- intrările cu lista `boards` și ștergerea săptămânilor vechi;
- redenumirea profilului cu intrările lui.

`boards` din profil face posibile ștergerile fără căutări: ieșirea din clasament, ștergerea profilului, blocarea.

## Regulile, pe scurt

- Orice nu e permis explicit e refuzat. Adminul e `exists(/admins/$(uid))`, iar un cont blocat citește, dar nu mai scrie.
- Contul se creează doar pentru sine, cu e-mailul din token și `createdAt == request.time`. Proprietarul schimbă doar `name`,
  `lastSeenAt` și `consentAt`.
- Profilurile au id-uri `^p[1-6]$`, cer acordul în cont, o poreclă de 2–20 caractere (litere, cifre, spațiu, `.'-`) și un avatar
  din listă. Aceleași valori sunt și în `logic.js`, iar `tests/cloud.test.js` verifică potrivirea.
- O intrare în clasament e a contului (`entryId == uid + '_' + pid`), are porecla și avatarul profilului (`getAfter`), vine de la un
  profil cu `showOnBoards` și are `updatedAt == request.time`.
  - La Calcul fulger, scorul e 1–3000, doar crește și se schimbă cel mult o dată la 90 s.
  - La teste, scorul e 0–1000 și se schimbă cel mult o dată la 5 s.
  - Redenumirea trece fără aceste limite.
- Proprietarul își șterge intrările după id, deci și pe cele care nu mai există: un lot de curățare nu cade din cauza lor.

**Limită cunoscută:** în aceste limite, un client priceput poate trimite un scor inventat. Fără Cloud Functions (plan plătit) nu se
poate verifica pe server, așa că există moderarea din `#/admin` (redenumire, ștergerea intrărilor, blocare). App Check e în backlog.

## Pornirea proiectului Firebase (o singură dată)

1. **Authentication → Sign-in method → Google → Enable**, cu numele public „Cifruța” și e-mailul de suport.
2. **Authentication → Settings → Authorized domains:** `or-mihai-or-gheorghe.github.io` (`localhost` există deja).
3. **Firestore Database → Create database:** locația `eur3 (Europe)`, modul production. Pagina de confidențialitate spune „în
   Europa”, deci ține locația în sincron cu textul.
4. **Project settings → Your apps → Web app** „Cifruța”, fără Hosting. Valorile `firebaseConfig` intră în `PRODUCTION` din
   `site/js/cloud/config.js`. Sunt publice, nu secrete.
5. **Regulile și indexul:** `npm run deploy:rules`, după `npx firebase-tools login` sau cu `GOOGLE_APPLICATION_CREDENTIALS` spre cheia
   contului de serviciu din `_firebase_config/`. Cheia e în `.gitignore`: nu se publică și nu intră în `site/`.
6. **Adminul:** după prima intrare pe site, creezi documentul `admins/<uid>`. `uid`-ul se vede în Authentication → Users.
7. **Opțional:** restrângi cheia API din Google Cloud → Credentials la `https://or-mihai-or-gheorghe.github.io/*`,
   `https://primary-school-math.firebaseapp.com/*` și `http://localhost:*/*`.

## Teste

- `npm test`: logica (`tests/cloud.test.js`), scopul din `storage.js` și sesiunea, fără emulator.
- `npm run test:rules`: `firebase emulators:exec` pornește emulatorul Firestore (:8085) și rulează `tests/cloud/firestore.rules.mjs`,
  cu permis și refuzat pentru fiecare regulă și rol.
- `npm run e2e:cloud`: emulatoarele Auth (:9099) și Firestore, plus `tools/e2e_cloud.py`. Scriptul acoperă:
  - contul, acordul, profilul și mutarea rezultatelor;
  - al doilea dispozitiv, scrierile, ștergerea istoricului, redenumirea și ieșirea din clasament;
  - ieșirea din cont, telefonul, ștergerea profilului și a contului;
  - clasamentul văzut de doi părinți, refuzul pentru anonimi;
  - adminul care redenumește, blochează și deblochează.
  - Pentru capturi în `test-results/cloud-*.png`, cu emulatoarele pornite: `python3 tools/e2e_cloud.py --shots`.
- `firebase-tools` 15 cere **Java 21**. `tools/with-java21.sh` folosește un JDK 21 dezarhivat în `~/.cache/cifruta/jdk-21`
  (de exemplu Temurin), dacă există.

## Capcane

- `?emulator=1` folosește proiectul `demo-cifruta` și expune `window.__cloud` (`signInAs`, `state`, `flush`). Doar acolo există
  intrare fără popup.
- Fără valori în `PRODUCTION`, legăturile spre cont și clasament nu apar deloc, iar `npm run e2e` rămâne cel de dinainte.
- În E2E, după încărcarea Firebase nu se așteaptă `networkidle`, pentru că conexiunile spre emulatoare nu tac.
- La ieșirea din cont, emulatorul răspunde 400 la închiderea canalelor Firestore (`TYPE=terminate`). E zgomot, iar E2E îl ignoră.
- `replaceChildren(null)` scrie textul „null”: listele de noduri se filtrează înainte (`h()` ignoră singur valorile goale).
- Când Google cere o intrare recentă pentru `deleteUser`, fereastra Google se deschide din nou. Dacă browserul o blochează, datele
  sunt deja șterse, iar un clic nou termină ștergerea contului.

**Consum estimat** (planul gratuit: 50 000 de citiri și 20 000 de scrieri pe zi):
- o rundă: ~3 citiri și ~5 scrieri;
- o vizită în clasament: ~22 de citiri;
- activarea unui profil: încercările, cel mult 30 de runde și starea.
