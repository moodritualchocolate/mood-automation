# mood — per-SKU 3D formula films

Three separate vertical (1080×1920) films — one per SKU (Energy / Relax / Sleep) —
that animate the brand's real formula on a clean white world.

## Concept
- **White background, no keying.** The ingredient powders were photographed on
  white, so they're placed uncut and simply blend into the white page (soft
  luminance alpha + largest-connected-component cleanup removes stray connector
  lines — never a hard cutout). This replaced an earlier keyed-on-cream version
  that looked "cut".
- **Motion is in the formula's colour.** All life comes from SKU-coloured
  graphics: a breathing central glow, rising soft motes, coloured dots + count-up
  numbers. Energy=orange `#D8703F`, Relax=olive `#6E8148`, Sleep=blue `#536588`.
- **Real ingredient powders + chocolate mood-icon** (lightning / waves / moon)
  cropped from the founder's formula infographic, floated in a light 3D parallax
  (CSS perspective, per-powder depth + bob) around the icon; each ingredient's
  mg counts up; the total tallies.
- **Deterministic frame-stepped render** (`window.__render(frame)` → screenshot
  each frame → encode at 30fps) so motion is perfectly smooth (no scroll capture).
- **Calm warm soundtrack** synthesised per mood (brighter/faster for Energy,
  slower/deeper for Sleep) — see `calm_tracks.py`.

## Build & render one SKU
```bash
python3 build_sku.py energy          # -> sku_energy.html (assets + fonts inlined)
node render_frames.mjs energy 360    # -> frames_energy/f_*.jpg  (deterministic)
bash run_sku.sh energy               # render + encode + mux calm_energy.wav -> sku_energy_film.mp4
```
`sku.template.html` is SKU-agnostic; `build_sku.py` injects the per-SKU JSON
(accent colours, taglines, real mg values, powder + icon base64). Energy ends on
its real pouch; Relax/Sleep end on their chocolate mood-icon (their pouches can't
be cleanly separated from the shared trio photo).

## Assets
`assets/<sku>/` — the cleaned powders + chocolate icon PNGs (transparent, blend on
white). Derived from the founder's real product infographic.
