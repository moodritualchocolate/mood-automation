# Tenant Isolation Hardening · Report

> Platform freeze remains active. No new features, no new
> dashboards, no new engines, no new cognition were added. This
> directive fixed a real correctness bug surfaced during the
> RoyalLoot Tenant #2 validation: brand/product storage was global,
> so two tenants could see each other's records.

## Exact HEAD before fix

```
3176ab220f20706dac04d08102b2364b20566db8
(friction reduction · roadmap from reality hardening findings (platform freeze))
```

A prior session reported a tenant-isolation commit at `d9ab96a`
that was visible inside that session's ephemeral container but did
not propagate to the authoritative remote. The `tenant-isolation-pass`
tag is currently placed on `3176ab2`, which is the pre-fix commit —
the tag misrepresents the state and should be moved to the new
commit produced by this directive once the user verifies the fix.

## Root cause

`lib/workspaceMemory.ts` defined `ProjectRecord`, `BrandRecord`,
`ProductRecord`, and `CampaignRecord` **without** an
`organizationId` or `workspaceId` field. All four collections lived
side-by-side in a single JSON file (`workspace-memory.json`) with no
per-tenant partition. Every route that read those collections
returned the entire global list:

| Route                            | Read                       | Leak risk         |
| -------------------------------- | -------------------------- | ----------------- |
| `app/api/brand/route.ts`         | `state.brands`             | full cross-tenant |
| `app/api/product/route.ts`       | `state.products`           | full cross-tenant |
| `app/api/fast-start/route.ts`    | `state.brands` / `state.products` (for idempotency) | cross-tenant idempotency collision |
| `app/api/workspace/route.ts`     | `state.brands` / `state.products` / `state.projects` / `state.campaigns` | full cross-tenant |
| `app/api/workspace-context/route.ts` | `state.brands` / `state.products` | cross-tenant "active" resolution |
| `app/api/executive-dashboard/route.ts` | `state.brands` / `state.products` (via `composeWorkspace`) | full cross-tenant |

The fast-start path itself was *not* the source of the bug — fast-start
stamped the right organization id on the outer organization record,
but the inner workspace-memory entities were written into a global
namespace and read back without scoping. RoyalLoot's fast-start
succeeded end-to-end and then surfaced MOOD's brand list in its UI.

## Fix implemented

Minimum-scope change. No new memory store, no new engine.

1. `lib/workspaceMemory.ts`
   - Added `organizationId: string` + `workspaceId: string` as
     **required** fields on `ProjectRecord`, `BrandRecord`,
     `ProductRecord`, and `CampaignRecord`.
   - Added pure read-side helpers `projectsForTenant`,
     `brandsForTenant`, `productsForTenant`, `campaignsForTenant`
     that filter by `{ organizationId, workspaceId }`.
   - Added an on-read migration: legacy records without the stamps
     are returned with `organizationId = PLATFORM_TENANT_ID_MOOD`
     and `workspaceId = PLATFORM_WORKSPACE_ID_MOOD`. Idempotent;
     records that already carry the stamps are returned unchanged.

2. `app/api/brand/route.ts`
   - GET resolves `organizationId` + `workspaceId` from query params
     (defaults to MOOD for legacy callers) and uses
     `brandsForTenant` to filter the response.
   - POST stamps `organizationId` + `workspaceId` on the new
     `BrandRecord`. Idempotency check is scoped per-tenant — the
     same brand name in two different tenants is no longer a
     duplicate.

3. `app/api/product/route.ts`
   - GET filters by tenant via `productsForTenant`.
   - POST stamps the new fields on the `ProductRecord` AND refuses
     to attach a product to a brand owned by another tenant
     (returns 404 "brand not found in this tenant").

4. `app/api/fast-start/route.ts`
   - Brand + product idempotency lookups now match on
     `(name, organizationId, workspaceId)` instead of name alone.
   - Project / brand / product records all carry the resolved
     `organizationId` + `workspaceId`.

