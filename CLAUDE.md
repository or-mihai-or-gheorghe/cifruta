# Cifruța — exerciții interactive pentru clasa a II-a

Site static cu teste interactive de **Matematică și explorarea mediului** pentru un copil de clasa a II-a (România).
Mascota: **Veverița Cifruța**. Repo public `or-mihai-or-gheorghe/cifruta`; site live: https://or-mihai-or-gheorghe.github.io/cifruta/ (folderul `site/`, ramura `gh-pages`).

**La începutul fiecărei sesiuni citește `docs/STARE.md`** (stadiu, decizii, backlog, jurnal). La final actualizează-l și fă commit.

## Reguli de aur
- Tot conținutul și interfața în **română cu diacritice corecte**: ă â î ș ț (ș/ț cu virgulă U+0219/U+021B, niciodată ş/ţ cu sedilă), text NFC.
- Conținut **original** (site public): inspirat din programă, nu copiat din manuale; fără personajele manualelor.
- **Static, fără build, fără dependențe** la rulare: HTML + CSS + ES modules. Toate căile **relative** (site-ul stă sub `/cifruta/`).
  Singura excepție: Firebase JS SDK (modulele oficiale de pe `www.gstatic.com`, versiune fixă în `js/cloud/config.js`), încărcat cu
  `import()` doar pentru contul familiei; fără cont nu pleacă nicio cerere spre Google, în afară de paginile contului (`#/profil`,
  `#/admin`), care încarcă modulele la deschidere (detalii: `docs/cloud.md`).
- **Nicio cheie în git.** Cheia web Firebase stă doar în secretul GitHub `FIREBASE_API_KEY` (restricționată în Google Cloud) și intră în
  site la publicare, deci `site/js/cloud/config.js` are `apiKey: ''`. Cheia contului de serviciu stă doar în `_firebase_config/` (ignorat).
  Un commit publicat cu o cheie se repară doar cu o cheie nouă și rescrierea istoriei.
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
                           forme (figuri: contur, cheie canonică, nume, axe) · grile (piese din căsuțe, desfășurările cubului)
                           avatar (avatarul desenat: liste, text canonic, nume, alegerea la întâmplare)
                           grafuri (vecini și prieteni comuni, arbori: copii, frunze, drumul și suma de pe ramuri; turneul)
  js/components/, js/pages/  interfața (player, rezultate/revizuire, atelier; avatar-studio = atelierul avatarului, în profil și în atelier)
  js/types/<tip>/logic.js  logică pură (Node o poate importa): validate · count · answered · empty · solution · evaluate
  js/types/<tip>/view.js   DOM: mount(el, part, ctx) → { get, set, mode, showResult, destroy }
  js/visuals/              banca vizuală: registerVisual(nume, {render, label, demos}); all.js le importă pe toate;
                           avatar (desenul și accesoriile) · avatar-animals (cele 24 de animale) · avatar-parts (blănuri, ochi, umeri)
                           grafice (bare, linii, pictograme, tabel, cerc, Venn) · grafuri (hartă, rețea, turneu, arbore): desenele jocurilor
  js/fulger/               Jocuri fulger (jocuri pe viteză, pe teme, #/fulger): kinds (calcule până la 100), kinds-1000 (numerele până
                           la 1000), kinds-forme (figuri), kinds-grafice și kinds-grafuri (grafice, hărți, arbori), generate cu
                           sămânță, cu concepte · intrebari (formele întrebărilor: calcule și desene) · contexte (unități, nume, zile,
                           date) · rand · art (desenul și numele unei variante, cerința cu
                           emoji) · engine (temele, runda și punctajul, pur) · records (chei „temă:nivel”, datele vechi) · medals
                           (medaliile: catalogul, cele câștigate, cele ale unei runde; pur) · view (arena) · effects (particule, bannere);
                           pagina e pages/fulger.js
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
- `python3 tools/fetch_assets.py` / `tools/fetch_fonts.py` — descarcă emoji Noto noi (după ce le adaugi în `emoji.js`; din folderul
  `2D/svg` al depozitului Noto) și fonturile.
