# 30 — Moment Definition

> A Moment is the atomic unit of MOOD: a timeless artwork, a tiny title, a living Reflection, and optional invitation and Challenge that together make one person feel gently seen.

## Purpose
The Moment is the single thing MOOD delivers to a person each day. Everything upstream (Discovery, Human Map) exists to shape it; everything downstream (Challenge, Journal, Library, Patterns) exists to extend it. This chapter fixes exactly what a Moment *is* so that every other volume builds against one shared definition. A Moment is not content, not a card, not a prompt — it is a small, complete human observation offered once, then kept forever.

## User Experience
The user opens MOOD once per day and meets one Moment on the Today / Daily Moment screen. They see a full-bleed timeless artwork, a tiny title layered over it, and a short living Reflection written for them. Beneath, an optional invitation and an optional Challenge (Easy / Medium / Brave) wait quietly. Nothing autoplays, nothing nags. Example title: "רגע קטן של אומץ" ("a small moment of courage"). Example reflection opener: "שמנו לב למשהו קטן אצלך היום" ("we noticed something small about you today"). The feeling target: *someone noticed something I never knew how to say.*

## Game Mechanic
A Moment is composed of a fixed core plus optional layers (see Ch. 31, 35–40): core = artwork + title + Reflection; optional = invitation, Challenge, journal, memory, social share. A `MomentTemplate` is the reusable authored shell; a `DailyMoment` is one template resolved for one `User` on one date with personalized `Reflection` copy. Per-day states: `unseen → seen → challenge_chosen → lived → journaled`. There is no score, no win, no streak. A Moment is "complete" the instant it is seen; everything after is optional depth.

## Screens Needed
- Today / Daily Moment
- Moment Detail
- Living Library

## Visual Assets Needed
- Moment assets (the daily artwork)
- Masterpiece assets (rare cornerstone Moments)
- Light assets and Texture assets (warmth over the composition)
All from Grok, painterly-photographic, warm light, negative space, human intimacy. NEVER any text baked into the image; the title and Reflection are live RTL text layers rendered by the app.

## AI Logic
The Reflection Generator (Claude, see Ch. 06) writes the Hebrew living Reflection using Human Map signals and Memory Engine context. The Challenge Generator produces the optional three levels. All outputs pass Tone Guardrails and the Copy Linter. Never diagnose, never label, never shame; success language is always about the attempt.

## Data Stored
- `MomentTemplate` (authored shell, layer flags, `Asset` refs)
- `DailyMoment` (userId, date, templateId, resolved `Reflection`, state)
- `Reflection` (Hebrew copy, generatorVersion, timestamp)
All copy fields store Hebrew strings; timestamps ISO 8601. Local-first is source of truth; Supabase is optional sync.

## Edge Cases
- First run: a gentle introductory Moment, no Challenge pressure.
- Offline: the resolved `DailyMoment` renders fully from local storage.
- Skipped day: no penalty, no streak, no guilt copy.
- Long RTL Reflection: layout must not clip over artwork.
- Missing artwork: fall back to a neutral warm texture, never a blank.

## Build Requirements
Next.js 14 App Router, TypeScript, Tailwind, mobile-first, full RTL, light/dark. Zustand store for the active `DailyMoment` with autosave and BroadcastChannel sync. `MomentRenderer` component composing artwork + text layers + optional-layer slots. PWA, local-first, optional Supabase.

## Definition of Done
- [ ] A Moment renders core (artwork + title + Reflection) with optional layers slotting in.
- [ ] `MomentTemplate` and `DailyMoment` entities implemented and distinct.
- [ ] No text baked into artwork; all copy is a live RTL layer.
- [ ] No banned concepts (score/streak/diagnose) present.
- [ ] Hebrew copy renders correctly in light and dark.
