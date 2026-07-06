# 37 — Challenge Layer

> The Challenge layer offers three real-world steps — Easy, Medium, Brave — where success is defined by trying, never by outcome.

## Purpose
The Challenge is where a Moment leaves the screen and enters the user's life. It translates a small recognition into one concrete, real-world act at a level the user chooses. It is the engine of MOOD's promise that noticing becomes living. The unbreakable rule: success = the attempt, never the result.

## User Experience
Below the Reflection (and optional invitation), the user sees three gentle options. Example, for a courage Moment: Easy — "שלח הודעה קצרה למישהו שחשבת עליו" ("send a short message to someone you've been thinking about"); Medium — "התקשר אליו במקום לכתוב" ("call them instead of writing"); Brave — "אמור לו את הדבר שקשה לך לומר" ("tell them the thing that's hard to say"). The user picks one, closes the app, and lives it. Choosing is celebrated quietly: "יפה שבחרת" ("beautiful that you chose"). No option is "better"; Brave is not worth more points — there are no points.

## Game Mechanic
Renders in slot 6 when `MomentTemplate.layers.challenge` is true. A `Challenge` holds three `ChallengeLevel`s (`easy|medium|brave`). Selecting one creates an `Attempt` and moves `DailyMoment.state → challenge_chosen`. In the evening Journal (Ch. 38) the user marks the `Attempt`: `tried | didnt_try` — and *both* are honored. There is no failure state; `didnt_try` is met with warmth, never penalty. Users may change level before the evening.

## Screens Needed
- Challenge Selection
- Today / Daily Moment
- Evening Check-in

## Visual Assets Needed
- Moment assets, Light assets (three calm, equal-weight option grounds)
No text baked into images; the three levels are live RTL text layers, visually equal so none looks "premium."

## AI Logic
Engine: **Challenge Generator** (Claude, Ch. 06). Inputs: `moodTone`, `themes`, soft `HumanMap` readiness/comfort signals, Memory Engine context. Outputs: three real-world, safe, achievable Hebrew challenges scaled Easy→Brave. Guardrails: never dangerous, never social-pressure-harmful, never framed as obligation or test; success language centers the attempt. Passes Tone Guardrails and the Copy Linter.

## Data Stored
- `Challenge`: `{ id, dailyMomentId, levels: ChallengeLevel[] }`
- `ChallengeLevel`: `{ level, copyHe }`
- `Attempt`: `{ id, challengeId, chosenLevel, outcome?: 'tried'|'didnt_try', createdAt, journaledAt? }`
Copy Hebrew; timestamps ISO 8601. Local-first; Supabase optional sync.

## Edge Cases
- Chosen but not lived: honored as valid; warm evening copy, no penalty.
- Level changed before evening: allowed; latest choice stands.
- Safety-sensitive Challenge: guardrail blocks anything risky or coercive.
- Offline: selection creates `Attempt` locally; syncs later.
- New/low-readiness user: bias toward gentler Easy/Medium framings.
- Long RTL text across three options: each scrolls without clipping.

## Build Requirements
`ChallengeLayer` with three equal option components. Challenge Generator endpoint (Claude) with safety filter and offline fallbacks. `Attempt` creation wired to Zustand and the Journal. Effort: medium–high.

## Definition of Done
- [ ] Three equal-weight levels render; none visually "premium."
- [ ] Selecting creates an `Attempt` and updates state.
- [ ] `tried` and `didnt_try` are both honored with zero penalty.
- [ ] Generated challenges are safe and attempt-framed.
- [ ] Hebrew challenge copy renders RTL in light and dark.
