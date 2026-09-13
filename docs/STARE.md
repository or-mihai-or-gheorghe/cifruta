# Starea proiectului Cifruța

## Instantaneu
- **Data:** 2026-09-13 · **Versiune:** 0.10.1 (Calcul fulger: temele desfășurate pe pagina jocului)
- **URL live:** https://or-mihai-or-gheorghe.github.io/cifruta/ · **Repo:** https://github.com/or-mihai-or-gheorghe/cifruta (public)
- **Ce funcționează:** site complet: catalog pe secțiuni, player (pagina de început ca punct de plecare: Continuă / Reîncepe de
  la zero / Vezi rezultatele; un exercițiu pe ecran, hartă pe niveluri, ecrane între niveluri, ciornă, cronometru discret),
  rezultate (scor, calificativ, stele, confetti, autoevaluare, zona pentru părinți cu lista încercărilor și concepte pe subpunct,
  revizuire cu explicații, rezolvare, „Mai încerc o dată” repetabil), 13 tipuri de exerciții (cu traseu pe harta liniilor și
  grafic cu bare construit; `mark` cu reguli de set pentru sarcini deschise), banca vizuală (50 de desene: și grafice, pictograme,
  bețișoare, felii, tabele, podium, hartă de linii, indicator, raft, bon, listă, tabel de poziție, cuburi, medalie; 8 peisaje
  animate), sunete discrete cu buton de oprire, atelier pentru autori, jocul **Calcul fulger** (`#/fulger`: teme legate de programă,
  desfășurate pe pagina jocului, fiecare cu trei niveluri; acum „Adunări și scăderi până la 100”, iar numerele până la 1000, înmulțirea, împărțirea și ecuațiile
  simple apar „în curând”; runde de 2 minute, 16 tipuri de întrebări generate, fiecare cu conceptele ei („Ce exersăm”), alune cu bonus de viteză și de serie, Turbo, pistă spre stele și record, 6 medalii, „Greșelile tale” și ținta următoarei stele la rezultate). Conținut: **4 teste de recapitulare a clasei I** (T1–T4 v2)
  și **6 teste tematice „Numerele de la 0 la 1000”** (cumpărături, oraș, excursie, sondaj, concurs sportiv, corpul omenesc), toate
  exercițiile cu desen sau emoji, fără răspunsuri „la vedere”, cu probleme în mai mulți pași și sarcini deschise la avansat.
  **Contul familiei** (v0.9.0, `docs/cloud.md`): părintele intră cu Google și face profiluri de copii (poreclă + avatar, cu acordul
  părintelui); rezultatele profilului care joacă se sincronizează cu Cloud Firestore (coadă cu reîncercări, tranzacții, mutarea
  rezultatelor fără cont); clasament doar pentru cei din cont (Calcul fulger pe temă: pe nivel și totalul temei, săptămâna aceasta
  și tot timpul; stelele de la teste); administrare (blocare, redenumire, ștergeri); pagina de confidențialitate. Fără configurarea Firebase, site-ul arată
  ca în v0.8.1, plus legătura „Confidențialitate” din subsol.
  Calitate: 76 de teste Node (plus validarea conținutului, a tabelului de acoperire, a contrastului și calibrarea stelelor din
  Calcul fulger pe fiecare temă și nivel), 13 teste ale regulilor Firestore pe emulator, E2E 1118 verificări pe 3 ecrane + tastatură
  (plus telefon ținut orizontal și telefon mic) și E2E pentru cont pe emulatoare, cu 59 de verificări (două dispozitive, două file,
  blocare, clasamente pe temă, date vechi din cloud).
- **Următorul pas:** site-ul deschis în contul real (la activare, clasamentele vechi trec pe temă și stelele de la teste revin; verificăm
  apoi în Firestore), pe laptop, telefon și iPad, și documentul `admins/<uid>`.
  În paralel: copilul joacă și rezolvă testele → pragurile și timpii reali. Apoi a doua temă din Calcul fulger (rețeta din
  `CLAUDE.md`), cu super-totalul pe mai multe teme, și secțiunea U2 (Adunarea și scăderea până la 1000 · Pământul).

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
  de set; publicat, E2E local 1005 verificări, pe site-ul live 1003/1005 (2 curse de timp în script, corectate), tag `v0.6.0`
- [x] M16 (v0.6.1): remedierea auditului secțiunii 0–1000: chei și afirmații greșite, explicații contrazise de evaluator, răspunsuri
  vizibile în pași, modele de sănătate, desene ilizibile pe telefon, etichete de concepte, T4 cu numere de trei cifre; validatorul
  prinde casetele repetate și parametrii desenelor; publicat, E2E local 1005/1005 și pe site-ul live 1005/1005, tag `v0.6.1`
