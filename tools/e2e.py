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
    script = "import('./site/data/catalog.js').then(m => console.log(JSON.stringify(m.default.sections.flatMap(s => s.groups.flatMap(g => g.tests)))))"
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
        page.wait_for_timeout(300)
        run.check(page.locator("main").inner_text().strip() != "", f"[{vp}] pagina „{name}” are conținut")
        run.layout_ok(page, f"[{vp}] {name}")
        run.shot(page, f"{vp}-{name}")
    fonts = page.evaluate("document.fonts.check('16px Andika', 'ăâîșț') && document.fonts.check('700 16px \"Baloo 2\"', 'ăâîșț')")
    run.check(fonts, f"[{vp}] fonturile Andika și Baloo 2 sunt încărcate")


def types_flow(run: Run, page: Page, vp: str):
    """Gesturi reale pe fiecare tip din #/atelier/tipuri; verifică evaluarea cu __dbg."""
    run.goto(page, "atelier/tipuri", debug=True)
    page.wait_for_selector("[data-testid=demo-money]")
    touch = VIEWPORTS[vp].get("has_touch", False)
    tap = (lambda sel: page.locator(sel).first.tap()) if touch else (lambda sel: page.locator(sel).first.click())
    tid = lambda t: f"[data-testid='{t}']"

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

    typing("fill", {"a": 69, "b": 24})
    box = f"{tid('demo-fill')} "
    tap(box + tid("seg-c-<")); tap(box + tid("seg-d-=")); tap(box + tid("seg-e-−")); ok("fill")

    typing("fill-tree", {"a": 40, "b": 7, "c": 80, "d": 0}); ok("fill-tree")

    tap(tid("item-vaca")); tap(tid("bin-dom"))
    if touch:
        tap(tid("item-lup")); tap(tid("bin-sal"))
    else:
        page.locator(tid("item-lup")).drag_to(page.locator(tid("bin-sal")))
    tap(tid("item-oaie")); tap(tid("bin-dom"))
    tap(tid("item-urs")); tap(tid("bin-sal"))
    ok("categorize")

    for s in ("s1", "s3", "s5"):
        tap(tid(f"mark-{s}"))
    ok("mark")

    for _ in range(4):
        tap(tid("abacus-i1-Z-plus"))
    for _ in range(6):
        tap(tid("abacus-i1-U-plus"))
    ok("build")

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

    page.locator(tid("slider-i1")).fill("48"); ok("slider")

    tap(tid("brush-verde")); tap(tid("mark-soare")); tap(tid("mark-vant"))
    tap(tid("brush-rosu")); tap(tid("mark-carbune")); tap(tid("mark-petrol"))
    ok("mark-palette")

    for _ in range(3):
        tap(tid("clock-i1-h-minus"))
    tap(tid("clock-i1-m-plus"))
    ok("clock")

    typing("fill-steps", {"a": 12, "b": 18, "c": 30, "d": 30, "e": 15, "f": 15}); ok("fill-steps")

    for note in (10, 1, 1):
        tap(tid(f"note-{note}"))
    page.locator(tid("wallet-f2")).click(position={"x": 20, "y": 20})
    for note in (5, 5, 1, 1):
        tap(tid(f"note-{note}"))
    ok("money")

    for ex in ("choice", "match", "order", "money"):
        page.locator(tid(f"demo-check-{ex}")).click()
    page.wait_for_timeout(500)
    run.shot(page, f"{vp}-atelier-tipuri-rezolvat")


def test_flow(run: Run, page: Page, test: dict, vp: str):
    tid = test["id"]
    page.evaluate("localStorage.clear()")
    run.goto(page, f"test/{tid}", debug=True)
    run.shot(page, f"{vp}-{tid}-intro")
    page.get_by_test_id("start").click()
    page.wait_for_selector(".ex-card")
    run.shot(page, f"{vp}-{tid}-ex1")
    run.layout_ok(page, f"[{vp}] {tid} exercițiul 1")

    # răspunsuri corecte → 100
    page.evaluate("window.__dbg.fillCorrect()")
    page.wait_for_timeout(200)
    dots = page.locator(".c-progress__dot.is-done").count()
    run.check(dots == test.get("exercises", dots), f"[{vp}] {tid}: toate bulinele sunt „terminat” ({dots})")
    page.reload()
    page.wait_for_selector(".ex-card")
    run.check(page.locator(".c-progress__dot.is-done").count() == dots, f"[{vp}] {tid}: ciorna se păstrează după reîncărcare")
    page.get_by_test_id("finish-top").click()
    page.wait_for_selector("[data-testid=score]")
    score = page.get_by_test_id("score").inner_text()
    run.check(score.startswith("100"), f"[{vp}] {tid}: toate corecte → scor 100 (primit {score!r})")
    page.wait_for_selector(".ex-review__item")
    page.wait_for_timeout(600)
    run.shot(page, f"{vp}-{tid}-rezultate-100")

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
    score = page.get_by_test_id("score").inner_text()
    run.check(score.startswith("10"), f"[{vp}] {tid}: fără răspunsuri → scor 10 (primit {score!r})")
    run.layout_ok(page, f"[{vp}] {tid} rezultate")


def keyboard_flow(run: Run, browser, base: str):
    """Doar tastatura + animații reduse: pornește T1, răspunde la primul exercițiu, trece mai departe."""
    context = browser.new_context(locale="ro-RO", reduced_motion="reduce", viewport={"width": 1280, "height": 800})
    page = context.new_page()
    run.watch(page, "tastatură")
    tests = [t for t in catalog_tests() if t["id"].startswith("recap-")]
    if not tests:
        context.close()
        return
    page.goto(f"{base}#/test/{tests[0]['id']}")
    page.wait_for_selector("[data-testid=start]")
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
