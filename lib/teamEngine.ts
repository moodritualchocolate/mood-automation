/**
 * TEAM ENGINE (pure, observational)
 *
 * Phase 2 — Operations Layer.
 *
 * Defines APPROVAL FLOWS — which role(s) MAY perform which approval
 * transitions across the existing operator-supervised registries
 * (asset registry, campaign plan memory, generation queue,
 * publication registry).
 *
 * The engine produces an APPROVAL POLICY MAP — it describes who is
 * eligible to make a given operator-supervised transition. The
 * existing routes still require operator credentials; this engine
 * never auto-approves anything.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - the engine never auto-approves
 *   - the engine never auto-assigns roles
 *   - allowed phrasing: "approval flow", "operator approval required",
 *     "MAY approve", "MAY draft"
 *   - forbidden: predict, will-perform, best, winner, recommended,
 *     selected, chosen, optimal, auto-apply, auto-approve
 */

import type { TeamMemberRecord, TeamRole } from './teamMemory';

// ─── input ────────────────────────────────────────────────────

export interface TeamEngineInput {
  members?: TeamMemberRecord[];
}

// ─── output ───────────────────────────────────────────────────

export type ApprovalAction =
  /** Asset registry actions. */
  | 'asset-register' | 'asset-approve' | 'asset-reject' | 'asset-archive'
  /** Generation queue actions. */
  | 'gen-queue-draft' | 'gen-queue-approve' | 'gen-queue-submit'
  | 'gen-queue-complete' | 'gen-queue-fail' | 'gen-queue-archive'
  /** Publication registry actions. */
  | 'publication-register' | 'publication-pause' | 'publication-unpublish'
  | 'publication-archive' | 'publication-relive'
  /** Campaign plan actions. */
  | 'campaign-save' | 'campaign-approve' | 'campaign-start'
  | 'campaign-complete' | 'campaign-reject' | 'campaign-archive'
  /** Performance + journey actions. */
  | 'performance-log' | 'journey-log';

export interface ApprovalFlowEntry {
  action: ApprovalAction;
  /** Which roles MAY perform this action. */
  eligibleRoles: TeamRole[];
  /** Plain-language description (allowed phrasing only). */
  description: string;
}

export interface ApprovalAvailability {
  member: { memberId: string; name: string; roles: TeamRole[] };
  /** Actions this member MAY perform. */
  mayPerform: ApprovalAction[];
}

