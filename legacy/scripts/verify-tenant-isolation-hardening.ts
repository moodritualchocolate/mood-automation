/**
 * scripts/verify-tenant-isolation-hardening.ts
 *
 * TENANT ISOLATION HARDENING VERIFICATION
 *
 * Reproduces the RoyalLoot validation failure:
 *   - create MOOD tenant + brand + product
 *   - create RoyalLoot tenant + brand + product
 *   - assert MOOD never sees RoyalLoot
 *   - assert RoyalLoot never sees MOOD
 *   - assert dropdowns (lists) are tenant-scoped
 *   - assert Fast Start still works for both tenants
 *
 * Exercises the pure transforms + tenant-scoping helpers in
 * lib/workspaceMemory.ts and the route-layer behaviour (action +
 * filter logic transcribed against the same transforms).
 *
 * Run: npx tsx scripts/verify-tenant-isolation-hardening.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  appendBrand, appendProduct, appendProject,
  brandsForTenant, campaignsForTenant, createInitialWorkspaceMemory,
  newBrandId, newProductId, newProjectId,
  productsForTenant, projectsForTenant,
  type BrandRecord, type ProductRecord, type ProjectRecord,
  type WorkspaceMemoryState,
} from '../lib/workspaceMemory';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '../lib/tenancy/types';
import {
  appendOrganization, appendWorkspace, createInitialOrganizationMemory,
} from '../lib/tenancy/organizationMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── tenants ─────────────────────────────────────────────────

const MOOD_ORG = PLATFORM_TENANT_ID_MOOD;
const MOOD_WSP = PLATFORM_WORKSPACE_ID_MOOD;
const ROYALLOOT_ORG = 'org-royalloot';
const ROYALLOOT_WSP = 'wsp-royalloot-default';

const MOOD_SCOPE      = { organizationId: MOOD_ORG,      workspaceId: MOOD_WSP };
const ROYALLOOT_SCOPE = { organizationId: ROYALLOOT_ORG, workspaceId: ROYALLOOT_WSP };

// ─── helpers ─────────────────────────────────────────────────

function mkProject(scope: { organizationId: string; workspaceId: string }, name: string, at: number): ProjectRecord {
  return {
    projectId: newProjectId(),
    organizationId: scope.organizationId, workspaceId: scope.workspaceId,
    name, createdAt: at, operatorId: `op-${scope.organizationId}`,
  };
}
function mkBrand(scope: { organizationId: string; workspaceId: string }, projectId: string, name: string, at: number): BrandRecord {
  return {
    brandId: newBrandId(),
    organizationId: scope.organizationId, workspaceId: scope.workspaceId,
    projectId, name, createdAt: at, operatorId: `op-${scope.organizationId}`,
  };
}
function mkProduct(scope: { organizationId: string; workspaceId: string }, brandId: string, name: string, at: number): ProductRecord {
  return {
    productId: newProductId(),
    organizationId: scope.organizationId, workspaceId: scope.workspaceId,
    brandId, name, createdAt: at, operatorId: `op-${scope.organizationId}`,
  };
}

function seedTwoTenants(): WorkspaceMemoryState {
  let state = createInitialWorkspaceMemory();
  // MOOD
  const moodProject = mkProject(MOOD_SCOPE, 'MOOD · default project', 1000);
  state = appendProject(state, moodProject);
  const moodBrand   = mkBrand(MOOD_SCOPE, moodProject.projectId, 'mood', 1100);
  state = appendBrand(state, moodBrand);
  const moodProduct = mkProduct(MOOD_SCOPE, moodBrand.brandId, 'mood energy', 1200);
  state = appendProduct(state, moodProduct);
  // RoyalLoot
  const royallootProject = mkProject(ROYALLOOT_SCOPE, 'RoyalLoot · default project', 2000);
  state = appendProject(state, royallootProject);
  const royallootBrand   = mkBrand(ROYALLOOT_SCOPE, royallootProject.projectId, 'RoyalLoot', 2100);
  state = appendBrand(state, royallootBrand);
  const royallootProduct = mkProduct(ROYALLOOT_SCOPE, royallootBrand.brandId, 'RoyalLoot · core sku', 2200);
  state = appendProduct(state, royallootProduct);
  return state;
}

// ─── cases ───────────────────────────────────────────────────

function caseTenantScopingHelpersFilter(): { ok: boolean; detail: string } {
  const state = seedTwoTenants();
  const moodBrands      = brandsForTenant(state, MOOD_SCOPE);
  const royallootBrands = brandsForTenant(state, ROYALLOOT_SCOPE);
  const moodProducts      = productsForTenant(state, MOOD_SCOPE);
  const royallootProducts = productsForTenant(state, ROYALLOOT_SCOPE);
  const okBrands   = moodBrands.length === 1 && moodBrands[0].name === 'mood' &&
                     royallootBrands.length === 1 && royallootBrands[0].name === 'RoyalLoot';
  const okProducts = moodProducts.length === 1 && moodProducts[0].name === 'mood energy' &&
                     royallootProducts.length === 1 && royallootProducts[0].name === 'RoyalLoot · core sku';
  return {
    ok: okBrands && okProducts,
    detail: `MOOD brands=${moodBrands.length}/products=${moodProducts.length} · RoyalLoot brands=${royallootBrands.length}/products=${royallootProducts.length}`,
  };
}

function caseMoodNeverSeesRoyalloot(): { ok: boolean; detail: string } {
  const state = seedTwoTenants();
  const moodBrandSet      = new Set(brandsForTenant(state, MOOD_SCOPE).map((b) => b.brandId));
  const royallootBrands   = brandsForTenant(state, ROYALLOOT_SCOPE);
  const overlap = royallootBrands.filter((b) => moodBrandSet.has(b.brandId));
  return {
    ok: overlap.length === 0,
    detail: overlap.length === 0
      ? 'MOOD brand set contains zero RoyalLoot brand ids'
      : `LEAK: ${overlap.length} RoyalLoot brand id(s) visible to MOOD`,
  };
}

function caseRoyallootNeverSeesMood(): { ok: boolean; detail: string } {
  const state = seedTwoTenants();
  const royallootProductSet = new Set(productsForTenant(state, ROYALLOOT_SCOPE).map((p) => p.productId));
  const moodProducts        = productsForTenant(state, MOOD_SCOPE);
  const overlap = moodProducts.filter((p) => royallootProductSet.has(p.productId));
  return {
    ok: overlap.length === 0,
    detail: overlap.length === 0
      ? 'RoyalLoot product set contains zero MOOD product ids'
      : `LEAK: ${overlap.length} MOOD product id(s) visible to RoyalLoot`,
  };
}

function caseDropdownsAreTenantScoped(): { ok: boolean; detail: string } {
  // The brand selector on the /products page is fed by /api/brand?org=…&wsp=….
  // Simulate the route layer's filter behavior: scoped reads only.
  const state = seedTwoTenants();
  const moodDropdown      = brandsForTenant(state, MOOD_SCOPE).map((b) => b.name).sort();
  const royallootDropdown = brandsForTenant(state, ROYALLOOT_SCOPE).map((b) => b.name).sort();
  return {
    ok: JSON.stringify(moodDropdown) === JSON.stringify(['mood']) &&
        JSON.stringify(royallootDropdown) === JSON.stringify(['RoyalLoot']),
    detail: `MOOD=[${moodDropdown.join(',')}] · RoyalLoot=[${royallootDropdown.join(',')}]`,
  };
}

function caseDuplicateBrandNameAcrossTenantsIsAllowed(): { ok: boolean; detail: string } {
  // Two tenants creating a brand with the same name must both succeed.
  let state = createInitialWorkspaceMemory();
  const p1 = mkProject(MOOD_SCOPE, 'p1', 1000);      state = appendProject(state, p1);
  const p2 = mkProject(ROYALLOOT_SCOPE, 'p2', 1000); state = appendProject(state, p2);
  const moodCore      = mkBrand(MOOD_SCOPE,      p1.projectId, 'core', 1100);
  const royallootCore = mkBrand(ROYALLOOT_SCOPE, p2.projectId, 'core', 1200);
  state = appendBrand(state, moodCore);
  state = appendBrand(state, royallootCore);
  const moodBrands      = brandsForTenant(state, MOOD_SCOPE);
  const royallootBrands = brandsForTenant(state, ROYALLOOT_SCOPE);
  return {
    ok: moodBrands.length === 1 && royallootBrands.length === 1 &&
        moodBrands[0].brandId !== royallootBrands[0].brandId,
    detail: `MOOD core=${moodBrands[0]?.brandId} RoyalLoot core=${royallootBrands[0]?.brandId}`,
  };
}

function caseLegacyRecordsMigrateToMOOD(): { ok: boolean; detail: string } {
  // Persist a workspace-memory.json with NO organizationId/workspaceId and
  // assert the in-memory state after load defaults them to MOOD.
  // Done via the store API by hand.
  return new Promise<{ ok: boolean; detail: string }>(async (resolve) => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'tenant-iso-migrate-'));
    try {
      const legacy = {
        projects: [{ projectId: 'p-legacy', name: 'legacy', createdAt: 1, operatorId: 'op' }],
        brands:   [{ brandId: 'b-legacy', projectId: 'p-legacy', name: 'legacy', createdAt: 1, operatorId: 'op' }],
        products: [{ productId: 'pr-legacy', brandId: 'b-legacy', name: 'legacy', createdAt: 1, operatorId: 'op' }],
        campaigns: [],
        firstUpdatedAt: 1, updatedAt: 1,
      };
      await fs.writeFile(path.join(tmp, 'workspace-memory.json'), JSON.stringify(legacy));
      // Hot-import the store with a fresh global slot.
      const g = globalThis as unknown as { __moodWorkspace?: WorkspaceMemoryState };
      g.__moodWorkspace = undefined;
      const { createWorkspaceMemoryStore } = await import('../lib/workspaceMemory');
      const store = createWorkspaceMemoryStore(tmp);
      const state = await store.read();
      const ok = state.brands.length === 1 &&
                 state.brands[0].organizationId === MOOD_ORG &&
                 state.brands[0].workspaceId === MOOD_WSP &&
                 state.products[0].organizationId === MOOD_ORG &&
                 state.products[0].workspaceId === MOOD_WSP &&
                 state.projects[0].organizationId === MOOD_ORG &&
                 state.projects[0].workspaceId === MOOD_WSP;
      resolve({
        ok,
        detail: ok ? 'legacy records migrated to MOOD defaults'
                   : `migration failed · brand=${JSON.stringify(state.brands[0])}`,
      });
    } finally {
      try { await fs.rm(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
      const g = globalThis as unknown as { __moodWorkspace?: WorkspaceMemoryState };
      g.__moodWorkspace = undefined;
    }
  }) as never as { ok: boolean; detail: string };
}

// ─── end-to-end fast-start via the route ─────────────────────

async function callJsonRoute<T = unknown>(
  handler: (req: Request) => Promise<Response>,
  url: string, method: 'GET' | 'POST', payload?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<{ status: number; body: T }> {
  const init: RequestInit = { method };
  const headers: Record<string, string> = { ...(extraHeaders ?? {}) };
  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(payload);
  }
  if (Object.keys(headers).length > 0) init.headers = headers;
  const res = await handler(new Request(url, init));
  const status = res.status;
  const body = await res.json() as T;
  return { status, body };
}

/** Mint a session for tests that drive protected POSTs.
 *  Creates a user via the userMemory transforms + a session via
 *  the sessionMemory transforms · returns { cookie, userId }. */
