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

from playwright.sync_api import Page, expect, sync_playwright, TimeoutError as PlaywrightTimeoutError

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
    for route, name in [("", "acasa"), ("sectiune/recapitulare", "sectiune"), ("fulger", "calcul-fulger"), ("fulger/adunari-scaderi-100", "calcul-fulger-tema"), ("fulger/siruri-intrusi", "fulger-siruri-intrusi"), ("atelier/fulger", "atelier-fulger"), ("atelier/componente", "atelier-componente"), ("atelier/vizualuri", "atelier-vizualuri"), ("atelier/tipuri", "atelier-tipuri"), ("atelier/avatare", "atelier-avatare"), ("nu-exista", "404")]:
        run.goto(page, route)
        page.wait_for_function("document.querySelector('main')?.innerText.trim().length > 0")
        page.wait_for_timeout(300)
        run.check(page.locator("main").inner_text().strip() != "", f"[{vp}] pagina „{name}” are conținut")
        run.layout_ok(page, f"[{vp}] {name}")
        run.shot(page, f"{vp}-{name}")
        if name == "sectiune":
            # dacă desenul nu s-a încărcat (de ex. rețea căzută), verificarea eșuează în loc să oprească toată suita
            state = page.evaluate("(() => { const g = document.querySelector(\".c-card__media [class^='v-scene__']\"); return g ? getComputedStyle(g).animationPlayState : 'lipsă'; })()")
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

    answer = lambda ex: page.evaluate(f"window.__dbg.answer('{ex}').a ?? null")
    # reguli de set: orice selecție bună (≥ 2 jucării, cel mult 100 de lei) ia tot creditul
    for s in ("p1", "p2", "p4"):
        tap(tid(f"mark-{s}"))
    ok("mark-rules")

    # traseu: o stație neadiacentă e refuzată, apoi Gara → Piața Mare → Teatrul; „o stație înapoi” scoate ultima
    tap(tid("stop-parc"))
    tap(tid("stop-piata")); tap(tid("stop-teatru"))
    page.wait_for_timeout(150)
    pressed = page.locator(tid("stop-teatru")).get_attribute("aria-pressed") == "true"
    full = answer("route")
    tap(tid("route-undo"))
    page.wait_for_timeout(150)
    shorter = answer("route")
    run.check(pressed and full == ["gara", "piata", "teatru"] and shorter == ["gara", "piata"], f"[{vp}] traseu: stațiile atinse în ordine dau {full}, iar „o stație înapoi” lasă {shorter}")
    tap(tid("stop-teatru"))
    ok("route")

    # grafic construit: barele urcă cu +, valoarea e anunțată prin aria-valuenow
    for _ in range(3):
        tap(tid("bar-mere-plus"))
    for _ in range(2):
        tap(tid("bar-pere-plus"))
    for _ in range(5):
        tap(tid("bar-banane-plus"))
    tap(tid("bar-banane-minus"))
    run.check(page.locator(tid("bar-banane")).get_attribute("aria-valuenow") == "4", f"[{vp}] grafic: + și − schimbă bara și aria-valuenow")
    ok("chart")

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
    page.wait_for_timeout(100)
    linked = page.locator(tid("left-l3")).get_attribute("aria-label") or ""
    run.check("unit cu" in linked and page.locator(".ex-match__line").count() == 3 and page.locator(".ex-match__line--new").count() == 1, f"[{vp}] unire: perechea e anunțată („{linked}”), iar dintre cele 3 linii doar ultima se desenează animat")
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

    for ex in ("choice", "match", "order", "money", "mark-rules", "route", "chart"):
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

    # stocarea nu mai scrie (plină sau blocată): rezultatul se vede oricum, cu un mesaj, iar ciorna rămâne
    run.goto(page, f"test/{tid}", debug=True)
    page.wait_for_selector("[data-testid=start]")
    page.get_by_test_id("start").click()
    page.wait_for_selector(".ex-card")
    page.evaluate("window.__dbg.fillCorrect()")
    page.wait_for_timeout(200)
    page.evaluate("void (Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); })")
    page.evaluate("window.__dbg.submit()")
    page.wait_for_selector("[data-testid=score]")
    kept = page.evaluate(f"localStorage.getItem('cifruta:draft:{tid}') !== null")
    run.check(page.get_by_test_id("unsaved").is_visible() and page.get_by_test_id("score").get_attribute("data-value") == "100" and kept, f"[{vp}] {tid}: când stocarea nu scrie, rezultatul se afișează cu un mesaj, iar ciorna rămâne")
    page.reload()  # readuce setItem
    page.evaluate("localStorage.clear()")

    # intro-ul e punctul de plecare: părinții văd ciorna pe pagina secțiunii, iar „Reîncepe de la zero” o șterge
    run.goto(page, f"test/{tid}", debug=True)
    page.get_by_test_id("start").click()
    page.wait_for_selector(".ex-card")
    page.evaluate("window.__dbg.fillCorrect()")
    page.wait_for_timeout(200)
    run.goto(page, f"sectiune/{sid}")
    page.wait_for_selector("[data-testid=parents]")
    page.locator("[data-testid=parents] summary").click()
    had_draft = page.get_by_test_id(f"draft-{tid}").is_visible()
    page.get_by_test_id(f"clear-draft-{tid}").click()
    expect(page.get_by_test_id("modal-confirm")).to_be_visible()
    page.get_by_test_id("modal-confirm").click()
    page.wait_for_timeout(300)
    run.check(had_draft and page.evaluate(f"localStorage.getItem('cifruta:draft:{tid}')") is None and page.get_by_test_id(f"draft-{tid}").count() == 0, f"[{vp}] {tid}: ciorna apare în „Pentru părinți” pe pagina secțiunii și se poate șterge separat")
    run.goto(page, f"test/{tid}", debug=True)
    page.get_by_test_id("start").click()
    page.wait_for_selector(".ex-card")
    page.evaluate("window.__dbg.fillCorrect()")
    page.wait_for_timeout(200)
    page.reload()
    page.wait_for_selector("[data-testid=restart]")
    page.get_by_test_id("restart").click()
    expect(page.get_by_test_id("modal-confirm")).to_be_visible()
    page.get_by_test_id("modal-confirm").click()
    page.wait_for_selector(".ex-card")
    run.check(page.locator(".c-progress__dot.is-done").count() == 0 and page.locator(".c-progress__dot.is-current").inner_text() == "1" and page.evaluate("Object.keys(window.__dbg.answers()).length") == 0, f"[{vp}] {tid}: „Reîncepe de la zero” pornește o ciornă nouă de la exercițiul 1")
    page.evaluate("localStorage.clear()")


