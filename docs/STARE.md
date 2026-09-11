# Starea proiectului Cifruța

## Instantaneu
- **Data:** 2026-09-11 · **Versiune:** 0.1.0
- **URL live:** (după publicare) https://or-mihai-or-gheorghe.github.io/cifruta/
- **Ce funcționează:** site complet: catalog pe secțiuni, player (un exercițiu pe ecran, hartă pe niveluri, ecrane între
  niveluri, ciornă), rezultate (scor, calificativ, stele, confetti, autoevaluare, zona pentru părinți, revizuire cu
  explicații, rezolvare, „Mai încerc o dată”), 11 tipuri de exerciții, banca vizuală (36 de desene), atelier pentru autori.
  Conținut: **4 teste de recapitulare a clasei I** (T1–T4). Calitate: 22 de teste Node, E2E 225+ verificări pe 3 ecrane.
- **Următorul pas:** copilul rezolvă T1–T4 → notăm timpii reali și dificultatea; apoi secțiunile U1 (numere 0–1000) și U2.

## Etape
- [x] M0 Schelet: git, `_surse/`, `.gitignore`, `package.json`, `CLAUDE.md`, docs (curriculum, cercetare)
- [x] M1 Nucleu pur + logica tipurilor + teste unitare
- [x] M2 Sistem de design (CSS, fonturi), router, pagini acasă/secțiune, atelier „Componente”
- [x] M3 Player + rezultate/revizuire cu `choice`, `truefalse`
- [x] M4 `fill` (toate layout-urile)
- [x] M5 `dnd` + `order`, `categorize`, `match`, `mark`
- [x] M6 `slider`, `build`, `clock`, `money`
- [x] M7 Banca vizuală (36 de desene), emoji Noto locale, mascota, atelier „Vizualuri” / „Tipuri”
- [x] M8 Testele T1–T4
- [x] M9 Finisaj: animații, tastatură, animații reduse (fără voce, la cerere)
- [ ] M10 Publicare pe GitHub Pages

## Catalog
| id | titlu | versiune | status | validat | timp estimat | timp real |
|-|-|-|-|-|-|-|
| recap-c1-t1 | Amintiri din vacanță | 1 | publicat | npm test + E2E | 44 | – |
| recap-c1-t2 | La piață cu bunica | 1 | publicat | npm test + E2E | 44 | – |
| recap-c1-t3 | Călătorie în spațiu | 1 | publicat | npm test + E2E | 43 | – |
| recap-c1-t4 | O zi la fermă | 1 | publicat | npm test + E2E | 43 | – |

## Decizii
| data | decizie | motiv |
|-|-|-|
| 2026-09-11 | Site static vanilla (fără build, fără dependențe), router pe hash | găzduire gratuită pe GitHub Pages, ușor de extins |
| 2026-09-11 | Repo public GitHub `or-mihai-or-gheorghe/cifruta` + Pages din `site/` prin Actions | cerința de distribuire gratuită |
| 2026-09-11 | Teste = date declarative serializabile; logica tipurilor separată de DOM | validare automată în Node, DB mai târziu |
| 2026-09-11 | Niveluri ușor/intermediar/avansat ↔ standardele 2026 De bază/Consolidat/Avansat | aliniere la standardele naționale |
| 2026-09-11 | Un exercițiu pe ecran, rezultate la buton, fără cronometru afișat | UX pentru 6–8 ani (vezi docs/cercetare.md) |
| 2026-09-11 | Punctaj 10 din oficiu + 90; calificative FB/B/S, sub 50 „Mai exersăm!” | obiceiul din caietele auxiliare |
| 2026-09-11 | Fără voce (TTS), fără tastatură numerică proprie, localStorage simplu | cererea utilizatorului: fără over-engineering |
| 2026-09-11 | Explorarea mediului: 1–2 exerciții pe test | cererea utilizatorului |
| 2026-09-11 | Mascotă originală Veverița Cifruța; licențe MIT (cod) + CC BY-NC-SA 4.0 (conținut) | site public, fără personaje protejate |
| 2026-09-11 | Demo-ul tuturor tipurilor stă în catalog într-o secțiune ascunsă (`hidden: true`) | E2E și atelierul folosesc același player ca testele reale |
| 2026-09-11 | Casete numerice cu `inputmode="numeric"` (tastatura dispozitivului), semnele ca butoane | fără tastatură proprie, conform cererii |
| 2026-09-11 | Revizuirea arată răspunsul copilului vs. cel corect (✓/✗ + text), explicație (idee, pași, probă, capcană), rezolvarea completă și „Mai încerc o dată” | feedback eficient pentru 6–8 ani (docs/cercetare.md) |

## Probleme cunoscute
- Timpii `estMin` sunt estimați; trebuie calibrați cu timpii reali ai copilului (zona „Pentru părinți” de la rezultate).
- Talerele desenului `balance` se rotesc cu brațul (nu atârnă vertical) — nefolosit încă în teste.
- După publicare, GitHub Pages poate servi ~10 min fișiere vechi (cache).

## Backlog
- Scanările actuale acoperă manualul până la înmulțire; utilizatorul adaugă scanări noi după finalizarea etapei curente.
- Secțiuni noi după manual: Numerele 0–1000 · Corpul omenesc (U1); Adunarea și scăderea 0–1000 · Pământul (U2); apoi înmulțirea.
- Tipuri noi: balanță interactivă, traseu pe rețea cu săgeți, hotspot pe imagine, grafic cu bare, calendar, desen/simetrie.
- Variante generate aleator (cu sămânță), sunete, diplomă printabilă.
- Amânate la cerere: citire cu voce (TTS), tastatură numerică proprie pe ecran.
- Conturi de utilizator + bază de date (ex. Cloudflare D1 / Supabase) prin înlocuirea `core/storage.js`.

## Jurnal de sesiuni
- **2026-09-11** — Analiză scanări + documentare online (programă, EN II, exemple, aplicații). Plan aprobat.
  Implementat M0–M1: schelet, nucleu pur, logica celor 11 tipuri, demo, 14 teste unitare verzi. Docs: curriculum, cercetare.
  M2–M3: design system, pagini, player, rezultate; E2E pe demo trece (100 / 10 / ciornă).
  M4–M7: interfețele celor 11 tipuri (dnd, săgeți, slider, numărătoare, ceas, bani), banca vizuală, emoji locale.
  M8–M9: testele T1–T4 (validate automat: 0 erori), E2E 225 de verificări; ghidul autorului; README și licențe.
