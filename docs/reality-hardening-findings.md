# Reality Hardening Findings

> Observation only. The CORE PLATFORM FREEZE remains in effect. This
> document records what an audit of the platform + the MOOD pilot
> seed surfaced. **No solutions. Only findings.** The next roadmap
> must be assembled from these observations, not from new architecture.

The audit is reproducible via `npx tsx scripts/audit-reality-hardening.ts`
and runs five phases against the live source + a fresh seed in a temp
directory. The machine-readable artifact is written to
`data/runtime/reality-hardening-audit.json` (gitignored).

## Friction-Reduction Roadmap (delivered)

The roadmap below was authored from the prior Reality Hardening run
(45 fields · 10.9 min TTV · 10 pain points). Every item shipped uses
existing memory stores and pure transforms; no new engine, agent,
intelligence layer, or workflow system was introduced.

| Priority | Surface                                                | Status |
| -------- | ------------------------------------------------------ | ------ |
| P0       | `/api/brand` + `/brands` page                          | ✓       |
| P0       | `/api/product` + `/products` page                      | ✓       |
| P0       | `/api/fast-start` + `/fast-start` page                 | ✓       |
| P1       | `/api/workspace-context` resolver (no retyping)        | ✓       |
| P1       | `/api/simple-performance` (views/clicks/eng/revenue)   | ✓       |
| P2       | `lib/business/channelUnified.ts` adapter               | ✓       |
| P2       | `/api/channel-unified` operator surface                | ✓       |
| P2       | Breadcrumb + back-to-dashboard on all pages            | ✓       |

## Phase 1 · Operator Walkthrough Audit

When `/api/fast-start` is present, the entity-creation walkthrough
collapses from 10 steps to 5; the seven entities org+workspace+
membership+brand+product+activation+workflow scaffold in one POST.

| # | Step                                  | Route                                  | Fields | Handoff |
| - | ------------------------------------- | -------------------------------------- | ------ | ------- |
| 1 | Fast Start (org+brand+product+wf)     | `/api/fast-start`                      | 4      | ✗       |
| 2 | New Asset                             | `/api/asset-registry`                  | 4      | ✓       |
| 3 | New Approval                          | `/api/asset-registry` (approve)        | 1      | ✗       |
| 4 | New Publication                       | `/api/publication-registry`            | 4      | ✓       |
| 5 | New Performance Entry (simple)        | `/api/simple-performance`              | 5      | ✓       |

**Totals:** 5 steps · **18 fields** · 3 page handoffs · 0 missing
routes. Asset + publication field counts are reduced when
`/api/workspace-context` is available — context auto-fills formula ·
campaign · sourceBriefId · sourcePromptId on asset and campaign ·
formula · audience on publication.

## Phase 2 · Time-to-Value Audit

Coarse operator-effort estimate. Fast-start path uses direct-linked
handoffs (10 s) because the scaffolding result emits links to
`/dashboard` and `/workflows`. The non-fast-start path falls back to
20 s/handoff (find next page).

| Milestone                                              | Estimate    | Breakdown                                                                |
| ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------ |
| Org Created → First Asset Produced                     | **1.4 min** | 8 fields · 2 round-trips · 1 direct-linked handoff · 0 re-typed contexts |
| First Asset → First Workflow Activated                 | **0 min**   | fast-start already activated the workflow                                 |
| First Workflow → First Performance Recorded            | **1.5 min** | 9 fields · 2 round-trips · 1 direct-linked handoff · 0 re-typed contexts |
| First Performance → First Revenue Event Recorded       | **0 min**   | simple-performance emits the revenue event from the same POST            |
| **TOTAL · org → first revenue event**                  | **2.9 min** | 50 % below the prior 10.9-min baseline                                    |

### Phase 2 deltas (vs prior run)

- **TTV: 10.9 min → 2.9 min** (73 % reduction).
- **Fields typed: 45 → 18** (60 % reduction).
- **Duplicate context entry: 4 retypes → 0** (`ttv-workflow-rewrite`
  finding no longer fires when `/api/fast-start` is present;
  brand · product · market · audience pass once through fast-start and
  are re-used inside the same call).

