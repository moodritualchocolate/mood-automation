# 06 — Core Loop

> The single 10-step engine that turns one small daily Moment into a growing library of a person's life.

## Purpose
The Core Loop is the spine of MOOD. Every other system in this volume is one station on it. It exists so that a user opens the app once a day, meets a human moment, understands something quiet about themselves, chooses a real-world Challenge, lives it, and lets the day become a permanent part of their Living Library. It guarantees that MOOD is a Human Experience Game, not a wellness app or a feed.

## User Experience
The user opens MOOD once per day and lands on **Today / Daily Moment**: timeless artwork, a tiny Hebrew title (e.g. "רגע קטן של אומץ" — "a small moment of courage"), a living reflection, and an optional invitation. They may accept a Challenge at Easy, Medium, or Brave. They close the app and *live it*. In the evening they return to **Evening Check-in** and answer whether they tried. The Moment settles into the **Living Library**. Over weeks, **Patterns** and **Shared Humanity** quietly reflect their life back. Nothing is scored; nothing is streaked.

## Game Mechanic
The loop is a fixed 10-station cycle, one full turn per day:
1. **Discovery** → seeds/updates the `HumanMap` via playful choices.
2. **Human Map** → soft `Trait` signals (0–1, confidence + decay) drive selection.
3. **Daily Ritual** → issues one `DailyMoment`.
4. **Moment** → artwork + title + `Reflection` + optional invitation + optional `Challenge`.
5. **Challenge** → user picks a `ChallengeLevel` (easy|medium|brave); creates an `Attempt`.
6. **Live** → app closes; real-world action; `Attempt.status = pending`.
7. **Evening Journal** → user writes `JournalEntry`; `Attempt.status = tried|not_tried`.
8. **Living Library** → Moment persists as a `LibraryItem`.
9. **Pattern Engine** → derives `Pattern` entities over history.
10. **Ripple** → renders anonymous `RippleStat` belonging.
Transitions are forward-only per day; a skipped station never penalizes — the loop simply resumes next open. Success is recorded as *attempt made*, never outcome.

## Screens Needed
- Splash
- Today / Daily Moment
- Challenge Selection
- Evening Check-in
- Living Library
- Patterns
- Shared Humanity

## Visual Assets Needed
- Masterpiece assets (loop hero states)
- Moment assets (per Daily Moment)
- Light assets, Texture assets (transitions)
- Video keyframes (open/close ritual). No text baked into any image.

## AI Logic
All three shared engines participate across the loop: **Reflection Generator** (station 4), **Challenge Generator** (station 5), **Pattern Recognition** + **Memory Engine** (station 9). Every output passes **Tone Guardrails** + **Copy Linter**. Never diagnose, never label, never use banned words (streak/fail/score/should).

## Data Stored
`User`, `HumanMap` + `Trait[]`, `DailyMoment`, `Moment`/`MomentTemplate`, `Challenge` + `ChallengeLevel`, `Attempt`, `JournalEntry`, `LibraryItem`, `Pattern`, `RippleStat`, `Reflection`. Local-first (Zustand + local storage); optional Supabase sync. Timestamps ISO 8601; copy fields Hebrew.

## Edge Cases
- First run: Discovery not yet complete → serve a gentle universal Moment.
- Offline: full loop runs locally; sync defers.
- Skipped day(s): no penalty, no shame copy; resume at station 3.
- Abandoned Challenge: `Attempt.status = pending` ages to `not_tried` with warm framing.
- Safety flag in journal: route to support copy, pause challenge escalation.

## Build Requirements
- Loop orchestrator (Zustand store `useLoopStore`) tracking current station + day boundary.
- `/api/daily-moment`, `/api/challenge`, `/api/reflection`, `/api/pattern` endpoints.
- BroadcastChannel realtime; autosave; PWA offline cache.
- Effort: L (foundational).

## Definition of Done
- [ ] All 10 stations reachable in one day cycle end-to-end.
- [ ] No scores/streaks/XP anywhere in the loop.
- [ ] Skipped days never produce penalty copy (Copy Linter enforced).
- [ ] Full loop completes offline, then syncs.
- [ ] Every downstream chapter references its station number.
