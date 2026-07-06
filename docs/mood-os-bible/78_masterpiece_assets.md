# 78 — Masterpiece Assets

> Rare, cornerstone artworks reserved for the most meaningful Moments — the images a user remembers years later.

## Purpose
Masterpiece assets are the visual peaks of MOOD. They back `RareMoment`s and milestone Moments (a first Brave challenge, a Chapter close) and are held to a higher bar than everyday Moment assets. Their scarcity is the point: because they are rare, they feel like a gift, deepening the promise that someone noticed something about this person's life.

## User Experience
A user meeting a Masterpiece feels a quiet shift — the image is unmistakably richer, more painterly, more still. It appears full-bleed on Today / Daily Moment or Moment Detail, with the app's live Hebrew title floating in reserved negative space. Example live title: "רגע נדיר" ("a rare moment"). No fanfare, no badge, no "achievement unlocked" — just a more beautiful window.

## Game Mechanic
Masterpieces are drawn only when a Moment is flagged rare/milestone (see Ch. 30, Pattern Engine). They are a curated, limited pool; never assigned to routine daily Moments. One Masterpiece may recur as a cornerstone in a user's Living Library, gaining meaning through return rather than novelty.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
Masterpiece assets only — the highest-craft tier of the Volume 07 language. May pull Light and Texture overlays for extra depth.

## Grok Prompt Template
```
[Grok | category: masterpiece]
A timeless, painterly-photographic masterpiece image holding <intent:
  a rare, profound human feeling>. A single intimate human-scale subject
  or scene, seen with quiet reverence. Soft warm natural light, low
  contrast, fine painterly grain, rich but muted timeless palette,
  gallery-still composition. Generous, calm NEGATIVE SPACE in the
  <top|bottom> third kept low-detail and low-contrast for a live text
  layer added later. Museum-quality, emotionally resonant, understated.
NEGATIVE: text, letters, words, captions, Hebrew, numerals, watermark,
  logo, signage, UI, borders, busy composition, clutter, harsh light,
  neon, gore, explicit content, identifiable real people, brand marks.
```

## Output Specs
- **Aspect ratios:** 9:16 (primary mobile full-bleed), 4:5 (Library card), 1:1 (Detail crop).
- **Resolution:** master ≥ 2560×4552 (9:16); square ≥ 2560×2560.
- **Format:** PNG master (lossless); AVIF/WebP delivery derivatives.
- **Color:** sRGB delivery, Display P3 master option; warm muted timeless palette.
- **Safe negative-space zone:** ≥ 32% of height in the reserved third, contrast held low enough for legible RTL overlay in light and dark.

## AI Logic
Grok generation only; the higher craft bar is enforced by the Ch. 87 Gate at a stricter threshold. Claude authors the Hebrew alt-text and any live title, never the image.

## Data Stored
- `Asset` (category="masterpiece", rarityTier, styleVersion, safeZone, tags[], curatedPool flag). Referenced by `RareMoment` and milestone `MomentTemplate`s. Masters in Supabase Storage.

## Edge Cases
- Pool exhausted → fall back to a top-tier Moment asset, never a blank; flag pool for replenishment.
- Overuse dilutes rarity → enforce minimum spacing between Masterpiece assignments.
- Offline → cached Masterpiece renders locally.
- Long RTL title → wider safe zone variant selected.

## Build Requirements
Curated Masterpiece pool store, stricter Gate threshold, rarity-spacing rule in the assignment service, high-res master handling. Effort: M.

## Definition of Done
- [ ] Masterpieces render only on rare/milestone Moments.
- [ ] No text baked in; live RTL title sits in reserved negative space.
- [ ] Meets stricter Quality Gate threshold.
- [ ] Aspect/resolution/format specs met; masters archived.
- [ ] Rarity spacing prevents dilution.
