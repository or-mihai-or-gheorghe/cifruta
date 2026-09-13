# Cifruța — exerciții interactive pentru clasa a II-a

Site static cu teste interactive de **Matematică și explorarea mediului** pentru un copil de clasa a II-a (România).
Mascota: **Veverița Cifruța**. Repo public `or-mihai-or-gheorghe/cifruta`; site live: https://or-mihai-or-gheorghe.github.io/cifruta/ (folderul `site/`, ramura `gh-pages`).

**La începutul fiecărei sesiuni citește `docs/STARE.md`** (stadiu, decizii, backlog, jurnal). La final actualizează-l și fă commit.

## Reguli de aur
- Tot conținutul și interfața în **română cu diacritice corecte**: ă â î ș ț (ș/ț cu virgulă U+0219/U+021B, niciodată ş/ţ cu sedilă), text NFC.
- Conținut **original** (site public): inspirat din programă, nu copiat din manuale; fără personajele manualelor.
- **Static, fără build, fără dependențe** la rulare: HTML + CSS + ES modules. Toate căile **relative** (site-ul stă sub `/cifruta/`).
  Singura excepție: Firebase JS SDK (modulele oficiale de pe `www.gstatic.com`, versiune fixă în `js/cloud/config.js`), încărcat cu
  `import()` doar pentru contul familiei; fără cont nu pleacă nicio cerere spre Google (detalii: `docs/cloud.md`).
- **Pragmatic**: fără soluții complicate pentru cazuri-limită (ex. localStorage simplu), **fără funcții de voce** deocamdată. Ideile „nice to have” merg în backlog.
- Testele sunt **date declarative** (obiecte serializabile JSON, fără funcții) → vor putea fi mutate într-o bază de date.
- Textele din teste folosesc doar **mini-markup** (`**tare**`, `==evidențiat==`, `{{e:mar}}`, `{{v:star n=47}}`, `{{z:4}}`), niciodată HTML.
- **Răspunsurile se calculează**, nu se tastează de mână unde se poate (`expr`, semne deduse, căutare exhaustivă pentru ghicitori).
- După orice schimbare: `npm test` (+ `npm run e2e` dacă ai atins interfața).

## Structură
```
site/                      ← publicat
  index.html, css/main.css (@layer: tokens, base, layout, components, exercises, visuals, animations, utilities)
  js/app.js                pornire + router
  js/core/                 expr (calcule fără eval) · rules · markup · spec (validare) · scoring · registry
                           storage (localStorage simplu) · loader · router · dom (h, pop, countUp) · ro (diacritice, cantitate) · lint · dnd · sound
  js/components/, js/pages/  interfața (player, rezultate/revizuire, atelier)
  js/types/<tip>/logic.js  logică pură (Node o poate importa): validate · count · answered · empty · solution · evaluate
  js/types/<tip>/view.js   DOM: mount(el, part, ctx) → { get, set, mode, showResult, destroy }
  js/visuals/              banca vizuală: registerVisual(nume, {render, label, demos}); all.js le importă pe toate
  js/fulger/               Calcul fulger (joc de calcul pe viteză, pe teme, #/fulger): kinds (întrebări generate cu sămânță, cu
                           concepte) · engine (temele, runda și punctajul, pur) · records (chei „temă:nivel”, datele vechi) ·
                           view (arena) · effects (particule, bannere); pagina e pages/fulger.js
  data/catalog.js          secțiuni → grupuri → teste · concepts.js (ID-uri de concepte) · scoring.js · demo.js · fulger.js (jocul)
  data/tests/<grup>/tN-nume.js   testele (NU le numi test-*.js)
docs/  STARE.md · curriculum.md (harta conceptelor + surse) · cercetare.md · ghid-autor.md
tests/ *.test.js (node --test)   tools/ e2e.py (Playwright), acoperire.mjs (tabelul teste × concepte), fetch_assets.py
_surse/ scanările PDF (ignorate de git) — deschide-le doar dacă docs/curriculum.md nu acoperă ce cauți
```