- [x] M17 (v0.7.0): nivelul avansat mai greu în toate cele 6 teste, prin mai mulți pași: trasee cu ramuri și lungimi (magazin, oraș cu
  timp la schimbări, drum cu benzinărie, cros cu ștampilă), interpretare de grafice (prețuri cu reduceri, kilometri pe zile, două
  clase, bară greșită față de tabel, ultima probă, pași pe zile), sarcini deschise mai strânse; fracțiile scoase; `route` cu
  `segments`, `transfer`, `maxTotal` și cheie împreună cu reguli; `pie` pe categorii; publicat, E2E local 1005/1005 și pe site-ul live 1005/1005, tag `v0.7.0`
- [x] M18 (v0.8.0): jocul „Calcul fulger” (`#/fulger`): runde de 2 minute pe trei niveluri, 16 tipuri de întrebări generate (adunări,
  scăderi cu și fără trecere, comparări, ordonări), alune cu bonus de viteză în serie, de serie și de precizie, pauza „Hopa” împotriva
  ghicitului, pistă spre stele și record, Turbo, sprint final, numărătoare de arcade, 6 medalii; publicat, E2E local 1082/1082 și pe
  site-ul live 1082/1082, tag `v0.8.0`
- [x] M19 (v0.8.1): recenzia jocului: telefonul ținut orizontal (întrebarea și variantele una lângă alta), arena care umple ecranul,
  sunet deblocat pe iOS, tonuri mai blânde, fără întrebări repetate recent, comparări fără numere banale, accesibilitate (numele
  linkului, titlu în rundă); „Greșelile tale”, ținta următoarei stele, nivelul sugerat, ținta pe panoul de start; publicat, E2E local 1096/1096 și pe
  site-ul live 1096/1096, tag `v0.8.1`
- [x] M20 (v0.9.0): contul familiei: intrare cu Google, profiluri de copii cu acordul părintelui, sincronizarea rezultatelor cu Cloud
  Firestore (coadă, tranzacții, mutarea rezultatelor fără cont), clasament doar pentru cei din cont (Calcul fulger pe nivel și perioadă,
  stelele de la teste), administrare, pagina de confidențialitate; proiectul `primary-school-math` configurat, regulile publicate prin
  API-ul Firebase Rules, clasament fără index compus; E2E local cu configurația reală 1096/1096 și pe site-ul live 1096/1096, tag `v0.9.0`
- [x] M21 (v0.9.1): recenzia reviziei 49b623c, 8 probleme confirmate și reparate: scrierile intră în coadă înainte de pornirea
  sincronizării, blocarea în `blocked/{uid}` (nu se mai anulează prin ștergerea și recrearea contului), stelele din `state/tests`,
  „tot timpul” și săptămâna din `state/fulger`, ieșirea dintr-o filă; T1-e09c, T3-e09, T5-e09 și T3-e10 lămurite; pastila cu cel mai
  bun scor nu mai iese din card. Reguli 12/12 (publicate), E2E cont 49/49, E2E local 1096/1096; publicat, E2E pe site-ul live
  1096/1096, tag `v0.9.1`
- [x] M22 (v0.10.0): Calcul fulger pe teme: lista temelor și hub-ul temei, cu „Ce exersăm” (conceptele din programă, pe fiecare tip de
  întrebare); tema „Adunări și scăderi până la 100” și patru teme „în curând”; recorduri pe „temă:nivel”, normalizate la citire;
  clasamente pe temă și nivel plus totalul temei, cele vechi șterse; rutele vechi redirecționate; stelele încercărilor urcate de
  v0.9.0 revin în clasament. npm test 76/76, reguli 13/13 (publicate), E2E cont 59/59, E2E local 1118/1118; publicat, E2E pe
  site-ul live 1118/1118, tag `v0.10.0`
- [ ] M23 (v0.10.1): pagina Calcul fulger arată temele desfășurate, grupate: panoul temei (titlu, programă, stele și total, explicație,
  „Ce exersăm”, cele trei niveluri) și temele „în curând” la final, fără pagini separate pe temă; `#/fulger/<temă>` derulează la temă.
  npm test 76/76, E2E local 1115/1115

