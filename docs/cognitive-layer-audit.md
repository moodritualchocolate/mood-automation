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
2. **Phase 2 — ✅ DONE (this pass):** unwired clusters moved to `legacy/`
   (`lib/` 1003 · `app/` 134 · `scripts/` 105 · `src/` 35 · `data/*.ts` 5),
   `legacy/` excluded from `tsconfig`, and `verify-system-stability` archived
   with its cohort under `legacy/scripts/`. **Result: `lib/` 1034 → 31 files**
   (target < 80), zero import leaks, and build + both CI verifiers green
   (typecheck clean · build ✓ · vertical-intelligence 120/120 ·
   real-LLM 42/42). Full map + restore steps: [`legacy/README.md`](../legacy/README.md).
3. **Never:** delete. The strata document how the system learned to think.

**Method:** a static import-closure from the wired product surface (product
pages + `app/api/mvp/*` + the two CI verifier scripts) determined exactly which
files stay; everything outside the closure was archived. The closure proved
zero kept→archived import leaks before any file moved, which is why the build
stayed green.
