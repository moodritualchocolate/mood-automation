# 65 — The Eye of MOOD

> The signature lens of the brand — the quiet, noticing gaze that every image in MOOD looks through.

## Purpose
The Eye of MOOD is not a logo; it is a way of seeing. It exists to guarantee that every generated image feels like it was caught by someone who *noticed* — the same promise the whole product makes ("someone noticed something small about my life"). It is the master style key that all other visual chapters inherit from, so the Living Library reads as one continuous, timeless work rather than a stock-image feed.

## User Experience
The user never sees the word "Eye of MOOD." They feel it. Every artwork on **Today / Daily Moment** looks slightly warmer, slightly closer, slightly quieter than real life — as if a painter photographed a private second. A cup half-lit on a windowsill, a shoulder turned toward a door, hands not quite touching. The Hebrew title floats in negative space the image left open (e.g. "כמעט אמרתי" — "I almost said it"). The feeling is recognition, never spectacle.

## Game Mechanic
The Eye serves the loop as its emotional entry point (Core Loop station 4, see Ch. 06). Its rule set is fixed and inherited by every image:
- **Point of view:** intimate, human eye-level or slightly below; never drone, never clinical.
- **Distance:** close enough to feel private, far enough to leave breathing room.
- **Emotion:** one quiet feeling per frame, unresolved.
- **Time:** timeless — no phones, screens, brands, dates, or trends.
- **Negative space:** always reserve an open, calm region for the app's live text layer (see Ch. 73).

## Screens Needed
- Splash
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
- Masterpiece assets (the purest expression of the Eye)
- Moment assets, People assets, Home assets, Object assets, Light assets, Texture assets — all filtered through the Eye. No text baked into any image.

## AI Logic
Not a generative engine itself, but the **master style preamble** prepended to every Grok prompt. It injects fixed tokens: `painterly-photographic, warm natural light, intimate human distance, single quiet emotion, generous negative space, timeless, no text, no logos`. It constrains — never expands — creative drift. Claude engines (Reflection/Challenge) never touch image style; Grok never touches copy.

## Data Stored
`Asset.styleTokens` includes `eyeVersion` (semantic version of the master preamble), `pov`, `distance`, `emotionTag`, `negativeSpaceRegion` (normalized bbox). Stored local-first; optional Supabase Storage sync. No user PII in asset metadata.

## Edge Cases
- Grok output with any baked text → auto-reject, regenerate (see Ch. 75).
- Image with no usable negative space → reject; text layer cannot render.
- Trend-dated object detected (phone/screen) → reject as not timeless.
- Over-styled / painterly-to-abstract drift → fall back to previous `eyeVersion`.

## Build Requirements
- `eye-preamble.ts` style-token module, versioned.
- Grok prompt-builder that always prepends the preamble.
- Asset QA hook validating negative space + no-text before ingest.
- Effort: M (foundational to Volume 07).

## Definition of Done
- [ ] Every Grok prompt in the system prepends the Eye preamble.
- [ ] All ingested assets carry `eyeVersion` and `negativeSpaceRegion`.
- [ ] No asset ships with baked text or trend-dated objects.
- [ ] Library at scale reads as one coherent, timeless work.
