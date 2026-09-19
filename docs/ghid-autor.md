# Ghidul autorului — cum adaug teste și exerciții în Cifruța

Ghidul explică tot ce trebuie pentru un test nou. Exemple vii: `site/data/demo.js` (câte un exemplu din fiecare tip,
vizibil în site la `#/atelier/tipuri`) și cele 4 teste din `site/data/tests/recap-c1/`.

## 1. Rețeta pentru un test nou

1. Alege grupul din `site/data/catalog.js` (sau adaugă o secțiune / un grup nou).
2. Creează fișierul `site/data/tests/<grup>/tN-nume-scurt.js` (nu îl numi `test-*.js`).
3. Scrie testul după schema de mai jos: **11 exerciții = 4 ușor + 4 intermediar + 3 avansat**, total **exact 45 de minute**,
   o poveste din viața reală, 1–2 exerciții de explorarea mediului.
4. Etichetează fiecare exercițiu cu ID-uri din `site/data/concepts.js` (adaugă concepte noi acolo, cu `grade`,
   `competencies`, `source`).
5. Adaugă intrarea în catalog: `{ id, file, version, theme, title, subtitle, estMin, exercises }` (`estMin` = suma
   exercițiilor, `exercises` = câte exerciții are testul; ambele sunt verificate).
6. Rulează `npm run acoperire` (actualizează tabelul teste × concepte din `docs/curriculum.md`), apoi `npm test` până e
   verde (schemă, răspunsuri recalculate, unicitate, durată, diacritice, etichete „cu / fără trecere”).
7. Rulează `npm run e2e` (sau `python3 tools/e2e.py --only <id> --shots`) și privește capturile din `test-results/`.
8. Actualizează `docs/STARE.md` (catalog + jurnal) și fă commit.

**Modifici un test deja publicat?** Crește `version` în test **și** în catalog — ciornele vechi ale copiilor sunt ignorate,
iar rezultatele vechi își păstrează scorul (fără lista pe exerciții, care nu s-ar mai potrivi cu testul nou).
**Excepție:** dacă adaugi sau schimbi doar un desen **decorativ** (peisaj, suport pentru numere, mascotă), versiunea rămâne —
răspunsurile, id-urile și ciornele nu sunt afectate. Desenele **cu date** (riglă, cofraj, numărătoare, termometru, axă, model cu
bare, țarcuri) fac parte din enunț: dacă le schimbi numerele sau conținutul, crește versiunea.

## 2. Schema

```js
export default {
  schema: 1, id: 'recap-c1-t1', version: 1,
  theme: 'mare' | 'piata' | 'spatiu' | 'ferma',       // culoarea de accent + peisajul de pe card
  title: 'Amintiri din vacanță', subtitle: '…',
  story: 'Povestea citită de mascotă la începutul testului.',
  exercises: [ /* exerciții */ ],
};
```

**Exercițiu:** `{ id, level: 'usor'|'intermediar'|'avansat', estMin, points?, concepts: [...], title, context?, parts | (câmpurile unei singure părți), explain }`
- `context: { text, visual?, size?: 'lg' }` — povestea exercițiului (desenul mare cu `size: 'lg'`). Desene se pot pune și pe
  subpunct (`part.visual`, deasupra casetelor), pe elemente (`itemVisual` pentru toate, `item.visual` pentru unul), pe coșuri
  (`bin.visual`) și pe perechi (`left/right[].visual`); numele se verifică la `npm test`. Fiecare exercițiu ar trebui să aibă
  măcar un desen sau un emoji — vezi exemplele din `site/data/demo.js`.
- `parts: [{ id: 'a', type, prompt, visual?, …câmpurile tipului }]` — subpunctele a), b), c). Dacă exercițiul are o
  singură parte, câmpurile ei se scriu direct pe exercițiu (forma scurtă).
- `part.concepts` (opțional, subset din conceptele exercițiului): când subpunctele exersează concepte diferite (a) citește
  termometrul, b) scade), raportul pentru părinți creditează fiecare subpunct separat. Fiecare concept al exercițiului trebuie
  să apară pe cel puțin un subpunct (validatorul verifică).
