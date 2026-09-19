# Curriculum — harta conceptelor

> Documentul de referință pentru **ce** exersăm în Cifruța. ID-urile de concepte din acest fișier sunt aceleași ca în
> `site/data/concepts.js` și în câmpul `concepts: [...]` al fiecărui exercițiu. Actualizat: 11 septembrie 2026.

## Scop

Site-ul ajută un copil de clasa a II-a să recapituleze și să avanseze la „Matematică și explorarea mediului” (MEM).
Harta de mai jos pornește de la exemplele din manual și din caietul auxiliar (scanările locale), le verifică față de
programa oficială și de standardele de evaluare și le îmbogățește cu concepte utile pentru gândirea critică. Fiecare
exercițiu primește etichete de concept, ca să putem arăta acum „ce mai exersăm” și, mai târziu (conturi + bază de date),
evoluția pe fiecare concept.

## Surse

**Documente oficiale**
- Programa școlară MEM, clasa pregătitoare, clasa I și clasa a II-a — OMEN 3418/19.03.2013 (încă în vigoare):
  https://www.edums.ro/invprimar/25_Matematica_explorarea_mediului_CP_II_OMEN.pdf
- Lista RoCNEE a planurilor-cadru și programelor pentru primar:
  https://rocnee.eu/index.php/dcee-oriz/curriculum-oriz/programe-scolare-front/planuri-cadru-de-invatamant-si-programe-scolare-invatamant-primar
