# 13 — Living Library

> Every Moment the user has ever met, kept as a warm, growing archive of their own life — the only real "progress bar" in MOOD.

## Purpose
The Living Library is **station 8** of the Core Loop. It is where each met Moment settles and becomes permanent. It exists to make growth *visible through accumulation* — not scores — so that opening it after weeks feels like flipping through a hand-made book of your own days. It is the emotional payoff that makes the daily ritual worth keeping.

## User Experience
On **Living Library** the user sees their Moments as a gentle vertical timeline / gallery of artwork — most recent first, or grouped into emotional chapters (Ch. 16–18). Tapping one opens **Moment Detail**: the artwork, its title, the reflection, the Challenge they chose, and their own journal words. Copy celebrates growth softly: "כבר 27 רגעים קטנים אספת" ("you've gathered 27 small moments already"). No completion percentage, no locked/unlocked grid framing, no scores — just a life, gathering.

## Game Mechanic
- **Entry:** on Evening Journal submit (or day settle), a `DailyMoment` becomes a `LibraryItem`.
- **States per item:** `settled → viewed → revisited`. Items are permanent and immutable (except linked journal edits).
- **Organization:** reverse-chronological by default; filterable by emotion, Challenge level, or `Chapter`.
- **Growth is the only metric:** count and richness of items, never a score. Rare Moments (Ch. 15) appear as distinct, treasured items.
- **Inputs:** settled Moments + journal links. **Outputs:** browsable archive + source data for Patterns/Chapters/Year Review.

## Screens Needed
- Living Library
- Moment Detail
- Patterns (linked)

## Visual Assets Needed
- Moment assets (each item's artwork)
- Masterpiece assets (Rare Moments)
- Texture assets, Light assets (library ambiance). No baked text; titles are live RTL text over thumbnails.

## AI Logic
- Not generation-time AI at browse. **Memory Engine** indexes the Library so other stations can retrieve relevant past Moments.
- **Pattern Recognition** reads the Library to build `Pattern`s (Ch. 14) and `Chapter`s (Ch. 16–18).
- Guardrails: any surfaced grouping is descriptive and gentle, never a diagnosis or a ranking.

## Data Stored
- `LibraryItem` (id, userId, dailyMomentId, momentTemplateId, settledAt ISO 8601, emotions?, challengeLevel?, isRare, chapterRefs[]).
- Links to `Reflection`, `Attempt`, `JournalEntry`.
Local-first; optional Supabase sync. Media via Supabase Storage / local cache. Copy Hebrew.

## Edge Cases
- **Empty state (new user):** warm invitation — "כאן ייאסף הסיפור שלך" ("your story will gather here") — not a blank grid.
- **Large library:** virtualized list, lazy-loaded assets, pagination.
- **Offline:** browse from local cache; thumbnails degrade gracefully.
- **Deleted account / data reset:** user can export or clear their own archive (privacy-first).
- **RTL:** timeline reads right-aligned; date formatting localized.
- **Accessibility:** each item has descriptive alt + keyboard nav.

## Build Requirements
- `LivingLibrary` (virtualized) + `MomentDetail` components.
- `/api/library` (list/filter) + Memory Engine index.
- Local cache + Supabase Storage for media; export/clear tooling.
- Effort: L.

## Definition of Done
- [ ] Every settled Moment appears as a permanent `LibraryItem`.
- [ ] Detail shows artwork, title, reflection, chosen level, and journal words.
- [ ] No scores/percentages/locked-grid framing anywhere.
- [ ] Empty and large states both handled; offline browsing works.
- [ ] Rare Moments render as distinct treasured items.
- [ ] Export/clear, RTL, and accessibility verified.
