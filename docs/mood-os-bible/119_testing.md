# 119 — Testing

> How MOOD proves it works and stays kind: unit, integration, E2E, offline/sync, RLS, RTL/a11y, and an automated tone suite that fails the build on banned language.

## Purpose
This chapter defines the test strategy that keeps MOOD both correct and on-tone. Beyond normal engineering coverage, MOOD has a unique obligation: automated proof that the product never shames, scores, streaks, or diagnoses. Tone is a testable requirement here, not a hope.

## User Experience
Tests are invisible to the user but protect their experience: the daily loop always completes, offline always works, Hebrew always renders RTL, and no reflection or challenge ever contains judging language. A failing tone test blocks release just like a failing unit test.

## Game Mechanic
Test layers:
- **Unit** (Vitest): stores (`useLoopStore`, `useHumanMapStore`), soft-signal math (Trait decay/confidence), Copy Linter, merge (LWW).
- **Integration**: Route Handlers with mocked Claude/Grok; guardrail middleware; sync push/pull.
- **E2E** (Playwright): full Core Loop across Volume 09 screens — Discovery → Today → Challenge → Evening → Library → Patterns → Ripple.
- **Offline/PWA**: run E2E with network disabled; verify loop completes and outbox drains on reconnect.
- **Sync/conflict**: two-client field-level LWW; tombstone deletes; anon→email migration.
- **Security/RLS**: attempt cross-user reads → must fail; verify `/api/ripple` exposes no identifiers.
- **RTL/a11y**: dir=rtl snapshots, logical-property checks, long-Hebrew overflow, focus order, reduced-motion, contrast.
- **Tone suite (build-blocking)**: golden set of generated + fixture copy asserted against the banned-token list and never-diagnose rules; fixtures ensure no `streak/score/xp/level/fail/shame/diagnose` appears in code or copy.

## Screens Needed
All Volume 09 screens are covered by E2E: Splash, Onboarding, Discovery Flow, Today / Daily Moment, Challenge Selection, Evening Check-in, Living Library, Moment Detail, Patterns, Shared Humanity, Settings, Privacy, Accessibility.

## Visual Assets Needed
- Test fixtures include sample assets; a **no-text asset test** runs the OCR/vision validator to assert `hasText:false`. No text baked into any image.

## AI Logic
AI is tested with deterministic mocks for logic paths, plus a periodic **live guardrail eval**: sample real Claude outputs and assert they pass Tone Guardrails + Copy Linter and never diagnose. Fallback-copy paths tested by forcing timeouts/429s. Grok validator tested against text-containing images (must reject).

## Data Stored
Tests exercise the full shared model (Ch. 113) via fixtures and a seeded local DB. Schema tests assert **no score/streak/xp/level field exists** and that `Attempt.status ∈ {pending,tried,not_tried}`.

## Edge Cases
- First run empty states render (no data ≠ error).
- Skipped days produce no penalty copy (asserted).
- Offline write → reconnect → merge correctness.
- `safetyFlag` path halts escalation and shows support copy.
- RTL long-text and truncation.

## Build Requirements
- Vitest + Playwright + testing-library; Supabase local (RLS) test harness.
- Copy Linter test API; banned-word fixtures; live guardrail eval job.
- No-text asset validator in CI; axe-core a11y checks.
- CI gates on all suites; tone + RLS suites are blocking.
- Effort: M.

## Definition of Done
- [ ] Full Core Loop passes E2E online and offline.
- [ ] Tone suite fails the build on any banned word or diagnosis.
- [ ] RLS tests prove no cross-user access.
- [ ] Schema test confirms no score/streak/xp/level fields.
- [ ] RTL + a11y checks pass on every screen.
