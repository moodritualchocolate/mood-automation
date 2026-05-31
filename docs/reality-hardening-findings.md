# Reality Hardening Findings

> Observation only. The CORE PLATFORM FREEZE remains in effect. This
> document records what an audit of the platform + the MOOD pilot
> seed surfaced. **No solutions. Only findings.** The next roadmap
> must be assembled from these observations, not from new architecture.

The audit is reproducible via `npx tsx scripts/audit-reality-hardening.ts`
and runs five phases against the live source + a fresh seed in a temp
directory. The machine-readable artifact is written to
`data/runtime/reality-hardening-audit.json` (gitignored).

## Phase 1 · Operator Walkthrough Audit

The 10 entity-creation flows the operator must complete end-to-end:

| # | Step                    | Route                                  | Fields | Handoff | Note                                 |
| - | ----------------------- | -------------------------------------- | ------ | ------- | ------------------------------------ |
| 1 | New Organization        | `/api/organization`                    | 2      | ✓       |                                       |
| 2 | New Brand               | `/api/brand` (**missing**)             | 2      | ✓       | pure-transform access required        |
| 3 | New Product             | `/api/product` (**missing**)           | 3      | ✓       | pure-transform access required        |
| 4 | New Campaign            | `/api/campaign-planner`                | 5      | ✓       |                                       |
| 5 | New Workflow            | `/api/workflows`                       | 6      | ✓       | re-asks for brand · product · market · audience |
| 6 | New Asset               | `/api/asset-registry`                  | 7      | ✓       |                                       |
| 7 | New Approval            | `/api/asset-registry` (approve)        | 1      | ✗       |                                       |
| 8 | New Publication         | `/api/publication-registry`            | 7      | ✓       | channel taxonomy diverges from `ChannelRef` |
| 9 | New Performance Entry   | `/api/performance`                     | 8      | ✓       | nested `measurementWindow` + 12-field metrics |
| 10 | New Journey Entry      | `/api/customer-journey`                | 4      | ✓       |                                       |

**Totals:** 10 steps · ~45 fields · 8 page handoffs · 2 missing routes.

### Phase 1 observations

- **Missing routes for Brand and Product** (severity: high). The pure
  transforms in `lib/workspaceMemory.ts` exist (`appendBrand`,
  `appendProduct`), but no operator-facing route exposes them. The
  MOOD pilot worked around this by calling the transforms from
  `scripts/seed-mood-pilot.ts`; a real operator cannot.
- **Workflow orchestrate re-asks for brand · product · market ·
  audience** (severity: medium). Those values are already in the
  workspace; the orchestrator requires them again in the POST body.
- **Channel taxonomy split** (severity: medium). `ChannelRef`
  (`instagram`, `facebook`, …) vs `PublicationChannel`
  (`instagram-feed`, `instagram-story`, `instagram-reels`, …). The
  operator has to mentally map between the two during publication.
- **Performance shape is heavy** (severity: medium). The POST requires
  a nested `measurementWindow` and a 12-field optional `metrics`
  record. The operator round-trip is the longest in the walkthrough.
- **8 page handoffs across 10 flows** (severity: low). Most flows
  require the operator to leave the current page; only "approve" is
  inline.

## Phase 2 · Time-to-Value Audit

Coarse operator-effort estimates assuming 6 s/field, 12 s/round-trip,
20 s/handoff, 30 s/re-typed context.

| Milestone                                              | Estimate    | Breakdown                                                            |
| ------------------------------------------------------ | ----------- | -------------------------------------------------------------------- |
| Org Created → First Asset Produced                     | **3.7 min** | 14 fields · 4 round-trips · 3 handoffs · 1 re-typed context           |
| First Asset → First Workflow Activated                 | **3.4 min** | 7 fields · 2 round-trips · 1 handoff · 4 re-typed contexts            |
| First Workflow → First Performance Recorded            | **2.7 min** | 15 fields · 2 round-trips · 1 handoff · 1 re-typed context            |
| First Performance → First Revenue Event Recorded       | **1.1 min** | 4 fields · 1 round-trip · 0 handoffs · 1 re-typed context             |
| **TOTAL · org → first revenue event**                  | **10.9 min** |                                                                      |

### Phase 2 observations

- **~11 minutes from a brand-new organization to first operator-logged
  revenue event.** That is a lower-bound — it assumes the operator
  knows exactly what to type and that no friction surfaces during the
  flow. Real-world time-to-first-revenue-event will be longer.
- The biggest single friction is **workflow orchestration**, because
  it forces the operator to retype brand · product · market · audience
  that the workspace already knows.

## Phase 3 · UI Consistency Audit

