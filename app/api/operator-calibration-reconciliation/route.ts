/**
 * GET /api/operator-calibration-reconciliation?operatorId=...
 *
 * Read-only reconciliation view comparing operator confidence
 * preferences against system calibration accuracy. Returns an
 * OperatorCalibrationReconciliationLongitudinalView shaped for the
 * studio panel.
 *
 * STRICTLY annotations only. Never modifies operator sliders or
 * system calibration. No external execution.
 */

import { NextRequest } from 'next/server';
import { createBranchActivationMemoryStore } from '@lib/branchActivationMemory';
import { createProjectionCalibrationMemoryStore } from '@lib/projectionCalibrationMemory';
import { computeProjectionCalibration } from '@lib/projectionCalibrationEngine';
import {
  createOperatorConfidencePreferenceMemoryStore,
  getAllPreferencesForOperator,
} from '@lib/operatorConfidencePreferenceMemory';
import {
  createOperatorCalibrationReconciliationMemoryStore,
} from '@lib/operatorCalibrationReconciliationMemory';
import {
  computeOperatorCalibrationReconciliation,
} from '@lib/operatorCalibrationReconciliation';
import {
  buildOperatorCalibrationReconciliationLongitudinalView,
} from '@lib/operatorCalibrationReconciliationView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_OPERATOR_ID = 'studio';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const operatorId = url.searchParams.get('operatorId') || DEFAULT_OPERATOR_ID;

  const [branchMem, calibrationMem, operatorPrefMem, reconciliationMem] = await Promise.all([
    createBranchActivationMemoryStore().read().catch(() => null),
    createProjectionCalibrationMemoryStore().read().catch(() => null),
    createOperatorConfidencePreferenceMemoryStore().read().catch(() => null),
    createOperatorCalibrationReconciliationMemoryStore().read().catch(() => null),
  ]);

  const calibrationReport = computeProjectionCalibration({
    branchActivationMemory: branchMem,
    calibrationMemory: calibrationMem,
  });

  const operatorPreferences = operatorPrefMem
    ? getAllPreferencesForOperator(operatorPrefMem, operatorId)
    : [];

  const current = computeOperatorCalibrationReconciliation({
    operatorId,
    calibrationReport,
    operatorPreferences,
    reconciliationMemory: reconciliationMem,
  });

  const view = buildOperatorCalibrationReconciliationLongitudinalView({
    memory: reconciliationMem,
    current,
    operatorId,
  });

  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