async function mintTestSession(email: string): Promise<{ cookie: string; userId: string }> {
  const { hashPassword } = await import('../lib/auth/passwordHash');
  const { createUserMemoryStore, appendUser, newUserId } = await import('../lib/auth/userMemory');
  const { createSessionMemoryStore, appendSession, newSessionId, newSessionToken } = await import('../lib/auth/sessionMemory');
  const { SESSION_COOKIE_NAME } = await import('../lib/auth/cookie');
  const { buildSessionCookieValue } = await import('../lib/auth/resolveSession');

  const userStore = createUserMemoryStore();
  let userState = await userStore.read();
  const { passwordHash, passwordSalt } = hashPassword('test-password-12345');
  const userId = newUserId();
  userState = appendUser(userState, {
    userId, email, displayName: 'test', passwordHash, passwordSalt,
    createdBy: userId, createdAt: Date.now(),
    failedLoginCount: 0, lockedUntil: 0,
  });
  await userStore.save(userState);

  const sessionStore = createSessionMemoryStore();
  let sessionState = await sessionStore.read();
  const sessionId = newSessionId();
  const rawToken = newSessionToken();
  sessionState = appendSession(sessionState, {
    sessionId, userId, rawToken, at: Date.now(),
  });
  await sessionStore.save(sessionState);
  return {
    cookie: `${SESSION_COOKIE_NAME}=${buildSessionCookieValue(sessionId, rawToken)}`,
    userId,
  };
}

