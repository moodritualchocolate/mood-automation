#!/usr/bin/env python3
"""Build a single self-contained home.html from the APPROVED home source.

The approved homepage (approved/index.html) is a shell that loads two
interactive sections via <iframe src=...> and shows the hero and formula
strips as flat images. For the standalone artifact we need ONE self-contained
file, so this script:

  1. inlines every asset (hero, formula, product, chocolate, video) as a data URI,
  2. embeds the Heebo font from fonts-embed.css instead of Google Fonts,
  3. folds the two section documents into the shell via <iframe srcdoc=...>,
     which preserves each section's own CSS scope exactly as approved.

Nothing about the approved structure, copy or motion is changed — only the
transport (external files -> inlined) is adapted for a single file. Videos are
served from approved/assets in a web-optimised (compressed, muted) form.
"""
import base64, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
APP = ROOT / "approved"
ASSETS = APP / "assets"
MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".webp": "image/webp", ".mp4": "video/mp4", ".gif": "image/gif"}

FONTS = (ROOT / "fonts-embed.css").read_text(encoding="utf-8")

# the three Google-Fonts <link> tags each section carries
FONT_LINKS = re.compile(
    r'\s*<link rel="preconnect"[^>]*>'
    r'\s*<link rel="preconnect"[^>]*crossorigin>'
    r'\s*<link href="https://fonts\.googleapis\.com[^"]*"[^>]*>')


def data_uri(name: str) -> str:
    p = ASSETS / name
    if not p.exists():
        sys.exit(f"missing asset: {p}")
    mime = MIME.get(p.suffix.lower(), "application/octet-stream")
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def inline_assets(html: str) -> str:
    """Replace every ../assets/NAME (or assets/NAME) reference with a data URI."""
    return re.sub(r'(?:\.\./)?assets/([A-Za-z0-9_\-.]+)',
                  lambda m: data_uri(m.group(1)), html)


def build_section(filename: str, is_cinematic: bool) -> str:
    html = (APP / "sections" / filename).read_text(encoding="utf-8")
    # embed the font: drop the Google links, prepend @font-face to the <style>
    html = FONT_LINKS.sub("", html)
    html = html.replace("<style>", "<style>\n" + FONTS + "\n", 1)
    # inline all assets (images + compressed videos + poster)
    html = inline_assets(html)
    if is_cinematic:
        # the approved video swap guards re-loads by comparing the src filename;
        # with data URIs there is no filename, so track the mood on the element
        # instead — same visible behaviour, no filename string to compare.
        html = html.replace(
            "if (!video.currentSrc.endsWith(next.src.split('/').pop())) {",
            "if (video.dataset.mood !== mood) { video.dataset.mood = mood;")
        html = html.replace(
            "const moodButtons = [...document.querySelectorAll('[data-mood]')];",
            "const moodButtons = [...document.querySelectorAll('[data-mood]')];\n"
            "    video.dataset.mood = 'energy';")
    return html


def escape_srcdoc(html: str) -> str:
    return html.replace("&", "&amp;").replace('"', "&quot;")


def main():
    shell = (APP / "index.html").read_text(encoding="utf-8")
    # embed font in the shell too (used by the skip link / alt fallbacks)
    shell = shell.replace("<style>", "<style>\n" + FONTS + "\n", 1)
    # inline hero + formula strip images
    shell = inline_assets(shell)
    # fold the two sections in as srcdoc
    products = escape_srcdoc(build_section("product-cards.html", False))
    cinematic = escape_srcdoc(build_section("cinematic.html", True))
    shell = shell.replace('src="sections/product-cards.html"',
                          f'srcdoc="{products}"')
    shell = shell.replace('src="sections/cinematic.html"',
                          f'srcdoc="{cinematic}"')
    left = re.findall(r'(?:\.\./)?(?:assets|sections)/[A-Za-z0-9_\-.]+', shell)
    if left:
        sys.exit(f"unreplaced references remain: {set(left)}")
    out = ROOT / "home.html"
    out.write_text(shell, encoding="utf-8")
    print(f"built home.html ({out.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
