# 69 — People Language

> How MOOD renders human beings — real, ordinary, unresolved — so the user sees a life, not a model.

## Purpose
People Language defines how humans appear in MOOD imagery. It exists so that when a person is in frame, they feel like someone the user could actually be or love — ordinary, mid-feeling, caught between thoughts — never a glossy model, never a stock smile. This is where the promise ("someone noticed something small about my life") becomes a face.

## User Experience
On **Today / Daily Moment** the user might see a shoulder turned toward a door, a hand hovering before a knock, two people not quite looking at each other. Faces are often partial, turned, or soft — the feeling matters more than the identity. Bodies are diverse, real, un-idealized. The Hebrew title names the small feeling (e.g. "כמעט התקרבתי" — "I almost came closer").

## Game Mechanic
People Language serves loop station 4 by making the emotional invitation personal. Fixed people rules:
- **Casting:** diverse ages, bodies, skin tones, abilities; ordinary, non-model.
- **Framing:** often partial — hands, backs, shoulders, half-faces; identity kept soft.
- **Emotion:** one quiet, unresolved feeling; no big grins, no crying spectacle.
- **Interaction:** gentle near-touch, near-word, near-distance; tension of *almost*.
- **Anonymity:** no recognizable real individuals; no baked identity or text.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library
- Shared Humanity

## Visual Assets Needed
- People assets (primary), Masterpiece assets, Moment assets, Light assets, Texture assets. No text baked into any image.

## AI Logic
Injects people tokens into Grok: `ordinary diverse person, partial framing, single quiet emotion, near-touch, soft identity, no logos on clothing`. Negative prompt: `no supermodel, no big smile, no crying spectacle, no recognizable celebrity, no text on clothing`. People are illustrative of a universal `MomentTemplate` feeling — never a portrait or judgment of the actual user (never diagnose, Ch. 22 Human Map).

## Data Stored
`Asset.styleTokens`: `framing` (partial|full), `emotionTag`, `casting` (age/body/skin diversity flags), `identitySoftness`. No real-person identity data ever stored. Local-first; optional Supabase sync.

## Edge Cases
- Model-like / idealized output → reject, recast ordinary.
- Recognizable real person → reject (identity risk).
- Baked text on clothing/signage → reject (Ch. 75).
- Representation gaps in a batch → rebalance casting tokens.
- Accessibility: never rely on facial expression alone to carry meaning; copy also names it.

## Build Requirements
- `people-tokens.ts` with casting-diversity rotation.
- Identity/text QA gate on ingest.
- Effort: M.

## Definition of Done
- [ ] People read ordinary and diverse, never model-like.
- [ ] Framing favors partial, soft-identity human moments.
- [ ] No recognizable individuals and no baked text on any person.
- [ ] Casting diversity verified across each batch.
