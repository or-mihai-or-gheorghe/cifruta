# Cifruța — exerciții interactive pentru clasa a II-a

Teste interactive de **Matematică și explorarea mediului** pentru copiii de clasa a II-a, în limba română, cu
explicații pe înțelesul copiilor. Mascota site-ului este **Veverița Cifruța**.

**Site:** https://or-mihai-or-gheorghe.github.io/cifruta/

## Ce conține
- **Recapitulare: clasa I** — 4 teste de câte ~45 de minute, fiecare cu 11 exerciții pe trei niveluri
  (ușor → intermediar → avansat): *Amintiri din vacanță*, *La piață cu bunica*, *Călătorie în spațiu*, *O zi la fermă*.
- **Numerele de la 0 la 1000** — 8 teste tematice: *Lista de cumpărături*, *Prin oraș: tramvai, metrou, autobuz*,
  *Excursie cu trenul și cu mașina*, *Sondajul clasei*, *Concursul sportiv al școlii*, *Corpul meu în numere*,
  *Misiune în spațiu*, *Elevul de serviciu* — cu grafice, pictograme, hărți de linii, orare, bani de 100–500 de lei și corpul
  omenesc; la nivelul avansat, probleme în mai mulți pași și sarcini deschise cu mai multe răspunsuri bune.
- **Adunarea și scăderea până la 1000** — 8 teste „Călătorie pe Planeta Albastră”, cu trecere peste ordin (progresiv, pe
  niveluri) și cu Pământul în fiecare test: *Muzeul Planetei Albastre*, *Cabana din munți*, *Culesul de pe deal*, *De la bob la
  pâine*, *Pe Dunăre, până la mare*, *Grădina zoologică*, *Festivalul zmeelor*, *Patrula verde de Ziua Pământului* — cu
  calculul în scris pe coloane, proba, piramida numerelor, salturi pe axă și estimări.
- 13 tipuri de exerciții: alegere, adevărat/fals, casete de completat (rânduri, tabele, arbori, lanțuri, probleme cu
  plan, calcul în scris pe coloane, piramidă), axa numerelor și termometrul, unire cu săgeți, ordonare cu cuvânt secret, sortare în coșuri, colorare (și cu reguli
  de buget), numărătoare, ceas, bani, traseu pe harta liniilor, grafic cu bare construit de copil.
- La final: scor, calificativ, stele pe niveluri, explicații pas cu pas, rezolvarea completă și „Mai încerc o dată”.
- **Jocuri fulger** — runde de 2 minute pe 8 teme (adunări și scăderi până la 100, numerele până la 1000, șiruri și intruși,
  puzzle cu forme, figuri și corpuri, poziții și trasee, grafice și tabele, hărți și arbori), fiecare cu trei niveluri, stele,
  recorduri și medalii.
- **Contul familiei** (opțional) — părintele intră cu Google și face profiluri pentru copii (poreclă și avatar desenat);
  rezultatele se păstrează și în cloud, iar cei din cont văd clasamentul.
- Funcționează pe telefon, tabletă și calculator; progresul se salvează în browser.

## Pentru dezvoltatori
Site static (HTML + CSS + JavaScript, fără build și fără dependențe la rulare).

```bash
npm run serve        # http://localhost:8080
npm test             # teste unitare + validarea conținutului (Node 22+)
npm run e2e          # teste în browser cu Playwright pentru Python (Chromium)
npm run test:rules   # regulile Firestore, pe emulator
npm run e2e:cloud    # contul familiei, pe emulatoarele Auth și Firestore
```

- Structura, convențiile și memoria proiectului: [`CLAUDE.md`](CLAUDE.md), [`docs/STARE.md`](docs/STARE.md)
- Cum adaugi un test: [`docs/ghid-autor.md`](docs/ghid-autor.md)
- Harta conceptelor și sursele: [`docs/curriculum.md`](docs/curriculum.md), [`docs/cercetare.md`](docs/cercetare.md)
- Contul familiei (Firebase): [`docs/cloud.md`](docs/cloud.md)

### Mediul de lucru
`npm test` are nevoie doar de Node 22+. Pentru celelalte comenzi, o singură dată pe un calculator nou (instalările rămân de la
o sesiune la alta); pe macOS, cu Homebrew:

```bash
npm ci                                  # firebase-tools și uneltele pentru reguli, în node_modules/
brew install openjdk@21                 # Java 21 pentru emulatoarele Firebase; tools/with-java21.sh îl găsește singur
python3 -m pip install --user --break-system-packages playwright
python3 -m playwright install chromium  # browserul, în ~/Library/Caches/ms-playwright
```

- Python-ul din Homebrew refuză `pip install` în afara unui mediu virtual (PEP 668). `--user` instalează Playwright doar pentru
  utilizatorul curent, fără să atingă pachetele Homebrew.
- Când Homebrew trece `python3` la o versiune nouă (de exemplu 3.15), cele două comenzi pentru Playwright se rulează din nou.
- Pe alt sistem: orice Java 21 (în `PATH` sau dezarhivat în `~/.cache/cifruta/jdk-21`) și Playwright pentru Python.
- Publicarea regulilor Firestore (`npm run deploy:rules`) cere și cheia contului de serviciu din `_firebase_config/`, care nu
  intră în git (vezi `docs/cloud.md`).
- Opțional, `brew install poppler`: scanările din `_surse/` (PDF fără text) se pot citi pagină cu pagină.

### Publicare
- `npm run deploy` rulează testele și împinge `main`. Fluxul `.github/workflows/pages.yml` rulează din nou testele și publică
  folderul `site/` pe GitHub Pages (~2 min), cu cheia web Firebase din secretul `FIREBASE_API_KEY`. Schimbările doar în
  documentație (`docs/`, fișierele `.md`) nu republică site-ul.
- Când se schimbă `firestore.rules`: întâi `npm run deploy:rules`, apoi `npm run deploy`.
- **Cloudflare Pages (alternativă, fără contul familiei):** conectează repo-ul, fără comandă de build (sau `npm test`),
  director de ieșire `site`.

## Licențe
- Codul: [MIT](LICENSE).
- Conținutul educațional (teste, texte, desene): [CC BY-NC-SA 4.0](LICENSE-CONTENT.md).
- Fonturi Andika și Baloo 2: SIL OFL 1.1; emoji Noto: Apache 2.0 — vezi [`site/assets/CREDITS.md`](site/assets/CREDITS.md).

Exercițiile sunt originale, create după programa școlară de Matematică și explorarea mediului (clasele I–II).