## Catalog
| id | titlu | versiune | status | validat | timp estimat | timp real |
|-|-|-|-|-|-|-|
| recap-c1-t1 | Amintiri din vacanță | 2 | publicat | npm test + E2E | 45 | – |
| recap-c1-t2 | La piață cu bunica | 2 | publicat | npm test + E2E | 45 | – |
| recap-c1-t3 | Călătorie în spațiu | 2 | publicat | npm test + E2E | 45 | – |
| recap-c1-t4 | O zi la fermă | 2 | publicat | npm test + E2E | 45 | – |
| u1-t1 | Lista de cumpărături | 3 | publicat | npm test + E2E | 45 | – |
| u1-t2 | Prin oraș: tramvai, metrou, autobuz | 2 | publicat | npm test + E2E | 45 | – |
| u1-t3 | Excursie cu trenul și cu mașina | 3 | publicat | npm test + E2E | 45 | – |
| u1-t4 | Sondajul clasei | 3 | publicat | npm test + E2E | 45 | – |
| u1-t5 | Concursul sportiv al școlii | 2 | publicat | npm test + E2E | 45 | – |
| u1-t6 | Corpul meu în numere | 3 | publicat | npm test + E2E | 45 | – |

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
| 2026-09-12 | Explicațiile se confruntă cu evaluatorul la limite; enunțul spune limitele interfeței; minimul și maximul strict se scriu explicit | auditul secțiunii 0–1000: erorile erau în explicații și enunțuri, nu în calcule (97 de egalități verificate, 0 greșite) |
| 2026-09-12 | Validatorul refuză casetele repetate și parametrii greșiți ai desenelor cu date (`check`) | caseta dublă din T6-e02 și pictograma cu un singur emoji trecuseră de `npm test` |
| 2026-09-12 | Etichetele `med.*` doar pe exerciții care evaluează cunoștințe; datele de sănătate din povești nu sunt recomandări | raportul pe concepte credita igiena sau organele pentru calcule |
| 2026-09-12 | T4 lucrează și cu numere de trei cifre (cărțile bibliotecii, voturile școlii); totalul curent rămâne ascuns în timpul rezolvării | structura secțiunii; decizia din v0.5.0 (suma afișată pe loc dădea răspunsul) |
| 2026-09-12 | Remedierea se face în loturi mari, cu teste și commit-uri puține | cererea utilizatorului |
| 2026-09-12 | Nivelul avansat devine mai greu prin raționament în mai mulți pași, nu prin materie nouă; în secțiunea 0–1000 fără fracții, înmulțire sau operații cu trecere peste ordin până la 1000 | cererea utilizatorului |
| 2026-09-12 | Traseele au lungimi pe segmente (pași, minute, km, metri), timp la schimbarea liniei și cel mai scurt drum după lungime; cheia se poate combina cu reguli | cererea utilizatorului: trasee cu mai multe ramuri |
| 2026-09-12 | Diagrama circulară se citește fără fracții: felii egale pe categorii, fiecare felie valorează un număr de copii | cererea inițială de diagrame circulare, păstrată fără concepte viitoare |
| 2026-09-13 | Modul „Calcul fulger” (`#/fulger`), separat de teste: runde de 2 minute, nivelul ales de copil (amestec fix de tipuri, ~1 întrebare din 5 de la nivelul anterior), răspunsuri alese dintre variante, sortare prin atingerea plăcilor în ordine | cererea utilizatorului (calcul pe viteză) și răspunsurile lui la cele 4 întrebări de proiectare |
| 2026-09-13 | Punctele se numesc alune: `alunele tipului × viteză × serie`; viteza (×2 fulger, ×1,5 rapid) contează doar în serie; seria ×1,5 / ×2 / ×3 (Turbo) de la 3 / 5 / 10 răspunsuri; +10% / +20% pentru precizie | a doua trecere cerută de utilizator: joc incitant, cu punctajul validat prin simulare |
| 2026-09-13 | Greșeala stinge seria fără să ia alune, cu 1 s de pauză și răspunsul corect la vedere; o greșeală mai rapidă decât cititul (sub 40% din timpul „fulger”, nu la sortări) primește o pauză cât timpul „fulger” | decizia utilizatorului + simularea: doar cu 1 s, atingerile la întâmplare treceau de un copil bun (152 de alune la Avansat) |
| 2026-09-13 | Stelele și recordul se aprind în timpul jocului, pe pistă, fără prag de acuratețe; pragurile (Ușor 30/80/175, Intermediar 35/95/215, Avansat 35/100/235) sunt verificate prin simulare în `tests/fulger.test.js` | stelele nu se mai sting; ghicitul rămâne sub prima stea prin reguli, nu prin pedeapsă |
| 2026-09-13 | Efecte de joc în stilul Cifruța: particule, „+N” care zboară în coș, bannere deasupra cardului, Turbo, sprint final, numărătoare de arcade, medalii; tremur scurt la greșeală doar în joc; nimic trecător la mișcare redusă | cererea utilizatorului: „să fie văzută ca un joc, nu ca un test”; regula „fără zdruncinat” rămâne pentru teste |
| 2026-09-13 | Recenzia jocului (v0.8.1): pe ecrane joase întrebarea și variantele stau una lângă alta; arena umple spațiul de sub antet; sunetul se deblochează la Start și la ridicarea degetului; tonul seriei urcă cel mult o octavă | probe pe ecrane neacoperite de E2E (pe telefonul ținut orizontal variantele ieșeau din ecran) și regulile Safari pe iOS pentru audio |
| 2026-09-13 | O întrebare nu revine printre ultimele 12; la rezultate: „Greșelile tale” (ultimele 5, cu răspunsul corect), ținta următoarei stele, nivelul următor după 3 stele sau cel mai ușor fără nicio stea | 71% din rundele de la Ușor repetau o întrebare; rezultatul să învețe, nu doar să numere (recenzia aprobată de utilizator: „pe toate”) |
| 2026-09-13 | Conturi Google fără restricție de domeniu, după modelul din CS-Foundations-Tools, dar pe site-ul static: Firebase Authentication + Cloud Firestore, cu reguli testate pe emulator (proiect nou `primary-school-math`) | cererea utilizatorului; GitHub Pages nu are server, deci regulile sunt singura barieră |
| 2026-09-13 | Contul e al părintelui, cu profiluri de copii (poreclă + avatar, cel mult 6) și acordul părintelui la primul profil; pagina `#/confidentialitate` | decizia utilizatorului; în România, sub 16 ani e nevoie de acordul părintelui |
| 2026-09-13 | Clasament doar pentru cei intrați în cont: Calcul fulger pe nivel (săptămâna aceasta / tot timpul) și stelele de la teste, doar cu porecla și avatarul; fiecare profil poate ieși din clasament | decizia utilizatorului |
| 2026-09-13 | Rezultatele rămân în `localStorage`, pe profil, iar `cloud/sync.js` le urcă printr-o coadă cu reîncercări, în tranzacții pentru tot ce ține împreună | paginile citesc sincron ca înainte; lecțiile din exemplu (contoare pierdute, succes raportat la eșec, fără tranzacții) |
| 2026-09-13 | Administrare în `#/admin` pentru contul din `admins/{uid}` (creat din consolă, nu un e-mail scris în repo): blocare, redenumire, ștergeri | decizia utilizatorului; repo-ul e public |
| 2026-09-13 | Firebase JS SDK 12.19.0 de pe gstatic, încărcat doar la nevoie: singura excepție de la „fără dependențe la rulare” | fără build; vizitatorii fără cont nu încarcă nimic de la Google |
| 2026-09-13 | Regulile se publică prin API-ul Firebase Rules (`npm run deploy:rules`, cu cheia contului de serviciu); clasamentul ordonează doar după scor pe server, egalitățile în browser | contul de serviciu al Admin SDK nu are dreptul `serviceusage` cerut de `firebase deploy` și nu poate crea indexuri |
| 2026-09-13 | Blocarea stă în `blocked/{uid}`, scris doar de admin | recenzia: un cont blocat își putea șterge și recrea documentul `users/{uid}` fără `blocked` |
| 2026-09-13 | Coada spre cloud se scrie oricând scopul e un profil, și înainte ca Firebase să se încarce; clasamentele se calculează din `state/tests` și `state/fulger` (`best` cu `correct` și `bestStreak`, `week`), cu o aliniere la fiecare activare | recenzia: rezultate pierdute la reconectare, stele greșite pe două dispozitive, record pierdut după ultimele 30 de runde |
| 2026-09-13 | O altă filă află de ieșirea din cont prin evenimentul `storage` și își șterge singură copiile profilurilor | recenzia și diagnosticul: ștergerea făcută de prima filă se pierdea când a doua tocmai scria |
| 2026-09-13 | Enunțurile cer explicit „cel mai scurt drum care…” și scriu restricțiile (fără să treci de două ori prin același raion); fără versiune nouă, pentru că răspunsurile nu se schimbă | recenzia: calcule corecte respinse din cauza unor restricții nespuse |
| 2026-09-13 | Calcul fulger pe teme: fiecare temă are cele 3 niveluri, cu stelele și recordurile ei; conținutul de acum e tema „Adunări și scăderi până la 100”; temele viitoare (numere până la 1000, înmulțirea, împărțirea, ecuații simple) apar „în curând” | cererea utilizatorului: jocuri cu același comportament pentru alte operații și concepte; deciziile lui la cele 4 întrebări |
| 2026-09-13 | Recordurile și cele mai bune runde ale săptămânii au chei „temă:nivel”; datele vechi se normalizează la fiecare citire, fără script de migrare; id-ul rundei nu se schimbă | coada și documentele din cloud rămân valabile; în cloud aproape nu există date |
| 2026-09-13 | Clasamente pe temă și nivel plus totalul temei (`fulger-<temă>-total-<perioadă>`), scrise în aceeași tranzacție; `fulger-total-<perioadă>` rămâne rezervat pentru super-total; clasamentele vechi ies din lista profilului și se șterg | decizia utilizatorului: totaluri pe temă acum, un super-total pe mai multe teme mai târziu, fără migrare |
| 2026-09-13 | Medaliile rămân comune; „Campionul” = 3 stele la toate nivelurile unei teme; fiecare temă și fiecare tip de întrebare poartă conceptele din programă („Ce exersăm”), iar etichetele „fără / cu trecere” se verifică pe întrebările generate | decizia utilizatorului; programa ca bază pentru temele viitoare |
| 2026-09-13 | La publicare, regulile Firestore înaintea site-ului; temele jucabile stau și în `fulgerTopics()` din reguli, iar un test le compară cu datele | regulile vechi ar refuza rundele cu temă |
| 2026-09-13 | Un `state/tests` lipsă se reface din încercările din browser (la activare și la următoarea încercare); unul existent rămâne sursa, deci ce s-a șters de pe alt dispozitiv nu reapare | v0.9.1 socotea 0 stele fără document și a șters o intrare reală din clasamentul stelelor; încercările urcate de v0.9.0 erau în cloud |
| 2026-09-13 | Temele stau desfășurate pe pagina Calcul fulger, grupate (panou cu titlu, programă, stele și total, explicație, „Ce exersăm”, nivelurile), cu temele „în curând” la final; fără card spre o pagină a temei; `#/fulger/<temă>` rămâne adresă (rezultate, clasament, „Ieși din joc”), dar derulează la temă | cererea utilizatorului |

