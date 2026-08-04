/**
 * OPERATOR CALIBRATION RECONCILIATION
 *
 * Pure deterministic ANNOTATIONS layer. Compares:
 *   - SYSTEM: historical calibration confidence per projection type
 *   - OPERATOR: manual confidence slider per projection type
 * and surfaces relationship patterns. The engine does NOT decide
 * who is correct.
 *
 * STRICTLY:
 *   - never modifies operator sliders / projections / calibration
 *   - never reprioritizes branches / alters rankings
 *   - never auto-corrects either side
 *   - never influences generation / campaign evolution / critic
 *   - no external APIs
 *   - same memory → same reconciliation
 *
 * Imports: only types. No critic / pipeline imports.
 */

import type {
  ProjectionCalibration, ProjectionCalibrationReport,
} from './projectionCalibrationEngine';
import type {
  OperatorPreference,
} from './operatorConfidencePreference';
import type {
  OperatorCalibrationReconciliationMemoryState, DivergenceTracePoint,
} from './operatorCalibrationReconciliationMemory';

// ─── taxonomy ──────────────────────────────────────────────────

export type ReconciliationRelationshipType =
  | 'aligned'
  | 'operator-more-optimistic'
  | 'operator-more-skeptical'
  | 'historically-corrected'
  | 'historically-overconfident'
  | 'historically-underconfident'
  | 'unstable-intuition'
  | 'improving-alignment';

// ─── output shape ──────────────────────────────────────────────

export interface OperatorAccuracy {
  shortTerm: number;
  longTerm: number;
  trustSensitivity: number;
  fatigueSensitivity: number;
  durabilitySensitivity: number;
}

export interface OperatorCalibrationReconciliation {
  projectionType: string;

  systemConfidence: number;
  operatorConfidence: number;

  agreementLevel: number;
  divergenceLevel: number;

  relationshipType: ReconciliationRelationshipType;

  historicalOutcomeAlignment: number;

  operatorAccuracy: OperatorAccuracy;

  reconciliationAnnotations: string[];

  divergenceTrajectory: DivergenceTracePoint[];

  reasonCodes: string[];
}

