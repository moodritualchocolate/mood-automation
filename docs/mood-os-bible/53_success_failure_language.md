# 53 — Success & Failure Language

> In MOOD there is no "you failed" — success is always the trying, and every word the app speaks about a challenge protects that truth.

## Purpose
This chapter is the linguistic guarantee behind the whole Challenge Engine (Ch. 41). The rule that success = trying is only real if the *language* never betrays it. Here we fix exactly how MOOD talks about attempts, non-attempts, and outcomes, so a person never once feels graded, judged, or shamed. This is the copy law the Copy Linter enforces on every generated line.

## User Experience
Whatever the user did, the app meets them with warmth. Three honored paths, all valid:
- **Tried** — "עשית את זה. עצם הניסיון הוא האומץ." ("you did it. the trying itself is the courage.")
- **Tried, didn't go as hoped** — "ניסית — וזה מה שחשוב. איך הרגשת?" ("you tried — and that's what matters. how did it feel?")
- **Didn't try today** — "לא היום, וזה בסדר גמור. הרגע עדיין שלך." ("not today, and that's completely fine. the moment is still yours.")
There is never "you failed", never "you missed", never a broken streak. The Evening Check-in (Ch. 07) always asks *how it felt* and *what you noticed*, never *did you succeed*.

## Game Mechanic
The `Attempt` state model uses only non-judgmental terms: `chosen`, `lived`, `not_lived`, `skipped`, `journaled`. `not_lived` and `skipped` are neutral, honored endpoints — never rendered as failure in any surface. Outcome of the act (did the stranger reply, was the "no" accepted) is *not stored as success/failure* and never displayed as a verdict. No scores, no streaks, no red states. Courage history in the Living Library counts attempts of any kind, never wins.

## Screens Needed
- Evening Check-in
- Today / Daily Moment
- Living Library
- Patterns

## Visual Assets Needed
- Light assets (warm, non-alarming — no red/error palettes)
- Moment assets
No text baked into images; all copy is a live RTL text layer.

## AI Logic
Reflection Generator and Challenge Generator (Claude, Ch. 06) must phrase all attempt-related copy around the trying. The **Copy Linter** is the enforcement engine: it hard-blocks banned words and framings — "fail/failed", "success/succeed" as a verdict, "missed", "streak", "score", "should", "must", and any shame construction — before copy ships. Never diagnose, never label an outcome good or bad.

## Data Stored
`Attempt.state ∈ {chosen, lived, not_lived, skipped, journaled}`, `JournalEntry { feltHe, learnedHe, wantAgain: bool }`. No `success` boolean anywhere in the schema. Copy fields Hebrew; timestamps ISO 8601. Local-first; optional Supabase sync.

## Edge Cases
- Act "went badly" in real life: honored as courage; no negative state recorded (Ch. 45).
- Many skipped days: never a streak break or guilt copy (Ch. 01).
- User self-blames in the Journal: Evening copy gently reframes toward the trying.
- Offline: same warm language served locally.
- Long RTL copy and accessibility as elsewhere.

## Build Requirements
Copy Linter rule set (banned lexicon + shame-pattern detection) wired into the generation pipeline; attempt-state vocabulary enforced in code; audit test suite. Small-to-medium effort, top priority.

## Definition of Done
- [ ] No surface ever uses "you failed", "missed", "streak", or "score".
- [ ] Schema contains no success/failure boolean.
- [ ] All three paths (tried / tried-and-hard / didn't try) have warm copy.
- [ ] Copy Linter blocks banned lexicon before ship, with tests.
- [ ] Hebrew RTL renders in light and dark.
