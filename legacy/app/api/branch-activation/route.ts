/**
 * GET  /api/branch-activation — read-only longitudinal view.
 * POST /api/branch-activation — human-supervised branch activation.
 *
 * The POST endpoint is the ONLY way a branch can activate. It records
 * the operator's explicit choice + the campaign-evolution snapshot at
 * activation time. No autonomous execution. No automatic campaign
 * switching. No prompt mutation. The activation is purely a
 * reinforcement-memory event; subsequent generation runs update the
 * outcome deltas observationally.
 *
 * No external execution.
 */

import { NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import {
  createBranchActivationMemoryStore, buildActivationId,
  type BranchActivationRecord,
} from '@lib/branchActivationMemory';
import { computeBranchActivationLog } from '@lib/branchActivationLog';
import { buildBranchActivationLongitudinalView } from '@lib/branchActivationLongitudinalView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const memory = await createBranchActivationMemoryStore().read().catch(() => null);
  const current = computeBranchActivationLog({ memory });
  const view = buildBranchActivationLongitudinalView({ memory, current });
  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}

interface ActivationPostBody {
  branchName: string;
  counterfactualType: string;     // e.g. 'trust-optimal' | 'durability-optimal' | 'fatigue-aware' | 'high-impact'
  fromPhase: string;
  fromExecutive: string | null;
  fromIdentityVector: string | null;
  fromArchetype: string | null;
  predictedTrustImpact: number;
  predictedFatigueImpact: number;
  predictedDurabilityImpact: number;
  predictedRisk: number;
  predictedDurabilityPotential: number;
  baselineTrustMomentum: number;
  baselineFatiguePressure: number;
  baselineDurability: number;
  baselineCampaignHealth: number;
  operatorId?: string;
  reason?: string;
}

export async function POST(req: NextRequest) {
  const _authGate = await requireSession(req);
  if (!_authGate.ok) return _authGate.response;

  let body: ActivationPostBody;
  try {
    body = (await req.json()) as ActivationPostBody;
  } catch {
    return Response.json({ error: 'invalid json body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' ||
      typeof body.branchName !== 'string' || body.branchName.length === 0) {
    return Response.json({ error: 'branchName required' }, { status: 400 });
  }
  const store = createBranchActivationMemoryStore();
  const cur = await store.read().catch(() => null);
  const totalSoFar = cur?.totalActivations ?? 0;
  const activatedAt = Date.now();
  const operatorId = (body.operatorId && body.operatorId.length > 0)
    ? body.operatorId : 'anonymous';
  const record: BranchActivationRecord = {
    id: buildActivationId(activatedAt, body.branchName, operatorId, totalSoFar),
    activatedAt,
    branchName: body.branchName,
    counterfactualType: body.counterfactualType ?? 'unspecified',
    fromPhase: body.fromPhase ?? 'unknown',
    fromExecutive: body.fromExecutive ?? null,
    fromIdentityVector: body.fromIdentityVector ?? null,
    fromArchetype: body.fromArchetype ?? null,
    predictedTrustImpact: numberOr(body.predictedTrustImpact, 0),
    predictedFatigueImpact: numberOr(body.predictedFatigueImpact, 0),
    predictedDurabilityImpact: numberOr(body.predictedDurabilityImpact, 0),
    predictedRisk: numberOr(body.predictedRisk, 5),
    predictedDurabilityPotential: numberOr(body.predictedDurabilityPotential, 5),
    baselineTrustMomentum: numberOr(body.baselineTrustMomentum, 5),
    baselineFatiguePressure: numberOr(body.baselineFatiguePressure, 5),
    baselineDurability: numberOr(body.baselineDurability, 5),
    baselineCampaignHealth: numberOr(body.baselineCampaignHealth, 5),
    operatorId,
    reason: body.reason ?? null,
    observationsAfter: 0,
    measuredTrustDelta: 0,
    measuredFatigueDelta: 0,
    measuredDurabilityDelta: 0,
    measuredHealthDelta: 0,
    measuredDecayDelta: 0,
    resolved: false,
    resolutionResult: 'pending',
  };
  try {
    await store.append(record);
  } catch (e) {
    return Response.json({ error: `failed to record activation: ${(e as Error).message}` }, { status: 500 });
  }
  return Response.json({
    ok: true,
    activationId: record.id,
    activatedAt: record.activatedAt,
    message: 'branch activation recorded — outcome will be measured across subsequent runs',
  }, { headers: { 'cache-control': 'no-cache, no-transform' } });
}

function numberOr(n: unknown, fallback: number): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}