- Standardele naționale de evaluare, Anexa 28 (MEM I–II, Matematică III–IV), OMEC 4.615/2026, obligatorii din 2026–2027:
  https://rocnee.eu/images/rocnee/fisiere/examene/2026/standarde/Anexa%2028.%20Standarde%20na%C8%9Bionale%20de%20evaluare_Matematic%C4%83%20%C8%99i%20explorarea%20mediului%20I-II-a%20Matematic%C4%83%20III-IV.pdf
  (anunț: https://www.edupedu.ro/oficial-standardele-nationale-de-evaluare-pentru-clasele-i-viii-care-se-aplica-din-anul-scolar-2026-2027-pentru-evaluarea-la-clasa-si-examenele-nationale/ și
  https://www.edu.ro/press_rel_49_26_conspub_standarde_primar_gimnazial)
- Anexa 2 — documentul de politică educațională (nivelurile de performanță):
  https://rocnee.eu/images/rocnee/fisiere/examene/2026/standarde/Anexa_2_Document_de_politica_educationala.pdf
- Evaluarea Națională la finalul clasei a II-a (EN II), MEM:
  - test 2025: https://cdn.edupedu.ro/wp-content/uploads/2025/05/EN_II_2025_Matematica_si_explorarea_mediului_Test_Lb_romana.pdf
  - test 2026: https://tribunainvatamantului.ro/wp-content/uploads/2026/05/EN_II_2026_Matematica_si_Explorarea_mediului_Lb_romana_Test.pdf
  - model 2026: https://cdn.edupedu.ro/wp-content/uploads/2026/04/EN_II_2026_Matematica_si_Explorarea_mediului_Test.pdf
- Metodologia evaluărilor naționale II/IV/VI, OMEC 6.405/23.09.2025:
  https://rocnee.eu/images/rocnee/fisiere/examene/0246/Metodologie_de_organizare_si_desfasurare_a_evaluarilor_nationale_de_la_finalul_claselor_a_II-a_a_IV-a_si_a_VI-a.htm
  și https://legislatie.just.ro/Public/DetaliiDocument/302475
- ROFUIP, OME 5726/2024 (evaluarea la clasă, calificative):
  https://www.edu.ro/sites/default/files/_fi%C8%99iere/Legislatie/2024/OME_5726_2024_ROFUIP.pdf
- Scrisoarea metodică pentru învățământul primar 2024–2025, ISJ Ialomița (evaluarea inițială):
  https://www.isjialomita.ro/files/inv_primar/SCRISOARE%20METODIC%C4%82_INV%C4%82%C8%9A%C4%82M%C3%82NT%20PRIMAR_2024_2025.pdf

**Scanări locale (ignorate de git, în `_surse/`)**
- `_surse/manual-mem-2.pdf` — manualul MEM clasa a II-a: Recapitularea clasei I, U1, U2 (42 de pagini PDF).
  Numerotarea PDF diferă de cea tipărită: **pagina tipărită ≈ pagina PDF + 4** (ex. pagina PDF 3 = pagina 7,
  pagina PDF 9 = pagina 13). Corespondența e aproximativă și se verifică înainte de a cita o pagină.
- `_surse/caiet-auxiliar-mem-2.pdf` — caietul auxiliar MEM clasa a II-a, capitolele 1–5 (41 de pagini PDF). Numerele
  tipărite nu se văd în scanare; citează capitolul și pagina PDF.

Ce altă documentare am folosit (exemple de exerciții, aplicații, UX): `docs/cercetare.md`.

## Marcaje

- Clasa din programă: **(CP)** clasa pregătitoare · **(I)** clasa I · **(II)** clasa a II-a.
- Proveniență: 📘 văzut în scanări · 📜 cerut de programă/standarde · ➕ îmbogățire.
- `mat.x.y` / `med.x.y` = ID-ul conceptului în `site/data/concepts.js` (doar la conceptele pe care le folosim deja sau
  pe care le-am pregătit pentru secțiunile următoare).

---

## Harta de concepte

### 1. Numere naturale

| Concept | Clasa | Proveniență | ID |
|-|-|-|-|
| Formarea numerelor din zeci și unități, descompunerea (arbore) | I | 📘📜 | `mat.nr100.formare` |
| Citirea și scrierea cu cifre până la 100 | I | 📘📜 | `mat.nr100.citire-scriere` |
| Compararea (<, >, =) | I | 📘📜 | `mat.nr100.comparare` |
| Ordonarea crescătoare / descrescătoare | I | 📘📜 | `mat.nr100.ordonare` |
| Numere pare și impare | I | 📘📜 | `mat.nr100.paritate` |
| Vecinii unui număr (predecesor, succesor) | I | 📘📜 | `mat.nr100.vecini` |
| Numere consecutive | I | 📘 | `mat.nr100.consecutive` |
| Șiruri cu regulă (+1, +2, +5, +10, descrescătoare) | I | 📘📜 | `mat.nr100.siruri` |
| Axa numerelor: poziționare, estimări | I | 📘📜 | `mat.nr100.axa` |
| Rotunjirea la zeci (activitate în clasa I) | I | 📘📜 | `mat.nr100.rotunjire` |
| Numere care îndeplinesc condiții („cel mai mare număr mai mic decât 80”, cifre identice), intervale | I | 📘📜 | `mat.nr100.conditii` |
| Valoarea cifrei după loc (40 și 4) | I | ➕ | `mat.nr100.valoare-pozitionala` |
| Estimare („cam câte?”) | I | 📜➕ | `mat.nr100.estimare` |
| „Prietenii lui 10 / 100” | I | ➕ | `mat.nr100.prietenii-lui-10` |
| Numărare din 2/5/10 și adunare repetată — pregătirea înmulțirii (competența 1.5) | I | 📜➕ | `mat.nr100.adunare-repetata` |
| Regula unei corespondențe (3 → 7) | I | 📜➕ | — |
| Numere 0–1000: sute, zeci, unități | II | 📘📜 | `mat.nr1000.formare` |
| Scrierea numerelor cu litere | II | 📘📜 | `mat.nr1000.citire-scriere` |
| Compararea, ordonarea, paritatea până la 1000 | II | 📘📜 | `mat.nr1000.comparare`, `mat.nr1000.ordonare`, `mat.nr1000.paritate` |
| Rotunjirea la sute | II | 📘📜 | `mat.nr1000.rotunjire` |
| Răsturnatul unui număr (nu e în programă — doar opțional) | II | 📘 | `mat.nr1000.rasturnat` |

### 2. Adunare și scădere

| Concept | Clasa | Proveniență | ID |
|-|-|-|-|
| Adunări și scăderi 0–100 **fără** trecere peste ordin | I | 📘📜 | `mat.op.fara-trecere` |
| Adunări și scăderi 0–100 **cu** trecere peste ordin | I | 📘📜 | `mat.op.cu-trecere` |
| Proprietăți folosite fără denumire (schimbarea ordinii, gruparea, 0) | I | 📘📜 | `mat.op.proprietati` |
| Termenul necunoscut (inclusiv ascuns sub simboluri) | I | 📘📜 | `mat.op.necunoscut` |
| Semnul „=” ca balanță (metoda balanței: 8 + 4 = □ + 5) | I | 📜➕ | `mat.op.balanta` |
| Proba (operația inversă) | I | 📘📜 | `mat.op.proba` |
| Lanțuri de operații | I | 📘 | `mat.op.lanturi` |
| Semne lipsă (+ sau −) | I | 📘 | `mat.op.semne` |
| Compararea expresiilor fără calcul (23 + 16 □ 16 + 23) | I | 📘📜 | `mat.op.comparare-expresii` |
| „Găsește greșeala” („Cine s-a grăbit și a greșit?”) | I | 📘➕ | `mat.op.greseala` |
| Strategii de calcul mental: completare la 10 (8 + 5 = 8 + 2 + 3), compensare (29 + 14 = 30 + 14 − 1) | I | ➕ | `mat.op.strategii` |
| Familii de operații (7 + 5, 5 + 7, 12 − 5, 12 − 7) | I | ➕ | `mat.op.familii` |
| Termeni: termen, sumă, total, diferență | I | 📜 | `mat.op.terminologie` |
| Descăzut, scăzător; reconstituirea calculelor cu cifre lipsă | II | 📘📜 | `mat.op1000.reconstituire` |
| Adunări și scăderi 0–1000 fără / cu trecere | II | 📘📜 | `mat.op1000.fara-trecere`, `mat.op1000.cu-trecere` |
| Înmulțirea și împărțirea (adunare / scădere repetată) | II | 📜 | `mat.op.inmultire`, `mat.op.impartire` |

### 3. Rezolvarea problemelor

| Concept | Clasa | Proveniență | ID |
|-|-|-|-|
| Probleme cu o operație | I | 📘📜 | `mat.pb.o-operatie` |
| Probleme cu două operații (+ și/sau −) | I | 📘📜 | `mat.pb.doua-operatii` |
| „Cu … mai mult / cu … mai puțin” | I | 📘 | `mat.pb.mai-mult-mai-putin` |
| Rezolvare în mai multe moduri | I | 📘📜 | `mat.pb.doua-moduri` |
| Rezolvare cu plan (Ce știm? / Ce aflăm? / Rezolvare / Verificare) | I | 📘 | `mat.pb.plan` |
| „Mă gândesc la un număr” — mersul invers | I | 📘➕ | `mat.pb.mersul-invers` |
| Capcana de limbaj („are 18, cu 2 mai puține decât Vlad” → adunăm) | I | ➕ | `mat.pb.capcana-limbaj` |
| Buget și decizii argumentate („Da/Nu, pentru că…”, format EN II) | I | 📜 | `mat.pb.decizie` |
| Date în plus și date lipsă; „e realist răspunsul?”; soluții deschise | I | ➕ | `mat.pb.date-lipsa` |
| Compunerea și schimbarea problemelor; date din tabel | I | 📘📜 | `mat.pb.compunere` |

### 4. Geometrie și orientare în spațiu

| Concept | Clasa | Proveniență | ID |
|-|-|-|-|
| Poziții: în, pe, deasupra, dedesubt, lângă, în față, în spate, stânga, dreapta; orizontal / vertical / oblic | I | 📜 | `mat.geo.pozitii` |
| Interior / exterior / frontieră; rând / coloană | I | 📜 | `mat.geo.interior-exterior` |
| Pătrat, dreptunghi, triunghi, cerc | I | 📘📜 | `mat.geo.figuri` |
| Cub, cuboid, cilindru, sferă (fețe: formă, număr) | I | 📘📜 | `mat.geo.corpuri` |
| Desen pe rețea după condiții; trasee cu săgeți ↑→↓← | I | 📜➕ | `mat.geo.trasee` |
| Numărarea figurilor în desene compuse (apare și în recapitularea din manual) | II | 📘📜 | `mat.geo.numarare-figuri` |
| Axa de simetrie, semicerc, con, desfășurări | II | 📜 | `mat.geo.simetrie` |
| Compunerea figurilor din piese (tangram, piesa care lipsește) | II | 📜 | `mat.geo.compunere` |
| Figuri rotite și figuri în oglindă (Jocuri fulger) | II | ➕ | `mat.geo.rotire` |
| Desfășurarea cubului, a cuboidului, a cilindrului și a conului | II | 📜 | `mat.geo.desfasurari` |
| Coordonate (rând, coloană) | II | 📜 | `mat.geo.coordonate` |
| Hărți de linii: stații, schimbarea liniei, drumul cel mai scurt în minute (Jocuri fulger) | II | ➕ | `mat.geo.harta-linii` |

### 5. Măsurări, timp și bani

| Concept | Clasa | Proveniență | ID |
|-|-|-|-|
| Alegerea unității potrivite | I | 📘📜 | `mat.mas.unitati` |
| Centimetrul și rigla (1 m = 100 cm); unități nonstandard (palma, pasul) | I | 📜 | `mat.mas.lungime` |
| Litrul, vasul gradat, unități nonstandard | I | 📘📜 | `mat.mas.capacitate` |
| Ora fixă și jumătatea de oră; ceas cu ace și electronic | I | 📘📜 | `mat.mas.ceas` |
| Durata activităților | I | 📘📜 | `mat.mas.durata` |
| Ziua, săptămâna, luna (28–31 de zile), anul | I | 📘📜 | `mat.mas.calendar` |
| Termometrul (activitate: înregistrarea temperaturii) | I | 📜➕ | `mat.mas.termometru` |
| Banii: 1 leu = 100 de bani; bancnote 1, 5, 10, 50, 100 lei; monede 1, 5, 10, 50 de bani; rest; schimburi echivalente | I | 📘📜 | `mat.mas.bani` |
| „Îmi ajung banii?”; plata cu cele mai puține bancnote | I | 📜➕ | `mat.mas.buget` |
| Metrul, milimetrul, mililitrul, kilogramul, gramul | II | 📜 | `mat.mas.masa` |
| Minute (60, 5), sfertul de oră | II | 📜 | `mat.mas.minute` |
| Bancnotele de 200 și 500 de lei, euro | II | 📜 | — |

Notă: bancnota de **20 de lei** circulă din 2021, dar programa din 2013 nu o listează. O folosim în contexte reale
(e bani adevărați pe care copilul îi vede), fără să fie obligatorie.

### 6. Date și logică

| Concept | Clasa | Proveniență | ID |
|-|-|-|-|
| Tabele: colectare, citire, înregistrare; date cu simboluri/desene | I | 📘📜 | `mat.log.tabel` |
| Clasificare după unul sau două criterii | I | 📜 | `mat.log.clasificare` |
| „și”, „sau”, „nu” | I | 📜 | `mat.log.si-sau-nu` |
| Regularități și modele (repetitive, crescătoare) | I | 📜 | `mat.log.modele` |
| Afirmații adevărate / false | I | 📘 | `mat.log.adevarat-fals` |
| Ghicitori cu numere („Cine sunt eu?”), intrusul | I | 📘➕ | `mat.log.ghicitori` |
| Simboluri cu valori (🍎 + 🍎 = 40) | I | 📘 | `mat.log.simboluri` |
| Ordonare după indicii („înainte / după / imediat după”); „toți / unii / niciunul” | I | ➕ | `mat.log.ordonare-indicii` |
| „Ce s-ar întâmpla dacă…?” | I | 📜 | — |
| Grafice cu bare (conținut), diagrama Venn | II | 📜 | `mat.log.grafic-bare`, `mat.log.venn` |
| Analogii cu figuri (A → B, C → ?) și tabele 3 × 3 cu reguli (Jocuri fulger) | II | ➕ | `mat.log.analogii` |
| Cercul cu felii egale, fiecare felie valorează un număr, fără fracții (Jocuri fulger) | II | ➕ | `mat.log.diagrama-cerc` |
| Grafice în timp, cu una sau două serii, pe zilele săptămânii sau pe date (Jocuri fulger) | II | ➕ | `mat.log.grafic-linie` |
| Arbori: ramuri, alegeri, sume, clasificări cu da / nu (Jocuri fulger) | II | ➕ | `mat.log.arbori` |
| Rețele și turnee: puncte legate prin linii, prieteni comuni, cine a câștigat (Jocuri fulger) | II | ➕ | `mat.log.retele` |

### 7. Explorarea mediului

| Concept | Clasa | Proveniență | ID |
|-|-|-|-|
| Simțurile | CP | 📜 | `med.corp.simturi` |
| Igiena și sănătatea | CP | 📘📜 | `med.corp.igiena` |
| De ce au nevoie plantele (apă, aer, lumină, sol) | CP | 📘📜 | `med.plante.nevoi` |
| Pământul, Soarele și Luna | CP | 📘📜 | `med.pamant-soare-luna` |
| Anotimpurile; zile, luni | CP | 📜 | `med.anotimpuri` |
| Animale domestice și sălbatice | CP | 📘➕ | `med.animale.domestice-salbatice` |
| Scheletul și organele majore (creier, inimă, plămâni, stomac, rinichi) la om și la animale | I | 📘📜 | `med.corp.organe` |
| Părțile plantei și rolul lor | I | 📘📜 | `med.plante.parti` |
| Transformările apei (înghețare, topire, evaporare, fierbere, condensare) | I | 📜 | `med.apa.transformari` |
| Soarele — sursă de lumină și căldură | I | 📜 | `med.soare` |
| Forme de energie (lumină, căldură, electricitate) | I | 📜 | `med.energie.forme` |
| Surse de energie: Soarele, apa, vântul (nu se termină) · cărbunii, petrolul (se termină); economisirea energiei | I | 📘📜 | `med.energie.surse` |
| Căderea liberă | I | 📜 | `med.caderea-libera` |
| Producerea și propagarea sunetelor | I | 📜 | `med.sunete` |
| Reutilizarea materialelor | I | 📜 | `med.reutilizare` |
| Alimentația sănătoasă, boli provocate de virusuri | II | 📘📜 | `med.alimentatie`, `med.sanatate.virusuri` |
| Pământul: uscat, apă, atmosferă; relief | II | 📘📜 | `med.pamant.alcatuire`, `med.relief` |
| Medii de viață, nevoi de bază, reproducere | II | 📜 | `med.medii-de-viata` |
| Planetele, succesiunea zi–noapte | II | 📘📜 | `med.planete` |
| Magneții, conductorii | II | 📜 | `med.magneti` |

Conceptele (II) de explorarea mediului rămân pentru secțiunile viitoare și nu intră în testele de recapitulare.

---

## Niveluri de dificultate

| În site (termenii părintelui) | Standardele naționale 2026 (Anexa 28) | Ce înseamnă în practică |
|-|-|-|
| **ușor** | De bază | cu sprijin vizual, un singur pas, numere mici, fără trecere peste ordin |
| **intermediar** | Consolidat | cu trecere peste ordin, relații, tabele, reprezentări de citit |
| **avansat** | Avansat | mai mulți pași, verificarea rezultatului, justificare, capcane de gândire |

Exemplu din standarde, competența 1.4, clasa I: *de bază* = fără trecere, cu sprijin; *consolidat* = cu trecere;
*avansat* = ambele, „verificând rezultatul”. Nivelurile de performanță din Anexa 2 (A Avansat, B Consolidat, C De bază,
D1 În formare, D2 În dificultate) nu au o corespondență oficială cu FB/B/S/I; în site folosim punctaj + calificativ
(ca în caietul auxiliar), iar corespondența de mai sus rămâne în date pentru rapoartele viitoare.

## Progresia din manual (baza secțiunilor viitoare)

| Pagini tipărite | Pagini PDF | Unitate / lecție | Teme |
|-|-|-|-|
| 7–9 | 3–5 | **Amintiri din vacanță** — Recapitularea cunoștințelor din clasa I | numere 0–100, +/− până la 100, organe, plante, figuri, măsurări, bani, ceas, corpuri |
| 10 | 6 | Evaluare inițială — „Ce știm? Cât știm?” | șiruri, pare/impare, calcule, egalități, problemă cu bani |
| 11 | 7 | **Unitatea 1 — „Toți copiii învață”** | Numerele naturale 0–1000 · Corpul omenesc |
| 12–13 | 8–9 | Numerele 0–100: formare, citire, scriere, comparare, ordonare | cod secret prin ordonare |
| 14–16 | 10–12 | Numerele de la 100 la 1000: formare, citire, scriere | cuburi de 1/10/100, numărătoarea S-Z-U, pare/impare |
| 17 | 13 | Corpul omenesc. Menținerea stării de sănătate | piramida alimentelor, cauzele îmbolnăvirilor |
| 18–21 | 14–17 | Compararea și ordonarea numerelor până la 1000 | tabel cu vânzări, rotunjire la sute pe axă |
| 22 | 18 | Boli provocate de virusuri — prevenție și tratare | igienă, vaccinare |
| 23–25 | 19–21 | Repetăm ce am învățat · Evaluare U1 | calificative FB/B/S, „Mă evaluez singur!” |
| 26 | 22 | Proiect „Numerele în viața mea” · Ne jucăm, învățăm | secvențe lipsă |
| 27 | 23 | **Unitatea 2 — „Pământul, Planeta Albastră”** | Adunarea și scăderea 0–1000 · Pământul, relief |
| 28–31 | 24–27 | Adunarea fără și cu trecere peste ordinul unităților | numărătoare, grupare, cod secret |
| 32–33 | 28–29 | Pământul: uscat, apă, atmosferă | experimente cu aerul |
| 34–37 | 30–33 | Scăderea fără trecere; scăderea cu împrumut la ordinul zecilor | proba prin adunare, reconstituiri |
| 38–39 | 34–35 | Forme de relief: munți, dealuri, câmpii | grafic de altitudine, plante și animale de munte |
| 40–41 | 36–37 | Scăderea — operația inversă adunării · Aflarea numărului necunoscut | balanța |
| 42–43 | 38–39 | Probleme care se rezolvă prin adunare și scădere | plan de rezolvare, două moduri |
| 44–46 | 40–42 | Repetăm ce am învățat · Evaluare U2 | relief, necunoscute, probleme |

**Caietul auxiliar** (pagini PDF): Cap. 1 Recapitulare clasa I (1–2) · Teste inițiale (3–4) · Cap. 2 Numerele 0–100
(5–9: formare, pare/impare, comparare, ordonare, rotunjire) · teste (10–11) · Cap. 3 +/− 0–100 fără și cu trecere
(12–16) · teste (17–18) · Cap. 4 Numerele 100–1000 (19–23) · teste (24–25) · Cap. 5 +/− 0–1000 fără și cu trecere,
termen necunoscut, probleme (26–39) · teste (40–41). Testele de evaluare au 10 p pe item + 10 p din oficiu:
S 50–70, B 70–90, FB 90–100.

## Tabel de acoperire: teste × concepte

<!-- acoperire:start -->
T1 „Amintiri din vacanță” · T2 „La piață cu bunica” · T3 „Călătorie în spațiu” · T4 „O zi la fermă” · T5 „Lista de cumpărături” · T6 „Prin oraș: tramvai, metrou, autobuz” · T7 „Excursie cu trenul și cu mașina” · T8 „Sondajul clasei” · T9 „Concursul sportiv al școlii” · T10 „Corpul meu în numere”.
Numărul este al exercițiului în test. Tabelul se generează din etichetele testelor cu `npm run acoperire`;
nu îl edita de mână.

| Concept | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
|-|-|-|-|-|-|-|-|-|-|-|
| `mat.nr100.formare` | 2 | 1 | — | 3 | — | — | — | — | — | — |
| `mat.nr100.comparare` | 5, 6 | — | 3, 5 | — | — | 10 | — | 8, 9, 10 | — | 2, 10 |
| `mat.nr100.ordonare` | 5 | — | 5 | — | — | — | — | — | — | — |
| `mat.nr100.paritate` | 1, 11 | — | — | — | — | — | — | — | — | — |
| `mat.nr100.vecini` | 3, 11 | — | — | — | — | — | — | — | — | — |
| `mat.nr100.siruri` | — | — | 1 | — | — | — | — | — | — | — |
| `mat.nr100.axa` | — | — | 7 | — | — | — | — | — | — | — |
| `mat.nr100.rotunjire` | — | — | 7 | — | — | — | — | — | — | — |
| `mat.nr100.conditii` | 11 | — | — | — | — | — | — | — | — | 11 |
| `mat.nr100.valoare-pozitionala` | 2 | — | — | 3 | — | — | — | — | — | — |
| `mat.nr100.estimare` | — | — | 7 | — | — | — | — | — | — | — |
| `mat.nr100.adunare-repetata` | — | 1 | — | — | — | — | — | 1, 5, 8 | 8 | — |
| `mat.nr1000.formare` (II) | — | — | — | — | 1 | 3, 11 | — | — | 1 | 1 |
| `mat.nr1000.citire-scriere` (II) | — | — | — | — | 2 | 3 | — | 2 | 1 | 1 |
| `mat.nr1000.comparare` (II) | — | — | — | — | 3, 8, 10, 11 | 7, 8, 11 | 2, 6, 10, 11 | 6 | 2, 3, 5, 10 | 5, 9 |
| `mat.nr1000.ordonare` (II) | — | — | — | — | 8 | 8 | 6 | — | 3, 11 | 5 |
| `mat.nr1000.paritate` (II) | — | — | — | — | — | 2 | — | 3 | 5 | 3 |
| `mat.nr1000.rotunjire` (II) | — | — | — | — | 5 | — | 2 | 6 | — | 6 |
| `mat.nr1000.rasturnat` (II) | — | — | — | — | — | 8 | — | — | 11 | — |
| `mat.nr1000.vecini` (II) | — | — | — | — | — | 11 | — | — | 11 | — |
| `mat.nr1000.consecutive` (II) | — | — | — | — | — | 11 | 3 | — | — | — |
| `mat.nr1000.siruri` (II) | — | — | — | — | — | — | 3 | — | — | 6 |
| `mat.nr1000.axa` (II) | — | — | — | — | 5 | — | 5 | — | — | 6 |
| `mat.nr1000.conditii` (II) | — | — | — | — | 3 | 11 | — | — | 5, 11 | — |
| `mat.nr1000.valoare-pozitionala` (II) | — | — | — | — | 1 | 3 | — | 2 | 1 | 1 |
| `mat.op.fara-trecere` | 4, 8, 10 | — | — | — | — | — | — | 11 | — | 2, 7 |
| `mat.op.cu-trecere` | — | 3, 5, 7, 9 | 9 | 5, 8 | 9 | 6, 7, 9 | 9 | 9 | — | 11 |
| `mat.op.proprietati` | 6 | — | — | — | — | — | — | — | — | — |
| `mat.op.necunoscut` | — | 11 | 6 | — | — | — | — | — | — | — |
| `mat.op.balanta` | — | — | 6 | — | — | — | — | — | — | — |
| `mat.op.proba` | — | — | 6 | 6 | — | — | — | — | — | — |
| `mat.op.lanturi` | — | — | 9 | — | — | 6 | — | — | — | — |
| `mat.op.semne` | — | — | — | 8 | — | — | — | — | — | — |
| `mat.op.comparare-expresii` | 6 | — | — | — | — | — | — | — | — | — |
| `mat.op.greseala` | — | 5 | — | — | — | — | — | 11 | — | — |
| `mat.op.strategii` | — | 3 | — | — | — | — | — | — | — | — |
| `mat.op.familii` | — | — | — | 6 | — | — | — | — | — | — |
| `mat.op1000.fara-trecere` (II) | — | — | — | — | 6, 7, 10 | — | 8, 10 | 6 | 7, 9, 10 | 9 |
| `mat.pb.o-operatie` | 9, 10 | — | — | — | — | — | — | — | — | — |
| `mat.pb.doua-operatii` | — | 9, 10 | — | 9 | 9, 10, 11 | 9 | 8, 9, 10 | 7, 9 | 9, 10 | 9 |
| `mat.pb.mai-mult-mai-putin` | 8, 9 | 7 | — | 5, 9 | — | — | — | 6 | 7 | — |
| `mat.pb.doua-moduri` | — | 10 | — | — | — | — | — | — | — | — |
| `mat.pb.mersul-invers` | — | — | 9, 11 | — | — | — | — | — | — | 11 |
| `mat.pb.capcana-limbaj` | — | — | — | 9 | — | — | — | — | — | — |
| `mat.pb.decizie` | 9 | — | — | 10 | 6, 9, 10, 11 | 5, 9, 10 | 9 | 11 | 9, 10 | — |
| `mat.pb.plan` | — | 10 | — | — | — | — | — | — | — | — |
| `mat.pb.date-lipsa` | — | — | — | — | — | — | 11 | 10 | — | 10 |
| `mat.geo.figuri` | — | — | 2, 10 | — | — | — | — | — | — | — |
| `mat.geo.corpuri` | — | — | 8 | — | — | — | — | — | — | — |
| `mat.geo.numarare-figuri` (II) | — | — | 10 | — | — | — | — | — | — | — |
| `mat.geo.pozitii` | — | — | — | 1 | — | — | — | — | — | — |
| `mat.geo.trasee` | — | — | — | — | 9 | 1, 5, 9, 10 | 9 | — | 9 | — |
| `mat.mas.unitati` | — | 2 | — | — | — | — | — | — | — | — |
| `mat.mas.lungime` | — | 2 | — | — | — | — | — | — | 7, 9 | 5 |
| `mat.mas.termometru` | 8 | — | — | — | — | — | — | — | — | — |
| `mat.mas.ceas` | — | 8 | — | — | — | — | 1 | — | — | — |
| `mat.mas.durata` | — | 8 | — | — | — | — | 1, 7 | — | — | — |
| `mat.mas.calendar` | — | — | — | 4 | — | — | — | — | — | — |
| `mat.mas.bani` | 10 | 9 | — | 10 | 7 | 7 | — | — | — | — |
| `mat.mas.buget` | — | — | — | 10 | 6, 11 | — | — | — | — | — |
| `mat.mas.minute` (II) | — | — | — | — | — | 9, 10 | 1, 7 | — | — | — |
| `mat.mas.bani-mari` (II) | — | — | — | — | 7 | — | — | — | — | — |
| `mat.mas.distanta` (II) | — | — | — | — | — | — | 2, 6, 8, 9, 10, 11 | — | — | — |
| `mat.mas.orar` (II) | — | — | — | — | — | — | 1, 7 | — | — | — |
| `mat.log.tabel` | — | 7 | — | 5 | — | 7 | 7 | 1, 11 | 2, 6 | 7 |
| `mat.log.grafic-bare` (II) | — | — | — | — | 10 | — | 10 | 6, 7, 9, 10, 11 | 6, 10 | 7, 9, 10 |
| `mat.log.pictograma` (II) | — | — | — | — | — | — | — | 5, 8 | 8 | — |
| `mat.log.ghicitori` | 11 | — | — | — | — | 11 | — | — | 11 | 11 |
| `mat.log.simboluri` | — | 11 | — | — | — | — | — | — | — | — |
| `mat.log.ordonare-indicii` | — | — | — | 11 | — | — | — | — | — | — |
| `mat.log.clasificare` | — | 6 | 8 | 2 | — | — | — | — | — | 8 |
| `mat.log.si-sau-nu` | — | — | 3 | — | — | — | — | — | — | — |
| `mat.log.modele` | — | — | 1 | — | — | — | — | — | — | — |
| `med.corp.organe` | 7 | — | — | — | — | — | — | — | 4 | 9 |
| `med.corp.igiena` | — | — | — | — | — | — | — | — | — | 3 |
| `med.corp.miscare-odihna` (II) | — | — | — | — | — | 4 | — | 4 | 4 | — |
| `med.plante.parti` | — | 4, 6 | — | — | — | — | — | — | — | — |
| `med.plante.nevoi` | — | 4 | — | — | — | — | — | — | — | — |
| `med.soare` | — | — | 4 | — | — | — | — | — | — | — |
| `med.apa.transformari` | — | — | 4 | — | — | — | — | — | — | — |
| `med.pamant-soare-luna` | — | — | 4 | — | — | — | — | — | — | — |
| `med.animale.domestice-salbatice` | — | — | — | 2 | — | — | — | — | — | — |
| `med.energie.surse` | — | — | — | 7 | — | — | — | — | — | — |
| `med.anotimpuri` | — | — | — | 4 | — | — | — | — | — | — |
| `med.alimentatie` (II) | — | — | — | — | 4 | — | 4 | — | — | 8 |
| `med.sanatate.virusuri` (II) | — | — | — | — | — | — | — | — | — | 4 |

**Neacoperite încă (clasa pregătitoare și clasa I), candidate pentru testele următoare:** `mat.nr100.citire-scriere`, `mat.nr100.consecutive`, `mat.nr100.prietenii-lui-10`, `mat.op.terminologie`, `mat.pb.compunere`, `mat.geo.interior-exterior`, `mat.mas.capacitate`, `mat.log.adevarat-fals`, `med.corp.simturi`, `med.energie.forme`, `med.caderea-libera`, `med.sunete`, `med.reutilizare`.
<!-- acoperire:end -->

## Formatul EN II, pe scurt

- **45 de minute**; corectat de doi evaluatori; rezultatele nu se trec în catalog; din 2024–2025 se dau puncte, nu coduri.
- **O temă din viața de zi cu zi** cu un **tabel de date**: „Medii de viață” (2025), „Animale de companie” (2026),
  „Flori de primăvară” (model 2026).
- **12–18 itemi, 100 de puncte**; punctajul crește cu dificultatea (alegere/răspuns scurt 3–5 p, calcule scrise 6–20 p,
  decizii justificate 8–20 p).
- **Formate:** semn de relație în casetă; alegere A–D („Încercuiește litera”); răspuns dintr-un cuvânt; „Scrie, pe
  spațiul dat, rezolvarea”; „Verifică… prin operația inversă”; metodă impusă („prin adunare repetată de termeni
  egali”); „Da, pentru că… / Nu, pentru că…”.
- **Ce preluăm în Cifruța:** fiecare test are o poveste din viața reală, un tabel, itemi cu punctaj crescător pe
  niveluri, probă prin operația inversă și cel puțin o decizie argumentată.
