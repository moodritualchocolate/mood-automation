/**
 * GET /api/supervised-learning-loop
 *
 * Read-only observatory. Composes sandbox memory, operator trials,
 * trial outcomes, and pattern reliability memory. Computes
 * supervised learning observations and persists ONE entry per
 * matched (trial, outcome, axis) event into pattern reliability
 * memory.
 *
 * STRICT CONTRACT:
 *   - GET only — no POST, no execution, no publishing
 *   - never auto-applies a pattern
 *   - never selects a winner
 *   - never calls /api/generate / runPipeline / composeBannerSvg
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import {
  computeSupervisedLearning,
} from '@lib/supervisedLearningLoop';
import {
  createPatternReliabilityMemoryStore, applyPatternObservation,
  type PatternAlignment, type PatternReliabilityMemoryState,
} from '@lib/patternReliabilityMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { createTrialOutcomeMemoryStore } from '@lib/trialOutcomeMemory';
import { createEvolutionSandboxMemoryStore } from '@lib/evolutionSandboxMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const [trialMem, outcomeMem, sandboxMem, priorReliabilityMem] = await Promise.all([
    createOperatorTrialMemoryStore().read().catch(() => null),
    createTrialOutcomeMemoryStore().read().catch(() => null),
    createEvolutionSandboxMemoryStore().read().catch(() => null),
    createPatternReliabilityMemoryStore().read().catch(() => null),
  ]);

  const trials = trialMem?.trials ?? [];
  const outcomes = outcomeMem?.outcomes ?? [];
  const priorPatterns = priorReliabilityMem?.patterns ?? [];

  const reading = computeSupervisedLearning({ trials, outcomes, priorPatterns });

  // Persist each learning event into the pattern reliability memory.
  // The memory only records OBSERVATIONS; no decision is made on the
  // operator's behalf. We compose the new state in-memory then save once.
  let nextState: PatternReliabilityMemoryState | null = priorReliabilityMem;
  try {
    if (!nextState) {
      const store = createPatternReliabilityMemoryStore();
      nextState = await store.read();
    }
    for (const ev of reading.learningEvents) {
      nextState = applyPatternObservation(nextState, {
        mutationType: ev.mutationType,
        formula: ev.formula,
        campaignMode: ev.campaignMode,
        expectedSignal: ev.expectedSignal,
        observedOutcome: ev.observedOutcome,
        alignment: ev.alignment as PatternAlignment,
        at: ev.at,
      });
    }
    if (nextState) {
      await createPatternReliabilityMemoryStore().save(nextState);
    }
  } catch {
    // non-fatal — pattern reliability persistence never blocks the read view
  }

  return NextResponse.json({
    ...reading,
    sandboxSimulationCount: sandboxMem?.totalSimulations ?? 0,
    operatorTrialCount: trials.length,
    trialOutcomeCount: outcomes.length,
    persistedPatternCount: nextState?.patterns.length ?? 0,
    advisoryNotice:
      'Observatory only — the supervised learning loop describes operator-attached ' +
      'outcomes against sandbox expectations. It never auto-applies, never selects ' +
      'a candidate, and never claims a pattern is final.',
  });
}
