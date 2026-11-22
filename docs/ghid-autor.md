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
  theme: 'mare' | 'piata' | 'spatiu' | 'ferma' | 'munte' | 'dunare' | …, // culoarea de accent + peisajul de pe card
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
| `order` | `items: [{ id, text, tag?, emoji?, calc? }]`, `direction: 'asc'\|'desc'` sau `key` + `constraints`, `itemVisual?`, `reveal: { word }` (cu `calc`, valoarea e rezultatul calculului: codul secret) | `[id, …]` |
| `categorize` | `bins: [{ id, label, visual? }]`, `items: [{ id, text, emoji?, visual?, bin }]` | `{ itemId: binId }` |
| `mark` | `items: [{ id, n? , text?, visual? }]`, `itemVisual?`, `rule` sau `key`; cu paletă: `palette: [{ id: 'verde', label }]` + `item.color`; **sarcină deschisă:** `rules: { count?: n \| {min,max}, sum?: {min,max} (pe `item.n`), include?, exclude?, noun?: ['produs','produse'], unit?: 'lei' }` — orice selecție bună ia tot creditul | `[id, …]` sau `{ id: culoare }` |
| `build` | `tool: 'abacus'`, `places: ['Z','U']` (sau `['S','Z','U']`), `items: [{ id, label, target }]` sau `items: [{ id, label, calc: '148 + 136' }]` (ținta = calculul) | `{ itemId: { Z, U } }` |
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
- **Calculul în scris** (`layout: 'column'`): `rows: ['347 + 285 = [[a]][[b]][[c]]', { t: '403 − 158 = [[d]][[e]][[f]]', label }]` —
  o casetă pe cifră, scrisă de la unități spre stânga (focusul trece singur, Backspace înapoi); la adunare 2–3 termeni, la scădere doi.
  - Cifrele **se calculează**: `blanks: { a: {}, … }` (un `answer` scris de mână se verifică). Cifrele ascunse în termeni
    (`'3[[g]]7 + [[h]]85 = 632'`, cel mult 6) se caută toate și trebuie să aibă **o singură** completare.
  - **Căsuțele „ține minte”** de deasupra coloanelor (transportul la adunare, „10” și cifra micșorată la scădere, ca în manual) sunt
    opționale, nu se notează și se păstrează în ciornă sub cheile `~<rând>.<loc>` (`'~0.z'`); la soluție arată marcajele corecte.
    `minte: false` le ascunde.
  - **Mesaje automate** pe cifrele rezultatului: transportul uitat, cifra mică scăzută din cea mare, împrumutul fără micșorare,
    împrumutul peste zero. Un `feedback` scris de autor are prioritate.
  - Un rezultat de 1000 are 4 căsuțe și își dă de gol mia: la sumele exacte de 1000, ascunde mai bine cifre din termeni.
- **Piramida** (`layout: 'pyramid'`): `pyramids: [{ rows: [['868'], ['452', '[[m]]'], ['185', '[[b]]', '[[c]]']] }]`, de sus în jos;
  fiecare cărămidă e suma celor două de sub ea. Valorile se calculează (propagare, plus cel mult o necunoscută la bază încercată
  0–1000) și trebuie să fie unice; toate relațiile se verifică, și cele dintre numerele date.

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
`{{v:star n=47}}` desen mic în text · `{{s:3}} {{z:4}} {{u:7}}` jetoane pentru sute / zeci / unități · `{{f:2/3}}` fracție etajată,
citită „două treimi” (numitorul 1–10; doar în Învață: testele de recapitulare n-au fracții).
HTML nu este permis (se afișează ca text).

