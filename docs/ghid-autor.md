# Ghidul autorului — cum adaug teste și exerciții în Cifruța

Ghidul explică tot ce trebuie pentru un test nou. Exemple vii: `site/data/demo.js` (câte un exemplu din fiecare tip,
vizibil în site la `#/atelier/tipuri`) și cele 4 teste din `site/data/tests/recap-c1/`.

## 1. Rețeta pentru un test nou

1. Alege grupul din `site/data/catalog.js` (sau adaugă o secțiune / un grup nou).
2. Creează fișierul `site/data/tests/<grup>/tN-nume-scurt.js` (nu îl numi `test-*.js`).
3. Scrie testul după schema de mai jos: **11 exerciții = 4 ușor + 4 intermediar + 3 avansat**, total 40–48 de minute,
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
**Excepție:** dacă adaugi sau schimbi doar un desen (`context.visual`, `part.visual`, `itemVisual`), versiunea rămâne —
răspunsurile, id-urile și ciornele nu sunt afectate.

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
- `points` lipsește de obicei: implicit 2 / 3 / 4 după nivel. Scorul: 10 din oficiu + 90 × puncte obținute / total.
- **Subpunctele valorează egal** în exercițiu, oricâte casete ar avea fiecare (a) cu 5 casete și b) cu o alegere: câte
  jumătate). Pentru o alegere între **două** variante, unde ghicitul e ușor, pune `weight: 0.5` pe subpunct
  (T3-e07 b, T4-e09 b). Implicit `weight` e 1.
- `explain: { idea, steps: [...], check?, trap? }` — apare la rezultate, în „De ce? Cum rezolvăm”; `idea` este și
  indiciul de la „Mai încerc o dată”.

## 3. Tipurile de exerciții

| Tip | Câmpuri principale | Răspuns salvat |
|-|-|-|
| `choice` | `items: [{ id, q?, options: ['50', …] \| [{ id, text, visual?, emoji? }], correct, multi?, calc?, feedback? }]`, `style: 'circles'`, `shuffle` | `{ itemId: optionId }` |
| `truefalse` | `items: [{ id, text, answer: true\|false, why? }]` | `{ itemId: bool }` |
| `fill` | `layout`, `rows` / `trees` / `chains` / `head`, `blanks`, `checks?` (vezi mai jos) | `{ blankId: valoare }` |
| `slider` | `skin: 'line'\|'thermometer'`, `min, max, step`, `ticks: { minor, major?, labels? }`, `unit?`, `items: [{ id, label, answer, tolerance? }]` | `{ itemId: număr }` |
| `match` | `left: [{ id, text, visual?, calc?, feedback? }]`, `right: [{ id, text?, label?, visual?, calc? }]`, `key: { leftId: rightId }` | `{ leftId: rightId }` |
| `order` | `items: [{ id, text, tag?, emoji? }]`, `direction: 'asc'\|'desc'` sau `key` + `constraints`, `itemVisual?`, `reveal: { word }` | `[id, …]` |
| `categorize` | `bins: [{ id, label, visual? }]`, `items: [{ id, text, emoji?, visual?, bin }]` | `{ itemId: binId }` |
| `mark` | `items: [{ id, n? , text?, visual? }]`, `itemVisual?`, `rule` sau `key`; cu paletă: `palette: [{ id: 'verde', label }]` + `item.color` | `[id, …]` sau `{ id: culoare }` |
| `build` | `tool: 'abacus'`, `places: ['Z','U']` (sau `['S','Z','U']`), `items: [{ id, label, target }]` | `{ itemId: { Z, U } }` |
| `clock` | `step: 30`, `items: [{ id, label?, answer: { h, m } }]` | `{ itemId: { h, m } }` |
| `money` | `allowed: [1, 5, 10, 20, 50]`, `target`, `items: [{ id, label }]`, `distinct?` (feluri diferite), `fewest?` (cele mai puține bancnote) | `{ itemId: { '10': 1, '1': 2 } }` |

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
- **Suporturi pentru numere:** `shell` · `star` · `flower {color}` · `suitcase {tag}` · `apple {color}` · `leaf` · `balloon {color}` · `planet {color}` · `rocket` · `basket {label}` · `tag {n, unit}` — toate cu `n`.
- **Unelte:** `abacus {places, S, Z, U}` · `egg-carton {full, loose}` · `ten-frame {n}` · `number-line {min, max, minor, labels, marker, icon}` · `thermometer {min, max, minor, major, value}` · `ruler {length, from, to}` · `clock {h, m}` · `balance {left, right}` · `bar-model {parts, total}`.
- **Bani:** `banknote {value: 1|5|10|20|50|100}` · `coin {value: 1|5|10|50}` (bani).
- **Geometrie:** `shape {name: triunghi|patrat|dreptunghi|cerc}` · `solid {name: cub|cuboid|cilindru|sfera|con}` · `rocket-shapes` · `triangle-fan {cuts}` · `square-grid {n}`.
- **Natură și corp:** `organ {name: inima|plamanii|creierul|stomacul|rinichii}` · `plant` · `vegetable {name: morcov|ridiche|sfecla|salata|spanac|varza|rosie|ardei|castravete}` · `energy {name: soare|vant|apa|carbune|petrol|gaze}` · `sky-body {name: soare|pamant|luna}` · `farm-grid {cells, labels}`.
- **Mascotă și decor:** `mascot {mood: vesela|ganditoare|sarbatoreste|incurajeaza}` · `level-icon {level}` · `scene {theme}`.

Toate apar cu exemple la `#/atelier/vizualuri`. **Desen nou:** `registerVisual('nume', { group, defaults, label, render, viewBox, demos })`
într-un modul din `site/js/visuals/`; culori doar din variabile `--v-*` (vezi `css/00-tokens.css`), contur
`var(--v-ink)`, text cu `svgText`; `tests/visuals.test.js` îl verifică automat.

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

## 8. Timp estimat (orientativ, pentru `estMin`)
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
- [ ] durata 40–48 min, 4/4/3 exerciții, 1–2 de explorarea mediului, fiecare exercițiu cu `explain`
- [ ] catalogul actualizat (`version`, `estMin`, `exercises`), `npm run acoperire`, `docs/STARE.md` actualizat
