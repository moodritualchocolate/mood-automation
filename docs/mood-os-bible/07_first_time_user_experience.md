# 07 — First-Time User Experience

> The first three minutes: a playful Discovery Flow that seeds the Human Map without a single questionnaire.

## Purpose
The First-Time User Experience (FTUE) exists to open the Core Loop at **station 1 (Discovery)** and **station 2 (Human Map)** for a brand-new `User`. It must earn trust fast, feel like play rather than a form, and produce enough soft signal to serve a first meaningful Daily Moment. It sets the emotional contract: MOOD notices you gently and never judges you.

## User Experience
After **Splash**, the user enters **Onboarding** then the **Discovery Flow**: a sequence of 8–12 image-led choices — two pieces of timeless artwork, tap the one that "feels more like you." Hebrew micro-copy carries the tone: "אין תשובה נכונה" ("there is no right answer"). No names of traits are shown, no sliders, no scores. It ends warmly — "נעים להכיר" ("nice to meet you") — and drops the user straight into their first **Today / Daily Moment**. The whole flow is under three minutes and skippable.

## Game Mechanic
- **States:** `not_started → discovering → seeded → complete`.
- **Input:** each choice is a binary image-pair tap mapped to weighted `Trait` deltas.
- **Output:** a seeded `HumanMap` with initial soft signals (0–1) at low confidence, high decay.
- Choices never map 1:1 to a diagnosis; each pair nudges 2–4 traits by small floats.
- Skipping is allowed at any point → `seeded` with a sparse map; the loop still runs.
- First Daily Moment selection reads the seeded map; if too sparse, falls back to a universal starter Moment.

## Screens Needed
- Splash
- Onboarding
- Discovery Flow
- Today / Daily Moment (first arrival)

## Visual Assets Needed
- Masterpiece assets (Splash + Onboarding hero)
- People assets, Home assets, Object assets, Light assets (Discovery pairs)
- Texture assets (backgrounds). No text of any kind baked into images; all copy is a live RTL text layer.

## AI Logic
Not AI-generated at choice time — the Discovery pairs are curated and pre-mapped for determinism and speed. **Memory Engine** stores results for later context; the first **Reflection Generator** call runs only once the first Moment is served, passing seeded traits as input. Guardrails: never surface trait names, never diagnose, Copy Linter checks all onboarding strings.

## Data Stored
- `User` (created, locale=he, dir=rtl).
- `HumanMap` with `Trait[]` (each: key, signal 0–1, confidence, decay, updatedAt ISO 8601).
- `DiscoveryChoice[]` (pairId, chosen, timestamp) for auditability.
Local-first in Zustand + local storage; optional Supabase sync on account creation. Copy fields Hebrew.

## Edge Cases
- User skips entirely → sparse `seeded` map, universal first Moment, no nagging.
- Offline first run → everything local; account/sync optional and deferred.
- Returning user who cleared data → treat as new `User`, re-seed.
- Long Hebrew strings / RTL mirroring must not clip on small screens.
- Accessibility: image pairs need alt semantics and large tap targets; motion-reduced variant.
- No streak or "day 1 of X" language anywhere.

## Build Requirements
- `DiscoveryFlow` component + `useDiscoveryStore` (Zustand).
- Static mapping table `discovery-pairs.ts` (pair → trait deltas).
- `/api/human-map/seed` (optional, local-first default).
- Prefetch first Moment asset for instant handoff.
- Effort: M.

## Definition of Done
- [ ] Flow completes in under 3 minutes; fully skippable.
- [ ] Produces a valid seeded `HumanMap` (or sparse map on skip).
- [ ] No trait names, scores, or diagnoses shown.
- [ ] Hands off directly to first Daily Moment (station 3–4).
- [ ] Runs offline; syncs when account added.
- [ ] RTL + reduced-motion + large-tap accessibility verified.
