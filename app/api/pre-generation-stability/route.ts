/**
 * /api/pre-generation-stability
 *
 * Read-only advisory endpoint. Composes:
 *   - ProductionConservativeMode (reads data/policies/production-safety-envelope.json)
 *   - PreGenerationStabilizer    (combines conservative + live view subsets)
 *
 * GET:  default request (ENERGY / AUTO / 0.5)
 * POST: { formula, campaignMode, brutality }
 *
 * STRICT CONTRACT:
 *   - never runs generation
 *   - never mutates memory
 *   - never changes critic, pipeline, or verdict behavior
 *   - the output is advisory only — operator decides
 */

import { NextResponse, type NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';

import {
  computeProductionConservativeMode,
  type ProductionConservativeMode,
} from '@lib/productionConservativeMode';
import {
  computePreGenerationStabilizer,
  type PreGenerationStabilizer,
} from '@lib/preGenerationStabilizer';
import type { ProductionSafetyEnvelope } from '@lib/productionSafetyEnvelope';
import { runCopyQualityPolicyPreflight } from '@lib/copyQualityPolicyPreflight';

import { createCampaignLifecycleMemoryStore } from '@lib/campaignLifecycleMemory';
import { buildCampaignLifecycleLongitudinalView } from '@lib/campaignLifecycleLongitudinalView';
import { createStrategicOutcomeMemoryStore } from '@lib/strategicOutcomeMemory';
import { buildStrategicOutcomeLongitudinalView } from '@lib/strategicOutcomeLongitudinalView';
import { createIdentityContinuityMemoryStore } from '@lib/identityContinuityMemory';
import { buildIdentityContinuityLongitudinalView } from '@lib/identityContinuityLongitudinalView';
import { createExecutiveGovernanceMemoryStore } from '@lib/executiveGovernanceMemory';
import { buildExecutiveGovernanceLongitudinalView } from '@lib/executiveGovernanceLongitudinalView';
import { createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';
import { buildPolicyAuditView } from '@lib/copyQualityPolicyAuditView';

import type { Formula, CampaignMode } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENVELOPE_PATH = path.resolve(
  process.cwd(), 'data', 'policies', 'production-safety-envelope.json',
);

interface RequestedCombination {
  formula: Formula;
  campaignMode: CampaignMode | null;
  brutality: number;
}

async function loadEnvelope(): Promise<ProductionSafetyEnvelope | null> {
  try {
    const raw = await fs.readFile(ENVELOPE_PATH, 'utf8');
    return JSON.parse(raw) as ProductionSafetyEnvelope;
  } catch {
    return null;
  }
}

async function compose(req: RequestedCombination): Promise<{
  requestedCombination: RequestedCombination;
  envelopePresent: boolean;
  productionConservativeMode: ProductionConservativeMode;
  preGenerationStabilizer: PreGenerationStabilizer;
}> {
  const envelope = await loadEnvelope();

  const [
    campaignMem, outcomeMem, identityMem, governanceMem, policyAuditMem,
  ] = await Promise.all([
    createCampaignLifecycleMemoryStore().read().catch(() => null),
    createStrategicOutcomeMemoryStore().read().catch(() => null),
    createIdentityContinuityMemoryStore().read().catch(() => null),
    createExecutiveGovernanceMemoryStore().read().catch(() => null),
    createPolicyAuditStore().read().catch(() => null),
  ]);

  const campaignView   = buildCampaignLifecycleLongitudinalView({ memory: campaignMem });
  const outcomeView    = buildStrategicOutcomeLongitudinalView({ memory: outcomeMem });
  const identityView   = buildIdentityContinuityLongitudinalView({ memory: identityMem });
  const governanceView = buildExecutiveGovernanceLongitudinalView({ memory: governanceMem });
  const policyView     = buildPolicyAuditView(policyAuditMem ?? null);

  // Preflight: only run for inspection — we never use the result to
  // mutate the request. The pipeline will run its own preflight if a
  // generation is later kicked off.
  const preflight = await runCopyQualityPolicyPreflight({
    explicitFlag: undefined,
    formula: req.formula,
    campaignMode: req.campaignMode,
    brutality: req.brutality,
  }).catch(() => null);

  const conservative = computeProductionConservativeMode({
    formula: req.formula,
    campaignMode: req.campaignMode,
    brutality: req.brutality,
    envelope,
    recentRefusalRate: typeof policyView.refusalEnabledRate === 'number'
      ? policyView.refusalEnabledRate : undefined,
  });

  const stabilizer = computePreGenerationStabilizer({
    conservative,
    preflight,
    campaign: {
      averageFatiguePressure: campaignView.averageFatiguePressure,
      trend: campaignView.trend,
    },
    outcome: {
      averageStrategicRisk: outcomeView.averageStrategicRisk,
      strategicTrend: outcomeView.strategicTrend,
    },
    identity: {
      averageContinuityRisk: identityView.averageContinuityRisk,
      continuityTrend: identityView.continuityTrend,
    },
    governance: {
      averageFragmentation: governanceView.averageFragmentation,
      governanceTrend: governanceView.governanceTrend,
    },
    policy: {
      refusalEnabledRate: policyView.refusalEnabledRate,
    },
  });

  return {
    requestedCombination: req,
    envelopePresent: envelope !== null,
    productionConservativeMode: conservative,
    preGenerationStabilizer: stabilizer,
  };
}

export async function GET(): Promise<NextResponse> {
  const requested: RequestedCombination = {
    formula: 'ENERGY',
    campaignMode: null,
    brutality: 0.5,
  };
  const result = await compose(requested);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Partial<RequestedCombination>;
  try {
    body = await req.json() as Partial<RequestedCombination>;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const requested: RequestedCombination = {
    formula: (body.formula ?? 'ENERGY') as Formula,
    campaignMode: (body.campaignMode ?? null) as CampaignMode | null,
    brutality: typeof body.brutality === 'number' ? body.brutality : 0.5,
  };
  const result = await compose(requested);
  return NextResponse.json(result);
}
