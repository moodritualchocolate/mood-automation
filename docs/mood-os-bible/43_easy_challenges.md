# 43 — Easy Challenges

> The Easy level is a small, low-exposure act anyone can live in minutes — the gentle first rung that proves courage can be tiny.

## Purpose
Easy challenges exist so that no one is ever locked out of trying. They lower the threshold of a Moment's theme to something almost frictionless, letting a person on a hard day still take one real step and feel the honest pride of having tried (Ch. 41). Easy is not "lesser" — for a person low on social courage, an Easy step can be the bravest thing they do all week. This chapter defines the design constraints of the Easy `ChallengeLevel`.

## User Experience
On Challenge Selection the Easy option reads as warm and doable, never patronizing. It should feel like something the user could do in the next hour without rearranging their life. Example (social confidence ladder): Easy = "תגיד שלום לזר היום" ("say hello to a stranger today"). Example (kindness ladder): Easy = "שלח הודעה קטנה למישהו שחשבת עליו" ("send a small message to someone you thought about"). The copy names one concrete act, one place, one minute of exposure. After living it, the Evening Check-in celebrates the attempt equally with any other level.

## Game Mechanic
Easy is one of three `ChallengeLevel` entries. Constraints the generator must honor: `estMinutes ≤ 10`, `socialExposure ≤ 0.3`, no travel required, no dependency on another person's response for completion. Because success = trying, an Easy act is "lived" the instant the user attempts it — a stranger not replying to a hello still counts fully. `Attempt.chosenLevel = easy` produces the same honored outcome as any level.

## Screens Needed
- Challenge Selection
- Today / Daily Moment
- Evening Check-in

## Visual Assets Needed
- Moment assets (shared artwork)
- Light assets (soft, encouraging warmth)
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) writes the Easy string from the Moment theme with a low-exposure constraint and readiness bias. Guardrails: must be safe, legal, consensual, self-contained, and outcome-agnostic (Ch. 52). Copy Linter blocks pressure words. Never diagnose the user's low readiness — treat it as today's weather, soft and decaying.

## Data Stored
`ChallengeLevel { level: "easy", copyHe, estMinutes, socialExposure, safetyFlags }` on the parent `Challenge`. Chosen level recorded on `Attempt`. Local-first; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- User picks Easy every day: honored silently; never nudged upward.
- Even Easy feels too much: skip path remains, penalty-free (Ch. 41).
- Offline: Easy string cached with the DailyMoment.
- Long RTL copy: single-act phrasing keeps it short; still test wrapping.
- Accessibility: readable at large text sizes, distinguishable without color.

## Build Requirements
Reuse the level selector; generator constraint profile for Easy; cached payload. Small effort.

## Definition of Done
- [ ] Easy act is doable in ≤ 10 minutes with low exposure.
- [ ] Completion never depends on another person's reaction.
- [ ] Easy is celebrated equally with Medium and Brave.
- [ ] No patronizing or "just" framing in copy.
- [ ] Hebrew RTL renders in light and dark.