The four operator-facing pages were audited along seven axes:

| Axis        | Result | Note                                                                 |
| ----------- | ------ | -------------------------------------------------------------------- |
| Naming      | ✓     | 4/4 pages declare the `CreativeOS ·` eyebrow                          |
| Breadcrumb  | ✗     | 3/4 pages surface `organizationId + workspaceId`                      |
| Channel     | ✗     | 1/7 `ChannelRef` ids appear verbatim in `PublicationChannel`          |
| Formula     | ✓     | every audited file references ENERGY · FOCUS · RELAX · SLEEP          |
| Status      | ✓     | tokens differ by entity (workflow vs asset) — by design               |
| Navigation  | ✓     | 3/4 pages link back to `/dashboard`                                   |
| Role        | ✓     | 6 roles present in both `permissionMatrix` and `navigation`           |

### Phase 3 observations

- **One page does not render the org→workspace breadcrumb** (severity:
  medium). Operator loses anchor context.
- **6 of 7 `ChannelRef` ids do not appear verbatim in
  `PublicationChannel`** (severity: medium). When the operator logs a
  publication, the channel selector vocabulary is different from the
  one shown on the channel-architecture page.
- **One page does not link back to `/dashboard`** (severity: medium).
  Operator must use the URL bar to return.
- **Status tokens differ between workflow and asset** (severity: low).
  This is intentional (different lifecycles) but worth surfacing as a
  confusion risk for new operators.

## Phase 4 · Data Consistency Audit

The audit ran the MOOD pilot seed into a fresh temp directory and
walked the resulting 9 memory files.

| Class                        | Count | Note                                                                |
| ---------------------------- | ----- | ------------------------------------------------------------------- |
| Orphans                      | **5** | brand placeholder project (1) · pending assets w/o downstream (4)   |
| Duplicate identifiers        | **0** | every store passes uniqueness check                                  |
| Broken references            | **0** | every cross-store FK passes                                          |

### Phase 4 observations

- **`BrandRecord.projectId` references a placeholder** (severity:
  low). The pilot seed wrote `'project-mood-pilot'` as a placeholder
  because the platform has no `ProjectRecord` registration path. The
  brand record is internally valid; the reference is operator-meaning
  only.
- **4 pending assets carry no downstream publication / performance /
  journey reference** (severity: low). This is the expected steady
  state — assets that have not yet been approved cannot be published.
  Surfaced as a hint for the dashboard's "assets-waiting-production"
  card.
- **Zero duplicate identifiers, zero broken references.** Every
  cross-store FK that the audit could check (workspace→org,
  membership→org, product→brand, publication→asset,
  performance→{publication, asset}, journey→{publication, asset}) is
  intact.

## Phase 5 · Top 10 Pain Points

Ranked by severity, then by measure (where applicable). **No
solutions; only findings.**

| Rank | Severity | Finding                                                                                                                |
| ---- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1    | high     | **TTV · 10.9 min from org creation to first revenue event** (`ttv-total-minutes`)                                       |
| 2    | high     | **Brand creation has no route — operator MUST call pure transforms** (`wk-brand-route-missing`)                         |
| 3    | high     | **Product creation has no route — operator MUST call pure transforms** (`wk-product-route-missing`)                     |
| 4    | medium   | **~45 fields typed across the 10 entity-creation flows** (`wk-total-field-entries`)                                     |
| 5    | medium   | **Performance POST shape is deep (nested `measurementWindow` + 12-field metrics)** (`wk-performance-deep-shape`)        |
| 6    | medium   | **~4 re-typed contexts on workflow orchestrate** (`ttv-workflow-rewrite`)                                               |
| 7    | medium   | **Workflow orchestrate re-asks for brand · product · market · audience** (`wk-workflow-duplicate-context`)               |
| 8    | medium   | **Channel taxonomy split — `ChannelRef` vs `PublicationChannel`** (`wk-channel-taxonomy-split`)                          |
| 9    | medium   | **1 page does not render the org→workspace breadcrumb** (`ui-breadcrumb-missing`)                                       |
| 10   | medium   | **6 of 7 ChannelRef ids do not appear in PublicationChannel** (`ui-channel-vocab-split`)                                |

## Success condition · met

> The next roadmap is created only from observed pain. Not from
> architecture ideas.

The audit produced 15 findings across 4 phases. The top-10 list is
ranked deterministically by severity and measure — every entry is a
pointer to an existing source-level location (route, page, memory
store, or seed run). No new engines were introduced. No new memories
were created. No new intelligence layers were added. No new
dashboards were proposed.

Operator approval required at every gate. Human remains final
authority.