## Tipuri de exerciții (13)
`choice` · `truefalse` · `fill` (layout inline/steps/table/tree/chain; casete number/relation/sign/select/text) ·
`slider` · `match` (săgeți) · `order` (+ cuvânt secret / indicii logice) · `categorize` · `mark` (+ paletă / `rules` de set) ·
`build` (numărătoare) · `clock` · `money` · `route` (stații atinse în ordine pe harta liniilor; `key` sau `rules`) ·
`chart` (grafic cu bare construit; `key` sau `rules`). Exemple complete: `site/data/demo.js` (vizibile la `#/atelier/tipuri`); ghid: `docs/ghid-autor.md`.
Extra pe exercițiu: `context: { text, visual, size: 'lg' }`; pe parte: `visual` (desen deasupra casetelor), `feedback: [{ if, text }]` pentru greșeli tipice.

## Comenzi
- `npm test` — teste unitare + validarea întregului conținut (schemă, răspunsuri, unicitate, durată exact 45 min, diacritice,
  etichete „cu / fără trecere”) + verifică dacă tabelul de acoperire din `docs/curriculum.md` e la zi (`npm run acoperire` îl regenerează).
- `npm run serve` — site local la http://localhost:8080 (`?debug=1` expune `window.__dbg`).
- `npm run e2e` — Playwright (Chromium headless): fluxuri pe fiecare test, gesturi pe fiecare tip, tastatură, capturi în `test-results/`
  (`python3 tools/e2e.py --only recap-c1-t2 --shots`, `--viewports laptop`, `--base-url https://…` pentru site-ul publicat).
- `python3 tools/fetch_assets.py` / `tools/fetch_fonts.py` — descarcă emoji Noto noi (după ce le adaugi în `emoji.js`) și fonturile.
- `npm run deploy` — rulează `npm test` și publică `site/` pe ramura `gh-pages` → https://or-mihai-or-gheorghe.github.io/cifruta/
  (build Pages ~1 min; verifică apoi cu `python3 tools/e2e.py --base-url https://or-mihai-or-gheorghe.github.io/cifruta/`).
  Publicare automată prin Actions: necesită `gh auth refresh -h github.com -s workflow`, apoi mută `tools/github-pages-workflow.yml` în `.github/workflows/`.

## Rețete
- **Test nou:** fișier în `site/data/tests/<grup>/`, intrare în `data/catalog.js` (id, file, version, estMin, exercises), concepte din
  `data/concepts.js`; 4 ușor → 4 intermediar → 3 avansat, exact 45 min; `npm test` până e verde. Detalii: `docs/ghid-autor.md`.
- **Modificare de test publicat:** crește `version` (în test și în catalog) → ciornele vechi sunt ignorate, iar rezultatele vechi
  își păstrează scorul, dar nu mai arată lista pe exerciții (rezumatul vine din încercarea salvată). Un desen decorativ nou nu cere
  versiune; unul cu date (riglă, cofraj, model cu bare) da.
- **Tip nou:** `js/types/<tip>/logic.js` + `view.js`, o linie în `core/registry.js`, un exemplu în `data/demo.js`, stiluri în `css/04-exercises.css`.
- **Vizual nou:** `registerVisual` într-un modul din `js/visuals/`, culori din variabile `--v-*`, `demos` pentru atelier.
- **Desen nou într-un exercițiu publicat:** `context.visual` / `part.visual` / `itemVisual` / `item.visual` / `bin.visual` din bancă;
  **nu** cere versiune nouă (răspunsurile și ciornele nu sunt afectate); `npm test` verifică numele desenului.
- **Tip nou în Calcul fulger:** o intrare în `KINDS` (`js/fulger/kinds.js`: `label`, `points`, `fastMs`, `mode`, `concepts` din
  `data/concepts.js`, `generate(rand)` cu răspunsul calculat și variante din greșeli tipice), o linie în `mix`-ul unui nivel al unei
  teme din `data/fulger.js` și regulile tipului în `RULES` din `tests/fulger.test.js`; testul de calibrare spune dacă pragurile de stele
  mai sunt potrivite, iar conceptele temei trebuie să fie exact conceptele tipurilor ei (etichetele „fără / cu trecere” se verifică).
