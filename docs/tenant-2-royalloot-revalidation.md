# Tenant #2 RoyalLoot · Revalidation (post-2c7178d)

> Read-only revalidation of the tenant-isolation fix shipped in
> commit `2c7178d`. No code modifications. No git mutations.

## Environment

| Field | Value |
| --- | --- |
| Audited tree | `/home/user/mood-automation` (this container's clone of `moodritualchocolate/mood-automation`, fast-forwarded post-push) |
| Note on Windows path | The user-requested path `C:\Projects\mood-automation` is on the user's local machine; this validator runs in a Linux ephemeral container and cannot reach Windows paths. Recommend running the same verifier locally on Windows: `npx tsx scripts\verify-tenant-isolation-hardening.ts`. |

## HEAD verification

```
$ git rev-parse HEAD
2c7178d6f9e1b0f14e5bb80027e6c852be0cb2bc
```

Short form: **`2c7178d`** · matches the expected commit.

```
$ git status
On branch claude/mood-creative-os-v1-i4Mfv
Your branch is up to date with 'origin/claude/mood-creative-os-v1-i4Mfv'.
nothing to commit, working tree clean
```

## Verifier run

### `scripts/verify-tenant-isolation-hardening.ts`

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

### Full verifier suite (`scripts/verify-*.ts`)

```
Full verifier suite: 65/65 passed
```

## Per-requirement results

| # | Requirement | Verifier case(s) | Result |
| --- | --- | --- | --- |
| 1 | HEAD = `2c7178d` | `git rev-parse HEAD` | **PASS** |
| 2 | MOOD sees only MOOD brands/products | `mood-no-royalloot`, `brand-get-mood-scope`, `product-get-mood-scope` | **PASS** |
| 3 | RoyalLoot sees only RoyalLoot brands/products | `royalloot-no-mood`, `brand-get-royalloot-scope`, `product-get-royalloot-scope` | **PASS** |
| 4 | Brand dropdowns are tenant-scoped | `dropdowns-scoped` (also exercised by `brand-get-*-scope`) | **PASS** |
| 5 | Product creation cannot attach to another tenant's brand | `cross-tenant-attach-rejected` (POST `/api/product` with cross-tenant `brandId` → HTTP 404 `brand not found in this tenant`) | **PASS** |
| 6 | Fast Start still creates a second tenant correctly | `fast-start-isolation` (drives the `POST /api/fast-start` handler twice — MOOD + RoyalLoot — and asserts every resulting `project`, `brand`, `product`, `workflow` is stamped with the correct `organizationId` + `workspaceId`) | **PASS** |
| 7 | Dashboard / Growth / Workflows remain tenant-scoped | Static inspection: none of the three routes touch `workspaceMemory` `brands` / `products` directly. All three accept `organizationId` + `workspaceId` query params and resolve a `TenantContext` before composing their views. `executive-dashboard-no-leak` covers the only dashboard route that reads `workspaceMemory` (`/api/executive-dashboard`). | **PASS** |

### Detail · Dashboard / Growth / Workflows tenant exposure

| Route | Reads `workspaceMemory.brands` / `products` directly? | Accepts `organizationId` + `workspaceId` query params? | Result |
| --- | --- | --- | --- |
| `/api/executive-dashboard` (legacy executive dashboard) | yes → routed through `brandsForTenant` / `productsForTenant` post-commit | yes | verified leak-free by `executive-dashboard-no-leak` |
| `/api/dashboard` (productization layer) | no — reads only `org`, `asset`, `publication`, `campaign-plan`, `performance`, `task`, `knowledge`, `agent-run` memory | yes | not exposed |
| `/api/growth` (growth command center) | no — reads only `org`, `asset`, `publication`, `campaign-plan`, `performance`, `task`, `agent-run`, `workspace-activation` memory | yes | not exposed |
| `/api/workflows` (workflow dashboard) | no — reads only `workflow-memory`, `asset-registry`, `task-memory` | yes | not exposed |

## Before / after at the route layer

| Tenant | `GET /api/brand` response (before `2c7178d`) | `GET /api/brand` response (post `2c7178d`) |
| --- | --- | --- |
| MOOD | `[mood, RoyalLoot]` (leak) | `[mood]` |
| RoyalLoot | `[mood, RoyalLoot]` (leak) | `[RoyalLoot]` |

| Tenant | `GET /api/product` response (before) | `GET /api/product` response (post) |
| --- | --- | --- |
| MOOD | `[mood energy, RoyalLoot · core sku]` (leak) | `[mood energy]` |
| RoyalLoot | `[mood energy, RoyalLoot · core sku]` (leak) | `[RoyalLoot · core sku]` |

| Operation | Pre-commit behavior | Post-commit behavior |
| --- | --- | --- |
| MOOD `POST /api/product` with a RoyalLoot `brandId` | accepted, product written under foreign brand | **404** `brand not found in this tenant` |
| Two tenants `POST /api/brand` with the same `name` | platform-wide name collision | both succeed; records carry distinct `brandId`s |
| Fast Start (RoyalLoot tenant) | created records visible inside MOOD's dashboard | created records tenant-scoped; invisible to MOOD |

## Final verdict

**PASS.**
