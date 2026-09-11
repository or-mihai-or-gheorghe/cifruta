#!/usr/bin/env python3
"""Descarcă fonturile site-ului (woff2, subseturi latin + latin-ext) și licențele OFL în site/assets/fonts/.

Andika (text, gândit pentru cititori începători) și Baloo 2 (titluri), din pachetele Fontsource.
Rulează: python3 tools/fetch_fonts.py
"""
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "site" / "assets" / "fonts"
FONTS = {"andika": [400, 700], "baloo-2": [700]}
SUBSETS = ["latin", "latin-ext"]


def download(url: str, dest: Path) -> None:
    if dest.exists():
        return
    with urlopen(url, timeout=30) as resp:
        dest.write_bytes(resp.read())
    print(f"  ✓ {dest.relative_to(ROOT)}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for family, weights in FONTS.items():
        for weight in weights:
            for subset in SUBSETS:
                name = f"{family}-{subset}-{weight}-normal.woff2"
                download(f"https://cdn.jsdelivr.net/fontsource/fonts/{family}@latest/{subset}-{weight}-normal.woff2", OUT / name)
        download(f"https://cdn.jsdelivr.net/npm/@fontsource/{family}@latest/LICENSE", OUT / f"OFL-{family}.txt")


if __name__ == "__main__":
    main()