- `npm run deploy` — rulează `npm test` și împinge `main`; fluxul `.github/workflows/pages.yml` rulează testele și publică `site/` pe
  GitHub Pages → https://or-mihai-or-gheorghe.github.io/cifruta/, cu cheia web Firebase din secretul `FIREBASE_API_KEY` (~2 min, `gh run watch`;
  verifică apoi cu `python3 tools/e2e.py --base-url https://or-mihai-or-gheorghe.github.io/cifruta/`).

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
- **Tip nou în Jocuri fulger (calcule):** o intrare în `KINDS` (`js/fulger/kinds.js` pentru 0–100, `kinds-1000.js` pentru numerele până
  la 1000: `label`, `points`, `fastMs`, `mode`, `concepts` din `data/concepts.js`, `generate(rand)` cu răspunsul calculat și variante din
  greșeli tipice), o linie în `mix`-ul unui nivel al unei teme din `data/fulger.js` și regulile tipului în `RULES` din
  `tests/fulger.test.js` (cele de la 1000: `tests/fulger-1000.rules.js`); testul de calibrare spune dacă pragurile de stele mai sunt
  potrivite, iar conceptele temei trebuie să fie exact conceptele tipurilor ei (etichetele „fără / cu trecere” se verifică).
  - Formele întrebărilor (`choice`, `compare`, `sorting`) vin din `js/fulger/intrebari.js`, ca să le poată folosi ambele module.
  - La numerele de trei cifre, `numberQuestion` și `choice` cer `max` (implicit caută variante până la 100).
  - O întrebare `figure` **fără desen** (doar cerință și patru variante) e bună pentru șiruri, rotunjire sau numere scrise cu
    litere: cerința se scrie mai mare, iar variantele de patru cifre trec pe două coloane pe ecranele înguste.
  - Eticheta „fără / cu trecere” are câte o pereche pentru 0–100 (`mat.op.*`) și pentru 0–1000 (`mat.op1000.*`).
- **Tip cu figuri în Jocuri fulger:** o intrare în `SHAPE_KINDS` (`js/fulger/kinds-forme.js`, `mode: 'figure'`), al cărei `generate(rand)`
  întoarce `figureQuestion(kind, rand, { prompt, figure, solved, key, answer, distractors })`: desene din bancă (`glyph`, `glyph-cells`,
  `cell-grid`, `robot-grid`, `net`, `solid`, `farm-grid`), emoji sau texte; distractorii vin din greșeli tipice, iar id-ul unei variante e
  cheia ei canonică. Regula tipului stă în `tests/fulger-forme.rules.js` și găsește singură răspunsul, fără codul generatorului.
  `fulger.test.js` mai cere: cerința de cel mult 45 de caractere, 4 variante diferite și fără culori, și fără mărime, nume diferite pentru
  cititorul de ecran, desene valide, răspunsul pe toate pozițiile la fel de des și aceeași întrebare după JSON. Capturile din
  `python3 tools/e2e.py --only fulger --shots` se privesc pe fiecare tip.