/** Mint a user + session + grant an organization membership in
 *  the requested (organizationId, workspaceId). Used by GET-driven
 *  tests so the tenant-scoped read-gate passes. */
async function mintTestSessionWithMembership(
  email: string, organizationId: string, workspaceIds?: string[],
): Promise<string> {
  const { cookie, userId } = await mintTestSession(email);
  const {
    appendMembership, createOrganizationMemoryStore, newMembershipId,
  } = await import('../lib/tenancy/organizationMemory');
  const orgStore = createOrganizationMemoryStore();
  let orgState = await orgStore.read();
  orgState = appendMembership(orgState, {
    membershipId: newMembershipId(),
    organizationId,
    memberId: userId,
    displayName: 'test',
    roles: ['organization-owner'],
    workspaceIds,
    createdAt: Date.now(),
    grantedBy: userId,
  });
  await orgStore.save(orgState);
  return cookie;
}

function resetGlobals(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  for (const k of [
    '__moodWorkspace', '__moodOrganizationMemory',
    '__moodWorkspaceActivation', '__moodWorkflowMemory',
    '__moodUserMemory', '__moodSessionMemory',
  ]) g[k] = undefined;
}

async function caseFastStartScopesPerTenant(): Promise<{ ok: boolean; detail: string }> {
  // Drive the fast-start route handler against a fresh temp memory dir.
  // Reset globals between calls so each request reads fresh state.
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'tenant-iso-fast-'));
  try {
    process.env.MOOD_MEMORY_DIR = tmp;
    resetGlobals();

    // Pre-seed organizations so fast-start picks up the org records
    // (fast-start auto-creates orgs by slug; here we simulate the
    // platform-owner having already registered both tenants).
    const orgStoreMod = await import('../lib/tenancy/organizationMemory');
    let orgState = createInitialOrganizationMemory();
    orgState = appendOrganization(orgState, {
      organizationId: MOOD_ORG, name: 'MOOD', slug: 'mood',
      billingTier: 'unbilled', createdAt: 1000, createdBy: 'plat',
    });
    orgState = appendWorkspace(orgState, {
      workspaceId: MOOD_WSP, organizationId: MOOD_ORG, name: 'MOOD wsp',
      slug: 'default', createdAt: 1000, createdBy: 'plat',
    });
    orgState = appendOrganization(orgState, {
      organizationId: ROYALLOOT_ORG, name: 'RoyalLoot', slug: 'royalloot',
      billingTier: 'unbilled', createdAt: 2000, createdBy: 'plat',
    });
    orgState = appendWorkspace(orgState, {
      workspaceId: ROYALLOOT_WSP, organizationId: ROYALLOOT_ORG, name: 'RoyalLoot wsp',
      slug: 'default', createdAt: 2000, createdBy: 'plat',
    });
    await orgStoreMod.createOrganizationMemoryStore(tmp).save(orgState);

    const fastStart = await import('../app/api/fast-start/route');

    // Each tenant operator mints its own session before driving fast-start.
    // Fast-start POST uses requireSession (not requireTenantSession), so
    // memberships are not required here.
    const { cookie: moodCookie }      = await mintTestSession('op-mood@test.local');
    const { cookie: royallootCookie } = await mintTestSession('op-royalloot@test.local');

    // Drive MOOD.
    const moodReply = (await callJsonRoute<{ ok: boolean; result: { brandId: string; productId: string; organizationId: string } }>(
      fastStart.POST as never, 'http://localhost/api/fast-start', 'POST',
      {
        operatorId: 'op-mood', operatorReason: 'pilot MOOD',
        organizationName: 'MOOD', organizationSlug: 'mood',
        brandName: 'mood-fast', productName: 'mood energy', goalId: 'product-launch',
      },
      { Cookie: moodCookie },
    )).body;

    // Drive RoyalLoot.
    const royallootReply = (await callJsonRoute<{ ok: boolean; result: { brandId: string; productId: string; organizationId: string } }>(
      fastStart.POST as never, 'http://localhost/api/fast-start', 'POST',
      {
        operatorId: 'op-royalloot', operatorReason: 'pilot RoyalLoot',
        organizationName: 'RoyalLoot', organizationSlug: 'royalloot',
        brandName: 'RoyalLoot-fast', productName: 'RoyalLoot core sku', goalId: 'lead-generation',
      },
      { Cookie: royallootCookie },
    )).body;

    if (!moodReply.ok || !royallootReply.ok) {
      return { ok: false, detail: `fast-start failed: mood=${moodReply.ok} royalloot=${royallootReply.ok}` };
    }

    // Confirm tenant scoping post fast-start.
    resetGlobals();
    const { createWorkspaceMemoryStore } = await import('../lib/workspaceMemory');
    const ws = await createWorkspaceMemoryStore(tmp).read();
    const moodBrands      = brandsForTenant(ws, MOOD_SCOPE);
    const royallootBrands = brandsForTenant(ws, ROYALLOOT_SCOPE);
    const moodProducts      = productsForTenant(ws, MOOD_SCOPE);
    const royallootProducts = productsForTenant(ws, ROYALLOOT_SCOPE);
    const moodCampaigns      = campaignsForTenant(ws, MOOD_SCOPE);
    const royallootCampaigns = campaignsForTenant(ws, ROYALLOOT_SCOPE);
    const moodProjects      = projectsForTenant(ws, MOOD_SCOPE);
    const royallootProjects = projectsForTenant(ws, ROYALLOOT_SCOPE);
    const isolated =
      moodBrands.every((b)      => b.organizationId === MOOD_ORG) &&
      royallootBrands.every((b) => b.organizationId === ROYALLOOT_ORG) &&
      moodProducts.every((p)      => p.organizationId === MOOD_ORG) &&
      royallootProducts.every((p) => p.organizationId === ROYALLOOT_ORG) &&
      moodProjects.every((p)      => p.organizationId === MOOD_ORG) &&
      royallootProjects.every((p) => p.organizationId === ROYALLOOT_ORG) &&
      moodReply.result.organizationId === MOOD_ORG &&
      royallootReply.result.organizationId === ROYALLOOT_ORG;

    return {
      ok: isolated,
      detail:
        `mood brands=${moodBrands.length} products=${moodProducts.length} projects=${moodProjects.length} campaigns=${moodCampaigns.length} · ` +
        `royalloot brands=${royallootBrands.length} products=${royallootProducts.length} projects=${royallootProjects.length} campaigns=${royallootCampaigns.length}`,
    };
  } finally {
    try { await fs.rm(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
    delete process.env.MOOD_MEMORY_DIR;
    resetGlobals();
  }
}

// ─── route-driven cross-tenant tests ─────────────────────────

interface BrandRouteListBody { brands: BrandRecord[]; scope?: { organizationId: string; workspaceId: string } }
interface ProductRouteListBody { products: ProductRecord[]; scope?: { organizationId: string; workspaceId: string } }
interface BrandRoutePostBody { ok?: boolean; brand?: BrandRecord; error?: string }
interface ProductRoutePostBody { ok?: boolean; product?: ProductRecord; error?: string }

async function withSeededTwoTenants<T>(
  fn: (tmp: string, scopes: { mood: typeof MOOD_SCOPE; royalloot: typeof ROYALLOOT_SCOPE }) => Promise<T>,
): Promise<T> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'tenant-iso-route-'));
  try {
    process.env.MOOD_MEMORY_DIR = tmp;
    resetGlobals();
    const { createWorkspaceMemoryStore } = await import('../lib/workspaceMemory');
    await createWorkspaceMemoryStore(tmp).save(seedTwoTenants());
    // Seed organization memory so memberships can be granted by the test
    // helper. Both organizations + their workspaces are pre-registered.
    const orgStoreMod = await import('../lib/tenancy/organizationMemory');
    let orgState = createInitialOrganizationMemory();
    orgState = appendOrganization(orgState, {
      organizationId: MOOD_ORG, name: 'MOOD', slug: 'mood',
      billingTier: 'unbilled', createdAt: 1000, createdBy: 'plat',
    });
    orgState = appendWorkspace(orgState, {
      workspaceId: MOOD_WSP, organizationId: MOOD_ORG, name: 'MOOD wsp',
      slug: 'default', createdAt: 1000, createdBy: 'plat',
    });
    orgState = appendOrganization(orgState, {
      organizationId: ROYALLOOT_ORG, name: 'RoyalLoot', slug: 'royalloot',
      billingTier: 'unbilled', createdAt: 2000, createdBy: 'plat',
    });
    orgState = appendWorkspace(orgState, {
      workspaceId: ROYALLOOT_WSP, organizationId: ROYALLOOT_ORG, name: 'RoyalLoot wsp',
      slug: 'default', createdAt: 2000, createdBy: 'plat',
    });
    await orgStoreMod.createOrganizationMemoryStore(tmp).save(orgState);
    resetGlobals();
    return await fn(tmp, { mood: MOOD_SCOPE, royalloot: ROYALLOOT_SCOPE });
  } finally {
    try { await fs.rm(tmp, { recursive: true, force: true }); } catch { /* ignore */ }
    delete process.env.MOOD_MEMORY_DIR;
    resetGlobals();
  }
}

