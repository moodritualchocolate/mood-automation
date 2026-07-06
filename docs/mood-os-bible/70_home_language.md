# 70 — Home Language

> The rooms and spaces of MOOD — lived-in, warm, and ordinary — the quiet stage where small human moments happen.

## Purpose
Home Language defines the environments in MOOD imagery: kitchens, doorways, windowsills, unmade beds, hallway light. It exists because the small moments of a life happen in ordinary spaces, and those spaces must feel real and lived-in, not staged or aspirational. The room should feel like *somewhere*, not a showroom — grounding the Moment in a believable life.

## User Experience
The user sees a corner of a real home on **Today / Daily Moment**: a mug left on a sill, a coat over a chair, morning light on a worn table. It feels like their own home, or one they'd feel safe in. Nothing is styled for a catalog; nothing is cluttered into chaos. The Hebrew title sits in the calm of the room (e.g. "הבית של בוקר" — "the home of morning").

## Game Mechanic
Home Language serves loop station 4 by giving each Moment a believable place to live. Fixed space rules:
- **Character:** lived-in, gently imperfect; signs of a real person, not mess.
- **Type:** intimate domestic corners — thresholds, windows, tables, beds, hallways.
- **Timelessness:** no TVs, phones, screens, brand packaging, or dated decor.
- **Palette:** warm woods, soft textiles, muted walls; light does the emotional work (Ch. 68).
- **Space:** a wall, window, or surface kept open for the app's text layer (Ch. 73).

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library
- Patterns

## Visual Assets Needed
- Home assets (primary), Masterpiece assets, Moment assets, Light assets, Texture assets, Object assets. No text baked into any image.

## AI Logic
Injects environment tokens into Grok: `lived-in domestic interior, intimate corner, warm woods and textiles, gently imperfect, timeless`. Negative prompt: `no TV, no phone, no screens, no brand packaging, no signage, no text, no showroom staging`. Space type maps to the Moment's setting, not to any real user location. Not text-generating.

## Data Stored
`Asset.styleTokens`: `spaceType` (kitchen|doorway|window|bedroom|hallway…), `livedInLevel`, `palette`, `negativeSpaceRegion` (wall/window). Local-first; optional Supabase sync. No real-location data stored.

## Edge Cases
- Showroom / catalog-perfect output → reject, add lived-in cues.
- Any screen, brand, or signage → reject (Ch. 75).
- Cluttered frame with no calm surface → reject (no text zone).
- Dated decor breaking timelessness → regenerate.

## Build Requirements
- `home-tokens.ts` space-type presets.
- Screen/brand/text QA gate on ingest.
- Negative-space surface detector.
- Effort: S–M.

## Definition of Done
- [ ] Rooms read lived-in and real, never staged.
- [ ] No screens, brands, signage, or dated tech in any home asset.
- [ ] Each asset offers a calm surface for the text layer.
- [ ] Palette stays warm and timeless across the set.
