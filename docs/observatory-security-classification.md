# Observatory Security Classification — Phase 2

**Status:** Read-only audit. No code changes in this phase.
**Scope:** 28 observatory GET endpoints currently unauthenticated.
**Repo state at audit:** branch `claude/mood-creative-os-v1-i4Mfv`, after Phase 1.

After Phase 1, the production API surface is split into three groups:

| Group | Count | Protection |
|---|---|---|
| Auth surface (login/register/logout/me/bootstrap) | 5 | Public by design |
| Tenant-data routes | 48 GET + 46 POST | `requireTenantSession` / `requireSession` |
| **Observatory descriptors (this audit)** | **28 GET** | **Currently public** |

This document classifies each of the 28 observatory endpoints by:

1. **Payload type** — what data is returned
2. **Risk level** — LOW / MEDIUM / HIGH
3. **Recommended protection** — SAFE PUBLIC / REQUIRES SESSION / REQUIRES TENANT SESSION

---

## Classification framework

| Classification | Criteria | Failure cost |
|---|---|---|
| **SAFE PUBLIC** | Pure static metadata, system health, no operator/tenant/business data, no PII | None |
| **REQUIRES SESSION** | Operator-derived signals, system diagnostics, business intelligence aggregates, audit trails — but NOT tenant-scoped per-record data | Leaks operator behavior and strategic posture to anonymous viewers; no direct PII |
| **REQUIRES TENANT SESSION** | Reads from tenant-scoped memory stores (Campaign / Brand / Product / Publication / Asset / Customer Journey records) | Cross-tenant data exposure |

**Risk level** is independent of recommended protection — it ranks the severity of the data exposure if the endpoint were called by an unauthenticated attacker.

---

## Per-endpoint classification

### 1. `/api/adaptation-orchestrator` — REQUIRES SESSION (MEDIUM)

- **Reads:** `creativeDriftMemory`, `visualDNAMemory`, `narrativeDNAMemory`, `adStrategyMemory`, `copywriterMemory`
- **Returns:** Composed orchestration + system energy + adaptive cadence — internal cognitive system metrics: trust debt, fatigue, originality pressure, collapse risk, overload risk.
- **Payload type:** System diagnostic / strategic posture
- **Why protected:** Reveals proprietary cognitive system state and strategic creative direction; no PII but discloses creative-system internal health.
- **Recommended:** `requireSession`

### 2. `/api/branch-activation` (GET) — REQUIRES SESSION (HIGH)

- **Reads:** `branchActivationMemory`
- **Returns:** Longitudinal view of operator decisions — each record contains `operatorId`, `branchName`, `counterfactualType`, predicted impacts, measured deltas, resolution status.
- **Payload type:** **Operator audit trail**
- **Why protected:** Direct disclosure of operator identifiers and decision history; this IS the operator's strategic log.
- **Recommended:** `requireSession` (matches existing POST protection on this route)

### 3. `/api/cognitive-weight` — REQUIRES SESSION (MEDIUM)

- **Reads:** `cognitiveWeightMemory`, `conflictMemory`, `culturalPerceptionMemory`, `adStrategyMemory`, `copywriterMemory`, `copyQualityMemory`, policy audit
- **Returns:** Cognitive weight evolution longitudinal view — internal weight-distribution signals across the system's "brains".
- **Payload type:** Internal system intelligence
- **Why protected:** Strategic posture; reveals which creative axes the system has been emphasizing over time.
- **Recommended:** `requireSession`

### 4. `/api/consequence-intelligence` — REQUIRES SESSION (HIGH)

- **Reads:** `consequenceIntelligenceMemory`
- **Returns:** Consequence patterns, historical correlations, risk escalations, strategic timeline, recovery patterns — operator-supplied episodes describing what happened after creative decisions.
- **Payload type:** **Strategic operator history**
- **Why protected:** Discloses past creative failures, recoveries, and strategic decisions; competitive intelligence.
- **Recommended:** `requireSession`

### 5. `/api/counterfactual-cognition` — REQUIRES SESSION (MEDIUM)

- **Reads:** 11 memory stores including counterfactual, governance, identity, outcome, conflict, strategy, copywriter.
- **Returns:** Multi-path strategic simulation longitudinal view — counterfactual paths the system has considered.
- **Payload type:** Strategic system intelligence
- **Why protected:** Reveals strategic alternatives the operator has weighed.
- **Recommended:** `requireSession`

### 6. `/api/cross-brain-conflict` — REQUIRES SESSION (MEDIUM)

