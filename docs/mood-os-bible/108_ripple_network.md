# 108 — Ripple Network

> Every small act quietly ripples outward through an anonymous web of shared humanity — the user can feel that their courage touched others, without ever seeing, counting, or being ranked by them.

## Purpose
This chapter unifies Volume 10 into one model: the Ripple Network — the invisible, anonymous fabric that connects every act of courage, gift, and shared Moment into a felt sense of "what I did mattered to more than just me." It is the architecture beneath belonging (Ch. 103), gifting (Ch. 107), and the weekly story (Ch. 106). It is a network with no nodes the user can name and no edges they can score.

## User Experience
When the user lives a challenge, they may see a soft ripple visualization: gentle concentric rings of light and a line like "המעשה שלך היום היה חלק מ-8,412 גלים קטנים של אומץ" ("your act today was part of 8,412 small ripples of courage"). Over time, the Living Library may show that their gifts and shared Moments "reached others" — always as warmth, never as a follower tally. There is no map of specific people, no "you influenced X", no reach metric. The feeling: I am a thread in something alive and kind.

## Game Mechanic
The network is modeled as anonymous `RippleStat` aggregations across acts: courage taken, gifts passed (Ch. 107), circles moved (Ch. 105). An act increments aggregate ripples without ever exposing a directed graph to the user. States: an act `contributes → aggregated → reflected back` as a warm line or visual. No edge is ever labeled with a real identity; no reach, influence, or virality score is surfaced.

## Screens Needed
- Shared Humanity
- Living Library
- Today / Daily Moment

## Visual Assets Needed
- Light assets and Texture assets (the ripple/rings visualization)
- Masterpiece and Social/Share assets (backdrops)
No text baked into images; the Hebrew ripple line is a live RTL layer.

## AI Logic
Not AI-driven for the aggregation itself (deterministic). Reflection Generator (Claude) may phrase the ripple line warmly; Pattern Recognition may gently note in the user's own history that "your courage often invites others" — as reflection, never as a metric. Copy Linter blocks reach/influence/rank framing. Never diagnose.

## Data Stored
`RippleStat { id, date, statType (courage|gift|circle), count, copyHe, k }` — anonymous aggregates only, **no directed user-to-user edges exposed**. Any internal linkage needed for matching is transient and identity-stripped. Copy Hebrew; timestamps ISO 8601. Local-first cache; Supabase aggregates server-side.

## Edge Cases
- Low aggregate (< k = 50): qualitative warmth instead of a bare number.
- New user, no ripples yet: "כל מעשה קטן מתחיל גל" ("every small act starts a ripple").
- Offline: last cached ripple line/visual.
- Accessibility: ripple visual has a text equivalent; reduced-motion honored.
- User opts out of social surfaces: acts still count anonymously; nothing shown.

## Build Requirements
`RippleStat` aggregation across act types; ripple visualization component with reduced-motion; Copy Linter gate; no directed-graph exposure. Medium effort.

## Definition of Done
- [ ] No follower graph, reach, or influence score is ever exposed.
- [ ] All ripple signals are anonymous aggregates (k ≥ 50 for numbers).
- [ ] Ripple visual has an accessible text equivalent and reduced-motion mode.
- [ ] Acts still contribute anonymously when the user opts out of display.
- [ ] Hebrew RTL copy renders in light and dark, offline-safe.
