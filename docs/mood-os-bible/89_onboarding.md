# 89 — Onboarding

> A three-beat welcome that explains the promise of MOOD in feeling, not features, and hands the user straight into Discovery.

## Purpose
Onboarding exists to make one promise land before any mechanics: *someone here will notice something small about your life that you never knew how to say.* It replaces feature tours and permission dumps with a short emotional prelude, sets expectations (once a day, no scores, private by default), and flows directly into Discovery (Ch. 90). It runs once per `User`.

## User Experience
Three full-screen beats, swipeable RTL (right-to-left advance), each a timeless artwork with one live Hebrew line and a quiet "המשך" ("continue"). Beat 1 — the promise: "כל יום נבחין במשהו קטן אצלך." ("every day we'll notice something small about you."). Beat 2 — the rhythm: "רגע אחד ביום. לא עוד הודעות." ("one moment a day. no more notifications."). Beat 3 — the trust: "הכול שלך. פרטי כברירת מחדל." ("it's all yours. private by default."). A skippable "דלג" sits low. The final beat's button reads "בוא נתחיל" ("let's begin") and opens Discovery. No account is required to start; sign-in is offered later as optional cloud sync.

## Game Mechanic
Linear 3-step carousel with progress shown as three soft dots (never a percentage or score). States: `beat_1 → beat_2 → beat_3 → discovery_handoff`. Inputs: swipe/tap continue, tap skip. Skip still routes to Discovery (never to an empty Today). Completing sets `User.onboardingComplete = true` so it never repeats. No streak, no reward.

## Screens Needed
- Onboarding
- Discovery Flow
- Privacy (linked from beat 3)

## Visual Assets Needed
- Masterpiece assets (three welcome images)
- People assets (human intimacy), Light assets (warmth). No text baked in; all lines are live RTL layers.

## AI Logic
Not AI-driven — Onboarding copy is authored, tone-locked, and shipped through the Copy Linter (Ch. 06). No personalization yet, because the Human Map is still empty.

## Data Stored
- `User.onboardingComplete` (bool), `User.consent` (privacy acknowledgement, ISO 8601).
- No `HumanMap` writes here (that begins in Discovery). Local-first; optional Supabase sync once/if the user later signs in.

## Edge Cases
- First run only: gated by `onboardingComplete`; never re-shown after completion.
- Skip on beat 1: still hand off to Discovery with a gentle universal start.
- Offline: fully local, no network needed; consent stored locally, synced later.
- Reinstall with no cloud account: onboarding shows again (expected, no data to restore).
- Long RTL lines: reflow, never clip over artwork.
- Reduced motion: cross-fade beats instead of sliding (Ch. 100).

## Build Requirements
- `OnboardingCarousel` component, Tailwind, RTL swipe (advance leftward), light/dark, mobile-first.
- Link to Privacy (Ch. 99); deferred optional auth entry point.
- Persist flags via Zustand + local storage; BroadcastChannel to close onboarding in other tabs.
- Effort: S–M.

## Definition of Done
- [ ] Three beats render in Hebrew RTL with live text layers over art.
- [ ] Skip and complete both route into Discovery, never a blank screen.
- [ ] `onboardingComplete` prevents any repeat.
- [ ] No scores, streaks, or forced account creation.
- [ ] Works fully offline; consent captured and later syncable.
- [ ] Reduced-motion and long-text variants verified in light and dark.
