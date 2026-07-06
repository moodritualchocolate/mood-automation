# 66 — Art Direction

> The single, decisive style law that keeps every MOOD image timeless, painterly-photographic, and unmistakably one hand.

## Purpose
Art Direction is the governing rulebook beneath the Eye of MOOD (Ch. 65). It exists to make thousands of Grok-generated assets feel authored by one studio across years — no trends, no drift, no stock look. It protects the core promise by keeping every image quiet, warm, and human, so the artwork never competes with the small feeling it carries.

## User Experience
The user experiences Art Direction as consistency they can't name: every Moment "feels like MOOD." Colors stay warm and muted; light is soft; compositions are calm and asymmetric with room to breathe. On **Today / Daily Moment** the Hebrew title (e.g. "אור של בוקר" — "morning light") sits in a hushed field of the image, never fighting a busy frame. Nothing looks like an ad, a filter, or a meme.

## Game Mechanic
Art Direction serves the loop by keeping station 4 (Moment) emotionally legible. Fixed direction:
- **Palette:** warm neutrals, amber, terracotta, dusk blue; low saturation; no neon.
- **Composition:** rule-of-thirds or centered-calm; one subject; generous negative space.
- **Rendering:** painterly-photographic — real light physics with a soft, hand-touched finish.
- **Mood:** intimate, unresolved, tender; never dramatic, ironic, or slick.
- **Forbidden:** text, logos, brands, screens, watches/dates, gore, spectacle, HDR gloss.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library
- Patterns

## Visual Assets Needed
- Masterpiece assets, Moment assets, People assets, Home assets, Object assets, Light assets, Texture assets, Social/Share assets, Video keyframes. No text baked into any image.

## AI Logic
Art Direction is the second layer of the Grok prompt, after the Eye preamble. It injects palette, composition, and rendering tokens and a hard **negative prompt** (`no text, no logos, no screens, no watermark, no neon, no HDR, no clutter`). It never influences Claude's Hebrew copy. Any violation flags the asset for regeneration.

## Data Stored
`Asset.styleTokens`: `palette`, `composition`, `renderProfile` (`painterly-photographic`), `saturationCap`, `moodTag`, `artDirectionVersion`. `Asset.negativePrompt` stored for reproducibility. Local-first; optional Supabase sync.

## Edge Cases
- Over-saturated or HDR output → reject, regenerate with tighter cap.
- Busy composition with no calm region → reject (breaks text layer, Ch. 73).
- Style drift across a batch → pin to a reference seed set.
- Accessibility: ensure enough contrast headroom for overlaid Hebrew text.

## Build Requirements
- `art-direction.ts` token + negative-prompt module, versioned.
- Batch reference-seed manager for style stability.
- Automated palette/saturation QA on ingest.
- Effort: M.

## Definition of Done
- [ ] All assets carry `artDirectionVersion` and stored negative prompt.
- [ ] Palette and saturation caps enforced automatically.
- [ ] No asset contains text, logos, screens, or trend markers.
- [ ] A random 50-asset sample reads as one studio's hand.
