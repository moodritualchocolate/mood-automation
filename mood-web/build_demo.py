#!/usr/bin/env python3
"""Build the self-contained capabilities demo (demo.html) from demo.tpl.html.

Inlines the Heebo/Assistant font CSS and the three approved pouch images as
data URIs so the page is a single artifact-publishable file (no external hosts).
"""
import base64, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
ASSETS = ROOT / "approved" / "assets"
FONTS = (ROOT / "fonts-embed.css").read_text(encoding="utf-8")
MIME = {".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def data_uri(name):
    p = ASSETS / name
    if not p.exists():
        sys.exit(f"missing asset: {p}")
    return f"data:{MIME[p.suffix.lower()]};base64," + base64.b64encode(p.read_bytes()).decode()


def main():
    html = (ROOT / "demo.tpl.html").read_text(encoding="utf-8")
    html = html.replace("__FONTS__", FONTS)
    for marker, fname in {"__ENERGY__": "energy.webp",
                          "__RELAX__": "relax.webp",
                          "__SLEEP__": "sleep.webp"}.items():
        html = html.replace(marker, data_uri(fname))
    left = set(re.findall(r"__[A-Z]+__", html))
    if left:
        sys.exit(f"unreplaced markers: {left}")
    out = ROOT / "demo.html"
    out.write_text(html, encoding="utf-8")
    print(f"built demo.html ({out.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
