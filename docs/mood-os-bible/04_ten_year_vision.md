# 04 — Ten-Year Vision

> Over ten years MOOD grows from one daily Moment into a lifelong, private living library of a person — an operating system for being human that never becomes a scoreboard.

## Purpose
This chapter sets the decade horizon so short-term features never betray the long game. The ten-year promise: a person who opens MOOD for a decade should hold a private, meaningful archive of thousands of noticed moments and lived acts of courage — a portrait of a life that no analytics dashboard could ever produce. It guides which foundations we lay now (durable data ownership, timeless assets, gentle memory) versus fads we refuse.

## User Experience
Year 1 the user has a small Living Library and early Patterns. Year 5 they can open a `Chapter` for any season and re-read who they were. Year 10 the app can gently reflect: "לפני שבע שנים בחרת בפעם הראשונה במעשה של אומץ" ("seven years ago you chose an act of courage for the first time"). The experience deepens without ever getting louder — no gamified milestones, only meaning. A user should feel the app has quietly kept faith with their life.

## Game Mechanic
The long loop is the daily Core Loop compounded over time. New long-horizon mechanics:
- `Chapter` rollups (weekly → monthly → yearly → decade) that narrate growth as story.
- `RareMoment` — infrequent, earned-by-living moments that punctuate years without becoming trophies.
- Human Map evolution: `Trait` signals (soft 0–1, with confidence + decay) mature and shift, never hardening into a fixed label.
No mechanic ever converts time into a streak or a score.

## Screens Needed
- Living Library (with year and decade views)
- Patterns (long-horizon Chapters)
- Moment Detail (revisiting years later)
- Settings and Privacy (long-term data ownership, export)

## Visual Assets Needed
- Masterpiece assets designed to feel timeless a decade later (no dated styling).
- Moment assets and Video keyframes for anniversary/year reflections.
- Texture and Light assets ensuring visual longevity.
Grok-generated, no baked text; style must age gracefully.

## AI Logic
The Memory Engine is the ten-year backbone: it retrieves relevant past `Moment`s and `Attempt`s to give long-term reflections continuity. Pattern Recognition composes yearly and decade `Chapter`s (Claude + heuristics) framed as narrative growth. Strict guardrails: long histories must never be mined to diagnose or predict the user in a labeling way; retrieval respects privacy and local-first ownership.

## Data Stored
`LibraryItem` archive designed for decade-scale volume; `Chapter` entities across time granularities; `RareMoment`; `HumanMap` with versioned `Trait` signals (value, confidence, decay, updatedAt ISO 8601). Data portability: full local export. Local-first is canonical; Supabase optional sync must support long-term schema migration.

## Edge Cases
- Multi-year gaps: warm return, history intact, no guilt.
- Data migration across a decade of schema changes (versioned models).
- Device loss: optional encrypted cloud restore; local export as backstop.
- Huge Library performance (virtualized lists).
- Long RTL histories and accessibility across years of content.

## Build Requirements
Durable, versioned data model with migrations; export/import; Chapter rollup jobs; scalable Library rendering. Memory Engine retrieval index. Higher effort, phased across releases; foundations laid in year 1.

## Definition of Done
- [ ] Data model supports decade-scale volume with migrations and export.
- [ ] Yearly and decade Chapters generate as narrative, not metrics.
- [ ] Anniversary reflections retrieve accurate past Moments.
- [ ] No long-horizon feature introduces streaks, scores, or diagnosis.
- [ ] Timeless assets and Hebrew RTL verified to age well.
