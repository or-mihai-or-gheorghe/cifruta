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
5. Adaugă intrarea în catalog: `{ id, file, version, theme, title, subtitle, estMin }` (`estMin` = suma exercițiilor).
6. Rulează `npm test` până e verde (schemă, răspunsuri recalculate, unicitate, durată, diacritice).
7. Rulează `npm run e2e` (sau `python3 tools/e2e.py --only <id> --shots`) și privește capturile din `test-results/`.
8. Actualizează `docs/STARE.md` (catalog + jurnal) și fă commit.

**Modifici un test deja publicat?** Crește `version` în test **și** în catalog — ciornele vechi ale copiilor sunt ignorate.

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
- `context: { text, visual?, size?: 'lg' }` — povestea exercițiului (desenul mare cu `size: 'lg'`).
- `parts: [{ id: 'a', type, prompt, visual?, …câmpurile tipului }]` — subpunctele a), b), c). Dacă exercițiul are o
  singură parte, câmpurile ei se scriu direct pe exercițiu (forma scurtă).
- `points` lipsește de obicei: implicit 2 / 3 / 4 după nivel. Scorul: 10 din oficiu + 90 × puncte obținute / total.
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
  `parity {even}`, `digitsDistinct`, `digitCount`, `digitSum`, `holds {expr cu n, z, u, s}`, `all`, `any`, `not`.
- **Adunări:** la `[[a]] + [[b]] = …` termenii sunt acceptați în orice ordine.
- **Mesaj țintit:** `feedback: [{ if: 35, text: '8 + 7 = 15: nu uita zecea nouă!' }]` pe casetă (sau pe item la
  `choice`/`match`).

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

## 6. Reguli de scriere pentru copii de 7–8 ani
- Enunț **scurt**: ≤ 20 de cuvinte la ușor, ≤ 35 la intermediar, ≤ 50 (max. 3 propoziții) la avansat. Verbul la început, întrebarea la final.
- Numerele se scriu **cu cifre**; cuvintele-cheie se îngroașă: „**cu 6 mai puține**”, „**în total**”, „**cuprinse între**”.
- **Fără negații** în afirmațiile Adevărat/Fals (validatorul avertizează).
- Contexte **reale și concrete** (piață, vacanță, fermă, școală); conținut **original**, nu copiat din manuale.
- Cel puțin o **capcană de gândire** pe nivel: limbaj înșelător („mai puține decât” → adunăm), date în plus,
  mai multe soluții, verificarea rezultatului, „găsește greșeala”, mersul invers.
- Diacritice corecte (ș, ț cu virgulă). „de” după numerale: 19 lei, **20 de lei** (în șabloane cu casete folosește
  formulări neutre: „Rest (lei): [[a]]”).

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

## 10. Checklist înainte de commit
- [ ] `npm test` verde (0 erori; citește și avertismentele)
- [ ] `npm run e2e` verde; capturile arată bine pe laptop, tabletă și telefon
- [ ] durata 40–48 min, 4/4/3 exerciții, 1–2 de explorarea mediului, fiecare exercițiu cu `explain`
- [ ] catalogul actualizat (`version`, `estMin`), `docs/STARE.md` actualizat
