# 67 — Photography Language

> How MOOD images behave as photographs — lens, distance, focus, and grain — so every frame feels caught, not staged.

## Purpose
Photography Language defines the optical grammar of MOOD: how the imaginary camera sees. It exists so images feel like a real moment quietly observed — a photograph a painter finished by hand — rather than an illustration or a render. This grounds the artwork in believable human intimacy, reinforcing the promise that someone *noticed* a real second of a life.

## User Experience
On **Today / Daily Moment**, the artwork feels like a still from a film the user half-remembers: shallow focus on one small thing (a hand, a doorway, steam off a cup), soft edges falling away, a gentle film grain. It never feels like a phone snapshot or a glossy ad. The Hebrew title rests in the softly out-of-focus area (e.g. "רגע לפני" — "the moment before").

## Game Mechanic
Photography Language serves loop station 4 by making the Moment feel *found*. Fixed optical rules:
- **Lens:** 35–85mm equivalent look; natural perspective, no wide-angle distortion.
- **Aperture:** shallow depth of field; one plane in focus, backgrounds soft.
- **Focus subject:** a single small human detail, off-center.
- **Grain/finish:** fine analog grain, gentle halation in highlights; no digital sharpening.
- **Motion:** occasional soft motion blur to imply a living, moving world.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
- Masterpiece assets, Moment assets, People assets, Object assets, Light assets, Texture assets. No text baked into any image.

## AI Logic
Injects optical tokens into the Grok prompt after Art Direction: `35–85mm, shallow depth of field, single-subject focus, fine analog grain, soft halation, natural perspective`. Negative prompt adds `no fisheye, no oversharpening, no HDR, no studio flash`. It does not alter subject choice (driven by `MomentTemplate`) or copy (Claude). Not text-generating.

## Data Stored
`Asset.styleTokens`: `focalLength`, `depthOfField`, `focusSubject`, `grainProfile`, `motionBlur` (bool). `Asset.negativeSpaceRegion` typically maps to the soft/out-of-focus zone. Local-first; optional Supabase sync.

## Edge Cases
- Everything in focus / flat → reject; no calm zone for text.
- Distorted wide-angle faces → reject.
- Grain so heavy it lowers text contrast → reduce grain, regenerate.
- Long Hebrew titles: prefer larger soft zones (defer to Ch. 73).

## Build Requirements
- `photography-tokens.ts` module (lens/DoF/grain presets).
- Focus-map QA to confirm a soft region exists for the text layer.
- Effort: S–M.

## Definition of Done
- [ ] Every asset has a single, clear focus subject and soft fall-off.
- [ ] No wide-angle distortion, HDR, or flash artifacts.
- [ ] Grain never drops overlay-text contrast below AA.
- [ ] Sample set reads as painterly film stills, not snapshots.
