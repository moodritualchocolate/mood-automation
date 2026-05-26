/**
 * GET /api/integrity-baselines
 *
 * Read-only baseline comparison report. Reads every frozen baseline
 * from data/integrity-baselines/, runs each view builder against
 * current memory, derives its shape, and compares to the baseline.
 *
 * STRICTLY:
 *   - read-only — never writes to data/integrity-baselines/
 *   - baseline rewrites only via scripts/anchor-integrity-baselines.ts
 *   - no external execution
 */

import {
  createIntegrityBaselineReader, KNOWN_BASELINE_LAYERS,
} from '@lib/integrityBaselineMemory';
import { compareLayer, type BaselineComparisonRow } from '@lib/integrityBaselineEngine';

import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createCopyQualityMemoryStore } from '@lib/copyQualityMemory';
import { createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';
import { createCulturalPerceptionMemoryStore } from '@lib/culturalPerceptionMemory';
import { createConflictMemoryStore } from '@lib/conflictMemory';
import { createCognitiveWeightMemoryStore } from '@lib/cognitiveWeightMemory';
import { createIdentityContinuityMemoryStore } from '@lib/identityContinuityMemory';
import { createExecutiveGovernanceMemoryStore } from '@lib/executiveGovernanceMemory';
import { createStrategicOutcomeMemoryStore } from '@lib/strategicOutcomeMemory';
import { createCounterfactualCognitionMemoryStore } from '@lib/counterfactualCognitionMemory';
import { createCampaignLifecycleMemoryStore } from '@lib/campaignLifecycleMemory';
import { createBranchActivationMemoryStore } from '@lib/branchActivationMemory';
import { createProjectionCalibrationMemoryStore } from '@lib/projectionCalibrationMemory';
import { createOperatorConfidencePreferenceMemoryStore } from '@lib/operatorConfidencePreferenceMemory';
import { createOperatorCalibrationReconciliationMemoryStore } from '@lib/operatorCalibrationReconciliationMemory';

import { buildQualityLongitudinalView } from '@lib/qualityLongitudinalView';
import { buildPolicyAuditView } from '@lib/copyQualityPolicyAuditView';
import { buildCulturalPerceptionView } from '@lib/culturalPerceptionView';
import { buildConflictLongitudinalView } from '@lib/conflictLongitudinalView';
import { buildCognitiveWeightLongitudinalView } from '@lib/cognitiveWeightLongitudinalView';
import { buildIdentityContinuityLongitudinalView } from '@lib/identityContinuityLongitudinalView';
import { buildExecutiveGovernanceLongitudinalView } from '@lib/executiveGovernanceLongitudinalView';
import { buildStrategicOutcomeLongitudinalView } from '@lib/strategicOutcomeLongitudinalView';
import { buildCounterfactualCognitionLongitudinalView } from '@lib/counterfactualCognitionLongitudinalView';
import { buildCampaignLifecycleLongitudinalView } from '@lib/campaignLifecycleLongitudinalView';
import { computeBranchActivationLog } from '@lib/branchActivationLog';
import { buildBranchActivationLongitudinalView } from '@lib/branchActivationLongitudinalView';
import { computeProjectionCalibration } from '@lib/projectionCalibrationEngine';
import { buildProjectionCalibrationLongitudinalView } from '@lib/projectionCalibrationLongitudinalView';
import { buildOperatorConfidencePreferenceView } from '@lib/operatorConfidencePreferenceView';
import { computeOperatorCalibrationReconciliation } from '@lib/operatorCalibrationReconciliation';
import { buildOperatorCalibrationReconciliationLongitudinalView } from '@lib/operatorCalibrationReconciliationView';
import { buildSystemIntegrityReport } from '@lib/systemIntegrityReport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── produce current shape per layer ─────────────────────────

async function produceCurrentOutputs(): Promise<Record<string, unknown>> {
  const [
    strategyMem, copywriterMem, qualityMem, policyMem, culturalMem,
    conflictMem, weightMem, identityMem, governanceMem, outcomeMem,
    counterfactualMem, lifecycleMem, branchMem, calibrationMem,
    opPrefMem, reconcileMem,
  ] = await Promise.all([
    createAdStrategyMemoryStore().read().catch(() => null),
    createCopywriterMemoryStore().read().catch(() => null),
    createCopyQualityMemoryStore().read().catch(() => null),
    createPolicyAuditStore().read().catch(() => null),
    createCulturalPerceptionMemoryStore().read().catch(() => null),
    createConflictMemoryStore().read().catch(() => null),
    createCognitiveWeightMemoryStore().read().catch(() => null),
    createIdentityContinuityMemoryStore().read().catch(() => null),
    createExecutiveGovernanceMemoryStore().read().catch(() => null),
    createStrategicOutcomeMemoryStore().read().catch(() => null),
    createCounterfactualCognitionMemoryStore().read().catch(() => null),
    createCampaignLifecycleMemoryStore().read().catch(() => null),
    createBranchActivationMemoryStore().read().catch(() => null),
    createProjectionCalibrationMemoryStore().read().catch(() => null),
    createOperatorConfidencePreferenceMemoryStore().read().catch(() => null),
    createOperatorCalibrationReconciliationMemoryStore().read().catch(() => null),
  ]);

  const branchLog = computeBranchActivationLog({ memory: branchMem });
  const calibrationReport = computeProjectionCalibration({
    branchActivationMemory: branchMem,
    calibrationMemory: calibrationMem,
  });
  const reconciliationReport = computeOperatorCalibrationReconciliation({
    operatorId: 'studio',
    calibrationReport,
    operatorPreferences: [],
    reconciliationMemory: reconcileMem,
  });

  return {
    'quality-longitudinal': buildQualityLongitudinalView({
      strategy: strategyMem, copywriter: copywriterMem, quality: qualityMem,
    }),
    'policy-audit': buildPolicyAuditView(policyMem),
    'cultural-perception': buildCulturalPerceptionView({
      cultural: culturalMem, strategy: strategyMem,
      copywriter: copywriterMem, quality: qualityMem, policyAudit: policyMem,
    }),
    'cross-brain-conflict': buildConflictLongitudinalView({ memory: conflictMem }),
    'cognitive-weight': buildCognitiveWeightLongitudinalView({ memory: weightMem }),
    'identity-continuity': buildIdentityContinuityLongitudinalView({ memory: identityMem }),
    'executive-governance': buildExecutiveGovernanceLongitudinalView({ memory: governanceMem }),
    'strategic-outcome': buildStrategicOutcomeLongitudinalView({ memory: outcomeMem }),
    'counterfactual-cognition': buildCounterfactualCognitionLongitudinalView({ memory: counterfactualMem }),
    'campaign-evolution': buildCampaignLifecycleLongitudinalView({ memory: lifecycleMem }),
    'branch-activation': buildBranchActivationLongitudinalView({ memory: branchMem, current: branchLog }),
    'projection-calibration': buildProjectionCalibrationLongitudinalView({
      memory: calibrationMem, current: calibrationReport,
    }),
    'operator-confidence-preference': buildOperatorConfidencePreferenceView({
      memory: opPrefMem, operatorId: 'studio', at: 1700000000000,    // freeze `at` so shape is stable
    }),
    'operator-calibration-reconciliation': buildOperatorCalibrationReconciliationLongitudinalView({
      memory: reconcileMem, current: reconciliationReport, operatorId: 'studio',
    }),
    'system-integrity': buildSystemIntegrityReport({
      routeFilesPresent: {}, memoryProbes: [], panelProbes: [],
    }),
  };
}

// ─── handler ──────────────────────────────────────────────────

export async function GET() {
  const reader = createIntegrityBaselineReader();
  const [baselines, currents] = await Promise.all([
    reader.readAll(),
    produceCurrentOutputs(),
  ]);

  const rows: BaselineComparisonRow[] = KNOWN_BASELINE_LAYERS.map((layer) => {
    const baselineFile = baselines[layer];
    return compareLayer({
      layer,
      current: currents[layer],
      baseline: baselineFile ? baselineFile.shape : null,
    });
  });

  const matched = rows.filter((r) => r.status === 'matched').length;
  const drift   = rows.filter((r) => r.status === 'shape-drift').length;
  const missing = rows.filter((r) => r.status === 'missing-baseline').length;

  return Response.json({
    totalLayers: rows.length,
    matched, drift, missing,
    overallStatus: drift > 0 ? 'shape-drift' : missing > 0 ? 'partial' : 'matched',
    rows,
  }, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
