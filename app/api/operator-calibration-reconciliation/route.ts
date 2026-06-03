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
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
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
  const _url0 = new URL(req.url);
  const _orgId0 = _url0.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const _wspId0 = _url0.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, _orgId0, _wspId0);
  if (!tenantAuth.ok) return tenantAuth.response;

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
