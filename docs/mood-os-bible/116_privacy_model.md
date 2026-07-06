# 116 — Privacy Model

> A person's inner life is theirs: local-first by default, anonymous by default, exportable and deletable on demand, and never mined, ranked, or sold.

## Purpose
This chapter defines how MOOD treats the most intimate data a product can hold — someone's fears, courage, and daily reflections. It exists to make privacy a structural guarantee, not a policy paragraph: the default is that data never leaves the device, identity is optional, and the user can take everything and leave at any time.

## User Experience
On the **Privacy** screen the user sees plain-language controls: "Your MOOD lives on this device" with a sync toggle (off by default), "Export everything" (one tap → JSON download), and "Delete everything" (local + cloud). No email is required to play. There are no profiles, no public presence, no likes, no comparison — **Shared Humanity** shows only anonymous aggregates ("8,412 people also chose a small act of courage today"), never a person.

## Game Mechanic
Privacy tiers:
1. **Default (local-only)**: all data in IndexedDB; zero personal data on any server. Only anonymous `/api/ripple` reads and stateless AI calls occur — and AI calls carry only the minimal context needed to generate copy, never stored against identity.
2. **Sync on (linked)**: data mirrors to Supabase under an anonymous or email-linked `user_id`, protected by RLS so only that user can read their rows.
3. **Aggregate (Ripple)**: counts computed server-side with no `user_id`, k-anonymity threshold before any stat is shown.

Rights: **export** (`/api/export`, full JSON), **delete** (`/api/account/delete`, removes rows + Storage), **revoke sync** (stops mirroring, keeps local).

## Screens Needed
- Privacy (controls, export, delete)
- Settings (sync toggle, account link)
- Shared Humanity (proves anonymity)

## Visual Assets Needed
- Social/Share assets are generic and human, never containing a user's data or any text baked into the image. Shared artifacts render app text over neutral artwork.

## AI Logic
Claude receives only the minimal `HumanMap`/recent-`Attempt` context required to write today's Hebrew copy; prompts are not persisted tied to identity beyond regeneration needs (Ch. 118). AI **never diagnoses, labels, profiles, or infers protected attributes**. The Copy Linter blocks clinical/diagnostic framing. Ripple involves no per-user AI.

## Data Stored
Sensitive entities: `JournalEntry`, `Trait`, `Pattern`, `Attempt`. All local-first; mirrored only when sync is on, always under RLS. `RippleStat` holds no identifiers. `safetyFlag` stays on-device unless sync is enabled, and even then is never shared to any aggregate.

## Edge Cases
- First run: no identifiers created; anonymous local `User.id` only.
- Distress signal: handled with support copy (Ch. 118 / User Safety), never surfaced publicly, never used for targeting.
- Delete-all: idempotent, removes cloud rows + Storage + tombstones local.
- Child/sensitive content: no third-party analytics on Journal text.
- Export while offline: exports local snapshot directly.

## Build Requirements
- RLS on every user table (Ch. 113); anon Auth by default.
- `/api/export`, `/api/account/delete` covering all entities + Storage.
- k-anonymity guard on Ripple aggregation (suppress stats below threshold).
- No third-party analytics SDK on sensitive screens; minimal, self-hosted telemetry only if any.
- Effort: M.

## Definition of Done
- [ ] App is fully usable with zero personal data leaving the device.
- [ ] Sync is opt-in and off by default.
- [ ] Export returns complete user data; delete removes rows + Storage.
- [ ] Ripple exposes no identifiers and suppresses sub-threshold stats.
- [ ] No diagnosis, profiling, or protected-attribute inference anywhere.