async function caseBrandGETScopedToMOOD(): Promise<{ ok: boolean; detail: string }> {
  return withSeededTwoTenants(async () => {
    const brandRoute = await import('../app/api/brand/route');
    const cookie = await mintTestSessionWithMembership('mood-member@test.local', MOOD_ORG);
    const { body } = await callJsonRoute<BrandRouteListBody>(
      brandRoute.GET as never,
      `http://localhost/api/brand?organizationId=${MOOD_ORG}&workspaceId=${MOOD_WSP}`,
      'GET', undefined,
      { Cookie: cookie },
    );
    const ok = body.brands.length === 1 && body.brands[0].name === 'mood' &&
               body.brands.every((b) => b.organizationId === MOOD_ORG);
    return { ok, detail: `MOOD brands returned: ${body.brands.map((b) => b.name).join(',')}` };
  });
}

async function caseBrandGETScopedToRoyalLoot(): Promise<{ ok: boolean; detail: string }> {
  return withSeededTwoTenants(async () => {
    const brandRoute = await import('../app/api/brand/route');
    const cookie = await mintTestSessionWithMembership('royalloot-member@test.local', ROYALLOOT_ORG);
    const { body } = await callJsonRoute<BrandRouteListBody>(
      brandRoute.GET as never,
      `http://localhost/api/brand?organizationId=${ROYALLOOT_ORG}&workspaceId=${ROYALLOOT_WSP}`,
      'GET', undefined,
      { Cookie: cookie },
    );
    const ok = body.brands.length === 1 && body.brands[0].name === 'RoyalLoot' &&
               body.brands.every((b) => b.organizationId === ROYALLOOT_ORG);
    return { ok, detail: `RoyalLoot brands returned: ${body.brands.map((b) => b.name).join(',')}` };
  });
}

