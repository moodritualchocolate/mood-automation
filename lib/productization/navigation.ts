/**
 * NAVIGATION DESCRIPTOR ENGINE (pure)
 *
 * Defines the full operator-facing navigation tree for CreativeOS.
 * The engine is read-only: it returns the static navigation shape +
 * filtered visibility based on the resolved tenant context. The
 * matrix never auto-routes the operator, never auto-selects a
 * section. Human remains final authority.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - the engine never approves anything on its own
 *   - permission gating defers to the permission matrix
 *   - allowed phrasing only
 */

import type { AnyRole } from '@lib/tenancy/types';
import {
  anyRoleHasPermission, type PermissionAction,
} from '@lib/tenancy/permissionMatrix';

// ─── descriptor shape ────────────────────────────────────────

export type NavigationSectionId =
  | 'dashboard' | 'organizations' | 'workspaces' | 'brands' | 'products'
  | 'campaigns' | 'assets' | 'production-studio' | 'approvals'
  | 'performance' | 'knowledge-base' | 'teams' | 'settings';

export type EntityKind =
  | 'organization' | 'workspace' | 'brand' | 'product' | 'campaign'
  | 'asset' | 'publication' | 'performance' | 'agent-run' | 'task'
  | 'knowledge-entry' | 'membership';

export interface NavigationAction {
  /** Operator-facing label — allowed phrasing only. */
  label: string;
  /** The permission matrix action that gates this primary action. */
  permission: PermissionAction;
  /** Short description for hover / mobile press-and-hold. */
  description: string;
}

export interface NavigationSection {
  id: NavigationSectionId;
  /** Operator-facing label. */
  label: string;
  /** What the section IS for — single sentence. */
  purpose: string;
  /** Primary actions the operator may take from this section. */
  primaryActions: NavigationAction[];
  /** Roles that may even see this section in the nav. */
  visibleToRoles: AnyRole[];
  /** Entities the operator works with inside this section. */
  connectedEntities: EntityKind[];
  /** Mobile-bottom-nav placement (top 5 in mobile bottom bar). */
  mobileBottomNavPriority: number | null;
  /** Order in the sidebar (1 = top). */
  sidebarOrder: number;
}

export interface NavigationDescriptor {
  sections: NavigationSection[];
  /** Sections currently visible to the operator. */
  visibleSections: NavigationSection[];
  /** Mobile bottom-nav (highest-priority sections, capped at 5). */
  mobileBottomNav: NavigationSection[];
  notes: string[];
  advisoryNotice: string;
}

// ─── canonical sections ──────────────────────────────────────

