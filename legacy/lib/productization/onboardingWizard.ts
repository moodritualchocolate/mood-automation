/**
 * ONBOARDING WIZARD (pure state machine)
 *
 * Brand onboarding — 8 deterministic operator-supervised steps. The
 * engine never auto-advances, never auto-creates entities, never
 * skips steps on the operator's behalf.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the wizard never auto-completes a step
 *   - every transition is operator-supervised at the route layer
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { BillingTier, OrganizationRole } from '@lib/tenancy/types';

// ─── step shape ──────────────────────────────────────────────

export type OnboardingStepId =
  | 'organization' | 'brand' | 'products' | 'audience' | 'market'
  | 'visual-identity' | 'knowledge-upload' | 'ready';

export interface OnboardingStep {
  id: OnboardingStepId;
  index: number;
  /** Operator-facing label. */
  label: string;
  /** Single-sentence description. */
  description: string;
  /** Field names the operator MUST submit to complete this step. */
  requiredFields: string[];
  /** Field names the operator MAY submit. */
  optionalFields: string[];
  /** Permission required to advance past this step. */
  permissionPlatformOnly: boolean;
  /** Min organization role needed at this step (or null for platform). */
  minOrganizationRole: OrganizationRole | null;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'organization',
    index: 1,
    label: 'Organization',
    description:
      'Platform-owner registers the organization. The route stamps every downstream entity with the resolved organizationId.',
    requiredFields: ['organizationName', 'organizationSlug'],
    optionalFields: ['billingTier', 'operatorNote'],
    permissionPlatformOnly: true,
    minOrganizationRole: null,
  },
  {
    id: 'brand',
    index: 2,
    label: 'Brand',
    description:
      'Organization-owner / admin creates the brand record. One brand may own many products.',
    requiredFields: ['brandName', 'brandSlug', 'workspaceId'],
    optionalFields: ['brandNote'],
    permissionPlatformOnly: false,
    minOrganizationRole: 'admin',
  },
  {
    id: 'products',
    index: 3,
    label: 'Products',
    description:
      'Operator registers one or more product records inside the brand.',
    requiredFields: ['products'],
    optionalFields: [],
    permissionPlatformOnly: false,
    minOrganizationRole: 'manager',
  },
  {
    id: 'audience',
    index: 4,
    label: 'Audience',
    description:
      'Operator describes the audience the brand is talking to. The descriptor stamps every brief and campaign downstream.',
    requiredFields: ['audienceLabel', 'audienceDescription'],
    optionalFields: ['audienceTags'],
    permissionPlatformOnly: false,
    minOrganizationRole: 'manager',
  },
  {
    id: 'market',
    index: 5,
    label: 'Market',
    description:
      'Operator names the primary market (e.g. israel, global, eu). Used by briefs to scope cultural references.',
    requiredFields: ['primaryMarket'],
    optionalFields: ['secondaryMarkets'],
    permissionPlatformOnly: false,
    minOrganizationRole: 'manager',
  },
  {
    id: 'visual-identity',
    index: 6,
    label: 'Visual Identity',
    description:
      'Operator uploads or describes the visual identity (palette + typography + brand voice notes).',
    requiredFields: ['visualIdentityNotes'],
    optionalFields: ['paletteHex', 'typographyNotes', 'voiceNotes'],
    permissionPlatformOnly: false,
    minOrganizationRole: 'editor',
  },
  {
    id: 'knowledge-upload',
    index: 7,
    label: 'Knowledge Upload',
    description:
      'Operator registers initial knowledge entries (brand notes, audience research, qualitative findings).',
    requiredFields: ['knowledgeEntries'],
    optionalFields: [],
    permissionPlatformOnly: false,
    minOrganizationRole: 'editor',
  },
  {
    id: 'ready',
    index: 8,
    label: 'Ready',
    description:
      'Wizard summary — every prior step is reviewed by the operator. The wizard never auto-creates downstream entities; the operator completes each registration through the standard operator-supervised routes.',
    requiredFields: ['operatorReason'],
    optionalFields: ['operatorNote'],
    permissionPlatformOnly: false,
    minOrganizationRole: 'admin',
  },
];

export const ONBOARDING_STEPS: OnboardingStep[] = STEPS;
export const ONBOARDING_STEP_IDS: OnboardingStepId[] = STEPS.map((s) => s.id);

// ─── session state ───────────────────────────────────────────

export type OnboardingSessionStatus =
  | 'pending' | 'in-progress' | 'completed' | 'abandoned';

export interface OnboardingStepRecord {
  stepId: OnboardingStepId;
  at: number;
  operatorId: string;
  status: 'submitted' | 'revised' | 'skipped-by-operator';
  /** Frozen operator-submitted values for the step. */
  values: Record<string, unknown>;
  reason: string;
}

export interface OnboardingSessionState {
  sessionId: string;
  organizationId: string | null;
  /** The operator running the wizard. */
  operatorId: string;
  status: OnboardingSessionStatus;
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  history: OnboardingStepRecord[];
  createdAt: number;
  updatedAt: number;
  /** Optional billing tier metadata captured on step 1. */
  billingTier?: BillingTier;
}

// ─── pure transforms ─────────────────────────────────────────

export function createInitialOnboardingSession(
  sessionId: string, operatorId: string, at: number,
): OnboardingSessionState {
  return {
    sessionId,
    organizationId: null,
    operatorId,
    status: 'pending',
    currentStep: 'organization',
    completedSteps: [],
    history: [],
    createdAt: at,
    updatedAt: at,
  };
}

