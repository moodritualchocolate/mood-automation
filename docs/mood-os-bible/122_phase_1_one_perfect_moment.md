# 122 — Phase 1 — One Perfect Moment

> The smallest lovable slice that still contains the **whole loop** (simplified): Discovery → Human Map → Moment → Recognition → Challenge → Evening Journal → Living Library — running fully local with no account.

> **Founder mandate (ratified):** this slice is not "the Moment alone." It must
> carry the entire loop, even if simplified, because *the loop is the game*. The
> build-ready product definition — full copy, the tone-safe "Returning Pull" habit
> model, and the Grok/Codex handoff briefs — lives in
> [`specs/one_perfect_moment.md`](./specs/one_perfect_moment.md). It runs the full
> studio pipeline including the **Feeling Gate** and **Reality Gate** (Ch. 00), and
> is measured by one KPI: *did the player naturally want to return tomorrow?*

## Purpose
Phase 1 proves the emotional core of MOOD with the least possible surface area. It builds exactly one authored Moment and lets a person live one honest pass through the core loop (Ch. 06), so the studio can feel whether the promise from Ch. 01 lands before investing in engines. Nothing here is generated at runtime, nothing requires a network. If this single Moment makes a tester feel seen, the product thesis holds.

## User Experience
The user opens the PWA and immediately meets one Moment on the Today / Daily Moment screen — full-bleed artwork, a tiny Hebrew title, a short living Reflection. Example: title "רגע קטן של אומץ" ("a small moment of courage"), Reflection opener "שמנו לב למשהו קטן אצלך היום" ("we noticed something small about you today"). They choose one Challenge level (Easy / Medium / Brave), leave the app to live it, and return that evening to a gentle Check-in. The Moment is then kept forever in a one-item Living Library.

## Game Mechanic
**Scope IN:** a single hand-authored `MomentTemplate` resolved to one `DailyMoment`; a three-level Challenge ladder (see Ch. 41–42); the Live step (app closes); one Evening Journal entry; a minimal Living Library holding that one Moment. Per-day states: `unseen → seen → challenge_chosen → lived → journaled`.
**Scope OUT:** Discovery (Ch. 19–20), Human Map, runtime AI, accounts, sync, Ripple, Patterns, RareMoments, multiple Moments. This phase **implements** Ch. 06 (core loop, one turn), Ch. 30–31 (Moment definition/structure), Ch. 41–42 (Challenge philosophy/levels), and Ch. 07 first-run gentleness.
**Entry criteria:** Ch. 121 MVP scope agreed; one Moment authored (artwork + Hebrew copy) and tone-approved.
**Exit criteria:** a tester completes the full loop offline, no account, no banned concepts, and reports feeling noticed.
**Demo goal:** hand a stranger a phone; they meet one Moment, take one real-world challenge, and journal that night — start to finish, offline.

## Screens Needed
- Splash
- Today / Daily Moment
- Challenge Selection
- Evening Check-in
- Living Library (single item)

## Visual Assets Needed
- One Moment asset (the hand-crafted artwork)
- Light assets and Texture assets for warmth
Grok-generated, painterly-photographic, warm light, negative space. NO text baked into the image; the title and Reflection are live RTL layers.

## AI Logic
Not AI-driven at runtime — Phase 1 ships **fully authored** Hebrew copy so the slice works with zero API dependency. The copy is still written to Tone Guardrail standards and passes the Copy Linter (Ch. 06) before shipping. Never diagnose, never label; success language is about the attempt.

## Data Stored
- `DailyMoment` (local id, date, resolved `Reflection`, state)
- `Challenge` + three `ChallengeLevel`s
- `Attempt` (tried | didn't try — no penalty)
- `JournalEntry` (what happened, how it felt, want to try again)
- `LibraryItem` (the kept Moment)
Local anonymous id, no `User` account. Hebrew strings; ISO 8601. IndexedDB is source of truth; no Supabase.

## Edge Cases
- First run: the Moment appears instantly, no onboarding gate.
- Offline: entire loop works; airplane mode is the default test.
- Skipped evening: the Journal simply waits — no streak, no guilt.
- "Didn't try": recorded warmly as a real, unpunished outcome.
- Long RTL Reflection: never clips over artwork.
- App reopened same day: shows the already-seen Moment, not a new one.

## Build Requirements
Next.js 14 App Router, TypeScript, Tailwind, mobile-first, full RTL, light/dark. Zustand store with autosave + BroadcastChannel. IndexedDB persistence. `MomentRenderer`, `ChallengeLadder`, `EveningCheckin`, `LibraryList` components. PWA installable. Effort: small — one Moment, no engines.

## Definition of Done
- [ ] One authored Moment renders (artwork + title + Reflection) with a three-level Challenge.
- [ ] Full loop (see → choose → live → journal → library) completes offline, no account.
- [ ] "Didn't try" and skipped days carry no penalty or shame copy.
- [ ] Hebrew RTL correct in light and dark; no baked-in image text.
- [ ] Copy Linter passes; no banned concepts present.
