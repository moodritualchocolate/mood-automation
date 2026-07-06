# 68 — Light Language

> Light is the emotion of MOOD — warm, low, and human — and this chapter sets exactly how it falls.

## Purpose
Light Language defines how illumination carries feeling in every MOOD image. Light does the emotional work the copy can't: warmth, tenderness, quiet, hope. It exists so that before a user reads a single Hebrew word, the light has already told them how the Moment feels. This keeps images emotionally honest and timeless.

## User Experience
The user opens **Today / Daily Moment** to light that feels like a specific, gentle hour: early-morning gold across a table, dusk blue at a window, a lamp's small warm pool in an evening room. It is never harsh, clinical, or midday-flat. Light leaves a soft, calm area where the Hebrew title lives (e.g. "שקט של ערב" — "an evening quiet"). The user feels held.

## Game Mechanic
Light Language serves loop station 4 by tuning the emotional temperature of each Moment. Fixed light rules:
- **Source:** natural window light or a single warm practical lamp; motivated, directional.
- **Temperature:** warm (2700–4500K feel); dusk-blue allowed for stillness; no cold white.
- **Quality:** soft, wrapping, low-contrast shadows; gentle highlight halation.
- **Hour:** golden hour, blue hour, early morning, lamp-lit evening — never harsh noon.
- **Function:** light points the eye to the focus subject and opens the negative-space zone.

## Screens Needed
- Splash
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
- Light assets (primary), Masterpiece assets, Moment assets, People assets, Home assets, Texture assets. No text baked into any image.

## AI Logic
Injects lighting tokens into the Grok prompt: `warm natural window light OR single warm practical, soft directional, golden/blue hour, low-contrast shadows, gentle halation`. Negative prompt: `no harsh flash, no cold fluorescent, no midday sun, no neon`. Light choice maps to the Moment's `emotionTag` (from `MomentTemplate`), a soft mapping — never a diagnosis of the user.

## Data Stored
`Asset.styleTokens`: `lightSource`, `colorTemp`, `lightQuality`, `hourOfDay`, `emotionTag`. Light direction informs `negativeSpaceRegion`. Local-first; optional Supabase sync.

## Edge Cases
- Harsh/overexposed output → reject, regenerate softer.
- Cold or fluorescent cast → reject as off-brand.
- Light too dim for text contrast → lift exposure in the text zone only, regenerate.
- Dark mode: ensure warm light still reads against dark UI chrome.

## Build Requirements
- `light-tokens.ts` presets keyed to `emotionTag`.
- Exposure/contrast QA gate on the negative-space region.
- Effort: S–M.

## Definition of Done
- [ ] Every asset uses warm or dusk-blue motivated light — never harsh noon or cold white.
- [ ] Light opens a legible negative-space zone for the text layer.
- [ ] `emotionTag` → light mapping applied and stored.
- [ ] Assets read warm and held in both light and dark UI.