- `points` lipsește de obicei: implicit 2 / 3 / 4 după nivel. Scorul: 10 din oficiu + 90 × puncte obținute / total.
- **Subpunctele valorează egal** în exercițiu, oricâte casete ar avea fiecare (a) cu 5 casete și b) cu o alegere: câte
  jumătate). Pentru o alegere între **două** variante, unde ghicitul e ușor, pune `weight: 0.5` pe subpunct
  (T3-e07 b, T4-e09 b). Implicit `weight` e 1.
- `explain: { idea, steps: [...], check?, trap? }` — apare la rezultate, în „De ce? Cum rezolvăm”; `idea` este și
  indiciul de la „Mai încerc o dată”.

## 3. Tipurile de exerciții

| Tip | Câmpuri principale | Răspuns salvat |
|-|-|-|
| `choice` | `items: [{ id, q?, options: ['50', …] \| [{ id, text, visual?, emoji? }], correct, multi?, calc?, feedback? }]`, `style: 'circles'`, `shuffle` (amestecă variantele; `shuffle: false` pe un element le lasă în ordine) | `{ itemId: optionId }` |
| `truefalse` | `items: [{ id, text, answer: true\|false, why? }]` | `{ itemId: bool }` |
| `fill` | `layout`, `rows` / `trees` / `chains` / `head`, `blanks`, `checks?` (vezi mai jos) | `{ blankId: valoare }` |
| `slider` | `skin: 'line'\|'thermometer'`, `min, max, step`, `ticks: { minor, major?, labels? }`, `unit?`, `items: [{ id, label, answer, tolerance? }]` | `{ itemId: număr }` |
| `match` | `left: [{ id, text, visual?, calc?, feedback? }]`, `right: [{ id, text?, label?, visual?, calc? }]`, `key: { leftId: rightId }` | `{ leftId: rightId }` |
| `order` | `items: [{ id, text, tag?, emoji? }]`, `direction: 'asc'\|'desc'` sau `key` + `constraints`, `itemVisual?`, `reveal: { word }` | `[id, …]` |
| `categorize` | `bins: [{ id, label, visual? }]`, `items: [{ id, text, emoji?, visual?, bin }]` | `{ itemId: binId }` |
| `mark` | `items: [{ id, n? , text?, visual? }]`, `itemVisual?`, `rule` sau `key`; cu paletă: `palette: [{ id: 'verde', label }]` + `item.color`; **sarcină deschisă:** `rules: { count?: n \| {min,max}, sum?: {min,max} (pe `item.n`), include?, exclude?, noun?: ['produs','produse'], unit?: 'lei' }` — orice selecție bună ia tot creditul | `[id, …]` sau `{ id: culoare }` |
| `build` | `tool: 'abacus'`, `places: ['Z','U']` (sau `['S','Z','U']`), `items: [{ id, label, target }]` | `{ itemId: { Z, U } }` |
| `clock` | `step: 30`, `items: [{ id, label?, answer: { h, m } }]` | `{ itemId: { h, m } }` |
| `money` | `allowed: [1, 5, 10, 20, 50]`, `target`, `items: [{ id, label }]`, `distinct?` (feluri diferite), `fewest?` (cele mai puține bancnote) | `{ itemId: { '10': 1, '1': 2 } }` |
| `route` | `map: { w, h, stops: [{ id, label, x, y, side? }], lines: [{ id, label, color: 'rosie'\|'albastra'\|'verde'\|'gri'\|…, stops: [ids] }], segments?: [{ a, b, n, at? }], unit?: 'pași'\|'minute'\|'km'\|'metri', transfer?: 4 }` (definită o dată în fișier; cu `segments`, lungimea drumului e suma segmentelor plus `transfer` la fiecare schimbare de linie), `from`, `to`, `rules?: { via?, avoid?, maxStops?, maxChanges?, maxTotal?, lines? }`, `key?: [ids]` (singurul cel mai scurt dintre drumurile care respectă `rules`; alt drum bun ia jumătate). Pentru drumuri de mașină sau poteci, fiecare drum e o linie cu două stații, `color: 'gri'`. | `[stopId, …]` |
| `chart` | `categories: [{ id, label, emoji? }]`, `max`, `step` (1/2/5/10), `key: { id: valoare }` (credit pe bară; fără 0) sau `rules: [{ rule: 'total', value }, { rule: 'more'\|'equal', a, b }, { rule: 'most'\|'least', a }, { rule: 'range', a, min?, max? }, { rule: 'each', min?, max? }]`, `given?: { id: valoare }` (bare gata desenate, blocate) | `{ id: valoare }` |

