# 112 — Backend Structure

> The thin server tier: Next.js Route Handlers for AI and assets, plus an optional Supabase backend that only ever mirrors the device.

## Purpose
This chapter defines the server side of MOOD and, deliberately, keeps it small. The backend exists to do three things the device cannot safely do alone: hold secret API keys (Claude, Grok, Supabase service role), broker AI generation, and offer an optional multi-device mirror. It is never the source of truth for a person's life — the device is (see Ch. 115).

## User Experience
Users never see the backend. They feel its effects: a fresh Hebrew reflection under today's Moment, three challenge levels, artwork that loads, and — if they linked a device — the same Living Library on their tablet. If the backend is unreachable, the ritual still completes on cached data with no error surfaced.

## Game Mechanic
Two backend layers:

1. **Route Handlers** (`app/api/*`) — stateless serverless functions. They validate input, attach server-held keys, call Claude/Grok, run Tone Guardrails + Copy Linter, and return sanitized results. They also sign Supabase Storage URLs and orchestrate sync push/pull. No user data is stored in the handler itself.
2. **Supabase** (optional) —
   - **Postgres**: the mirror of the shared data model, protected by Row Level Security.
   - **Auth**: anonymous sessions on first sync, upgradable to email/OAuth without data loss.
   - **Realtime**: row-change streams that feed cross-device updates.
   - **Storage**: buckets for Grok-generated `Asset`s (`assets/masterpiece`, `assets/moment`, …).

Trust boundary: the client holds only the Supabase anon key + user JWT; the service role key lives only in Route Handlers. All AI keys are server-only.

## Screens Needed
- Settings (link account / enable sync)
- Privacy (export, delete-all — backed by server endpoints)

Backend is otherwise screenless.

## Visual Assets Needed
- Storage buckets hold Masterpiece, Moment, People, Home, Object, Light, Texture, Social/Share assets and Video keyframes. Handlers return signed URLs. No text baked into any image.

## AI Logic
All Claude and Grok calls originate here. `aiClient` wraps Claude (model `claude-opus-4-8`) with retry/timeout/streaming; `assetClient` wraps Grok. Every text output passes Tone Guardrails + Copy Linter before the response is sent. Never diagnose, never label; on failure return safe fallback copy with a 200, not an error.

## Data Stored
Route Handlers store nothing durable. Supabase Postgres mirrors `User`, `HumanMap`, `Trait`, `MomentTemplate`, `DailyMoment`, `Challenge`, `Attempt`, `JournalEntry`, `LibraryItem`, `Pattern`, `RareMoment`, `Chapter`, `RippleStat`, `Asset`, `Reflection` (schema in Ch. 113). `RippleStat` aggregates are anonymous and computed server-side.

## Edge Cases
- Sync disabled: no Supabase call ever fires; handlers still serve AI/assets.
- AI/Grok timeout: fallback copy / cached asset, HTTP 200.
- Auth upgrade (anon → email): migrate rows to the new `user_id` atomically.
- Abuse/rate limits: per-user throttling on generation endpoints.
- Distress signal in journal: handler routes to safety copy, halts challenge escalation.

## Build Requirements
- Route Handlers under `app/api/` (Ch. 114) with zod input validation.
- `lib/server/aiClient.ts`, `assetClient.ts`, `guardrails/` (server authoritative).
- Supabase project: Postgres + RLS, Auth, Realtime, Storage buckets.
- Ripple aggregation job (scheduled) writing `RippleStat`.
- Effort: M–L.

## Definition of Done
- [ ] No secret key is reachable from client bundles.
- [ ] Every generation endpoint runs guardrails before responding.
- [ ] RLS blocks any cross-user row access (verified by test).
- [ ] Sync-off mode makes zero Supabase requests.
- [ ] Anonymous→linked upgrade preserves all rows.
