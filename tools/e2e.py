#!/usr/bin/env python3
"""Teste E2E pentru Cifruța cu Playwright (Chromium headless).

Pornește un server local pe site/, apoi verifică:
  • paginile principale se încarcă fără erori în consolă și fără scroll orizontal pe telefon;
  • pentru fiecare test din catalog: răspunsuri corecte → 100, gol → fereastra de confirmare → 10, ciorna se păstrează;
  • gesturi reale pe fiecare tip de exercițiu în #/atelier/tipuri;
  • capturi de ecran în test-results/ (cu --shots).

Rulează: python3 tools/e2e.py [--only demo] [--shots] [--base-url URL]
"""
from __future__ import annotations

import argparse
import functools
import json
import re
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "test-results"
VIEWPORTS = {
    "laptop": {"viewport": {"width": 1280, "height": 800}},
    "tableta": {"viewport": {"width": 1024, "height": 768}, "has_touch": True},
    "telefon": {"viewport": {"width": 390, "height": 844}, "has_touch": True, "is_mobile": True, "device_scale_factor": 2},
}
CEDILLA = re.compile("[ŞşŢţ]")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):  # fără zgomot în consolă
        pass


def serve() -> tuple[ThreadingHTTPServer, str]:
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(SITE)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f"http://127.0.0.1:{httpd.server_address[1]}/"


def catalog_tests() -> list[dict]:
    script = "import('./site/data/catalog.js').then(m => console.log(JSON.stringify(m.default.sections.flatMap(s => s.groups.flatMap(g => g.tests.map(t => ({ ...t, section: s.id })))))))"
    out = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


class Run:
    def __init__(self, base: str, shots: bool):
        self.base = base
        self.shots = shots
        self.failures: list[str] = []
        self.passed = 0

    def check(self, ok: bool, what: str):
        if ok:
            self.passed += 1
            print(f"  ✔ {what}")
        else:
            self.failures.append(what)
            print(f"  ✖ {what}")

    def watch(self, page: Page, label: str):
        def on_console(msg):
            if msg.type == "error":
                self.failures.append(f"{label}: eroare în consolă: {msg.text}")
                print(f"  ✖ {label}: consolă: {msg.text}")

        page.on("console", on_console)
        page.on("pageerror", lambda err: (self.failures.append(f"{label}: excepție: {err}"), print(f"  ✖ {label}: excepție: {err}")))
        page.on("response", lambda r: r.status >= 400 and (self.failures.append(f"{label}: {r.status} {r.url}"), print(f"  ✖ {label}: {r.status} {r.url}")))

    def shot(self, page: Page, name: str):
        if self.shots:
            OUT.mkdir(exist_ok=True)
            page.screenshot(path=str(OUT / f"{name}.png"), full_page=True)

    def goto(self, page: Page, route: str, debug: bool = False):
        page.goto(f"{self.base}{'?debug=1' if debug else ''}#/{route}")
        page.wait_for_load_state("networkidle")
        page.evaluate("document.fonts.ready")

    def layout_ok(self, page: Page, label: str):
        overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        self.check(overflow <= 1, f"{label}: fără scroll orizontal (depășire {overflow}px)")
        text = page.evaluate("document.body.innerText")
        self.check(not CEDILLA.search(text), f"{label}: fără litere cu sedilă")


def smoke(run: Run, page: Page, vp: str):
    for route, name in [("", "acasa"), ("sectiune/recapitulare", "sectiune"), ("atelier/componente", "atelier-componente"), ("atelier/vizualuri", "atelier-vizualuri"), ("atelier/tipuri", "atelier-tipuri"), ("nu-exista", "404")]:
        run.goto(page, route)
        page.wait_for_function("document.querySelector('main')?.innerText.trim().length > 0")
        page.wait_for_timeout(300)
        run.check(page.locator("main").inner_text().strip() != "", f"[{vp}] pagina „{name}” are conținut")
        run.layout_ok(page, f"[{vp}] {name}")
        run.shot(page, f"{vp}-{name}")
        if name == "sectiune":
            state = page.evaluate("getComputedStyle(document.querySelector(\".c-card__media [class^='v-scene__']\")).animationPlayState")
            run.check(state == "paused", f"[{vp}] pe cardurile testelor peisajele stau pe loc până la hover ({state})")
    fonts = page.evaluate("document.fonts.check('16px Andika', 'ăâîșț') && document.fonts.check('700 16px \"Baloo 2\"', 'ăâîșț')")
    run.check(fonts, f"[{vp}] fonturile Andika și Baloo 2 sunt încărcate")
    # butonul de sunet: pornit implicit, oprirea se ține minte
    toggle = page.get_by_test_id("sound-toggle")
    was_on = toggle.get_attribute("aria-pressed") == "true"
    toggle.click()
    off = toggle.get_attribute("aria-pressed") == "false" and page.evaluate("localStorage.getItem('cifruta:sound')") == '"off"'
    page.reload()
    page.wait_for_selector("[data-testid=sound-toggle]")
    kept = page.get_by_test_id("sound-toggle").get_attribute("aria-pressed") == "false"
    page.get_by_test_id("sound-toggle").click()
    run.check(was_on and off and kept and page.get_by_test_id("sound-toggle").get_attribute("aria-pressed") == "true", f"[{vp}] sunetele sunt pornite implicit, se opresc din antet și starea se ține minte")