- **Temă nouă în Calcul fulger:** tipurile ei în `KINDS`, apoi tema în `topics` din `data/fulger.js`: id permanent (fără segmentele
  `usor`, `intermediar`, `avansat`, `total`, `all`), `title`, `short`, `text`, `icon`, `grade`, `concepts` și cele 3 niveluri cu `warmup`,
  `mix`, `stars` (o temă `soon: true` n-are niveluri și apare doar ca „în curând”). Id-ul intră și în `fulgerTopics()` din
  `firestore.rules` (un test le compară). Verificare: `npm test`, `npm run test:rules`, `npm run e2e`, `npm run e2e:cloud`; la publicare
  **`npm run deploy:rules` înaintea lui `npm run deploy`**. Id-ul unei teme publicate nu se mai schimbă: e în cheile recordurilor
  („temă:nivel”) și în id-urile clasamentelor.

## Capcane știute
- `node --test` fără argumente ar prinde fișiere `test-*.js` — rulăm explicit `tests/**/*.test.js`.
- GitHub Pages ține fișierele în cache ~10 min; testele se încarcă cu `?v=<version>`.
- În capturile headless nu există font de emoji → emoji-urile vin din `site/assets/emoji/*.svg`.
- Slider/ceas/numărătoare: răspunsul e `null` până la prima atingere.
- Acordul numeral + substantiv: `cantitate(n, 'leu', 'lei')` → „1 leu”, „19 lei”, „20 de lei”, „101 lei”; `formatNumber(2.7)` → „2,7”.
- „Cu / fără trecere peste ordin” se verifică automat (`trecere(op, a, b)` pe coloane: 24 − 18, 7 + 5, 28 + 12, 100 − 50 sunt
  cu trecere): eticheta `mat.op(1000).cu-trecere` / `fara-trecere` trebuie să se potrivească cu calculele din `fill`/`choice`/`match`.
- Subpunctele a/b/c valorează egal în exercițiu, oricâte casete au; `weight: 0.5` pe subpunct la alegeri între două variante.
- În reguli (`holds`), `u z s m` sunt **cifrele** unităților, zecilor, sutelor, miilor (1000 → `m = 1`, `s = 0`); `n` e numărul.
- Răspunsurile vin din `localStorage`, deci pot avea orice formă: `evaluate` le verifică strict (`isInt` din `types/_shared.js`).
- Pragurile (stea 80%, de exersat 70%) se compară cu `reached()` din `core/scoring.js` (toleranță pentru virgula mobilă).
- Mișcare: doar `transform`/`opacity`, cu tokenii `--dur-*`/`--ease-*`; `pop(el)` (core/dom.js) pentru feedback la atingere,
  `countUp(el, to)` pentru scor, `confetti({ count })` (nimic la `prefers-reduced-motion`; regula globală zerează și delay-ul).
- SVG animat: partea care se mișcă stă într-un `<g class="v-<desen>__<parte>">` **fără atribut `transform`** (nici pe copii, dacă
  grupul se rotește — Chromium le strică); `transform-box` doar pe aceste grupuri, niciodată cu `*`. Ancore existente:
  `v-clock__hand--h/--m` (rotite din `clock/view.js`), `v-abacus__bead` (+ `is-new`), `v-scene__rays/cloud/boat/stars/rocket/sign/tree`
  (pornite de `--scene-play` pe intro și la hover pe card), `v-mascot__confetti`. `tests/visuals.test.js` impune regula.
- Un test durează **exact 45 de minute** (`config.estMin`, suma `estMin` a exercițiilor; validatorul refuză altă sumă). Cronometrul din
  player numără invers din `draft.activeMs` (doar cât e afișat un exercițiu); la 0 nu trimite nimic. Istoricul (încercări + ciorne) se
  șterge din casetele „Pentru părinți” (`clearHistory(testIds | null)` din `core/storage.js`, `refresh()` din `core/router.js`).
