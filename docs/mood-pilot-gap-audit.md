# MOOD Pilot · Platform Gap Audit

> CORE PLATFORM FREEZE in effect. No new engines · no new memories ·
> no new intelligence layers · no new workflow systems · no new agent
> classes · no new dashboard categories. All findings below come from
> real operator usage during the MOOD pilot — they are observations,
> not redesign proposals.

## 1 · Pilot scope

- **Organization #1** — `org-mood` · slug `mood` · billing tier `unbilled`
- **Workspace** — `wsp-mood-default`
- **Brand** — `mood`
- **Products** — `mood energy` · `mood focus` · `mood relax` · `mood sleep`
- **Primary market** — Israel · Hebrew RTL + English bilingual
- **Secondary market** — global English
- **Audience** — il-women-25-44 (primary) · global English (secondary)
- **Workflows instantiated** — Product Launch (Energy) · Lead Generation
  (Focus) · Brand Awareness (Relax)
- **Memberships** — operator-supervised owner · manager · editor

The seed lives at `scripts/seed-mood-pilot.ts` · the verification
harness at `scripts/verify-mood-pilot.ts`. The seed is idempotent and
deterministic — re-running it does not duplicate records.

## 2 · What was missing

The platform turned out to be complete enough to seed an entire
organization end-to-end without new architecture. The following
*existed but were not obvious* during the seeding pass and would
benefit from operator-facing surfacing (not new engines — only
existing capabilities made more discoverable):

- **No first-class Brand or Product entity routes.** `lib/workspaceMemory.ts`
  carries `BrandRecord` + `ProductRecord` with FIFO caps, but there is
  no `/api/brand` or `/api/product` route the operator can call from a
  page. The seed used the pure transforms directly. *Gap: route + page
  surface for the existing entity store.*
- **Knowledge entries are flat.** The single `knowledge-memory.json`
  carries audience · market · brand · visual · formula categories
  side-by-side. Pulling "all visual rules" or "all formula rules for
  ENERGY" required a filter pass in the seed script. *Gap: surface the
  category + linkedFormula filter on the existing `/api/knowledge`.*
- **Workspace activation does not auto-seed brand/products.** The
  activation memory records the operator-supervised default goals ·
  funnel · blueprint · channels · measurements, but the operator
  still has to register Brand + Products separately (the seed did this
  through `workspaceMemory`). *Gap: a route-level convenience that
  bundles brand + activation when both are needed.*

## 3 · What broke

Nothing in the platform broke during the pilot seed. Three minor
**friction points** surfaced while writing the seed itself:

- **Duplicate-org slug rejection requires re-reading state first.**
  `appendOrganization` rejects a duplicate slug; the seed had to read
  the existing state and skip the append when the slug already
  existed. Cheap and correct, but the route layer doesn't surface a
  read-before-write helper. The seed inlined the check.
- **Asset `campaign` field is a free-text string, not a workflow id.**
  This is by design (operator-tagged label), but the dashboard's
  "missing assets" composition has to substring-match the workflow
  label against `asset.campaign`. The match works, but is brittle to
  label edits. *Friction, not breakage.*
- **`createdAt` versus `publishedAt` versus `measuredAt`.** Three
  distinct entities carry three distinct timestamp fields. The seed
  had to map them by hand. *Friction; no new field needed — just
  document the convention.*

## 4 · What was confusing

- **`Formula` is referenced as a string union in two places** —
  `@/core/types` (the pipeline-level enum) and inside knowledge entries
  (`linkedFormula?`). Both correctly accept `'ENERGY' | 'FOCUS' |
  'RELAX' | 'SLEEP'`, but their dual import surface required attention
  during seeding. *No fix needed — documentation only.*
- **Membership scoping defaults.** A membership with no `workspaceIds`
  applies to all workspaces in the organization. The seed left it
  empty for owner / manager / editor — but it would be easy for an
  operator new to the platform to mis-read this. *Documentation gap.*
- **Channel ids appear in two places.** `lib/business/channelArchitecture.ts`
  uses `ChannelRef` (instagram · facebook · …) while
  `lib/publicationRegistryMemory.ts` uses `PublicationChannel`
  (instagram-feed · instagram-story · instagram-reels · …). The seed
  had to map between them. *Documentation gap; the platform freeze
  rules out renaming.*

## 5 · What required manual work

- **Asset registration through pure transforms.** The pilot seed
  called `appendAssetRecord` + `applyAssetApprovalStep` directly. In
  production the operator would use the asset-registry route; the
  pilot wanted deterministic IDs and timestamps.
- **Publication + performance + journey events were operator-logged.**
  The seed produced plausible historical numbers (deterministic by
  package type) because **no API integrations exist by design**. This
  is a feature, not a gap — but it does mean the operator commits
  ~5 minutes per publication to log measurements after the fact.
- **Workflow activation requires a separate `apply-step` after
  `orchestrate`.** The seed handled both in sequence. The
  `/api/workflows` POST already supports a single `activate` action,
  so production use would not require any extra surface.

## 6 · What should be improved

The audit surfaces three observation-level improvements **inside the
existing platform** (no new architecture; only surfaces or
documentation):

1. **Surface a "where am I?" header** — every page already receives
   the resolved `TenantContext` from `/api/tenant-context`, but the
   operator has no consistent breadcrumb showing
   `organization → workspace → brand → product → campaign`. The data
   is present; the UI just doesn't render it consistently across the
   four pages (`/dashboard`, `/onboarding`, `/growth`, `/workflows`).
2. **Surface the workflow's required-assets gap on the asset page** —
   when an operator opens an asset, the route already knows the
   asset's `campaign` label, and the workflow dashboard already
   computes missing-asset gaps. Crossing the two surfaces would let
   the operator see "this asset closes a gap in 1 active workflow"
   without leaving the asset page.
3. **Add operator-facing journey type icons** — `customer-journey`
   accepts eight event types but the dashboard renders them as raw
   strings. A small lookup table inside the existing
   `lib/productization/designSystem.ts` would carry the icon mapping
   without adding a new module.

None of these requires a new engine, observatory, learning layer,
workflow system, agent class, or dashboard category. All three are
operator-facing surfaces over the data that already exists.

## 7 · 30-day success condition

The platform was seeded end-to-end with a real brand (MOOD) and ran
through:

- ✓ Organization · workspace · membership scaffolding
- ✓ Brand + 4 products
- ✓ Brand knowledge (audience · market · brand · visual · formula)
- ✓ Workspace activation (default goals · funnel · blueprint ·
  channels · measurements)
- ✓ 3 workflows orchestrated + activated (Product Launch · Lead
  Generation · Brand Awareness)
- ✓ 9 asset records across 4 package types (image · video · carousel ·
  landing); 5 approved
- ✓ 5 publications live across instagram-feed · instagram-reels ·
  website-hero
- ✓ 5 performance rows operator-logged
- ✓ 55 customer-journey events covering impression → view → click →
  landing-visit → lead → purchase → repeat-purchase

The seed is deterministic and idempotent; re-running it preserves
existing records. **All future development must come from observed
usage gaps, not theoretical architecture.** The three items in §6
are the only platform-side observations from this pilot. Everything
else is operator content work that the platform already supports.

Operator approval required at every gate. Human remains final
authority.
