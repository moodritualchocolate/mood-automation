/**
 * ENTITY PAGE DESCRIPTOR (pure)
 *
 * Static UI specification for every entity page: Organization · Brand ·
 * Product · Campaign · Asset · Performance. The descriptor is read by
 * page shells to lay out the six standard tabs (Overview · Relations ·
 * History · Approvals · Activity · Attachments). The engine never
 * fetches data on behalf of a page; the route layer does that and
 * passes content into the panel shape.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - descriptors never auto-fetch
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { PermissionAction } from '@lib/tenancy/permissionMatrix';
import type { AnyRole } from '@lib/tenancy/types';
import { anyRoleHasPermission } from '@lib/tenancy/permissionMatrix';
import type { EntityKind } from './navigation';

// ─── panel shape ─────────────────────────────────────────────

export type EntityPanelId =
  | 'overview' | 'relations' | 'history'
  | 'approvals' | 'activity' | 'attachments';

export interface EntityPanel {
  id: EntityPanelId;
  label: string;
  /** Short description for hover / mobile press-and-hold. */
  description: string;
  /** Read permission gating this panel. */
  readPermission: PermissionAction;
  /** Default panel order on desktop (1 = leftmost). */
  desktopOrder: number;
  /** Default panel order on mobile (1 = topmost). */
  mobileOrder: number;
}

const STANDARD_PANELS: EntityPanel[] = [
  {
    id: 'overview', label: 'Overview',
    description: 'Operator-facing summary of the entity (name · slug · status · tenancy stamp · created-at).',
    readPermission: 'workspace.read', desktopOrder: 1, mobileOrder: 1,
  },
  {
    id: 'relations', label: 'Relations',
    description: 'Parent + child entities the entity is connected to. Read-only.',
    readPermission: 'workspace.read', desktopOrder: 2, mobileOrder: 2,
  },
  {
    id: 'history', label: 'History',
    description: 'Historically observed state transitions, operator-supervised.',
    readPermission: 'workspace.read', desktopOrder: 3, mobileOrder: 4,
  },
  {
    id: 'approvals', label: 'Approvals',
    description: 'Operator approvals + rejections that touched this entity.',
    readPermission: 'workspace.read', desktopOrder: 4, mobileOrder: 3,
  },
  {
    id: 'activity', label: 'Activity',
    description: 'Recent operator-driven activity inside this entity (last 50 events).',
    readPermission: 'workspace.read', desktopOrder: 5, mobileOrder: 5,
  },
  {
    id: 'attachments', label: 'Attachments',
    description: 'Operator-registered attachments (asset blobs · knowledge entries · briefs).',
    readPermission: 'workspace.read', desktopOrder: 6, mobileOrder: 6,
  },
];

// ─── per-entity descriptor ───────────────────────────────────

export interface EntityPageDescriptor {
  entityKind: EntityKind;
  /** Operator-facing label for the entity kind. */
  label: string;
  /** Panels rendered on the entity page (always the 6 standard panels). */
  panels: EntityPanel[];
  /** Primary actions across the page (e.g. archive, transition). */
  primaryActions: Array<{
    label: string;
    permission: PermissionAction;
    description: string;
  }>;
  /** Parent entities (where this entity lives in the hierarchy). */
  parentEntities: EntityKind[];
  /** Child entities (where this entity lists into the hierarchy). */
  childEntities: EntityKind[];
}

