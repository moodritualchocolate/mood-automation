# 39 — Memory Layer

> The Memory layer is how a Moment remembers and is remembered — saving it into the Living Library and surfacing relevant past Moments for gentle continuity.

## Purpose
Memory is what makes MOOD a growing library of a life rather than a stream of disposable content. Every Moment becomes a `LibraryItem`; past Moments and Attempts become context that lets today's Moment feel connected to a person's story. This layer serves the promise of accumulation: the user slowly sees their own life become visible over time.

## User Experience
A Moment quietly becomes part of the Living Library — the user can revisit it, its Reflection, and its Journal any time. Occasionally a Moment carries a memory thread: "לפני שבועיים בחרת לנסות משהו דומה" ("two weeks ago you chose to try something similar"). It feels like being remembered by someone who cares, never like surveillance or a data dossier. Rare Moments are gently marked in the Library as `RareMoment`s.

## Game Mechanic
Renders in slot 8 when `MomentTemplate.layers.memory` is true, and always finalizes a `LibraryItem` on Journal save (Ch. 38). The **Memory Engine** retrieves relevant past `Moment`s/`Attempt`s to feed the Reflection and Challenge generators. Continuity is shown only as warmth and Library growth — never as a streak, count, or score. Rare Moments are flagged from `MomentTemplate.rarity`.

## Screens Needed
- Living Library
- Moment Detail
- Patterns (memory feeds gentle patterns, Ch. 06)

## Visual Assets Needed
- Moment assets, Masterpiece assets (rare Moments), Texture assets
No text baked into images; memory threads and Library labels are live RTL text.

## AI Logic
Engine: **Memory Engine** (Ch. 06) — retrieval over the user's local history (embeddings/heuristics) to surface relevant past Moments/Attempts as context for the Reflection and Challenge generators, and optionally a gentle memory line. Guardrails: recall for warmth, never to confront or diagnose; no "you always/never" framing. Passes Tone Guardrails and the Copy Linter.

## Data Stored
- `LibraryItem`: `{ id, dailyMomentId, savedAt, reflectionId, journalEntryId?, rare: boolean }`
- `RareMoment`: `{ id, libraryItemId, reason }`
- Memory index over local `Moment`/`Attempt` history
Copy Hebrew; timestamps ISO 8601. Local-first is source of truth; Supabase optional sync.

## Edge Cases
- New user, no history: no memory threads yet; Library starts empty with a warm empty state.
- Offline: retrieval runs on the local index; Library fully available.
- Deleted/hidden Moment: excluded from retrieval and Library (privacy, Ch. Privacy).
- Over-recall risk: cap memory threads to occasional, relevant surfacing.
- No "you always" framing — guardrail rejects absolutist recall.
- Long RTL memory copy: scrolls without clipping.

## Build Requirements
`MemoryLayer` component gated on the flag; `LibraryItem` finalization on Journal save; local Memory Engine (retrieval + rare flag). Library and Moment Detail read from `LibraryItem`. Effort: medium–high.

## Definition of Done
- [ ] Every journaled Moment becomes a `LibraryItem`.
- [ ] Memory Engine surfaces relevant past Moments as generator context.
- [ ] Rare Moments are flagged and gently marked in the Library.
- [ ] Continuity shows only as Library growth, never a streak or count.
- [ ] Hebrew memory/Library copy renders RTL in light and dark.
