# 19 — Discovery Engine

> The playful, wordless first meeting where MOOD learns who you are through choices, never questions.

## Purpose
The Discovery Engine is how MOOD gets to know a new user without ever asking "How do you feel about yourself?" It exists to seed the Human Map (see Ch. 22) with soft early signals so the very first Daily Moment already feels personal. It must feel like a gentle game of taste and instinct — not an intake form, not a personality test, not a diagnosis.

## User Experience
On first open, after Splash and Onboarding, the user enters the Discovery Flow. They see a slow sequence of beautiful, textless artworks and are invited to choose between them — "מה מושך אותך יותר?" ("What draws you more?"). No right answers, no scoring, no timer. Choices feel like following a feeling: a quiet window vs. a crowded street, still water vs. open sky. The tone is warm and unhurried: "אין תשובות נכונות. רק מה שקרוב אליך." ("No right answers. Just what feels close to you."). Users can skip any choice ("לא בטוח/ה") without penalty. Discovery ends softly: "התחלנו להכיר אותך." ("We've started to get to know you.")

## Game Mechanic
- States: `not_started → in_progress → seeded → complete`.
- Input: a series of 8–14 binary/triary visual choices (see Ch. 21) plus optional skips.
- Each choice maps to weighted nudges on multiple `Trait` signals (0–1 floats), never a single label.
- Output: an initial `HumanMap` with low-confidence Traits (confidence ≤ 0.3) that decay and recalibrate later (see Ch. 29).
- Skips reduce confidence, never block progress. Minimum viable seed = 5 answered choices.

## Screens Needed
- Onboarding
- Discovery Flow
- Today / Daily Moment (first destination after seeding)

## Visual Assets Needed
- Masterpiece assets and Moment assets used as choice pairs (no text baked in — all prompts/copy rendered in a live layer).
- Light assets and Texture assets for background mood.
- People assets for social-instinct choices.

## AI Logic
Not AI-generated content, but AI-adjacent mapping. Discovery uses a deterministic **choice→signal weighting table**, not Claude. Guardrail: mappings only ever nudge soft signals with low confidence; they never produce categories, types, or verdicts. Pattern Recognition (Ch. 06) does not run on Discovery alone — too little data. Never diagnose, never label.

## Data Stored
- `HumanMap` (created, `seededFrom: "discovery"`).
- `Trait[]` — each `{ id, kind, signal: 0–1, confidence, decayRate, updatedAt }`.
- `DiscoverySession` — `{ choices[], skips[], startedAt, completedAt }`.
- Local-first (Zustand + local storage); optional Supabase sync when signed in.

## Edge Cases
- User skips everything → seed with neutral 0.5 signals at confidence 0.1; first Moment stays universal.
- Offline → fully functional; sync deferred.
- User quits mid-flow → resume from last choice; partial seed allowed.
- Long-text RTL glosses must wrap cleanly; accessibility: each artwork has an alt description and choices are keyboard/screen-reader navigable.
- Re-running Discovery later merges, never overwrites (see Ch. 29).

## Build Requirements
- `<DiscoveryFlow>` component with swipe/tap choice pairs, RTL layout.
- Choice-weighting config (JSON) versioned in repo.
- Zustand `discoverySlice`; local persistence; Supabase `human_maps` + `discovery_sessions` tables.
- Effort: ~4–5 dev days incl. asset wiring.

## Definition of Done
- [ ] New user completes Discovery in under 3 minutes.
- [ ] A valid `HumanMap` with soft Traits exists after ≥5 choices.
- [ ] No screen shows a score, type, or label.
- [ ] Skips never block progress and never shame.
- [ ] Works fully offline and syncs when signed in.