### `fill` în detaliu
- **Layout-uri:** `inline` (`rows: ['27 + 42 = [[a]]', …]`), `steps` (rânduri cu `label`, pentru probleme cu plan),
  `table` (`head` + `rows` de celule), `tree` (`trees: [{ top, left, right }]`, `labels: ['zeci','unități']`),
  `chain` (`chains: [{ start, steps: [{ op: '+18', out: '[[a]]' }] }]`).
- **Casete:** `number` (implicit: `answer` sau `expr: '38 + 7'`), `relation` (<, =, > — se deduc singure din rând),
  `sign` (`answer: '+'|'−'`; validatorul cere o singură variantă corectă), `select` (`options`, `answer`),
  `text` (`answer`, `accept`, `ignoreDiacritics`).
- **Verificări automate:** rândurile formate doar din numere și semne se verifică singure. Pentru rânduri cu cuvinte
  sau emoji scrie `calc` (`{ t: '7 zeci [[b]] 70', calc: '70 [[b]] 70' }`) sau adaugă `checks: ['26 + 35 = [[a]]']`.
  `calc: false` oprește verificarea unui rând.
- **Ghicitori:** `search: { from, to, rules: [...], pick: 'unique'|'max'|'min' }` — validatorul caută toate numerele
  și confirmă că răspunsul e cel corect și unic. Reguli: `equals`, `oneOf`, `range {min,max,inclusive}`,
  `parity {even}`, `digitsDistinct`, `digitCount`, `digitSum`, `holds {expr}`, `all`, `any`, `not`. În `holds`, `n` e
  numărul, iar `u`, `z`, `s`, `m` sunt **cifrele** unităților, zecilor, sutelor și miilor (1000 → `m = 1`, `s = 0`).
  Cu `of: 'n'`, regula (și regulile din `all`/`any`/`not`) se aplică pe acel câmp al elementului.
- **Adunări:** la `[[a]] + [[b]] = …` termenii sunt acceptați în orice ordine.
- **Mesaj țintit:** `feedback: [{ if: 35, text: '8 + 7 = 15: nu uita zecea nouă!' }]` pe casetă (sau pe item la
  `choice`/`match`).
- **Lățimea casetelor:** toate casetele numerice ale unui subpunct au aceeași lățime (după cel mai lung răspuns), ca
  lățimea să nu trădeze răspunsul; se pot scrie până la 4 cifre.
- **Cititorul de ecran** aude fiecare casetă cu șablonul ei („Căsuță: 40 + 8 = …”; în tabel, capul rândului și al coloanei;
  în arbore, „zeci din 47”). `blank.label` înlocuiește eticheta automată când e nevoie.
- **O casetă apare o singură dată** în șabloane (validatorul verifică); o relație între casete se scrie în `checks`.

### Etichetele „cu / fără trecere peste ordin”
- Definiția, pe coloane: la **adunare** e cu trecere dacă suma cifrelor unei coloane e cel puțin 10 (7 + 5, 28 + 12);
  la **scădere**, dacă o cifră a descăzutului e mai mică decât cifra scăzătorului de pe aceeași coloană (24 − 18, 100 − 50).
- Validatorul urmărește toate adunările și scăderile din `fill` (rândurile verificate, `checks`, `expr`, cu răspunsurile
  puse în casete, inclusiv calculele intermediare: 45 − 15 − 12 conține 30 − 12), `choice` (`calc`) și `match` (`calc`).
- `mat.op.cu-trecere` / `mat.op1000.cu-trecere` cer cel puțin un calcul cu trecere; `mat.op.fara-trecere` /
  `mat.op1000.fara-trecere` (fără eticheta „cu trecere”) nu permit niciunul. Un exercițiu mixt le poate avea pe amândouă.
- Etichetează „cu / fără trecere” doar exercițiile în care **calculul e scopul**. Dacă într-o problemă de raționament calculul e
  întâmplător, nu pune eticheta: altfel greșeala de raționament ar apărea la părinți ca „de exersat: cu trecere”.

