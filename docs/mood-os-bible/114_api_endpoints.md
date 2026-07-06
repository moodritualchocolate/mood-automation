# 114 — API Endpoints

> The concrete Route Handler surface: every method, path, purpose, and auth rule for AI, assets, and optional sync.

## Purpose
This chapter enumerates MOOD's server endpoints so the client and backend agree on one contract. Endpoints are few and thin by design (see Ch. 112): they broker AI/assets, sign Storage URLs, and orchestrate sync. None of them is required for the daily loop to run offline.

## User Experience
Users never see URLs. These endpoints quietly deliver the reflection, the three challenge levels, the artwork, and — if sync is on — the same library across devices. Every endpoint degrades to a warm fallback rather than an error.

## Game Mechanic
All routes live under `app/api/`. Auth column: **none** (works pre-account), **session** (Supabase JWT required), **server** (server-key protected, no user body needed). Inputs validated with zod; text responses pass guardrails.

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/api/daily-moment?date=` | Resolve/return today's `DailyMoment` (+Moment, Asset, Reflection) | none |
| POST | `/api/reflection` | Generate Hebrew `Reflection` for a Moment (Claude) | none |
| POST | `/api/challenge` | Generate `ChallengeLevel[]` easy/medium/brave (Claude) | none |
| POST | `/api/attempt` | Record chosen level → create `Attempt(pending)` | session* |
| POST | `/api/journal` | Save `JournalEntry`, resolve `Attempt` to tried/not_tried | session* |
| POST | `/api/pattern` | Compute/refresh gentle `Pattern[]` for user | session |
| GET | `/api/library` | List `LibraryItem[]` for user | session |
| GET | `/api/chapter?period=` | Build weekly/monthly/year `Chapter` | session |
| GET | `/api/ripple?date=` | Anonymous `RippleStat[]` aggregate | none |
| GET | `/api/asset/:id` | Signed Storage URL for an `Asset` | none |
| POST | `/api/assets/generate` | Trigger Grok generation for a template asset | server |
| POST | `/api/sync/push` | Push dirty local rows (outbox) to Postgres | session |
| GET | `/api/sync/pull?since=` | Pull rows changed since cursor | session |
| GET | `/api/export` | Full user data export (JSON) | session |
| POST | `/api/account/delete` | Delete all cloud rows + storage for user | session |
| POST | `/api/auth/upgrade` | Anonymous → email/OAuth, migrate rows | session |

\* When sync is off, `attempt`/`journal` write only locally and skip the call entirely; the endpoints exist for the synced path.

## Screens Needed
Consumed by Today / Daily Moment, Challenge Selection, Evening Check-in, Living Library, Patterns, Shared Humanity, Settings, Privacy.

## Visual Assets Needed
`/api/asset/:id` and `/api/assets/generate` serve/produce Masterpiece, Moment, People, Home, Object, Light, Texture, Social, Video-keyframe assets. No text baked into any image.

## AI Logic
`/api/reflection`, `/api/challenge`, `/api/pattern` call Claude (`claude-opus-4-8`) via server `aiClient`, then run Tone Guardrails + Copy Linter (Ch. 118). On timeout/failure they return `200` with hand-authored Hebrew fallback. Never diagnose; never emit score/streak language.

## Data Stored
Endpoints read/write the shared model (Ch. 113). `/api/ripple` reads anonymous aggregates only (no `user_id`). Route Handlers persist nothing themselves.

## Edge Cases
- Offline: client never calls these; local loop proceeds, outbox queues writes.
- Guardrail rejection: regenerate once, else fallback copy.
- `safetyFlag` in `/api/journal`: return support copy, block challenge escalation.
- Rate limit on generation routes; `429` handled as fallback client-side.
- Delete/export: idempotent; export streams JSON.

## Build Requirements
- Route Handlers with zod validation + shared response types.
- Auth middleware verifying Supabase JWT for `session` routes.
- Signed-URL helper for Storage; scheduled Ripple aggregation writing `RippleStat`.
- Effort: M.

## Definition of Done
- [ ] Every path validates input and returns typed JSON.
- [ ] `none`-auth routes work with no account; `session` routes reject anon.
- [ ] All AI routes pass guardrails and never error to the user.
- [ ] `/api/ripple` exposes zero user identifiers.
- [ ] `/api/export` and `/api/account/delete` fully cover user data.
