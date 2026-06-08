# Real-LLM Generator · Implementation Report

**Status:** OpenAI adapter wired behind `mvpGenerate()`. Stub-mode verifier 42/42 PASS. LIVE-mode gates are armed (≥ 40/60 average, no vertical below 30/60, code-switch = 0) — they will run automatically when `OPENAI_API_KEY` is present in the environment.

**Source designs:** `docs/vertical-intelligence-engine.md` · `docs/vertical-intelligence-implementation-report.md`.
**Previous baseline (corpus only):** 32.4 / 60 average · 0 code-switch · all 10 verticals ≥ 30/60.

---

## 1 · What was built

| Path | Purpose |
|---|---|
| `lib/mvpOpenaiAdapter.ts` | OpenAI client wrapper · prompt builder consuming the existing `GenerationContext` · strict JSON-schema response · validator + retry-once · graceful failure (returns `null` + diagnostics, never throws). |
| `lib/mvpLlmProvider.ts` (rewired) | `activeProvider()` already returned `'openai'` whenever `OPENAI_API_KEY` was set. The dispatch was a no-op; now it actually calls `openaiGenerate(ctx, input)`. On any failure (network, JSON parse, validation x 2), the same `mvpGenerate()` call returns a corpus-built kit — UI sees no difference. |
| `scripts/verify-real-llm-generator.ts` | Dual-mode verifier. Stub mode runs without keys; live mode runs the LLM end-to-end across the 10 verticals and gates on the directive's quality thresholds. |
| `docs/real-llm-generator-report.md` (this file) | Implementation summary, cost estimate, failure modes. |

No UI, Stripe, auth, or tenancy changes (per directive).

---

## 2 · Architecture · same boundary, deeper guard

```
mvpGenerate(input)
    │
    ├── resolveVerticalContext()        [unchanged · keyword scan + locale + audience]
    │
    ├── assembleGenerationContext()     [unchanged · pulls locale-pure vocab/pains/moments/CTAs]
    │
    ├─ if (process.env.OPENAI_API_KEY)
    │       │
    │       └── openaiGenerate(ctx, input)
    │               │
    │               ├─ buildSystemPrompt(ctx)
    │               │     · senior-CD role for ctx.vertical.displayName
    │               │     · binding locale: hebrew-only OR english-only
    │               │     · required vocabulary list (≥ 6 of 10 hooks must include)
    │               │     · forbidden vocabulary list (zero tolerance)
    │               │     · cross-vertical forbidden list (e.g., MOOD canon in HVAC)
    │               │     · customer pains/desires/moments/trust-signals/CTAs
    │               │     · proven hook families with worked examples
    │               │     · legal + regulatory sensitivity flags
    │               │
    │               ├─ buildUserPrompt(ctx, input)
    │               │     · 4 operator inputs as a brief
    │               │     · "produce JSON matching the schema"
    │               │     · on retry: previous validation failures fed back as feedback
    │               │
    │               ├─ openai.chat.completions.create({
    │               │       model: gpt-4.1-mini,
    │               │       response_format: { type: 'json_schema', strict: true, schema },
    │               │       temperature: 0.7
    │               │   })
    │               │
    │               ├─ validateLlmPayload(payload, ctx)
    │               │     · hook-count == 10
    │               │     · locale-purity on consumer-facing strings
    │               │     · forbidden-vocabulary (word-boundary)
    │               │     · cross-vertical-leakage
    │               │     · vertical-keyword-density ≥ 60%
    │               │     · risky-claim guard (guaranteed/cure/zero-risk · מובטח/ריפוי)
    │               │     · generic-template guard (prior chocolate stub tells)
    │               │
    │               ├─ if !ok and attempts < 2: retry with failure feedback
    │               │
    │               └─ return outcome { result | null, attempts, fellBackToCorpus, fallbackReason }
    │
    └─ if no key OR LLM outcome was null:
            pickFromCorpus() — the V2 path that delivers 32.4/60 alone
```

