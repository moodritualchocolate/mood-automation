# legacy/ — archived cognition (roadmap #16 · phase 2)

This directory holds the **unwired research strata** — engines, memories,
views, observational API routes, their test harnesses, the old `src/` engine
tree, and research data — that were **not on the request path of the paying
MVP product**. They were moved here (not deleted) so the active surface is
small, the build is fast, and the research is preserved for future extraction.

> **Nothing here is junk.** Several ideas were already re-expressed at product
> altitude (world-model thinking → vertical intelligence · learning loops →
> `mvpLearning` · governance → operator supervision). This is where the system
> learned to think; it stays as a source of future work (e.g. #29 image
> wiring pulls `legacy/lib/providers/*` back).

## What moved

| From | To | Count |
|---|---|---|
| `lib/**` (unwired engines/memories/views) | `legacy/lib/**` | 1003 |
| `app/**` (observational pages + ~90 API routes + panels) | `legacy/app/**` | 134 |
| `scripts/**` (verify-*/test-* for the above, incl. `verify-system-stability`) | `legacy/scripts/**` | 105 |
| `src/**` (old engine/cognition tree) | `legacy/src/**` | 35 |
| `data/*.ts` (research seed data) | `legacy/data/**` | 5 |

Paths were preserved under `legacy/` so relative imports inside the moved
subtrees stay valid.

## What stayed active (the revenue path)

- **lib/** (31 files): `mvp*` · `verticalIntelligence/*` · `auth/*` ·
  `tenancy/*` · `productization/designSystem`
- **app/**: product pages `onboard · generating · review · library ·
  share · login · register · account`, shared UI in `app/components/ui` +
  `AuthProvider`, and the wired API under `app/api/mvp/*`
- **scripts/**: the CI verifiers (`verify-vertical-intelligence`,
  `verify-real-llm-generator`) + `diagnose-openai`

`legacy/` is excluded from `tsconfig.json`, so it is never typechecked or
built. No active file imports anything under `legacy/` (verified: zero leaks).

## Restoring something

1. `git mv legacy/lib/<file> lib/<file>` (or the app/scripts equivalent).
2. Fix its imports if it referenced other still-archived modules.
3. Re-run: `npm run typecheck && npm run build && npx tsx scripts/verify-vertical-intelligence.ts`.

Acceptance for this pass — **met**: build + CI verifiers green · `lib/` at 31
files (target < 80) · nothing deleted.
