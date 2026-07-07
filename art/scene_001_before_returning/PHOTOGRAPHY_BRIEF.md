# PHOTOGRAPHY BRIEF — Scene_001_Before_Returning

**The plate is frozen.** `wide_16x9_v01.png` is an architectural drawing, not an
asset. It defines composition, light, camera, atmosphere, emotional balance, and
negative space — nothing more. This brief turns that blueprint into the real
photograph. **MOOD ships only photography.** The plate is never the building.

## What the plate LOCKS (do not deviate)
- **Composition:** lone figure small in the **lower-left**, a small house with one
  warm lit doorway **upper-right**; the empty road/air fills the **lower two-thirds**.
- **Light:** a single low **gold sun from frame-left**, dissolving into violet dusk;
  one warm window glow; one long soft cast shadow thrown to the right.
- **Camera:** ~35mm, low eye-level, deep-but-natural focus.
- **Atmosphere:** quiet Mediterranean dusk, still, cooling, private.
- **Negative space:** lower two-thirds reserved for the live Hebrew text — keep clean.
- **Emotional truth:** the held breath before you return — to home, to yourself.

## What the photograph must ADD (beyond the plate)
Reality. It must read as **a real film still from a quiet independent film** —
observed, unposed, human, natural available light. **Never** illustrated, painterly,
stylized, CGI, or AI-looking. The viewer must feel *"this happened,"* not *"someone
made this."*

## FINAL GROK PROMPT (photographic — send verbatim)
```
a real 35mm film photograph, a quiet independent film still, Mediterranean dusk on a
still village street — one person seen from behind, walking unhurried toward the warm
lit doorway of a small plaster house, the held breath before returning home · the
figure small in the lower left, the house and its single glowing doorway upper right,
the empty road and dusk air filling the lower two-thirds · the last low gold sun from
the left dissolving into deep violet dusk, one long soft shadow across the road, a
warm window glow · shot on Kodak Portra 400 in natural available light, soft natural
grain, gentle halation on the warm highlights, shallow but natural depth of field,
unposed, observed, documentary tenderness
--ar 16:9
--no illustration, painting, painterly, drawing, vector, cgi, 3d render, ai art,
over-smooth, text, letters, words, hebrew, captions, watermark, logo, signage, ui,
numbers, faces to camera, posed stock, studio light, hdr, oversaturation, neon,
plastic skin, distorted hands, clutter, cool-only light
```
**Output:** 4 variations, ≥3072px long edge, sRGB, no upscaling artifacts.

## QUALITY BAR (QA on return)
- Mistaken for an **illustration** → REJECT.
- Mistaken for **AI art** → REJECT.
- Mistaken for a **real photograph from a quiet independent film** → APPROVE.
- Plus §6 hard rules: no text anywhere · clean lower-two-thirds negative space ·
  humane · matches the plate's composition & light · ≥3072px.

## Pipeline state
```
Scene → Brief → Plate (FROZEN ✅) → Grok Photography (⏳ blocked: run in Grok studio)
  → QA → Approval → Derivatives (from the PHOTOGRAPH, never the plate)
```
Derivatives are **not** produced until the real master photograph is approved. When
the photograph returns, every format is re-derived from it and the plate is retired.