### Creditul parțial, pe scurt
- Majoritatea tipurilor dau credit pe element (casetă, afirmație, pereche, element sortat).
- `choice` multiplu: (variante corecte alese − variante greșite alese) / variante corecte, minim 0.
- `mark` cu o culoare: (atinse corect − atinse greșit) / câte trebuiau atinse, minim 0.
- `mark` cu paletă: (colorate corect − colorate deși nu trebuiau) / câte trebuiau colorate, minim 0. Cu două culori
  folosite la fel de des, totul colorat cu aceeași culoare dă 50%, exact ca la sortarea în coșuri, unde totul pus într-un
  singur coș dă tot 50%. O culoare greșită pe un element care trebuia colorat nu primește punct, dar nici nu scade în
  plus: credit parțial fără penalizări negative (`docs/cercetare.md`, „Credit parțial”).
- `order`: elementele din cel mai lung subșir aflat deja în ordine; `money` cu `distinct`: fiecare fel diferit.

## 4. Mini-markup (în orice text)
`**tare**` · `==evidențiat==` · `\n` rând nou · `{{e:mar}}` emoji (lista în `site/js/visuals/emoji.js`) ·
`{{v:star n=47}}` desen mic în text · `{{s:3}} {{z:4}} {{u:7}}` jetoane pentru sute / zeci / unități.
HTML nu este permis (se afișează ca text).

