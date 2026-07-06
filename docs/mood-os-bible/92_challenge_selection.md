# 92 — Challenge Selection

> The moment the user chooses to step into the real world, at a size they pick: Easy, Medium, or Brave.

## Purpose
Challenge Selection turns a Moment into an action the user will live outside the app (see Ch. 06 station 5, Ch. 41 Challenge Philosophy). It exists to offer agency and a right-sized dare without pressure, and to make clear that success means *trying*, never the outcome. It is always optional — a Moment is complete without it.

## User Experience
From Today (Ch. 91) the user opens a calm sheet with three soft options over the Moment's artwork. Each is one line of Hebrew: Easy — "שלח הודעה חמה למישהו." ("send someone a warm message."); Medium — "התקשר במקום להקליד." ("call instead of texting."); Brave — "אמור בקול את מה שדחית." ("say aloud the thing you've been putting off."). A quiet note under them: "אין נכון ואין לא נכון. עצם הניסיון הוא ההצלחה." ("there's no right or wrong. the attempt is the success."). Tapping one confirms gently and returns to Today with the challenge held for the day. A "אולי מחר" ("maybe tomorrow") declines without penalty. The feeling target: *I get to choose how brave I am today.*

## Game Mechanic
Presents three `ChallengeLevel`s (easy|medium|brave) for the day's `Challenge`. Selecting one creates an `Attempt` with `status = pending` and level. States: `offered → chosen → (pending in real life) → resolved via Evening Check-in`. Only one level per day; re-choosing before evening swaps the pending level (no penalty). Declining sets no negative state. No score, no streak, no "you skipped."

## Screens Needed
- Challenge Selection
- Today / Daily Moment
- Evening Check-in

## Visual Assets Needed
- Moment assets (shared artwork backdrop), Light/Texture assets (calm sheet). No text baked in; the three lines are live RTL layers.

## AI Logic
Challenge Generator (Claude) produces the three real-world levels from the Moment, `HumanMap` challenge-readiness/comfort-zone signals, and Memory Engine context (Ch. 06). Guardrails: safe, legal, non-harmful, never shaming; brave ≠ reckless. All copy passes Tone Guardrails + Copy Linter.

## Data Stored
- `Challenge` (momentId, three `ChallengeLevel` copies in Hebrew).
- `Attempt` (challengeId, chosen level, `status`, ISO 8601 timestamps).
- Local-first; optional Supabase sync.

## Edge Cases
- Decline: no `Attempt` penalty; Moment stays complete.
- Change of mind: swap pending level freely before evening.
- Offline: create `Attempt` locally; sync later.
- Safety-sensitive Human Map: soften Brave, never escalate; provide gentler framing.
- Generation fail: fall back to authored generic three-level set.
- Long RTL challenge text: reflow within option, tap target ≥44px (Ch. 100).
- Skipped day: yesterday's pending `Attempt` ages to `not_tried` with warm framing.

## Build Requirements
- `ChallengeSheet` (bottom sheet), three `LevelOption` components, Tailwind, RTL, light/dark, mobile-first.
- `/api/challenge`; Zustand writes `Attempt`; autosave + BroadcastChannel.
- PWA offline creation of `Attempt`; fallback challenge bundle cached.
- Effort: M.

## Definition of Done
- [ ] Three levels (Easy/Medium/Brave) render in Hebrew RTL over art.
- [ ] Choosing creates a pending `Attempt`; declining creates no penalty.
- [ ] "Attempt is the success" framing present; no outcome scoring.
- [ ] Level swap and offline creation both work.
- [ ] Brave options are safe, never reckless; verified light/dark + long-text.