export function stepByIndex(index: number): OnboardingStep | null {
  return STEPS.find((s) => s.index === index) ?? null;
}
export function stepById(id: OnboardingStepId): OnboardingStep | null {
  return STEPS.find((s) => s.id === id) ?? null;
}
function nextStepAfter(id: OnboardingStepId): OnboardingStepId | null {
  const cur = stepById(id);
  if (!cur) return null;
  const next = stepByIndex(cur.index + 1);
  return next ? next.id : null;
}

export interface AdvanceStepInput {
  stepId: OnboardingStepId;
  values: Record<string, unknown>;
  operatorId: string;
  operatorReason: string;
  at: number;
}

/** Validates that every required field for the step is present. */
export function validateStepValues(
  step: OnboardingStep, values: Record<string, unknown>,
): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const f of step.requiredFields) {
    const v = values[f];
    if (v === undefined || v === null) { missing.push(f); continue; }
    if (typeof v === 'string' && v.length === 0) { missing.push(f); continue; }
    if (Array.isArray(v) && v.length === 0) { missing.push(f); continue; }
  }
  return { ok: missing.length === 0, missing };
}

export function advanceOnboarding(
  state: OnboardingSessionState, input: AdvanceStepInput,
): OnboardingSessionState {
  if (state.status === 'completed') throw new Error('session already completed');
  if (state.status === 'abandoned') throw new Error('session abandoned');
  if (input.stepId !== state.currentStep) {
    throw new Error(`step out of order: expected ${state.currentStep}, got ${input.stepId}`);
  }
  const step = stepById(input.stepId);
  if (!step) throw new Error(`unknown step: ${input.stepId}`);
  const v = validateStepValues(step, input.values);
  if (!v.ok) throw new Error(`missing required fields: ${v.missing.join(',')}`);

  const record: OnboardingStepRecord = {
    stepId: input.stepId, at: input.at, operatorId: input.operatorId,
    status: 'submitted', values: input.values, reason: input.operatorReason,
  };
  const nextStepId = nextStepAfter(input.stepId);
  const completed = [...state.completedSteps, input.stepId];
  const isFinal = nextStepId === null;

  // Pick up the organizationId stamp from step 1.
  const organizationId =
    input.stepId === 'organization' && typeof input.values.organizationId === 'string'
      ? input.values.organizationId
      : state.organizationId;
  const billingTier =
    input.stepId === 'organization' && typeof input.values.billingTier === 'string'
      ? input.values.billingTier as BillingTier
      : state.billingTier;

  return {
    ...state,
    status: isFinal ? 'completed' : 'in-progress',
    currentStep: nextStepId ?? input.stepId,
    completedSteps: completed,
    history: [...state.history, record],
    organizationId,
    billingTier,
    updatedAt: input.at,
  };
}

export function reviseOnboarding(
  state: OnboardingSessionState, input: AdvanceStepInput,
): OnboardingSessionState {
  if (state.status === 'completed') throw new Error('session already completed');
  if (state.status === 'abandoned') throw new Error('session abandoned');
  const step = stepById(input.stepId);
  if (!step) throw new Error(`unknown step: ${input.stepId}`);
  if (!state.completedSteps.includes(input.stepId)) {
    throw new Error(`cannot revise non-completed step: ${input.stepId}`);
  }
  const v = validateStepValues(step, input.values);
  if (!v.ok) throw new Error(`missing required fields: ${v.missing.join(',')}`);

  const record: OnboardingStepRecord = {
    stepId: input.stepId, at: input.at, operatorId: input.operatorId,
    status: 'revised', values: input.values, reason: input.operatorReason,
  };
  return {
    ...state, history: [...state.history, record], updatedAt: input.at,
  };
}

export function abandonOnboarding(
  state: OnboardingSessionState, operatorId: string, operatorReason: string, at: number,
): OnboardingSessionState {
  if (state.status === 'completed') throw new Error('session already completed');
  if (state.status === 'abandoned') throw new Error('session already abandoned');
  return {
    ...state,
    status: 'abandoned',
    updatedAt: at,
    history: [...state.history, {
      stepId: state.currentStep, at, operatorId, status: 'skipped-by-operator',
      values: {}, reason: operatorReason,
    }],
  };
}

// ─── descriptor (read-only) ──────────────────────────────────

export interface OnboardingDescriptor {
  steps: OnboardingStep[];
  currentStep: OnboardingStep | null;
  progress: { completed: number; total: number; percent: number };
  status: OnboardingSessionStatus;
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Onboarding wizard is operator-supervised. The wizard never auto-advances, ' +
  'never auto-creates entities, never skips steps on the operator’s behalf. ' +
  'Every step submission requires operatorId + operatorReason. ' +
  'Human remains final authority.';

export function describeOnboardingSession(
  state: OnboardingSessionState,
): OnboardingDescriptor {
  const current = stepById(state.currentStep);
  const completed = state.completedSteps.length;
  return {
    steps: ONBOARDING_STEPS,
    currentStep: current,
    progress: {
      completed, total: ONBOARDING_STEPS.length,
      percent: Math.round((completed / ONBOARDING_STEPS.length) * 100),
    },
    status: state.status,
    notes: [
      `${completed}/${ONBOARDING_STEPS.length} steps completed`,
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