## Probleme cunoscute
- Timpii `estMin` sunt estimați; trebuie calibrați cu timpii reali ai copilului (zona „Pentru părinți” de la rezultate).
- Încercările făcute înainte de v0.2.0 își păstrează scorul salvat, dar lista pe exerciții le recalculează cu subpunctele egale
  (poate diferi puțin de scorul din rezumat); la T1 (v2) încercările vechi arată doar rezumatul.
- După publicare, GitHub Pages poate servi ~10 min fișiere vechi (cache).
- T2–T4 au trecut la versiunea 2 (v0.5.0): încercările făcute pe versiunea 1 arată doar rezumatul, fără lista pe exerciții.
- Testele u1-t1, u1-t3, u1-t4 și u1-t6 au trecut la versiunea 2 (v0.6.1), cu același efect pentru încercările făcute înainte.
- În v0.7.0 toate cele 6 teste ale secțiunii 0–1000 au primit o versiune nouă: încercările mai vechi arată doar rezumatul.
- Sunetul din Calcul fulger pe iPhone/iPad e deblocat după regulile Safari, dar nu a fost verificat pe un dispozitiv real.
- Intrarea reală cu Google a mers (în producție există un cont cu un profil, încercări și o rundă); de încercat pe toate dispozitivele
  (laptop, telefon, iPad). Dacă popup-ul e blocat des pe telefoane, varianta e Firebase Hosting cu login prin redirect.