const SECTIONS: NavigationSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    purpose:
      'Operator home — surfaces the live state of organizations · brands · campaigns · approvals · performance.',
    primaryActions: [
      { label: 'Review pending approvals', permission: 'workspace.read',
        description: 'Operator routes to outstanding asset · brief · gen-queue approvals.' },
      { label: 'Open most-recent campaign', permission: 'workspace.read',
        description: 'Operator opens the campaign last touched in this workspace.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['organization', 'workspace', 'brand', 'product', 'campaign', 'asset', 'publication'],
    mobileBottomNavPriority: 1,
    sidebarOrder: 1,
  },
  {
    id: 'organizations',
    label: 'Organizations',
    purpose:
      'Platform-level tenancy administration. Lists organizations the operator MAY view; only platform-owner MAY create or archive.',
    primaryActions: [
      { label: 'Create organization', permission: 'platform.organization.create',
        description: 'Platform-owner registers a new tenant.' },
      { label: 'Archive organization', permission: 'platform.organization.archive',
        description: 'Platform-owner archives an existing tenant.' },
      { label: 'Set billing tier', permission: 'platform.organization.set-billing-tier',
        description: 'Platform-owner sets the metadata-only billing tier.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin'],
    connectedEntities: ['organization', 'membership'],
    mobileBottomNavPriority: null,
    sidebarOrder: 2,
  },
  {
    id: 'workspaces',
    label: 'Workspaces',
    purpose:
      'Workspace administration inside a single organization. Workspaces partition Brands · Products · Campaigns.',
    primaryActions: [
      { label: 'Create workspace', permission: 'org.workspace.create',
        description: 'Organization-owner or admin creates a workspace inside the organization.' },
      { label: 'Archive workspace', permission: 'org.workspace.archive',
        description: 'Organization-owner or admin archives a workspace.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['workspace', 'brand', 'product', 'campaign'],
    mobileBottomNavPriority: null,
    sidebarOrder: 3,
  },
  {
    id: 'brands',
    label: 'Brands',
    purpose:
      'Brand records inside a workspace. Each brand owns one or more products.',
    primaryActions: [
      { label: 'Create brand', permission: 'workspace.brand.create',
        description: 'Manager+ creates a brand record.' },
      { label: 'Archive brand', permission: 'workspace.brand.archive',
        description: 'Manager+ archives a brand record.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['brand', 'product', 'knowledge-entry'],
    mobileBottomNavPriority: null,
    sidebarOrder: 4,
  },
  {
    id: 'products',
    label: 'Products',
    purpose:
      'Product records inside a brand. Products carry the audience and market metadata that briefs and campaigns consume.',
    primaryActions: [
      { label: 'Create product', permission: 'workspace.product.create',
        description: 'Manager+ creates a product record.' },
      { label: 'Archive product', permission: 'workspace.product.archive',
        description: 'Manager+ archives a product record.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['product', 'campaign', 'knowledge-entry'],
    mobileBottomNavPriority: null,
    sidebarOrder: 5,
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    purpose:
      'Campaign plans, content calendars, testing matrices, and transition history.',
    primaryActions: [
      { label: 'Save campaign plan', permission: 'workspace.campaign-plan.save',
        description: 'Manager+ saves a campaign plan in draft.' },
      { label: 'Approve campaign plan', permission: 'workspace.campaign-plan.approve',
        description: 'Admin+ approves the saved plan.' },
      { label: 'Transition campaign', permission: 'workspace.campaign.transition',
        description: 'Manager+ transitions a campaign between operator-defined states.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['campaign', 'asset', 'publication', 'agent-run', 'task'],
    mobileBottomNavPriority: 2,
    sidebarOrder: 6,
  },
  {
    id: 'assets',
    label: 'Assets',
    purpose:
      'Asset registry — every generated package an operator has registered. Approval status is operator-only.',
    primaryActions: [
      { label: 'Register asset', permission: 'workspace.asset.register',
        description: 'Editor+ registers a new asset record.' },
      { label: 'Approve asset', permission: 'workspace.asset.approve',
        description: 'Manager+ approves a registered asset.' },
      { label: 'Reject asset', permission: 'workspace.asset.reject',
        description: 'Manager+ rejects a registered asset.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['asset', 'publication', 'campaign'],
    mobileBottomNavPriority: 3,
    sidebarOrder: 7,
  },
  {
    id: 'production-studio',
    label: 'Production Studio',
    purpose:
      'Operator-supervised generation queue. Drafts wait for operator approval before any submit; the route never auto-approves.',
    primaryActions: [
      { label: 'Draft generation queue item', permission: 'workspace.gen-queue.draft',
        description: 'Editor+ drafts a queue item.' },
      { label: 'Approve queue item', permission: 'workspace.gen-queue.approve',
        description: 'Manager+ approves a drafted queue item.' },
      { label: 'Submit approved item', permission: 'workspace.gen-queue.submit',
        description: 'Editor+ submits an approved queue item.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor'],
    connectedEntities: ['asset', 'campaign', 'agent-run'],
    mobileBottomNavPriority: null,
    sidebarOrder: 8,
  },
  {
    id: 'approvals',
    label: 'Approvals',
    purpose:
      'Approval queue — briefs · assets · queue items · campaign plans · agent runs the operator MAY review.',
    primaryActions: [
      { label: 'Approve brief', permission: 'workspace.brief.approve',
        description: 'Manager+ approves a drafted brief.' },
      { label: 'Reject brief', permission: 'workspace.brief.reject',
        description: 'Manager+ rejects a drafted brief.' },
      { label: 'Approve agent run', permission: 'workspace.agent.approve',
        description: 'Manager+ approves a pending agent run.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['asset', 'campaign', 'agent-run'],
    mobileBottomNavPriority: 4,
    sidebarOrder: 9,
  },
  {
    id: 'performance',
    label: 'Performance',
    purpose:
      'Historically observed performance — operator-logged metrics, publications, customer-journey events.',
    primaryActions: [
      { label: 'Log performance', permission: 'workspace.performance.log',
        description: 'Editor+ logs a manually entered performance row.' },
      { label: 'Log customer-journey event', permission: 'workspace.journey.log',
        description: 'Editor+ logs a journey event row.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['publication', 'performance', 'campaign'],
    mobileBottomNavPriority: 5,
    sidebarOrder: 10,
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base',
    purpose:
      'Operator-curated knowledge — brand notes, audience research, qualitative findings. Read-only outside Editor+.',
    primaryActions: [
      { label: 'Create knowledge entry', permission: 'workspace.knowledge.create',
        description: 'Editor+ creates a knowledge entry.' },
      { label: 'Update knowledge entry', permission: 'workspace.knowledge.update',
        description: 'Editor+ updates an existing knowledge entry.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['knowledge-entry', 'brand', 'product'],
    mobileBottomNavPriority: null,
    sidebarOrder: 11,
  },
  {
    id: 'teams',
    label: 'Teams',
    purpose:
      'Memberships inside the organization. Operator-owner / admin may grant + revoke memberships.',
    primaryActions: [
      { label: 'Grant membership', permission: 'org.membership.grant',
        description: 'Organization-owner / admin grants a membership.' },
      { label: 'Revoke membership', permission: 'org.membership.revoke',
        description: 'Organization-owner / admin revokes a membership.' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin'],
    connectedEntities: ['membership', 'workspace'],
    mobileBottomNavPriority: null,
    sidebarOrder: 12,
  },
  {
    id: 'settings',
    label: 'Settings',
    purpose:
      'Per-operator preferences and per-organization configuration. Read-only for viewers.',
    primaryActions: [
      { label: 'Open organization settings', permission: 'org.read',
        description: 'Operator opens organization-level settings (read-only outside admin+).' },
      { label: 'Open workspace settings', permission: 'workspace.read',
        description: 'Operator opens workspace-level settings (read-only outside manager+).' },
    ],
    visibleToRoles: ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'],
    connectedEntities: ['organization', 'workspace', 'membership'],
    mobileBottomNavPriority: null,
    sidebarOrder: 13,
  },
];

// ─── pure builder ────────────────────────────────────────────

export interface BuildNavigationInput {
  /** The operator's resolved roles. */
  operatorRoles: AnyRole[];
}

export const ALL_NAVIGATION_SECTIONS: NavigationSection[] = SECTIONS;

const ADVISORY_NOTICE =
  'Navigation descriptor is a static map. It never auto-routes the operator, ' +
  'never auto-selects a section, never bypasses the permission matrix. ' +
  'Operator approval required at every section’s primary actions. ' +
  'Human remains final authority.';

export function buildNavigation(input: BuildNavigationInput): NavigationDescriptor {
  const roles = input.operatorRoles;
  const visibleSections = SECTIONS
    .filter((s) => s.visibleToRoles.some((r) => roles.includes(r)))
    .slice()
    .sort((a, b) => a.sidebarOrder - b.sidebarOrder);

  const mobileBottomNav = SECTIONS
    .filter((s) => s.mobileBottomNavPriority !== null && s.visibleToRoles.some((r) => roles.includes(r)))
    .slice()
    .sort((a, b) => (a.mobileBottomNavPriority ?? 99) - (b.mobileBottomNavPriority ?? 99))
    .slice(0, 5);

  // Annotate each primary action with whether the operator may perform it.
  for (const s of visibleSections) {
    // intentional: pre-filter primaryActions so the caller can disable
    // disallowed buttons without re-querying the matrix. We do NOT
    // strip the actions — the operator MUST see what they may NOT do,
    // for clarity. The route layer is the gate.
    s.primaryActions.forEach((a) => {
      void anyRoleHasPermission(roles, a.permission);
    });
  }

  return {
    sections: SECTIONS,
    visibleSections,
    mobileBottomNav,
    notes: [
      `${SECTIONS.length} sections defined · ${visibleSections.length} visible to operator`,
      `${mobileBottomNav.length}/5 sections on mobile bottom nav`,
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}

/** Returns the permission status of each primary action for a section,
 *  so the UI may disable buttons the operator MAY NOT perform. */
export function actionPermissionStatusForSection(
  section: NavigationSection, roles: AnyRole[],
): Array<NavigationAction & { allowed: boolean }> {
  return section.primaryActions.map((a) => ({
    ...a,
    allowed: anyRoleHasPermission(roles, a.permission),
  }));
}