## 5. Banca vizuală (`visual: { v: 'nume', …parametri }`)
- **Suporturi pentru numere:** `shell` · `star` · `flower {color}` · `suitcase {tag}` · `apple {color}` · `leaf` · `balloon {color}` · `planet {color}` · `rocket` · `basket {label}` · `tag {n, unit}` · `medal {n, rank}` — toate cu `n`.
- **Date și grafice:** `bar-chart {labels, values, emojis?, step, max?, hide?, numbers?}` · `pictogram {labels, values, emoji, each, unit}` · `tally {labels, values}` · `pie {slices, filled, labels?}` sau `pie {groups: '3,2,2,1', names}` (felii egale colorate pe categorii, cu legendă fără numere) · `data-table {head: 'A|B', rows: 'x|1;y|2', highlight?}` · `podium {names, values?}`.
- **Oraș și transport:** `route-map {stops, lines, segments?, unit?, path?, from?, to?, w, h}` (`segment.at` mută eticheta de lungime pe segment, departe de numele stațiilor) (liste de obiecte → doar din date, nu din `{{v:}}`) · `signpost {label, n, unit}`.
- **Magazin:** `shelf {products: 'minge:120,carte:60'}` · `receipt {title, lines: 'Ghete|230,Rucsac|128', total?}` (`total` poate fi greșit intenționat sau `'?'`) · `note-list {title, lines, checked?}`.
- **Unelte:** `abacus {places, S, Z, U}` · `egg-carton {full, loose}` · `ten-frame {n}` · `number-line {min, max, minor, labels, marker, icon}` (`icon` = orice emoji) · `thermometer {min, max, minor, major, value}` · `ruler {length, from, to}` · `clock {h, m}` · `balance {left, right}` · `bar-model {parts, total}` · `place-value {s, z, u}` (cifră sau `?`) · `base-ten {n}` (plăci de 100, bare de 10, cuburi) sau `base-ten {s, z, u, group?}` (bucățile înainte de schimb: 13 cuburi, 12 bare, o sută desfăcută; `group: 'u'|'z'` încercuiește 10 bucăți) · `number-line {hops, jumps?}` (salturi pe axă pentru calculul în minte: `hops: '245,?,?,?', jumps: '+100,+30,+2'`; opririle `?` nu apar în numele desenului) · `column-op {op, terms, result?, carries?, mark?}` (un calcul în scris desenat, eventual greșit intenționat: „Cine s-a grăbit și a greșit?”; pe elementele unui `mark` cu `key`, validatorul cere ca cheia să fie exact calculele greșite; o cifră lipsă se scrie „?”: `terms: '3?7,285', result: '632'`, una singură în tot calculul, cu rezultatul scris și fără `carries`, completabilă într-un singur fel, iar numele desenului n-o spune).
- **Bani:** `banknote {value: 1|5|10|20|50|100|200|500}` · `coin {value: 1|5|10|50}` (bani).
- **Geometrie:** `shape {name: triunghi|patrat|dreptunghi|cerc}` · `solid {name: cub|cuboid|cilindru|sfera|con}` · `rocket-shapes` · `triangle-fan {cuts}` · `square-grid {n}`.
- **Natură și corp:** `organ {name: inima|plamanii|creierul|stomacul|rinichii}` · `plant` · `vegetable {name: morcov|ridiche|sfecla|salata|spanac|varza|rosie|ardei|castravete}` · `energy {name: soare|vant|apa|carbune|petrol|gaze}` · `sky-body {name: soare|pamant|luna}` · `farm-grid {cells, labels}`.
- **Mascotă și decor:** `mascot {mood: vesela|ganditoare|sarbatoreste|incurajeaza}` · `level-icon {level}` · `scene {theme: mare|piata|spatiu|ferma|magazin|oras|scoala|stadion|munte|dunare}` (o temă nouă cere și tokenii `[data-theme]` din `00-tokens.css`).
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
- **Înmulțirea (făcut pentru Jocurile fulger, aceeași formă de 320 de unități):** `groups {n: 1–6, each: 1–6, emoji, unit: [sg, pl],
  counts?}`: grupe egale de obiecte pe tăvi cu contur (cel mult 3 pe rând, obiectele așezate ca punctele zarului); `counts` adaugă sub
  fiecare tavă numărătoarea din grupă în grupă (4, 8, 12), pe aceleași dimensiuni. Numele spune grupele („3 grupe cu câte 4 mere”),
  nu totalul.
- **Săriturile pe axă (Învață):** `skip-line {step: 1–10, count: 0–10}`: axa de la 0 la 10 × pasul, cu săriturile și veverița pe
  ultimul număr atins; numele nu spune unde ajunge.
- **Fracțiile (Învață):** `fraction {shape: circle | bar | square, parts: 1–10, on?, sizes?, cut?}`: un întreg tăiat în bucăți;
  `on` sunt bucățile colorate (și hașurate), `sizes` le face inegale („Sunt părți egale?”), iar la pătrat `cut` alege fâșii, careu
  2 × 2 sau diagonale. Numele spune în câte bucăți e tăiat și câte sunt colorate, nu și dacă sunt egale.

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
  **22 de grade** (în șabloane cu casete folosește formulări neutre: „Rest (lei): [[a]]”, „Copii în total: [[d]]”, „[[d]] m”, fiindcă
  după 101–119 nu se pune „de”, iar un „de” scris dinainte spune ceva despre răspuns). În cod: `cantitate(n, 'leu', 'lei')`.
