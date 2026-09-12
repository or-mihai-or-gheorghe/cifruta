# Starea proiectului Cifruța

## Instantaneu
- **Data:** 2026-09-12 · **Versiune:** 0.6.0
- **URL live:** https://or-mihai-or-gheorghe.github.io/cifruta/ · **Repo:** https://github.com/or-mihai-or-gheorghe/cifruta (public)
- **Ce funcționează:** site complet: catalog pe secțiuni, player (pagina de început ca punct de plecare: Continuă / Reîncepe de
  la zero / Vezi rezultatele; un exercițiu pe ecran, hartă pe niveluri, ecrane între niveluri, ciornă, cronometru discret),
  rezultate (scor, calificativ, stele, confetti, autoevaluare, zona pentru părinți cu lista încercărilor și concepte pe subpunct,
  revizuire cu explicații, rezolvare, „Mai încerc o dată” repetabil), 13 tipuri de exerciții (cu traseu pe harta liniilor și
  grafic cu bare construit; `mark` cu reguli de set pentru sarcini deschise), banca vizuală (50 de desene: și grafice, pictograme,
  bețișoare, felii, tabele, podium, hartă de linii, indicator, raft, bon, listă, tabel de poziție, cuburi, medalie; 8 peisaje
  animate), sunete discrete cu buton de oprire, atelier pentru autori. Conținut: **4 teste de recapitulare a clasei I** (T1–T4 v2)
  și **6 teste tematice „Numerele de la 0 la 1000”** (cumpărături, oraș, excursie, sondaj, concurs sportiv, corpul omenesc), toate
  exercițiile cu desen sau emoji, fără răspunsuri „la vedere”, cu probleme în mai mulți pași și sarcini deschise la avansat.
  Calitate: 41 de teste Node (plus validarea conținutului, a tabelului de acoperire și a contrastului), E2E 1005 verificări pe 3 ecrane + tastatură.
- **Următorul pas:** copilul rezolvă T1–T4 și testele noi → notăm timpii reali și dificultatea; apoi secțiunea U2
  (Adunarea și scăderea până la 1000 · Pământul).

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
- [x] M10 Publicare pe GitHub Pages (ramura `gh-pages`, `npm run deploy`), E2E pe site-ul live: 227 de verificări, tag `v0.1.0`
- [x] M11 Remedierea feedback-ului extern + datorie tehnică (v0.2.0): evaluare strictă, „cu / fără trecere” verificat automat,
  T1 v2, subpuncte egale, slider pe axă, ciornă, router, tastatură; publicat, E2E pe site-ul live: 342 de verificări, tag `v0.2.0`
- [x] M12 Rafinare grafică, animații, efecte, interactivitate (v0.3.0): limbaj comun de apăsare, pop la aterizare, ceas cu
  ace rotite, bilă care cade, FLIP la ordonare, scene vii, rezultate animate, sunete, balanță corectată, desene în toate
  exercițiile; publicat, E2E pe site-ul live: 442 de verificări, tag `v0.3.0`
- [x] M13 (v0.4.0): fiecare test durează exact 45 de minute; istoricul se poate șterge pe test / secțiune / tot; cronometru discret;
  publicat, E2E pe site-ul live: 475 de verificări, tag `v0.4.0`
- [x] M14 (v0.5.0): feedback extern nr. 2 (rezultat păstrat la eșecul stocării, concepte pe subpunct, istoric accesibil, intro ca
  punct de plecare, accesibilitate, contrast, pauză neutră, praguri exacte la cronometru, explicații corectate) + „răspunsuri date
  de-a gata” scoase din conținut (T2–T4 v2); publicat, E2E pe site-ul live: 541 de verificări, tag `v0.5.0`
- [x] M15 (v0.6.0): secțiunea „Numerele de la 0 la 1000 · Corpul omenesc” cu 6 teste tematice; 12 concepte noi, 39 de emoji, 4 scene
  și 14 desene noi (grafice, hartă de linii, magazin, tabel de poziție, cuburi, medalie); tipurile `route` și `chart`, `mark` cu reguli
  de set; publicat, E2E pe site-ul live: 1005 verificări, tag `v0.6.0`

