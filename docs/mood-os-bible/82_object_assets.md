# 82 — Object Assets

> Small still-life objects that carry meaning — a cup, a key, a folded note — quiet symbols for a Moment.

## Purpose
Object assets let MOOD speak in small symbols. A single well-lit object can hold a feeling more gently than any face: a half-finished cup of tea for rest, a worn key for a threshold, a pressed flower for memory. These images give the product a vocabulary of quiet metaphor while keeping compositions calm and text-ready.

## User Experience
The user sees one intimate object, softly lit, resting in shallow focus against a warm, uncluttered ground. It feels found rather than staged. The app overlays the live Hebrew title in the surrounding negative space. Example live title: "משהו קטן שנשאר" ("a small thing that stayed"). The object suggests; the words name.

## Game Mechanic
Object assets serve as symbolic subjects within a Moment or as Library accents. Selected to echo the Moment's theme without literalism and never to depict anything that could read as a diagnosis, prescription, or judgment (no pills-as-fix, no scales, no clocks-as-pressure).

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
Object assets (primary), composited with Light and Texture; often over a Home surface.

## Grok Prompt Template
```
[Grok | category: object]
A timeless, painterly-photographic still life of a single meaningful
  everyday object holding <intent: a quiet symbolic feeling> — e.g. a
  worn key, a half-full cup, a folded cloth, a pressed flower. Shallow
  focus, soft warm natural light, low contrast, fine grain, muted
  timeless palette, resting on a plain warm surface, found not staged.
  Reserve calm NEGATIVE SPACE around the object in the <top|bottom>
  third, low-detail, for a live text layer added later.
NEGATIVE: text, letters, words, labels, packaging copy, Hebrew, numerals,
  watermark, logo, brand marks, UI, clocks/scales/pills as judgment,
  clutter, harsh light, neon, gore, explicit content.
```

## Output Specs
- **Aspect ratios:** 1:1 (primary still-life), 9:16 (full-bleed Moment), 4:5 (Library).
- **Resolution:** master ≥ 2048×2048 (1:1); ≥ 2048×3641 (9:16).
- **Format:** PNG master; AVIF/WebP derivatives.
- **Color:** sRGB, warm muted palette; natural material tones.
- **Safe negative-space zone:** ≥ 30% of the frame around the object kept low-detail for legible RTL overlay.

## AI Logic
Grok generation only. Symbolic mapping is a soft brief hint, never a rendered label. Product-label text explicitly banned to prevent baked-in words. Claude authors Hebrew alt-text.

## Data Stored
- `Asset` (category="object", symbol tag, material tag, safeZone, styleVersion). Masters in Supabase Storage; derivatives cached local-first.

## Edge Cases
- Object with readable branding/label text → reject at Gate.
- Symbol reads as clinical/judgmental (scale, pill bottle) → regenerate.
- Offline → cached asset renders locally.
- Long RTL text → wider negative-space variant.

## Build Requirements
Object-asset library with symbol + material tags, label-text exclusion in negative prompt, still-life compositing. Effort: S–M.

## Definition of Done
- [ ] Objects read as warm, symbolic, and found — not clinical.
- [ ] No text, labels, or branding anywhere in the image.
- [ ] Live RTL text sits in reserved negative space.
- [ ] Aspect/resolution/format specs met.
- [ ] No judgment-coded objects (scales/pills/pressure clocks).
