# 81 — Home Assets

> Intimate interiors and domestic spaces — the quiet rooms where small human moments actually happen.

## Purpose
Home assets give MOOD its sense of place. Most real moments of courage, rest, or noticing happen in ordinary rooms: a kitchen at dawn, an unmade bed, a window with light. These images ground the product in lived, private space and make the user feel the Moment belongs to a real life, not a stock world.

## User Experience
The user sees a warm, lived-in interior — softly cluttered or serenely empty — that feels like somewhere they could be. It is quiet and safe. The app overlays the live Hebrew title in reserved negative space, often the calm expanse of a wall or window. Example live title: "הבית שבפנים" ("the home within"). The room holds the words like light holds dust.

## Game Mechanic
Home assets serve as the setting layer of a Moment, either standing alone or hosting People/Object subjects. Chosen to match the Moment's warmth and time-of-day mood. Never staged as aspirational or luxury real estate — the register is ordinary, human, and warm.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
Home assets (primary), composited with Light, Texture, and optional People/Object assets.

## Grok Prompt Template
```
[Grok | category: home]
A timeless, painterly-photographic image of an intimate, lived-in
  domestic interior holding <intent: a quiet domestic feeling>. Ordinary
  and human — a kitchen, a bedside, a window seat, morning or evening
  light spilling across the room. Soft warm natural light, low contrast,
  fine grain, muted timeless palette, gentle depth, unstaged and real.
  Reserve calm NEGATIVE SPACE on a <wall|window|floor> area in the
  <top|bottom> third, low-detail, for a live text layer added later.
NEGATIVE: text, letters, words, signage, Hebrew, numerals, watermark,
  logo, UI, brand marks, TV/phone screens with content, luxury staging,
  clutter chaos, harsh light, neon, people (unless briefed), gore.
```

## Output Specs
- **Aspect ratios:** 9:16 (primary), 4:5 (Library), 1:1 (Detail).
- **Resolution:** master ≥ 2048×3641 (9:16).
- **Format:** PNG master; AVIF/WebP derivatives.
- **Color:** sRGB, warm muted domestic palette; consistent golden/blue-hour white balance.
- **Safe negative-space zone:** ≥ 30% of height on a low-detail wall/window area for legible RTL overlay in light and dark.

## AI Logic
Grok generation only. Not AI-driven for mood beyond a soft brief hint. Screens/signage explicitly excluded to avoid accidental text. Claude authors Hebrew alt-text.

## Data Stored
- `Asset` (category="home", timeOfDay tag, room tag, safeZone, styleVersion). Masters in Supabase Storage; derivatives cached local-first.

## Edge Cases
- Accidental readable text on a poster/screen → reject at Gate.
- Room reads as luxury/staged → regenerate toward ordinary.
- Offline → cached asset renders locally.
- Long RTL text → select variant with larger wall negative space.

## Build Requirements
Home-asset library with room + time-of-day tags, screen/signage exclusion in negative prompt, compositing with People/Object layers. Effort: M.

## Definition of Done
- [ ] Interiors read ordinary, warm, and lived-in.
- [ ] No text or readable signage anywhere in the image.
- [ ] Live RTL text sits in reserved wall/window negative space.
- [ ] Aspect/resolution/format/color specs met.
- [ ] Offline rendering works from cache.
