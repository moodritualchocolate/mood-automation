# 88 — Splash

> The first two seconds of MOOD: a warm, quiet threshold that opens the daily ritual without asking anything of the user.

## Purpose
The Splash screen is the doorway into MOOD's once-a-day ritual (see Ch. 06 Core Loop, station 3). It exists to set tone — calm, timeless, human — and to cover the moment while the app boots, restores local state, resolves today's `DailyMoment`, and decides where to route. It must never feel like a loading wall or an ad. It is the exhale before the day's Moment.

## User Experience
On launch the user sees a full-bleed timeless artwork (a Masterpiece or Light asset), gentle fade-in, and the wordmark rendered as a live RTL text layer. Under it a single quiet line breathes in: "רגע אחד. בשבילך." ("one moment. for you."). No buttons, no login gate on the happy path. After 1.2–2.5s (or when data is ready) the screen dissolves into the next surface. If work is still pending, a soft pulse of light communicates patience without a spinner or percentage. The feeling target: *the app is holding space for me.*

## Game Mechanic
Splash is a pure transition state, not a play surface. States: `booting → restoring → routing`. Routing rules: first ever launch → Onboarding (Ch. 89); Discovery incomplete → Discovery Flow (Ch. 90); day already opened → Living Library (Ch. 94) or Today; otherwise → Today / Daily Moment (Ch. 91). Minimum display 1.2s so it never flickers; maximum 2.5s before it hands off even if sync is slow (data loads behind the next screen). No input, no scoring, no streak.

## Screens Needed
- Splash
- Onboarding
- Discovery Flow
- Today / Daily Moment

## Visual Assets Needed
- Masterpiece assets (hero threshold image)
- Light assets, Texture assets (warm overlay glow)
- Video keyframes (optional 2s ambient loop). No text baked into any image; wordmark and line are live layers.

## AI Logic
Not AI-driven — Splash only orchestrates boot and routing. It may prefetch the Reflection/Challenge payloads for Today so downstream screens feel instant, but generates nothing itself.

## Data Stored
Reads only: `User` (session, onboarding flags), `HumanMap` completeness, today's `DailyMoment` state. Writes only a local `lastOpenedAt` (ISO 8601). Local-first; optional Supabase session refresh in background.

## Edge Cases
- First run: route to Onboarding, never flash Today first.
- Offline: render fully from cached artwork + local state; skip sync silently.
- Missing hero asset: fall back to a neutral warm gradient, never a blank white screen.
- Cold boot slow (>2.5s): hand off to skeleton on next screen rather than hold Splash.
- Reduced motion: fade only, no ambient video (see Ch. 100).
- Long RTL wordmark/line: never clip; center-safe layout.

## Build Requirements
- `SplashScreen` client component, Tailwind, mobile-first, RTL, light/dark.
- `useBootStore` (Zustand) resolving route; BroadcastChannel to avoid double-open across tabs.
- PWA app-shell caching so Splash renders instantly offline.
- Effort: S.

## Definition of Done
- [ ] Splash shows for 1.2–2.5s then routes by the rules above.
- [ ] No spinner, percentage, score, or streak anywhere.
- [ ] Renders fully offline with cached hero asset or warm fallback.
- [ ] Wordmark/line are live RTL layers, not baked into artwork.
- [ ] Reduced-motion path uses fade only; light and dark both verified.