- **Fără concepte viitoare:** nu folosim înmulțirea, împărțirea sau fracțiile (jumătatea, sfertul). În secțiunea „Numerele de la 0
  la 1000” nici adunări și scăderi până la 1000 cu trecere peste ordin. În secțiunea „Adunarea și scăderea până la 1000” trecerile
  sunt progresive: la ușor și la intermediar cel mult **o trecere** pe calcul, la avansat cel mult **trei** (două treceri, împrumut
  peste zero, sume până la 1000), toate rezultatele în 0–1000 și 1–2 exerciții de explorarea mediului (`tests/content.test.js`
  verifică). Nivelul avansat devine mai greu prin **mai mulți pași**: compararea ramurilor unui traseu,
  „ce se schimbă dacă…”, date combinate din două reprezentări (tabel și grafic, două grafice), condiții ascunse într-o poveste.
- **Sarcini deschise și pași mulți (gândirea creativă):** la nivelul avansat, cel puțin o sarcină cu **mai multe răspunsuri bune**
  verificate prin reguli (`mark.rules`, `route.rules`, `chart.rules`, `money.distinct`), o problemă în **3+ pași** (`fill` cu
  `layout: 'steps'`, plan → calcul → verificare) și un puzzle (ghicitoare cu `search`, cifre ascunse, mers invers, greșeala din
  bon sau tabel). La intermediar, două probleme în 2 pași, cu tipare care variază de la un test la altul (cu … mai mult, apoi
  totalul; totalul și o parte, apoi comparația; problema „pe dos”, unde „mai mulți” cere o scădere; scăderi succesive), iar
  fiecare test are o probă sau o estimare.
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
  naturală; la mersul invers și la problemele „cu … mai mult / mai puțin” copilul alege și semnul (`kind: 'sign'`), nu doar
  numărul (cu operația scrisă în șablon, conceptul s-ar bifa din copiat). Un subpunct de mai jos nu scrie răspunsul
  unuia de mai sus: după „alege cel mai scurt drum”, lungimea drumului ales stă într-o casetă cu `expr` (ascunsă), nu în
  „125 + 92 + 45”; un rezultat nu apare ca termen în calculul pe coloane de dedesubt; nici titlul exercițiului, nici titlul
  testului nu spun cuvântul secret, iar povestea spune că literele sunt ascunse („pe spatele fiecărui zmeu”). Un răspuns nu se ia
  nici dintr-un exercițiu de mai înainte (o sumă calculată în e03 nu devine termenul necunoscut din e05). La `match` se amestecă
  doar coloana din dreapta: în stânga, perechile nu stau una lângă alta. Un desen „decorativ” nu are date care contrazic enunțul
  (cofraje cu 24 de ouă lângă 148 + 136, o balanță în echilibru lângă „Andrei are mai mult”).
- **Pe telefonul de 360 px:** un desen cu date pus în context (tabel, axă, grafic, model cu bare, pictogramă, hartă) are
  `size: 'lg'` (validatorul cere); un tabel cu casete de trei cifre are cel mult 4 coloane, cu etichetele lungi pe rânduri;
  un grafic de construit are un pas care cere cel mult ~25 de apăsări (20 sau 50 la sute; ținute apăsat, + și − repetă pasul);
  pe axa 0–1000, toleranța unui `slider` e de cel puțin 25. Culorile barelor din `chart` vin din poziție (albastru, roșu,
  galben, verde…): categoriile cu nume de culori urmează această ordine.
- **Unitățile din mesajele generate se scriu cu litere** (`tag`, `slider.unit`, `map.unit`, `mark.rules.unit`): `cantitate`
  pune „de”, deci „590 de metri”, „1000 de grame”, nu „590 de m”. În enunțuri, simbolurile rămân: „386 m”, „245 kg”.

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
- la calculul pe coloane, mesajele vin singure (din `fill/logic.js`): „7 + 5 = 12: s-a format o zece nouă. Adaug-o la zeci: …”,
  „La zeci avem 0: desfacem o sută în 10 zeci…”, „La sute, o sută a plecat la zeci: rămân 3…”.

Un mesaj se leagă de un răspuns **greșit** (`if`): unul legat de răspunsul corect nu s-ar arăta niciodată (validatorul îl refuză).
Numărul din `if` vine chiar din greșeala descrisă în text: la 365 − 148, cifra mică din cea mare dă 223, împrumutul fără micșorare
dă 227, iar transportul uitat la 236 + 189 dă 315 (uitat doar la unități: 415).