- **Reads:** `conflictMemory`, `culturalPerceptionMemory`, `adStrategyMemory`, `copywriterMemory`, `copyQualityMemory`, policy audit
- **Returns:** Cross-brain conflict longitudinal view — how the system's strategy/copy/cultural brains disagree.
- **Payload type:** Internal cognitive diagnostic
- **Why protected:** System internal disagreement signals.
- **Recommended:** `requireSession`

### 7. `/api/cultural-memory` — REQUIRES SESSION (MEDIUM)

- **Reads:** `outcomeMemory` (operator-supplied outcomes with platform, audienceSegment, campaignMode, metrics)
- **Returns:** Cultural patterns, symbolic resonance, archetypes, rituals, generational signals, segment realism preferences.
- **Payload type:** Operator outcome data + cultural aggregates
- **Why protected:** Outcomes include `platform`, `audienceSegment`, performance `metrics` — operator-supplied business signals (even if not strictly PII).
- **Recommended:** `requireSession`

### 8. `/api/cultural-perception` — REQUIRES SESSION (MEDIUM)

- **Reads:** `culturalPerceptionMemory`, `adStrategyMemory`, `copywriterMemory`, `copyQualityMemory`, policy audit
- **Returns:** Cultural perception longitudinal view.
- **Payload type:** Strategic / cultural posture
- **Why protected:** Strategic creative posture; advertising strategy memory.
- **Recommended:** `requireSession`

### 9. `/api/emotional-rhythm` — REQUIRES SESSION (MEDIUM)

- **Reads:** 7 memory stores including outcomes, drift, visual/narrative DNA, trials, trial outcomes, pattern reliability.
- **Returns:** Composed emotional rhythm reading — scenes, stories, presence, imprint signals.
- **Payload type:** Internal creative system signals + operator trial data
- **Why protected:** Operator trial memory is operator-derived behavioral data.
- **Recommended:** `requireSession`

### 10. `/api/evolution-sandbox` — REQUIRES SESSION (MEDIUM)

- **Reads:** `outcomeMemory`, `visualDNAMemory`, `narrativeDNAMemory`, `creativeDriftMemory`
- **Writes:** `evolutionSandboxMemory` snapshot (side effect on every GET — current handler writes through `recordSandboxSimulation`)
- **Returns:** Candidate mutations, trajectories, survivability, divergence pressure, reality anchors.
- **Payload type:** Strategic system simulation
- **Why protected:** GET has a write side effect → unauthenticated callers can spam memory with simulation snapshots (resource abuse / FIFO churn). Plus simulation candidates expose strategic thinking.
- **Recommended:** `requireSession` (note: write side-effect strengthens the case)

### 11. `/api/human-memory-imprint` — REQUIRES SESSION (MEDIUM)

- **Reads:** `outcomeMemory`, `visualDNAMemory`, `narrativeDNAMemory`, `memoryImprintMemory`
- **Writes:** `memoryImprintMemory` snapshot on every GET
- **Returns:** Memory imprint, emotional scar, ritual persistence, silence weight, mythic narrative composed signals.
- **Payload type:** Aggregated creative intelligence + operator outcome data
- **Why protected:** Read pulls from operator-supplied outcomes; GET writes to memory (resource abuse risk).
- **Recommended:** `requireSession`

### 12. `/api/human-presence` — REQUIRES SESSION (MEDIUM)

- **Reads:** `outcomeMemory`, `visualDNAMemory`, `narrativeDNAMemory`, `presenceMemory`
- **Writes:** `presenceMemory` snapshot on every GET
- **Returns:** Composed presence reading.
- **Payload type:** Aggregated creative intelligence + operator outcome data
- **Why protected:** Same pattern as imprint route; write side effect + operator outcomes.
- **Recommended:** `requireSession`

### 13. `/api/human-truth` — REQUIRES SESSION (MEDIUM)

- **Reads:** `outcomeMemory`, `visualDNAMemory`, `narrativeDNAMemory`, `creativeDriftMemory`, `copywriterMemory`, `adStrategyMemory`
- **Returns:** Authenticity, manipulation pressure, soul preservation, dignity signals.
- **Payload type:** Aggregated creative diagnostics
- **Why protected:** Strategic posture across all six brain memories.
- **Recommended:** `requireSession`

### 14. `/api/identity-continuity` — REQUIRES SESSION (MEDIUM)

