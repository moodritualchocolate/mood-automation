# 125 — Phase 4 — Living Library

> Phase 4 turns kept Moments into a living archive and adds gentle Pattern reflection, so the user starts to see the shape of their own life over time.

## Purpose
By Phase 4 the user has many Moments, Attempts, and Journal entries. This phase makes that history feel like a personal library worth revisiting, and introduces the Pattern Engine that gently reflects — never diagnoses — what's emerging over time. Progress is shown only as library growth, reflections, and patterns (per Ch. 01 / the tone contract), never as scores or streaks.

## User Experience
The Living Library fills with every past Moment, each openable in Moment Detail with its Reflection, chosen Challenge, and Journal. A new Patterns screen offers soft observations. Example: "בשבועיים האחרונים בחרת יותר רגעים של חיבור" ("in the last two weeks you chose more moments of connection"). It reads as a caring notice, never a verdict, and always invites, never grades.

## Game Mechanic
**Scope IN:** full Living Library browse, Moment Detail, and Pattern Recognition surfacing gentle `Pattern`s over `Attempt`/`JournalEntry`/`Trait` history; Memory Engine retrieval for context. Weekly reflection framing.
**Scope OUT:** Ripple/Shared Humanity (Phase 5), accounts/cloud sync, RareMoments and long-horizon Chapters (Phase 6). This phase **implements** core-loop steps 8–9 (Living Library, Pattern Engine) and extends Ch. 30–31 Moments; it consumes the Human Map (Ch. 123) and Attempts (Ch. 124).
**Entry criteria:** Phase 3 exit met; enough loop history exists to browse and pattern.
**Exit criteria:** Library reliably holds all past Moments; ≥1 gentle Pattern surfaces from real history with zero diagnostic language; Memory context improves a Reflection.
**Demo goal:** a user scrolls weeks of their own Moments and receives one warm, true pattern that makes them feel understood, not analyzed.

## Screens Needed
- Living Library
- Moment Detail
- Patterns
- Today / Daily Moment

## Visual Assets Needed
- Moment assets, Masterpiece assets (rare cornerstone Moments)
- Texture assets, Light assets
Grok-generated, painterly-photographic, warm. NO text baked into images; all labels and patterns are live RTL layers.

## AI Logic
Pattern Recognition (Claude + heuristics, Ch. 06) reads local `Attempt`, `JournalEntry`, and `Trait` history and emits soft `Pattern`s. Memory Engine retrieves relevant past `Moment`s/`Attempt`s to enrich the Reflection Generator. Guardrails: patterns are observations, never diagnoses or labels; low-confidence patterns are withheld. All copy passes Tone Guardrails + Copy Linter.

## Data Stored
- `LibraryItem` (one per past `DailyMoment`)
- `Pattern` (soft observation, confidence, sourceRefs)
- Memory index over past `Moment`/`Attempt`/`JournalEntry`
Local-first source of truth; Supabase sync still out of scope. Hebrew strings; ISO 8601.

## Edge Cases
- Empty/near-empty library: warm empty state, no pattern forced.
- Low-confidence pattern: withheld, never guessed aloud.
- Skipped days: leave harmless gaps, no streak, no "you missed."
- Offline: Library and stored patterns render from local storage.
- Long RTL text / accessibility: Library and Detail scroll cleanly, screen-reader friendly.
- Sensitive Journal content: patterns stay gentle; safety flags respected.

## Build Requirements
Adds `PatternEngine` (Claude + heuristics), Memory index, `LibraryGrid`, `MomentDetail`, and `Patterns` components to the Phase 3 base. Local query layer over IndexedDB. Next.js 14, TypeScript, Tailwind, RTL, PWA, local-first. Effort: medium–large.

## Definition of Done
- [ ] Living Library holds and browses every past Moment.
- [ ] Moment Detail shows Reflection, Challenge, and Journal together.
- [ ] Pattern Engine surfaces gentle, non-diagnostic `Pattern`s from real history.
- [ ] Low-confidence patterns are withheld, never guessed.
- [ ] Progress reads only as growth/reflection/patterns — no scores or streaks.
- [ ] Copy Linter passes; Hebrew RTL correct in light and dark.
