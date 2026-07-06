# 17 — Monthly Chapter

> A richer month-long chapter that gathers four weekly stories into one emotional theme of the user's life.

## Purpose
The Monthly Chapter is a higher-order **station 9 (Pattern Engine)** output. It zooms out further than the Weekly Story (Ch. 16), turning roughly four weeks of Moments into a single emotional theme — a chapter in the ongoing book of the user's life stored in the Living Library. It gives the ritual medium-term meaning and sets up the Year Review (Ch. 18).

## User Experience
At month's end, on **Patterns**, the user meets a `Chapter` like "החודש של הקשרים הקטנים" ("the month of small connections"). It presents a **Masterpiece asset** cover, a paragraph of Hebrew narrative, a handful of standout Moments (including any Rare Moments), and a gentle observed theme drawn across the weeks. It reads like a personal essay written *for* them, not *about* their performance: "לאורך החודש חזרת שוב ושוב לרגעים של פתיחות" ("through the month you returned again and again to moments of openness"). No scores, no monthly totals-as-judgment.

## Game Mechanic
- **Window:** calendar month (user's locale).
- **States:** `accumulating → composed → viewed`.
- **Trigger:** composed at month close if ≥1 `LibraryItem` exists; ideally builds on that month's Weekly `Chapter`s.
- **Inputs:** month's `LibraryItem`s, weekly `Chapter`s, `Pattern`s, `Attempt`s, `RareMoment`s.
- **Outputs:** a `Chapter` (scope='monthly') with theme, narrative, curated highlight Moments, hero asset.
- **Curation:** selects 3–6 standout Moments by resonance (rare, brave attempts tried, strong journal reflections) — highlighted, never ranked with numbers.

## Screens Needed
- Patterns
- Living Library
- Moment Detail

## Visual Assets Needed
- Masterpiece assets (chapter cover), Moment assets (highlights), Light/Texture assets, optional Video keyframes. No baked text; all narrative live RTL.

## AI Logic
- **Pattern Recognition** (Claude + heuristics) derives the month's theme from weekly patterns; **Reflection Generator** writes the Hebrew chapter; **Memory Engine** provides material and cross-week continuity.
- Guardrails: theme is a gentle observation, never a diagnosis or trait label; no scoring; Copy Linter enforced.

## Data Stored
- `Chapter` (id, userId, scope='monthly', windowStart/End ISO 8601, titleHe, themeHe, narrativeHe, heroAssetRef, highlightItemIds[], sourceWeeklyChapterIds[], generatedAt).
Local-first; optional Supabase sync. Copy Hebrew.

## Edge Cases
- **Sparse month:** compose a shorter chapter or, if truly empty, a warm placeholder — never a penalty.
- **Missing weekly chapters:** compose directly from `LibraryItem`s.
- **Offline:** heuristic composition locally; AI enrichment on sync.
- **Regeneration consistency:** cache composed chapter; avoid contradictory reruns.
- **RTL/long narrative + accessibility:** scroll, mirror, alt text, contrast.

## Build Requirements
- Monthly composer (`compose-monthly.ts`) on month close, consuming weekly chapters.
- `/api/chapter?scope=monthly`.
- Highlight-selection heuristic; local fallback.
- Effort: M.

## Definition of Done
- [ ] A Monthly Chapter composes when ≥1 Moment exists in the month.
- [ ] Presents theme + Hebrew narrative + 3–6 curated highlights + cover.
- [ ] Builds on Weekly Stories when available; else from Library.
- [ ] No monthly totals framed as judgment; Copy Linter passes.
- [ ] Sparse/empty months handled warmly.
- [ ] Offline composition + sync enrichment; RTL + accessibility verified.