def watch_pops(page: Page, selector: str):
    """Numără de câte ori un element de sub `selector` primește clasa anim-pop (clasa ține doar ~300 ms)."""
    page.evaluate(
        """(sel) => { window.__pops = 0; new MutationObserver((ms) => { for (const m of ms) if (m.target.classList.contains('anim-pop')) window.__pops++; })
          .observe(document.querySelector(sel), { attributes: true, attributeFilter: ['class'], subtree: true }); }""",
        selector,
    )


def types_flow(run: Run, page: Page, vp: str):
    """Gesturi reale pe fiecare tip din #/atelier/tipuri; verifică evaluarea cu __dbg."""
    run.goto(page, "atelier/tipuri", debug=True)
    page.wait_for_selector("[data-testid=demo-money]")
    touch = VIEWPORTS[vp].get("has_touch", False)
    tap = (lambda sel: page.locator(sel).first.tap()) if touch else (lambda sel: page.locator(sel).first.click())
    tid = lambda t: f"[data-testid='{t}']"
    pops = lambda: page.evaluate("window.__pops")
    no_pop_class = re.compile(r"\banim-pop\b")

    def typing(ex, values):
        box = page.locator(tid(f"demo-{ex}"))
        for blank, value in values.items():
            box.locator(tid(f"blank-{blank}")).fill(str(value))

    def ok(ex):
        res = page.evaluate(f"window.__dbg.evaluate('{ex}')")
        run.check(abs(res["earned"] - res["total"]) < 1e-9, f"[{vp}] tip {ex}: gesturile dau punctaj maxim ({res['earned']}/{res['total']})")

    tap(f"{tid('demo-choice')} {tid('opt-i1-50')}")
    tap(f"{tid('demo-choice')} {tid('opt-i1-triunghi')}")
    tap(f"{tid('demo-choice')} {tid('opt-i1-cerc')}")
    ok("choice")

    tap(tid("tf-i1-A")); tap(tid("tf-i2-F")); ok("truefalse")

    blank = page.locator(f"{tid('demo-fill')} {tid('blank-a')}")
    blank.press_sequentially("1000")
    run.check(page.evaluate("window.__dbg.answer('fill').a.a") == "1000", f"[{vp}] caseta numerică acceptă 1000")
    blank.fill("")
    typing("fill", {"a": 69, "b": 24})
    box = f"{tid('demo-fill')} "
    tap(box + tid("seg-c-<")); tap(box + tid("seg-d-=")); tap(box + tid("seg-e-−")); ok("fill")

    typing("fill-tree", {"a": 40, "b": 7, "c": 80, "d": 0}); ok("fill-tree")

    watch_pops(page, tid("demo-categorize"))
    tap(tid("item-vaca")); tap(tid("bin-dom"))
    if touch:
        tap(tid("item-lup")); tap(tid("bin-sal"))
    else:
        page.locator(tid("item-lup")).drag_to(page.locator(tid("bin-sal")))
    tap(tid("item-oaie")); tap(tid("bin-dom"))
    tap(tid("item-urs")); tap(tid("bin-sal"))
    ok("categorize")
    run.check(pops() >= 4, f"[{vp}] sortare: fiecare element pus în coș face pop ({pops()} pop-uri)")
    expect(page.locator(tid("item-vaca"))).not_to_have_class(no_pop_class)
    run.check(True, f"[{vp}] sortare: clasa anim-pop dispare după animație")

    for s in ("s1", "s3", "s5"):
        tap(tid(f"mark-{s}"))
    ok("mark")

    for _ in range(4):
        tap(tid("abacus-i1-Z-plus"))
    for _ in range(6):
        tap(tid("abacus-i1-U-plus"))
    ok("build")
    beads = page.evaluate("""() => {
      const pic = document.querySelector("[data-testid='demo-build'] .ex-abacus__art");
      const fresh = pic.querySelector('.v-abacus__bead.is-new');
      return { z: pic.querySelectorAll('.v-abacus__bead[data-rod=Z]').length, u: pic.querySelectorAll('.v-abacus__bead[data-rod=U]').length,
               fresh: fresh && [fresh.dataset.rod, fresh.dataset.i, getComputedStyle(fresh).animationName] };
    }""")
    run.check(beads == {"z": 4, "u": 6, "fresh": ["U", "5", "anim-drop"]}, f"[{vp}] numărătoare: 4 și 6 bile, ultima bilă cade pe tijă ({beads})")

    typing("fill-table", {"a": 61}); ok("fill-table")
    typing("fill-chain", {"a": 43, "b": 34, "c": 34}); ok("fill-chain")

    tap(tid("left-l1")); tap(tid("right-r42"))
    if touch:
        tap(tid("left-l2")); tap(tid("right-r54"))
    else:
        page.locator(tid("left-l2")).drag_to(page.locator(tid("right-r54")))
    tap(tid("left-l3")); tap(tid("right-r84"))
    ok("match")

    key = ["v2", "v6", "v4", "v7", "v1", "v5", "v3"]
    for i, want in enumerate(key):
        current = page.locator(f"{tid('demo-order')} .ex-order__card").evaluate_all("els => els.map(e => e.dataset.id)")
        if current[i] != want:
            tap(tid(f"order-{want}"))
            tap(tid(f"order-{current[i]}"))
    ok("order")

    # slider pe axă: atingeri pe liniuțele desenate (poziția lor se citește din desen), tragere, tastatură
    page.locator(f"{tid('demo-slider')} .ex-slider__art").scroll_into_view_if_needed()
    axis = lambda: page.evaluate("""() => {
      const svg = document.querySelector("[data-testid='demo-slider'] .ex-slider__art svg");
      const line = svg.querySelector('line').getBoundingClientRect();
      const labels = Object.fromEntries([...svg.querySelectorAll('text')].map((t) => { const r = t.getBoundingClientRect(); return [t.textContent, r.left + r.width / 2]; }));
      return { y: line.top + line.height / 2, labels };
    }""")
    slider = lambda: page.evaluate("window.__dbg.answer('slider').a?.i1 ?? null")
    press = page.touchscreen.tap if touch else page.mouse.click
    for label in ("0", "50", "100"):
        geo = axis()
        press(geo["labels"][label], geo["y"])
        got = slider()
        run.check(got is not None and abs(got - int(label)) <= 1, f"[{vp}] slider: atingerea liniuței {label} dă {got}")
    if not touch:
        geo = axis()
        page.mouse.move(geo["labels"]["0"], geo["y"])
        page.mouse.down()
        page.mouse.move(geo["labels"]["50"], geo["y"], steps=8)
        page.mouse.up()
        got = slider()
        run.check(got is not None and abs(got - 50) <= 1, f"[{vp}] slider: tragerea cu mouse-ul până la 50 dă {got}")
    page.locator(tid("slider-i1")).focus()
    before = slider()
    page.keyboard.press("ArrowLeft")
    run.check(slider() == before - 1, f"[{vp}] slider: săgeata stânga mută cu 1 ({before} → {slider()})")
    geo = axis()
    press(geo["labels"]["0"] + (geo["labels"]["100"] - geo["labels"]["0"]) * 0.48, geo["y"])
    ok("slider")

    tap(tid("brush-verde")); tap(tid("mark-soare")); tap(tid("mark-vant"))
    tap(tid("brush-rosu")); tap(tid("mark-carbune")); tap(tid("mark-petrol"))
    ok("mark-palette")

    for _ in range(3):
        tap(tid("clock-i1-h-minus"))
    tap(tid("clock-i1-m-plus"))
    hands = page.evaluate("[...document.querySelectorAll(\"[data-testid='demo-clock'] .v-clock__hand\")].map((g) => g.style.transform)")
    run.check(hands == ["rotate(-75deg)", "rotate(-900deg)"], f"[{vp}] ceas: acele se rotesc pe loc, în direcția butonului ({hands})")
    ok("clock")

    typing("fill-steps", {"a": 12, "b": 18, "c": 30, "d": 30, "e": 15, "f": 15}); ok("fill-steps")

    watch_pops(page, tid("wallet-f1"))
    for note in (10, 1, 1):
        tap(tid(f"note-{note}"))
    run.check(pops() >= 6, f"[{vp}] bani: bancnota pusă și suma fac pop ({pops()} pop-uri)")
    page.locator(tid("wallet-f2")).click(position={"x": 20, "y": 20})
    for note in (5, 5, 1, 1):
        tap(tid(f"note-{note}"))
    ok("money")

    for ex in ("choice", "match", "order", "money"):
        page.locator(tid(f"demo-check-{ex}")).click()
    page.wait_for_timeout(500)
    run.shot(page, f"{vp}-atelier-tipuri-rezolvat")


