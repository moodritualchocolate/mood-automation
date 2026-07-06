# 28 — Adaptive Profile

> The live synthesis that turns all the soft Human Map signals into today's fitting Moment and challenge — a working view, never a fixed identity.

## Purpose
The Adaptive Profile is the read-side of the Human Map (Ch. 22): a computed, moment-in-time synthesis of strengths, growth areas, fears, social courage, and energy that the daily systems consume. It exists so MOOD can act personally without ever hardening the user into a category. It is a *snapshot for today*, recomputed constantly, never a saved verdict.

## User Experience
The user never sees the Adaptive Profile directly. They experience its results: a Daily Moment that fits, a challenge pitched at brave-but-possible, a reflection that lands. The fit feels like being understood without being explained. If anything ever surfaces, it is momentary and poetic: "היום נראה שקצת שקט יעשה לך טוב." ("Today it seems a little quiet would do you good.") — clearly about *today*, easily dismissed with "לא היום" ("not today").

## Game Mechanic
- Input: the full `HumanMap.Trait[]` with signal × confidence, plus context (date, time-of-day, recent Attempts/JournalEntries).
- Process: weighted synthesis producing a transient `AdaptiveProfile` — `{ momentTone, challengeIntensity, socialSize, tenderEdges[], energyState, computedAt }`.
- Confidence gating: low-confidence signals contribute little; the profile stays universal until evidence grows.
- Output feeds Moment selection, Challenge Generator, and reflection tone.
- Never persisted as identity — recomputed each open; only the inputs (Traits) persist.

## Screens Needed
- Today / Daily Moment (primary consumer)
- Challenge Selection (intensity + social size)
- Moment Detail (reflection tone)

## Visual Assets Needed
- Draws from all categories (Masterpiece, Moment, People, Light, Texture) via Moment selection — textless.
- No dedicated assets; it orchestrates existing pools.

## AI Logic
The Adaptive Profile is the context object passed to Reflection, Challenge, and Pattern engines (Ch. 06). Guardrails: it exposes only soft signals + confidence, forcing tentative phrasing; it carries `tenderEdges` so engines soften near fears (Ch. 25) and respect safety flags. It never contains a type, diagnosis, or label — engines cannot receive one because none exists. Copy Linter validates all downstream copy.

## Data Stored
- `AdaptiveProfile` — transient, cached per day, derived from `HumanMap`; safe to discard/recompute.
- No new persistent identity fields; inputs remain the soft `Trait[]`.
- Local-first computation; optional Supabase sync only of the underlying `HumanMap`, not the transient profile.

## Edge Cases
- Cold start → universal profile (neutral tone, gentle intensity, small social size).
- Conflicting signals → blend with lowered confidence; never force a dominant "type."
- Stale profile (app left open across days) → recompute on focus.
- Offline → fully local; no dependency on cloud.
- Never cache the profile as a durable label or expose it as "who you are."
- RTL/accessibility inherited from consuming screens.

## Build Requirements
- `computeAdaptiveProfile(humanMap, context)` pure function; memoized per day.
- Integration points in Today, Challenge Selection, and the AI engine context builders.
- Recompute-on-focus hook; unit tests asserting no categorical output and confidence gating.
- Effort: ~3–4 dev days.

## Definition of Done
- [ ] Profile is computed transiently from soft signals — never persisted as identity.
- [ ] Output contains tone/intensity/social size/tender edges/energy, no labels.
- [ ] Low-confidence signals produce a universal, gentle experience.
- [ ] Recomputes on each open and works fully offline.
- [ ] All downstream copy passes the Copy Linter.
