# 123 — Phase 2 — Discovery Engine

> Phase 2 adds playful Discovery and an evolving Human Map so the Moment stops being one-size-fits-all and starts feeling personal.

## Purpose
Phase 1 proved one Moment can land. Phase 2 makes MOOD learn the person through play, not questionnaires, then uses that to shape which Moment and Reflection they meet. This is where "someone noticed something about me" becomes true across days instead of a single lucky hit. It builds the Discovery Engine and the non-diagnostic Human Map that every later system reads from.

## User Experience
On first open the user meets an Onboarding and a short Discovery Flow — small, playful choices, never a survey. Example prompt style: two timeless images, "מה מושך אותך יותר?" ("which pulls you more?"). Over days the Daily Moment quietly adapts: the Reflection references what MOOD has gently learned. The user never sees a diagnosis, score, or profile — only Moments that fit a little better.

## Game Mechanic
**Scope IN:** Discovery Flow (Ch. 19), question types (Ch. 20), the `HumanMap` of soft `Trait` signals, and Moment selection driven by those signals. Runtime Reflection Generator turns on with the authored copy as fallback.
**Scope OUT:** Challenge personalization depth (Phase 3), Patterns (Phase 4), Ripple (Phase 5), accounts/sync. This phase **implements** Ch. 19–20 (Discovery), Ch. 22 Human Map (core-loop step 2), and personalizes Ch. 30–31 Moments.
**Entry criteria:** Phase 1 exit met and demoed; Discovery question bank authored and tone-approved.
**Exit criteria:** a user's Human Map visibly shifts Moment/Reflection choice across ≥3 days, with zero diagnostic language and no labels shown.
**Demo goal:** two testers run Discovery differently and receive noticeably different, better-fitting Moments and Reflections.

## Screens Needed
- Onboarding
- Discovery Flow
- Today / Daily Moment
- Challenge Selection
- Evening Check-in
- Living Library

## Visual Assets Needed
- People assets, Object assets, Home assets (Discovery choice imagery)
- Moment assets, Light assets, Texture assets
Grok-generated, painterly-photographic, warm light. NO text baked into images; Discovery prompts are live RTL layers.

## AI Logic
Reflection Generator (Claude, Ch. 06 / Ch. 54) now runs at runtime, taking `HumanMap` signals as input; authored copy remains the fallback. Discovery choices update `Trait` signals as soft floats (0–1) with confidence and decay — never hard categories. Guardrails: never diagnose, never label, never surface a signal as a verdict. All copy passes Tone Guardrails + Copy Linter.

## Data Stored
- `HumanMap` (per anonymous local id) holding `Trait`s (strength/growth/fear/etc., 0–1 signal + confidence + decay)
- Discovery responses (choice ids, timestamps)
- `MomentTemplate` selection metadata, resolved `Reflection`
Local-first source of truth; Supabase sync still out of scope. Hebrew strings; ISO 8601.

## Edge Cases
- Skipped Discovery: fall back to Phase 1 authored Moment, no pressure.
- Sparse signals: low confidence → safe, general Moments, never a guess presented as fact.
- Contradictory choices: decay and confidence smooth them; no "wrong answer."
- Offline: Discovery runs locally; Reflection uses authored fallback.
- Accessibility: choices operable by keyboard/screen reader; images have alt text.
- Long RTL prompt text: never clips.

## Build Requirements
Adds `DiscoveryFlow` and `HumanMap` store slices to the Phase 1 base. Claude Reflection endpoint with offline authored fallback. Signal-update logic (float + confidence + decay). Next.js 14, TypeScript, Tailwind, RTL, PWA, local-first. Effort: medium.

## Definition of Done
- [ ] Discovery Flow runs as play, not a questionnaire, fully in Hebrew RTL.
- [ ] `HumanMap` stores soft `Trait` signals with confidence + decay; no hard labels.
- [ ] Moment/Reflection selection demonstrably reflects the Human Map.
- [ ] No diagnosis, score, or profile ever shown to the user.
- [ ] Reflection Generator runs with a working authored fallback offline.
- [ ] Copy Linter passes; no banned concepts.
