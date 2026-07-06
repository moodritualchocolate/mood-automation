# 50 — Boundary Challenges

> Boundary challenges invite the user to protect their own space, time, and yes/no — the theme family that turns quiet self-abandonment into gentle self-respect.

## Purpose
Many people over-give, over-agree, and disappear to keep the peace. Boundary challenges exist to let a person practice the small, honest "no" and the honest ask for space, building the felt sense that their limits are allowed. This is the mirror of Kindness (Ch. 49): here the care points inward. This chapter defines the Boundary theme family and its Easy/Medium/Brave ladder (Ch. 42).

## User Experience
When the Human Map signals over-accommodation or depletion as a growth area, the Daily Moment may offer a Boundary challenge. Example ladder:
- **Easy** — "קח לעצמך חמש דקות של שקט בלי להתנצל" ("take five minutes of quiet for yourself without apologizing").
- **Medium** — "אמור 'אני צריך לחשוב על זה' במקום להסכים מיד" ("say 'I need to think about it' instead of agreeing right away").
- **Brave** — "אמור 'לא' למשהו שתמיד הסכמת לו" ("say 'no' to something you always agreed to").
The user lives it and journals the trying. Saying no even once is a full success, whatever the other person's reaction.

## Game Mechanic
A Boundary `Challenge` carries three `ChallengeLevel` entries scaling the difficulty of self-protection. Success is defined by the act of asserting the limit, never by whether it was accepted gracefully. `Attempt` honored identically at all levels. Boundary challenges must always keep the user physically and relationally safe — never push a "no" in a context where it could endanger them (Ch. 52).

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Evening Check-in

## Visual Assets Needed
- People assets and Object assets (space, room to breathe)
- Light assets (calm, grounding)
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) writes the three Hebrew levels from the Moment theme and over-accommodation signal. Guardrails (Ch. 52): the boundary must be safe to assert, non-aggressive, legal, age-appropriate, outcome-agnostic; never suggest confronting someone in a way that risks the user's safety. Copy Linter blocks shame and "you're too much" framing. Never diagnose people-pleasing.

## Data Stored
`Challenge { theme: "boundary", levels }`, `ChallengeLevel { copyHe, socialExposure, safetyFlags }`, `Attempt`. Soft `Trait` for self-respect/limits (0–1 + confidence + decay). Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- Pushback from the other person: reframed as courage, never failure (Ch. 53).
- Unsafe relationship context (coercion/abuse): suppress confrontation, offer a self-only safe fallback and gentle support copy (Ch. 52).
- Guilt after saying no: Evening copy normalizes it warmly.
- Offline: levels cached with the DailyMoment.
- Long RTL copy and accessibility as elsewhere.

## Build Requirements
Boundary theme profile with a heightened safety gate; reuse level selector and Attempt flow. Small-to-medium effort.

## Definition of Done
- [ ] Ladder present: quiet time without apology → pause before agreeing → say no.
- [ ] Success = asserting the limit, never being accepted gracefully.
- [ ] Never asks a "no" that could endanger the user.
- [ ] Safe self-only fallback exists for unsafe contexts.
- [ ] Hebrew RTL renders in light and dark.