def test_flow(run: Run, page: Page, test: dict, vp: str):
    tid = test["id"]
    run.goto(page, f"test/{tid}", debug=True)
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_load_state("networkidle")
    run.shot(page, f"{vp}-{tid}-intro")
    scene = page.evaluate("(() => { const g = document.querySelector(\".ex-intro__scene [class^='v-scene__']\"); return g ? getComputedStyle(g).animationPlayState : 'lipsă'; })()")
    run.check(scene == "running" and page.get_by_test_id("finish-top").is_hidden() and page.get_by_test_id("countdown").is_hidden(), f"[{vp}] {tid}: pe intro peisajul se mișcă ({scene}), „Vezi rezultatele” și cronometrul sunt ascunse")
    page.get_by_test_id("start").click()
    page.wait_for_selector(".ex-card")
    run.shot(page, f"{vp}-{tid}-ex1")
    run.layout_ok(page, f"[{vp}] {tid} exercițiul 1")

    # ecranul dintre niveluri: neutru când au rămas exerciții neterminate (fără confetti), „Bravo!” când nivelul e gata
    easy = page.locator(".c-progress__group[data-level='usor'] .c-progress__dot").count()
    for _ in range(easy):
        page.get_by_test_id("next").click()
        page.wait_for_selector(".ex-card, [data-testid=level-break]")
    brk = page.get_by_test_id("level-break")
    run.check(brk.is_visible() and brk.get_attribute("data-variant") == "neutru" and page.locator(".anim-confetti").count() == 0, f"[{vp}] {tid}: după exerciții sărite, pauza dintre niveluri e neutră, fără confetti")
    run.shot(page, f"{vp}-{tid}-pauza-neutra")
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
    page.evaluate(f"window.__dbg.resetBreaks(); window.__dbg.goto({easy - 1})")
    expect(page.locator(".c-progress__dot.is-current")).to_have_text(str(easy))
    page.get_by_test_id("next").click()
    page.wait_for_selector("[data-testid=level-break]")
    brk = page.get_by_test_id("level-break")
    run.check(brk.get_attribute("data-variant") == "bravo" and page.locator(".ex-break__icon").count() == 1 and page.locator(".anim-confetti").count() == 1, f"[{vp}] {tid}: cu nivelul ușor terminat, pauza sărbătorește cu iconița nivelului următor și confetti")
    page.get_by_test_id("continue").click()
    page.wait_for_selector(".ex-card")
    cur = page.locator(".c-progress__dot.is-current").inner_text()
    page.reload()
    page.wait_for_selector("[data-testid=start]")
    resumed = page.get_by_test_id("start").inner_text().strip() == "Continuă testul" and page.get_by_test_id("restart").count() == 1
    run.shot(page, f"{vp}-{tid}-intro-reluare")
    page.get_by_test_id("start").click()
    page.wait_for_selector(".ex-card")
    run.check(resumed and page.locator(".c-progress__dot.is-done").count() == dots and page.locator(".c-progress__dot.is-current").inner_text() == cur, f"[{vp}] {tid}: după reîncărcare, intro-ul oferă „Continuă testul” și reia de la exercițiul {cur}, cu ciorna păstrată")
    # cronometrul discret: pornește de la 45:00, se golește cu timpul lucrat, avertizează la 5 minute, se oprește la 0 fără să trimită
    countdown = page.get_by_test_id("countdown")
    live = countdown.locator("[aria-live]")
    shown = countdown.inner_text().split("\n")[0].strip()
    mm, ss = map(int, shown.split(":"))
    page.evaluate(f"window.__dbg.elapse({(mm * 60 + ss) * 1000 - 5 * 60000 - 3000})")  # 5:03 (marjă pentru secundele care trec între pași)
    early = "is-low" not in (countdown.get_attribute("class") or "") and live.inner_text() == ""
    page.evaluate("window.__dbg.elapse(3000)")  # 5:00
    low = "is-low" in (countdown.get_attribute("class") or "") and live.inner_text() == "Mai ai 5 minute."
    page.evaluate("window.__dbg.elapse(5 * 60000)")
    over = "is-over" in (countdown.get_attribute("class") or "") and countdown.inner_text().startswith("0:00") and live.inner_text().startswith("Timpul estimat a trecut")
    run.check(re.match(r"^4[45]:\d\d$", shown) is not None and early and low and over and page.locator(".ex-card").count() == 1, f"[{vp}] {tid}: cronometrul pornește de la {shown}, anunță exact la 5:00 și la 0:00 și nu trimite testul ({early}, {low}, {over})")
    page.get_by_test_id("finish-top").click()
    page.wait_for_selector("[data-testid=score]")
    expect(page.get_by_test_id("score")).to_have_text(re.compile(r"^100\s*/\s*100$"))
    run.check(page.get_by_test_id("score").get_attribute("data-value") == "100", f"[{vp}] {tid}: toate corecte → scor 100 (numărat până la final)")
    expect(page.locator(".anim-confetti")).to_have_count(1)
    run.check(True, f"[{vp}] {tid}: confetti la scor mare")
    page.wait_for_selector(".ex-review__item")
    page.wait_for_timeout(600)
    run.shot(page, f"{vp}-{tid}-rezultate-100")
    if page.locator(".ex-word").count():
        run.check(page.locator(".ex-order__tag").count() == page.locator(".ex-word__letter").count(), f"[{vp}] {tid}: la rezultate, cardurile cuvântului secret își arată literele")

    # după trimitere ciorna nu mai există, iar testul se redeschide de la început
    draft = page.evaluate(f"localStorage.getItem('cifruta:draft:{tid}')")
    run.check(draft is None, f"[{vp}] {tid}: ciorna e ștearsă după trimitere")
    run.goto(page, f"test/{tid}", debug=True)
    page.wait_for_selector("[data-testid=start], .ex-card")
    run.check(page.get_by_test_id("start").count() == 1 and page.locator(".ex-card").count() == 0 and page.get_by_test_id("restart").count() == 0, f"[{vp}] {tid}: redeschis după trimitere, testul pornește de la intro")
    page.get_by_test_id("see-results").click()
    page.wait_for_selector("[data-testid=retake]")
    run.check(page.get_by_test_id("score").get_attribute("data-value") == "100", f"[{vp}] {tid}: „Vezi rezultatele ultimei încercări” de pe intro deschide rezultatele")

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

    # lista încercărilor din „Pentru părinți”: fiecare se poate deschide pe ruta ei
    page.locator("[data-testid=parents] summary").click()
    rows = page.locator("[data-testid^=attempt-]").count()
    page.locator("[data-testid^=see-attempt-]").first.click()
    # pe site-ul publicat, pagina veche (scor 10) rămâne în DOM cât se încarcă încercarea cerută: așteptăm chiar valoarea 100
    try:
        page.wait_for_function("document.querySelector('[data-testid=score]')?.dataset.value === '100'", timeout=15000)
        opened = True
    except PlaywrightTimeoutError:
        opened = False
    run.check(rows == 2 and opened, f"[{vp}] {tid}: lista încercărilor are {rows} rânduri, iar „Vezi” deschide încercarea cu 100")
    run.goto(page, f"rezultate/{tid}", debug=True)
    page.wait_for_selector(".ex-review__item")

    # „Mai încerc o dată” pe primul exercițiu
    first = page.locator(".ex-review__item").first.get_attribute("data-testid").replace("review-", "")
    page.get_by_test_id(f"retry-{first}").click()
    page.get_by_test_id(f"retry-check-{first}").click()
    run.check(page.locator(f"[data-testid=review-{first}] .ex-review__retry .c-callout").count() >= 1, f"[{vp}] {tid}: „Mai încerc o dată” afișează verdictul")
    page.get_by_test_id(f"retry-again-{first}").click()
    page.wait_for_selector(f"[data-testid=retry-check-{first}]")
    run.check(page.locator(f"[data-testid=retry-check-{first}]").count() == 1 and page.locator(f"[data-testid=review-{first}] .ex-review__retry").count() == 1, f"[{vp}] {tid}: după un verdict greșit, „Mai încearcă o dată” remontează exercițiul")
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


