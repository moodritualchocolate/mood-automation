# 33 — Moment Categories

> Categories are soft content themes for Moments — never labels for people — that shape selection, tone, and how the Living Library organizes a life.

## Purpose
Categories give authors and the selector a shared vocabulary for the *kind* of small human observation a Moment offers. They let the Reflection Generator hold a consistent tone, let the daily selector balance variety, and let the Living Library group Moments into emotional chapters. A category describes the Moment's subject, not a trait of the user.

## User Experience
The user rarely sees a raw category name; they feel variety and rhythm — a tender Moment one day, a brave one the next. In the Living Library, categories appear only as gentle section headers: "אומץ קטן" ("small courage"), "קרבה" ("closeness"), "עצירה" ("stillness"). Never as a scorecard, never as a judgment of who they are.

## Game Mechanic
Each `MomentTemplate.category` is one of a fixed set:

| Category (en) | Hebrew header | Focus |
|---|---|---|
| courage | אומץ קטן | small real-world bravery |
| connection | קרבה | closeness with others |
| stillness | עצירה | pausing, noticing |
| self-kindness | חמלה עצמית | gentleness toward self |
| wonder | פליאה | awe, curiosity |
| honesty | כנות | quiet truth-telling |
| letting-go | שחרור | release, acceptance |
| play | משחק | lightness, joy |

The selector balances categories over a rolling window so no category dominates a week, while still honoring soft `HumanMap` readiness. Categories map to `themes` for finer Library filtering.

## Screens Needed
- Living Library (category section headers)
- Patterns (category-frequency reflected gently, never as a score)
- Today / Daily Moment

## Visual Assets Needed
- Moment assets tuned per category mood (courage vs. stillness feel different)
- Light assets, Texture assets
No text baked into images; category headers are live RTL text in the app.

## AI Logic
Pattern Recognition (Claude + heuristics, Ch. 06) may gently note category leanings over time ("נראה שרגעים של קרבה נוגעים בך" / "moments of closeness seem to reach you"), always as an observation, never a diagnosis. Reflection Generator uses category to anchor tone. All copy passes Tone Guardrails and the Copy Linter.

## Data Stored
- `MomentTemplate.category` (enum above), `themes[]`
- `Pattern` may reference category frequencies as soft floats with decay
Copy Hebrew; timestamps ISO 8601. Local-first, optional Supabase sync.

## Edge Cases
- New user, sparse history: selector defaults to gentle categories (stillness, self-kindness) before courage.
- Category exhaustion: relax balancing rather than force an ill-fitting Moment.
- Offline: category balancing runs on local history.
- Long RTL headers: truncate gracefully with full text on tap.
- Never present category counts as achievement or deficit.

## Build Requirements
Category enum shared across template store and Library. `balanceCategories(history, window)` helper in the selector. Library grouping component keyed by category with Hebrew header map. Effort: low–medium.

## Definition of Done
- [ ] Fixed category enum implemented with Hebrew headers.
- [ ] Selector balances categories over a rolling window.
- [ ] Library groups Moments by category as soft headers only.
- [ ] No category ever framed as a user label, score, or deficit.
- [ ] Hebrew headers render RTL in light and dark.