The validation guard wraps the LLM output exactly the same way it wraps the corpus output. Anything the LLM produces that violates a vertical contract is either re-prompted away or replaced by a safe corpus selection. There is no path where unvalidated LLM text reaches the UI.

---

## 3 · Configuration

| Env var | Required | Default | Effect |
|---|---|---|---|
| `OPENAI_API_KEY` | when LIVE | — | Presence switches `activeProvider()` from `stub` to `openai`. Absence keeps the corpus path. |
| `OPENAI_MODEL` | no | `gpt-4.1-mini` | Override the model. Any structured-output-capable Chat Completions model works (`gpt-4o-mini`, `gpt-4.1-mini`, `gpt-4o`, etc.). |
| `OPENAI_TIMEOUT_MS` | no | `60000` | Per-request timeout. Used by both attempts of the retry. |
| `ANTHROPIC_API_KEY` | no | — | Declared in `activeProvider()` for future symmetry; Anthropic adapter not implemented yet (directive said "optional fallback only if already simple" — it isn't, so it's deferred). |

No keys are read outside `lib/mvpOpenaiAdapter.ts` / `activeProvider()`. The route layer (`app/api/mvp/*`) is unchanged.

---

## 4 · Before / after

### Run record · stub mode (this environment · no API key)

```
$ npx tsx scripts/verify-real-llm-generator.ts
Active provider: stub
Mode: STUB (corpus fallback)
Model: gpt-4.1-mini (default)

  real-estate     net= 30.9  density= 60%  cs=0  dur=…ms
  accountant      net= 32.6  density= 70%  cs=0
  lawyer          net= 31.3  density=100%  cs=0
  fitness         net= 33.1  density= 60%  cs=0
  restaurant      net= 33.6  density= 90%  cs=0
  saas            net= 30.4  density= 80%  cs=0
  hvac            net= 32.1  density= 75%  cs=0
  jewelry         net= 33.4  density=100%  cs=0
  cosmetics       net= 32.0  density= 63%  cs=0
  chocolate       net= 34.8  density= 88%  cs=0

PASSED: 42    FAILED: 0
VERIFY PASSED · stub-mode baseline intact (LIVE mode skipped · set OPENAI_API_KEY to run it).
```

### Smoke test · fallback path (placeholder key · network blocked)

With `OPENAI_API_KEY=sk-fake` and the sandbox's default network policy denying egress, the adapter:

```
Active provider: openai
providerId: stub               ← what was actually used
hooks count: 8
llmDiagnostics: {
  "fellBack": true,
  "fallbackReason": "call-error · 403 Host not in allowlist",
  "attempts": 2                ← 2 retry attempts before giving up
}
```

The user still gets a valid 2/8/3/9 kit from corpus selection · the UI is never empty.

### LIVE mode (expected · gated on operator's `OPENAI_API_KEY`)

The LIVE-mode gates encoded in `scripts/verify-real-llm-generator.ts`:

| Gate | Target | Source |
|---|---|---|
| `overall-net-quality ≥ 40` | ≥ 40 / 60 | directive |
| `no-vertical-below-30` | min ≥ 30 / 60 | directive |
| `code-switch-total = 0` | 0 | directive |
| `locale-purity` per vertical | all consumer-facing strings | directive |
| `cross-vertical-leakage` per vertical | 0 | directive |
| `vertical-keyword-density ≥ 60%` per vertical | 0.60 | directive |
| `output-shape` per vertical | ≥ 2/8/3/6 | implementation floor |

`docs/vertical-intelligence-engine.md` § 5 predicted **42-50 / 60 with LLM + vertical intelligence**. The corpus alone delivers 32.4. The LLM is expected to close the rest — but the actual live number depends on model + operator. Verifier is the source of truth.

I could not execute LIVE mode in this sandbox (network policy denies `api.openai.com`; the smoke test above demonstrates the 403). The operator must run `OPENAI_API_KEY=… npx tsx scripts/verify-real-llm-generator.ts` in an environment with network egress to confirm the headline number.

