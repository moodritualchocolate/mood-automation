#!/usr/bin/env python3
"""Build a self-contained energy.html from energy.tpl.html.

Inlines the embedded fonts (fonts-embed.css) into the /*__FONTS__*/ marker and
replaces every __MARKER__ image placeholder with a base64 data URI so the page
renders with zero network requests (required for Claude Artifacts CSP).
"""
import base64, pathlib, sys

ROOT = pathlib.Path(__file__).parent
ASSETS = ROOT / "assets"

# marker -> asset filename
IMG = {
    "__HERO__":    "energy_hero.jpg",
    "__PACKBAR__": "choc_packbar.jpg",
    "__MOODS__":   "choc_moods.jpg",
    "__FORMULA__": "formula_energy.jpg",
    "__WHY__":     "life_hero.jpg",
    "__CHOC__":    "choc_dark.jpg",
    "__RELAX__":   "sku_relax.png",
    "__SLEEP__":   "sku_sleep.png",
}
MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def data_uri(path: pathlib.Path) -> str:
    mime = MIME.get(path.suffix.lower(), "application/octet-stream")
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:{mime};base64,{b64}"


def main() -> None:
    tpl = (ROOT / "energy.tpl.html").read_text(encoding="utf-8")
    fonts = (ROOT / "fonts-embed.css").read_text(encoding="utf-8")

    html = tpl.replace("/*__FONTS__*/", fonts)
    for marker, fname in IMG.items():
        if marker not in html:
            continue  # marker no longer used in the template — skip embedding it
        p = ASSETS / fname
        if not p.exists():
            sys.exit(f"missing asset: {p}")
        html = html.replace(marker, data_uri(p))

    left = [m for m in IMG if m in html]
    if left:
        sys.exit(f"unreplaced markers: {left}")

    out = ROOT / "energy.html"
    out.write_text(html, encoding="utf-8")
    print(f"built {out} ({out.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