async function caseProductGETScopedToMOOD(): Promise<{ ok: boolean; detail: string }> {
  return withSeededTwoTenants(async () => {
    const productRoute = await import('../app/api/product/route');
    const cookie = await mintTestSessionWithMembership('mood-pmember@test.local', MOOD_ORG);
    const { body } = await callJsonRoute<ProductRouteListBody>(
      productRoute.GET as never,
      `http://localhost/api/product?organizationId=${MOOD_ORG}&workspaceId=${MOOD_WSP}`,
      'GET', undefined,
      { Cookie: cookie },
    );
    const ok = body.products.length === 1 && body.products[0].name === 'mood energy' &&
               body.products.every((p) => p.organizationId === MOOD_ORG);
    return { ok, detail: `MOOD products returned: ${body.products.map((p) => p.name).join(',')}` };
  });
}

async function caseProductGETScopedToRoyalLoot(): Promise<{ ok: boolean; detail: string }> {
  return withSeededTwoTenants(async () => {
    const productRoute = await import('../app/api/product/route');
    const cookie = await mintTestSessionWithMembership('royalloot-pmember@test.local', ROYALLOOT_ORG);
    const { body } = await callJsonRoute<ProductRouteListBody>(
      productRoute.GET as never,
      `http://localhost/api/product?organizationId=${ROYALLOOT_ORG}&workspaceId=${ROYALLOOT_WSP}`,
      'GET', undefined,
      { Cookie: cookie },
    );
    const ok = body.products.length === 1 && body.products[0].name === 'RoyalLoot · core sku' &&
               body.products.every((p) => p.organizationId === ROYALLOOT_ORG);
    return { ok, detail: `RoyalLoot products returned: ${body.products.map((p) => p.name).join(',')}` };
  });
}

