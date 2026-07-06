# 56 — Reflection Generator

> The Reflection Generator writes the short, living Hebrew reflection under each Daily Moment — the sentence that makes a person feel quietly seen.

## Purpose
The Reflection is the emotional heart of the daily loop (see Ch. 01 Vision). This engine turns a person's `HumanMap`, recent choices, and the day's `MomentTemplate` into a few warm Hebrew sentences that notice something small and true. It is the single most important piece of AI copy in the product — the direct delivery of the core promise.

## User Experience
On the Today / Daily Moment screen, beneath the artwork and tiny title, the user reads a short reflection written for them. It observes, wonders, and sometimes invites. Example: "יש בך משהו ששם לב לאנשים אחרים לפני שהוא שם לב לעצמו. היום, אולי, מותר גם לך" ("there's a part of you that notices others before yourself — today, maybe, it's okay for you too"). Tone: intimate, unhurried, never clinical, never congratulatory about outcomes.

## Game Mechanic
Input → generate → guardrail → deliver. Inputs: current `DailyMoment`/`MomentTemplate`, top soft `Trait` signals, last N `Attempt`s and `JournalEntry` sentiment (via Memory Engine, Ch. 59). Output: a `Reflection` (2–4 short Hebrew sentences). It passes Tone Guardrails (Ch. 62) and Copy Linter (Ch. 63). Success framing is always about noticing and the attempt — never scores, streaks, or results.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library (stored past reflections)

## Visual Assets Needed
- Moment assets and Light assets (the artwork the reflection sits over)
No text baked into images; the reflection renders in the live RTL text layer.

## AI Logic
Engine: **Reflection Generator** on the **Claude API** (`claude-opus-4-8`, adaptive thinking, streaming). Retrieval context comes from the Memory Engine. Guardrails: never diagnose (Ch. 55), never label a `Trait`, never reference outcomes/streaks. Output constrained to Hebrew RTL. Full system + user templates in Ch. 64. On failure, serve a cached hand-authored reflection.

## Data Stored
- `Reflection` { id, momentId, hebrewText, traitContextIds[], engineVersion, createdAt (ISO 8601) }
- Link to `LibraryItem` when the Moment enters the Living Library.
Local-first source of truth; optional Supabase sync. Copy fields store Hebrew strings.

## Edge Cases
- First run / empty HumanMap: universal, warm reflection assuming nothing.
- Offline: serve cached reflection tied to the MomentTemplate.
- Skipped days: no guilt copy, no "you missed" framing — never a streak penalty.
- Distress sentiment in Journal: route to User Safety (Ch. 61); do not counsel.
- Long RTL text: layout must not clip; cap at ~4 sentences.

## Build Requirements
- `/api/reflection` endpoint calling Claude with the Ch. 64 template.
- Memory Engine retrieval of relevant past Moments/Attempts.
- Guardrail middleware + fallback bundle of hand-authored Hebrew reflections.
- Effort: medium–high (highest copy-quality bar in the product).

## Definition of Done
- [ ] Generates 2–4 warm Hebrew sentences per Daily Moment.
- [ ] Uses Memory Engine context without ever labeling a Trait.
- [ ] Passes Tone Guardrails + Copy Linter on every generation and regeneration.
- [ ] Offline and failure serve cached reflections, never errors.
- [ ] No outcome/streak/score language ever appears.