## 5. Banca vizuală (`visual: { v: 'nume', …parametri }`)
- **Suporturi pentru numere:** `shell` · `star` · `flower {color}` · `suitcase {tag}` · `apple {color}` · `leaf` · `balloon {color}` · `planet {color}` · `rocket` · `basket {label}` · `tag {n, unit}` · `medal {n, rank}` — toate cu `n`.
- **Date și grafice:** `bar-chart {labels, values, emojis?, step, max?, hide?, numbers?}` · `pictogram {labels, values, emoji, each, unit}` · `tally {labels, values}` · `pie {slices, filled, labels?}` sau `pie {groups: '3,2,2,1', names}` (felii egale colorate pe categorii, cu legendă fără numere) · `data-table {head: 'A|B', rows: 'x|1;y|2', highlight?}` · `podium {names, values?}`.
- **Oraș și transport:** `route-map {stops, lines, segments?, unit?, path?, from?, to?, w, h}` (`segment.at` mută eticheta de lungime pe segment, departe de numele stațiilor) (liste de obiecte → doar din date, nu din `{{v:}}`) · `signpost {label, n, unit}`.
- **Magazin:** `shelf {products: 'minge:120,carte:60'}` · `receipt {title, lines: 'Ghete|230,Rucsac|128', total?}` (`total` poate fi greșit intenționat sau `'?'`) · `note-list {title, lines, checked?}`.
- **Unelte:** `abacus {places, S, Z, U}` · `egg-carton {full, loose}` · `ten-frame {n}` · `number-line {min, max, minor, labels, marker, icon}` (`icon` = orice emoji) · `thermometer {min, max, minor, major, value}` · `ruler {length, from, to}` · `clock {h, m}` · `balance {left, right}` · `bar-model {parts, total}` · `place-value {s, z, u}` (cifră sau `?`) · `base-ten {n}` (plăci de 100, bare de 10, cuburi).
- **Bani:** `banknote {value: 1|5|10|20|50|100|200|500}` · `coin {value: 1|5|10|50}` (bani).
- **Geometrie:** `shape {name: triunghi|patrat|dreptunghi|cerc}` · `solid {name: cub|cuboid|cilindru|sfera|con}` · `rocket-shapes` · `triangle-fan {cuts}` · `square-grid {n}`.
- **Natură și corp:** `organ {name: inima|plamanii|creierul|stomacul|rinichii}` · `plant` · `vegetable {name: morcov|ridiche|sfecla|salata|spanac|varza|rosie|ardei|castravete}` · `energy {name: soare|vant|apa|carbune|petrol|gaze}` · `sky-body {name: soare|pamant|luna}` · `farm-grid {cells, labels}`.
- **Mascotă și decor:** `mascot {mood: vesela|ganditoare|sarbatoreste|incurajeaza}` · `level-icon {level}` · `scene {theme: mare|piata|spatiu|ferma|magazin|oras|scoala|stadion}` (o temă nouă cere și tokenii `[data-theme]` din `00-tokens.css`).
- **Medalii:** `award {metal: bronz|argint|aur, form?: medalie|dublu|colectie|cupa, icon?, n?}` (medalia unei teme din Jocurile fulger, cu emoji-ul temei în mijloc, sau formele medaliilor în plus; `n` = numărul de pe cupă).
- **Avatare:** `avatar {avatar: vulpe.culoare-albastru.cap-coroana}` (avatarul unui profil, textul canonic din `core/avatar.js`; animalele, culorile, fundalurile și accesoriile se văd la `#/atelier/avatare`).
- **Grafice și grafuri (făcute pentru Jocurile fulger):**
  - **Forma:** 320 de unități lățime, text de cel puțin 18 unități (numerele 20), ca să se citească pe telefon.
  - **Parametrii** sunt liste de obiecte, deci vin doar din date, nu din `{{v:}}`.
  - **`mark`** scoate în evidență ce ține de răspuns în desenul rezolvat.
  - **Numele pentru cititorul de ecran** citește datele, nu rezultatul.

  Desenele:
  - **Grafice:**
    - `chart-bars {cats: [{id, emoji | text, name}], series: [{id, name?, values}], step, unit: [sg, pl], month?, hide?, mark?: [{cat, s}]}`:
      bare pe categorii sau pe zilele unei luni (`month`, cu datele în `cats`), cu una sau două serii; `hide` ascunde o bară sub „?”.
    - `chart-line {days: [luni, …] | dates: [8, 9, …] + month, series, step, unit, mark?: [{s, x}]}`: grafic în timp, cu una sau două
      serii (a doua punctată, cu ■).
    - `chart-picto {rows: [{id, name}], values, symbol, each: 1 | 2 | 5 | 10, unit, mark?}`: pictogramă cu legendă („🍎 = 5 mere”).
    - `chart-table {cols, rows: [{id, emoji?, name, cells: [n | {tally: n}]}], mark?: [{r, c}]}`: tabel cu numere sau cu bețișoare
      (bețișoarele, doar într-o singură coloană: mai multe nu încap în căsuță).
    - `chart-pie {groups: [{id, emoji, name, n}], each, unit, mark?}`: cerc cu felii numărate („o felie = 2 copii”), fără fracții.
    - `venn {a: {emoji, name}, b, counts: {a, ab, b}, mark?: a | ab | b | A | B | all}`: două cercuri; `A` = tot cercul A.
  - **Hărți și rețele:**
    - `metro {stops: [{id, emoji, x, y}], lines: [{id, n, stops}], minutes?: [{a, b, n}], path?, routes?: [{id: A | B, path}], plain?, mark?, h?}`:
      - harta liniilor: fiecare linie are numărul (1–4) și modelul ei, iar stațiile de schimb au inel dublu;
      - `plain` = drumuri gri, fără linii;
      - `routes` = drumurile A (plin) și B (punctat).
    - `line-badge {n}`: insigna liniei, ca variantă de răspuns.
    - `network {nodes: [{id, emoji, x, y}], edges: [[a, b], …], mark?}`: rețeaua de prieteni.
    - `bracket {players (4 sau 8), rounds: [[câștigătorii turului], …], mark?}`: turneu eliminatoriu (câștigătorul urcă pe linia plină).
  - **Arbori:**
    - `tree {nodes: [{id, parent?, edge?, value? | emoji? | text? | slot? | blank?}], grow: down | up, style: plain | branch, mark?}`:
      - arborele sumelor (`slot` = „?”, `blank` = căsuță goală);
      - arborele alegerilor;
      - clasificarea cu da / nu pe ramuri;
      - crengile veveriței (`branch`, cu alunele în `edge`).

Toate apar cu exemple la `#/atelier/vizualuri`. **Desen nou:** `registerVisual('nume', { group, defaults, label, render, viewBox, demos })`
într-un modul din `site/js/visuals/`; culori doar din variabile `--v-*` (vezi `css/00-tokens.css`), contur
`var(--v-ink)`, text cu `svgText`; `tests/visuals.test.js` îl verifică automat. Desenele cu date primesc și `check(p)`,
care întoarce erorile de parametri (liste de lungimi diferite, emoji necunoscute, valori care nu sunt numere); `npm test` le
raportează pentru desenele folosite în teste.