- Sunete: `play('tap'|'place'|'done'|'level'|'win'|'yes'|'no')` din `core/sound.js` (WebAudio sintetizat, fără fișiere), pornite
  la gesturi; butonul din antet ține preferința în `cifruta:sound`; implicit oprite la `prefers-reduced-motion`. Calcul fulger
  adaugă `ready`, `go`, `hit`, `star`, `combo`, `powerdown`, `tick`, `buzzer`; `play(nume, { step })` urcă tonul pe o scară pentatonică de cel mult o octavă.
- Pagina de început e punctul de plecare: `player.js` deschide mereu intro-ul (`show(-1)`); „Continuă testul” reia de la `resumeAt`,
  „Reîncepe de la zero” șterge ciorna (cu confirmare). `#/rezultate/<test>/<încercare>` arată o anumită încercare (`getAttempt`).
- `addAttempt()` întoarce `false` când stocarea nu scrie: încercarea rămâne în memorie (`isUnsaved`), ciorna nu se șterge, iar
  rezultatele arată un mesaj. Conceptele se creditează **pe subpunct** (`part.concepts`, altfel cele ale exercițiului).
- Răspunsul nu stă la vedere: în portofel se arată doar numărul de bancnote până la rezultate; variantele nu repetă desenul;
  `shuffle: true` la alegeri fără ordine naturală (`item.shuffle: false` o oprește pe un element). Vezi ghidul, secțiunea 6.
- Contrast: textul colorat folosește tokenii `--c-*-ink` (≥ 4,5:1, verificat de `tests/css.test.js`); culorile vii rămân pe
  fundaluri, buline și linii. Casetele de completat se prezintă cititorului de ecran cu șablonul lor (`blankLabel` din `fill/logic.js`).
- E2E: `--only <id>` sare fluxurile de atelier și de tastatură (`types_flow`, `keyboard_flow`) — rulează și fără `--only`.
- Sarcini deschise (`mark.rules`, `route.rules`, `chart.rules`, `money.distinct`): orice răspuns care respectă regulile ia tot creditul;
  validatorul cere cel puțin o soluție (o găsește prin enumerare: `mark` ≤ 12 elemente, `chart` ≤ 200 000 de combinații, `route`
  ≤ 12 stații) și, la `route` cu `key`, un singur drum cel mai scurt. `chart.key` nu acceptă 0 (bară neatinsă). Hărțile (`route-map`,
  liste de obiecte) și tabelele se pun în `context.visual` / `part.visual`, nu în `{{v:}}` (valorile n-au voie cu spații).
- Structura unui test tematic (secțiunea 0–1000): poveste comună, ≥ 6 tipuri, formare + comparare/ordonare + încă un concept
  `mat.nr1000.*` în fiecare test, 1–2 exerciții MEM, la intermediar două probleme în 2 pași, la avansat: problemă în 3+ pași
  (`fill` cu `layout: 'steps'`), sarcină deschisă cu reguli și un puzzle (`search`, cifre ascunse, mers invers, greșeala din bon/tabel).
- Validatorul refuză o casetă repetată în șabloanele unui `fill` și parametrii greșiți ai desenelor cu date (`check(p)` în
  `registerVisual`, `visualErrors` din `visuals/index.js`). Explicațiile **nu** sunt verificate automat: exemplele și limitele din
  `explain` se confruntă cu evaluatorul (auditul din v0.6.1 a găsit acolo erori), iar etichetele `med.*` stau doar pe exercițiile
  care evaluează cunoștințe. La `chart`, `most`/`least` înseamnă maxim/minim strict: scrie-o în enunț.
- `route` cu `map.segments` (lungimi) și `map.transfer` (timp la schimbarea liniei): validatorul cere o lungime pentru fiecare segment și,
  la `key`, un singur drum cel mai scurt dintre cele care respectă `rules` (cheia și regulile se pot combina: „cel mai scurt drum care
  trece prin…”). În timpul rezolvării nu se afișează lungimea drumului ales (ar da răspunsul subpunctului următor).
