/**
 * TENANCY TYPES (shared)
 *
 * The platform is multi-tenant SaaS. MOOD is Tenant #1.
 *
 * Every entity in the system MUST belong to an Organization. The
 * Organization → Workspace → Brand → Product → Campaign → Asset →
 * Publication → Performance hierarchy is the canonical entity tree.
 *
 * STRICT CONTRACT:
 *   - no I/O in this module
 *   - no external API references
 *   - existing entities continue to work as Tenant #1 (MOOD).
 *     Future entity writes MUST carry organizationId + workspaceId
 *     at the route layer.
 *   - Human remains final authority
 */

// ─── platform constants ──────────────────────────────────────

/** The default organization id used when an entity was created before
 *  the tenancy layer existed (i.e. MOOD's legacy data). All existing
 *  memories continue to work under this organization id. */
export const PLATFORM_TENANT_ID_MOOD = 'org-mood';

/** The default workspace id used when an entity was created before
 *  the tenancy layer existed. */
export const PLATFORM_WORKSPACE_ID_MOOD = 'wsp-mood-default';

// ─── platform roles ──────────────────────────────────────────

export type PlatformRole = 'platform-owner';

// ─── organization roles ──────────────────────────────────────

export type OrganizationRole =
  | 'organization-owner'
  | 'admin'
  | 'manager'
  | 'editor'
  | 'viewer';

export type AnyRole = PlatformRole | OrganizationRole;

export const PLATFORM_ROLES: PlatformRole[] = ['platform-owner'];
export const ORGANIZATION_ROLES: OrganizationRole[] = [
  'organization-owner', 'admin', 'manager', 'editor', 'viewer',
];
export const ALL_ROLES: AnyRole[] = [...PLATFORM_ROLES, ...ORGANIZATION_ROLES];

// ─── billing tier (architecture-only placeholder) ────────────

/** Architecture-only billing tier label. The tenancy layer NEVER
 *  charges, NEVER calls a payment provider, NEVER enforces limits
 *  on tier transitions. The tier is a metadata field reserved as a
 *  future extension point. */
export type BillingTier = 'unbilled' | 'starter' | 'growth' | 'scale' | 'enterprise';

export const BILLING_TIERS: BillingTier[] = [
  'unbilled', 'starter', 'growth', 'scale', 'enterprise',
];

// ─── organization + workspace ────────────────────────────────

export interface OrganizationRecord {
  organizationId: string;
  name: string;
  /** Slug used in URLs (operator-validated; never auto-generated). */
  slug: string;
  /** Architecture-only billing tier. */
  billingTier: BillingTier;
  createdAt: number;
  /** Platform-operator who created the org. */
  createdBy: string;
  archivedAt?: number;
  operatorNote?: string;
}

export interface WorkspaceRecord {
  workspaceId: string;
  organizationId: string;
  name: string;
  slug: string;
  createdAt: number;
  createdBy: string;
  archivedAt?: number;
  operatorNote?: string;
}

// ─── membership ──────────────────────────────────────────────

export interface MembershipRecord {
  membershipId: string;
  organizationId: string;
  /** Stable, anonymized operator identifier (NOT email/PII at this
   *  layer — auth is the operator's responsibility downstream). */
  memberId: string;
  /** Human-friendly display name (operator-provided). */
  displayName: string;
  /** Org roles the member holds inside THIS organization. The
   *  platform-owner role is GLOBAL and stored separately. */
  roles: OrganizationRole[];
  /** Optional workspace-level scope. Empty = all workspaces in the org. */
  workspaceIds?: string[];
  createdAt: number;
  /** Platform-/org-operator who granted this membership. */
  grantedBy: string;
  revokedAt?: number;
  operatorNote?: string;
}

// ─── tenant context (resolved at the route layer) ────────────

/** The resolved tenant context for a single request. Routes call
 *  `resolveTenantContext(...)` to produce this, then pass it to
 *  `enforceTenantBoundary(...)` before any read or write. */
export interface TenantContext {
  organizationId: string;
  workspaceId: string | null;
  /** Resolved roles for the requesting operator. */
  platformRoles: PlatformRole[];
  organizationRoles: OrganizationRole[];
  /** True when the operator is acting as the platform owner. */
  isPlatformOwner: boolean;
  /** True when the operator has at least one role in the resolved
   *  organization. */
  isOrganizationMember: boolean;
  resolvedAt: number;
}

// ─── entity ownership stamps ─────────────────────────────────

/** Every entity created AFTER the tenancy layer MUST carry these
 *  fields. Existing entities default to MOOD via PLATFORM_TENANT_ID_MOOD. */
export interface TenantOwnership {
  organizationId: string;
  workspaceId: string;
}

// ─── platform-level errors ───────────────────────────────────

export class TenantBoundaryError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'TenantBoundaryError';
    this.code = code;
  }
}
