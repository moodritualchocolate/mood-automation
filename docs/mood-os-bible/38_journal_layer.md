# 38 — Journal Layer

> The Journal layer is the evening return where the user tells the Moment what happened — honored equally whether they tried or not.

## Purpose
The Journal closes the daily loop. It lets the user reflect on the Challenge they chose: did they try, what happened, how it felt, what they learned, would they try again. It converts a lived (or unlived) day into a personal record that feeds the Living Library and Patterns. Its job is to gather honesty gently, never to grade a performance.

## User Experience
In the evening the Journal layer opens on the Evening Check-in with the day's Moment. A soft prompt: "איך היה עם האתגר שבחרת?" ("how was it with the challenge you chose?"). The user taps "ניסיתי" ("I tried") or "לא הפעם" ("not this time") — both answered warmly: for the second, "גם לא לנסות זה חלק מהדרך" ("not trying is also part of the path"). Optional free text captures what happened and how it felt. Nothing is required; a single tap is a complete Journal.

## Game Mechanic
Renders in slot 7 of the Moment structure, appearing at the evening ritual beat (Ch. 34). Writes to the `Attempt` and creates a `JournalEntry`. Fields: `outcome` (tried|didnt_try), optional `whatHappenedHe`, `howItFeltHe`, `learnedHe`, `wantAgain` (bool). On save, `DailyMoment.state → journaled` and a `LibraryItem` is finalized (Ch. 39). No outcome is scored; both paths advance the loop identically.

## Screens Needed
- Evening Check-in
- Moment Detail (past Journal visible)
- Living Library

## Visual Assets Needed
- Light assets (evening warmth), Texture assets
- Moment assets (the day's artwork as context)
No text baked into images; Journal fields are live RTL inputs.

## AI Logic
Largely not AI-generated input — the user writes. The **Memory Engine** stores entries for future context, and Pattern Recognition (Ch. 39, Ch. 06) may later reflect gentle patterns. If the app offers a closing line, it comes from Tone-Guardrail-approved copy. Any user free text flagged for distress routes to gentle, non-diagnostic support. No grading, no sentiment "score" shown.

## Data Stored
- `JournalEntry`: `{ id, dailyMomentId, attemptId, outcome, whatHappenedHe?, howItFeltHe?, learnedHe?, wantAgain?, createdAt }`
- Updates `Attempt.outcome`, `Attempt.journaledAt`
Copy Hebrew; timestamps ISO 8601. Local-first; Supabase optional sync.

## Edge Cases
- Skipped evening: no penalty; Journal can be filled later or never.
- `didnt_try`: warmly honored, fully valid, still journaled.
- Empty free text: a single tap is a complete entry.
- Offline: entry saves locally, syncs later.
- Distress in free text: route to gentle support copy, never diagnose.
- Long RTL text: multiline inputs grow without clipping.

## Build Requirements
`JournalLayer` with outcome toggle and optional text fields, wired to Zustand autosave and BroadcastChannel. Endpoint for optional Supabase sync. Effort: medium.

## Definition of Done
- [ ] Journal opens at the evening ritual beat with the day's Moment.
- [ ] `tried` and `didnt_try` are honored equally with warm copy.
- [ ] A single tap completes an entry; text is optional.
- [ ] Saving finalizes the `LibraryItem` and marks state `journaled`.
- [ ] Hebrew Journal fields render RTL in light and dark.