async function caseSameBrandNameBlockedInSameTenant(): Promise<{ ok: boolean; detail: string }> {
  return withSeededTwoTenants(async () => {
    const brandRoute = await import('../app/api/brand/route');
    // POST uses requireSession; the final GET needs membership. One cookie with membership covers both.
    const cookie = await mintTestSessionWithMembership('brand-dup@test.local', MOOD_ORG);
    // First create succeeds.
    const r1 = (await callJsonRoute<BrandRoutePostBody>(
      brandRoute.POST as never, 'http://localhost/api/brand', 'POST',
      {
        action: 'create', operatorId: 'op', operatorReason: 'first',
        organizationId: MOOD_ORG, workspaceId: MOOD_WSP, name: 'duplicate-target',
      },
      { Cookie: cookie },
    )).body;
    const id1 = r1.brand?.brandId;
    // Second create in same tenant returns the SAME record (idempotency
    // returns existing rather than creating a duplicate).
    const r2 = (await callJsonRoute<BrandRoutePostBody>(
      brandRoute.POST as never, 'http://localhost/api/brand', 'POST',
      {
        action: 'create', operatorId: 'op', operatorReason: 'second',
        organizationId: MOOD_ORG, workspaceId: MOOD_WSP, name: 'duplicate-target',
      },
      { Cookie: cookie },
    )).body;
    const id2 = r2.brand?.brandId;
    // Confirm only one brand with that name exists in MOOD.
    const list = (await callJsonRoute<BrandRouteListBody>(
      brandRoute.GET as never,
      `http://localhost/api/brand?organizationId=${MOOD_ORG}&workspaceId=${MOOD_WSP}`,
      'GET', undefined,
      { Cookie: cookie },
    )).body;
    const matches = list.brands.filter((b) => b.name === 'duplicate-target');
    return {
      ok: !!id1 && id1 === id2 && matches.length === 1,
      detail: `id1=${id1} id2=${id2} matches=${matches.length} (idempotent → no duplicate created)`,
    };
  });
}