- În limitele regulilor, un client priceput poate trimite un scor inventat în clasament (fără Cloud Functions nu se verifică pe
  server); există moderarea din `#/admin`.
- Calcul fulger păstrează ultimele 30 de runde pentru toate temele împreună: când apar teme noi, istoricul pe temă se subțiază
  (recordurile rămân); se revede la a doua temă.

## Backlog
- Scanările actuale acoperă manualul până la înmulțire; utilizatorul adaugă scanări noi după finalizarea etapei curente.
- Secțiuni noi după manual: Numerele 0–1000 · Corpul omenesc (U1); Adunarea și scăderea 0–1000 · Pământul (U2); apoi înmulțirea.
- Tipuri noi: balanță interactivă, hotspot pe imagine, calendar, desen/simetrie (traseul și graficul cu bare există din v0.6.0).
- Secțiunea următoare: U2 „Adunarea și scăderea până la 1000 · Pământul” (grupurile din catalog sunt marcate `soon`).
- Din auditul secțiunii 0–1000, neaplicate: condiția încălcată evidențiată la verificare, schimbările de linie marcate pe traseu,
  indicii treptate, pașii unei probleme afișați pe rând, animații legate de operație (gruparea din 5 în 5, simbolul care se desface,
  deplasarea pe axă).