FULGER_TOPIC = "adunari-scaderi-100"  # tema în care au intrat rezultatele de dinainte de teme
FULGER_READY = "window.__dbg && window.__dbg.fulger.state().enabled"
FULGER_FIT = "(() => { const a = document.querySelector('[data-testid=fg-answers]').getBoundingClientRect(); return { bottom: Math.round(a.bottom), vh: innerHeight, scroll: document.documentElement.scrollHeight - innerHeight, x: document.documentElement.scrollWidth - innerWidth }; })()"


def fulger_flow(run: Run, page: Page, vp: str):
    """Calcul fulger: cardul și hub-ul, o rundă prin ?debug=1 (serie, greșeli, sortare, Turbo, pauză, final), rezultatele și ștergerea."""
    run.goto(page, "")
    page.evaluate("localStorage.removeItem('cifruta:fulger')")
    run.goto(page, "")
    page.get_by_test_id("fulger-card").click()
    group = page.get_by_test_id(f"fg-topic-{FULGER_TOPIC}")
    group.wait_for()
    playable, soon, title = page.evaluate("import('./data/fulger.js').then(({ default: c }) => [c.topics.filter((t) => !t.soon).length, c.topics.filter((t) => t.soon).length, c.topics.find((t) => !t.soon).title])")
    run.check(page.locator("section.fg-topic").count() == playable and page.locator(".fg-soon").count() == soon and page.locator("a.fg-topic, a.fg-soon").count() == 0 and page.locator(".fg-medal").count() == 6,
              f"[{vp}] fulger: temele sunt desfășurate pe pagina jocului ({playable} de jucat, {soon} în curând), fără carduri spre altă pagină, cu 6 medalii")
    run.check(group.locator("h2").inner_text() == title and group.locator(".fg-level").count() == 3 and group.get_by_test_id("fg-concepts").locator("li").count() == 5,
              f"[{vp}] fulger: tema are titlul, explicația, „Ce exersăm” și cele 3 niveluri")
    run.layout_ok(page, f"[{vp}] fulger teme")

    run.goto(page, f"fulger/{FULGER_TOPIC}/usor", debug=True)
    page.get_by_test_id("fg-start").click()
    state = lambda: page.evaluate("window.__dbg.fulger.state()")
    ready = lambda: page.wait_for_function(FULGER_READY)

    def answer(key="answerIndex"):
        ready()
        s = state()
        if s["mode"] == "sort" and key == "answerIndex":
            for i in s["order"]:
                page.get_by_test_id(f"fg-opt-{i}").click()
        else:
            page.get_by_test_id(f"fg-opt-{s[key]}").click()
        return s

    ready()
    run.check(page.get_by_test_id("fg-time").inner_text() in ("2:00", "1:59"), f"[{vp}] fulger: după semafor pornește ceasul de 2 minute")
    run.layout_ok(page, f"[{vp}] fulger rundă")
    run.shot(page, f"{vp}-fulger-runda")
    fit = page.evaluate(FULGER_FIT)
    run.check(fit["bottom"] <= fit["vh"] and fit["scroll"] <= 1, f"[{vp}] fulger: variantele încap pe ecran, fără derulare în rundă ({fit})")
    for _ in range(5):
        answer()
    s = state()
    mult = page.get_by_test_id("fg-mult").inner_text()
    banners = page.locator("[data-testid=fg-banner]").count()
    run.check(s["streak"] == 5 and mult == "×2" and banners == 1, f"[{vp}] fulger: 5 răspunsuri corecte → seria 5, alune ×2 și banner (serie {s['streak']}, {mult}, bannere {banners})")
    page.wait_for_timeout(900)
    run.check(page.get_by_test_id("fg-alune").inner_text() == str(s["alune"]) and page.locator(".fg-fly, .fg-particle").count() == 0, f"[{vp}] fulger: coșul arată {s['alune']} alune, iar efectele trecătoare au dispărut")

    ready()
    page.evaluate("window.__dbg.fulger.force('add-1c')")
    ready()
    page.wait_for_timeout(1300)
    answer("wrongIndex")
    wrong = state()
    shown = page.locator(".fg-opt.is-answer").count()
    busy = page.get_by_test_id("fg-answers").get_attribute("aria-busy")
    page.wait_for_timeout(1400)
    run.check(wrong["streak"] == 0 and wrong["alune"] == s["alune"] and shown == 1 and busy == "true" and state()["enabled"], f"[{vp}] fulger: o greșeală oprește seria fără să ia alune, arată răspunsul corect și blochează variantele ~1 s")

    ready()
    page.evaluate("window.__dbg.fulger.force('add-1c')")
    answer("wrongIndex")
    page.wait_for_timeout(1600)
    hopa = page.get_by_test_id("fg-hopa").inner_text()
    run.check("prea repede" in hopa and not state()["enabled"], f"[{vp}] fulger: o greșeală imediată primește pauza lungă „Hopa, prea repede!” ({hopa!r})")

    page.wait_for_function(FULGER_READY, timeout=6000)
    page.evaluate("window.__dbg.fulger.force('sort-3-20')")
    answer()
    run.check(page.locator(".fg-slot.is-shown").count() == 3 and state()["streak"] == 1, f"[{vp}] fulger: plăcile atinse în ordine umplu căsuțele sortării")
    ready()
    page.evaluate("window.__dbg.fulger.force('cmp-20')")
    ready()
    run.check(page.locator("[data-testid=fg-answers] .fg-opt").count() == 3, f"[{vp}] fulger: comparația are trei butoane (<, =, >)")
    page.evaluate("window.__dbg.fulger.setStreak(9)")
    answer()
    run.check(page.locator(".fg-arena.is-turbo").count() == 1 and state()["streak"] == 10, f"[{vp}] fulger: la 10 răspunsuri corecte la rând pornește Turbo")

    ready()
    page.get_by_test_id("fg-pause").click()
    before = state()["remainingMs"]
    page.wait_for_timeout(700)
    after = state()["remainingMs"]
    hidden = page.evaluate("getComputedStyle(document.querySelector('.fg-stage')).visibility")
    page.get_by_test_id("fg-resume").click()
    page.wait_for_function("window.__dbg.fulger.state().phase === 'playing'")
    run.check(before == after and hidden == "hidden", f"[{vp}] fulger: pauza oprește ceasul și ascunde întrebarea ({before} → {after}, {hidden})")

    page.evaluate("window.__dbg.fulger.elapse(window.__dbg.fulger.state().remainingMs - 9000)")
    page.wait_for_timeout(100)
    sprint = page.locator(".fg-arena.is-final").count() == 1
    alune = state()["alune"]
    page.evaluate("window.__dbg.fulger.elapse(10000)")
    stamp = page.get_by_test_id("fg-stamp").count()
    run.check(sprint and stamp == 1, f"[{vp}] fulger: în ultimele 10 secunde vine sprintul final, la 0 ștampila „TIMP!”")
    page.wait_for_selector("[data-testid=fg-results]")
    page.get_by_test_id("fg-results").click()  # sare peste numărătoare
    page.wait_for_timeout(300)
    total = int(page.get_by_test_id("fg-total").inner_text())
    stars = page.evaluate("import('./data/fulger.js').then((m) => m.default.topics[0].levels[0].stars)")
    lit = page.locator("[data-testid=fg-results] .c-star.is-on").count()
    run.check(total >= alune and lit == sum(total >= s for s in stars), f"[{vp}] fulger: totalul {total} (bara de sus {alune}, cu precizia) și {lit} stele")
    run.check(page.get_by_test_id("fg-record").is_visible() and page.get_by_test_id("fg-medal-prima-cursa").is_visible(), f"[{vp}] fulger: prima rundă aduce recordul și medalia „Prima cursă”")
    mistakes = page.locator("[data-testid=fg-mistakes] .fg-mistake").count()
    target = page.get_by_test_id("fg-next-star")
    run.check(mistakes == 2 and (lit == 3 or (target.is_visible() and "stea" in target.inner_text())), f"[{vp}] fulger: „Greșelile tale” arată cele 2 greșeli, iar ținta spune cât mai trebuie până la steaua următoare ({mistakes})")
    links = [page.get_by_test_id(t).get_attribute("href") for t in ("fg-levels", "fg-suggest") if page.get_by_test_id(t).count()]
    run.check(bool(links) and all(href.startswith(f"#/fulger/{FULGER_TOPIC}") for href in links), f"[{vp}] fulger: legăturile de la rezultate rămân în temă ({links})")
    run.layout_ok(page, f"[{vp}] fulger rezultate")
    run.shot(page, f"{vp}-fulger-rezultate")
    page.get_by_test_id("fg-again").click()
    page.wait_for_selector("[data-testid=fg-start]")
    run.check(True, f"[{vp}] fulger: „Mai joc o dată” pornește o rundă nouă")

    run.goto(page, f"fulger/{FULGER_TOPIC}")
    page.wait_for_timeout(200)
    top = page.get_by_test_id(f"fg-topic-{FULGER_TOPIC}").bounding_box()["y"]
    run.check(0 <= top < 160, f"[{vp}] fulger: #/fulger/<temă> e aceeași pagină, derulată la temă ({round(top)} px de sus)")
    best = page.get_by_test_id(f"fg-topic-{FULGER_TOPIC}").get_by_test_id("fg-best-usor").inner_text()
    page.reload()
    page.wait_for_selector("[data-testid=fg-best-usor]")
    kept = page.get_by_test_id(f"fg-topic-{FULGER_TOPIC}").get_by_test_id("fg-best-usor").inner_text() == best
    run.goto(page, "fulger")
    card = page.get_by_test_id(f"fg-topic-{FULGER_TOPIC}").inner_text()
    won = page.get_by_test_id("fg-medal-prima-cursa").get_attribute("class").endswith("is-won")
    run.check(str(total) in best and kept and str(total) in card and won, f"[{vp}] fulger: recordul ({best}), totalul temei și medalia rămân după reîncărcare")
    run.shot(page, f"{vp}-fulger-teme")
    page.get_by_test_id("parents").locator("summary").click()
    page.get_by_test_id("fg-clear").click()
    page.get_by_test_id("modal-confirm").click()
    page.wait_for_function(f"document.querySelector('[data-testid=fg-topic-{FULGER_TOPIC}]')?.innerText.includes('Nou')")
    run.check(page.evaluate("localStorage.getItem('cifruta:fulger')") is None, f"[{vp}] fulger: ștergerea din „Pentru părinți” scoate rundele și recordul")

    if vp == "laptop":
        # rezultatele de dinainte de teme (v0.9) și adresa veche a unei runde
        legacy = "{ best: { usor: { alune: 77, at: '2026-09-01T10:00:00.000Z' } }, rounds: [{ level: 'usor', at: '2026-09-01T10:00:00.000Z', total: 77, correct: 20, wrong: 1, bestStreak: 9, fast: 3, stars: 0, byKind: {} }], medals: { 'prima-cursa': '2026-09-01T10:00:00.000Z' } }"
        page.evaluate(f"localStorage.setItem('cifruta:fulger', JSON.stringify({legacy}))")
        run.goto(page, "fulger/usor")
        page.wait_for_selector("[data-testid=fg-start]")
        moved = page.evaluate("location.hash")
        run.goto(page, f"fulger/{FULGER_TOPIC}")
        old_best = page.get_by_test_id(f"fg-topic-{FULGER_TOPIC}").get_by_test_id("fg-best-usor").inner_text()
        run.shot(page, f"{vp}-fulger-tema")
        run.goto(page, "fulger")
        old_medal = page.get_by_test_id("fg-medal-prima-cursa").get_attribute("class").endswith("is-won")
        run.check(moved == f"#/fulger/{FULGER_TOPIC}/usor" and "77" in old_best and old_medal, f"[{vp}] fulger: rezultatele de dinainte de teme apar în temă, iar #/fulger/usor duce la noua adresă ({moved}, {old_best})")
        page.evaluate("localStorage.removeItem('cifruta:fulger')")