- Secțiunea 0–1000 nu folosește concepte viitoare (înmulțire, împărțire, fracții, operații până la 1000 cu trecere): avansatul se
  îngreunează prin pași, nu prin materie nouă. Diagrama circulară se citește prin felii care valorează un număr (`pie {groups, names}`).
- Calcul fulger: timpul rundei curge doar în bucla `requestAnimationFrame` din `js/fulger/view.js` și stă pe loc în pauză; ce ține
  de timpul rundei (întârzierea de la apariție, pauzele după răspuns) se programează cu `after()` pe acest timp, nu cu `setTimeout`.
  Punctajul (viteza contează doar în serie), pauzele (1 s; „Hopa” la greșeli mai rapide decât cititul) și stelele vin din
  `engine.js` + `data/fulger.js`; pragurile de stele sunt verificate prin simulare în `tests/fulger.test.js`. Rundele stau în
  `cifruta:fulger` și se șterg din „Pentru părinți” de pe lista temelor (`#/fulger`, toate temele odată), nu odată cu istoricul testelor. E2E: `?debug=1` → `window.__dbg.fulger` (`state`, `force`,
  `elapse`, `setStreak`). Efectele trecătoare nu apar la mișcare redusă; bannerele se așază deasupra cardului, nu peste întrebare.
- Calcul fulger pe dispozitive: Safari pe iOS pornește sunetul doar dintr-un gest încheiat, deci arena cheamă `unlockSound()` la
  Start și la ridicarea degetului (răspunsurile se iau la `pointerdown`). În rundă arena umple spațiul de sub antet prin flex
  (`body.is-game`); sub 32rem înălțime (telefon ținut orizontal) întrebarea și variantele stau una lângă alta, iar E2E verifică pe
  ecrane joase că variantele încap fără derulare. O întrebare nu revine printre ultimele `noRepeat` (12); rezumatul rundei păstrează
  greșelile (`mistakes`) pentru „Greșelile tale”, dar ele nu se salvează în `cifruta:fulger`.
- Contul familiei (`js/cloud/`, paginile `profil`, `clasament`, `admin`, `confidentialitate`; detalii în `docs/cloud.md`): `core/storage.js`
  are un scop (`setScope`): fără cont, cheile de până acum; pentru un profil, `cifruta:p:<uid>:<pid>:…`. Orice scriere nouă în storage
  se anunță cu `emit`, ca `cloud/sync.js` să o urce prin `onWrite`. Regulile Firestore sunt singura barieră: un câmp nou în încercări,
  runde sau clasamente cere aceeași schimbare în `firestore.rules` și în cheile din `cloud/logic.js`, plus un test în
  `tests/cloud/firestore.rules.mjs`. Comenzi: `npm run test:rules` (emulator Firestore), `npm run e2e:cloud` (emulatoare Auth +
  Firestore, `?emulator=1`, `window.__cloud.signInAs`), `npm run deploy:rules`; emulatoarele cer Java 21 (`tools/with-java21.sh`).
  `replaceChildren(null)` scrie textul „null”: listele de noduri se filtrează înainte. Blocarea stă în `blocked/{uid}`, nu în
  `users/{uid}`. Clasamentele se calculează din starea completă din cloud (`state/fulger` cu `best` și `week`, `state/tests`), nu din ce
  e în browser; doar un `state/tests` lipsă (încercări urcate de v0.9.0) se reface din încercările din browser. Limitele de frecvență ale intrărilor (5 s la stele, 90 s la Calcul fulger) înseamnă reîncercări automate; un E2E care
  schimbă aceeași intrare de două ori la rând trebuie să aștepte. Calcul fulger are teme: recordurile și cele mai bune runde ale
  săptămânii au chei „temă:nivel” (`js/fulger/records.js`), datele de dinainte de teme se normalizează la fiecare citire
  (`normalizeFulger`), iar clasamentele sunt `fulger-<temă>-<nivel|total>-<perioadă>`; cele vechi (`fulger-<nivel>-…`) ies din lista
  profilului și se șterg.