- **Tip cu grafice sau grafuri în Jocuri fulger:**
  - **Unde:** o intrare în `CHART_KINDS` (`js/fulger/kinds-grafice.js`) sau în `MAP_KINDS` (`js/fulger/kinds-grafuri.js`). Datele se aleg
    la întâmplare, iar desenul vine din bancă: `chart-bars`, `chart-line`, `chart-picto`, `chart-table`, `chart-pie`, `venn`, `metro`,
    `network`, `bracket`, `tree`.
  - **Întrebarea** se face cu `numberQuestion`, `pickQuestion`, `drawnCompare` sau `drawnSort` din `js/fulger/intrebari.js` și poartă `ask`
    (ce se întreabă, ca date JSON). Din `ask`, regula tipului verifică numele din cerință (și sensul: „cele mai multe” sau „cele mai
    puține”, cine e primul) și calculează singură răspunsul, cu codul ei: `tests/fulger-grafice.rules.js` sau `tests/fulger-grafuri.rules.js`.
    Regulile acestor tipuri rulează pe 3000 de semințe, ca să prindă ramurile rare (o dată din 1000, „cu 5 mai mult” se citea „5 mai”).
  - **Comparările și ordonările pe desen** au `drawn: true`:
    - cardul arată doar desenul;
    - legenda (cel mult 24 de caractere) și operanzii stau în rândul de răspuns (`fg-strip`);
    - la ordonare, `tiles` sunt id-uri, cu desenele lor în `options`.
  - **Cerința:** cel mult `promptMax` caractere (45 implicit, 60 la grafice; un `{{e:nume}}` numără 2); singurul markup permis e `{{e:}}`.
  - **Unitățile, numele, zilele și datele** vin din `js/fulger/contexte.js` (genul dă „Câte / Câți”, cantitățile se scriu cu `cantitate`).
  - **Un desen nou de acest fel** intră și în `isChart` (`js/fulger/art.js`), în `FULGER_TEXT` (`tools/e2e.py`) și în grupurile testului de
    mărime din `tests/visuals.test.js`.
- **Temă nouă în Jocuri fulger:** tipurile ei în `KINDS`, apoi tema în `topics` din `data/fulger.js`: id permanent (fără segmentele
  `usor`, `intermediar`, `avansat`, `total`, `all`), `title`, `short`, `text`, `icon`, `grade`, `concepts` și cele 3 niveluri cu `warmup`,
  `mix`, `stars` (o temă `soon: true` n-are niveluri și apare doar ca „în curând”). Id-ul intră și în `fulgerTopics()` din
  `firestore.rules` (un test le compară). Verificare: `npm test`, `npm run test:rules`, `npm run e2e`, `npm run e2e:cloud`; la publicare
  **`npm run deploy:rules` înaintea lui `npm run deploy`**. Id-ul unei teme publicate nu se mai schimbă: e în cheile recordurilor
  („temă:nivel”) și în id-urile clasamentelor. O temă jucabilă nouă aduce singură cele 3 medalii ale ei (bronz, argint, aur, cu
  id-urile `<metal>:<temă>`); pragurile medaliilor în plus (`medals.extras[].count`) rămân cel mult numărul temelor jucabile (testul
  din `tests/fulger-medals.test.js` verifică).
- **Animal sau accesoriu nou pentru avatar:**
  1. Id permanent (`[a-z]+`, fără `fara` și `natural`), eticheta și genul în listele din `js/core/avatar.js`. La un animal, `natural`
     e culoarea lui din listă sau null; cu null, desenul are paleta proprie (`fur`).
  2. Desenul: un animal în `js/visuals/avatar-animals.js` (ancorele `a`, părțile `back`/`head`/`face`, reglajele `place`), un accesoriu
     în `HAT_ART` / `FACE_ART` / `NECK_ART` din `js/visuals/avatar.js`.
  3. Id-ul în funcția lui din `firestore.rules` (`avatarAnimals()` …; testul le compară) și în `PUBLISHED` din `tests/avatar.test.js`.
  4. Se privesc matricele din `#/atelier/avatare`, apoi `npm test`, `npm run test:rules`, `npm run e2e`, `npm run e2e:cloud`.
  5. La publicare, **`npm run deploy:rules` înaintea lui `npm run deploy`**.

  Un id publicat nu se mai scoate și nu se redenumește.

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
  la gesturi; butonul din antet ține preferința în `cifruta:sound`; implicit oprite la `prefers-reduced-motion`. Jocurile fulger
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
- Jocuri fulger: timpul rundei curge doar în bucla `requestAnimationFrame` din `js/fulger/view.js` și stă pe loc în pauză; ce ține
  de timpul rundei (întârzierea de la apariție, pauzele după răspuns) se programează cu `after()` pe acest timp, nu cu `setTimeout`.
  Punctajul (viteza contează doar în serie), pauzele (1 s; „Hopa” la greșeli mai rapide decât cititul) și stelele vin din
  `engine.js` + `data/fulger.js`; pragurile de stele sunt verificate prin simulare în `tests/fulger.test.js`. Rundele stau în
  `cifruta:fulger` și se șterg din „Pentru părinți” de pe pagina jocului (`#/fulger`, toate temele odată), nu odată cu istoricul testelor.
  Pagina jocului arată temele desfășurate, grupate (titlu, explicație, „Ce exersăm”, nivelurile; cele „în curând” la final), fără pagini
  separate: `#/fulger/<temă>` e aceeași pagină, derulată la temă. E2E: `?debug=1` → `window.__dbg.fulger` (`state`, `force`,
  `elapse`, `setStreak`). Efectele trecătoare nu apar la mișcare redusă; bannerele se așază deasupra cardului, nu peste întrebare.
