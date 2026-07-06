# 95 — Moment Detail

> The full, quiet view of a single Moment — its artwork, Reflection, the Challenge chosen, and what the user wrote.

## Purpose
Moment Detail is where a kept Moment is revisited in full (see Ch. 30 Moment Definition, Ch. 94 Living Library). It exists so a user can return to any day of their life in MOOD and re-experience it whole: the art, the words that noticed them, what they dared, and how it felt. It is the reading room of the Living Library.

## User Experience
Opened from a Library tile, it shows the timeless artwork large, the tiny title, and the full living Reflection in Hebrew. Below, if a Challenge was chosen: the level and line, and the resolution — "ניסית" ("you tried") or "לא הפעם" ("not this time"), framed warmly. Then the journal the user wrote: what happened, how it felt, what they learned. Small quiet actions: "שתף בעילום שם" ("share anonymously", Ch. 97), "נסה שוב מתישהו" ("try again sometime"). A rare Moment shows a subtle badge, never a point value. The feeling target: *I can visit this day of my life whenever I want.*

## Game Mechanic
Read view over one `Moment` + its `Attempt` + `JournalEntry`. Late journaling allowed: a Moment journaled days later still resolves warmly (no "too late"). Optional re-challenge re-issues the Challenge into a future day. States: `viewing → (optional) editing_journal → (optional) re-challenge_queued`. No score, no streak, no delete-shame; deletion is explicit and calm (Ch. 99).

## Screens Needed
- Moment Detail
- Living Library
- Shared Humanity (share entry)
- Evening Check-in (late journaling)

## Visual Assets Needed
- Moment assets (hero), Masterpiece assets (rare), Social/Share assets (anonymous share composition)
- Light/Texture assets. No text baked in; all copy is live RTL layers.

## AI Logic
Reflection is already stored (Reflection Generator, Ch. 06). Memory Engine may surface a "רגע דומה" ("a similar moment") link. Any new copy passes Tone Guardrails + Copy Linter. Never re-score or re-judge a past Moment.

## Data Stored
- Reads `Moment`/`DailyMoment`, `Reflection`, `Attempt`, `JournalEntry`, `RareMoment` flag.
- Writes on late-journal or re-challenge (ISO 8601). Local-first; optional Supabase sync.

## Edge Cases
- No challenge that day: hide challenge/journal blocks gracefully.
- No journal yet: offer gentle "רוצה להוסיף מחשבה?" ("want to add a thought?").
- Missing asset: warm texture fallback, never blank.
- Offline: full render from local; share queues until online.
- Deleted-source safety: if user erased data, show respectful empty, not an error.
- Long RTL Reflection/journal: scroll, never clip; tap targets ≥44px (Ch. 100).

## Build Requirements
- `MomentDetail` composing `MomentRenderer` + `AttemptSummary` + `JournalView`, Tailwind, RTL, light/dark, mobile-first.
- Deep-linkable route `/moment/[id]`; share via Ch. 97; late-journal via Ch. 93 flow.
- Zustand read + autosave edits; PWA asset cache.
- Effort: M.

## Definition of Done
- [ ] Full Moment renders: art, title, Reflection, challenge outcome, journal.
- [ ] "Tried / not this time" shown warmly; rare badge is non-numeric.
- [ ] Late journaling and re-challenge both supported without penalty.
- [ ] Offline read works; share queues cleanly.
- [ ] RTL, light/dark, long-text, and tap targets verified.
