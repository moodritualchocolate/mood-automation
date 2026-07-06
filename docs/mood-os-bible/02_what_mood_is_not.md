# 02 — What MOOD Is Not

> MOOD is defined as much by what it refuses to be — no cards, no wellness scoring, no journaling chore, no social feed, no diagnosis — and this chapter turns those refusals into enforceable product rules.

## Purpose
Categories die when a product drifts into a neighboring one. This chapter names the four gravitational pulls MOOD must resist — card game, wellness app, journal app, social media — and converts each refusal into a hard, testable constraint. It exists so that every screen, engine, and copy string can be audited against a clear "we don't do this."

## User Experience
The user never sees the word "cards" (Hebrew: never "קלפים"); they meet a "רגע" (Moment). They never see a score, a streak counter, or a diagnosis. They never see other users' faces, likes, or followers. If they miss days, the app greets them with warmth, not guilt — e.g. "טוב לראות אותך שוב" ("good to see you again"), never "פספסת 5 ימים" ("you missed 5 days"). Belonging appears only as anonymous Ripple copy: "8,412 אנשים גם בחרו היום מעשה קטן של אומץ" ("8,412 people also chose a small act of courage today"). No comparison, no ranking.

## Game Mechanic
Each refusal is a rule enforced in the loop:
- NOT a card game → approved nouns only (Moment, Daily Moment, Living Library, Journal, Ripple, Challenge). No decks, hands, draws, or collectible mechanics.
- NOT a wellness app → no scores, points, XP, levels, mood ratings out of 10, or clinical trackers. Progress = library growth + reflections + patterns only.
- NOT a journal app → the Journal is a light evening step (tried / didn't try, what happened, how it felt), never a blank page obligation.
- NOT social media → no profiles, likes, followers, feeds, or comparison. Only anonymous `RippleStat` aggregates.

## Screens Needed
- Today / Daily Moment (must not resemble a card table)
- Evening Check-in (light, not a blank journal)
- Shared Humanity (anonymous only)
- Settings and Privacy (data ownership, opt-outs)

## Visual Assets Needed
- Moment assets and Masterpiece assets that read as art, not game cards (no borders, no frames, no card backs).
- Social/Share assets that carry no personal identity or comparison, only shared-humanity framing.
No text baked into any image; Grok-generated, timeless and painterly.

## AI Logic
The Copy Linter (see Ch. 06) is the enforcement arm of this chapter. It blocks banned words and framings before copy ships: streak, fail, score, diagnose, "should," "must," shame-framing, and the noun "cards." The Reflection and Challenge Generators receive negative constraints in their system prompts (never diagnose, never rate, never compare). Tone Guardrails reject any output that labels the user.

## Data Stored
No new entities — this chapter removes and forbids fields. Explicitly banned data: no `score`, `xp`, `level`, `streakCount`, or `diagnosis` fields on any entity. `RippleStat` stores only anonymous aggregate counts (no user identifiers linking to public display). Local-first; optional Supabase sync for `RippleStat` aggregation.

## Edge Cases
- Returning after a long absence: warm re-entry copy, zero guilt.
- Empty Library: framed as beginning, not failure.
- Offline Ripple: show last-known aggregate or a gentle placeholder, never a zero-shaming state.
- Accessibility: refusals apply equally in screen-reader copy.

## Build Requirements
Copy Linter integrated in CI and pre-render. A lint ruleset (banned-terms list) shared across the repo. Component guidelines forbidding card/score/social UI patterns. Low incremental effort; high enforcement value.

## Definition of Done
- [ ] Banned-terms linter blocks builds containing forbidden words.
- [ ] No screen uses card, score, streak, or social-feed patterns.
- [ ] "cards"/"קלפים" absent from all user-facing copy.
- [ ] Ripple shows only anonymous aggregates.
- [ ] Missed-day and empty states verified guilt-free in Hebrew RTL.