- **Reads:** 8 memory stores: identity, cognitive weight, conflict, cultural perception, strategy, copywriter, copy quality, policy audit.
- **Returns:** Identity continuity longitudinal view.
- **Payload type:** Strategic system intelligence
- **Why protected:** Composite strategic system state.
- **Recommended:** `requireSession`

### 15. `/api/ingest` (GET) — REQUIRES SESSION (MEDIUM)

- **Reads:** `realityIngestion` store (external observations)
- **Returns:** `total` + `recent: signals.slice(0, 20)` — text content of operator-ingested external observations with emotional weights and topical tags.
- **Payload type:** Operator-curated external observations
- **Why protected:** POST is already protected on this route; GET exposes the same ingested feed — competitive intelligence about what the operator is watching.
- **Recommended:** `requireSession` (parity with POST)

### 16. `/api/meta-cognition` — REQUIRES SESSION (MEDIUM)

- **Reads:** 7 memory stores.
- **Returns:** Confidence, contradictions, ambiguities, cognitive boundaries, multi-perspective readings.
- **Payload type:** Internal diagnostic
- **Why protected:** Reveals where the system is uncertain — strategic disclosure.
- **Recommended:** `requireSession`

### 17. `/api/mutation-planner` — REQUIRES SESSION (MEDIUM)

- **Reads:** `creativeDriftMemory`, `visualDNAMemory`, `narrativeDNAMemory`
- **Returns:** Generation mutation plan + fatigue summary.
- **Payload type:** Strategic creative plan
- **Why protected:** Reveals the next creative moves the system would advise.
- **Recommended:** `requireSession`

### 18. `/api/outcome` (GET) — REQUIRES SESSION (HIGH)

- **Reads:** `outcomeMemory`
- **Returns:** Up to 48 most recent operator-supplied outcomes — each record includes `bannerId`, `platform`, `audienceSegment`, `campaignMode`, `formula`, `metrics`, `operatorNote`, `downstreamOutcome`.
- **Payload type:** **Operator audit trail + performance data**
- **Why protected:** This is the operator's primary performance ledger. POST is already protected; GET must be too. `operatorNote` is free-text from the operator.
- **Recommended:** `requireSession` (parity with POST)

### 19. `/api/pre-generation-stability` (GET) — REQUIRES SESSION (MEDIUM)

- **Reads:** 5 memory stores + production safety envelope policy.
- **Returns:** Production conservative mode + pre-generation stabilizer advisory.
- **Payload type:** Internal stability diagnostic
- **Why protected:** POST is already protected; GET returns the same advisory shape for the default ENERGY/AUTO request — strategic safety posture.
- **Recommended:** `requireSession` (parity with POST)

### 20. `/api/product-intelligence` — **REQUIRES TENANT SESSION (HIGH)** ⚠️

- **Reads:** `customerJourneyMemory`, `publicationRegistryMemory`, `assetRegistryMemory`, `campaignPlanMemory`
- **Returns:** Customer journey analysis, attribution, product-intelligence reading.
- **Payload type:** **Tenant-scoped business data**
- **Why protected:** These four memory stores hold tenant-scoped records (customer journeys per tenant, publications, assets, campaign plans). Returning the aggregate view leaks cross-tenant business data.
- **Recommended:** `requireTenantSession(req, organizationId, workspaceId)` — **and the analyzer must filter by tenant before composing the reading.** Currently the engine composes over all records; adding the gate alone is necessary but not sufficient — Phase 3 must also tenant-filter the upstream reads.
- **Risk level: HIGH** — this is the only observatory route that crosses the tenant boundary.

### 21. `/api/production-studio` — REQUIRES SESSION (MEDIUM)

- **Reads:** 7 memory stores including outcomes, trials, pattern reliability.
- **Returns:** Creative briefs, production prompts, brand guardian reports, execution packages (image / video / carousel / landing).
- **Payload type:** Generated creative IP
- **Why protected:** This is the operator's creative-product output — proprietary briefs and prompts they would publish under their brand. Should not be available anonymously.
- **Recommended:** `requireSession`

### 22. `/api/projection-calibration` — REQUIRES SESSION (MEDIUM)

- **Reads:** `branchActivationMemory`, `projectionCalibrationMemory`
- **Returns:** Projection calibration longitudinal view — operator decision audit + calibration history.
- **Payload type:** Operator audit trail
- **Why protected:** Joins branch activation memory; same operator-trail concern as `/api/branch-activation`.
- **Recommended:** `requireSession`

### 23. `/api/quality-longitudinal` — REQUIRES SESSION (MEDIUM)

