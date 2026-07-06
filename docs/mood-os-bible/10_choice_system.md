# 10 — Choice System

> How the user's small, playful choices — in Discovery and at every Moment — quietly shape the Human Map without ever feeling like a test.

## Purpose
The Choice System is the connective tissue between the user's taps and their evolving self. It powers **station 1 (Discovery)** and feeds **station 2 (Human Map)**, and it governs the pick at **station 5 (Challenge)**. It exists so the app *learns the person through choices, not questionnaires*, turning ordinary interaction into soft signal.

## User Experience
Choices feel like play, never assessment. In **Discovery Flow** the user taps the artwork that "feels more like me." At a Moment the user may accept or decline an invitation, or choose a Challenge level. Copy reassures: "אין תשובה נכונה, רק מה שנכון לך היום" ("no right answer, only what's true for you today"). Declining is a first-class choice, shown as gently as accepting — no red, no penalty, no "are you sure you want to quit?" A user always feels their choice was heard, never graded.

## Game Mechanic
- **Choice types:** `discovery_pair`, `invitation` (accept|decline), `challenge_level` (easy|medium|brave), `moment_response` (kept|passed).
- **States per choice:** `offered → made → recorded`. Choices are non-reversible for the day but never punished.
- **Signal mapping:** each choice applies small weighted deltas to `Trait` signals (0–1) with confidence up, decay reset. Deltas are tiny (e.g. ±0.03–0.08) so no single tap defines a person.
- **Inputs:** choice event + context (Moment theme, level). **Outputs:** `Trait` updates + selection weighting for future Moments.
- Declining is a valid signal (e.g. nudges "challenge readiness" softly down, never labeled).

## Screens Needed
- Discovery Flow
- Today / Daily Moment
- Challenge Selection

## Visual Assets Needed
- People, Home, Object, Light, Texture assets (choice imagery)
- Masterpiece assets (Discovery pairs). No text baked into any image; option labels are live RTL text.

## AI Logic
- Mostly **not AI-driven at choice time** — mapping is deterministic weighted tables for speed and predictability.
- **Pattern Recognition** (Claude + heuristics) later reads accumulated choices to surface gentle patterns (Ch. 09 Pattern station).
- Guardrails: choices never yield a diagnosis or label; the user never sees which trait a choice moved; Copy Linter checks all option and reassurance copy.

## Data Stored
- `ChoiceEvent` (id, userId, type, contextRef, value, timestamp ISO 8601).
- Resulting `Trait` deltas applied to `HumanMap`.
- Local-first (Zustand + local storage); optional Supabase sync. Copy Hebrew.

## Edge Cases
- **No choice made / timeout:** treated as `passed`, neutral, no penalty.
- **Rapid tapping / farming:** rate-limit signal impact; extra taps don't over-weight.
- **Offline:** choices recorded locally, deltas applied locally, synced later.
- **Decline everything:** valid path; map grows slowly; never scolded.
- **RTL:** two-option layouts must mirror correctly; equal visual weight for both options.
- **Accessibility:** large tap targets, keyboard/switch access, reduced-motion.

## Build Requirements
- `useChoiceStore` (Zustand) + deterministic `choice-map.ts` delta tables.
- Choice components with mirrored RTL layout and equal-weight styling.
- Batched `/api/human-map/apply` (optional; local-first default).
- Effort: M.

## Definition of Done
- [ ] Every choice type records a `ChoiceEvent` and applies bounded `Trait` deltas.
- [ ] Decline is styled as equal to accept — no penalty affordances.
- [ ] No single choice can dominate a trait (delta caps enforced).
- [ ] Trait names never revealed to the user.
- [ ] Works offline; syncs; RTL + accessibility verified.
- [ ] Copy Linter passes on all option/reassurance strings.