# temele ale căror tipuri au doar figuri, cu tipurile lor
SHAPE_TOPICS = """Promise.all([import('./data/fulger.js'), import('./js/fulger/kinds.js')]).then(([{ default: c }, { KINDS }]) => c.topics
  .filter((t) => !t.soon && t.levels.every((l) => l.mix.every((m) => KINDS[m.kind].mode === 'figure')))
  .map((t) => ({ id: t.id, kinds: [...new Set(t.levels.flatMap((l) => l.mix.map((m) => m.kind)))] })))"""


def fulger_shapes_flow(run: Run, page: Page, vp: str):
    """Jocuri fulger cu figuri, pe fiecare temă cu figuri: exemplele desenate de pe carduri, fiecare tip (desenul și cele 4 variante
    încap pe ecran), răspunsul corect cu desenul rezolvat, cel greșit cu varianta bună arătată și „Greșelile tale” cu desene."""
    run.goto(page, "")
    page.evaluate("localStorage.removeItem('cifruta:fulger')")
    state = lambda: page.evaluate("window.__dbg.fulger.state()")
    for topic in page.evaluate(SHAPE_TOPICS):
        tid, kinds = topic["id"], topic["kinds"]
        run.goto(page, f"fulger/{tid}")
        samples = page.get_by_test_id(f"fg-topic-{tid}").locator("li.fg-sample--art")
        undrawn = page.get_by_test_id(f"fg-topic-{tid}").locator("li.fg-sample--art:not(:has(svg, img))").count()
        overflow = page.get_by_test_id(f"fg-topic-{tid}").locator(".fg-level").evaluate_all("cards => cards.filter((c) => [...c.querySelectorAll('.fg-sample')].some((s) => s.getBoundingClientRect().right > c.getBoundingClientRect().right + 1)).length")
        run.check(samples.count() == 6 and undrawn == 0 and overflow == 0, f"[{vp}] {tid}: exemplele de pe cele 3 carduri sunt desene și încap în carduri ({samples.count()} exemple, {undrawn} fără desen, {overflow} carduri depășite)")
        run.shot(page, f"{vp}-fulger-{tid}-tema")
        run.goto(page, f"fulger/{tid}/avansat", debug=True)
        page.get_by_test_id("fg-start").click()
        for i, kind in enumerate(kinds):
            page.wait_for_function(FULGER_READY)
            page.evaluate(f"window.__dbg.fulger.force('{kind}')")
            page.wait_for_function(FULGER_READY)
            s = state()
            fit = page.evaluate(FULGER_FIT)
            # fiecare variantă are un desen sau un text (la „Câte axe…” variantele sunt numere)
            arts = page.evaluate("[...document.querySelectorAll('[data-testid=fg-answers] .fg-opt')].filter((b) => b.querySelector('.fg-opt__art svg, .fg-opt__art img') || [...b.children].some((c) => !c.classList.contains('fg-opt__key') && c.textContent.trim())).length")
            figure = page.get_by_test_id("fg-figure")
            # desenul are mărimea lui: toată lățimea cardului sau o înălțime mare (nu lățimea implicită a unui SVG, 300 px)
            drawn = not s["figure"] or (figure.count() == 1 and page.evaluate("(() => { const f = document.querySelector('[data-testid=fg-figure]'); const r = f.getBoundingClientRect(); return r.width >= 0.9 * f.parentElement.getBoundingClientRect().width || r.height >= 88; })()"))
            run.check(s["kind"] == kind and arts == 4 and drawn and fit["bottom"] <= fit["vh"] and fit["scroll"] <= 1 and fit["x"] <= 1,
                      f"[{vp}] {tid}: {kind} — desenul și cele 4 variante încap pe ecran ({fit})")
            run.shot(page, f"{vp}-fulger-{kind}")
            if i % 2 == 0:
                page.get_by_test_id(f"fg-opt-{s['answerIndex']}").click()
                shown = page.locator("[data-testid=fg-figure].is-shown").count() == 1
                run.check(page.locator(".fg-opt.is-correct").count() == 1 and shown == s["solved"], f"[{vp}] {tid}: {kind} — răspunsul corect, cu desenul rezolvat")
                if s["solved"]:
                    run.shot(page, f"{vp}-fulger-{kind}-rezolvat")
            else:
                page.get_by_test_id(f"fg-opt-{s['wrongIndex']}").click()
                run.check(page.locator(".fg-opt.is-wrong").count() == 1 and page.locator(".fg-opt.is-answer").count() == 1, f"[{vp}] {tid}: {kind} — la greșeală se vede varianta bună")
                page.evaluate("window.__dbg.fulger.elapse(9500)")  # peste pauza „Hopa”
        page.evaluate("window.__dbg.fulger.elapse(window.__dbg.fulger.state().remainingMs + 50)")
        page.wait_for_selector("[data-testid=fg-results]")
        page.get_by_test_id("fg-results").click()  # sare peste numărătoare
        page.wait_for_timeout(300)
        mistakes = page.locator("[data-testid=fg-mistakes] .fg-mistake--figure").count()
        # fiecare greșeală arată răspunsul bun: un desen, un emoji sau un text (la numărat, variantele sunt numere)
        shown = page.evaluate("[...document.querySelectorAll('[data-testid=fg-mistakes] .fg-mistake--figure .fg-mistake__ok')].filter((ok) => ok.querySelector('svg, img') || [...ok.children].some((c) => !c.classList.contains('u-visually-hidden') && c.textContent.trim())).length")
        run.check(mistakes == min(5, len(kinds) // 2) and shown == mistakes, f"[{vp}] {tid}: „Greșelile tale” arată răspunsul bun la fiecare greșeală ({mistakes} greșeli, {shown} cu răspunsul arătat)")
        run.layout_ok(page, f"[{vp}] {tid} rezultate")
        run.shot(page, f"{vp}-fulger-{tid}-rezultate")
    page.evaluate("localStorage.removeItem('cifruta:fulger')")


def fulger_screens(run: Run, browser, base: str):
    """Jocuri fulger pe ecrane joase sau înguste (telefon ținut orizontal, telefon mic): totul încape fără derulare, și la figuri."""
    screens = [
        ("telefon culcat", {"viewport": {"width": 844, "height": 390}, "has_touch": True, "is_mobile": True}),
        ("telefon mic", {"viewport": {"width": 360, "height": 640}, "has_touch": True, "is_mobile": True}),
    ]
    rounds = [
        (FULGER_TOPIC, ("add-100-cu", "sort-4-dir", "cmp-expr")),
        ("siruri-intrusi", ("matrice", "analogie", "sir-doua")),
        ("puzzle-forme", ("simetrie-jumatate", "piesa-rotita", "axe-cate")),
        ("figuri-corpuri", ("desfasurare", "numara-figuri", "corpuri")),
        ("pozitii-trasee", ("robot-lung", "coordonate", "interior")),
    ]
    for name, opts in screens:
        context = browser.new_context(locale="ro-RO", **opts)
        page = context.new_page()
        run.watch(page, name)
        for topic, kinds in rounds:
            page.goto(f"{base}?debug=1#/fulger/{topic}/avansat")
            page.wait_for_selector("[data-testid=fg-start]")
            box = page.get_by_test_id("fg-start").bounding_box()
            run.check(box is not None and box["y"] + box["height"] <= opts["viewport"]["height"], f"[{name}] fulger {topic}: butonul Start încape pe ecran")
            page.get_by_test_id("fg-start").click()
            for kind in kinds:
                page.wait_for_function(FULGER_READY)
                page.evaluate(f"window.__dbg.fulger.force('{kind}')")
                page.wait_for_function(FULGER_READY)
                fit = page.evaluate(FULGER_FIT)
                run.check(fit["bottom"] <= fit["vh"] and fit["scroll"] <= 1 and fit["x"] <= 1, f"[{name}] fulger: la {kind} variantele încap fără derulare ({fit})")
                run.shot(page, f"fulger-{name.replace(' ', '-')}-{kind}")
        context.close()


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
    focused = page.evaluate("document.activeElement?.dataset.testid")
    key("[data-testid=bin-dom] [data-testid=item-vaca]", "Space")
    key("[data-testid=tray]", "Enter")
    back = (answer("categorize") or {}).get("vaca")
    run.check(in_bin == "dom" and back is None and focused == "item-vaca", f"[tastatură] un element intră în coș (focusul rămâne pe el: {focused}) și se scoate înapoi pe tavă ({in_bin} → {back})")
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

    key("[data-testid=stop-piata]", "Space")
    focused = page.evaluate("document.activeElement?.dataset.testid")
    key("[data-testid=stop-teatru]", "Enter")
    run.check(answer("route") == ["gara", "piata", "teatru"] and focused == "stop-piata", f"[tastatură] stațiile se ating cu Space/Enter și focusul rămâne pe stație ({answer('route')})")
    key("[data-testid=bar-mere-plus]", "Enter")
    key("[data-testid=bar-mere-plus]", "Space")
    run.check((answer("chart") or {}).get("mere") == 2 and page.locator("[data-testid=bar-mere]").get_attribute("aria-valuenow") == "2", f"[tastatură] bara urcă cu Enter/Space ({answer('chart')})")

    # Calcul fulger doar la tastatură, cu mișcare redusă
    page.goto(f"{base}?debug=1#/fulger/{FULGER_TOPIC}/usor")
    page.wait_for_selector("[data-testid=fg-start]")
    page.keyboard.press("Enter")
    page.wait_for_function(FULGER_READY)
    s = page.evaluate("window.__dbg.fulger.state()")
    for i in s["order"] if s["mode"] == "sort" else [s["answerIndex"]]:
        page.keyboard.press(str(i + 1))
    page.wait_for_timeout(100)
    streak = page.evaluate("window.__dbg.fulger.state().streak")
    run.check(streak == 1 and page.locator(".fg-fly, .fg-particle").count() == 0, f"[tastatură] fulger: tastele 1–4 răspund, fără efecte zburătoare la mișcare redusă (serie {streak})")
    page.wait_for_function(FULGER_READY)
    page.keyboard.press("Escape")
    paused = page.evaluate("window.__dbg.fulger.state().phase") == "paused"
    page.keyboard.press("Escape")
    page.wait_for_function("window.__dbg.fulger.state().phase === 'playing'")
    page.evaluate("window.__dbg.fulger.elapse(120000)")
    page.wait_for_selector("[data-testid=fg-results]")
    page.wait_for_timeout(200)
    run.check(paused and page.get_by_test_id("fg-total").inner_text() != "0" and page.locator(".anim-confetti").count() == 0, "[tastatură] fulger: Esc pune pauză și reia; rezultatele apar direct, fără confetti")

    # o întrebare cu figuri, tot doar de la tastatură
    page.goto(f"{base}?debug=1#/fulger/siruri-intrusi/usor")
    page.wait_for_selector("[data-testid=fg-start]")
    page.keyboard.press("Enter")
    page.wait_for_function(FULGER_READY)
    s = page.evaluate("window.__dbg.fulger.state()")
    page.keyboard.press(str(s["answerIndex"] + 1))
    page.wait_for_timeout(100)
    streak = page.evaluate("window.__dbg.fulger.state().streak")
    run.check(s["mode"] == "figure" and streak == 1, f"[tastatură] fulger: la o întrebare cu figuri, tasta {s['answerIndex'] + 1} alege varianta (serie {streak})")
    context.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="rulează doar testul cu acest id (sau „fulger”: doar fluxurile Jocurilor fulger)")
    parser.add_argument("--shots", action="store_true", help="salvează capturi în test-results/")
    parser.add_argument("--base-url", help="testează un site publicat în loc de serverul local")
    parser.add_argument("--viewports", default="laptop,tableta,telefon")
    args = parser.parse_args()

    httpd, base = (None, args.base_url) if args.base_url else serve()
    run = Run(base if base.endswith("/") else base + "/", args.shots)
    fulger_only = args.only == "fulger"
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
            if not args.only or fulger_only:
                fulger_flow(run, page, vp)
                fulger_shapes_flow(run, page, vp)
            if tests:
                pages_flow(run, page, tests[0], vp)
            for test in tests:
                test_flow(run, page, test, vp)
            context.close()
        if not args.only:
            keyboard_flow(run, browser, run.base)
        if not args.only or fulger_only:
            fulger_screens(run, browser, run.base)
        browser.close()
    if httpd:
        httpd.shutdown()

    print(f"\n{run.passed} verificări trecute, {len(run.failures)} eșuate")
    for f in run.failures:
        print(f"  ✖ {f}")
    return 1 if run.failures else 0


if __name__ == "__main__":
    sys.exit(main())
