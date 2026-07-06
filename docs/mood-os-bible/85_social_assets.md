# 85 — Social/Share Assets

> Shareable images for the Ripple and optional sharing — belonging without profiles, comparison, or baked-in text.

## Purpose
Social/Share assets let a user carry a feeling of anonymous belonging outward. They back the Shared Humanity screen and any optional share, expressing "many people also chose a small act of courage today" as an image — never a scoreboard, never a profile, never a like count. Because the product forbids text in images, these too must leave room for the app (or share sheet) to add any words as a live layer.

## User Experience
On Shared Humanity, the user sees a warm, communal-feeling image — many small lights, a shared horizon, distant anonymous figures — that says *you are one of many* without ranking anyone. Example live text overlaid by the app: "8,412 אנשים בחרו היום מעשה קטן של אומץ" ("8,412 people chose a small act of courage today"). If shared, the same image travels with no user identity and no baked text.

## Game Mechanic
Social/Share assets pair with `RippleStat` copy composited live. They never show individuals identifiably, never imply comparison or leaderboards, and never include counts as pixels — the number is always a live text layer. Sharing is opt-in and anonymous.

## Screens Needed
- Shared Humanity
- Moment Detail (optional share)
- Living Library (optional share)

## Visual Assets Needed
Social/Share assets (primary), composited with Light and Texture; may use anonymized People/Object motifs.

## Grok Prompt Template
```
[Grok | category: social]
A timeless, painterly-photographic image of quiet collective belonging
  holding <intent: shared humanity, not comparison> — e.g. many small
  warm lights across a dusk landscape, a shared horizon, distant
  anonymous figures each alone-together. Soft warm light, low contrast,
  fine grain, muted timeless palette, hopeful and gentle, no hierarchy or
  ranking. Reserve generous NEGATIVE SPACE in the <center|bottom> for a
  live text layer (a number/phrase) added later by the app.
NEGATIVE: text, letters, words, numbers, Hebrew, numerals, watermark,
  logo, UI, like/heart/badge icons, leaderboards, ranking, identifiable
  people, faces in focus, brand marks, gore, explicit content.
```

## Output Specs
- **Aspect ratios:** 1:1 (share primary), 9:16 (story/Shared Humanity), 1.91:1 (link preview).
- **Resolution:** master ≥ 2048×2048 (1:1); ≥ 2048×3641 (9:16).
- **Format:** PNG master; WebP/AVIF derivatives; JPEG export for share targets that require it.
- **Color:** sRGB, warm muted palette; safe for compression on social platforms.
- **Safe negative-space zone:** ≥ 35% central/lower area low-detail for a live number + short phrase, legible in light and dark.

## AI Logic
Grok generation only. `RippleStat` numbers come from Pattern/heuristics as live text, never rendered into the image. No comparison or ranking is ever depicted. Claude authors Hebrew alt-text.

## Data Stored
- `Asset` (category="social", motif tag, safeZone, styleVersion, shareEligible flag). Referenced alongside `RippleStat`. Masters in Supabase Storage; derivatives cached local-first.

## Edge Cases
- Image implies ranking/comparison → reject at Gate.
- Any baked number/badge → hard reject.
- Share offline → queue, use cached asset.
- Long RTL phrase → wider safe-zone variant.
- Privacy: shared image must carry no user identity or metadata.

## Build Requirements
Social-asset library, live `RippleStat` text compositor, opt-in anonymous share flow with metadata stripping, per-target export formats. Effort: M.

## Definition of Done
- [ ] Assets express belonging, never comparison or ranking.
- [ ] No text, numbers, badges, or like-counts baked in.
- [ ] `RippleStat` renders as a live RTL layer in reserved space.
- [ ] Shares are anonymous with stripped metadata.
- [ ] Aspect/resolution/format specs met per share target.
