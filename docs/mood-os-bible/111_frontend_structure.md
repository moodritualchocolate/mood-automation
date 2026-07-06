# 111 — Frontend Structure

> The Next.js 14 App Router folder map: how MOOD's screens, stores, and RTL UI are organized so the daily ritual stays fast and calm.

## Purpose
This chapter fixes the physical shape of the frontend codebase so features land in predictable places. It exists to keep the app mobile-first, RTL-correct, offline-capable, and calm — and to make sure every Volume 09 screen has one obvious home in the tree.

## User Experience
The user feels a single, quiet surface: a splash that hydrates from local storage, then **Today / Daily Moment**. Navigation is minimal and gesture-light. All text renders in a live Hebrew RTL layer over artwork (never baked into images). Light/dark follow system. Transitions are soft; nothing flashes scores or counters.

## Game Mechanic
Folder structure (App Router):

```
app/
  layout.tsx              # <html dir="rtl" lang="he">, theme, providers
  page.tsx                # Splash → redirect to /today
  (onboarding)/
    onboarding/page.tsx    # Onboarding
    discovery/page.tsx     # Discovery Flow
  (daily)/
    today/page.tsx         # Today / Daily Moment
    challenge/page.tsx     # Challenge Selection
    evening/page.tsx       # Evening Check-in
  library/
    page.tsx               # Living Library
    [momentId]/page.tsx    # Moment Detail
  patterns/page.tsx        # Patterns
  ripple/page.tsx          # Shared Humanity
  settings/page.tsx        # Settings
  privacy/page.tsx         # Privacy
  accessibility/page.tsx   # Accessibility
  api/                     # Route Handlers (see Ch. 114)
components/
  moment/  challenge/  journal/  library/  patterns/  ripple/
  ui/                      # buttons, sheets, RTL primitives
  layout/                  # AppShell, SafeArea, ThemeToggle
lib/
  stores/                  # Zustand: useLoopStore, useHumanMapStore, useLibraryStore, useSyncStore
  db/                      # IndexedDB adapter + schema
  sync/                    # Supabase client, outbox, merge
  ai/                      # client-side fallback copy bundles
  i18n/                    # Hebrew strings, RTL helpers
  guardrails/              # Copy Linter (client mirror)
public/
  sw.js  manifest.json     # PWA
```

Route groups `(onboarding)` and `(daily)` share layouts without adding URL segments. Stores autosave to IndexedDB and broadcast via BroadcastChannel.

## Screens Needed
All Volume 09 screens map 1:1 above: Splash, Onboarding, Discovery Flow, Today / Daily Moment, Challenge Selection, Evening Check-in, Living Library, Moment Detail, Patterns, Shared Humanity, Settings, Privacy, Accessibility.

## Visual Assets Needed
- Masterpiece + Moment assets in `moment/` components
- Light + Texture assets for transitions; Social/Share assets in `ripple/`. No text in images.

## AI Logic
The frontend never calls Claude directly. `lib/ai/` holds only deterministic fallback Hebrew copy and a client mirror of the Copy Linter for last-line defense. All generation flows through Route Handlers (Ch. 114, 118).

## Data Stored
Zustand stores are the runtime cache of the shared model; `lib/db/` persists them to IndexedDB; `lib/sync/` mirrors to Supabase when enabled. Copy fields Hebrew; timestamps ISO 8601.

## Edge Cases
- RTL + long Hebrew: components use logical properties (`ps/pe`, `text-start`) and `dir="rtl"`.
- Empty states: each screen ships a warm first-run variant (no data ≠ error).
- Offline: pages are Client Components hydrating from IndexedDB; Service Worker serves the shell.
- Accessibility: focus order respects RTL; reduced-motion honored.

## Build Requirements
- TypeScript strict, path aliases (`@/lib`, `@/components`).
- Tailwind with RTL plugin + logical utilities; theme tokens.
- Workbox Service Worker; Web App Manifest.
- Effort: M.

## Definition of Done
- [ ] Every Volume 09 screen has exactly one route file above.
- [ ] `layout.tsx` sets `dir="rtl" lang="he"`; no physical-side utilities remain.
- [ ] Stores hydrate from IndexedDB before first paint of /today.
- [ ] No client module imports the Claude or Grok SDK.
- [ ] App shell loads offline via Service Worker.