## Catalog
| id | titlu | versiune | status | validat | timp estimat | timp real |
|-|-|-|-|-|-|-|
| recap-c1-t1 | Amintiri din vacanță | 2 | publicat | npm test + E2E | 45 | – |
| recap-c1-t2 | La piață cu bunica | 2 | publicat | npm test + E2E | 45 | – |
| recap-c1-t3 | Călătorie în spațiu | 2 | publicat | npm test + E2E | 45 | – |
| recap-c1-t4 | O zi la fermă | 2 | publicat | npm test + E2E | 45 | – |
| u1-t1 | Lista de cumpărături | 1 | publicat | npm test + E2E | 45 | – |
| u1-t2 | Prin oraș: tramvai, metrou, autobuz | 1 | publicat | npm test + E2E | 45 | – |
| u1-t3 | Excursie cu trenul și cu mașina | 1 | publicat | npm test + E2E | 45 | – |
| u1-t4 | Sondajul clasei | 1 | publicat | npm test + E2E | 45 | – |
| u1-t5 | Concursul sportiv al școlii | 1 | publicat | npm test + E2E | 45 | – |
| u1-t6 | Corpul meu în numere | 1 | publicat | npm test + E2E | 45 | – |

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
| 2026-09-11 | Publicare cu `npm run deploy` pe ramura `gh-pages` (în loc de GitHub Actions) | token-ul `gh` nu are dreptul `workflow`; workflow-ul e pregătit în `tools/github-pages-workflow.yml` |
| 2026-09-11 | Revizuirea arată răspunsul copilului vs. cel corect (✓/✗ + text), explicație (idee, pași, probă, capcană), rezolvarea completă și „Mai încerc o dată” | feedback eficient pentru 6–8 ani (docs/cercetare.md) |
| 2026-09-11 | T1 rămâne „fără trecere peste ordin”: T1-e08 (28 − 22) și T1-e10 (12 + 6 lei) au numere noi, T1 → versiunea 2; T4-e08 și demo fill reetichetate „cu trecere” | decizia utilizatorului, după feedback-ul extern |
| 2026-09-11 | „Cu / fără trecere” se verifică automat, pe coloane (24 − 18, 7 + 5, 28 + 12, 100 − 50 = cu trecere) | etichetele greșite nu mai pot ajunge în teste |
| 2026-09-11 | Subpunctele a/b/c valorează egal în exercițiu; `weight: 0.5` la alegerile între două variante (T3-e07 b, T4-e09 b) | decizia utilizatorului: ghicitul nu valorează cât un calcul |
| 2026-09-11 | Paleta (`mark`): credit pe element, fără penalizare pentru culoarea greșită; totul de o culoare = 50%, ca la coșuri | credit parțial fără penalizări negative (docs/cercetare.md); formula e documentată în ghid |
| 2026-09-11 | Răspunsurile salvate sunt tratate ca nesigure: evaluarea verifică strict forma (dubluri, bancnote nepermise, bile negative etc.) | feedback extern: răspunsuri malformate luau puncte |
| 2026-09-11 | Rezultatele: rezumatul din încercarea salvată; lista pe exerciții doar pentru aceeași versiune a testului | scorul rămâne cel de pe card chiar dacă testul se schimbă |
| 2026-09-11 | Ciorna apare la „Începe testul” și dispare la trimitere; timpul se numără doar pe exerciții | ciorna „învia” după trimitere; timpii pentru părinți includeau intro-ul și pauzele |
| 2026-09-11 | Slider pe axă: valoarea după poziția degetului pe desen (range ascuns doar pentru tastatură) | input-ul suprapus era nealiniat cu desenul (50 → 38 pe laptop) |
| 2026-09-12 | Rafinare fără refactorizare: un singur limbaj de apăsare (muchie 3D `--sh-edge`, ridicare/apăsare) și un singur stil de „ales” (contur brand; plin doar la A/F și semne) | cererea utilizatorului; feedback vizibil la fiecare atingere pentru un copil de 7–8 ani |
| 2026-09-12 | Mișcare doar pe transform/opacity; reduced-motion zerează și `animation-delay`; JS-ul (confetti, scor) verifică `prefersReducedMotion()`; fără „zdruncinat” la greșeli | ton încurajator; performanță; accesibilitate |
| 2026-09-12 | Desenele animate au grupuri-ancoră fără atribut `transform` (regulă impusă de test) | Chromium strică rotațiile copiilor cu `transform` când grupul are `transform-box` |
| 2026-09-12 | Peisajele se mișcă doar pe intro și pe pauză (și la hover pe card) | subtil, fără cost pe paginile cu multe carduri |
| 2026-09-12 | Sunete discrete sintetizate (WebAudio), pornite implicit, cu buton de oprire în antet; oprite implicit la reduced-motion | decizia utilizatorului; fără fișiere audio |
| 2026-09-12 | Exercițiile doar-text primesc desene din bancă fără versiune nouă (răspunsurile nu se schimbă) | decizia utilizatorului; regula e documentată în ghid |
| 2026-09-12 | Fiecare test durează exact 45 de minute (validatorul refuză altă sumă) | cererea utilizatorului |
| 2026-09-12 | Cronometru discret în player (inel + mm:ss, din timpul lucrat pe exerciții), avertizare calmă la 5 minute, la 0 nu trimite | cererea utilizatorului; înlocuiește decizia „fără cronometru afișat”, dar rămâne fără presiune |
| 2026-09-12 | Istoricul se șterge din „Pentru părinți”: pe test (rezultate), pe secțiune, sau tot (acasă); include ciornele | cererea utilizatorului (părintele curăță încercările de probă) |
| 2026-09-12 | Pagina de început e punctul de plecare: „Continuă testul” (reia de unde a rămas), „Reîncepe de la zero”, „Vezi rezultatele ultimei încercări”; ruta `#/rezultate/<test>/<încercare>` | decizia utilizatorului (feedback nr. 2: istoricul nu era accesibil) |
| 2026-09-12 | Portofelul arată doar numărul de bancnote în timpul rezolvării, la toate exercițiile cu bani; suma apare la rezultate | decizia utilizatorului: suma în timp real dădea răspunsul |
| 2026-09-12 | Răspunsul nu stă la vedere: variante fără pictograma din desen, fără rezultatul altui subpunct, `shuffle` la alegeri fără ordine naturală, semn ales la mersul invers | observația utilizatorului + căutare proprie în T1–T4 (regula e în ghid, secțiunea 6) |
| 2026-09-12 | Conceptele se creditează pe subpunct (`part.concepts`), „Niciun concept nu a rămas sub 70%” | feedback nr. 2: un subpunct greșit trăgea toate conceptele exercițiului la „de exersat” |
| 2026-09-12 | Salvarea răspunde cu succes/eșec: la eșec rezultatul se arată din memorie, ciorna rămâne, plus un mesaj | feedback nr. 2: rezultatul se pierdea când `localStorage` nu scria |
| 2026-09-12 | Text colorat pe tokeni `--c-*-ink` (contrast ≥ 4,5:1, test unitar); fundalurile și bulinele rămân vii | feedback nr. 2: „Ușor” avea 3,06:1 |
| 2026-09-12 | Pauza dintre niveluri sărbătorește doar un nivel terminat; altfel e neutră și spune câte exerciții au rămas | feedback nr. 2 |
| 2026-09-12 | Un desen decorativ nou nu cere versiune; unul cu date (riglă, cofraj, model cu bare) da | feedback nr. 2 (excepția era prea largă); fără mecanism automat |
| 2026-09-12 | Neaplicate, în backlog: săgeți la butoanele radio, explicații vizuale interactive, ceas cu tragere directă, legătura desen–răspuns în validator | funcționalități noi sau over-engineering față de cerere |
| 2026-09-12 | Secțiunea „Numerele de la 0 la 1000” = un singur grup cu 6 teste tematice (corpul și sănătatea apar în fiecare test, T6 e dedicat); grupul „Corpul omenesc” a fost eliminat | decizia utilizatorului |
| 2026-09-12 | Două tipuri noi (`route`: stații atinse în ordine pe hartă; `chart`: bare construite) + reguli de set la `mark`; sarcini deschise cu mai multe soluții verificate prin reguli, probleme în 3+ pași și puzzle-uri la avansat | cererea utilizatorului: pași mulți și gândire creativă, evaluabile automat |
| 2026-09-12 | Harta liniilor e fictivă (Gara, Piața Mare, Teatrul…), orașele și trenurile sunt inventate; graficele cu bare urmează programa (clasa a II-a), pictograma cu legendă 2/5/10 și cercul cu 4 felii egale sunt sprijin, nu obiective | sursele reale se contrazic (metroul), iar programa nu numește pictograma; ½ și ¼ sunt în programă |
| 2026-09-12 | Adunările până la 1000 doar fără trecere sau cu sute rotunde; trecerea peste ordin rămâne în 0–100 | programa spune „fără trecere” la 0–1000 (contradicție cu CS 1.4); U2 va lămuri |
| 2026-09-12 | Agenții se lansează pe rând; pauze la cererea utilizatorului până la resetarea consumului | cererea utilizatorului (consum responsabil) |