async function caseProductCannotAttachCrossTenantBrand(): Promise<{ ok: boolean; detail: string }> {
  return withSeededTwoTenants(async (tmp) => {
    // Find RoyalLoot's brand id by reading the seeded state directly —
    // the attacker (MOOD-only member) can't read RoyalLoot brands via
    // the GET route now, but we need the id for the test setup.
    const productRoute = await import('../app/api/product/route');
    const { createWorkspaceMemoryStore, brandsForTenant } = await import('../lib/workspaceMemory');
    const ws = await createWorkspaceMemoryStore(tmp).read();
    const royallootBrands = brandsForTenant(ws, ROYALLOOT_SCOPE);
    if (royallootBrands.length === 0) return { ok: false, detail: 'no RoyalLoot brand in seed' };
    const targetBrandId = royallootBrands[0].brandId;
    // Attacker session has membership in MOOD only (POST uses requireSession not requireTenantSession).
    const { cookie: attackerCookie } = await mintTestSession('attacker@test.local');
    const res = await productRoute.POST(new Request('http://localhost/api/product', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: attackerCookie },
      body: JSON.stringify({
        action: 'create', operatorId: 'op-mood-attacker', operatorReason: 'cross-tenant attack',
        organizationId: MOOD_ORG, workspaceId: MOOD_WSP,
        brandId: targetBrandId, name: 'attack-product',
      }),
    }) as never);
    const body = await res.json() as ProductRoutePostBody;
    return {
      ok: res.status === 404 && /not found in this tenant/i.test(body.error ?? ''),
      detail: `status=${res.status} error=${body.error ?? '(none)'}`,
    };
  });
}

async function caseWorkspaceContextNoLeakage(): Promise<{ ok: boolean; detail: string }> {
  return withSeededTwoTenants(async () => {
    const route = await import('../app/api/workspace-context/route');
    const moodCookie      = await mintTestSessionWithMembership('wc-mood@test.local',      MOOD_ORG);
    const royallootCookie = await mintTestSessionWithMembership('wc-royalloot@test.local', ROYALLOOT_ORG);
    const moodRes = (await callJsonRoute<{
      context: { brandLabel: string | null; productLabel: string | null };
      counts: { brands: number; products: number };
    }>(
      route.GET as never,
      `http://localhost/api/workspace-context?organizationId=${MOOD_ORG}&workspaceId=${MOOD_WSP}`,
      'GET', undefined,
      { Cookie: moodCookie },
    )).body;
    const royallootRes = (await callJsonRoute<{
      context: { brandLabel: string | null; productLabel: string | null };
      counts: { brands: number; products: number };
    }>(
      route.GET as never,
      `http://localhost/api/workspace-context?organizationId=${ROYALLOOT_ORG}&workspaceId=${ROYALLOOT_WSP}`,
      'GET', undefined,
      { Cookie: royallootCookie },
    )).body;
    const ok =
      moodRes.context.brandLabel === 'mood' &&
      moodRes.context.productLabel === 'mood energy' &&
      moodRes.counts.brands === 1 && moodRes.counts.products === 1 &&
      royallootRes.context.brandLabel === 'RoyalLoot' &&
      royallootRes.context.productLabel === 'RoyalLoot · core sku' &&
      royallootRes.counts.brands === 1 && royallootRes.counts.products === 1;
    return {
      ok,
      detail:
        `MOOD context=${moodRes.context.brandLabel}/${moodRes.context.productLabel} counts=${moodRes.counts.brands}/${moodRes.counts.products} · ` +
        `RoyalLoot context=${royallootRes.context.brandLabel}/${royallootRes.context.productLabel} counts=${royallootRes.counts.brands}/${royallootRes.counts.products}`,
    };
  });
}

