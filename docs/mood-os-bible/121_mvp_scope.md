# 121 — MVP Scope

> The MVP is the smallest build that delivers one complete turn of the core loop and makes a person feel gently seen — nothing more, nothing that breaks tone.

## Purpose
This chapter fixes what the first shippable MOOD actually contains, so the studio builds toward one agreed target instead of everything at once. The MVP exists to prove the emotional promise (see Ch. 01 Vision) in the real world: that one small daily Moment can make someone feel noticed. It defines the boundary between the six delivery phases (Ch. 122–127) and everything deferred. If a feature does not serve one honest pass through the core loop (Ch. 06), it is out of the MVP.

## User Experience
A person installs the PWA, meets a single hand-crafted Daily Moment — artwork, tiny Hebrew title, living Reflection — chooses one Challenge level, lives it in the real world, and returns in the evening to journal. No account, no sign-up wall, no streak, no score. Example first title: "רגע קטן של אומץ" ("a small moment of courage"). The whole first experience runs offline on one device.

## Game Mechanic
MVP scope is defined phase by phase. **In:** one full core-loop turn (Discovery-lite → Daily Moment → Challenge → Live → Evening Journal → Living Library), local-first storage, Hebrew RTL, light/dark, PWA install. **Out of MVP (deferred to later phases or post-release):** accounts, cloud sync, Ripple/Shared Humanity, Pattern Engine, weekly/monthly Chapters, RareMoments, video keyframes, multi-device realtime. Phase 1 (Ch. 122) narrows even further to a single authored Moment with no Discovery.

## Screens Needed
- Splash
- Today / Daily Moment
- Challenge Selection
- Evening Check-in
- Living Library
(Onboarding, Discovery Flow, Patterns, Shared Humanity, Settings, Privacy, Accessibility arrive in later phases.)

## Visual Assets Needed
- Moment assets (the daily artwork)
- Light assets and Texture assets
All Grok-generated, painterly-photographic, warm light, negative space. NEVER any text baked into an image; all Hebrew copy is a live RTL text layer.

## AI Logic
MVP uses the Reflection Generator and Challenge Generator (Claude, see Ch. 06 / Ch. 54) behind an authored fallback: hand-written Hebrew copy ships as the safe default so the MVP works even if live generation is off. All outputs pass Tone Guardrails and the Copy Linter. Never diagnose, never label. Pattern Recognition and Memory Engine are out of MVP.

## Data Stored
- `DailyMoment`, `Reflection`, `Challenge`, `ChallengeLevel`, `Attempt`, `JournalEntry`, `LibraryItem`
- No `User` account required; a local anonymous id keys everything. Hebrew copy strings; ISO 8601 timestamps. Local-first is source of truth; Supabase sync is out of MVP.

## Edge Cases
- First run with no data: show the authored Moment immediately, no setup.
- Offline: entire loop works from local storage.
- Skipped day: no penalty, no streak, no guilt copy.
- Abandoned Challenge: journaling "didn't try" is a valid, unpunished outcome.
- Long RTL Reflection: must not clip over artwork.

## Build Requirements
Next.js 14 App Router, TypeScript, Tailwind, mobile-first, full RTL, light/dark. Zustand with autosave + BroadcastChannel. Local storage (IndexedDB) as source of truth. PWA installable. Effort: the five phases in Ch. 122–126, gated by Ch. 128 Definition of Done and Ch. 129 Final Audit before the Ch. 127 full release.

## Definition of Done
- [ ] One complete core-loop turn works offline with no account.
- [ ] Scope in/out for every phase (Ch. 122–127) is written and agreed.
- [ ] No banned concepts (score/streak/diagnose/fail) anywhere in MVP copy.
- [ ] Hebrew RTL renders correctly in light and dark.
- [ ] Deferred features are explicitly listed, not silently dropped.