## Probleme cunoscute
- Timpii `estMin` sunt estimați; trebuie calibrați cu timpii reali ai copilului (zona „Pentru părinți” de la rezultate).
- Încercările făcute înainte de v0.2.0 își păstrează scorul salvat, dar lista pe exerciții le recalculează cu subpunctele egale
  (poate diferi puțin de scorul din rezumat); la T1 (v2) încercările vechi arată doar rezumatul.
- După publicare, GitHub Pages poate servi ~10 min fișiere vechi (cache).
- T2–T4 au trecut la versiunea 2 (v0.5.0): încercările făcute pe versiunea 1 arată doar rezumatul, fără lista pe exerciții.

## Backlog
- Scanările actuale acoperă manualul până la înmulțire; utilizatorul adaugă scanări noi după finalizarea etapei curente.
- Secțiuni noi după manual: Numerele 0–1000 · Corpul omenesc (U1); Adunarea și scăderea 0–1000 · Pământul (U2); apoi înmulțirea.
- Tipuri noi: balanță interactivă, hotspot pe imagine, calendar, desen/simetrie (traseul și graficul cu bare există din v0.6.0).
- Secțiunea următoare: U2 „Adunarea și scăderea până la 1000 · Pământul” (grupurile din catalog sunt marcate `soon`).
- Variante generate aleator (cu sămânță), diplomă printabilă.
- Amânate la cerere: citire cu voce (TTS), tastatură numerică proprie pe ecran.
- Din feedback-ul nr. 2, neaplicate: săgeți sus/jos la butoanele radio (Tab + Space merg); explicații vizuale interactive
  (evidențieri pas cu pas în desen); ceas și termometru cu tragere directă; validator care leagă desenele cu date de răspunsuri.