5. `app/api/workspace-context/route.ts`
   - Brand + product reads are filtered through the tenant helpers.
     The "active brand" resolution can no longer surface a brand
     from another tenant. Counts reported back to the caller are
     tenant-scoped.

6. `app/api/workspace/route.ts`
   - GET takes `organizationId` + `workspaceId` query params and
     filters projects, brands, products, AND campaigns through the
     tenant helpers before composing the workspace tree.
   - All five POST actions (`create-project`, `create-brand`,
     `create-product`, `create-campaign`, `update-campaign-status`)
     stamp the new fields and verify the parent entity is in the
     same tenant.

7. `app/api/executive-dashboard/route.ts`
   - GET takes `organizationId` + `workspaceId` query params and
     scopes the workspace composition through the tenant helpers.

8. `app/brands/page.tsx` + `app/products/page.tsx`
   - Page fetch calls now pass `organizationId` + `workspaceId` on
     both GET and POST.
   - Brand-selector dropdown on `/products` is fed by the
     tenant-scoped `/api/brand`.

9. `scripts/seed-mood-pilot.ts`
   - `BrandRecord` + `ProductRecord` writes stamp
     `PLATFORM_TENANT_ID_MOOD` + `PLATFORM_WORKSPACE_ID_MOOD`.

10. `scripts/verify-operations-layer.ts`
    - Fixture helpers stamp a deterministic test tenant so the
      existing operations-layer verifier keeps passing.

### Files changed (exact list)

```
lib/workspaceMemory.ts
app/api/brand/route.ts
app/api/product/route.ts
app/api/fast-start/route.ts
app/api/workspace/route.ts
app/api/workspace-context/route.ts
app/api/executive-dashboard/route.ts
app/brands/page.tsx
app/products/page.tsx
scripts/seed-mood-pilot.ts
scripts/verify-operations-layer.ts
scripts/verify-tenant-isolation-hardening.ts   (new)
docs/tenant-isolation-hardening-report.md      (this file)
```

## Tests added

`scripts/verify-tenant-isolation-hardening.ts` (new). Fifteen cases
covering the user's full 16-item checklist (`same-name-blocked-same-tenant`
covers items 11 + same-tenant idempotency; `cross-tenant-dup-name`
covers item 10 standalone):

| #  | Verifier case                                 | Checklist item                                                          |
| -- | --------------------------------------------- | ----------------------------------------------------------------------- |
| 1  | `scope-helpers`                               | tenant filters work                                                     |
| 2  | `mood-no-royalloot`                           | MOOD never sees RoyalLoot brand ids                                     |
| 3  | `royalloot-no-mood`                           | RoyalLoot never sees MOOD product ids                                   |
| 4  | `dropdowns-scoped`                            | 9 · brand dropdowns are tenant-scoped                                   |
| 5  | `cross-tenant-dup-name`                       | 10 · same brand name allowed across tenants                              |
| 6  | `brand-get-mood-scope`                        | 5 · MOOD GET /api/brand returns only MOOD                                |
| 7  | `brand-get-royalloot-scope`                   | 6 · RoyalLoot GET /api/brand returns only RoyalLoot                      |
| 8  | `product-get-mood-scope`                      | 7 · MOOD GET /api/product returns only MOOD                              |
| 9  | `product-get-royalloot-scope`                 | 8 · RoyalLoot GET /api/product returns only RoyalLoot                    |
| 10 | `same-name-blocked-same-tenant`               | 11 · same brand name blocked inside same tenant (idempotency returns existing) |
| 11 | `cross-tenant-attach-rejected`                | 12 · product cannot attach to cross-tenant brand                         |
| 12 | `workspace-context-no-leak`                   | 15 · workspace-context has zero cross-tenant leakage                     |
| 13 | `executive-dashboard-no-leak`                 | 16 · executive-dashboard has zero cross-tenant leakage                   |
| 14 | `fast-start-isolation`                        | 13 · fast-start creates tenant-stamped brand/product (+ 1–4)             |
| 15 | `legacy-migration`                            | 14 · legacy records migrate to MOOD only                                 |

