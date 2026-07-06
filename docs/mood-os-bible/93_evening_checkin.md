# 93 — Evening Check-in

> The gentle return at the end of the day, where the user tells MOOD whether they tried and how it felt.

## Purpose
The Evening Check-in closes the daily loop (see Ch. 06 station 7). It exists to let the user reflect on the Challenge they chose — tried or not — with zero judgement, and to feed honest signal back into the Human Map and Living Library. Reflection here is what turns an action into a memory. It is optional and never nagged.

## User Experience
On an evening return the user sees a calm screen over the day's artwork: "איך היה היום?" ("how was today?"). First a soft binary — "ניסיתי" ("I tried") / "לא הפעם" ("not this time") — both framed warmly, neither celebrated nor scolded. Then optional open prompts: "מה קרה?" ("what happened?"), "איך הרגשת?" ("how did it feel?"), "מה למדת?" ("what did you learn?"), and a quiet toggle "רוצה לנסות שוב מתישהו" ("want to try again sometime"). Choosing "לא הפעם" responds: "גם לא לנסות זה מידע. נשמור את הרגע." ("not trying is information too. we'll keep the moment."). Save settles the Moment into the Library. The feeling target: *honesty here costs me nothing.*

## Game Mechanic
Resolves the day's `Attempt`: `pending → tried | not_tried`. Writes a `JournalEntry` (free text fields optional). Sets `wantRetry` flag. States: `prompt → resolved → saved_to_library`. Everything except the binary is optional. No score, no streak, no "you failed" — "not this time" is a valid, respected outcome that still enriches the map.

## Screens Needed
- Evening Check-in
- Today / Daily Moment
- Living Library
- Moment Detail

## Visual Assets Needed
- Moment assets (day's artwork backdrop), Light/Texture assets (evening warmth). No text baked in; prompts are live RTL layers.

## AI Logic
Not generative for input, but Pattern Recognition + Memory Engine (Ch. 06) consume `JournalEntry` + `Attempt` to surface later gentle Patterns. Optional Reflection Generator may write a short warm closing line, passed through Tone Guardrails + Copy Linter. Safety scan on free text: distress signals route to support copy and pause challenge escalation — never diagnose.

## Data Stored
- `Attempt.status` (tried|not_tried), resolvedAt (ISO 8601).
- `JournalEntry` (Hebrew text: whatHappened, howItFelt, whatLearned, wantRetry bool).
- Promotes the Moment to a `LibraryItem`. Local-first; optional Supabase sync.

## Edge Cases
- No challenge was chosen: check-in still offers a light "איך היה היום?" reflection, no Attempt needed.
- Skipped evening: `Attempt` ages to `not_tried` overnight with warm framing; user can still journal later from Library.
- Offline: fully local write; sync defers.
- Distress in free text: show support resources, soften next day (Ch. 99 privacy respected).
- Long RTL journaling: multi-line growth, no clip; autosave each keystroke.
- Reduced motion: static transitions (Ch. 100).

## Build Requirements
- `EveningCheckin` screen, `AttemptToggle` + optional `JournalFields`, Tailwind, RTL, light/dark, mobile-first.
- `/api/pattern` ingestion hook; safety text scan; Zustand autosave + BroadcastChannel.
- PWA offline writes; overnight aging job for pending Attempts (local + server).
- Effort: M.

## Definition of Done
- [ ] Tried / not-this-time both framed warmly; "not this time" enriches map.
- [ ] Optional journal fields autosave in Hebrew RTL; nothing required.
- [ ] Resolving promotes the Moment into the Living Library.
- [ ] No score, streak, or "failed" language (Copy Linter enforced).
- [ ] Offline writes, overnight aging, and safety routing all verified.