- Conturi de utilizator + bază de date (ex. Cloudflare D1 / Supabase) prin înlocuirea `core/storage.js`.
- Publicare automată la push: `gh auth refresh -h github.com -s workflow` + mutarea workflow-ului în `.github/workflows/` + sursa Pages „GitHub Actions”.

## Jurnal de sesiuni
- **2026-09-11** — Analiză scanări + documentare online (programă, EN II, exemple, aplicații). Plan aprobat.
  Implementat M0–M1: schelet, nucleu pur, logica celor 11 tipuri, demo, 14 teste unitare verzi. Docs: curriculum, cercetare.
  M2–M3: design system, pagini, player, rezultate; E2E pe demo trece (100 / 10 / ciornă).
  M4–M7: interfețele celor 11 tipuri (dnd, săgeți, slider, numărătoare, ceas, bani), banca vizuală, emoji locale.
  M8–M9: testele T1–T4 (validate automat: 0 erori), E2E 225 de verificări; ghidul autorului; README și licențe.
  M10: repo public + GitHub Pages (gh-pages); E2E pe site-ul live trece pe laptop, tabletă, telefon. Tag v0.1.0.
  **De făcut data viitoare:** copilul rezolvă testele → notăm timpii reali; utilizatorul aduce scanări noi (după înmulțire).
- **2026-09-11 (a doua sesiune)** — Feedback extern cu 10 probleme, verificate toate (9 confirmate, paleta documentată) + audit
  propriu (ciorna care „învia”, slider nealiniat, router fără jeton, linter care sărea casetele a/b, tastatură, timp, 80%).
  Remediere în 11 pași, fiecare cu teste care pică pe codul vechi: ciornă și stocare (publicat imediat); router + rezultate din
  încercarea salvată; gărzi în evaluare; `m`, `of`, plus unar, `trace`, `moneyCombos` rapid; `cantitate` + catalog `exercises`;
  linter; regula „cu / fără trecere” + T1 v2 + `tools/acoperire.mjs`; subpuncte egale + `weight` + toleranță la praguri;
  slider după poziția degetului + casete de 4 cifre cu lățime egală; tastatură (coș, portofel, ordonare), focus, timp doar pe
  exerciții, paletă cu forme și nume. Revizie independentă a diff-ului: fără defecte. v0.2.0 publicat, E2E live 342/342.
  **De făcut data viitoare:** copilul rezolvă T1–T4 → timpii reali (acum măsoară doar timpul pe exerciții); scanări noi.