- Jocuri fulger pe dispozitive: Safari pe iOS pornește sunetul doar dintr-un gest încheiat, deci arena cheamă `unlockSound()` la
  Start și la ridicarea degetului (răspunsurile se iau la `pointerdown`). În rundă arena umple spațiul de sub antet prin flex
  (`body.is-game`); sub 32rem înălțime (telefon ținut orizontal) întrebarea și variantele stau una lângă alta, iar E2E verifică pe
  ecrane joase că variantele încap fără derulare. O întrebare nu revine printre ultimele `noRepeat` (12); rezumatul rundei păstrează
  greșelile (`mistakes`) pentru „Greșelile tale”, dar ele nu se salvează în `cifruta:fulger`.
- Jocuri fulger cu figuri: desenele se dimensionează prin containere (`.fg-fig` cu `--fig-h`, `.fg-opt__art` cu `--opt-h`, proporția
  `--ar` din `aspect()`), pentru că `.v-svg { width: 100% }` din stratul visuals câștigă; cardul cere `.fg-q--figure { width: 100% }`
  (altfel desenul are lățimea implicită a unui SVG, 300 px), iar emoji-urile au regula `.c-emoji` în fiecare container. Culoarea nu e
  niciodată singurul indiciu, variantele au nume diferite (fiecare rotire și fiecare linie are numele ei), iar obiectele din desen stau
  în ordinea căsuțelor (numele desenului le citește în ordine și ar da răspunsul). Fără copii rotite ca distractori când rotirea e
  permisă, fără itemi care cer „pătratul e dreptunghi”, fără emoji cu forma neclară (📦 arată ca un cub). La variantele numerice în
  ordine crescătoare, răspunsul trebuie să poată sta pe toate cele 4 locuri (la numărat, răspunsurile sunt 4–6). `#/atelier/fulger`
  arată câte 12 întrebări din fiecare tip, cu răspunsul încadrat; `python3 tools/e2e.py --only fulger` rulează doar jocurile.
- Figuri pe telefon: mărimea nu deosebește variantele, pentru că desenul întrebării și variantele au scări diferite (o figură „mare” din
  șir iese mai mică decât o variantă „mică”); `bareId` și testul ignoră mărimea, iar șirurile și analogiile au doar figuri mari. Pașii
  robotului stau sub rețea ca plăcuțe numerotate, cât o căsuță, iar desenul rezolvat (`path`, `mark`) arată drumul pas cu pas. Variantele
  cu piese și rețele (`fg-answers--detailed`) trec pe două coloane pe telefoanele înalte. În SVG, clasa `v-label` își ia culoarea din CSS,
  care bate atributul `fill`: `txt()` scrie celelalte culori ca stil, iar `tests/visuals.test.js` refuză textul alb dat prin atribut.
