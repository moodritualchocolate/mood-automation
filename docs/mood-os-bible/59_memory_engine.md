# 59 — Memory Engine

> The Memory Engine retrieves the right slivers of a person's past — Moments, Attempts, feelings — so today's reflection can feel like it truly remembers them.

## Purpose
A reflection feels personal only when it draws on what came before. The Memory Engine is the retrieval layer that gives the Reflection, Challenge, and Pattern engines relevant context from a user's living history. It is what turns generic warmth into "someone actually knows me." It is retrieval and ranking — not generation — and it never itself speaks to the user.

## User Experience
The user never sees the Memory Engine directly; they *feel* it. When a reflection quietly echoes a challenge they tried three weeks ago — "כמו הפעם ההיא שבחרת לומר תודה" ("like that time you chose to say thank you") — that continuity is the Memory Engine at work. The effect is being remembered, not surveilled.

## Game Mechanic
Given the current `DailyMoment` and `HumanMap`, the engine selects the top-K relevant past entities (Moments, Attempts, Journal sentiments, Patterns) by recency, thematic similarity, and emotional relevance, then passes them as compact context to the generation engines. Ranking uses soft signals and decay so recent, resonant memories weigh more. Nothing is scored or shown as a total.

## Screens Needed
Not a user-facing screen. Feeds:
- Today / Daily Moment
- Challenge Selection
- Patterns

## Visual Assets Needed
None. The Memory Engine produces context, not visuals or text.

## AI Logic
Primarily deterministic retrieval; optionally uses **Claude API** (`claude-opus-4-8`) for lightweight semantic relevance scoring when local heuristics are insufficient. Output is context only — it must still pass through the downstream engines' guardrails (Ch. 55, 62, 63). The engine must never assemble context that implies a diagnosis or label. Retrieval is local-first for privacy; embeddings/scoring can run on-device where possible.

## Data Stored
- `MemoryIndex` { entityId, entityType, themeTags[], sentimentSignal (0–1), recencyWeight, decay }
- References existing `Moment`, `Attempt`, `JournalEntry`, `Pattern` — stores no new personal content, only pointers + light metadata.
Local-first source of truth; optional Supabase sync. All timestamps ISO 8601.

## Edge Cases
- First run / empty history: return no context; downstream uses universal copy.
- Offline: retrieval runs fully locally over stored entities.
- Sparse data: prefer recency; never fabricate a memory.
- Privacy request / data deletion: purge the index with the source data (Ch. 61).
- Distressing memories: flag for User Safety handling, don't surface casually.

## Build Requirements
- Local retrieval index over `Moment`/`Attempt`/`JournalEntry`/`Pattern`.
- Ranking by recency + theme + sentiment with decay.
- Optional Claude relevance scoring behind a feature flag.
- Effort: medium; performance-sensitive (runs every daily open).

## Definition of Done
- [ ] Returns top-K relevant past entities as compact context.
- [ ] Runs locally and offline; never blocks the daily loop.
- [ ] Never fabricates memories or implies labels.
- [ ] Index purges with source data on deletion requests.
- [ ] Context always passes downstream guardrails before display.
