# 09 — Moment System

> The heart of MOOD: timeless artwork + a tiny title + a living reflection + an optional invitation and Challenge.

## Purpose
The Moment System is **station 4** of the Core Loop and the emotional core of the whole product. A Moment delivers the core promise — "someone noticed something small about my life I never knew how to say." It is the atomic unit the user meets each day and the atom that later fills the Living Library. Never called a "card."

## User Experience
On **Today / Daily Moment** the user sees full-bleed **Moment artwork**, then a tiny Hebrew title layered live over it (e.g. "הפחד שלפני שיחה" — "the fear before a conversation"), then a short living **reflection** that speaks quietly and specifically. Below sits an optional invitation and, if present, a doorway to **Challenge Selection**. Tapping the artwork opens **Moment Detail** with the full reflection and, later, its place in the Library. The tone is intimate, unhurried, never clinical.

## Game Mechanic
- A `Moment` = `MomentTemplate` (reusable content skeleton) materialized into a `DailyMoment` for one user/date.
- **Composition:** `Asset` (visual) + title (Hebrew) + `Reflection` (Hebrew, generated) + optional invitation + optional `Challenge`.
- **States:** `issued → met → detail_viewed → settled_in_library`.
- **Inputs:** `HumanMap` signals, `Memory Engine` history, template metadata.
- **Outputs:** a personalized reflection and, when the template carries one, a Challenge with three `ChallengeLevel`s.
- A Moment is met once per day (see Ch. 08); it is immutable after issue except for user's own journal linkage.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Challenge Selection (when a Challenge is attached)

## Visual Assets Needed
- Moment assets (primary artwork)
- Masterpiece assets (hero Moments / Rare Moments — see Ch. 15)
- People, Home, Object, Light, Texture assets (compositional variety). Absolutely no text baked into any image; title/reflection are live RTL text layers.

## AI Logic
- **Reflection Generator** (Claude) writes the reflection in Hebrew from: template theme, active `HumanMap` traits (soft, unnamed), and recent memory. Output is warm, specific, non-diagnostic, second-person-soft.
- **Memory Engine** prevents thematic repetition and can reference past Moments gently.
- Guardrails: never name a trait, never diagnose, never prescribe; all output passes Tone Guardrails + **Copy Linter** before render.

## Data Stored
- `MomentTemplate` (id, theme, tone, assetRefs, hasChallenge, copyScaffold).
- `Moment`/`DailyMoment` (id, userId, templateId, date, titleHe, reflectionId, challengeId?, status).
- `Reflection` (id, textHe, model, generatedAt ISO 8601, linterPass).
Local-first; optional Supabase sync. Copy fields Hebrew.

## Edge Cases
- **Generation failure/offline:** fall back to the template's evergreen Hebrew scaffold reflection.
- **Linter rejection:** regenerate up to N times, else serve safe scaffold copy.
- **Long reflection / RTL:** Moment Detail scrolls; title truncates gracefully.
- **No Challenge attached:** invitation-only Moment is valid; loop continues to Library.
- **Accessibility:** artwork needs descriptive alt; text meets contrast over image (scrim layer).
- No scores or ratings on a Moment ever.

## Build Requirements
- `MomentView` + `MomentDetail` components with live RTL text-over-art layer + scrim.
- `/api/reflection` (generate + linter gate) and template store.
- Asset loader with blur-up placeholder; offline template cache.
- Effort: L.

## Definition of Done
- [ ] Moment renders artwork + live Hebrew title + reflection, never baked text.
- [ ] Reflection is generated, non-diagnostic, and Copy-Linter-passed.
- [ ] Optional Challenge doorway appears only when attached.
- [ ] Word "card" never appears in code-facing or user-facing copy.
- [ ] Offline fallback reflection works; contrast/alt/RTL verified.
- [ ] Moment settles into Living Library (Ch. 13).
