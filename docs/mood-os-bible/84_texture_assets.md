# 84 — Texture Assets

> Warm surface textures — paper, linen, plaster, grain — that give MOOD its tactile, timeless skin.

## Purpose
Texture assets are the material layer of the visual language. They add subtle tactility (aged paper, soft linen, warm plaster, film grain) that makes the product feel handmade and timeless rather than flat and digital. They also serve as the universal fallback: whenever any other asset is missing, a warm Texture fills the frame so the user never sees a blank.

## User Experience
Texture is felt at the edges of attention — a Moment feels like it has a surface, a Library card feels like paper, a background feels warm rather than empty. When something fails to load, the user still meets a gentle warm ground, never a void. The app renders the live Hebrew title directly over the calm texture. Example live title on a paper ground: "דף חדש" ("a new page").

## Game Mechanic
Texture assets are low-contrast full-frame overlays or backgrounds, composited under/over other categories at low opacity, or used alone as fallback and Library backing. They carry no subject and no focal point, keeping the whole frame text-safe.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library
- Settings, Privacy, Accessibility (calm backgrounds)

## Visual Assets Needed
Texture assets (overlay/background/fallback), applied across all categories and screens.

## Grok Prompt Template
```
[Grok | category: texture]
A timeless, painterly-photographic full-frame SURFACE TEXTURE with no
  subject: warm tactile material holding <intent: a calm tactile mood> —
  e.g. aged paper, soft linen, warm plaster, canvas weave, fine film
  grain. Even, low-contrast, seamless, muted warm palette, subtle depth,
  gentle imperfection. The ENTIRE frame is low-detail NEGATIVE SPACE safe
  for a live text layer; no focal point anywhere.
NEGATIVE: text, letters, words, Hebrew, numerals, watermark, logo, UI,
  subjects, objects, people, faces, strong patterns, high contrast, hard
  edges, seams, neon, brand marks.
```

## Output Specs
- **Aspect ratios:** 9:16, 1:1, 4:5, plus tileable/seamless variants.
- **Resolution:** master ≥ 2048×3641 (9:16); seamless tiles ≥ 1024×1024.
- **Format:** PNG master; WebP/AVIF derivatives; tileable flag in metadata.
- **Color:** sRGB, warm muted palette; even exposure, no hotspots.
- **Safe negative-space zone:** the entire frame — kept low-detail and even so RTL text is legible anywhere in light and dark.

## AI Logic
Grok generation only. Not AI-driven. Deterministic use as fallback and backing. Claude authors Hebrew alt-text only where a texture is meaningfully standalone.

## Data Stored
- `Asset` (category="texture", material tag, tileable flag, fallbackEligible flag, styleVersion). Masters in Supabase Storage; derivatives cached local-first as the guaranteed offline fallback set.

## Edge Cases
- High-contrast pattern reduces legibility → reject at Gate.
- Visible tile seam → regenerate seamless.
- Any asset missing anywhere → serve a fallbackEligible texture, never blank.
- Offline → fallback textures are always cached locally.

## Build Requirements
Texture library with material + tileable + fallback flags, guaranteed-cached fallback set, low-opacity compositor, seam/contrast checks in Gate. Effort: S.

## Definition of Done
- [ ] Textures read warm, tactile, and even, with no focal point.
- [ ] No text or subject baked in; whole frame is text-safe.
- [ ] A cached fallback texture guarantees no blank states ever.
- [ ] Seamless variants tile without visible seams.
- [ ] Aspect/resolution/format specs met.