- **2026-09-12** — Rafinare grafică/animații/efecte/interactivitate, în 8 etape cu commit și verificări E2E: (1) tokeni și
  limbaj comun de apăsare/„ales”, confetti din CSS, curățenie; (2) `pop()` peste tot, FLIP la ordonare, acele ceasului rotite
  pe loc, bila care cade; (3) bulina face pop, „Mai departe” se anunță, pauza cu iconiță + confetti, peisaje vii; (4) scor
  numărat, stele pe rând, reîncercare sărbătorită, cardul „Rezolvarea”, fundalul ferestrei; (5) sunete cu buton de oprire;
  (6) balanța corectată, chip-uri cu iconițe locale, iconițele secțiunilor, `expectedTag`; (7) 12 exerciții + demo primesc
  desene din bancă, validarea numelor de desene; (8) documentație, v0.3.0. Capcană descoperită experimental și documentată:
  `transform-box` pe elemente cu atribut `transform`. v0.3.0 publicat, E2E pe site-ul live 442/442.
  Apoi, la cerere: durata exact 45 de minute pe test (impusă de validator), ștergerea istoricului pe test / secțiune / tot,
  cronometru discret cu inel care se golește. v0.4.0 publicat, E2E pe site-ul live 475/475.
  **De făcut data viitoare:** copilul rezolvă T1–T4 (ascultă și sunetele la volum mic) → timpii reali; scanări noi.
- **2026-09-12 (a treia sesiune)** — Al doilea feedback extern (10 probleme + 7 sugestii), verificat punct cu punct (toate cele 10
  confirmate; săgețile la radio, explicațiile interactive și ceasul cu tragere lăsate în backlog) + observația utilizatorului că
  răspunsul stă uneori la vedere, extinsă printr-o căutare în T1–T4 și demo (11 situații). Remediere în 8 etape cu commit și E2E:
  (1) `addAttempt` întoarce succesul, încercarea nesalvată rămâne în memorie, ciorna nu se șterge; (2) `part.concepts` + creditare
  pe subpunct; (3) praguri exacte la cronometru (5:00, 0:00), o singură reacție, pauză neutră când rămân exerciții; (4) intro ca
  punct de plecare, lista încercărilor cu rută proprie, ciornele la părinți; (5) etichete din șablon la casete, perechi anunțate
  la unire, focus păstrat la sortare, tokeni `--c-*-ink` cu test de contrast; (6) litere pe carduri la rezultate, reîncercare
  repetată + „refăcut corect”, antet compact pe telefon, doar linia nouă animată la unire; (7) conținut: T4-e01 fără pictograme
  în variante, portofel cu număr de bancnote, T4-e10/T2-e05/T2-e07/T2-e10/T4-e06/T3-e11 refăcute, `shuffle`, explicații corectate,
  „42 de lei” pe etichete (mari acum), T2–T4 v2; (8) documentație, v0.5.0. v0.5.0 publicat, E2E pe site-ul live 541/541.
  **De făcut data viitoare:** copilul rezolvă T1–T4 → timpii reali; scanări noi (după înmulțire).
- **2026-09-12 (a patra sesiune)** — Planificarea și construirea secțiunii „Numerele de la 0 la 1000 · Corpul omenesc”: trei explorări
  (manualul și caietul pagină cu pagină, banca vizuală și tipurile, documentare web: programa, UK/US, transport, bani, corp) și un agent
  de proiectare, lansate pe rând. Decizii: 6 subiecte (cumpărături, oraș, excursie, sondaj, concurs, corp), un singur grup, două tipuri
  noi + reguli de set, totul într-o sesiune. Implementare în 14 commit-uri: concepte + emoji + scene; 14 desene noi; `mark.rules`;
  `route`; `chart`; demo + E2E; T1…T6 (fiecare validat cu `npm test` și E2E pe laptop și telefon, cu capturi privite); documentație,
  v0.6.0. Retușuri pe drum: etichete de preț mai mari și cu font după lungime, bon cu total „?”, tabelul cu variante trecut pe
  rânduri (telefon), emoji „ecran”. v0.6.0 publicat, E2E local 1005/1005 și pe site-ul live 1005/1005.
  **De făcut data viitoare:** copilul rezolvă un test din secțiunea nouă → timpii reali și ce e prea greu; apoi U2.
