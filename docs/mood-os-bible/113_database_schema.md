# 113 — Database Schema

> The concrete shared data model — TypeScript interfaces mirrored to Postgres — with soft-signal traits, no scores, RLS, and a local-first mirror.

## Purpose
This chapter is the single source of truth for MOOD's data shapes. Every store, endpoint, and AI engine reads and writes these entities. It exists so the whole studio uses identical field names and so the model itself embodies the tone rules: there is no `streak`, `score`, `xp`, `level`, or `outcome_success` field anywhere. Progress is only ever library growth, reflections, patterns, chapters, rare moments, and courage history.

## User Experience
Invisible, but shaped by these choices: because `Trait` carries a soft 0–1 signal with confidence and decay (never a label), the user is *noticed*, never *diagnosed*. Because `Attempt.status` records `tried | not_tried` (never pass/fail), success is always the attempt.

## Game Mechanic
Core TypeScript interfaces (Postgres columns mirror these; `snake_case` in SQL):

```ts
interface User { id: string; createdAt: string; locale: 'he'; syncEnabled: boolean; authProvider: 'anonymous'|'email'|'oauth'; }

interface HumanMap { id: string; userId: string; updatedAt: string; } // container; traits below

interface Trait {
  id: string; humanMapId: string;
  domain: 'strength'|'growth'|'fear'|'social_courage'|'energy'|'emotional_pref'|'challenge_readiness'|'comfort_zone';
  key: string;               // e.g. 'quiet_courage'
  signal: number;            // soft 0..1 — NEVER a hard label
  confidence: number;        // 0..1
  decay: number;             // 0..1 per week
  updatedAt: string;
}

interface MomentTemplate { id: string; titleHe: string; themeKey: string; assetId: string; invitationHe?: string; active: boolean; }
interface Moment { id: string; templateId: string; titleHe: string; reflectionId?: string; assetId: string; createdAt: string; }
interface DailyMoment { id: string; userId: string; momentId: string; date: string; challengeId?: string; seenAt?: string; }

interface Challenge { id: string; dailyMomentId: string; }
interface ChallengeLevel { id: string; challengeId: string; level: 'easy'|'medium'|'brave'; promptHe: string; }
interface Attempt {
  id: string; userId: string; challengeLevelId: string;
  status: 'pending'|'tried'|'not_tried';   // success = tried; NO pass/fail
  chosenAt: string; resolvedAt?: string;
}

interface JournalEntry { id: string; userId: string; attemptId?: string; dailyMomentId: string; bodyHe: string; feltHe?: string; learnedHe?: string; wantAgain?: boolean; safetyFlag: boolean; createdAt: string; }
interface Reflection { id: string; momentId: string; bodyHe: string; engineVersion: string; createdAt: string; }
interface LibraryItem { id: string; userId: string; momentId: string; savedAt: string; }
interface Pattern { id: string; userId: string; kind: string; signal: number; confidence: number; summaryHe: string; windowStart: string; windowEnd: string; }
interface RareMoment { id: string; userId: string; momentId: string; rarityKey: string; unlockedAt: string; }
interface Chapter { id: string; userId: string; period: 'week'|'month'|'year'; titleHe: string; summaryHe: string; start: string; end: string; }
interface RippleStat { id: string; date: string; metricKey: string; count: number; } // anonymous aggregate, no userId
interface Asset { id: string; category: 'masterpiece'|'moment'|'people'|'home'|'object'|'light'|'texture'|'social'|'video_keyframe'; storagePath: string; width: number; height: number; hasText: false; }
```

Relationships: `User 1—1 HumanMap 1—N Trait`; `User 1—N DailyMoment N—1 Moment N—1 MomentTemplate`; `DailyMoment 1—1 Challenge 1—N ChallengeLevel 1—N Attempt`; `Attempt 1—1 JournalEntry`; `Moment 1—1 Reflection`, `1—1 Asset`; `User 1—N LibraryItem/Pattern/RareMoment/Chapter`; `RippleStat` is global/anonymous.

## Screens Needed
Not a screen; consumed by all Volume 09 screens.

## Visual Assets Needed
`Asset` rows point to Grok output in Storage. `hasText` is always `false` — enforced at ingest.

## AI Logic
`Reflection`, `ChallengeLevel.promptHe`, and `Pattern.summaryHe` are Claude-generated Hebrew, guardrail-checked. `Trait.signal`/`Pattern.signal` are soft floats, never labels.

## Data Stored
This IS the data. Postgres tables per interface; enums for `domain`, `level`, `status`, `category`.

## Edge Cases
- No `streak/score/xp` columns exist — schema-level tone enforcement.
- `safetyFlag=true` freezes challenge escalation (Ch. 118).
- Anonymous user rows migrate on auth upgrade.

**RLS notes:** every user table has `user_id`; policy `user_id = auth.uid()` for select/insert/update/delete. `MomentTemplate`/`Asset` are read-only shared. `RippleStat` is read-only aggregate, no `user_id`, exposed via a view.

**Local-first mirror:** IndexedDB holds one object store per entity keyed by `id`, plus a `syncMeta` store (`updatedAt`, `dirty`, `deleted`) driving the outbox (Ch. 115).

## Build Requirements
- SQL migrations + RLS policies; zod schemas shared client/server.
- IndexedDB schema mirroring tables 1:1.
- Effort: L.

## Definition of Done
- [ ] No score/streak/xp/level/outcome field exists in any table.
- [ ] `Trait` and `Pattern` store soft floats + confidence + decay.
- [ ] `Attempt.status` limited to `pending|tried|not_tried`.
- [ ] RLS verified: no cross-user access.
- [ ] IndexedDB schema matches Postgres 1:1.
