#!/usr/bin/env python3
"""E2E pentru contul familiei, clasament și administrare, pe emulatoarele Firebase (Auth :9099, Firestore :8085, demo-cifruta).

Rulează cu `npm run e2e:cloud`: pornește emulatoarele, rulează acest script, le oprește. Site-ul se deschide cu ?emulator=1,
iar intrarea în cont se face cu window.__cloud.signInAs(email) (token Google fals, acceptat doar de emulator).
Datele din emulator se golesc la începutul fiecărui flux; verificările din cloud citesc prin REST, cu drept de proprietar.

Folosire: npm run e2e:cloud   (sau, cu emulatoarele pornite: python3 tools/e2e_cloud.py --shots)
"""

import json
import pathlib
import sys
import traceback
import urllib.error
import urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from e2e import Run, serve  # noqa: E402
from playwright.sync_api import expect, sync_playwright  # noqa: E402

PROJECT = "demo-cifruta"
FS = f"http://127.0.0.1:8085/v1/projects/{PROJECT}/databases/(default)/documents"
RESET = [
    f"http://127.0.0.1:8085/emulator/v1/projects/{PROJECT}/databases/(default)/documents",
    f"http://127.0.0.1:9099/emulator/v1/projects/{PROJECT}/accounts",
]
LAPTOP = {"viewport": {"width": 1280, "height": 800}}
PHONE = {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True}
TEST_ID = "recap-c1-t1"
ATTEMPT_ID = f"{TEST_ID}-1757757600000"
CLOUD_HOSTS = ("gstatic.com", "googleapis.com", "127.0.0.1:9099", "127.0.0.1:8085")


# ——— emulatoarele ———

def reset():
    for url in RESET:
        urllib.request.urlopen(urllib.request.Request(url, method="DELETE"), timeout=10).read()


def decode(value: dict):
    kind, raw = next(iter(value.items()))
    if kind == "integerValue":
        return int(raw)
    if kind == "arrayValue":
        return [decode(v) for v in raw.get("values", [])]
    if kind == "mapValue":
        return {k: decode(v) for k, v in raw.get("fields", {}).items()}
    if kind == "nullValue":
        return None
    return raw


def rest(path: str, owner: bool = True):
    req = urllib.request.Request(f"{FS}/{path}", headers={"Authorization": "Bearer owner"} if owner else {})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise


def doc(path: str):
    data = rest(path)
    return {k: decode(v) for k, v in data.get("fields", {}).items()} if data else None


def docs(path: str) -> list:
    data = rest(path) or {}
    return [{k: decode(v) for k, v in d.get("fields", {}).items()} for d in data.get("documents", [])]


def anon_status(path: str) -> int:
    try:
        rest(path, owner=False)
        return 200
    except urllib.error.HTTPError as error:
        return error.code


