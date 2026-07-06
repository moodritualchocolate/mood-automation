# 120 — Release

> How MOOD ships: PWA-first delivery, tone-and-privacy release gates, staged rollout, and calm, silent updates that never interrupt the daily ritual.

## Purpose
This chapter defines how MOOD goes from a merged commit to a person's phone. It exists to make releases boring and safe: every build must pass tone, privacy, and offline gates before it ships, and updates must never disrupt the once-a-day ritual or a user's local data. Release is the last guardian of the core promise.

## User Experience
The user just keeps opening MOOD each day; new versions arrive silently. A finished new version activates on next launch — never mid-ritual. Nothing about their Living Library, Journal, or offline state is lost across updates. There is no "what's new" nag, no forced login, no reset.

## Game Mechanic
Pipeline (CI/CD):
1. **PR gates** — lint, typecheck, unit/integration, **tone suite**, **RLS suite**, a11y, no-text asset check. Any failure blocks merge.
2. **Preview deploy** — per-PR preview (Vercel) with a disposable Supabase branch for QA.
3. **Main → staging** — E2E (online + offline) + sync/conflict + live guardrail eval on staging.
4. **Production** — build the Next.js app; deploy; publish updated Service Worker + manifest (PWA). DB changes go through forward-only, reversible **Supabase migrations** applied before app rollout.
5. **Staged rollout** — percentage rollout; watch fallback-copy rate, sync error rate, crash rate; auto-halt on regression.
6. **Rollback** — instant revert to prior deploy; migrations written to be backward-compatible with the previous app version.

Versioning: semver app + `engineVersion` on AI outputs so copy is traceable.

## Screens Needed
- Splash (Service Worker update-on-next-launch)
- Settings (version, "up to date")

Release is otherwise screenless.

## Visual Assets Needed
- New/updated Grok assets published to Storage and cache-busted by content hash before rollout. No text baked into any image.

## AI Logic
Each release pins the Claude model (`claude-opus-4-8`) and prompt/`engineVersion`. A pre-release **guardrail eval** samples live generations to confirm they pass Tone Guardrails + Copy Linter and never diagnose. Fallback copy bundle is versioned with the app so offline users always have on-tone text.

## Data Stored
No new user data at release; migrations only evolve the shared schema (Ch. 113) forward-only and reversibly. IndexedDB schema version bumps include a local migration that preserves Journal + Library + HumanMap.

## Edge Cases
- Update lands mid-session: activate on next launch, never interrupt the ritual.
- Old client vs new schema: backward-compatible migrations + tolerant sync.
- Failed migration: halt rollout, auto-rollback.
- Offline user on old version: keeps working; syncs when updated.
- Asset cache staleness: content-hash cache-busting.

## Build Requirements
- CI/CD with blocking tone + RLS + offline E2E gates.
- Vercel deploys + Supabase migration runner; staged rollout + metrics + auto-halt.
- Service Worker update flow (skipWaiting on next launch, not mid-session).
- Versioned fallback copy + `engineVersion` tracking.
- Effort: M.

## Definition of Done
- [ ] No build ships without passing tone, privacy/RLS, and offline gates.
- [ ] Updates never interrupt an in-progress ritual or lose local data.
- [ ] Migrations are forward-only, reversible, and pre-applied.
- [ ] Staged rollout auto-halts on fallback/sync/crash regression.
- [ ] Rollback restores the prior version instantly.
