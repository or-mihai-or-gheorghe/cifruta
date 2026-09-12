# Cifruța — exerciții interactive pentru clasa a II-a

Teste interactive de **Matematică și explorarea mediului** pentru copiii de clasa a II-a, în limba română, cu
explicații pe înțelesul copiilor. Mascota site-ului este **Veverița Cifruța**.

**Site:** https://or-mihai-or-gheorghe.github.io/cifruta/

## Ce conține
- **Recapitulare: clasa I** — 4 teste de câte ~45 de minute, fiecare cu 11 exerciții pe trei niveluri
  (ușor → intermediar → avansat): *Amintiri din vacanță*, *La piață cu bunica*, *Călătorie în spațiu*, *O zi la fermă*.
- **Numerele de la 0 la 1000** — 6 teste tematice: *Lista de cumpărături*, *Prin oraș: tramvai, metrou, autobuz*,
  *Excursie cu trenul și cu mașina*, *Sondajul clasei*, *Concursul sportiv al școlii*, *Corpul meu în numere* — cu grafice,
  pictograme, hărți de linii, orare, bani de 100–500 de lei și corpul omenesc; la nivelul avansat, probleme în mai mulți pași
  și sarcini deschise cu mai multe răspunsuri bune.
- 13 tipuri de exerciții: alegere, adevărat/fals, casete de completat (rânduri, tabele, arbori, lanțuri, probleme cu
  plan), axa numerelor și termometrul, unire cu săgeți, ordonare cu cuvânt secret, sortare în coșuri, colorare (și cu reguli
  de buget), numărătoare, ceas, bani, traseu pe harta liniilor, grafic cu bare construit de copil.
- La final: scor, calificativ, stele pe niveluri, explicații pas cu pas, rezolvarea completă și „Mai încerc o dată”.
- Funcționează pe telefon, tabletă și calculator; progresul se salvează în browser.

## Pentru dezvoltatori
Site static (HTML + CSS + JavaScript, fără build și fără dependențe la rulare).

```bash
npm run serve   # http://localhost:8080
npm test        # teste unitare + validarea conținutului (Node 22+)
npm run e2e     # teste în browser cu Playwright pentru Python (Chromium)
```

- Structura, convențiile și memoria proiectului: [`CLAUDE.md`](CLAUDE.md), [`docs/STARE.md`](docs/STARE.md)
- Cum adaugi un test: [`docs/ghid-autor.md`](docs/ghid-autor.md)
- Harta conceptelor și sursele: [`docs/curriculum.md`](docs/curriculum.md), [`docs/cercetare.md`](docs/cercetare.md)

### Publicare
- **GitHub Pages (acum):** `npm run deploy` rulează testele și publică folderul `site/` pe ramura `gh-pages`.
- **Automat, la fiecare push (opțional):** după `gh auth refresh -h github.com -s workflow`, mută
  `tools/github-pages-workflow.yml` în `.github/workflows/pages.yml` și schimbă sursa Pages pe „GitHub Actions”.
- **Cloudflare Pages (alternativă):** conectează repo-ul, fără comandă de build (sau `npm test`), director de ieșire `site`.

## Licențe
- Codul: [MIT](LICENSE).
- Conținutul educațional (teste, texte, desene): [CC BY-NC-SA 4.0](LICENSE-CONTENT.md).
- Fonturi Andika și Baloo 2: SIL OFL 1.1; emoji Noto: Apache 2.0 — vezi [`site/assets/CREDITS.md`](site/assets/CREDITS.md).

Exercițiile sunt originale, create după programa școlară de Matematică și explorarea mediului (clasele I–II).
