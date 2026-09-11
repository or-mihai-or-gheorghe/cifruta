# Starea proiectului Cifruța

## Instantaneu
- **Data:** 2026-09-11 · **Versiune:** 0.1.0 (în lucru)
- **URL live:** (după publicare) https://or-mihai-or-gheorghe.github.io/cifruta/
- **Ce funcționează:** nucleul pur (expresii, reguli, punctaj, validare), logica celor 11 tipuri, demo + teste unitare.

## Etape
- [x] M0 Schelet: git, `_surse/`, `.gitignore`, `package.json`, `CLAUDE.md`, docs (curriculum, cercetare)
- [x] M1 Nucleu pur + logica tipurilor + teste unitare
- [ ] M2 Sistem de design (CSS, fonturi), router, pagini acasă/secțiune, atelier „Componente”
- [ ] M3 Player + rezultate/revizuire cu `choice`, `truefalse`
- [ ] M4 `fill` (toate layout-urile)
- [ ] M5 `dnd` + `order`, `categorize`, `match`, `mark`
- [ ] M6 `slider`, `build`, `clock`, `money`
- [ ] M7 Banca vizuală, emoji, mascota, atelier „Vizualuri” / „Tipuri”
- [ ] M8 Testele T1–T4
- [ ] M9 Finisaj: animații, accesibilitate
- [ ] M10 Publicare pe GitHub Pages

## Catalog
| id | titlu | versiune | status | validat | timp estimat | timp real |
|-|-|-|-|-|-|-|
| recap-c1-t1 | Amintiri din vacanță | – | planificat | – | 44 | – |
| recap-c1-t2 | La piață cu bunica | – | planificat | – | 44 | – |
| recap-c1-t3 | Călătorie în spațiu | – | planificat | – | 43 | – |
| recap-c1-t4 | O zi la fermă | – | planificat | – | 43 | – |

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

## Probleme cunoscute
- (niciuna încă)

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