def pages_flow(run: Run, page: Page, test: dict, vp: str):
    """Ciorna la deschidere, rezultatele unei versiuni vechi a testului, schimbarea rapidă de rută."""
    tid, sid = test["id"], test["section"]
    run.goto(page, f"test/{tid}")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_selector("[data-testid=start]")
    run.check(page.evaluate(f"localStorage.getItem('cifruta:draft:{tid}')") is None, f"[{vp}] {tid}: simpla deschidere a testului nu creează ciornă")

    old = {"id": f"{tid}-vechi", "testId": tid, "testVersion": 0, "seed": 1, "score": 77, "grade": "B", "activeMs": 600000,
           "msByExercise": {}, "answers": {}, "levels": {"usor": {"fraction": 1, "star": True}}, "concepts": {}, "exercises": {},
           "feeling": None, "secondChance": {}}
    page.evaluate("a => localStorage.setItem('cifruta:attempts', JSON.stringify([a]))", old)
    run.goto(page, f"rezultate/{tid}")
    page.wait_for_selector("[data-testid=score]")
    expect(page.get_by_test_id("score")).to_have_text(re.compile(r"^77\s*/\s*100$"))
    run.check(page.get_by_test_id("score").get_attribute("data-value") == "77", f"[{vp}] {tid}: versiune veche → scorul salvat (77)")
    run.check(page.get_by_test_id("old-version").is_visible() and page.get_by_test_id("review-list").count() == 0, f"[{vp}] {tid}: versiune veche → mesajul de actualizare, fără lista pe exerciții")
    run.shot(page, f"{vp}-{tid}-versiune-veche")

    # rezultatele încă se încarcă (fișierul testului întârzie), dar utilizatorul a ajuns deja pe pagina secțiunii
    run.goto(page, f"sectiune/{sid}")
    page.reload()  # golește modulele încărcate, ca testul să fie descărcat din nou
    page.wait_for_load_state("networkidle")
    page.route("**/data/tests/**", lambda route: (time.sleep(1), route.continue_()))
    page.evaluate(f"location.hash = '#/rezultate/{tid}'; setTimeout(() => {{ location.hash = '#/sectiune/{sid}'; }}, 300)")
    page.wait_for_timeout(1500)
    page.wait_for_load_state("networkidle")
    page.unroute("**/data/tests/**")
    run.check(page.get_by_test_id("summary").count() == 0 and page.get_by_test_id(f"test-card-{tid}").is_visible(), f"[{vp}] {tid}: schimbarea rapidă de rută nu lasă rezultatele peste pagina secțiunii")

    # de pe pagina principală se pot șterge toate rezultatele, din toate secțiunile
    run.goto(page, "")
    page.wait_for_selector("[data-testid=parents]")
    page.locator("[data-testid=parents] summary").click()
    page.get_by_test_id("clear-all").click()
    expect(page.get_by_test_id("modal-confirm")).to_be_visible()
    page.get_by_test_id("modal-confirm").click()
    page.wait_for_timeout(300)
    run.check(page.evaluate("localStorage.getItem('cifruta:attempts')") == "[]" and page.get_by_test_id("clear-all").count() == 0, f"[{vp}] „Șterge toate rezultatele” golește istoricul din toate secțiunile")
    page.evaluate("localStorage.clear()")


