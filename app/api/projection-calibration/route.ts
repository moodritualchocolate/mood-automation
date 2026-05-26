/**
 * GET /api/projection-calibration
 *
 * Read-only calibration view. Joins branch-activation memory (the
 * source of truth for predicted-vs-measured outcomes) with
 * calibration memory (snapshot history for drift tracking). Returns
 * a ProjectionCalibrationLongitudinalView shaped for the studio
 * panel.
 *
 * Annotations only — never modifies projections or scores.
 * No generation, no critic, no external execution.
 */

import { createBranchActivationMemoryStore } from '@lib/branchActivationMemory';
import { createProjectionCalibrationMemoryStore } from '@lib/projectionCalibrationMemory';
import { computeProjectionCalibration } from '@lib/projectionCalibrationEngine';
import { buildProjectionCalibrationLongitudinalView } from '@lib/projectionCalibrationLongitudinalView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [branchMem, calibrationMem] = await Promise.all([
    createBranchActivationMemoryStore().read().catch(() => null),
    createProjectionCalibrationMemoryStore().read().catch(() => null),
  ]);

  const current = computeProjectionCalibration({
    branchActivationMemory: branchMem,
    calibrationMemory: calibrationMem,
  });

  const view = buildProjectionCalibrationLongitudinalView({
    memory: calibrationMem,
    current,
  });

  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
