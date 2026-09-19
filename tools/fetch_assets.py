#!/usr/bin/env python3
"""Descarcă resursele externe folosite de site (doar biblioteca standard Python).

Emoji: citește codurile din site/js/visuals/emoji.js și descarcă SVG-urile lipsă din
Noto Emoji (Apache License 2.0) în site/assets/emoji/<cod>.svg. Fișierele existente sunt păstrate.

Folosire: python3 tools/fetch_assets.py
"""

import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
EMOJI_JS = ROOT / "site" / "js" / "visuals" / "emoji.js"
EMOJI_DIR = ROOT / "site" / "assets" / "emoji"
NOTO_URL = "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/2D/svg/emoji_u{}.svg"


def emoji_codes():
    text = EMOJI_JS.read_text(encoding="utf-8")
    return sorted(set(re.findall(r"code:\s*'([0-9a-f_]+)'", text)))


def fetch_emoji():
    EMOJI_DIR.mkdir(parents=True, exist_ok=True)
    missing = []
    for code in emoji_codes():
        target = EMOJI_DIR / f"{code}.svg"
        if target.exists():
            continue
        name = "_".join(part for part in code.split("_") if part != "fe0f")
        try:
            with urllib.request.urlopen(NOTO_URL.format(name), timeout=30) as response:
                target.write_bytes(response.read())
            print(f"descărcat: {code}")
        except Exception as error:  # noqa: BLE001 — raportăm și continuăm
            missing.append(code)
            print(f"LIPSĂ: {code} ({error})", file=sys.stderr)
    return missing


def main():
    missing = fetch_emoji()
    if missing:
        sys.exit(f"Nu am putut descărca: {', '.join(missing)}")
    print("Emoji: toate fișierele sunt prezente.")


if __name__ == "__main__":
    main()
