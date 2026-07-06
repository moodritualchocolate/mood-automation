# 79 — Moment Assets

> The everyday backbone artwork: one warm, timeless image behind each Daily Moment.

## Purpose
Moment assets are the workhorse of MOOD's visual language — the image a user meets almost every day on Today / Daily Moment. They must be beautiful yet quiet, varied yet consistent, and always built with room for the live Hebrew title and Reflection. This is the largest asset category by volume and sets the product's everyday tone.

## User Experience
Each morning the user opens MOOD to a fresh full-bleed image that feels made for the day's small observation. It is warm, human, unhurried. The app layers a tiny Hebrew title and a short Reflection over reserved negative space. Example live title: "רגע קטן" ("a small moment"). The image never competes with the words; it holds them.

## Game Mechanic
A `MomentTemplate` references one primary Moment asset; a `DailyMoment` resolves it for a user on a date. Moment assets are drawn from a broad rotating library, matched loosely to the Moment's mood and Human Map signals so the feeling fits without ever illustrating a diagnosis. No repetition within a short window per user.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
Moment assets (primary), commonly composited with Light and Texture overlays; People/Home/Object assets may supply the subject.

## Grok Prompt Template
```
[Grok | category: moment]
A timeless, painterly-photographic image for a small daily human moment
  holding <intent: the day's gentle feeling>. Intimate human scale, one
  quiet subject or scene from everyday life, soft warm natural light,
  low contrast, fine grain, muted warm timeless palette, unhurried and
  tender. Reserve calm NEGATIVE SPACE in the <bottom|top> third,
  low-detail and low-contrast, for a live text layer added later.
  Cinematic-still, emotionally warm, never busy.
NEGATIVE: text, letters, words, captions, Hebrew, numerals, watermark,
  logo, signage, UI, borders, clutter, harsh light, neon, gore, explicit
  content, identifiable real people, brand marks.
```

## Output Specs
- **Aspect ratios:** 9:16 (primary), 4:5 (Library card), 1:1 (Detail crop).
- **Resolution:** master ≥ 2048×3641 (9:16); ≥ 2048×2048 (1:1).
- **Format:** PNG master; AVIF/WebP derivatives for delivery.
- **Color:** sRGB, warm muted timeless palette; consistent white balance across the library.
- **Safe negative-space zone:** ≥ 30% of height in reserved third; low contrast for legible RTL title + short Reflection in light and dark.

## AI Logic
Grok generation only. Mood-matching to Human Map is a soft, non-diagnostic hint in the brief — never a label rendered into the image. Claude writes the Hebrew Reflection and alt-text separately (see Ch. 30, 06).

## Data Stored
- `Asset` (category="moment", mood tags, palette, safeZone, styleVersion). Referenced by `MomentTemplate`. Delivery derivatives cached local-first; masters in Supabase Storage.

## Edge Cases
- Missing asset → neutral warm Texture fallback, never blank.
- Recent-repeat → dedupe against the user's last-N shown assets.
- Offline → resolved `DailyMoment` renders cached asset locally.
- Long RTL Reflection → select wider safe-zone variant.
- Accessibility → Hebrew alt-text required per asset.

## Build Requirements
Large tagged Moment-asset library, mood-match selector, recent-repeat dedupe, `MomentRenderer` compositing text over safe zone. Effort: M.

## Definition of Done
- [ ] Every Daily Moment has a fitting, on-style Moment asset.
- [ ] No text baked in; live RTL text sits in reserved negative space.
- [ ] No short-window repeats per user.
- [ ] Aspect/resolution/format/color specs met.
- [ ] Offline rendering works from cache.
