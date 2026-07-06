# 27 — Energy Patterns

> A gentle sense of a person's rhythms — when they feel open, tired, restless, or calm — so MOOD meets them where they actually are today.

## Purpose
Energy Patterns are the Human Map (Ch. 22) signals that track a user's felt rhythms over time and time-of-day. They exist so the daily Moment and its challenge arrive at a fitting intensity — soft on drained days, more spacious on open ones. They are descriptive rhythms, never a judgment about "low energy" being bad or "productivity" being the goal.

## User Experience
The user feels MOOD adapting to their day. On a low-energy evening, the Moment is quieter and the challenge smaller: "היום אולי מספיק לנשום ליד החלון." ("Today maybe it's enough to breathe by the window.") On an open morning, invitations stretch a little more. MOOD may gently notice rhythm without prescribing: "נראה שהבקרים קלים לך יותר." ("Mornings seem to come easier for you.") — offered, never imposed. No graphs of "energy score," no optimization language.

## Game Mechanic
- Energy `Trait`s: `{ family: "energy", kind, signal: 0–1, confidence, decayRate, evidence[] }`, plus a lightweight `timeOfDayProfile`.
- Inputs: Evening Check-in "how it felt," attempt patterns, session timing — all soft.
- Output: an `energyState` (0–1) that modulates today's Moment tone and challenge intensity, combined with Social Courage (Ch. 26) and Fear Map (Ch. 25).
- Decays and re-learns continuously; a heavy week never becomes a fixed trait.

## Screens Needed
- Today / Daily Moment (intensity/tone)
- Challenge Selection (level sizing)
- Evening Check-in (captures felt energy)
- Patterns (gentle rhythm reflection)

## Visual Assets Needed
- Light assets spanning dawn/dusk warmth to match energy tone (textless).
- Texture and Moment assets for restful vs. open moods.

## AI Logic
Pattern Recognition (Claude + heuristics) surfaces gentle rhythm observations; Challenge Generator uses `energyState` to size intensity; Reflection Generator matches tone. Guardrails: never frame low energy as failure or laziness; never use productivity/optimization language ("be more productive" banned); rhythm notes are always "seems/lately," never fixed. Copy Linter enforces. Confidence-weighted so sparse data yields neutral pacing.

## Data Stored
- Energy `Trait[]` + `timeOfDayProfile` on the `HumanMap`.
- `evidence[]` referencing `JournalEntry`/`Attempt` ids and session timestamps (ISO 8601).
- Derived `energyState` cached per day.
- Local-first; optional Supabase sync.

## Edge Cases
- New user → neutral energy; standard pacing until rhythms emerge.
- Irregular usage → widen uncertainty, avoid over-confident rhythm claims.
- Consistently low energy → keep gentle, never nag or push, surface support resources only if distress flags trip (see Ch. 25).
- Offline → local; timestamps synced later.
- Never present energy as a performance metric or streak.
- RTL long-text; dawn/dusk assets legible in light and dark modes.

## Build Requirements
- Energy kinds + `timeOfDayProfile` in the `humanMap` slice.
- `computeEnergyState()` combining recent signals + time-of-day, feeding Challenge Generator.
- Pattern Recognition rhythm heuristic with confidence gating.
- Effort: ~3 dev days.

## Definition of Done
- [ ] Energy stored as soft 0–1 signals with confidence + decay and a time-of-day profile.
- [ ] Daily Moment tone and challenge size respond to `energyState`.
- [ ] No productivity, optimization, or performance framing appears.
- [ ] Rhythm reflections are tentative and pass the Copy Linter.
- [ ] Works offline; re-learns continuously.