def test_flow(run: Run, page: Page, test: dict, vp: str):
    tid = test["id"]
    run.goto(page, f"test/{tid}", debug=True)
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_load_state("networkidle")
    run.shot(page, f"{vp}-{tid}-intro")
    scene = page.evaluate("(() => { const g = document.querySelector(\".ex-intro__scene [class^='v-scene__']\"); return g ? getComputedStyle(g).animationPlayState : 'lipsă'; })()")
    run.check(scene == "running" and page.get_by_test_id("finish-top").is_hidden(), f"[{vp}] {tid}: pe intro peisajul se mișcă ({scene}) și „Vezi rezultatele” e ascuns")
    page.get_by_test_id("start").click()
    page.wait_for_selector(".ex-card")
    run.shot(page, f"{vp}-{tid}-ex1")
    run.layout_ok(page, f"[{vp}] {tid} exercițiul 1")

    # ecranul dintre niveluri apare după ultimul exercițiu ușor
    easy = page.locator(".c-progress__group[data-level='usor'] .c-progress__dot").count()
    for _ in range(easy):
        page.get_by_test_id("next").click()
        page.wait_for_selector(".ex-card, [data-testid=level-break]")
    run.check(page.get_by_test_id("level-break").is_visible(), f"[{vp}] {tid}: ecranul dintre niveluri apare după nivelul ușor")
    run.check(page.locator(".ex-break__icon").count() == 1 and page.locator(".anim-confetti").count() == 1, f"[{vp}] {tid}: pauza arată iconița nivelului următor și confetti")
    page.get_by_test_id("continue").click()
    page.wait_for_selector(".ex-card")
    run.check(page.locator(".c-progress__dot.is-current").inner_text() == str(easy + 1), f"[{vp}] {tid}: după pauză continuă cu exercițiul {easy + 1}")

    # răspunsuri corecte → 100
    page.evaluate("window.__dbg.fillCorrect()")
    page.wait_for_timeout(200)
    dots = page.locator(".c-progress__dot.is-done").count()
    run.check(dots == test["exercises"], f"[{vp}] {tid}: toate bulinele sunt „terminat” ({dots} din {test['exercises']})")
    ready = page.evaluate("[document.querySelector('[data-testid=next], [data-testid=finish]').classList.contains('is-ready'), getComputedStyle(document.querySelector('.c-progress__dot.is-done')).animationName]")
    run.check(ready == [True, "anim-pop"], f"[{vp}] {tid}: butonul de mers mai departe se anunță și bulina terminată face pop ({ready})")
    page.reload()
    page.wait_for_selector(".ex-card")
    run.check(page.locator(".c-progress__dot.is-done").count() == dots, f"[{vp}] {tid}: ciorna se păstrează după reîncărcare")
    page.get_by_test_id("finish-top").click()
    page.wait_for_selector("[data-testid=score]")
    expect(page.get_by_test_id("score")).to_have_text(re.compile(r"^100\s*/\s*100$"))
    run.check(page.get_by_test_id("score").get_attribute("data-value") == "100", f"[{vp}] {tid}: toate corecte → scor 100 (numărat până la final)")
    expect(page.locator(".anim-confetti")).to_have_count(1)
    run.check(True, f"[{vp}] {tid}: confetti la scor mare")
    page.wait_for_selector(".ex-review__item")
    page.wait_for_timeout(600)
    run.shot(page, f"{vp}-{tid}-rezultate-100")

    # după trimitere ciorna nu mai există, iar testul se redeschide de la început
    draft = page.evaluate(f"localStorage.getItem('cifruta:draft:{tid}')")
    run.check(draft is None, f"[{vp}] {tid}: ciorna e ștearsă după trimitere")
    run.goto(page, f"test/{tid}", debug=True)
    page.wait_for_selector("[data-testid=start], .ex-card")
    run.check(page.get_by_test_id("start").count() == 1 and page.locator(".ex-card").count() == 0, f"[{vp}] {tid}: redeschis după trimitere, testul pornește de la intro")
    run.goto(page, f"rezultate/{tid}", debug=True)
    page.wait_for_selector("[data-testid=retake]")

    # gol → fereastra de confirmare → 10
    page.get_by_test_id("retake").click()
    page.wait_for_selector("[data-testid=start]")
    page.get_by_test_id("start").click()
    page.wait_for_selector(".ex-card")
    page.get_by_test_id("finish-top").click()
    expect(page.get_by_test_id("modal-confirm")).to_be_visible()
    run.shot(page, f"{vp}-{tid}-fereastra")
    page.get_by_test_id("modal-confirm").click()
    page.wait_for_selector("[data-testid=score]")
    expect(page.get_by_test_id("score")).to_have_text(re.compile(r"^10\s*/\s*100$"))
    run.check(page.get_by_test_id("score").get_attribute("data-value") == "10", f"[{vp}] {tid}: fără răspunsuri → scor 10")
    page.wait_for_selector(".ex-review__item")
    if page.locator(".ex-tf__row").count():
        row = page.locator(".ex-tf__row").first
        run.check("is-wrong" in (row.get_attribute("class") or "") and "Nu ai ales" in row.inner_text(), f"[{vp}] {tid}: afirmația A/F sărită apare greșită, cu „Nu ai ales.”")

    # „Mai încerc o dată” pe primul exercițiu
    first = page.locator(".ex-review__item").first.get_attribute("data-testid").replace("review-", "")
    page.get_by_test_id(f"retry-{first}").click()
    page.get_by_test_id(f"retry-check-{first}").click()
    run.check(page.locator(f"[data-testid=review-{first}] .ex-review__retry .c-callout").count() >= 1, f"[{vp}] {tid}: „Mai încerc o dată” afișează verdictul")
    solved = page.locator(".ex-card[data-mode='solution']").count()
    page.locator(".ex-review__item").first.locator("summary").click()
    page.wait_for_selector(".ex-card[data-mode='solution']")
    run.check(solved == 0 and page.locator(".ex-card[data-mode='solution']").count() == 1, f"[{vp}] {tid}: „Rezolvarea” se montează la deschidere, cu aspect propriu")
    run.layout_ok(page, f"[{vp}] {tid} rezultate")

    # părinții pot șterge istoricul testului din pagina secțiunii (două încercări: 100 și 10)
    run.goto(page, f"sectiune/{test['section']}")
    page.wait_for_selector("[data-testid=parents]")
    page.locator("[data-testid=parents] summary").click()
    row = page.locator("[data-testid=parents] .c-history__row").filter(has=page.get_by_test_id(f"clear-test-{tid}")).inner_text()
    page.get_by_test_id(f"clear-test-{tid}").click()
    expect(page.get_by_test_id("modal-confirm")).to_be_visible()
    page.get_by_test_id("modal-confirm").click()
    page.wait_for_selector(f"[data-testid=test-card-{tid}]")
    page.wait_for_timeout(300)
    left = page.evaluate(f"JSON.parse(localStorage.getItem('cifruta:attempts') || '[]').filter((a) => a.testId === '{tid}').length")
    card = page.get_by_test_id(f"test-card-{tid}").inner_text()
    run.check("2 încercări" in row and left == 0 and "nou" in card and page.get_by_test_id(f"clear-test-{tid}").count() == 0, f"[{vp}] {tid}: ștergerea istoricului din „Pentru părinți” golește încercările ({row!r})")


