# 83 — Light Assets

> Overlays of pure warm light — glow, rays, haze, bloom — that lift any composition into MOOD's signature warmth.

## Purpose
Light assets are compositional overlays, not standalone subjects. They are the atmosphere layer that gives every Moment its warm, timeless feel: a shaft of morning light, a soft bloom, dust in a sunbeam. Used consistently, they unify the whole library under one emotional temperature and reinforce the negative-space discipline by keeping quiet areas quiet.

## User Experience
The user rarely notices Light assets consciously — they feel them. A Moment glows a little; a corner softens; the day feels held. Light is often placed to strengthen the reserved negative space, brightening or hazing the exact area where the app renders the live Hebrew title. Example live title over a soft glow: "אור קטן" ("a small light").

## Game Mechanic
Light assets are composited over Moment/People/Home/Object assets at render or bake time with adjustable opacity and blend mode. They never carry a subject and never introduce detail into the negative-space zone — only atmosphere. A small curated set covers times of day and moods.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library
- Shared Humanity

## Visual Assets Needed
Light assets (overlay), applied above every other category.

## Grok Prompt Template
```
[Grok | category: light]
A timeless, painterly-photographic LIGHT OVERLAY with no subject: pure
  warm atmospheric light holding <intent: a mood> — e.g. soft morning
  rays, golden-hour bloom, gentle haze, dust in a sunbeam, candle glow.
  Smooth gradients, low contrast, fine grain, muted warm palette,
  designed to be layered over other art. Keep the <top|bottom> third
  clean and evenly lit as low-detail NEGATIVE SPACE for a live text layer.
  Mostly soft/dark ground for screen/add blending.
NEGATIVE: text, letters, words, Hebrew, numerals, watermark, logo, UI,
  subjects, objects, people, faces, hard edges, harsh contrast, neon,
  banding, busy detail, brand marks.
```

## Output Specs
- **Aspect ratios:** 9:16 (primary), 1:1, 4:5 — plus seamless variants.
- **Resolution:** master ≥ 2048×3641 (9:16).
- **Format:** PNG master with alpha where needed; WebP/AVIF derivatives; blend metadata (mode, default opacity).
- **Color:** sRGB, warm muted palette; smooth gradients, minimal banding.
- **Safe negative-space zone:** the reserved third kept evenly lit and low-detail so overlay never harms RTL legibility in light or dark.

## AI Logic
Grok generation only. Not AI-driven beyond a mood hint. Blend mode/opacity are deterministic render settings. Claude authors Hebrew alt-text only for standalone use.

## Data Stored
- `Asset` (category="light", blendMode, defaultOpacity, timeOfDay tag, safeZone, styleVersion). Masters in Supabase Storage; derivatives cached local-first.

## Edge Cases
- Overlay darkens/blows out the text zone → reject at Gate, adjust.
- Banding on gradients → regenerate at higher bit depth.
- Offline → cached overlay renders locally.
- Light + dark mode → verify legibility of overlaid RTL text in both.

## Build Requirements
Light-overlay library with blend metadata, render-time compositor honoring blend/opacity, banding check in Gate. Effort: S–M.

## Definition of Done
- [ ] Light overlays warm compositions without adding detail to the text zone.
- [ ] No text or subject baked in.
- [ ] Blend mode + default opacity stored per asset.
- [ ] RTL overlay legible in light and dark.
- [ ] Aspect/resolution/format specs met.
