# 12 — Evening Journal

> The quiet evening return where the user records tried / didn't try, what happened, and what they learned — closing the day with kindness.

## Purpose
The Evening Journal is **station 7** of the Core Loop. It closes the day's arc: the user came, met a Moment, chose a Challenge, lived it — and now reflects. It exists to capture the *attempt* (not the outcome) and to feed honest memory into the Library and Pattern Engine. It is a soft landing, never an audit.

## User Experience
In the evening the user opens **Evening Check-in**. A gentle prompt: "איך היה הרגע של היום?" ("how was today's moment?"). They answer a few light inputs:
- Did you try? — **ניסיתי / לא היום** ("I tried / not today"), both equal, both fine.
- What happened? (optional free text, Hebrew).
- How did it feel? (soft emotion chips, optional).
- What did you learn? (optional).
- Want to try again? (optional toggle).
If they didn't try, the copy is warm — "גם זה בסדר גמור" ("that's completely okay") — never guilt. Submitting settles the Moment into the **Living Library** with a soft "לילה טוב" ("good night").

## Game Mechanic
- **Trigger:** available after a `Challenge` is chosen (or as a light reflection even without one).
- **States:** `awaiting_evening → in_progress → submitted`.
- **Inputs:** tried/not_tried, free text, emotion chips, learning, try-again flag.
- **Outputs:** a `JournalEntry`; resolves the day's `Attempt.status`; emits memory for station 9.
- All fields except tried/not_tried are optional — a one-tap close is valid.
- No rating of success quality; the only structured judgment is *attempt made*.

## Screens Needed
- Evening Check-in
- Moment Detail (linked entry)
- Living Library (settle destination)

## Visual Assets Needed
- Light assets (dusk/evening tone), Texture assets, Home assets. Calm, warm, night-leaning. No text baked into images; prompts are live RTL text.

## AI Logic
- Primarily user-authored. **Reflection Generator** (Claude) may optionally offer a one-line closing acknowledgement in Hebrew ("שמת לב למשהו קטן היום").
- **Memory Engine** ingests the entry for future context; **Pattern Recognition** consumes it over time.
- Guardrails: never analyze or diagnose the free text back to the user; if a safety-sensitive signal appears, surface gentle support copy (see Edge Cases). Copy Linter on all prompts.

## Data Stored
- `JournalEntry` (id, userId, dailyMomentId, attemptId, tried:boolean, textHe?, emotions:string[]?, learningHe?, tryAgain:boolean?, createdAt ISO 8601).
- Updates `Attempt.status` (tried|not_tried) + resolvedAt.
Local-first (autosave, Zustand); optional Supabase sync. Free text stays on-device unless the user syncs.

## Edge Cases
- **Skipped evening:** entry stays open; next day the Attempt ages to `not_tried` kindly; no streak break.
- **Didn't try:** fully valid; zero guilt copy; still creates a `JournalEntry`.
- **Offline:** entry saved locally, synced later.
- **Safety flag** (self-harm/distress language): show warm support resources, pause Challenge escalation, never diagnose.
- **RTL/long free text:** textarea grows, mirrors correctly.
- **Accessibility:** emotion chips keyboard-navigable, reduced-motion.

## Build Requirements
- `EveningCheckin` component with autosave + optional fields.
- `/api/journal` (create/update) and `Attempt` resolver.
- Local safety keyword heuristic → support UI (no server dependency).
- Effort: M.

## Definition of Done
- [ ] User can record tried/not_tried with all else optional (one-tap close works).
- [ ] "Not today" produces warm, guilt-free copy; still logs an entry.
- [ ] Entry resolves the day's `Attempt` and settles the Moment to Library.
- [ ] Free text never analyzed/diagnosed back to the user.
- [ ] Safety heuristic surfaces support copy offline.
- [ ] Autosave, RTL, accessibility verified.