## 8. Timp estimat (pentru `estMin`; suma pe test trebuie să fie exact 45 de minute)
Calcule simple 20–30 s/item · cu trecere peste ordin 45–60 s/item · un calcul pe coloane 1–1,5 min · cifre ascunse sau piramidă 2–3 min · alegere 30–45 s · ordonare de 6–7 numere 1–1,5 min ·
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

## 11. Lecții în Învață
Secțiunea Învață (`#/invata`) are lecții, nu teste: copilul mișcă un desen, vede calculul la zi și rezolvă provocări mici, fără scor
și fără cronometru. Lecțiile stau în `site/data/invata.js`, pe capitole (un capitol „în curând” are doar `soon: true`, titlul, textul
și iconița). Acolo se învață și conceptele pe care testele le ocolesc (înmulțirea, fracțiile, împărțirea, ecuațiile).

**Jocul capitolului** (`game`, opțional) e singura excepție de la „fără scor și fără cronometru”:
- **Ce e:** o rundă de 2 minute, după lecții (azi „Tabla în 2 minute”, la Înmulțirea), care numără doar răspunsurile corecte. N-are
  clasament, medalii sau stele, iar rundele rămân în browser.
- **Forma:** `{ id, title, icon, kind, noun, text, rules }`.
  - `kind` e un tip din Jocuri fulger (`inm-tabla`: a × b, cu factori de la 2 la 9).
  - `noun` e substantivul numărat, la singular și la plural, feminin: `['înmulțire', 'înmulțiri']`.
  - `text` stă pe card, iar `rules` pe panoul de start.
- **Id-ul** e permanent și nu poate fi și id de lecție: amândouă se deschid la `#/invata/<capitol>/<id>`.

**Lecția:** `{ id, title, icon, goal, intro, concepts, widget: { w, ...parametri }, tasks, notes }`.
- `goal` — caseta „Ce învățăm”, sub titlu și pe cardul lecției: scopul și ce înseamnă desenul („Fiecare farfurie e o grupă, cu la
  fel de multe mere.”), cel mult 170 de caractere; fără ea, copilul mișcă glisoare fără să știe de ce;
- `intro` — indicația Cifruței: ce face fiecare glisor și fiecare buton (și „Numără”, „Întoarce”, butonul din colț), cel mult 170;
- `widget` — unul din `js/invata/registry.js`, cu parametrii lui (`check` îi validează):
  - `array` cu `skin: 'plates' | 'grid' | 'split' | 'table'` (la `plates`, `mark: true` colorează farfurii: fracția dintr-o mulțime; la
    `table`, `read: 'div'` citește harta pe dos: „24 : 6 = 4”, cu rândul împărțitorului desfăcut în numere și proba);
  - `imparte` (împărțirea): `mode: 'parti'` (pe farfurii, câte una pe fiecare, pe rând), `mode: 'grupe'` (câte `by` într-o pungă, cu
    scăderea repetată) și `zeci: true` (pachete de câte 10 bețișoare și bețișoare libere; pachetele care nu ajung pe toate farfuriile
    se desfac), cu `total` (cel mult 30 de nuci, 99 de bețișoare);
  - `balanta` (balanța): `eq` doar cu adunări („□ + 7 = 15”, „8 + 4 = □ + 5”) și `mode: 'guess'` (glisorul pune nuci în sac, balanța se
    înclină) sau `'take'` (glisorul ia aceleași nuci din ambele talere, până rămâne sacul singur); modul se schimbă cu `start`;
  - `bare` (partea care lipsește): `eq` cu o căsuță („□ + 7 = 15”, „15 − □ = 8”, „□ − 7 = 8”), `lo` (glisorul merge de la `lo` la `lo + 10`);
  - `masina` (mașina de numere): `ops` (1–2 operații: `[['×', 4]]`, `[['+', 20], ['−', 8]]`), `out` (ce trebuie să iasă), `lo`; butonul
    „Pe dos” arată drumul înapoi;
  - `jumps` (săriturile pe axă);
  - `parts` (întregul tăiat: `shapes`, `min`/`max` sau `cut: true` pentru „Taie fiecare bucată în două”, `labels` pentru numărător și
    numitor);
  - `wall` (zidul fracțiilor);
- `tasks` — 3–4 provocări, în ordinea în care se fac;
- `notes` — 1–3 propoziții pentru „Ce am aflat”, cu termenii în **aldin** („**factorii**”, „**produsul**”).