- Variante generate aleator (cu sămânță), diplomă printabilă.
- Calcul fulger, mai departe: temele „în curând” (numere până la 1000, înmulțirea, împărțirea, ecuații □ + 7 = 15) și super-totalul
  pe mai multe teme (`fulger-total-<perioadă>`, rezervat), răspuns tastat, antrenament
  fără cronometru, magazinul Cifruței (accesorii pentru mascotă cumpărate cu alune), provocarea zilei, vibrații pe tabletă, nivel
  adaptiv; pragurile de stele și timpii „fulger” se ajustează după runde reale.
- Amânate la cerere: citire cu voce (TTS), tastatură numerică proprie pe ecran.
- Din feedback-ul nr. 2, neaplicate: săgeți sus/jos la butoanele radio (Tab + Space merg); explicații vizuale interactive
  (evidențieri pas cu pas în desen); ceas și termometru cu tragere directă; validator care leagă desenele cu date de răspunsuri.
- Contul familiei, mai departe: App Check (reCAPTCHA) împotriva scorurilor trimise din afara site-ului; istoricul clasamentelor pe
  săptămâni; schimbarea profilului care joacă cu un PIN al părintelui; Firebase Hosting cu login prin redirect, dacă popup-ul e blocat des.
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
  rânduri (telefon), emoji „ecran”. v0.6.0 publicat: E2E local 1005/1005; pe site-ul live 1003/1005 la prima rulare — cele două
  eșecuri erau o cursă de timp în scriptul E2E (clicul pe „Vezi” citea scorul paginii vechi cât se încărca de pe rețea încercarea
  cerută), corectată; fluxul rerulat pe live: 32/32.
  **De făcut data viitoare:** copilul rezolvă un test din secțiunea nouă → timpii reali și ce e prea greu; apoi U2.
- **2026-09-12 (a cincea sesiune)** — Un audit extern al secțiunii 0–1000 (66 de exerciții) a găsit 10 probleme și 5 ambiguități,
  toate verificate pe conținut, evaluatori și desene și confirmate, plus două constatări proprii (feedback gol în T1-e07, creșterea
  de 3 cm pe an din T6-e06). Remediere într-un singur lot, la cererea utilizatorului: chei și afirmații greșite, explicații care
  contraziceau evaluatorul la limite, răspunsuri vizibile în pași, modele de sănătate, desene ilizibile pe telefon, etichete de
  concepte, T4 cu numere de trei cifre, validator pentru casete repetate și parametrii desenelor. Rezerve păstrate: fără total
  curent în timpul rezolvării; indiciile și animațiile propuse merg în backlog. v0.6.1 publicat. E2E local 1005/1005; pe site-ul
  live 1005/1005, adunat din trei rulări (332 laptop, 331 telefon, 342 tabletă și tastatură), pentru că rețeaua mașinii
  de test s-a schimbat de două ori în timpul rulării (`ERR_NETWORK_CHANGED`); erorile de rețea nu au venit din site. Verificarea
  peisajului din pagina secțiunii nu mai oprește suita când un desen nu s-a încărcat.
  **De făcut data viitoare:** copilul rezolvă un test din secțiunea nouă → timpii reali și ce e prea greu; apoi U2.
- **2026-09-12 (a șasea sesiune)** — La cererea utilizatorului, nivelul avansat din toate cele 6 teste ale secțiunii 0–1000 a devenit
  mai greu prin raționament în mai mulți pași, fără concepte viitoare: trasee cu mai multe ramuri și lungimi (magazin, oraș cu timp la
  schimbări, drum cu benzinărie, cros cu ștampilă), interpretare de grafice (prețuri cu reduceri, kilometri pe zile, două clase, bară
  greșită față de tabel, ultima probă, pași pe zile) și sarcini deschise mai strânse. Fracțiile au ieșit (T4, T6); diagrama circulară
  se citește prin felii care valorează un număr. Cod: `route` cu segmente, timp de schimbare, `maxTotal`, cheie cu reguli și etichete
  mutabile pe segment; `pie` pe categorii; inel de evidențiere mai mic. Lucrul s-a făcut în bucăți mici, după o limită de ieșire atinsă.
  v0.7.0 publicat, E2E local 1005/1005 și pe site-ul live 1005/1005.
  **De făcut data viitoare:** copilul rezolvă un test avansat din secțiunea nouă → timpii reali (7 minute pe exercițiu?) și ce e prea greu; apoi U2.
