/**
 * scripts/anchor-integrity-baselines.ts
 *
 * OPERATOR-ONLY baseline writer. Runs every view builder against
 * NULL memory (the canonical empty state), derives a shape signature,
 * and writes the frozen baseline to data/integrity-baselines/{layer}.json.
 *
 * This is the ONLY code path that may write baseline files. The
 * runtime API + studio panel never invoke this — they only read.
 *
 * Operator intent is asserted by:
 *   1. Running this script explicitly (no other code path imports it)
 *   2. Passing confirmOperatorIntent:true to anchorBaseline()
 *
 * Run: npx tsx scripts/anchor-integrity-baselines.ts
 *
 * Add --dry-run to print the baseline summary without writing files.
 */

import { deriveShape } from '../lib/integrityBaselineEngine';
import {
  anchorBaseline, fingerprintShape, KNOWN_BASELINE_LAYERS, type KnownBaselineLayer,
} from '../lib/integrityBaselineMemory';

// Imports for producing current outputs against null memory.
import { buildQualityLongitudinalView } from '../lib/qualityLongitudinalView';
import { buildPolicyAuditView } from '../lib/copyQualityPolicyAuditView';
import { buildCulturalPerceptionView } from '../lib/culturalPerceptionView';
import { buildConflictLongitudinalView } from '../lib/conflictLongitudinalView';
import { buildCognitiveWeightLongitudinalView } from '../lib/cognitiveWeightLongitudinalView';
import { buildIdentityContinuityLongitudinalView } from '../lib/identityContinuityLongitudinalView';
import { buildExecutiveGovernanceLongitudinalView } from '../lib/executiveGovernanceLongitudinalView';
import { buildStrategicOutcomeLongitudinalView } from '../lib/strategicOutcomeLongitudinalView';
import { buildCounterfactualCognitionLongitudinalView } from '../lib/counterfactualCognitionLongitudinalView';
import { buildCampaignLifecycleLongitudinalView } from '../lib/campaignLifecycleLongitudinalView';
import { computeBranchActivationLog } from '../lib/branchActivationLog';
import { buildBranchActivationLongitudinalView } from '../lib/branchActivationLongitudinalView';
import { computeProjectionCalibration } from '../lib/projectionCalibrationEngine';
import { buildProjectionCalibrationLongitudinalView } from '../lib/projectionCalibrationLongitudinalView';
import { buildOperatorConfidencePreferenceView } from '../lib/operatorConfidencePreferenceView';
import { computeOperatorCalibrationReconciliation } from '../lib/operatorCalibrationReconciliation';
import { buildOperatorCalibrationReconciliationLongitudinalView } from '../lib/operatorCalibrationReconciliationView';
import { buildSystemIntegrityReport } from '../lib/systemIntegrityReport';

// ─── produce canonical outputs (null memory) ─────────────────

function produceCanonicalOutputs(): Record<KnownBaselineLayer, unknown> {
  const branchLog = computeBranchActivationLog({ memory: null });
  const calibrationReport = computeProjectionCalibration({
    branchActivationMemory: null, calibrationMemory: null,
  });
  const reconciliationReport = computeOperatorCalibrationReconciliation({
    operatorId: 'studio',
    calibrationReport,
    operatorPreferences: [],
    reconciliationMemory: null,
  });
  return {
    'quality-longitudinal': buildQualityLongitudinalView({
      strategy: null, copywriter: null, quality: null,
    }),
    'policy-audit': buildPolicyAuditView(null),
    'cultural-perception': buildCulturalPerceptionView({
      cultural: null, strategy: null, copywriter: null, quality: null, policyAudit: null,
    }),
    'cross-brain-conflict': buildConflictLongitudinalView({ memory: null }),
    'cognitive-weight': buildCognitiveWeightLongitudinalView({ memory: null }),
    'identity-continuity': buildIdentityContinuityLongitudinalView({ memory: null }),
    'executive-governance': buildExecutiveGovernanceLongitudinalView({ memory: null }),
    'strategic-outcome': buildStrategicOutcomeLongitudinalView({ memory: null }),
    'counterfactual-cognition': buildCounterfactualCognitionLongitudinalView({ memory: null }),
    'campaign-evolution': buildCampaignLifecycleLongitudinalView({ memory: null }),
    'branch-activation': buildBranchActivationLongitudinalView({ memory: null, current: branchLog }),
    'projection-calibration': buildProjectionCalibrationLongitudinalView({
      memory: null, current: calibrationReport,
    }),
    'operator-confidence-preference': buildOperatorConfidencePreferenceView({
      memory: null, operatorId: 'studio', at: 1700000000000,
    }),
    'operator-calibration-reconciliation': buildOperatorCalibrationReconciliationLongitudinalView({
      memory: null, current: reconciliationReport, operatorId: 'studio',
    }),
    'system-integrity': buildSystemIntegrityReport({
      routeFilesPresent: {}, memoryProbes: [], panelProbes: [],
    }),
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`INTEGRITY BASELINE ANCHORING${dryRun ? ' (dry-run)' : ''}\n`);

  const outputs = produceCanonicalOutputs();

  let wrote = 0;
  for (const layer of KNOWN_BASELINE_LAYERS) {
    const shape = deriveShape(outputs[layer]);
    const fingerprint = fingerprintShape(shape);
    console.log(`  ${layer.padEnd(38)} ${fingerprint}`);
    if (!dryRun) {
      await anchorBaseline({
        layer,
        shape,
        source: 'scripts/anchor-integrity-baselines.ts · null-memory canonical run',
        confirmOperatorIntent: true,
      });
      wrote += 1;
    }
  }

  console.log(`\n${dryRun ? 'would have written' : 'wrote'} ${dryRun ? KNOWN_BASELINE_LAYERS.length : wrote} baseline(s)`);
  if (dryRun) {
    console.log('re-run without --dry-run to persist baselines to data/integrity-baselines/');
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