**Provocările** (`ask`: cel mult 60 de caractere; răspunsurile se calculează, nu se scriu de mână):

| fel | câmpuri | exemplu |
|-|-|-|
| o stare | `want` | „Arată 4 × 6.” → `{ rows: 4, cols: 6 }` |
| mai multe soluții | `collect`, `by`, `need` | „Găsește toate dreptunghiurile cu 24.” → `{ product: 24 }`, `by: ['rows', 'cols']`, `need: 4` |
| o alegere | `pick`, `rule`, datele regulii, `hint`, `hide`, `show` | „Cât face 7 × 8?” → `[54, 56, 63]`, `rule: 'produs'`, `of: [7, 8]`, `hide: ['product']` |
| alt punct de plecare | `start` (cu oricare dintre cele de sus) | „Acum sunt 15 nuci. Împarte-le pe 5 farfurii.” → `start: { total: 15 }`, `want: { plates: 5 }` |

Regulile alegerilor (`PICK_RULES`): `produs` (`of: [a, b]`), `jumatati` și `sferturi` (variantele sunt desene `fraction`; corect e cel
tăiat în 2, respectiv 4 părți egale), `mai-mare` (variante „n/d”), `valoare` (`of: [n, d]`: exact fracția colorată din desenul `show`),
`cat` (`of: [24, 6]`: câtul unei împărțiri exacte) și `necunoscut` (`of: ['□ + 9 = 13']`: numărul din căsuță, căutat cu `solveBox`;
merge și cu litera x, `of: ['2 × x + 5 = 17']`, iar „Bravo!” scrie „x = 6, pentru că 2 × 6 + 5 = 17.”).

**Ecuațiile cu x** (capitolul „Ecuații cu x”) au trei widgeturi:
- **`balanta`:** cu `eq: '3 × x + 4 = 19'`, adică 2–3 saci la fel; nucile rămase se împart exact la saci. Modul `share` are butonul
  „Împarte” și niciun glisor.
- **`bare`:** cu `eq: '3 × x + 2 = 20'` sau `'4 × x − 3 = 17'`. Bara cea mai lungă de pe tot glisorul are cel mult 50.
- **`pasi`:** `{ eq: 'a × x ± b = c', lo?, story? }`. O poveste are forma
  `{ icon, text (≤ 120), explain (≤ 140, fără ecuație: „Bravo!” o adaugă), answer: 'Un creion costă', unit: ['leu', 'lei'] }`.
  O provocare cu altă ecuație își golește pașii în `start`: `{ eq, story, written: false, moved: false, divided: false, x: 0,
  wrong: null }`.

`start` pune câteva mărimi peste starea lăsată de provocarea dinainte, când provocarea apare (și la „Încă o dată”): o ecuație nouă pe
balanță, alt număr de nuci. Așa, o lecție dă numere diferite fără glisoare lungi (un glisor are cel mult ~11 gradații pe telefon;
`setScale` îi mută intervalul). `npm test` cere ca `start` să pună doar mărimi pe care starea le are și ca provocarea să nu fie
rezolvată chiar de punctul ei de plecare.

- Mărimile din `want`, `collect` și `by` sunt cele din `derive` ale widgetului (`QUANTITIES`); `hide` ascunde una dintre ele cât e
  activă provocarea (altfel răspunsul ar sta scris lângă desen).
- `npm test` caută în lățime, prin aceleași acțiuni ca interfața, o cale spre fiecare provocare. Starea lăsată de provocarea
  dinainte nu trebuie s-o rezolve deja pe următoarea, iar o alegere are exact un răspuns corect.
- Textele urmează regulile din § 6 și § 7, iar mini-markup-ul din § 4 merge și aici. Calculele („6 × 7”) se scriu cu spații
  obișnuite: lecția le ține pe un rând.
- Pe tablete și laptopuri, „Ce învățăm”, indicația și provocarea stau în coloana Cifruței, lângă widget. Pe laptopul de 1366 × 768
  încap toate trei, fără derulare, cât timp rămân în limitele de mai sus (170 de caractere, 60 la provocare): E2E verifică.
- Id-urile capitolelor, ale lecțiilor și ale provocărilor sunt permanente: stau în bifele salvate (`cifruta:invata`).
- Convenția factorilor (`js/invata/text.js`): „3 × 4” = „de 3 ori câte 4” = 4 + 4 + 4, adică rânduri × câte pe rând, farfurii ×
  câte pe farfurie, sărituri × lungimea săriturii.