The cases marked "drives the route handler" call the actual
`GET`/`POST` exported by the route module against a temp memory
dir, not just the pure transforms — so the audit observes route-layer
behavior end-to-end.

## Before / after

### Before (HEAD = `3176ab2`)

| Tenant     | Brands list returned by /api/brand                                  |
| ---------- | ------------------------------------------------------------------- |
| MOOD       | `mood`, `RoyalLoot`         ← LEAK                                  |
| RoyalLoot  | `mood`, `RoyalLoot`         ← LEAK                                  |
| MOOD       | brand-selector dropdown showed RoyalLoot · LEAK                     |
| RoyalLoot  | brand-selector dropdown showed mood · LEAK                          |
| MOOD       | POST /api/product accepted a `brandId` owned by RoyalLoot           |

### After

```
TENANT ISOLATION HARDENING VERIFICATION

  [PASS] scope-helpers · brandsForTenant + productsForTenant filter strictly
  [PASS] mood-no-royalloot · MOOD never sees RoyalLoot brand ids
  [PASS] royalloot-no-mood · RoyalLoot never sees MOOD product ids
  [PASS] dropdowns-scoped · brand-selector dropdowns are tenant-scoped
  [PASS] cross-tenant-dup-name · same brand name is allowed across tenants without conflict
  [PASS] brand-get-mood-scope · MOOD GET /api/brand returns only MOOD brands
  [PASS] brand-get-royalloot-scope · RoyalLoot GET /api/brand returns only RoyalLoot brands
  [PASS] product-get-mood-scope · MOOD GET /api/product returns only MOOD products
  [PASS] product-get-royalloot-scope · RoyalLoot GET /api/product returns only RoyalLoot products
  [PASS] same-name-blocked-same-tenant · same brand name returns existing record inside same tenant (no duplicate)
  [PASS] cross-tenant-attach-rejected · POST /api/product rejects attaching to a brand owned by another tenant
  [PASS] workspace-context-no-leak · GET /api/workspace-context leaks zero cross-tenant data
  [PASS] executive-dashboard-no-leak · GET /api/executive-dashboard leaks zero cross-tenant data
  [PASS] fast-start-isolation · fast-start scopes every record by (organizationId, workspaceId)
  [PASS] legacy-migration · legacy records without tenancy stamp migrate to MOOD defaults

SUMMARY
  15/15 passed
```

| Tenant     | Brands list returned by /api/brand                                  |
| ---------- | ------------------------------------------------------------------- |
| MOOD       | `mood`                                                              |
| RoyalLoot  | `RoyalLoot`                                                         |
| MOOD       | brand-selector dropdown shows only `mood`                           |
| RoyalLoot  | brand-selector dropdown shows only `RoyalLoot`                      |
| MOOD       | POST /api/product with RoyalLoot `brandId` → 404 `brand not found in this tenant` |

## Verification results

| Check                                             | Result            |
| ------------------------------------------------- | ----------------- |
| `npx tsc --noEmit`                                | 0 errors          |
| `scripts/verify-tenant-isolation-hardening.ts`    | **15 / 15 passed** |
| Full verifier suite (`scripts/verify-*.ts`)       | **65 / 65 passed** |

## Final verdict

**PASS.**

- Tenant boundary verified: MOOD ↔ RoyalLoot show zero overlap on
  brand ids, product ids, project ids, and campaign ids.
- Dropdowns (brand selector) verified tenant-scoped.
- Fast Start verified working for both tenants with correct
  per-tenant scoping.
- Same brand name across tenants is allowed; inside the same
  tenant the route returns the existing record (idempotent · no
  duplicate created).
- Cross-tenant product attachment is rejected by the product route.
- `workspace-context` and `executive-dashboard` GET responses
  verified leak-free.
- Legacy MOOD pilot data verified backward-compatible via the
  on-read migration.

No new architecture introduced. Only the minimum scope fix
described above. Human remains final authority.