async function caseExecutiveDashboardNoLeakage(): Promise<{ ok: boolean; detail: string }> {
  return withSeededTwoTenants(async () => {
    const route = await import('../app/api/executive-dashboard/route');
    const moodCookie      = await mintTestSessionWithMembership('ed-mood@test.local',      MOOD_ORG);
    const royallootCookie = await mintTestSessionWithMembership('ed-royalloot@test.local', ROYALLOOT_ORG);
    const moodRes = (await callJsonRoute<{
      workspace: { snapshot?: { totals?: { brands: number; products: number; campaigns: number; projects: number } } };
      raw?: { brands: BrandRecord[]; products: ProductRecord[] };
    }>(
      route.GET as never,
      `http://localhost/api/executive-dashboard?organizationId=${MOOD_ORG}&workspaceId=${MOOD_WSP}`,
      'GET', undefined,
      { Cookie: moodCookie },
    )).body;
    const royallootRes = (await callJsonRoute<{
      workspace: { snapshot?: { totals?: { brands: number; products: number; campaigns: number; projects: number } } };
      raw?: { brands: BrandRecord[]; products: ProductRecord[] };
    }>(
      route.GET as never,
      `http://localhost/api/executive-dashboard?organizationId=${ROYALLOOT_ORG}&workspaceId=${ROYALLOOT_WSP}`,
      'GET', undefined,
      { Cookie: royallootCookie },
    )).body;
    // The composed workspace count must be tenant-scoped. We can't depend
    // on the snapshot.totals shape (downstream engine), so we fall back to
    // a JSON-string substring check: MOOD response must NOT contain 'RoyalLoot'
    // and RoyalLoot response must NOT contain '"mood"' as a brand name.
    const moodJson = JSON.stringify(moodRes);
    const royallootJson = JSON.stringify(royallootRes);
    const moodLeaksRoyalloot = /RoyalLoot/.test(moodJson);
    const royallootLeaksMood = /"name":\s*"mood"/.test(royallootJson) ||
                                /"name":\s*"mood energy"/.test(royallootJson);
    const ok = !moodLeaksRoyalloot && !royallootLeaksMood;
    return {
      ok,
      detail: ok
        ? 'MOOD dashboard contains no RoyalLoot · RoyalLoot dashboard contains no MOOD'
        : `LEAK · moodLeaksRoyalloot=${moodLeaksRoyalloot} royallootLeaksMood=${royallootLeaksMood}`,
    };
  });
}

// ─── runner ──────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('TENANT ISOLATION HARDENING VERIFICATION\n');
  const sync: Array<[string, string, () => { ok: boolean; detail: string }]> = [
    ['scope-helpers',          'brandsForTenant + productsForTenant filter strictly',           () => caseTenantScopingHelpersFilter()],
    ['mood-no-royalloot',      'MOOD never sees RoyalLoot brand ids',                            () => caseMoodNeverSeesRoyalloot()],
    ['royalloot-no-mood',      'RoyalLoot never sees MOOD product ids',                          () => caseRoyallootNeverSeesMood()],
    ['dropdowns-scoped',       'brand-selector dropdowns are tenant-scoped',                     () => caseDropdownsAreTenantScoped()],
    ['cross-tenant-dup-name',  'same brand name is allowed across tenants without conflict',     () => caseDuplicateBrandNameAcrossTenantsIsAllowed()],
  ];
  for (const [id, label, fn] of sync) {
    let r: { ok: boolean; detail: string };
    try { r = fn(); }
    catch (err) { r = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, r.ok, r.detail);
  }

  // Async / I/O cases.
  const asyncCases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }>]> = [
    ['brand-get-mood-scope',           'MOOD GET /api/brand returns only MOOD brands',           caseBrandGETScopedToMOOD],
    ['brand-get-royalloot-scope',      'RoyalLoot GET /api/brand returns only RoyalLoot brands', caseBrandGETScopedToRoyalLoot],
    ['product-get-mood-scope',         'MOOD GET /api/product returns only MOOD products',       caseProductGETScopedToMOOD],
    ['product-get-royalloot-scope',    'RoyalLoot GET /api/product returns only RoyalLoot products', caseProductGETScopedToRoyalLoot],
    ['same-name-blocked-same-tenant',  'same brand name returns existing record inside same tenant (no duplicate)', caseSameBrandNameBlockedInSameTenant],
    ['cross-tenant-attach-rejected',   'POST /api/product rejects attaching to a brand owned by another tenant', caseProductCannotAttachCrossTenantBrand],
    ['workspace-context-no-leak',      'GET /api/workspace-context leaks zero cross-tenant data', caseWorkspaceContextNoLeakage],
    ['executive-dashboard-no-leak',    'GET /api/executive-dashboard leaks zero cross-tenant data', caseExecutiveDashboardNoLeakage],
    ['fast-start-isolation',           'fast-start scopes every record by (organizationId, workspaceId)', caseFastStartScopesPerTenant],
  ];
  for (const [id, label, fn] of asyncCases) {
    let r: { ok: boolean; detail: string };
    try { r = await fn(); }
    catch (err) { r = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, r.ok, r.detail);
  }

  // Migration case (uses temp dir + dynamic import).
  try {
    const r = await (caseLegacyRecordsMigrateToMOOD() as unknown as Promise<{ ok: boolean; detail: string }>);
    record('legacy-migration', 'legacy records without tenancy stamp migrate to MOOD defaults', r.ok, r.detail);
  } catch (err) {
    record('legacy-migration', 'legacy records without tenancy stamp migrate to MOOD defaults',
      false, `case threw: ${(err as Error).message}`);
  }

  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((err) => { console.error('verification crashed:', err); process.exit(2); });
