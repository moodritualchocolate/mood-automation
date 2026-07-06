# 115 — Local-First

> MOOD lives on the device: the daily ritual runs fully offline in IndexedDB, and Supabase is an optional background mirror with last-writer-wins merge.

## Purpose
This chapter defines MOOD's data-ownership stance: the person's device is the source of truth. It exists so the Core Loop never depends on a network, an account, or a server being up. Cloud sync is a convenience for multiple devices and backup — never a requirement to play. This is both a product promise and a privacy stance (see Ch. 116).

## User Experience
On first open, MOOD works — no sign-up wall. On a plane, everything works: today's Moment appears, a Challenge is chosen, the Evening Check-in saves, the Library grows. If the user later enables sync in **Settings**, their life quietly appears on a second device. They never see conflict dialogs; merges are silent and safe.

## Game Mechanic
- **Persistence**: Zustand stores autosave to **IndexedDB** (one object store per entity, Ch. 113) plus a `syncMeta` store tracking `updatedAt`, `dirty`, `deleted`.
- **Realtime (same device)**: **BroadcastChannel** keeps multiple tabs' stores identical instantly.
- **Outbox**: every local mutation marks the row `dirty` and enqueues it. When online + sync on, the outbox drains to `/api/sync/push`.
- **Pull**: `/api/sync/pull?since=<cursor>` fetches changed rows; Supabase Realtime pushes live updates while the app is open.
- **Merge**: **last-writer-wins per field** using `updatedAt`, with a retained merge log so no write silently vanishes. Deletes are tombstones (`deleted=true`), never hard-lost until confirmed both sides.
- **Boundary**: the day is resolved locally first; server responses (reflection/challenge) hydrate in when available, else fallback copy shows.

## Screens Needed
- Settings (sync toggle, device list)
- Privacy (export/delete)
- Splash (hydrate-from-local before first paint)

## Visual Assets Needed
- Service Worker caches Masterpiece + Moment + Light assets for offline display. Assets are content-addressed; no text baked into any image.

## AI Logic
AI is online-only, so the loop must never block on it. `lib/ai/` ships a deterministic bundle of hand-authored Hebrew fallback Reflections and Challenge sets, guardrail-clean, used when offline or on failure. Generated copy replaces fallback silently on next sync.

## Data Stored
All shared entities (Ch. 113) persist locally first; `syncMeta` drives mirroring. `RippleStat` is fetched-only and cached (it is a global aggregate, not user data). Timestamps ISO 8601; copy Hebrew.

## Edge Cases
- Offline for days: outbox grows, drains cleanly on reconnect; **no streak penalty** for skipped days — the loop simply resumes.
- Same row edited on two devices: field-level LWW; both users' non-conflicting fields preserved.
- Clock skew: server `updatedAt` authoritative at merge time.
- Storage full/eviction: warn in Settings, prioritize keeping Journal + Library.
- Sync toggled off: local data untouched; pushes stop.

## Build Requirements
- `lib/db/` IndexedDB adapter (idb) mirroring Postgres schema 1:1.
- `lib/sync/` outbox, cursor tracking, LWW merge, tombstones, Supabase Realtime subscription.
- BroadcastChannel wiring in Zustand persist middleware.
- Workbox Service Worker precaching shell + asset runtime cache.
- Effort: L.

## Definition of Done
- [ ] Full Core Loop completes with network disabled, then syncs on reconnect.
- [ ] No account required to use the app.
- [ ] Cross-tab edits reflect instantly via BroadcastChannel.
- [ ] Two-device edit resolves via field-level LWW with a merge log.
- [ ] Skipped offline days produce no penalty or shame copy.