- **2026-09-13 (a șaptea sesiune)** — Planificarea și construirea jocului „Calcul fulger”, la cererea utilizatorului (calcul pe viteză).
  Patru întrebări de proiectare (amestec fix pe nivel, 1 s de pauză la greșeală, sortare prin atingeri, 2 minute), apoi o a doua trecere
  cerută de utilizator („să fie văzută ca un joc, nu ca un test”): repere din jocuri asemănătoare (Times Tables Rock Stars, Hit the
  Button), din cercetarea despre calculul cronometrat și din „game feel”, plus o simulare a punctajului pe profiluri de copii. Simularea
  a arătat că doar pauza de 1 s lăsa atingerile la întâmplare peste un copil bun; au intrat viteza doar în serie, pauza „Hopa” și
  bonusul de precizie, iar stelele se aprind în timpul jocului, pe pistă. Implementare: motor pur și testat (16 generatoare pe 500 de
  semințe, calibrarea stelelor cu motorul real), arena cu efecte, hub, rezultate, medalii, sunete noi, desenul alunelor; capturi pe
  laptop și telefon, cu retușuri (bannerele deasupra cardului, cardul de pe pagina principală, medaliile pe un rând, rezultatele
  fără goluri în timpul numărătorii). npm test 55/55; v0.8.0 publicat, E2E local 1082/1082 și pe site-ul live 1082/1082.
  **De făcut data viitoare:** copilul joacă o rundă pe fiecare nivel → ajustăm pragurile de stele și timpii „fulger”; apoi U2.
- **2026-09-13 (a șaptea sesiune, continuare)** — Recenzia jocului, la cererea utilizatorului: citirea codului, probe pe ecrane neacoperite
  de E2E (telefon ținut orizontal, telefon mic, tabletă verticală), scenarii rare (rundă fără răspunsuri, record depășit, medalii multiple,
  tab ascuns, plecare din rundă) și analiza întrebărilor generate. 9 erori (variantele ieșeau din ecran pe telefonul ținut orizontal,
  derulare de 10 px pe telefoane mici, sunet probabil blocat pe iOS, tonuri stridente, întrebări repetate, comparări cu 0, indiciul de
  precizie, numele linkului și titlul lipsă, reluarea cu tab-ul ascuns) și 6 îmbunătățiri („Greșelile tale”, nivelul sugerat, ținta
  următoarei stele, cifrele tastelor ascunse pe tactil, E2E pe ecrane joase, subtitlul logoului pe telefoane foarte mici), aplicate
  într-un singur lot. npm test 55/55; v0.8.1 publicat, E2E local 1096/1096 și pe site-ul live 1096/1096.
  **De făcut data viitoare:** copilul joacă o rundă pe fiecare nivel (și pe iPad, pentru sunet) → ajustăm pragurile; apoi U2.
- **2026-09-13 (a opta sesiune)** — Conturi, rezultate în cloud și clasament, la cererea utilizatorului, după modelul din
  CS-Foundations-Tools (citit, nemodificat): intrare cu Google fără restricție de domeniu, un proiect Firebase nou (`primary-school-math`),
  clasament vizibil doar pentru cei din cont. Patru decizii ale utilizatorului (contul părintelui cu profiluri de copii, clasament la
  Calcul fulger și la teste, doar porecla, pagină de administrare) și o a doua trecere pe plan. Pe un site static, regulile Firestore
  sunt singura barieră, deci întâi regulile și testele lor pe emulator (cu un JDK 21 portabil), apoi stocarea pe profil (`setScope`,
  `onWrite`), sesiunea sincronă, contul, sincronizarea cu coadă și tranzacții, pagina contului, clasamentul, administrarea și
  confidențialitatea. E2E nou pe emulatoare (`tools/e2e_cloud.py`): cont, două dispozitive, ieșire, telefon, ștergeri, clasamentul văzut
  de doi părinți, adminul. Găsite pe drum: ștergerea unei intrări care nu mai există era refuzată de reguli (verificarea se făcea după
  conținut, acum după id), `replaceChildren(null)` scria „null” în pagină, iar antetul nu mai încăpea pe telefon cu clasamentul și
  avatarul. Consola Firebase nu era încă pregătită (verificat cu contul de serviciu, doar citiri). npm test 70/70, reguli 11/11,
  E2E cont 45/45, E2E local 1096/1096.
  **De făcut data viitoare:** utilizatorul face pașii din consola Firebase → `PRODUCTION`, `npm run deploy:rules`, `npm run deploy`,
  verificarea cu un cont real și `admins/<uid>`, tag `v0.9.0`; copilul joacă Calcul fulger → pragurile.