- **Reads:** `adStrategyMemory`, `copywriterMemory`, `copyQualityMemory`
- **Returns:** Brand-health longitudinal view.
- **Payload type:** Strategic / quality posture
- **Why protected:** Brand-health trajectory across strategy + copy — competitive intelligence.
- **Recommended:** `requireSession`

### 24. `/api/reality-intelligence` — REQUIRES SESSION (HIGH)

- **Reads:** `outcomeMemory`
- **Returns:** Performance DNA, decay intelligence, long-term performers, fast-burn patterns, recovery windows, hook lifecycle, audience segments, emotional response map — derived from operator-supplied outcomes including `platform` and `audienceSegment`.
- **Payload type:** **Performance intelligence with audience segments**
- **Why protected:** Audience segments + platform performance data are the operator's competitive moat.
- **Recommended:** `requireSession`

### 25. `/api/reflective-reasoning` — REQUIRES SESSION (MEDIUM)

- **Reads:** 7 memory stores.
- **Returns:** Reflections, hypotheses, assumptions, tensions, explanation variance, recursive observation loop.
- **Payload type:** Internal cognitive diagnostic
- **Why protected:** Strategic posture; uncertainty disclosure.
- **Recommended:** `requireSession`

### 26. `/api/refusal-narrative` (GET) — REQUIRES SESSION (LOW)

- **Reads:** `creativeDriftMemory`
- **Returns:** Refusal narrative output based on current drift signals.
- **Payload type:** System diagnostic
- **Why protected:** POST is already protected; GET surfaces the same advisory. Lower stakes than outcome/branch-activation but still strategic posture.
- **Recommended:** `requireSession` (parity with POST)

### 27. `/api/self-reflection` — REQUIRES SESSION (MEDIUM)

- **Reads:** 5 memory stores.
- **Writes:** `selfReflectionMemory` snapshot on every GET
- **Returns:** Meta-cognition, identity drift, aesthetic collapse, humanity retention signals.
- **Payload type:** Internal diagnostic + memory write side effect
- **Why protected:** Same pattern as imprint/presence; reveals system self-assessment.
- **Recommended:** `requireSession`

### 28. `/api/world-model` — REQUIRES SESSION (MEDIUM)

- **Reads:** `outcomeMemory`, `creativeDriftMemory`, `visualDNAMemory`, `narrativeDNAMemory`, `worldModelMemory`
- **Writes:** `worldModelMemory` snapshot on every GET
- **Returns:** World-state signals, aesthetic migration, collective attention, civilizational mood, meaning pressure.
- **Payload type:** Aggregated world-model reading
- **Why protected:** Operator-derived signals; GET writes to memory (resource abuse risk on unauthenticated route).
- **Recommended:** `requireSession`

---

## Summary table

| # | Route | Payload Type | Risk | Recommended Protection |
|---|---|---|---|---|
| 1 | `/api/adaptation-orchestrator` | System diagnostic | MEDIUM | REQUIRES SESSION |
| 2 | `/api/branch-activation` (GET) | Operator audit trail | HIGH | REQUIRES SESSION |
| 3 | `/api/cognitive-weight` | System diagnostic | MEDIUM | REQUIRES SESSION |
| 4 | `/api/consequence-intelligence` | Strategic history | HIGH | REQUIRES SESSION |
| 5 | `/api/counterfactual-cognition` | Strategic simulation | MEDIUM | REQUIRES SESSION |
| 6 | `/api/cross-brain-conflict` | Cognitive diagnostic | MEDIUM | REQUIRES SESSION |
| 7 | `/api/cultural-memory` | Operator outcomes + culture | MEDIUM | REQUIRES SESSION |
| 8 | `/api/cultural-perception` | Strategic posture | MEDIUM | REQUIRES SESSION |
| 9 | `/api/emotional-rhythm` | Creative signals + trials | MEDIUM | REQUIRES SESSION |
| 10 | `/api/evolution-sandbox` | Simulation (writes memory) | MEDIUM | REQUIRES SESSION |
| 11 | `/api/human-memory-imprint` | Creative signals (writes memory) | MEDIUM | REQUIRES SESSION |
| 12 | `/api/human-presence` | Creative signals (writes memory) | MEDIUM | REQUIRES SESSION |
| 13 | `/api/human-truth` | Creative diagnostics | MEDIUM | REQUIRES SESSION |
| 14 | `/api/identity-continuity` | Strategic system intelligence | MEDIUM | REQUIRES SESSION |
| 15 | `/api/ingest` (GET) | Operator-curated observations | MEDIUM | REQUIRES SESSION |
| 16 | `/api/meta-cognition` | Cognitive diagnostic | MEDIUM | REQUIRES SESSION |
| 17 | `/api/mutation-planner` | Strategic creative plan | MEDIUM | REQUIRES SESSION |
| 18 | `/api/outcome` (GET) | Operator audit + performance | HIGH | REQUIRES SESSION |
| 19 | `/api/pre-generation-stability` (GET) | Stability advisory | MEDIUM | REQUIRES SESSION |
| 20 | **`/api/product-intelligence`** | **Tenant-scoped business data** | **HIGH** | **REQUIRES TENANT SESSION** ⚠️ |
| 21 | `/api/production-studio` | Generated creative IP | MEDIUM | REQUIRES SESSION |
| 22 | `/api/projection-calibration` | Operator audit trail | MEDIUM | REQUIRES SESSION |
| 23 | `/api/quality-longitudinal` | Brand-health intelligence | MEDIUM | REQUIRES SESSION |
| 24 | `/api/reality-intelligence` | Performance + audience segments | HIGH | REQUIRES SESSION |
| 25 | `/api/reflective-reasoning` | Cognitive diagnostic | MEDIUM | REQUIRES SESSION |
| 26 | `/api/refusal-narrative` (GET) | System diagnostic | LOW | REQUIRES SESSION |
| 27 | `/api/self-reflection` | Diagnostic (writes memory) | MEDIUM | REQUIRES SESSION |
| 28 | `/api/world-model` | Aggregated reading (writes memory) | MEDIUM | REQUIRES SESSION |