export interface TeamEngineReading {
  approvalFlows: ApprovalFlowEntry[];
  roleCoverage: Record<TeamRole, number>;
  /** Per-member eligibility table — never automatically executed. */
  approvalAvailability: ApprovalAvailability[];
  /** Roles for which no eligible member exists. */
  uncoveredRoles: TeamRole[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Team engine produces approval-flow eligibility only. The engine never ' +
  'auto-approves, never auto-assigns roles. Operator approval required. ' +
  'Human remains final authority.';

// ─── approval flow table ─────────────────────────────────────

const APPROVAL_FLOWS: ApprovalFlowEntry[] = [
  // Asset registry — typically Creative Director / Reviewer / Owner.
  { action: 'asset-register', eligibleRoles: ['operator', 'designer', 'creative-director', 'owner'],
    description: 'asset register · operator approval required at the route layer' },
  { action: 'asset-approve', eligibleRoles: ['creative-director', 'reviewer', 'owner'],
    description: 'asset approve · operator approval required at the route layer' },
  { action: 'asset-reject', eligibleRoles: ['creative-director', 'reviewer', 'owner'],
    description: 'asset reject · operator approval required at the route layer' },
  { action: 'asset-archive', eligibleRoles: ['operator', 'owner'],
    description: 'asset archive · operator approval required at the route layer' },

  // Generation queue — operator + creative-director + designer.
  { action: 'gen-queue-draft', eligibleRoles: ['operator', 'designer', 'editor', 'creative-director', 'owner'],
    description: 'generation queue draft · operator approval required at the route layer' },
  { action: 'gen-queue-approve', eligibleRoles: ['creative-director', 'reviewer', 'owner'],
    description: 'generation queue approve · operator approval required at the route layer' },
  { action: 'gen-queue-submit', eligibleRoles: ['operator', 'designer', 'editor', 'creative-director', 'owner'],
    description: 'generation queue submit (operator submits to provider manually) · operator approval required at the route layer' },
  { action: 'gen-queue-complete', eligibleRoles: ['operator', 'designer', 'editor', 'creative-director', 'owner'],
    description: 'generation queue complete · operator approval required at the route layer' },
  { action: 'gen-queue-fail', eligibleRoles: ['operator', 'designer', 'editor', 'creative-director', 'owner'],
    description: 'generation queue fail · operator approval required at the route layer' },
  { action: 'gen-queue-archive', eligibleRoles: ['operator', 'owner'],
    description: 'generation queue archive · operator approval required at the route layer' },

  // Publication registry — media buyer + operator + owner.
  { action: 'publication-register', eligibleRoles: ['media-buyer', 'operator', 'owner'],
    description: 'publication register (operator publishes externally first) · operator approval required at the route layer' },
  { action: 'publication-pause', eligibleRoles: ['media-buyer', 'operator', 'owner'],
    description: 'publication pause · operator approval required at the route layer' },
  { action: 'publication-unpublish', eligibleRoles: ['media-buyer', 'operator', 'owner'],
    description: 'publication unpublish · operator approval required at the route layer' },
  { action: 'publication-archive', eligibleRoles: ['operator', 'owner'],
    description: 'publication archive · operator approval required at the route layer' },
  { action: 'publication-relive', eligibleRoles: ['media-buyer', 'operator', 'owner'],
    description: 'publication relive · operator approval required at the route layer' },

  // Campaign plan — creative director + owner.
  { action: 'campaign-save', eligibleRoles: ['operator', 'creative-director', 'media-buyer', 'owner'],
    description: 'campaign save (as draft) · operator approval required at the route layer' },
  { action: 'campaign-approve', eligibleRoles: ['creative-director', 'reviewer', 'owner'],
    description: 'campaign approve · operator approval required at the route layer' },
  { action: 'campaign-start', eligibleRoles: ['creative-director', 'media-buyer', 'owner'],
    description: 'campaign start (operator runs externally) · operator approval required at the route layer' },
  { action: 'campaign-complete', eligibleRoles: ['operator', 'creative-director', 'owner'],
    description: 'campaign complete · operator approval required at the route layer' },
  { action: 'campaign-reject', eligibleRoles: ['creative-director', 'reviewer', 'owner'],
    description: 'campaign reject · operator approval required at the route layer' },
  { action: 'campaign-archive', eligibleRoles: ['operator', 'owner'],
    description: 'campaign archive · operator approval required at the route layer' },

  // Performance + journey logging.
  { action: 'performance-log', eligibleRoles: ['operator', 'media-buyer', 'reviewer', 'owner'],
    description: 'performance log (operator pulls from analytics manually) · operator approval required at the route layer' },
  { action: 'journey-log', eligibleRoles: ['operator', 'media-buyer', 'reviewer', 'owner'],
    description: 'journey event log (operator pulls from analytics manually) · operator approval required at the route layer' },
];

// ─── main ─────────────────────────────────────────────────────

export function buildTeamEngine(input: TeamEngineInput): TeamEngineReading {
  const members = input.members ?? [];

  // Role coverage.
  const roleCoverage: Record<TeamRole, number> = {
    owner: 0, 'creative-director': 0, designer: 0, editor: 0,
    'media-buyer': 0, operator: 0, reviewer: 0,
  };
  for (const m of members) for (const r of m.roles) roleCoverage[r] += 1;

  // Per-member eligibility.
  const approvalAvailability: ApprovalAvailability[] = members.map((m) => {
    const mayPerform: ApprovalAction[] = [];
    for (const flow of APPROVAL_FLOWS) {
      if (m.roles.some((r) => flow.eligibleRoles.includes(r))) mayPerform.push(flow.action);
    }
    return {
      member: { memberId: m.memberId, name: m.name, roles: m.roles.slice() },
      mayPerform,
    };
  }).sort((a, b) => b.mayPerform.length - a.mayPerform.length || a.member.name.localeCompare(b.member.name));

  // Uncovered roles.
  const uncoveredRoles: TeamRole[] = (Object.keys(roleCoverage) as TeamRole[])
    .filter((r) => roleCoverage[r] === 0);

  const notes: string[] = [];
  if (members.length === 0) {
    notes.push('no team members yet — operator may add members · operator approval required');
  }
  if (uncoveredRoles.length > 0) {
    notes.push(`${uncoveredRoles.length} role(s) currently uncovered — operator review required`);
  }

  return {
    approvalFlows: APPROVAL_FLOWS,
    roleCoverage,
    approvalAvailability,
    uncoveredRoles,
    notes,
    reasonCodes: [
      `members:${members.length}`,
      `flows:${APPROVAL_FLOWS.length}`,
      `uncovered:${uncoveredRoles.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}

/** Helper for routes to validate an action against a member's roles. */
export function memberMayPerform(member: TeamMemberRecord, action: ApprovalAction): boolean {
  const flow = APPROVAL_FLOWS.find((f) => f.action === action);
  if (!flow) return false;
  return member.roles.some((r) => flow.eligibleRoles.includes(r));
}
