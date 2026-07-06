# 73 — Negative Space

> The deliberate quiet in every MOOD image — the open, breathing room reserved for the app's live text layer.

## Purpose
Negative Space is a structural requirement, not a stylistic mood. Every generated image must leave a calm, low-detail region so the app can render Hebrew copy — title, reflection, invitation — in a live text layer over the artwork. It exists to protect the non-negotiable rule that *no text is ever baked into an image* (Ch. 75), while keeping every Moment legible, breathable, and unhurried.

## User Experience
The user always finds the words where the image is quietest. On **Today / Daily Moment** the Hebrew title and living reflection sit in an open field of light, wall, sky, or soft texture — never crowding the subject (e.g. "יש מקום לנשום" — "there is room to breathe"). Because MOOD is RTL, the calm zone must serve right-aligned Hebrew that can grow with longer reflections without collision.

## Game Mechanic
Negative Space serves the whole loop: it is the physical contract between image (Grok) and copy (Claude). Fixed rules:
- **Reserved region:** every asset stores a normalized `negativeSpaceRegion` bbox.
- **Minimum area:** at least ~30–40% of frame is low-detail and text-safe.
- **Placement:** biased to support RTL right-aligned text and safe-area margins.
- **Contrast:** the region guarantees AA contrast for both light and dark text.
- **Responsiveness:** region survives common crops (portrait, square, share).

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library
- Shared Humanity
- Splash

## Visual Assets Needed
- All categories: Masterpiece, Moment, People, Home, Object, Light, Texture, Social/Share, Video keyframes — each must include reserved negative space. No text baked into any image.

## AI Logic
Injects composition tokens into Grok: `generous negative space, subject offset, calm low-detail field for text, RTL-friendly open area`. Negative prompt reinforces `no text, no busy full-bleed composition`. Post-generation, a detector measures the largest low-variance region and writes `negativeSpaceRegion`; assets failing the minimum are rejected. Claude's text layer reads this region to place copy — the only place image and copy engines meet.

## Data Stored
`Asset.negativeSpaceRegion` (normalized x/y/w/h), `negativeSpaceArea` (fraction), `textSafeContrast` (light/dark pass flags), `rtlSafe` (bool). Local-first; optional Supabase sync.

## Edge Cases
- Full-bleed busy image, no calm field → reject.
- Region too small for a long Hebrew reflection → prefer larger-space asset or regenerate.
- Crop for share removes the region → store per-aspect regions.
- Long-text/RTL overflow → app reflows within region; if impossible, swap asset.
- Accessibility: enforce AA contrast in-region for both themes.

## Build Requirements
- Negative-space detector (low-variance region finder) in the ingest pipeline.
- Per-aspect region computation (portrait/square/share).
- Text-layout engine reads `negativeSpaceRegion` for RTL placement.
- Effort: M (blocks the text layer).

## Definition of Done
- [ ] Every asset stores a validated `negativeSpaceRegion` ≥ minimum area.
- [ ] Regions support RTL Hebrew at AA contrast in light and dark.
- [ ] Per-aspect regions exist for all shipped crops.
- [ ] No asset ships with baked text (enforced with Ch. 75).
