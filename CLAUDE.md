# Cifruța — exerciții interactive pentru clasa a II-a

Site static cu teste interactive de **Matematică și explorarea mediului** pentru un copil de clasa a II-a (România).
Mascota: **Veverița Cifruța**. Publicat pe GitHub Pages din folderul `site/`.

**La începutul fiecărei sesiuni citește `docs/STARE.md`** (stadiu, decizii, backlog, jurnal). La final actualizează-l și fă commit.

## Reguli de aur
- Tot conținutul și interfața în **română cu diacritice corecte**: ă â î ș ț (ș/ț cu virgulă U+0219/U+021B, niciodată ş/ţ cu sedilă), text NFC.
- Conținut **original** (site public): inspirat din programă, nu copiat din manuale; fără personajele manualelor.
- **Static, fără build, fără dependențe** la rulare: HTML + CSS + ES modules. Toate căile **relative** (site-ul stă sub `/cifruta/`).
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
                           storage (localStorage simplu) · loader · router · dom · ro (diacritice, cuDe) · lint · dnd
  js/components/, js/pages/  interfața (player, rezultate/revizuire, atelier)
  js/types/<tip>/logic.js  logică pură (Node o poate importa): validate · count · answered · empty · solution · evaluate
  js/types/<tip>/view.js   DOM: mount(el, part, ctx) → { get, set, mode, showResult, destroy }
  js/visuals/              banca vizuală: registerVisual(nume, {render, label, demos}); all.js le importă pe toate
  data/catalog.js          secțiuni → grupuri → teste · concepts.js (ID-uri de concepte) · scoring.js · demo.js
  data/tests/<grup>/tN-nume.js   testele (NU le numi test-*.js)
docs/  STARE.md · curriculum.md (harta conceptelor + surse) · cercetare.md · ghid-autor.md
tests/ *.test.js (node --test)   tools/ e2e.py (Playwright), fetch_assets.py
_surse/ scanările PDF (ignorate de git) — deschide-le doar dacă docs/curriculum.md nu acoperă ce cauți
```

## Tipuri de exerciții (11)
`choice` · `truefalse` · `fill` (layout inline/steps/table/tree/chain; casete number/relation/sign/select/text) ·
`slider` · `match` (săgeți) · `order` (+ cuvânt secret / indicii logice) · `categorize` · `mark` (+ paletă) ·
`build` (numărătoare) · `clock` · `money`. Exemple complete: `site/data/demo.js`; ghid: `docs/ghid-autor.md`.

## Comenzi
- `npm test` — teste unitare + validarea întregului conținut (schemă, răspunsuri, unicitate, durată 40–48 min, diacritice).
- `npm run serve` — site local la http://localhost:8080 (`?debug=1` expune `window.__dbg`).
- `npm run e2e` — Playwright (Chromium headless): fluxuri pe fiecare test, gesturi pe fiecare tip, capturi în `test-results/`.

## Rețete
- **Test nou:** fișier în `site/data/tests/<grup>/`, intrare în `data/catalog.js` (id, file, version, estMin), concepte din
  `data/concepts.js`; 4 ușor → 4 intermediar → 3 avansat, ~43 min; `npm test` până e verde. Detalii: `docs/ghid-autor.md`.
- **Modificare de test publicat:** crește `version` (în test și în catalog) → ciornele vechi sunt ignorate.
- **Tip nou:** `js/types/<tip>/logic.js` + `view.js`, o linie în `core/registry.js`, un exemplu în `data/demo.js`, stiluri în `css/04-exercises.css`.
- **Vizual nou:** `registerVisual` într-un modul din `js/visuals/`, culori din variabile `--v-*`, `demos` pentru atelier.

## Capcane știute
- `node --test` fără argumente ar prinde fișiere `test-*.js` — rulăm explicit `tests/**/*.test.js`.
- GitHub Pages ține fișierele în cache ~10 min; testele se încarcă cu `?v=<version>`.
- În capturile headless nu există font de emoji → emoji-urile vin din `site/assets/emoji/*.svg`.
- Slider/ceas/numărătoare: răspunsul e `null` până la prima atingere.
- „de” după numerale: `cuDe(19,'lei')` → „19 lei”, `cuDe(20,'lei')` → „20 de lei”.