def keyboard_flow(run: Run, browser, base: str):
    """Doar tastatura + animații reduse: pornește T1, răspunde la primul exercițiu, trece mai departe."""
    context = browser.new_context(locale="ro-RO", reduced_motion="reduce", viewport={"width": 1280, "height": 800})
    page = context.new_page()
    run.watch(page, "tastatură")
    tests = [t for t in catalog_tests() if t["id"].startswith("recap-")]
    if not tests:
        context.close()
        return
    page.goto(f"{base}?debug=1#/test/{tests[0]['id']}")
    page.wait_for_selector("[data-testid=start]")
    run.check(page.get_by_test_id("sound-toggle").get_attribute("aria-pressed") == "false", "[tastatură] la mișcare redusă sunetele pornesc oprite")
    page.get_by_test_id("start").focus()
    page.keyboard.press("Enter")
    page.wait_for_selector(".ex-card")
    first = page.locator(".ex-card button:not([disabled])").first
    first.focus()
    page.keyboard.press("Space")
    pressed = page.evaluate("document.activeElement && (document.activeElement.getAttribute('aria-pressed') === 'true' || document.activeElement.getAttribute('aria-checked') === 'true')")
    run.check(bool(pressed), "[tastatură] un element se poate alege cu Space")
    duration = page.evaluate("getComputedStyle(document.querySelector('.ex-card')).animationDuration")
    run.check(duration in ("0.001s", "1e-06s", "0s"), f"[tastatură] animațiile sunt reduse (durată {duration})")
    # la mișcare redusă scorul e final imediat și nu cade confetti
    page.evaluate("window.__dbg.fillCorrect()")
    page.wait_for_timeout(200)
    page.get_by_test_id("finish-top").click()
    page.wait_for_selector("[data-testid=score]")
    score = page.get_by_test_id("score").inner_text()
    page.wait_for_timeout(800)
    run.check(re.match(r"^100\s*/\s*100$", score) is not None and page.locator(".anim-confetti").count() == 0, f"[tastatură] la mișcare redusă scorul e final imediat ({score!r}) și fără confetti")
    watch_pops(page, ".c-feel")
    page.get_by_test_id("feel-vesel").click()
    run.check(page.evaluate("window.__pops") >= 1, "[tastatură] „Cum te-ai simțit?” face pop la alegere")

    # în atelier: un element iese din coș, o bancnotă iese din portofel, cardul mutat păstrează focusul
    page.goto(f"{base}?debug=1#/atelier/tipuri")
    page.wait_for_selector("[data-testid=demo-money]")

    def key(selector, name):
        page.locator(selector).first.focus()
        page.keyboard.press(name)

    answer = lambda ex: page.evaluate(f"window.__dbg.answer('{ex}').a ?? null")
    key("[data-testid=item-vaca]", "Space")
    key("[data-testid=bin-dom]", "Enter")
    in_bin = (answer("categorize") or {}).get("vaca")
    key("[data-testid=bin-dom] [data-testid=item-vaca]", "Space")
    key("[data-testid=tray]", "Enter")
    back = (answer("categorize") or {}).get("vaca")
    run.check(in_bin == "dom" and back is None, f"[tastatură] un element intră în coș și se scoate înapoi pe tavă ({in_bin} → {back})")
    expect(page.locator("[data-testid=item-vaca]")).not_to_have_class(re.compile(r"\banim-pop\b"))
    run.check(True, "[tastatură] la mișcare redusă clasa anim-pop tot dispare")

    key("[data-testid=note-10]", "Enter")
    added = (answer("money") or {}).get("f1", {}).get("10")
    key("[data-testid=wallet-f1] .ex-piece", "Enter")
    left = (answer("money") or {}).get("f1", {}).get("10")
    in_wallet = page.evaluate("!!document.activeElement?.closest('[data-testid=wallet-f1]')")
    run.check(added == 1 and not left and in_wallet, f"[tastatură] o bancnotă se scoate din portofel, focusul rămâne în portofel ({added} → {left})")

    cards = lambda: page.locator("[data-testid=demo-order] .ex-order__card").evaluate_all("els => els.map((e) => e.dataset.id)")
    first, third = cards()[0], cards()[2]
    key(f"[data-testid=order-{first}]", "Space")
    key(f"[data-testid=order-{third}]", "Space")
    focused = page.evaluate("document.activeElement?.dataset.id ?? null")
    run.check(cards().index(first) == 2 and focused == first, f"[tastatură] cardul mutat ajunge pe locul 3 și păstrează focusul (focus pe {focused})")
    context.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="rulează doar testul cu acest id")
    parser.add_argument("--shots", action="store_true", help="salvează capturi în test-results/")
    parser.add_argument("--base-url", help="testează un site publicat în loc de serverul local")
    parser.add_argument("--viewports", default="laptop,tableta,telefon")
    args = parser.parse_args()

    httpd, base = (None, args.base_url) if args.base_url else serve()
    run = Run(base if base.endswith("/") else base + "/", args.shots)
    tests = [t for t in catalog_tests() if not args.only or t["id"] == args.only]

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for vp in args.viewports.split(","):
            print(f"\n— {vp} —")
            context = browser.new_context(locale="ro-RO", **VIEWPORTS[vp])
            page = context.new_page()
            run.watch(page, vp)
            if not args.only:
                smoke(run, page, vp)
                types_flow(run, page, vp)
            if tests:
                pages_flow(run, page, tests[0], vp)
            for test in tests:
                test_flow(run, page, test, vp)
            context.close()
        if not args.only:
            keyboard_flow(run, browser, run.base)
        browser.close()
    if httpd:
        httpd.shutdown()

    print(f"\n{run.passed} verificări trecute, {len(run.failures)} eșuate")
    for f in run.failures:
        print(f"  ✖ {f}")
    return 1 if run.failures else 0


if __name__ == "__main__":
    sys.exit(main())
