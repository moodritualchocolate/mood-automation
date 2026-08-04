#!/usr/bin/env python3
"""Desktop hero banner -> mobile portrait crop.

The approved hero banners (home-assets/hero-banners/*.png, 1440x808) are a
LANDSCAPE composition: baked headline/buttons on the left ~half, the model
(prism light on her face) fading into cream on the right ~half.

That layout can't be used on a phone: the text is baked (won't reflow, goes
tiny) and the aspect ratio is wrong. The mobile technique is:

  1. CROP the model out of the right side (x>=800 is clean photo, past the
     baked text + the cream fade), full height -> a portrait image.
  2. DROP the baked text entirely; the hero text is rebuilt as live HTML in
     build_home.py (reflows, stays sharp, editable per word).
  3. The crop is embedded as the mobile <source> in the hero <picture>, so
     phones get the portrait and desktop keeps the wide framing.

Run:  python3 make_mobile_hero.py            # regenerates hero-mobile.jpg from hero-home.png
      python3 make_mobile_hero.py energy     # -> hero-mobile-energy.jpg from hero-energy.png
"""
import sys, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).parent
BANNERS = ROOT / "home-assets" / "hero-banners"
OUT = ROOT / "home-assets"

# x=800 clears the baked copy + the cream fade; full height keeps hair->neck.
CROP = (800, 0, 1440, 808)


def make(sku="home"):
    src = BANNERS / f"hero-{sku}.png"
    if not src.exists():
        sys.exit(f"missing banner: {src}")
    crop = Image.open(src).convert("RGB").crop(CROP)
    out = OUT / ("hero-mobile.jpg" if sku == "home" else f"hero-mobile-{sku}.jpg")
    crop.save(out, quality=90)
    print(f"{src.name} {Image.open(src).size} -> {out.name} {crop.size}")


if __name__ == "__main__":
    make(sys.argv[1] if len(sys.argv) > 1 else "home")
