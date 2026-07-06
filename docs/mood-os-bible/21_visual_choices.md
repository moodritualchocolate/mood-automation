# 21 — Visual Choices

> How MOOD turns beautiful, wordless artwork into a language for learning about a person.

## Purpose
Visual Choices are the heart of Discovery: the user learns and is learned through images, not words. This chapter defines how image pairs are curated, presented, and read as soft signals. Images carry emotional meaning that questions can't — and because they hold no text, they cross every language barrier and never feel clinical.

## User Experience
The user sees two or three artworks side by side (or stacked on narrow screens) and taps the one that pulls them. The moment is slow and sensory: warm light, negative space, human intimacy. Prompt in Hebrew, rendered live over/near the art: "מה מרגיש יותר כמו הבית שבך?" ("Which feels more like the home inside you?"). Selection animates gently — a soft bloom, never a "correct/incorrect" flash. There is no reveal of "what your choice means." The user just feels seen and moves on.

## Game Mechanic
- Presentation: 2–3 `Asset` images per choice, drawn from curated pools tagged by emotional dimension.
- Interaction: single tap/swipe selects; long-press previews; skip available.
- Reading: each image has a `signalProfile` (soft weights across Traits). The chosen image's profile nudges the `HumanMap`; the unchosen one applies a tiny opposite-lean at very low confidence.
- Anti-bias rules: alternate left/right placement, vary brightness/complexity so choices aren't driven by mere salience.

## Screens Needed
- Discovery Flow
- Moment Detail (reuses the same painterly visual language)

## Visual Assets Needed
- Masterpiece assets and Moment assets as primary choice imagery.
- People, Home, Object, Light, and Texture assets for dimension-specific pairs.
- Absolutely no text baked into any image; all Hebrew copy is a live app layer.

## AI Logic
Not AI-generated at runtime. Grok generates the artwork ahead of time (Volumes 07/08); the *reading* of choices is a deterministic weighting map maintained by the studio. Guardrail: an image's `signalProfile` may only express soft leanings; it may never encode a category, disorder, or verdict. Pattern Recognition ignores single Discovery choices — signals are aggregated, never read as facts.

## Data Stored
- `Asset` — `{ id, category, uri, signalProfile, altText }` (no text in the image itself).
- Per selection on `DiscoverySession` — `{ pairId, chosenAssetId, at }`.
- Nudges to `HumanMap.Trait[]` (0–1 signal + confidence).
- Local-first; optional Supabase Storage for asset delivery + `human_maps` sync.

## Edge Cases
- Slow network → preloaded/cached local pool so choices never stall; offline fully supported.
- Colorblind/low-vision users → pairs must differ by more than color; alt text + audio description available.
- User always picks the left/first item → placement randomization detects and neutralizes positional bias.
- RTL: image order and prompt alignment respect right-to-left reading.
- No image may imply beauty = "healthy" or darkness = "problem."

## Build Requirements
- `<VisualChoice>` component with responsive 2–3 up layout, RTL-aware, gentle selection animation.
- Asset pool config with `signalProfile` per image; positional randomizer.
- Preload/caching via service worker (PWA).
- Effort: ~3 dev days.

## Definition of Done
- [ ] Choices render as textless artwork with live Hebrew prompts.
- [ ] Placement is randomized to prevent positional bias.
- [ ] Every image has alt text and passes contrast/accessibility checks.
- [ ] Selections nudge soft signals only — no labels surface anywhere.
- [ ] Works offline with cached assets.