---

## 5 · Cost estimate

Prompt size: system ≈ 1,800 tokens (vocab + pains + moments + hook examples for one vertical) · user ≈ 200 tokens (brand brief). Response: 10 hooks × ~60 tokens + 5 UGC × ~120 tokens + 10 image concepts × ~80 tokens + envelope ≈ 1,800-2,200 tokens. Round numbers:

| Model | Input list price | Output list price | One generation cost | Notes |
|---|---|---|---|---|
| `gpt-4.1-mini` (default) | $0.40 / 1M | $1.60 / 1M | **≈ $0.0041** | best balance · default |
| `gpt-4o-mini` | $0.15 / 1M | $0.60 / 1M | **≈ $0.0015** | cheapest passable structured-output · set `OPENAI_MODEL=gpt-4o-mini` |
| `gpt-4o` | $2.50 / 1M | $10.00 / 1M | **≈ $0.025** | quality ceiling if needed · 6× the cost |
| `gpt-4.1` | $2.00 / 1M | $8.00 / 1M | **≈ $0.020** | similar |

At V1 prices (operator pays $79-99/kit per `docs/mvp-launch-plan.md`), an LLM cost of $0.004-0.005 per generation is **0.005-0.006% of revenue per unit**. Even with a 50% retry rate, COGS stays under $0.01/kit.

Retry budget: the validator triggers a retry at most once per generation. Worst-case cost is 2× the single-call cost (≈ $0.008 on `gpt-4.1-mini`). The retry rate in LIVE will be visible in `llmDiagnostics.attempts` per kit.

---

## 6 · Latency budget

Per-call latency for `gpt-4.1-mini` with ~2k input + ~2k output tokens via Chat Completions structured-output is typically **6-14 seconds**. A retry doubles to 12-28 seconds worst case. The existing flow (`/api/mvp/generate` → poll status → `/library`) was designed around this: generation runs server-side and the UI polls. Nothing in the polling UI needs to change.

If you wire OpenAI Streaming later, perceived latency drops to first-token (~800ms). Not in scope for this turn.

---

## 7 · Failure modes (and how they're handled)

| Failure mode | Handling | Visibility |
|---|---|---|
| `OPENAI_API_KEY` not set | `activeProvider()` returns `stub` · corpus path runs | normal operation |
| Network egress blocked (sandbox / CI without OpenAI access) | `call-error · 403/connection refused` on attempt 1 · same on attempt 2 · corpus fallback · UI gets a kit | `llmDiagnostics.fallbackReason` |
| Invalid `OPENAI_API_KEY` | `401 Unauthorized` on both attempts · corpus fallback · UI gets a kit | `llmDiagnostics.fallbackReason` |
| Model returns malformed JSON (rare with `strict: true`) | `json-parse` failure recorded · retry · if still bad, corpus fallback | `llmDiagnostics.validationFailuresPerAttempt[i]` |
| Model produces Hebrew text in English locale (or vice-versa) | `validateLocalePurity` flags · retry with feedback · if still bad, corpus fallback | diagnostics |
| Model uses a forbidden phrase ("guaranteed", "מובטח", "free forever") | `forbidden-vocabulary` + `risky-claim` flags · retry with feedback · fallback | diagnostics |
| Model leaks MOOD canon into HVAC (or any cross-vertical leak) | `cross-vertical-leakage` flags · retry · fallback | diagnostics |
| Model returns < 60% vertical-keyword density | `vertical-keyword-density` flags · retry · fallback | diagnostics |
| Model returns fewer than 10 hooks | schema's `minItems: 10` rejects · OpenAI retries internally; if still wrong on `strict` mode it errors · corpus fallback | diagnostics |
| Rate-limit (429) | OpenAI SDK retries with backoff internally · if exhausted, `call-error · rate_limited` · corpus fallback | diagnostics |
| Timeout (default 60s) | `call-error · request timed out` · corpus fallback | diagnostics |

