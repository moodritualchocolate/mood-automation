# 71 — Object Language

> The small objects of MOOD — a cup, a key, a folded note — everyday things that quietly hold a feeling.

## Purpose
Object Language defines how ordinary objects carry meaning in MOOD imagery. A single object, well-lit and closely seen, can hold an entire feeling — waiting, leaving, hoping, letting go. This chapter exists so objects act as quiet emotional symbols the user can project onto, keeping Moments intimate and universal without a single word painted on them.

## User Experience
Sometimes **Today / Daily Moment** shows no person at all — just a thing: two cups, one untouched; a coat still on its hook; a key left in a door. The user reads their own life into it. The object is close, warm-lit, and gently worn. The Hebrew title names the feeling the object holds (e.g. "הכוס השנייה" — "the second cup").

## Game Mechanic
Object Language serves loop station 4 by offering a symbolic, person-free way to feel a Moment. Fixed object rules:
- **Selection:** everyday, humble objects with quiet emotional weight.
- **Count:** one hero object, or a small pair implying a relationship; never clutter.
- **Framing:** close, tactile, off-center; shallow focus (Ch. 67).
- **Symbolism:** open, not literal — the object suggests, never spells out.
- **Timelessness:** no branded, dated, or screen objects; no text/labels visible.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
- Object assets (primary), Masterpiece assets, Moment assets, Light assets, Texture assets. No text baked into any image.

## AI Logic
Injects object tokens into Grok: `single humble everyday object, close tactile framing, warm light, gently worn, quiet symbolism`. Negative prompt: `no brand labels, no packaging text, no screens, no logos, no text of any kind, no clutter`. Object choice maps to the Moment's `emotionTag`; it never encodes user data or a diagnosis.

## Data Stored
`Asset.styleTokens`: `objectType`, `objectCount`, `emotionTag`, `symbolismOpenness`, `negativeSpaceRegion`. Local-first; optional Supabase sync.

## Edge Cases
- Object with a readable brand or label → reject (Ch. 75) — the most common object failure.
- Too many objects / cluttered → reject, reduce to one hero.
- Over-literal symbol (heart-shaped everything) → soften.
- Low contrast against text zone → adjust light, regenerate.

## Build Requirements
- `object-tokens.ts` presets keyed to `emotionTag`.
- Label/text OCR QA gate (objects are the highest text-leak risk).
- Effort: S–M.

## Definition of Done
- [ ] Object assets center one humble, warmly lit thing.
- [ ] Zero readable labels, brands, or text on any object (OCR-verified).
- [ ] Symbolism stays open, never literal.
- [ ] Each asset leaves a calm zone for the text layer.