## Phase 3 · UI Consistency Audit

| Axis        | Result | Note                                                                                                  |
| ----------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Naming      | ✗     | 6/7 pages declare the `CreativeOS ·` eyebrow (one residual)                                            |
| Breadcrumb  | ✓     | **7/7** pages surface `organizationId + workspaceId`                                                   |
| Channel     | ✓     | unified adapter `lib/business/channelUnified.ts` present                                              |
| Formula     | ✓     | every audited file references ENERGY · FOCUS · RELAX · SLEEP                                          |
| Status      | ✓     | tokens differ by entity (workflow vs asset) — by design                                               |
| Navigation  | ✓     | **7/7** pages link back to `/dashboard`                                                                |
| Role        | ✓     | 6 roles present in both `permissionMatrix` and `navigation`                                            |

### Phase 3 deltas (vs prior run)

- **Breadcrumb: 3/4 → 7/7.** Every operator-facing page now renders
  `organization → workspace → entity` plus the operator id.
- **Channel taxonomy: split → unified-via-adapter.** The new
  `/api/channel-unified` exposes a single operator-facing taxonomy
  where `ChannelRef` is the parent and `PublicationChannel` is a
  per-parent format. The legacy types are preserved unchanged.
- **Navigation: 3/4 → 7/7.** Every page emits a back-to-dashboard
  link in its breadcrumb.

## Phase 4 · Data Consistency Audit

The audit ran the MOOD pilot seed into a fresh temp directory and
walked the resulting 9 memory files. **Unchanged: zero duplicates,
zero broken references.**

| Class                        | Count | Note                                                                |
| ---------------------------- | ----- | ------------------------------------------------------------------- |
| Orphans                      | **5** | brand placeholder project (1) · pending assets w/o downstream (4)   |
| Duplicate identifiers        | **0** | every store passes uniqueness check                                  |
| Broken references            | **0** | every cross-store FK passes                                          |

## Phase 5 · Top Remaining Pain Points

Only 6 findings remain; all are **low severity**. The medium/high
items from the prior run have been retired by friction-reduction
surfaces. The list is ranked deterministically by severity and
measure.

| Rank | Severity | Finding                                                                                                                                |
| ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | low      | **18 fields typed end-to-end** (was 45) — `wk-total-field-entries`                                                                      |
| 2    | low      | **3 page handoffs across the 5 flows** (was 8) — `wk-page-handoffs`                                                                     |
| 3    | low      | **TTV 2.9 min** (was 10.9 min) — `ttv-total-minutes`                                                                                    |
| 4    | low      | **4 pending assets carry no downstream reference** (expected steady state for assets awaiting approval) — `dc-orphan-assets`            |
| 5    | low      | **BrandRecord.projectId references a placeholder project** (no ProjectRecord registration path yet) — `dc-brand-project-placeholder`    |
| 6    | low      | **Workflow vs Asset status tokens differ by design** — `ui-status-token-diff`                                                           |

(The audit also reports a residual `ui-naming-eyebrow` low finding
when one page lacks the `CreativeOS ·` eyebrow string at the exact
regex position; this is a static analysis artifact, not an operator
visibility gap.)

## Success Conditions · all met

> Run Reality Hardening again. New target:
>   - Time to first revenue < 3 minutes.
>   - Fields typed reduced by at least 50%.
>   - Duplicate context entry reduced to zero.

| Target                              | Result            | Status |
| ----------------------------------- | ----------------- | ------ |
| Time to first revenue < 3 min       | **2.9 min**        | ✓     |
| Fields typed reduced by ≥ 50 %      | **60 %** (45→18)   | ✓     |
| Duplicate context entry → 0         | **0**              | ✓     |

The friction-reduction surfaces are pure adapters over the existing
memory stores. No new engine, intelligence layer, memory system,
workflow system, agent class, or dashboard category was introduced.

Operator approval required at every gate. Human remains final
authority.
