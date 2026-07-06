# 91 — Today / Daily Moment Screen

> The heart of MOOD: the one screen a person opens each day to meet their Daily Moment.

## Purpose
Today is where the core promise is delivered (see Ch. 06 station 4, Ch. 30 Moment Definition). It presents exactly one `DailyMoment` — artwork, tiny title, living Reflection, optional invitation and Challenge — and nothing else competes for attention. It is the single most important surface in the product and the default landing after Splash.

## User Experience
Full-bleed timeless artwork fills the screen. A tiny Hebrew title floats over it, e.g. "רגע קטן של אומץ" ("a small moment of courage"). Below, a short living Reflection written for this person: "שמנו לב שקשה לך לבקש עזרה — ואולי דווקא היום…" ("we noticed it's hard for you to ask for help — and maybe today…"). A quiet optional invitation and a single soft button "רוצה אתגר?" ("want a challenge?") lead to Challenge Selection (Ch. 92). One Moment per day; no feed, no next. Regions top-to-bottom: artwork hero, title layer, Reflection block, optional invitation, Challenge entry, subtle nav to Library. The feeling target: *someone noticed something I never knew how to say.*

## Game Mechanic
Renders the day's `DailyMoment` in states `unseen → seen → challenge_chosen → lived → journaled`. Opening marks `seen` (the Moment is already "complete"). Accepting a challenge routes to Ch. 92; evening return routes to Ch. 93. Forward-only per day; no next-Moment, no refresh-for-more, no score, no streak. Pull-to-refresh does nothing but a gentle bounce — there is only today.

## Screens Needed
- Today / Daily Moment
- Challenge Selection
- Moment Detail
- Living Library

## Visual Assets Needed
- Moment assets (the daily artwork), Masterpiece assets (rare days)
- Light, Texture assets (warmth). No text baked in; title + Reflection are live RTL layers.

## AI Logic
Reflection Generator (Claude) writes the Hebrew Reflection from `HumanMap` signals + Memory Engine context; Challenge Generator prepares the optional three levels (Ch. 06). All copy passes Tone Guardrails + Copy Linter. Never diagnose, never label, success framed as attempt.

## Data Stored
- `DailyMoment` (userId, date, templateId, resolved `Reflection`, state).
- `Reflection` (Hebrew copy, generatorVersion, ISO 8601).
- Local-first source of truth; optional Supabase sync.

## Edge Cases
- First run / thin Human Map: gentle universal Moment, no challenge pressure.
- Loading: soft skeleton over warm gradient, never a spinner wall.
- Empty (no Moment resolved yet): warm placeholder + retry, never blank.
- Error/generation fail: fall back to a cached authored Moment; never show an error code to the user.
- Offline: full render from local cache; sync defers silently.
- Skipped days: no penalty, no guilt copy; yesterday's Moment rests in Library.
- Long RTL Reflection: scroll within block, never clip over art.

## Build Requirements
- `TodayScreen` using `MomentRenderer` (artwork + text layers + optional slots), Tailwind, RTL, light/dark, mobile-first.
- `/api/daily-moment` + `/api/reflection`; Zustand `useLoopStore`, autosave, BroadcastChannel.
- PWA offline cache of today's payload; skeleton + fallback states.
- Effort: L (core surface).

## Definition of Done
- [ ] Exactly one Daily Moment renders with live RTL title + Reflection.
- [ ] Loading, empty, error, and offline states all warm, never blank/coded.
- [ ] Opening marks `seen`; challenge entry routes to Ch. 92.
- [ ] No feed, next-Moment, score, or streak present.
- [ ] Verified in Hebrew RTL, light and dark, long-text and reduced-motion.
