# Cognitive Layer Audit (roadmap #16 · phase 1: map, don't move)

**Question:** of the ~979 files in `lib/`, which actually power the product a
customer pays for — and which are experimental cognition that should be
archived?

## Wired (the revenue path · KEEP ACTIVE)

| Cluster | Files (representative) | Consumed by |
|---|---|---|
| MVP product | `mvpBrandInputMemory` · `mvpGenerationMemory` · `mvpSelectionMemory` · `mvpGenerationEngine` · `mvpLlmProvider` · `mvpLearning` · `mvpQualityScore` · `mvpPlans` · `mvpErrorLogMemory` · `mvpWaitlistMemory` | `/api/mvp/*` · onboard/generating/review/library/share pages |
| Vertical intelligence | `verticalIntelligence/*` (5 files · 15-vertical corpus) | the generator · onboarding detection |
| LLM adapters | `mvpOpenaiAdapter` · `mvpAnthropicAdapter` | `mvpGenerate()` dispatch |
| Auth + tenancy | `auth/*` · `tenancy/*` | every route |
| Media payload builders | `providers/*` (11 adapters · pure transforms, no API calls) | image-prompt export (#29 partial) · future image wiring |

## Unwired (observational cognition · CANDIDATES FOR `legacy/`)

The large remainder — the cognitive/civilization/identity/aesthetic engine
families (`cognitive*`, `identity*`, `aesthetic*`, `action*`, `adaptive*`,
`reality*`, `civilization*`, and their memories/views) — are exercised only by
their own `scripts/test-*` harnesses and the observational API routes. None
sit on the request path of the MVP product.

**They are not junk.** They are prior research strata: several concepts were
already re-expressed at product altitude (world-model thinking → vertical
intelligence · learning loops → `mvpLearning` · governance → operator
supervision). The archive preserves them as a source of future extraction.

## Decision & phased plan

1. **Phase 1 (this document):** map wired vs unwired. No file moves — moving
   ~900 files churns imports in `verify-system-stability` (37 observational
   libs are explicitly audited) and risks the green build for zero customer
   value this week.
2. **Phase 2 (a dedicated pass):** move unwired clusters to `legacy/lib/`,
   update the stability verifier's `OBSERVATIONAL_LIBS` paths, keep their
   test scripts under `legacy/scripts/`. Acceptance: build + all verifiers
   green, `lib/` under ~80 files.
3. **Never:** delete. The strata document how the system learned to think.
