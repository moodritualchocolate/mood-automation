# 41 — Challenge Philosophy

> A Challenge is a small, real-world act the user chooses to live today, where the only measure of success is that they tried.

## Purpose
The Challenge is the beating heart of the Core Loop (see Ch. 01): the moment a quiet self-noticing becomes a lived act in the real world. This chapter fixes the philosophy every other Volume 05 chapter answers to. A `Challenge` is never a task, a test, or a dare — it is an invitation to take one honest step outside the app. Its entire reason to exist is to let a person feel courage, not to grade them. The single rule the whole engine defends: **success = trying, never the outcome**.

## User Experience
After the Daily Moment (Ch. 04) the user may be offered a Challenge tied to what was noticed about them. It arrives as a gentle invitation, never an assignment. Example framing copy: "רוצה לנסות משהו קטן היום?" ("want to try something small today?"). The user sees three levels — Easy, Medium, Brave — and picks one, or skips with no penalty. Choosing is itself honored. Skip copy: "לא היום — וזה בסדר גמור" ("not today — and that's completely fine"). The user leaves the app to live it, then returns in the evening (Ch. 07) to reflect. Nothing about the flow implies obligation, ranking, or judgment.

## Game Mechanic
Each Daily Moment may attach one `Challenge` with three `ChallengeLevel` options: `easy | medium | brave`. The user selects at most one level, creating an `Attempt`. Attempt states: `chosen → lived | not_lived`, then `journaled`. Both `lived` and `not_lived` are valid, honored endpoints — there is no failure state. A fourth path, `skipped` (no level chosen), is equally valid and never penalized. No streaks, no scores, no XP. Opt-in Impossible challenges (Ch. 46) are aspirational only and never assigned by default.

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Evening Check-in

## Visual Assets Needed
- Moment assets (the artwork the Challenge lives beneath)
- Light assets and Texture assets (to signal warmth, not urgency)
No text is ever baked into images; all copy is a live RTL text layer.

## AI Logic
Challenge Generator (Claude — see Ch. 06) produces the three levels from `HumanMap` signals and the current `Moment`. Guardrails: every challenge must be safe, legal, consensual, age-appropriate, and outcome-agnostic (Ch. 52). All outputs pass Tone Guardrails and the Copy Linter, which blocks "should", "must", "fail", and shame framing. Never diagnose, never label.

## Data Stored
`Challenge { id, momentId, theme, levels: ChallengeLevel[] }`, `ChallengeLevel { level, copyHe, safetyFlags }`, `Attempt { id, challengeId, chosenLevel, state, createdAt }`. Copy fields store Hebrew strings; timestamps ISO 8601. Local-first source of truth; optional Supabase sync.

## Edge Cases
- No challenge offered that day: Moment stands alone, still complete.
- Skipped: honored, never counted against the user.
- Offline: selection and living work fully locally.
- Abandoned mid-day: rolls into Evening Check-in as "didn't try", framed safely.

## Build Requirements
Challenge model + selection component wired to Today screen; Zustand state with autosave; Challenge Generator endpoint behind Copy Linter. Small effort atop existing Moment infra.

## Definition of Done
- [ ] Every challenge offers exactly three levels: Easy, Medium, Brave.
- [ ] No copy implies obligation, ranking, or failure.
- [ ] Skip path present and penalty-free.
- [ ] Success defined as attempt in all surfaces.
- [ ] Hebrew RTL copy renders in light and dark.