const ENTITY_PAGES: Record<EntityKind, EntityPageDescriptor> = {
  organization: {
    entityKind: 'organization', label: 'Organization', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Archive organization', permission: 'platform.organization.archive',
        description: 'Platform-owner archives this organization.' },
      { label: 'Set billing tier', permission: 'platform.organization.set-billing-tier',
        description: 'Platform-owner sets billing-tier metadata.' },
    ],
    parentEntities: [],
    childEntities: ['workspace', 'membership'],
  },
  workspace: {
    entityKind: 'workspace', label: 'Workspace', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Archive workspace', permission: 'org.workspace.archive',
        description: 'Organization-owner / admin archives this workspace.' },
    ],
    parentEntities: ['organization'],
    childEntities: ['brand', 'product', 'campaign'],
  },
  brand: {
    entityKind: 'brand', label: 'Brand', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Archive brand', permission: 'workspace.brand.archive',
        description: 'Manager+ archives this brand.' },
    ],
    parentEntities: ['workspace'],
    childEntities: ['product', 'campaign', 'knowledge-entry'],
  },
  product: {
    entityKind: 'product', label: 'Product', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Archive product', permission: 'workspace.product.archive',
        description: 'Manager+ archives this product.' },
    ],
    parentEntities: ['brand'],
    childEntities: ['campaign', 'knowledge-entry'],
  },
  campaign: {
    entityKind: 'campaign', label: 'Campaign', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Transition campaign', permission: 'workspace.campaign.transition',
        description: 'Manager+ transitions this campaign between states.' },
      { label: 'Approve campaign plan', permission: 'workspace.campaign-plan.approve',
        description: 'Admin+ approves the saved campaign plan.' },
    ],
    parentEntities: ['workspace', 'product'],
    childEntities: ['asset', 'publication', 'agent-run', 'task'],
  },
  asset: {
    entityKind: 'asset', label: 'Asset', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Approve asset', permission: 'workspace.asset.approve',
        description: 'Manager+ approves this asset.' },
      { label: 'Reject asset', permission: 'workspace.asset.reject',
        description: 'Manager+ rejects this asset.' },
      { label: 'Archive asset', permission: 'workspace.asset.archive',
        description: 'Manager+ archives this asset.' },
    ],
    parentEntities: ['campaign'],
    childEntities: ['publication'],
  },
  publication: {
    entityKind: 'publication', label: 'Publication', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Transition publication', permission: 'workspace.publication.transition',
        description: 'Manager+ transitions the publication.' },
    ],
    parentEntities: ['asset'],
    childEntities: ['performance'],
  },
  performance: {
    entityKind: 'performance', label: 'Performance', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Log performance', permission: 'workspace.performance.log',
        description: 'Editor+ logs a manually entered performance row.' },
    ],
    parentEntities: ['publication'],
    childEntities: [],
  },
  'agent-run': {
    entityKind: 'agent-run', label: 'Agent Run', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Approve agent run', permission: 'workspace.agent.approve',
        description: 'Manager+ approves this run.' },
      { label: 'Reject agent run', permission: 'workspace.agent.reject',
        description: 'Manager+ rejects this run.' },
    ],
    parentEntities: ['campaign'],
    childEntities: [],
  },
  task: {
    entityKind: 'task', label: 'Task', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Transition task', permission: 'workspace.task.transition',
        description: 'Editor+ transitions the task.' },
    ],
    parentEntities: ['campaign'],
    childEntities: [],
  },
  'knowledge-entry': {
    entityKind: 'knowledge-entry', label: 'Knowledge Entry', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Update knowledge entry', permission: 'workspace.knowledge.update',
        description: 'Editor+ updates this knowledge entry.' },
    ],
    parentEntities: ['brand', 'product'],
    childEntities: [],
  },
  membership: {
    entityKind: 'membership', label: 'Membership', panels: STANDARD_PANELS,
    primaryActions: [
      { label: 'Revoke membership', permission: 'org.membership.revoke',
        description: 'Organization-owner / admin revokes this membership.' },
    ],
    parentEntities: ['organization'],
    childEntities: [],
  },
};

export const ALL_ENTITY_PAGE_DESCRIPTORS: EntityPageDescriptor[] = Object.values(ENTITY_PAGES);

const ADVISORY_NOTICE =
  'Entity page descriptor is a static UI specification. The descriptor never ' +
  'auto-fetches data, never auto-approves an action, never auto-routes the ' +
  'operator. Every primary action is operator-supervised at the route layer. ' +
  'Human remains final authority.';

export interface EntityPageReading {
  descriptor: EntityPageDescriptor;
  /** Each primary action annotated with whether the operator may perform it. */
  primaryActionsForOperator: Array<{
    label: string; permission: PermissionAction; allowed: boolean; description: string;
  }>;
  notes: string[];
  advisoryNotice: string;
}

export function describeEntityPage(kind: EntityKind, operatorRoles: AnyRole[]): EntityPageReading {
  const descriptor = ENTITY_PAGES[kind];
  if (!descriptor) throw new Error(`unknown entity kind: ${kind}`);
  return {
    descriptor,
    primaryActionsForOperator: descriptor.primaryActions.map((a) => ({
      ...a, allowed: anyRoleHasPermission(operatorRoles, a.permission),
    })),
    notes: [
      `${descriptor.panels.length} standard panels: Overview · Relations · History · Approvals · Activity · Attachments`,
      `${descriptor.primaryActions.length} primary actions defined`,
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}

export function listEntityPageDescriptors(): EntityPageDescriptor[] {
  return ALL_ENTITY_PAGE_DESCRIPTORS;
}
