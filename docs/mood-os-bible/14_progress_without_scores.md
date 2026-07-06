# 14 — Progress Without Scores

> MOOD's growth philosophy made mechanical: progress shown only through library, reflections, patterns, chapters, rare moments, and courage history — never numbers.

## Purpose
This chapter defines *how MOOD represents progress* across the whole Core Loop, and it is the guardrail all other systems obey. It exists because the product's soul depends on it: **no streaks, no scores, no XP, no levels, no leaderboards.** It formalizes the six approved ways progress may ever be shown, and consumes **station 9 (Pattern Engine)** output to render gentle reflection instead of metrics.

## User Experience
The user never sees a number that judges them. Instead, growth surfaces as:
1. **Library growth** — the archive fills (Ch. 13).
2. **Personal reflections** — their own journal words replayed.
3. **Patterns** — gentle observations on **Patterns** screen: "בשבועות האחרונים בחרת יותר רגעים של חיבור" ("lately you've chosen more moments of connection").
4. **Emotional chapters** — weekly/monthly/year narratives (Ch. 16–18).
5. **Rare Moments** — treasured, uncommon Moments (Ch. 15).
6. **Courage history** — a soft record of Brave attempts, framed as trying.
There is no percent-complete, no counter that can drop, nothing to "keep up."

## Game Mechanic
- **Approved progress surfaces:** exactly the six above. Any other representation is banned by contract.
- **Inputs:** `LibraryItem`s, `JournalEntry`s, `Attempt`s, `Pattern`s, `RareMoment`s.
- **Outputs:** descriptive, non-numeric reflections and collections.
- **Courage history rule:** counts *attempts made* (tried), never success/failure ratios; framed additively ("gathered"), never as a streak that breaks.
- **No decay of progress:** a quiet period never reduces any visible progress; missed days are invisible.

## Screens Needed
- Patterns
- Living Library
- Shared Humanity (belonging, not comparison)

## Visual Assets Needed
- Texture assets, Light assets (soft progress backdrops)
- Masterpiece assets (chapter/rare highlights). No numbers or text baked into images; any labels are live RTL text.

## AI Logic
- **Pattern Recognition** (Claude + heuristics) turns history into gentle, plain-language observations (station 9).
- **Copy Linter** hard-blocks banned words: streak, score, points, XP, level, leaderboard, fail, "keep it up," "don't break." This is the enforcement point for the whole product.
- Guardrails: observations are tentative and kind ("נראה ש..." / "it seems that..."), never diagnostic, never ranked.

## Data Stored
- Derived only — no score field exists anywhere in the schema.
- `CourageHistory` view over `Attempt[]` where level=brave & status=tried.
- `Pattern` (id, userId, kind, observationHe, confidence, windowStart/End ISO 8601).
Local-first; optional Supabase sync. Copy Hebrew.

## Edge Cases
- **Long inactivity:** progress surfaces stay flat and warm; no "you lost your streak."
- **Sparse data:** patterns stay silent rather than fabricate; show library growth only.
- **Attempt to add gamification later:** blocked at schema + linter level by design.
- **Offline:** all six surfaces render from local data.
- **RTL/long-text:** pattern sentences reflow.
- **Accessibility:** no color-only progress cues; text alternatives always.

## Build Requirements
- Central `progress-policy.ts` enumerating the six allowed surfaces; CI check + Copy Linter rule set.
- `/api/pattern` consumer; `CourageHistory` selector.
- Effort: M (mostly policy + enforcement).

## Definition of Done
- [ ] No score/streak/XP/level/leaderboard exists in schema, UI, or copy.
- [ ] All progress renders via the six approved surfaces only.
- [ ] Copy Linter blocks banned progress vocabulary in CI.
- [ ] Courage history counts attempts, never success ratios; cannot "break."
- [ ] Inactivity produces no penalty or loss anywhere.
- [ ] Offline, RTL, accessibility verified.