export interface OperatorCalibrationReconciliationReport {
  operatorId: string;
  overallAgreement: number;
  overallDivergence: number;
  totalReconciliations: number;
  reconciliations: OperatorCalibrationReconciliation[];
  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

export interface OperatorCalibrationReconciliationInput {
  operatorId: string;
  /** Current system calibration report (per projection type). */
  calibrationReport: ProjectionCalibrationReport | null;
  /** Operator's CURRENT confidence preferences per projection type. */
  operatorPreferences: OperatorPreference[];
  /** Optional reconciliation memory for trajectory + drift annotations. */
  reconciliationMemory?: OperatorCalibrationReconciliationMemoryState | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/** Operator slider 0..100 → 0..10 scale to compare against system
 *  calibration historicalAccuracy (also 0..10). */
function operatorConfidenceOnTen(p: OperatorPreference): number {
  return p.confidenceWeight / 10;
}

// ─── relationship classification ──────────────────────────────

function classifyRelationship(args: {
  systemConfidence: number;
  operatorConfidence: number;
  systemAccuracy: number;
  trajectory: DivergenceTracePoint[];
}): ReconciliationRelationshipType {
  const { systemConfidence, operatorConfidence, systemAccuracy, trajectory } = args;
  const delta = operatorConfidence - systemConfidence;

  // First check trajectory-based classifications (need history).
  if (trajectory.length >= 4) {
    // Trajectory volatility — high stdev across deltas → unstable intuition.
    const deltas = trajectory.map((p) => p.delta);
    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const variance = deltas.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / deltas.length;
    if (variance >= 6) return 'unstable-intuition';

    // Improving alignment — recent deltas closer to zero than early.
    const half = Math.floor(trajectory.length / 2);
    const earlyAbsAvg = trajectory.slice(0, half)
      .reduce((a, p) => a + Math.abs(p.delta), 0) / Math.max(1, half);
    const recentAbsAvg = trajectory.slice(half)
      .reduce((a, p) => a + Math.abs(p.delta), 0) / Math.max(1, trajectory.length - half);
    if (earlyAbsAvg - recentAbsAvg >= 1.2) return 'improving-alignment';

    // Historically corrected: operator weight followed system signal
    // over time (operator's recent weight matches system, was different early).
    const earlyOpAvg = trajectory.slice(0, half)
      .reduce((a, p) => a + p.operator, 0) / Math.max(1, half);
    const recentOpAvg = trajectory.slice(half)
      .reduce((a, p) => a + p.operator, 0) / Math.max(1, trajectory.length - half);
    const earlySysAvg = trajectory.slice(0, half)
      .reduce((a, p) => a + p.system, 0) / Math.max(1, half);
    if (Math.abs(recentOpAvg - earlySysAvg) <= 1.2 &&
        Math.abs(earlyOpAvg - earlySysAvg) >= 2.5) {
      return 'historically-corrected';
    }
  }

  // Snapshot-based classifications.
  // Historically over/under-confident depend on accuracy ground truth.
  if (operatorConfidence >= 7 && systemAccuracy <= 4) {
    return 'historically-overconfident';
  }
  if (operatorConfidence <= 3 && systemAccuracy >= 7) {
    return 'historically-underconfident';
  }
  if (Math.abs(delta) < 1.5) return 'aligned';
  if (delta >= 1.5) return 'operator-more-optimistic';
  return 'operator-more-skeptical';
}

// ─── per-projection-type compute ──────────────────────────────

function deriveOperatorAccuracy(
  cal: ProjectionCalibration | null,
  pref: OperatorPreference,
): OperatorAccuracy {
  if (!cal || cal.sampleSize === 0) {
    return {
      shortTerm: 0, longTerm: 0,
      trustSensitivity: 0, fatigueSensitivity: 0, durabilitySensitivity: 0,
    };
  }
  const opOnTen = operatorConfidenceOnTen(pref);
  // shortTerm/longTerm accuracy: 10 - |operator - system axis|
  const shortTerm = round1(clamp10(10 - Math.abs(opOnTen - cal.shortTermAccuracy) * 1.2));
  const longTerm  = round1(clamp10(10 - Math.abs(opOnTen - cal.longTermAccuracy)  * 1.2));
  const trustSensitivity      = round1(clamp10(10 - Math.abs(opOnTen - cal.trustCalibration)      * 1.2));
  const fatigueSensitivity    = round1(clamp10(10 - Math.abs(opOnTen - cal.fatigueCalibration)    * 1.2));
  const durabilitySensitivity = round1(clamp10(10 - Math.abs(opOnTen - cal.durabilityCalibration) * 1.2));
  return {
    shortTerm, longTerm,
    trustSensitivity, fatigueSensitivity, durabilitySensitivity,
  };
}

// ─── annotations ──────────────────────────────────────────────

function buildAnnotations(args: {
  projectionType: string;
  systemConfidence: number;
  operatorConfidence: number;
  systemAccuracy: number;
  relationship: ReconciliationRelationshipType;
  operatorAccuracy: OperatorAccuracy;
  hasCalibration: boolean;
  trajectoryLength: number;
}): string[] {
  const out: string[] = [];
  const {
    systemConfidence, operatorConfidence, systemAccuracy,
    relationship, operatorAccuracy, hasCalibration, trajectoryLength,
  } = args;

  if (!hasCalibration) {
    out.push('no calibration data yet for this projection type — reconciliation neutral');
    return out;
  }

  switch (relationship) {
    case 'aligned':
      out.push(`operator intuition aligned with historical calibration (${operatorConfidence.toFixed(1)} vs ${systemConfidence.toFixed(1)}/10)`);
      break;
    case 'operator-more-optimistic':
      out.push(`operator more optimistic than evidence (${operatorConfidence.toFixed(1)} vs ${systemConfidence.toFixed(1)}/10)`);
      break;
    case 'operator-more-skeptical':
      out.push(`operator more skeptical than evidence (${operatorConfidence.toFixed(1)} vs ${systemConfidence.toFixed(1)}/10)`);
      break;
    case 'historically-corrected':
      out.push(`operator intuition has converged toward system calibration over time`);
      break;
    case 'historically-overconfident':
      out.push(`operator trusts this projection type (${operatorConfidence.toFixed(1)}/10) despite weak historical accuracy (${systemAccuracy.toFixed(1)}/10)`);
      break;
    case 'historically-underconfident':
      out.push(`operator distrusts this projection type (${operatorConfidence.toFixed(1)}/10) despite strong historical accuracy (${systemAccuracy.toFixed(1)}/10)`);
      break;
    case 'unstable-intuition':
      out.push(`operator slider has fluctuated across snapshots — intuition still forming`);
      break;
    case 'improving-alignment':
      out.push(`operator intuition is converging with system calibration across recent snapshots`);
      break;
  }

  // Per-axis observations.
  if (operatorAccuracy.shortTerm >= 7 && operatorAccuracy.longTerm <= 4) {
    out.push(`operator intuition tracks short-term accuracy (${operatorAccuracy.shortTerm}/10) but not long-term (${operatorAccuracy.longTerm}/10)`);
  }
  if (operatorAccuracy.longTerm >= 7 && operatorAccuracy.shortTerm <= 4) {
    out.push(`operator intuition tracks long-term accuracy (${operatorAccuracy.longTerm}/10) but not short-term (${operatorAccuracy.shortTerm}/10)`);
  }
  if (operatorAccuracy.trustSensitivity >= 8) {
    out.push(`operator intuition strongest in trust dimension (${operatorAccuracy.trustSensitivity}/10)`);
  }
  if (operatorAccuracy.fatigueSensitivity >= 8) {
    out.push(`operator intuition strongest in fatigue dimension (${operatorAccuracy.fatigueSensitivity}/10)`);
  }
  if (operatorAccuracy.durabilitySensitivity >= 8) {
    out.push(`operator intuition strongest in durability dimension (${operatorAccuracy.durabilitySensitivity}/10)`);
  }

  if (trajectoryLength < 3) {
    out.push(`reconciliation history short (${trajectoryLength} snapshot(s)) — read cautiously`);
  }

  return out.slice(0, 6);
}

// ─── per-type compute (orchestrator) ──────────────────────────

function buildReconciliation(args: {
  projectionType: string;
  calibration: ProjectionCalibration | null;
  operatorPref: OperatorPreference | null;
  trajectory: DivergenceTracePoint[];
}): OperatorCalibrationReconciliation {
  const { projectionType, calibration, operatorPref, trajectory } = args;
  const reasonCodes: string[] = [];

  const systemConfidence = calibration
    ? round1((calibration.historicalAccuracy + calibration.confidenceLevel) / 2)
    : 0;
  const systemAccuracy = calibration?.historicalAccuracy ?? 0;
  const operatorConfidence = operatorPref ? round1(operatorConfidenceOnTen(operatorPref)) : 5;

  const agreementLevel = round1(clamp10(
    10 - Math.abs(systemConfidence - operatorConfidence),
  ));
  const divergenceLevel = round1(clamp10(
    Math.abs(systemConfidence - operatorConfidence),
  ));

  const relationshipType = classifyRelationship({
    systemConfidence, operatorConfidence, systemAccuracy, trajectory,
  });

  const operatorAccuracy = deriveOperatorAccuracy(calibration, operatorPref ?? {
    operatorId: 'unknown',
    projectionType: projectionType as never,
    confidenceWeight: 50,
    reasonNote: null,
    updatedAt: 0,
  });

  // Historical outcome alignment: how often operator and system agree
  // across the trajectory. Each snapshot contributes (10 - |delta|).
  const historicalOutcomeAlignment = trajectory.length === 0
    ? agreementLevel
    : round1(clamp10(
        trajectory.reduce((a, p) => a + (10 - Math.abs(p.delta)), 0) / trajectory.length,
      ));

  const reconciliationAnnotations = buildAnnotations({
    projectionType,
    systemConfidence, operatorConfidence,
    systemAccuracy,
    relationship: relationshipType,
    operatorAccuracy,
    hasCalibration: !!calibration && calibration.sampleSize > 0,
    trajectoryLength: trajectory.length,
  });

  reasonCodes.push(
    `system-confidence:${systemConfidence}`,
    `operator-confidence:${operatorConfidence}`,
    `agreement:${agreementLevel}`,
    `relationship:${relationshipType}`,
  );
  if (!operatorPref) reasonCodes.push('operator-pref:default');
  if (!calibration || calibration.sampleSize === 0) reasonCodes.push('calibration:no-samples');
  if (trajectory.length > 0) reasonCodes.push(`trajectory:${trajectory.length}`);

  return {
    projectionType,
    systemConfidence,
    operatorConfidence,
    agreementLevel,
    divergenceLevel,
    relationshipType,
    historicalOutcomeAlignment,
    operatorAccuracy,
    reconciliationAnnotations,
    divergenceTrajectory: trajectory.slice(-12),
    reasonCodes,
  };
}

// ─── main ──────────────────────────────────────────────────────

export function computeOperatorCalibrationReconciliation(
  input: OperatorCalibrationReconciliationInput,
): OperatorCalibrationReconciliationReport {
  const { operatorId, calibrationReport, operatorPreferences, reconciliationMemory } = input;
  // Index operator preferences by projection type.
  const operatorByType = new Map<string, OperatorPreference>();
  for (const p of operatorPreferences) operatorByType.set(p.projectionType, p);

  // Index system calibrations by projection type.
  const calibrationByType = new Map<string, ProjectionCalibration>();
  for (const c of calibrationReport?.calibrations ?? []) {
    calibrationByType.set(c.projectionType, c);
  }

  // Union of types from both sides — produce one reconciliation row per type.
  const allTypes = new Set<string>([
    ...operatorByType.keys(),
    ...calibrationByType.keys(),
  ]);

  // Pull trajectory per type from reconciliation memory (filtered to this operator).
  const trajectoryByType = new Map<string, DivergenceTracePoint[]>();
  if (reconciliationMemory) {
    for (const [type, traj] of Object.entries(reconciliationMemory.perTypeTrajectory)) {
      // Trajectory keys are `${operatorId}|${projectionType}`.
      const [opId, projType] = type.split('|');
      if (opId !== operatorId) continue;
      trajectoryByType.set(projType, traj);
    }
  }

  const reconciliations: OperatorCalibrationReconciliation[] = [];
  for (const projectionType of allTypes) {
    reconciliations.push(buildReconciliation({
      projectionType,
      calibration: calibrationByType.get(projectionType) ?? null,
      operatorPref: operatorByType.get(projectionType) ?? null,
      trajectory: trajectoryByType.get(projectionType) ?? [],
    }));
  }

  // Sort by agreement descending for predictable rendering order.
  reconciliations.sort((a, b) =>
    b.agreementLevel !== a.agreementLevel
      ? b.agreementLevel - a.agreementLevel
      : a.projectionType.localeCompare(b.projectionType),
  );

  const overallAgreement = reconciliations.length === 0 ? 0 : round1(
    reconciliations.reduce((a, r) => a + r.agreementLevel, 0) / reconciliations.length,
  );
  const overallDivergence = reconciliations.length === 0 ? 0 : round1(
    reconciliations.reduce((a, r) => a + r.divergenceLevel, 0) / reconciliations.length,
  );

  return {
    operatorId,
    overallAgreement,
    overallDivergence,
    totalReconciliations: reconciliations.length,
    reconciliations,
    reasonCodes: [
      `operator:${operatorId}`,
      `reconciliations:${reconciliations.length}`,
      `overall-agreement:${overallAgreement}`,
      `overall-divergence:${overallDivergence}`,
    ],
  };
}