- Jocuri fulger cu grafice și grafuri (temele „Grafice și tabele” și „Hărți și arbori”):
  - **Lizibil pe telefon:** desenele au viewBox de 320 de unități, cu text de cel puțin 18 unități (numerele 20, emoji-urile 24).
    `tests/visuals.test.js` citește mărimile din SVG, iar E2E le măsoară pe ecran (`FULGER_TEXT`: ≥ 14 px; 12 px pe 360×640, 11 px pe
    844×390).
  - **Culoarea nu e singurul indiciu:** a doua serie e punctată și are ■, liniile hărții au numere, al doilea cerc din Venn e punctat.
    Culorile seriilor sunt `--v-series-1..4`.
  - **Bara fulgerului** e o pastilă pe marginea de sus a cardului (absolută, fără înălțime proprie). E2E verifică încăperea cu seria
    pornită (`setStreak(3)`) și că pastila nu acoperă cerința (`bolt` din `FULGER_FIT`).
  - **Pauza „Hopa”** e plafonată la `guard.pauseMaxMs` (9 s), pentru tipurile lente.
  - **Un singur răspuns bun:** maximul și minimul întrebate sunt stricte, iar valorile stau pe liniile grilei. Cel mai scurt drum, linia,
    stația de schimb, prietenul comun și drumul cel mai bogat sunt unice. Regulile verifică toate acestea. O variantă din afara desenului
    are 0, deci apare doar la „cele mai multe”.
  - **Variantele:**
    - zilele și datele stau în ordinea lor (`order` în `pickQuestion`);
    - pe grafice cu pasul 5 sau 10, distractorii sunt multipli ai pasului (altfel ±1–3 lasă un singur număr posibil);
    - la răspunsuri mici (1–2), 0 rămâne printre variante, altfel răspunsul ar sta mereu primul (testul pozițiilor pică).
  - **Bucla `for (;;)`:** felul întrebării se alege înaintea ei. O întrebare refăcută nu trebuie să treacă la alt fel, altfel se strică
    amestecul și echilibrul pozițiilor.
  - **Scurtăturile** (drumul lacom, cea mai mare creangă, nodul din mijlocul rețelei) se refac de cele mai multe ori, ca răspunsul să
    ceară calculul; frecvența lor se măsoară prin simulare.
  - **Numele desenului** (pentru cititorul de ecran) citește datele, nu rezultatul: fără „cel mai mare”, total sau câștigător.
  - **E2E:** `DRAWN_TOPICS` (temele cu toate tipurile desenate) și `fulger_drawn_flow` joacă fiecare tip, cu un răspuns corect și unul
    greșit; `fulger_screens` le încearcă pe 844×390 și pe 360×640.
- Medaliile Jocurilor fulger (`js/fulger/medals.js`, configurarea `medals` din `data/fulger.js`, desenul `award`):
  - **Regula:** 3 stele la un nivel al unei teme aduc medalia metalului nivelului (bronz la Ușor, argint la Intermediar, aur la Avansat);
    aceeași medalie la 2, 3 și 5 teme aduce medaliile în plus (dublu, colecția, cupa).
  - **Deducerea:** stelele nu se salvează, deci medaliile temelor se deduc din recorduri (`medalsWon`) și se unesc cu cele salvate. Un
    prag de stele ridicat ascunde doar o medalie dedusă și încă nesalvată.
  - **Salvarea:** la finalul rundei, `medalsAfterRound` anunță doar medaliile noi, dar le salvează pe toate cele câștigate, ca să urce în
    cloud cu runda. La încărcarea paginii nu se scrie nimic.
  - **Id-urile** sunt permanente (`<metal>:<temă>`, `<metal>-<treaptă>`), iar legătura metal–nivel e fixă. Medaliile de dinainte de
    v0.13.0 rămân în date, dar nu se mai arată.
  - **Interfața:** raftul (`fg-medals`: un panou pe metal, cu medaliile temelor și cele în plus) stă după legătura spre clasament; cardul
    nivelului arată medalia lui (`fg-level-medal-<nivel>`), cardul de pe prima pagină numărul lor (`fulger-medals`), iar rezultatele doar
    medaliile noi (`fg-new-medals`). Câștigul nu se vede doar prin culoare (marginea plină și bifa), iar culorile vin din `[data-metal]`
    (`--metal`, `--metal-dark`, `--metal-bg`, `--metal-ink`).
  - **E2E:** testid-urile medaliilor conțin `:`, deci se caută doar cu `get_by_test_id`, iar `is-won` se verifică în lista claselor.
    `run.shot(page, nume, selector)` capturează doar un element (raftul, de pe o pagină lungă).