**Desene care se mișcă:** partea animată stă într-un grup cu clasă (`<g class="v-nume__parte">`) și e animată din
`css/05-visuals.css`. Regula (verificată de test): nici grupul, nici copiii lui nu poartă atributul `transform` dacă grupul
se rotește (razele soarelui sunt calculate cu sin/cos), iar `transform-box: fill-box` se pune doar pe grupul animat. Exemple:
razele, norii, barca și racheta din peisaje (pornite doar pe intro și la hover pe card), acele ceasului (`clock/view.js`
schimbă doar rotația), bila nouă de pe numărătoare, confetti-ul mascotei (doar opacitate).

## 6. Reguli de scriere pentru copii de 7–8 ani
- Enunț **scurt**: ≤ 20 de cuvinte la ușor, ≤ 35 la intermediar, ≤ 50 (max. 3 propoziții) la avansat. Verbul la început, întrebarea la final.
- Numerele se scriu **cu cifre**; cuvintele-cheie se îngroașă: „**cu 6 mai puține**”, „**în total**”, „**cuprinse între**”.
- **Fără negații** în afirmațiile Adevărat/Fals (validatorul avertizează).
- Contexte **reale și concrete** (piață, vacanță, fermă, școală); conținut **original**, nu copiat din manuale.
- Cel puțin o **capcană de gândire** pe nivel: limbaj înșelător („mai puține decât” → adunăm), date în plus,
  mai multe soluții, verificarea rezultatului, „găsește greșeala”, mersul invers.
- Diacritice corecte (ș, ț cu virgulă). Acordul cu numeralul: **1 leu**, 19 lei, **20 de lei**, 101 lei, **1 grad**,
  **22 de grade** (în șabloane cu casete folosește formulări neutre: „Rest (lei): [[a]]”). În cod: `cantitate(n, 'leu', 'lei')`.
- **Fără concepte viitoare:** în secțiunea 0–1000 nu folosim înmulțirea, împărțirea, fracțiile (jumătatea, sfertul) sau adunări și
  scăderi până la 1000 cu trecere peste ordin. Nivelul avansat devine mai greu prin **mai mulți pași**: compararea ramurilor unui traseu,
  „ce se schimbă dacă…”, date combinate din două reprezentări (tabel și grafic, două grafice), condiții ascunse într-o poveste.
- **Sarcini deschise și pași mulți (gândirea creativă):** la nivelul avansat, cel puțin o sarcină cu **mai multe răspunsuri bune**
  verificate prin reguli (`mark.rules`, `route.rules`, `chart.rules`, `money.distinct`), o problemă în **3+ pași** (`fill` cu
  `layout: 'steps'`, plan → calcul → verificare) și un puzzle (ghicitoare cu `search`, cifre ascunse, mers invers, greșeala din
  bon sau tabel). La intermediar, două probleme în 2 pași.
- **Limitele se spun exact:** „cel mult 400 de lei, iar 400 este voie”. Limita impusă de interfață (o bară până la 10) apare și în
  enunț, iar „cele mai puține” se scrie „mai puține decât fiecare dintre celelalte”, pentru că evaluatorul cere un minim strict.
- **Explicațiile se confruntă cu evaluatorul:** fiecare exemplu și fiecare „nu se poate” din explicație trebuie să dea același verdict
  ca evaluatorul, inclusiv la limită. Pașii unei probleme nu scriu rezultatele cerute mai sus (T1-e09 folosește casete pentru ele).
- **Etichetele de concepte descriu ce se evaluează, nu tema poveștii:** un calcul despre pași sau puls nu primește eticheta de mișcare
  ori de organe; o întrebare de cunoștințe (A/F, sortare, unire) o primește.
- **Datele despre sănătate din povești** sunt ale poveștii (ce a pus Vlad în coș, ținta propusă de învățătoare), nu recomandări
  generale, iar o afirmație dată drept adevărată trebuie să fie corectă în întregime, cu tot cu motivul ei.