def make_admin(uid: str):
    req = urllib.request.Request(f"{FS}/admins/{uid}", data=b'{"fields": {}}', method="PATCH", headers={"Authorization": "Bearer owner", "Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=10).read()


# ——— pagina ———

def attempt(stars: int) -> dict:
    levels = {lvl: {"fraction": 1 if i < stars else 0.5, "star": i < stars} for i, lvl in enumerate(["usor", "intermediar", "avansat"])}
    when = "2026-09-13T10:00:00.000Z"
    return {"id": ATTEMPT_ID, "testId": TEST_ID, "testVersion": 1, "seed": 7, "startedAt": when, "submittedAt": when, "activeMs": 600000,
            "msByExercise": {}, "answers": {"e1": {"a": [["x", "y"]]}}, "score": 90, "grade": {"code": "FB", "label": "Foarte bine"},
            "earnedPoints": 90, "totalPoints": 100, "levels": levels, "concepts": {}, "exercises": {}, "feeling": None, "secondChance": {}}


def storage(page, body: str):
    """Rulează cod cu modulul core/storage.js al aplicației (aceeași instanță, deci și sincronizarea o vede)."""
    return page.evaluate(f"import('./js/core/storage.js').then((m) => {{ {body} }})")


def play_round(page, total: int):
    storage(page, f"m.saveFulgerRound({{ level: 'usor', at: new Date().toISOString(), total: {total}, correct: 20, wrong: 1, bestStreak: 8, fast: 3, stars: 1, byKind: {{}} }}, {{ keep: 30 }});")


def sign_in(page, email: str, name: str):
    page.wait_for_function("window.__cloud", timeout=30000)
    page.evaluate("([email, name]) => window.__cloud.signInAs(email, name)", [email, name])


def flushed(page) -> bool:
    return page.evaluate("window.__cloud.flush()") == 0


def first_profile(page, nickname: str, avatar: str, move: bool | None):
    page.get_by_test_id("consent-check").check()
    page.get_by_test_id("consent-ok").click()
    page.get_by_test_id("profile-nickname").fill(nickname)
    page.get_by_test_id(f"avatar-{avatar}").click()
    page.get_by_test_id("profile-save").click()
    if move is not None:
        page.get_by_test_id("modal-confirm" if move else "modal-cancel").click()
    expect(page.get_by_test_id("profile-p1")).to_contain_text("Joacă acum")


def parent(run: Run, browser, label: str, email: str, name: str, nickname: str, avatar: str, device=LAPTOP):
    ctx = browser.new_context(**device)
    page = ctx.new_page()
    run.watch(page, label)
    run.goto(page, "profil")
    sign_in(page, email, name)
    first_profile(page, nickname, avatar, move=None)
    return ctx, page, page.evaluate("window.__cloud.state().user.uid")


# ——— fluxurile ———

def account_flow(run: Run, browser):
    print("\n[cont] anonim → părinte → profil → rezultatele mutate")
    reset()
    ctx = browser.new_context(**LAPTOP)
    page = ctx.new_page()
    run.watch(page, "cont")
    cloud_requests = []
    page.on("request", lambda r: any(host in r.url for host in CLOUD_HOSTS) and cloud_requests.append(r.url))
    run.goto(page, "")
    now = page.evaluate("new Date().toISOString()")
    round_ = {"level": "usor", "at": now, "total": 120, "correct": 30, "wrong": 2, "bestStreak": 12, "fast": 9, "stars": 2, "byKind": {}}
    page.evaluate("([a, r]) => { localStorage.setItem('cifruta:attempts', JSON.stringify([a])); localStorage.setItem('cifruta:fulger', JSON.stringify({ best: { usor: { alune: r.total, at: r.at } }, rounds: [r], medals: {} })); }", [attempt(3), round_])
    run.goto(page, "")
    run.check(not cloud_requests, f"fără cont, nicio cerere spre Firebase ({len(cloud_requests)})")
    expect(page.get_by_test_id("nav-account")).to_contain_text("Intră")
    run.check(page.get_by_test_id("nav-board").is_hidden(), "fără cont, antetul nu arată clasamentul")

    page.get_by_test_id("nav-account").click()
    expect(page.get_by_test_id("sign-in-card")).to_be_visible()
    sign_in(page, "ana@example.com", "Mama Anei")
    first_profile(page, "Ana", "vulpe", move=True)
    expect(page.get_by_test_id("nav-account")).to_contain_text("Ana")
    run.check(flushed(page), "rezultatele mutate au ajuns în cont")
    uid = page.evaluate("window.__cloud.state().user.uid")
    base = f"users/{uid}/profiles/p1"
    profile = doc(base) or {}
    run.check(len(docs(f"{base}/attempts")) == 1 and len(docs(f"{base}/fulger")) == 1, "cloud: încercarea și runda profilului")
    run.check(doc(f"{base}/state/fulger") is not None, "cloud: starea Calcul fulger")
    run.check(profile.get("attempts") == 1 and profile.get("rounds") == 1, f"cloud: contoarele profilului ({profile.get('attempts')}, {profile.get('rounds')})")
    run.check("fulger-usor-all" in profile.get("boards", []) and "teste-stele" in profile.get("boards", []), f"cloud: lista clasamentelor {profile.get('boards')}")
    entry = doc(f"leaderboards/fulger-usor-all/entries/{uid}_p1") or {}
    run.check(entry.get("score") == 120 and entry.get("nickname") == "Ana", "clasament: runda cu porecla profilului")
    run.check((doc(f"leaderboards/teste-stele/entries/{uid}_p1") or {}).get("score") == 3, "clasament: stelele de la teste")
    run.check((doc(f"users/{uid}") or {}).get("email") == "ana@example.com", "cloud: contul părintelui")
    local = page.evaluate(f"[localStorage.getItem('cifruta:attempts'), JSON.parse(localStorage.getItem('cifruta:p:{uid}:p1:attempts') || '[]').length]")
    run.check(local[0] is None and local[1] == 1, "browser: rezultatele fără cont au trecut în profil")
    run.shot(page, "cloud-profil-laptop")

    print("\n[cont] al doilea dispozitiv: datele vin din cloud, apoi scrierile urcă")
    ctx2 = browser.new_context(**LAPTOP)
    page2 = ctx2.new_page()
    run.watch(page2, "dispozitiv 2")
    run.goto(page2, "profil")
    sign_in(page2, "ana@example.com", "Mama Anei")
    expect(page2.get_by_test_id("profile-p1")).to_contain_text("Joacă acum")
    run.check(flushed(page2), "dispozitiv 2: sincronizat")
    pulled = page2.evaluate(f"[JSON.parse(localStorage.getItem('cifruta:p:{uid}:p1:attempts') || '[]'), JSON.parse(localStorage.getItem('cifruta:p:{uid}:p1:fulger') || '{{}}')]")
    run.check(len(pulled[0]) == 1 and pulled[0][0]["answers"] == {"e1": {"a": [["x", "y"]]}}, "dispozitiv 2: încercarea, cu răspunsurile")
    run.check(pulled[1].get("best", {}).get("usor", {}).get("alune") == 120, "dispozitiv 2: recordul de la Calcul fulger")
    page2.reload()
    expect(page2.get_by_test_id("nav-account")).to_contain_text("Ana")
    run.goto(page2, "")
    expect(page2.get_by_test_id("fulger-card")).to_contain_text("120")

    play_round(page2, 100)
    storage(page2, f"m.updateAttempt('{ATTEMPT_ID}', {{ feeling: 'vesel' }});")
    run.check(flushed(page2), "dispozitiv 2: runda nouă și autoevaluarea au urcat")
    run.check(len(docs(f"{base}/fulger")) == 2 and (doc(base) or {}).get("rounds") == 2, "cloud: a doua rundă și contorul")
    run.check((doc(f"{base}/attempts/{ATTEMPT_ID}") or {}).get("feeling") == "vesel", "cloud: autoevaluarea încercării")
    run.check((doc(f"leaderboards/fulger-usor-all/entries/{uid}_p1") or {}).get("score") == 120, "clasament: o rundă mai slabă nu scade scorul")

    storage(page2, "m.clearHistory();")
    run.check(flushed(page2), "dispozitiv 2: ștergerea istoricului a urcat")
    run.check(not docs(f"{base}/attempts") and (doc(base) or {}).get("attempts") == 0, "cloud: încercările șterse, contorul la 0")
    run.check(doc(f"leaderboards/teste-stele/entries/{uid}_p1") is None, "clasament: fără stele, intrarea dispare")

    print("\n[cont] redenumire, ieșirea din clasament și revenirea")
    run.goto(page2, "profil")
    page2.get_by_test_id("edit-p1").click()
    page2.get_by_test_id("profile-nickname").fill("Ana Maria")
    page2.get_by_test_id("profile-save").click()
    expect(page2.get_by_test_id("profile-p1")).to_contain_text("Ana Maria")
    run.check((doc(f"leaderboards/fulger-usor-all/entries/{uid}_p1") or {}).get("nickname") == "Ana Maria", "clasament: porecla nouă")
    page2.get_by_test_id("edit-p1").click()
    page2.get_by_test_id("profile-boards").uncheck()
    page2.get_by_test_id("profile-save").click()
    expect(page2.get_by_test_id("profile-p1")).to_contain_text("în afara clasamentului")
    run.check(doc(f"leaderboards/fulger-usor-all/entries/{uid}_p1") is None and (doc(base) or {}).get("boards") == [], "clasament: intrările șterse la ieșire")
    page2.get_by_test_id("edit-p1").click()
    page2.get_by_test_id("profile-boards").check()
    page2.get_by_test_id("profile-save").click()
    expect(page2.get_by_test_id("profile-p1")).not_to_contain_text("în afara clasamentului")
    run.check(flushed(page2), "dispozitiv 2: revenirea în clasament a urcat")
    run.check((doc(f"leaderboards/fulger-usor-all/entries/{uid}_p1") or {}).get("score") == 120, "clasament: recordul revine")

    print("\n[cont] ieșirea din cont golește copiile din browser")
    run.goto(page, "profil")
    page.get_by_test_id("sign-out").click()
    expect(page.get_by_test_id("sign-in-card")).to_be_visible()
    left = page.evaluate("Object.keys(localStorage).filter((k) => k.startsWith('cifruta:p:') || k === 'cifruta:session')")
    run.check(not left, f"browser: fără copii ale profilului după ieșire ({left})")
    expect(page.get_by_test_id("nav-account")).to_contain_text("Intră")

    print("\n[cont] al doilea părinte, pe telefon")
    phone, page3, _ = parent(run, browser, "telefon", "bob@example.com", "Tata lui Bob", "Bob", "urs", PHONE)
    run.check(flushed(page3), "telefon: profil nou fără rezultate")
    run.layout_ok(page3, "telefon: pagina contului")
    run.shot(page3, "cloud-profil-telefon")
    run.goto(page3, "")
    run.layout_ok(page3, "telefon: antetul cu avatar și clasament")
    run.shot(page3, "cloud-antet-telefon")

    print("\n[cont] ștergerea profilului și a contului")
    run.goto(page2, "profil")
    page2.get_by_test_id("edit-p1").click()
    page2.get_by_test_id("profile-delete").click()
    page2.get_by_test_id("modal-confirm").click()
    expect(page2.get_by_role("heading", name="Primul profil")).to_be_visible(timeout=20000)
    run.check(doc(base) is None and not docs(f"{base}/fulger") and doc(f"leaderboards/fulger-usor-all/entries/{uid}_p1") is None, "cloud: profilul șters cu tot ce ține de el")
    page2.get_by_text("Ștergerea contului").click()
    expect(page2.get_by_test_id("delete-account")).to_be_visible()
    page2.get_by_test_id("delete-account").click()
    page2.get_by_test_id("modal-confirm").click()
    expect(page2.get_by_test_id("sign-in-card")).to_be_visible(timeout=20000)
    run.check(doc(f"users/{uid}") is None, "cloud: contul șters")
    for c in (ctx, ctx2, phone):
        c.close()


def boards_admin_flow(run: Run, browser):
    print("\n[clasament] doar pentru cei intrați în cont, doar cu porecla")
    reset()
    anon_ctx = browser.new_context(**LAPTOP)
    anon = anon_ctx.new_page()
    run.watch(anon, "anonim")
    run.goto(anon, "clasament")
    expect(anon.get_by_test_id("lb-invite")).to_be_visible()
    run.check(anon_status("leaderboards/fulger-usor-all/entries") == 403, "clasament: citirea fără cont e refuzată de reguli")

    ctx_a, ana, uid_a = parent(run, browser, "Ana", "ana@example.com", "Mama Anei", "Ana", "vulpe")
    play_round(ana, 120)
    run.check(flushed(ana), "Ana: runda a urcat")
    ctx_b, bob, uid_b = parent(run, browser, "Bob", "bob@example.com", "Tata lui Bob", "Bob", "urs", PHONE)
    play_round(bob, 150)
    storage(bob, f"m.addAttempt({json.dumps(attempt(2))});")
    run.check(flushed(bob), "Bob: runda și testul au urcat")

    run.goto(ana, "clasament/fulger/usor/week")
    rows = ana.get_by_test_id("lb-list").locator("li")
    expect(rows).to_have_count(2)
    run.check("Bob" in rows.nth(0).inner_text() and "Ana" in rows.nth(1).inner_text(), "clasament: ordinea după scor")
    expect(ana.get_by_test_id(f"lb-row-{uid_a}_p1")).to_contain_text("tu")
    run.check("@example.com" not in ana.content(), "clasament: fără e-mailuri în pagină")
    run.shot(ana, "cloud-clasament-laptop")
    run.goto(ana, "clasament/teste")
    expect(ana.get_by_test_id(f"lb-row-{uid_b}_p1")).to_contain_text("2 stele")
    run.goto(bob, "clasament/fulger/usor/all")
    expect(bob.get_by_test_id("lb-list").locator("li")).to_have_count(2)
    run.layout_ok(bob, "telefon: clasamentul")
    run.shot(bob, "cloud-clasament-telefon")

    print("\n[admin] redenumește o poreclă, blochează și deblochează un cont")
    make_admin(uid_a)
    run.goto(ana, "admin")
    ana.reload()
    expect(ana.get_by_test_id(f"admin-user-{uid_b}")).to_be_visible(timeout=20000)
    ana.get_by_test_id(f"admin-profiles-{uid_b}").click()
    ana.get_by_test_id(f"admin-nick-{uid_b}-p1").fill("Bobo")
    ana.get_by_test_id(f"admin-rename-{uid_b}-p1").click()
    expect(ana.get_by_test_id(f"admin-status-{uid_b}")).to_contain_text("schimbată")
    run.check((doc(f"users/{uid_b}/profiles/p1") or {}).get("nickname") == "Bobo" and (doc(f"leaderboards/fulger-usor-all/entries/{uid_b}_p1") or {}).get("nickname") == "Bobo", "admin: porecla nouă în profil și în clasament")
    run.shot(ana, "cloud-admin")
    ana.get_by_test_id(f"admin-block-{uid_b}").click()
    ana.get_by_test_id("modal-confirm").click()
    expect(ana.get_by_test_id(f"admin-user-{uid_b}")).to_contain_text("blocat")
    run.check((doc(f"users/{uid_b}") or {}).get("blocked") is True and doc(f"leaderboards/fulger-usor-all/entries/{uid_b}_p1") is None, "admin: contul blocat, intrările scoase")
    run.goto(ana, "clasament/fulger/usor/all")
    expect(ana.get_by_test_id("lb-list").locator("li")).to_have_count(1)

    # contul blocat, redeschis: aplicația vede blocarea și nu mai trimite nimic (regulile ar refuza oricum)
    bob.close()
    blocked = ctx_b.new_page()
    run.watch(blocked, "Bob blocat")
    run.goto(blocked, "profil")
    expect(blocked.get_by_text("oprit de administrator")).to_be_visible(timeout=20000)
    blocked.wait_for_function("window.__cloud.state().pid === 'p1'")
    play_round(blocked, 160)
    run.check(blocked.evaluate("window.__cloud.flush()") > 0, "cont blocat: rezultatele noi rămân în browser")
    run.check(len(docs(f"users/{uid_b}/profiles/p1/fulger")) == 1, "cloud: nicio rundă nouă de la contul blocat")

    run.goto(ana, "admin")
    ana.get_by_test_id(f"admin-block-{uid_b}").click()
    expect(ana.get_by_test_id(f"admin-user-{uid_b}")).not_to_contain_text("blocat")
    run.check((doc(f"users/{uid_b}") or {}).get("blocked") is False, "admin: contul deblocat")
    for c in (anon_ctx, ctx_a, ctx_b):
        c.close()


# ——— rularea ———

def goto_loaded(self, page, route: str, debug: bool = False):
    """Ca Run.goto, fără „networkidle”: după încărcarea Firebase conexiunile spre emulatoare nu tac niciodată."""
    page.goto(f"{self.base}#/{route}")
    page.wait_for_load_state("load")


def watch_cloud(self, page, label: str):
    """Ca Run.watch, fără închiderea canalelor Firestore la ieșirea din cont (emulatorul răspunde 400 la „terminate”)."""
    def benign(url: str) -> bool:
        return "TYPE=terminate" in url

    def on_console(msg):
        if msg.type == "error" and not benign(msg.location.get("url", "")):
            self.failures.append(f"{label}: eroare în consolă: {msg.text}")
            print(f"  ✖ {label}: consolă: {msg.text}")

    page.on("console", on_console)
    page.on("pageerror", lambda err: (self.failures.append(f"{label}: excepție: {err}"), print(f"  ✖ {label}: excepție: {err}")))
    page.on("response", lambda r: r.status >= 400 and not benign(r.url) and (self.failures.append(f"{label}: {r.status} {r.url}"), print(f"  ✖ {label}: {r.status} {r.url}")))


def main() -> int:
    httpd, base = serve()
    Run.goto = goto_loaded
    Run.watch = watch_cloud
    run = Run(f"{base}?emulator=1", "--shots" in sys.argv)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for flow in (account_flow, boards_admin_flow):
            try:
                flow(run, browser)
            except Exception as error:  # noqa: BLE001 — un pas căzut se raportează, nu oprește celelalte fluxuri
                where = next((f for f in reversed(traceback.extract_tb(error.__traceback__)) if f.filename.endswith("e2e_cloud.py")), None)
                message = f"{flow.__name__} întrerupt la linia {where.lineno if where else '?'} ({where.line if where else ''}): {str(error).splitlines()[0]}"
                run.failures.append(message)
                print(f"  ✖ {message}")
        browser.close()
    httpd.shutdown()
    print(f"\n{run.passed} verificări trecute, {len(run.failures)} eșecuri")
    for failure in run.failures:
        print(f"  ✖ {failure}")
    return 1 if run.failures else 0


if __name__ == "__main__":
    sys.exit(main())