In every failure mode the user receives a complete, valid, locale-pure kit from the corpus. The `providerId` field reflects what was actually used (`'openai'` if the LLM succeeded, `'stub'` if corpus was used). The optional `llmDiagnostics` field carries the full failure trace for operator visibility (operators can wire this into a UI badge if/when they want).

---

## 8 · What this does NOT do (honest scope)

- **Anthropic adapter** — declared in `activeProvider()` but not implemented. The directive said "optional fallback only if already simple"; the Anthropic SDK has different structured-output ergonomics (tool-use w/ output schema vs `json_schema`) and would add ~300 LOC. Deferred. The single-provider path is sufficient for shipping.
- **Streaming** — the SDK call is non-streaming. First-token UX optimization is a follow-up.
- **Function-calling / tool use** — not used. Strict JSON schema response is sufficient.
- **Per-customer fine-tuning** — out of scope; the vertical knowledge base is the differentiation moat (per `docs/vertical-intelligence-engine.md` § 6).
- **Live-mode net-quality measurement** — the gate is encoded but I could not run it from this sandbox (network policy). The operator runs it once with their own key to confirm the ≥40 threshold lands; the report is updated when that number is known.

---

## 9 · Is the product sellable?

**Stub mode (no API key):** 32.4/60 average across 10 verticals · 0 code-switch · all verticals ≥ 30 · output is industry-native at the corpus's level of detail. **Sellable** as a $79-99 self-serve kit, with the customer understanding the output is selected from a library, not freshly written.

**Live mode (with `OPENAI_API_KEY`):** the architecture is in place to clear 40/60 — the corpus floor (32.4) plus the LLM headroom (the predicted 8-12 points of creative inflection) lands in the 40-50 band. **Sellable at the higher price tier** ($249+ kits in `docs/mvp-launch-plan.md`) once the operator confirms the live number with their own key.

**Single remaining checkpoint before commercial launch:** the operator must run `OPENAI_API_KEY=… npx tsx scripts/verify-real-llm-generator.ts` once and confirm:

```
PASS  overall-net-quality ≥ 40       … / 60
PASS  no-vertical-below-30           min … (worst-vertical-id)
PASS  code-switch-total              0
```

If the verifier prints those three PASSes, the product is shippable. If the LLM still produces a sub-40 average with all the vertical-context fed in, the next investment is more depth per vertical (more hook templates, sharper audience archetypes, more proof-type examples) — not a different LLM. The corpus is the moat; the LLM is the rented engine.

---

## 10 · Full verifier suite · current state

| Verifier | Result | Notes |
|---|---|---|
| `npm run typecheck` | clean | strict TypeScript |
| `npm run build` | clean | 21 routes static · 0 build errors |
| `scripts/verify-vertical-intelligence.ts` | 80/80 PASS | corpus-layer behavioural gates |
| `scripts/verify-output-quality.ts` | 32.42 / 60 avg · 0 code-switch | informational (not a gate) |
| `scripts/verify-real-llm-generator.ts` (stub) | 42/42 PASS | stub-mode baseline + LIVE-mode gates armed |
| `scripts/verify-real-llm-generator.ts` (live) | armed · runs only with `OPENAI_API_KEY` | operator confirms the 40+ landing |
| `scripts/verify-system-stability.ts` | 12/12 PASS | unchanged · no regressions |

---

## 11 · Recommendation

Ship the corpus path as the V1 commercial product at $79-99 per kit. Set `OPENAI_API_KEY` in the production environment **only after** the operator personally runs `verify-real-llm-generator.ts` in LIVE mode and confirms the three quality gates pass. Hold the higher-tier kit ($249+) until that confirmation lands.

Do not start Stripe integration until the LIVE verifier prints `PASSED: X    FAILED: 0` with the 40+ threshold met. That was the exit gate the directive specified, and it should stay binding.
