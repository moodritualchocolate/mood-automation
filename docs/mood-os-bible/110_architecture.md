# 110 — Architecture

> The end-to-end system shape of MOOD: a local-first PWA where the daily loop runs offline and Supabase is an optional, encrypted mirror.

## Purpose
This chapter is the map of the whole machine. It exists so every engineer, designer, and AI author shares one mental model of how the Human Experience Game is built: what runs on the device, what runs in the cloud, where AI is called, and how a person's data stays theirs. It anchors Volume 11 — every later chapter (111–120) zooms into one box on this diagram.

## User Experience
Architecture is invisible to the user, and that is the point. They open MOOD once a day, on a phone, and the **Today / Daily Moment** screen appears instantly — even on a train with no signal — because the day was already resolved locally. Sync, if enabled, happens silently in the background. There is no loading spinner blocking the ritual, no "reconnecting" banner, no account wall on first run.

## Game Mechanic
MOOD is a single Next.js 14 (App Router) application, installable as a PWA, running three cooperating layers:
1. **Client runtime** — React Server/Client Components, Zustand stores, a local persistence adapter (IndexedDB), and a Service Worker cache. This layer alone can run the full 10-station Core Loop (see Ch. 06).
2. **Route Handlers** (`app/api/*`) — thin server functions for AI generation, asset signing, and sync orchestration. Stateless; never a source of truth for user data.
3. **Optional Supabase backend** — Postgres (data mirror), Auth (anonymous → linked), Realtime (cross-device), Storage (assets). Enabled only when the user opts into cloud sync.
External services: **Claude API** (reflection/challenge/pattern text) and **Grok** (visual assets), both reached only through Route Handlers so keys never touch the client.

## Screens Needed
- Splash (boot + local hydrate)
- Today / Daily Moment (proves offline-first)
- Settings (sync toggle, account link)
- Privacy (data ownership controls)

## Visual Assets Needed
- Masterpiece assets and Moment assets (fetched via signed Storage URLs or local cache)
- Light + Texture assets (transitions). No text baked into any image.

## AI Logic
AI is an edge concern, not core state. Claude is called from Route Handlers with server-held keys; outputs pass Tone Guardrails + Copy Linter (Ch. 118) before reaching the client. When offline or on failure, the client serves cached/hand-authored Hebrew fallback copy so the loop never blocks.

## Data Stored
The full shared model (`User`, `HumanMap`+`Trait[]`, `MomentTemplate`, `DailyMoment`, `Challenge`+`ChallengeLevel`, `Attempt`, `JournalEntry`, `LibraryItem`, `Pattern`, `RareMoment`, `Chapter`, `RippleStat`, `Asset`, `Reflection`) lives first in IndexedDB and is mirrored to Postgres when sync is on. Timestamps ISO 8601; copy fields Hebrew. Details in Ch. 113.

## Edge Cases
- First run, no account: everything works locally; no network required.
- Offline: reads/writes hit IndexedDB; a durable outbox queues mutations.
- Multi-tab: BroadcastChannel keeps Zustand stores consistent in realtime.
- Sync conflict: last-writer-wins per field with a merge log (Ch. 115).
- AI/asset service down: graceful fallbacks, never an error screen.

## Build Requirements
- Next.js 14 App Router, TypeScript strict, Tailwind (RTL), Zustand.
- Local persistence adapter + Service Worker (Workbox) for PWA offline.
- Supabase client (lazy-loaded) behind a `syncEnabled` flag.
- `aiClient` (Claude) and `assetClient` (Grok) wrappers in Route Handlers only.
- Effort: L (foundational).

## Definition of Done
- [ ] Full Core Loop completes with the network fully disabled.
- [ ] No API key is ever bundled into client code.
- [ ] Supabase is lazy-loaded and skipped entirely when sync is off.
- [ ] Cross-tab state stays consistent via BroadcastChannel.
- [ ] Every box in this diagram maps to a chapter in 111–120.
