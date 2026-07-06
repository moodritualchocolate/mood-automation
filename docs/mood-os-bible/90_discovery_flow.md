# 90 — Discovery Flow

> A playful sequence of small either/or choices that quietly seeds the Human Map — a game, never a questionnaire.

## Purpose
Discovery is how MOOD learns a person without interrogating them (see Ch. 19 Discovery Engine, Ch. 06 station 1). It exists to seed the `HumanMap` with soft `Trait` signals through choices that feel like play, so the very first Moments already feel personal. It must never read as a personality test, a diagnosis, or a form.

## User Experience
The user meets a paced series of gentle two-option prompts over timeless imagery: "מה מושך אותך יותר?" ("what draws you more?") with two artworks, or "ערב מושלם הוא…" ("a perfect evening is…"). They tap one; it responds with a warm micro-transition, never a right/wrong. A soft ribbon of light grows as they go — progress felt, not counted. Occasional open moments: "מה היית רוצה יותר בחיים?" with three tappable words. It ends warmly: "התחלנו להכיר אותך." ("we've started to get to know you."). Length is short — 7–12 choices — and can be resumed later. The feeling target: *this was fun, and it saw me.*

## Game Mechanic
A queued sequence of `DiscoveryPrompt` items (binary or small multi-choice). Each choice writes soft signals to one or more `Trait`s (0–1, with confidence + decay), never a hard label. States: `intro → prompt_n → summary → handoff`. Adaptive ordering: later prompts can branch on earlier signals to reduce redundancy. No score, no "type", no result page — only a gentle "we've begun." Can pause/resume; Human Map keeps updating over time via daily play, so Discovery is a seed, not a verdict.

## Screens Needed
- Discovery Flow
- Today / Daily Moment (handoff)
- Patterns (where signals later surface gently)

## Visual Assets Needed
- Moment assets and Masterpiece assets (choice imagery)
- People, Object, Light assets (paired options). No text baked in; prompt words are live RTL layers.

## AI Logic
Primarily deterministic mapping (choice → `Trait` deltas) plus optional Pattern Recognition (Ch. 06) to order prompts adaptively. Guardrails: never diagnose, never assign a category or "type," never show a score. Any generated micro-copy passes Tone Guardrails + Copy Linter.

## Data Stored
- `HumanMap` with `Trait[]` (id, softSignal 0–1, confidence, decay, updatedAt).
- `DiscoveryPrompt` responses (promptId, choice, ISO 8601 timestamp) for resume + replay.
- Local-first source of truth; optional Supabase sync.

## Edge Cases
- First run: this is the primary path out of Onboarding.
- Partial completion: resume where left off; a half-seeded map still serves gentle universal Moments.
- Skip entirely: serve neutral starter Moments; keep learning from daily choices.
- Offline: fully local; no network required.
- Long RTL option words: reflow, keep tap targets ≥44px (Ch. 100).
- Reduced motion: fade choices, no parallax.

## Build Requirements
- `DiscoveryFlow` orchestrator + `PromptChoice` component, Tailwind, RTL, light/dark, mobile-first.
- Deterministic trait-mapping module; optional `/api/discovery-order` for adaptive sequencing.
- Zustand autosave + BroadcastChannel; resumable queue in local storage.
- Effort: M.

## Definition of Done
- [ ] 7–12 playful choices render in Hebrew RTL over art, no baked text.
- [ ] Each choice writes soft `Trait` signals (0–1), never a label or type.
- [ ] No score, no result/"personality" page; ends with warm handoff.
- [ ] Pause/resume works; partial map still produces Moments.
- [ ] Fully offline-capable; tap targets and reduced-motion verified.
