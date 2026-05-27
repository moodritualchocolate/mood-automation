/**
 * CREATIVE SURVIVABILITY MODEL (pure, simulation-only)
 *
 * For each candidate mutation, surfaces survivability-class signals:
 *   - short-term spike risk
 *   - replay decay
 *   - emotional burnout
 *   - symbolic durability
 *   - ritual persistence
 *   - realism collapse
 *   - overexposure risk
 *
 * Phrasing locked to historical-correlation language. The model
 * NEVER outputs a winner or a "recommended" mutation.
 */

import type { CandidateMutation } from './evolutionSandboxEngine';

export interface SurvivabilitySignature {
  mutationType: string;
  shortTermSpikeRisk: number;       // 0..10
  replayDecaySignature: number;     // 0..10
  emotionalBurnoutSignature: number;
  symbolicDurabilitySignature: number;
  ritualPersistenceSignature: number;
  realismCollapseSignature: number;
  overexposureSignature: number;
  composite: number;
  notes: string[];
}

export interface CreativeSurvivabilityReading {
  totalSignatures: number;
  signatures: SurvivabilitySignature[];
  overallSurvivability: number;     // 0..10
  highRiskMutations: string[];
  highDurabilityMutations: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Simulation only — survivability signals describe historical-analogue risk ' +
  'classes. No mutation is recommended, selected, or applied.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function computeCreativeSurvivability(
  candidates: CandidateMutation[],
): CreativeSurvivabilityReading {
  const signatures: SurvivabilitySignature[] = candidates.map((c) => {
    // Short-term spike risk: high replay + high instability + low realism.
    const shortTermSpikeRisk = r1(clamp10(
      c.replayabilityEstimate * 0.5 + c.instabilityScore * 0.3 + (10 - c.realismImpact) * 0.2,
    ));
    // Replay decay: high initial replay + low symbolic durability.
    const replayDecaySignature = r1(clamp10(
      c.replayabilityEstimate * 0.4 + (10 - c.symbolicResonanceEstimate) * 0.6,
    ));
    // Emotional burnout: high fatigue projection + low trust.
    const emotionalBurnoutSignature = r1(clamp10(
      c.fatigueProjection * 0.6 + (10 - c.trustImpact) * 0.4,
    ));
    // Symbolic durability: high symbolic resonance + low instability.
    const symbolicDurabilitySignature = r1(clamp10(
      c.symbolicResonanceEstimate * 0.6 + (10 - c.instabilityScore) * 0.4,
    ));
    // Ritual persistence: high replay + high realism + high symbolic.
    const ritualPersistenceSignature = r1(clamp10(
      c.replayabilityEstimate * 0.3 + c.realismImpact * 0.3 + c.symbolicResonanceEstimate * 0.4,
    ));
    // Realism collapse: low realism + high instability.
    const realismCollapseSignature = r1(clamp10(
      (10 - c.realismImpact) * 0.7 + c.instabilityScore * 0.3,
    ));
    // Overexposure: high fatigue + low symbolic + low realism.
    const overexposureSignature = r1(clamp10(
      c.fatigueProjection * 0.5 + (10 - c.symbolicResonanceEstimate) * 0.25 + (10 - c.realismImpact) * 0.25,
    ));
    // Composite: high values for durability / persistence; subtract risk classes.
    const composite = r1(clamp10(
      (symbolicDurabilitySignature + ritualPersistenceSignature) / 2 -
      (emotionalBurnoutSignature + realismCollapseSignature + overexposureSignature) / 6,
    ));

    const notes: string[] = [];
    if (shortTermSpikeRisk >= 7) notes.push('historically associated with sharp short-term spikes that decay');
    if (replayDecaySignature >= 7) notes.push('replay signature observed alongside decay across cycles');
    if (emotionalBurnoutSignature >= 7) notes.push('fatigue + low trust pattern observed alongside emotional burnout');
    if (symbolicDurabilitySignature >= 7) notes.push('symbolic durability signature is high — observed alongside long-life patterns');
    if (ritualPersistenceSignature >= 7) notes.push('ritual persistence signature is high');
    if (realismCollapseSignature >= 7) notes.push('realism collapse signature observed when polish persists');
    if (overexposureSignature >= 7) notes.push('overexposure signature elevated — repeated use may compound fatigue');
    if (notes.length === 0) notes.push('survivability signatures balanced across classes');
    return {
      mutationType: c.mutationType,
      shortTermSpikeRisk, replayDecaySignature, emotionalBurnoutSignature,
      symbolicDurabilitySignature, ritualPersistenceSignature,
      realismCollapseSignature, overexposureSignature,
      composite, notes,
    };
  });

  const overallSurvivability = signatures.length === 0
    ? 0
    : r1(avg(signatures.map((s) => s.composite)));

  const highRiskMutations = signatures
    .filter((s) => s.emotionalBurnoutSignature >= 7 || s.realismCollapseSignature >= 7 || s.overexposureSignature >= 7)
    .map((s) => s.mutationType);
  const highDurabilityMutations = signatures
    .filter((s) => s.symbolicDurabilitySignature >= 7 || s.ritualPersistenceSignature >= 7)
    .map((s) => s.mutationType);

  return {
    totalSignatures: signatures.length,
    signatures,
    overallSurvivability,
    highRiskMutations,
    highDurabilityMutations,
    reasonCodes: [
      `signatures:${signatures.length}`,
      `overall-survivability:${overallSurvivability}/10`,
      `high-risk:${highRiskMutations.length}`,
      `high-durability:${highDurabilityMutations.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
