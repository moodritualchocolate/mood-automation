# 44 — Medium Challenges

> The Medium level is a meaningful stretch — a real step with mild vulnerability that asks a little more courage than Easy, while staying safe and reachable.

## Purpose
Medium challenges are the middle rung that lets a person move without leaping. They exist so growth can be gradual: the same Moment theme rendered with enough vulnerability to matter, but not so much that it overwhelms. Medium is where most everyday courage lives. This chapter defines the design constraints of the Medium `ChallengeLevel` and how it bridges Easy (Ch. 43) and Brave (Ch. 45).

## User Experience
On Challenge Selection, Medium reads as "a real thing, but I can do it." It usually adds one element of the unknown — initiating, sustaining, or asking. Example (social confidence ladder): Medium = "פתח שיחה קצרה עם מישהו" ("start a short conversation with someone"). Example (kindness ladder): Medium = "עשה טובה קטנה למישהו בלי שיבקש" ("do a small favor for someone without being asked"). The user feels the mild flutter of stretch, chooses it freely, lives it, and returns to a Journal that honors the trying — whether the conversation flowed or fizzled.

## Game Mechanic
Medium is one of three `ChallengeLevel` entries. Generator constraints: `estMinutes ≤ 30`, `socialExposure 0.3–0.6`, may require initiating an interaction but never a specific outcome from it. "Lived" is recorded the moment the user begins the act — a short conversation counts even if it ends after ten seconds. `Attempt.chosenLevel = medium` yields the same honored endpoint as any level; there is no bonus for choosing higher.

## Screens Needed
- Challenge Selection
- Today / Daily Moment
- Evening Check-in

## Visual Assets Needed
- Moment assets (shared artwork)
- Light assets and Texture assets (warmth with a touch more depth)
No text baked into images; Hebrew copy is a live RTL layer.

## AI Logic
Challenge Generator (Claude, Ch. 06) writes the Medium string from the Moment theme with a mid-exposure constraint, keeping the gap from Easy small enough to cross. Guardrails: safe, legal, consensual, age-appropriate, outcome-agnostic (Ch. 52). Copy Linter blocks pressure and shame words. Never diagnose; readiness signals are soft and decaying.

## Data Stored
`ChallengeLevel { level: "medium", copyHe, estMinutes, socialExposure, safetyFlags }` on the parent `Challenge`. Chosen level on `Attempt`. Local-first source of truth; optional Supabase sync. Timestamps ISO 8601.

## Edge Cases
- User reaches for Medium but stalls: rolls into Evening Check-in as "didn't try", framed safely, no penalty.
- Jump from Easy feels too big: user may downshift freely at selection time.
- Offline: Medium string cached with the DailyMoment.
- Long RTL copy: keep to one clear act; test wrapping.
- Accessibility: distinguishable by text and shape, not color.

## Build Requirements
Reuse the level selector; generator constraint profile for Medium; cached payload. Small effort.

## Definition of Done
- [ ] Medium is a genuine but reachable stretch (≤ 30 min, mid exposure).
- [ ] Completion never depends on another person's response.
- [ ] Gap from Easy is crossable, not a cliff.
- [ ] Trying is honored equally with Easy and Brave.
- [ ] Hebrew RTL renders in light and dark.