**Tallies:**

- SAFE PUBLIC: **0**
- REQUIRES SESSION: **27**
- REQUIRES TENANT SESSION: **1** (`/api/product-intelligence`)

**Risk distribution:**

- HIGH: 5 (`branch-activation`, `consequence-intelligence`, `outcome`, `product-intelligence`, `reality-intelligence`)
- MEDIUM: 22
- LOW: 1 (`refusal-narrative`)

---

## Key findings

1. **No observatory endpoint qualifies as SAFE PUBLIC.** Every endpoint either reads from operator-supplied memory (outcomes, ingested signals, branch activations) or composes from internal cognitive memory that exposes strategic posture. Even the "purely diagnostic" routes leak the system's strategic thinking.

2. **One route crosses the tenant boundary: `/api/product-intelligence`.** It reads `customerJourneyMemory`, `publicationRegistryMemory`, `assetRegistryMemory`, `campaignPlanMemory` — all tenant-scoped after the Tenant Isolation Hardening phase. Adding `requireTenantSession` is **necessary but not sufficient**; the upstream engine must also tenant-filter the records before composing, otherwise an authenticated tenant member would still see other tenants' data.

3. **Seven observatory routes write to memory on every GET** (evolution-sandbox, human-memory-imprint, human-presence, self-reflection, world-model, plus implicit FIFO churn elsewhere). Unauthenticated callers can spam these routes to churn the FIFO buffers — `requireSession` closes that abuse vector.

4. **Five GET routes pair with already-protected POSTs** on the same path (`branch-activation`, `ingest`, `outcome`, `pre-generation-stability`, `refusal-narrative`). The asymmetry where POST is gated but GET returns the same data is a clear oversight from Phase 1.

5. **`operatorNote` field on outcomes is free-text operator input.** It is currently returned by `/api/outcome` GET. If operators ever paste sensitive notes (URLs, names, draft copy), anonymous access exposes that.

---

## Recommended Phase 3 sequence

If the user authorizes Phase 3 (code changes):

1. **Apply `requireSession` to 27 routes.** Mechanical retrofit identical to the Phase 1 GET pattern — except these routes do not need `organizationId` / `workspaceId` parsing because they do not (yet) operate over tenant-scoped data.

2. **Apply `requireTenantSession` to `/api/product-intelligence`** AND tenant-filter the four upstream `read()` calls before composing. Verify that `customerJourneyMemory`, `publicationRegistryMemory`, `assetRegistryMemory`, `campaignPlanMemory` expose tenant-filtering reads; if not, add them.

3. **Add 28 new entries to `scripts/verify-authentication.ts`** under PROTECTED_OBSERVATORY_GET_ROUTES (a new table mirroring PROTECTED_TENANT_GET_ROUTES but using `requireSession` rather than `requireTenantSession` — except for `product-intelligence` which goes into the tenant-protected table).

4. **Verify the full suite remains 66/66 + auth + tenant green.**

No work in this phase. No commits. Document only.