- **Răspunsul nu stă la vedere:** variantele nu repetă pictograma sau textul din desen (țarcurile → doar numele animalelor),
  o variantă corectă nu spune rezultatul altui subpunct (T4-e10: a) estimează, b) calculează), contextul nu dă prima pereche
  din exercițiu, iar suma din portofel nu se vede în timpul rezolvării. Amestecă variantele (`shuffle: true`) când n-au o ordine
  naturală; la mersul invers copilul alege și semnul (`kind: 'sign'`), nu doar numărul.

## 7. Explicații și mesaje de feedback
Șablon: **Ce ne cere? → idee (desen) → pași → proba → capcana**. Lăudăm strategia, nu copilul („Încă nu — hai să privim zecile”).
Mesaje gata făcute pentru greșeli frecvente (din `docs/cercetare.md`):
- compară după cifra cea mai mare (39 > 41): „Uită-te întâi la zeci: 4 zeci sunt mai mult decât 3 zeci.”
- uită zecea nouă (36 + 27 = 53): „6 + 7 = 13: s-a format o zece nouă. Adaug-o la zeci: 63.”
- scade cifra mică din cea mare (42 − 17 = 35): „Din 2 nu luăm 7: desfacem o zece, 12 − 7 = 5.”
- „=” citit ca „scrie rezultatul” (8 + 4 = □ + 5 → 12): „Semnul = e o balanță: în stânga e 12, deci și în dreapta 12.”
- operația greșită la termenul necunoscut (□ + 28 = 51 → 79): „51 e totul, 28 o parte; partea lipsă este 51 − 28.”
- cuvântul-cheie alege operația: „Cine are mai multe? Deci adunăm.”
- se oprește după primul pas: „Ai aflat o parte, bravo! Întrebarea cere totalul: mai ai un pas.”
- numără capetele la „cuprinse între”: „Între 28 și 35 sunt doar numerele din mijloc: 29…34.”
- rigla de la 1: „Pornim de la 0 și numărăm spațiile dintre liniuțe.”
- ora și jumătate: „Acul mic a trecut de 5, dar n-a ajuns la 6: e 5 și jumătate.”
- numără bancnotele, nu valoarea: „Contează ce scrie pe bani, nu câte bucăți ai.”

## 8. Timp estimat (pentru `estMin`; suma pe test trebuie să fie exact 45 de minute)
Calcule simple 20–30 s/item · cu trecere peste ordin 45–60 s/item · alegere 30–45 s · ordonare de 6–7 numere 1–1,5 min ·
unire 4 perechi 2–3 min · problemă cu o operație 2–3 min, cu două operații 4–5 min · bani cu mai multe soluții 3–4 min.
La începutul clasei a II-a se adaugă ~20–30 s pentru citirea fiecărui enunț. Timpul real se notează în `docs/STARE.md`.

## 9. Tip nou de exercițiu
1. `site/js/types/<tip>/logic.js` — pur (fără DOM): `validate`, `count`, `answered`, `empty`, `solution`, `evaluate`.
2. `site/js/types/<tip>/view.js` — `howto(part)` și `mount(el, part, ctx) → { get, set, mode, showResult, destroy }`;
   pentru mutări folosește `core/dnd.js`, pentru stări `setState` din `types/_view.js`.
3. O linie în `site/js/core/registry.js`, un exemplu în `site/data/demo.js`, stiluri în `css/04-exercises.css`,
   gesturi în `tools/e2e.py` (`types_flow`).
4. Feedback la atingere: `pop(el)` din `core/dom.js` pe elementul ales sau „aterizat” și `play('tap')` / `play('place')` din
   `core/sound.js`; elementele de apăsat primesc muchia 3D comună (`--sh-edge`) și stilul unic de „ales” (contur brand;
   plin doar la butoanele-glifă).

## 10. Checklist înainte de commit
- [ ] `npm test` verde (0 erori; citește și avertismentele)
- [ ] `npm run e2e` verde; capturile arată bine pe laptop, tabletă și telefon
- [ ] durata exact 45 min (suma `estMin`), 4/4/3 exerciții, 1–2 de explorarea mediului, fiecare exercițiu cu `explain`
- [ ] catalogul actualizat (`version`, `estMin`, `exercises`), `npm run acoperire`, `docs/STARE.md` actualizat
- [ ] răspunsul nu e vizibil în enunț, desen sau variante; variantele fără ordine naturală sunt amestecate
