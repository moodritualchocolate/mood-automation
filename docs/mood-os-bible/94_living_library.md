# 94 — Living Library Screen

> The growing archive of a person's life in MOOD — every Moment they've met, kept forever, beautifully.

## Purpose
The Living Library is where progress actually lives (see Ch. 06 station 8). It exists to show growth the only way MOOD allows — as accumulation of meaning, not scores — so that over weeks a user can scroll back through the small moments of their own life. It is the proof that MOOD keeps what it noticed.

## User Experience
A calm vertical gallery of the user's `LibraryItem`s, newest first, each a small artwork tile with its tiny Hebrew title and date. Header line: "הספרייה החיה שלך" ("your living library"). Rare Moments glow subtly. Tapping a tile opens Moment Detail (Ch. 95). Gentle grouping by Chapter — week/month/year (e.g. "השבוע", "החודש") — with soft dividers, never counts framed as targets. An empty early library reads warmly: "כאן ייאסף כל מה שנבחין אצלך." ("everything we notice about you will gather here."). The feeling target: *this is my life, kept gently.*

## Game Mechanic
Read-mostly archive of `LibraryItem`s derived from seen `DailyMoment`s. Optional light filters: by emotion, by Challenge tried, by rare. `Chapter` groupings are time-based, non-evaluative. No score, no completion percentage, no streak grid. Growth is felt through volume and revisiting, not metrics. Items are permanent (deletable only by explicit user action, Ch. 99).

## Screens Needed
- Living Library
- Moment Detail
- Patterns
- Settings (entry point)

## Visual Assets Needed
- Moment assets (tile thumbnails), Masterpiece assets (rare items glow)
- Texture/Light assets (dividers, warmth). No text baked in; titles/dates are live RTL layers.

## AI Logic
Not generative for the grid itself. Memory Engine + Pattern Recognition (Ch. 06) may suggest gentle groupings or resurface a relevant past Moment. Any surfacing copy passes Tone Guardrails + Copy Linter. Never rank items by "quality" or score.

## Data Stored
- `LibraryItem` (momentId, date, title, `Asset` ref, rare flag, emotion tags).
- `Chapter` (period, itemIds) for grouping.
- Local-first source of truth; optional Supabase sync + Storage for assets.

## Edge Cases
- Empty (first days): warm placeholder, never a barren grid.
- Loading: soft shimmer tiles, not a spinner.
- Error/partial sync: render local items; mark cloud-only ones as "syncing" quietly.
- Offline: full local library renders; images from PWA cache.
- Very large library: virtualized list, lazy image loading.
- Long RTL titles: truncate with full title in Detail; tap target ≥44px (Ch. 100).

## Build Requirements
- `LibraryGrid` (virtualized), `LibraryTile`, `ChapterDivider`, Tailwind, RTL, light/dark, mobile-first.
- Zustand-backed query over local store; optional Supabase pagination; PWA image cache.
- Filters module; deep-link to Moment Detail.
- Effort: M–L.

## Definition of Done
- [ ] All seen Moments appear as permanent `LibraryItem` tiles, newest first.
- [ ] Time-based `Chapter` grouping shown without targets or counts-as-goals.
- [ ] Empty, loading, error, and offline states all warm and non-blank.
- [ ] No scores, completion %, or streak grid anywhere.
- [ ] RTL, light/dark, large-library performance, and tap targets verified.
