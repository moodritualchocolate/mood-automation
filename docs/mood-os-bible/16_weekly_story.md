# 16 — Weekly Story

> A gentle end-of-week narrative that stitches seven days of Moments into one small emotional story about the user's week.

## Purpose
The Weekly Story is a **station 9 (Pattern Engine)** output rendered as a short chapter. It exists to zoom out from single days and give the week a shape — a soft recap that helps the user feel their own arc without any metrics. It deepens the reward of the ritual: a week of small Moments becomes one warm story.

## User Experience
At the end of each week (surfaced on **Patterns**, entering from **Living Library**), the user finds a `Chapter` titled like "השבוע שבו הקשבת יותר" ("the week you listened more"). It's a few sentences of Hebrew narrative woven from the week's Moments, chosen Challenges, and journal words, paired with a hero **Moment asset** from that week. Tone: reflective, tender, never evaluative — "השבוע בחרת שלושה רגעים של אומץ קטן" ("this week you chose three small acts of courage"). No grades, no "you completed X of 7."

## Game Mechanic
- **Window:** rolling 7-day period (user's local week).
- **States:** `accumulating → composed → viewed`.
- **Trigger:** composed after the week closes if ≥1 `LibraryItem` exists in the window.
- **Inputs:** week's `LibraryItem`s, `Attempt`s, `JournalEntry`s, `Pattern`s.
- **Outputs:** a `Chapter` (scope=weekly) with Hebrew narrative + a chosen hero asset.
- **No completeness requirement:** a 2-Moment week still gets a story; missing days are simply absent, never counted against the user.

## Screens Needed
- Patterns
- Living Library
- Moment Detail (drill-in from the story)

## Visual Assets Needed
- Moment assets (week hero), Masterpiece assets (chapter cover), Light/Texture assets. No baked text; narrative is live RTL text.

## AI Logic
- **Pattern Recognition** (Claude + heuristics) selects the week's throughline; **Reflection Generator** writes the Hebrew narrative; **Memory Engine** supplies the week's material.
- Guardrails: descriptive and tentative, never diagnostic, never ranked or scored; no "you missed days." Copy Linter enforced.

## Data Stored
- `Chapter` (id, userId, scope='weekly', windowStart/End ISO 8601, titleHe, narrativeHe, heroAssetRef, sourceItemIds[], generatedAt).
Local-first; optional Supabase sync. Copy Hebrew.

## Edge Cases
- **Sparse week (0 Moments):** no story generated; gentle "השבוע היה שקט, וזה בסדר" ("this week was quiet, and that's okay") — no penalty.
- **Single Moment:** still composes a small story.
- **Offline:** compose locally with heuristics; enrich narrative on next sync if needed.
- **Regeneration:** deterministic-enough; user can't be shown contradictory recaps.
- **RTL/long narrative:** scrolls, mirrors correctly.
- **Accessibility:** hero asset alt text; readable contrast.

## Build Requirements
- Weekly composer job (`compose-weekly.ts`) triggered on week close.
- `/api/chapter?scope=weekly` (get/compose).
- Hero-asset selector; local heuristic fallback narrative.
- Effort: M.

## Definition of Done
- [ ] A Weekly Story composes whenever ≥1 Moment exists in the window.
- [ ] Narrative is Hebrew, descriptive, non-diagnostic, Copy-Linter-passed.
- [ ] No "X of 7" / completeness / score framing.
- [ ] Quiet weeks handled warmly with no penalty.
- [ ] Composes offline via heuristics; enriches on sync.
- [ ] RTL + accessibility verified.