- **2026-09-13 (a opta sesiune, continuare)** — Configurația reală (aplicația web „Cifruța” din `primary-school-math`), regulile publicate
  prin API-ul Firebase Rules (`firebase deploy` cere un drept pe care contul de serviciu nu îl are), clasament fără index compus; v0.9.0
  publicat, E2E pe site-ul live 1096/1096. O recenzie a reviziei 49b623c a găsit 8 probleme, toate confirmate: rezultatele scrise înainte
  de pornirea sincronizării se pierdeau la reconectare, blocarea se putea anula prin recrearea contului, stelele erau greșite pe două
  dispozitive, recordul „tot timpul” se pierdea după 30 de runde, o filă scria în profilul ieșit din cont, iar patru enunțuri sau
  explicații erau ambigue (T1-e09c, T3-e09, T5-e09, T3-e10). Plus două observații ale utilizatorului: timpul de rezolvare (se păstra deja;
  acum verificat și în E2E) și pastila cu cel mai bun scor, care ieșea din card. Pe drum, E2E-ul a arătat că ștergerea făcută de o filă se
  pierde când cealaltă tocmai scrie (reparat prin evenimentul `storage`), iar un pas prea rapid lovea limita de 5 s a clasamentului; o
  ipoteză greșită despre `getAfter` a fost verificată cu un diagnostic și retrasă. npm test 72/72, reguli 12/12 (publicate), E2E cont
  49/49, E2E local 1096/1096.
  **De făcut data viitoare:** verificarea cu un cont real; planul pentru Calcul fulger pe teme (cerut de utilizator).
- **2026-09-13 (a opta sesiune, a doua continuare)** — Calcul fulger pe teme, la cererea utilizatorului: mai târziu vor veni numere
  mai mari, înmulțirea, împărțirea și ecuații simple, cu același joc. Patru decizii ale lui (temă → 3 niveluri, conținutul de acum ca o
  singură temă, clasamente pe temă și nivel plus totalul temei, cu loc pentru un super-total, medalii comune) și un plan aprobat.
  Implementare: temele în date, conceptele pe fiecare tip de întrebare (etichetele „fără / cu trecere” verificate pe 500 de semințe),
  chei „temă:nivel” normalizate la fiecare citire (`fulger/records.js`), lista temelor, hub-ul temei cu „Ce exersăm”, rutele vechi
  redirecționate, pastile pe teme pe pagina principală; în cloud, totalul temei în aceeași tranzacție cu nivelurile, clasamentele vechi
  scoase din profil și șterse (și la redenumire), regulile cu temele și totalurile, plus un test care compară temele din reguli cu
  datele. Pe drum: după o reîncărcare, `__cloud.flush()` din E2E nu aștepta conectarea, iar scrierile de test prin REST se ciocneau cu
  tranzacția în curs (400); iconița „Serii” din „Cum se joacă” se micșora lângă textul lung (eroare mai veche). O recenzie independentă
  a diferențelor (reguli, migrare, versiuni amestecate, rute, teste) nu a găsit probleme. O citire din producție, doar a formei datelor,
  fără valori personale, a arătat un profil cu date din v0.9.0: record fără serie și fără săptămână. Intrarea „tot timpul” își ia acum
  seria din runda recordului, cu un test pe forma aceasta. După prima publicare (regulile, apoi site-ul), a doua citire din producție a
  arătat că intrarea din `teste-stele` dispăruse încă de dinainte: la 16:48, cu v0.9.1, browserul contului nu găsise `state/tests`
  (încercările urcaseră cu v0.9.0) și socotise 0 stele. Încercările erau în cloud; acum un `state/tests` lipsă se reface din încercările
  din browser (E2E pe emulatoare cu aceeași stare), publicată din nou. npm test 76/76, reguli 13/13, E2E cont 59/59, E2E local
  1118/1118; v0.10.0 publicat, E2E pe site-ul live 1118/1118. Datele din producție trec pe teme la prima activare a contului.
  **De făcut data viitoare:** după o vizită în cont, verificăm în Firestore clasamentele pe temă și stelele; copilul joacă → pragurile;
  a doua temă și super-totalul.
- **2026-09-13 (a opta sesiune, a treia continuare)** — La cererea utilizatorului, temele stau desfășurate pe pagina Calcul fulger, grupate,
  în loc de carduri spre o pagină a temei: fiecare temă de jucat într-un panou cu titlul, programa, stelele și totalul, explicația, „Ce
  exersăm” și cele trei niveluri; temele „în curând” la final, în două coloane. `#/fulger/<temă>` rămâne adresă (rezultate, clasament,
  „Ieși din joc”) și derulează la temă; la capturi, derularea ieșea dublată (un `scroll-margin` peste `scroll-padding`-ul din bază).
  Măsurat între 320 și 1440 px: nivelurile stau câte trei pe rând de la ~1000 px, cu stelele lângă pastila „Intermediar”, fără depășiri;
  exemplul „□ + 7 = 15” nu se mai rupe pe două rânduri. npm test 76/76, E2E local 1115/1115 (verificările paginii separate a temei au
  fost înlocuite cu cele ale panoului și ale derulării).
  **De făcut data viitoare:** vizita în cont și verificarea în Firestore; copilul joacă → pragurile; a doua temă și super-totalul.