- Contul familiei (`js/cloud/`, paginile `profil`, `clasament`, `admin`, `confidentialitate`; detalii în `docs/cloud.md`): `core/storage.js`
  are un scop (`setScope`): fără cont, cheile de până acum; pentru un profil, `cifruta:p:<uid>:<pid>:…`. Orice scriere nouă în storage
  se anunță cu `emit`, ca `cloud/sync.js` să o urce prin `onWrite`. Regulile Firestore sunt singura barieră: un câmp nou în încercări,
  runde sau clasamente cere aceeași schimbare în `firestore.rules` și în cheile din `cloud/logic.js`, plus un test în
  `tests/cloud/firestore.rules.mjs`. Comenzi: `npm run test:rules` (emulator Firestore), `npm run e2e:cloud` (emulatoare Auth +
  Firestore, `?emulator=1`, `window.__cloud.signInAs`), `npm run deploy:rules`; emulatoarele cer Java 21 (`tools/with-java21.sh`).
  `replaceChildren(null)` scrie textul „null”: listele de noduri se filtrează înainte. Blocarea stă în `blocked/{uid}`, nu în
  `users/{uid}`. Clasamentele se calculează din starea completă din cloud (`state/fulger` cu `best` și `week`, `state/tests`), nu din ce
  e în browser; doar un `state/tests` lipsă (încercări urcate de v0.9.0) se reface din încercările din browser. Limitele de frecvență ale intrărilor (5 s la stele, 90 s la Jocuri fulger) înseamnă reîncercări automate; un E2E care
  schimbă aceeași intrare de două ori la rând trebuie să aștepte. Jocurile fulger au teme: recordurile și cele mai bune runde ale
  săptămânii au chei „temă:nivel” (`js/fulger/records.js`), datele de dinainte de teme se normalizează la fiecare citire
  (`normalizeFulger`), iar clasamentele sunt `fulger-<temă>-<nivel|total>-<perioadă>`; cele vechi (`fulger-<nivel>-…`) se mută cu
  scorul lor în tema veche, apoi se șterg. Clasamentele săptămânilor trecute nu se șterg: rezultatele sunt persistente.
- Avatarul desenat (`core/avatar.js`, `visuals/avatar*.js`, `components/avatar-studio.js`):
  - **Textul:** profilul și intrările din clasamente păstrează un singur text canonic, `animal[.culoare-…][.fundal-…][.cap-…][.fata-…][.gat-…]`,
    fără valorile implicite. Un avatar vechi (`vulpe`) înseamnă aspectul implicit, iar același aspect dă mereu același text.
  - **Siguranța:** textul se citește doar cu `parseAvatar` (tolerant) și se desenează doar cu `avatarSVG`; nu intră ca atare în HTML sau SVG.
  - **Id-urile** nu se scot, pentru că `validProfile()` verifică avatarul la fiecare scriere a profilului, și la contoare.
  - **Desenul** n-are id-uri și nici `clipPath` și se dimensionează prin container, ca orice `.v-svg`.
  - **Salvarea:** o schimbare doar de avatar rescrie numai clasamentele afișate (`shownBoards`); o poreclă nouă le rescrie pe toate.
  - **Antetul** cu contul se strânge în trepte, ca să încapă și o poreclă de 20 de caractere:
    - sub 47,5rem pleacă subtitlul siglei și textul clasamentului;
    - sub 42rem pleacă „Teste” și porecla, iar avatarul rămâne buton;
    - sub 30rem se strâng spațiile.

    E2E-ul contului verifică antetul la 1024, 768, 600, 390 și 360 px.
  - **Atelierul:** miniatura unei variante e aspectul de acum cu doar acea alegere schimbată, iar culoarea naturală a animalului apare
    doar ca „Naturală”.
