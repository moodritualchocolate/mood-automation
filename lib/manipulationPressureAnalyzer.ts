/**
 * MANIPULATION PRESSURE ANALYZER (pure, human-protective)
 *
 * Detects ESCALATING MANIPULATION PRESSURE across recent outputs.
 * Pure deterministic. Same input → same output.
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - HUMAN-PROTECTIVE: signals here are designed to flag manipulation
 *     so the operator can reduce it — never to amplify it
 *   - never auto-applied
 *
 * The 13 signals come directly from the system directive list. Each
 * is scored 0..10; the aggregate maps to a level enum.
 */

import type { HumanTruthInput } from './humanTruthIntelligence';

export type ManipulationLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface ManipulationSignal {
  signal: string;
  severity: number;        // 0..10
  explanation: string;
}

export interface ManipulationPressureReading {
  pressureLevel: ManipulationLevel;
  pressureScore: number;   // 0..10
  signals: ManipulationSignal[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — manipulation signals are surfaced so the operator can ' +
  'REDUCE them. The system never uses these signals to amplify pressure.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function levelOf(score: number): ManipulationLevel {
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 4) return 'moderate';
  return 'low';
}

export function computeManipulationPressure(
  input: HumanTruthInput,
): ManipulationPressureReading {
  const narrativeFps = (input.narrativeDNA?.fingerprints ?? []).slice(-12);
  const visualFps    = (input.visualDNA?.fingerprints ?? []).slice(-12);
  const driftObs     = (input.drift?.observations ?? []).slice(-12);
  const outcomes     = (input.outcomes?.outcomes ?? []).slice(-24);

  const avgCta = avg(narrativeFps.map((f) => f.ctaPressure ?? 0));
  const avgPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const avgMutation = avg(outcomes.map((o) => o.mutationPressure ?? 0));
  const burstCadenceShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'burst').length / outcomes.length;
  const polish = avg(visualFps.map((f) => f.polishLevel ?? 5));
  const realism = avg(visualFps.map((f) => f.realismLevel ?? 5));

  const signals: ManipulationSignal[] = [];

  // 1. excessive urgency
  const urgencyOutcomes = outcomes.filter((o) =>
    o.downstreamOutcome === 'aggressive-cta-rejection' ||
    o.downstreamOutcome === 'conversion-spike',
  ).length;
  const urgencyRate = outcomes.length === 0 ? 0 : urgencyOutcomes / outcomes.length;
  const excessiveUrgency = clamp10(urgencyRate * 10);
  if (excessiveUrgency >= 4) signals.push({
    signal: 'excessive-urgency',
    severity: r1(excessiveUrgency),
    explanation: `${urgencyOutcomes}/${outcomes.length} recent outcomes labeled aggressive / conversion-pushed`,
  });

  // 2. hyper-CTA density
  const ctaPressure = clamp10(avgCta);
  if (ctaPressure >= 6) signals.push({
    signal: 'hyper-cta-density',
    severity: r1(ctaPressure),
    explanation: `recent CTA pressure averaging ${r1(ctaPressure)}/10`,
  });

  // 3. emotional force stacking
  // High persuasion intensity + low realism = force-stacked emotion.
  const forceStack = clamp10(avgPersuasion * 0.6 + (10 - realism) * 0.4);
  if (forceStack >= 6) signals.push({
    signal: 'emotional-force-stacking',
    severity: r1(forceStack),
    explanation: `persuasion ${r1(avgPersuasion)}/10 with realism only ${r1(realism)}/10`,
  });

  // 4. artificial inspiration
  // Cinematic polish + heavy aspirational language.
  const artificialInspiration = clamp10(polish * 0.6 + Math.max(0, avgCta - 4) * 0.8);
  if (artificialInspiration >= 6) signals.push({
    signal: 'artificial-inspiration',
    severity: r1(artificialInspiration),
    explanation: `polished visuals (${r1(polish)}/10) with elevated CTA pressure`,
  });

  // 5. fake vulnerability
  // Vulnerable framing + high polish + high persuasion.
  const fakeVulnerability = clamp10(
    polish * 0.4 + avgPersuasion * 0.4 +
    (visualFps.length === 0 ? 0 : 4),
  );
  if (fakeVulnerability >= 7) signals.push({
    signal: 'fake-vulnerability',
    severity: r1(fakeVulnerability),
    explanation: 'vulnerable framing combined with high polish and persuasion',
  });

  // 6. outrage bait
  // High share + comments without retention (low retention high engagement = inflammation).
  const outrageProxy = outcomes.filter((o) =>
    (o.metrics?.shares ?? 0) >= 3 &&
    (o.metrics?.comments ?? 0) >= 5 &&
    (o.metrics?.retention ?? 1) <= 0.3,
  ).length;
  const outrageRate = outcomes.length === 0 ? 0 : outrageProxy / outcomes.length;
  const outrageBait = clamp10(outrageRate * 12);
  if (outrageBait >= 4) signals.push({
    signal: 'outrage-bait',
    severity: r1(outrageBait),
    explanation: `${outrageProxy} record(s) with high shares + comments but low retention (engagement without depth)`,
  });

  // 7. retention trapping
  // Very high retention but trust formation absent.
  const trapping = outcomes.filter((o) =>
    (o.metrics?.retention ?? 0) >= 0.7 &&
    (o.metrics?.follows ?? 0) === 0 &&
    o.downstreamOutcome !== 'trust-formation',
  ).length;
  const trappingRate = outcomes.length === 0 ? 0 : trapping / outcomes.length;
  const retentionTrapping = clamp10(trappingRate * 12);
  if (retentionTrapping >= 4) signals.push({
    signal: 'retention-trapping',
    severity: r1(retentionTrapping),
    explanation: `${trapping} record(s) retained attention but produced no trust formation`,
  });

  // 8. attention aggression
  const attentionAggression = clamp10(burstCadenceShare * 8 + avgMutation * 0.4);
  if (attentionAggression >= 6) signals.push({
    signal: 'attention-aggression',
    severity: r1(attentionAggression),
    explanation: `burst cadence in ${Math.round(burstCadenceShare * 100)}% of recent outputs`,
  });

  // 9. algorithmic overstimulation
  // High mutation pressure + low realism.
  const overstim = clamp10(avgMutation * 0.6 + (10 - realism) * 0.4);
  if (overstim >= 6) signals.push({
    signal: 'algorithmic-overstimulation',
    severity: r1(overstim),
    explanation: `high mutation pressure with low realism`,
  });

  // 10. sensory overload
  // Polished + dense + fast.
  const fastCadence = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'burst' || o.cadenceState === 'normal').length / outcomes.length;
  const denseSilence = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.silenceUsage === 'dense').length / narrativeFps.length;
  const sensoryOverload = clamp10(polish * 0.4 + fastCadence * 4 + denseSilence * 4);
  if (sensoryOverload >= 6) signals.push({
    signal: 'sensory-overload',
    severity: r1(sensoryOverload),
    explanation: `polished + dense + fast composition pattern`,
  });

  // 11. emotional compression
  // Low emotional diversity in recent window.
  const avgEmotionalDiversity = avg(driftObs.map((o) => o.emotionalDiversity ?? 5));
  const emotionalCompression = clamp10(10 - avgEmotionalDiversity);
  if (emotionalCompression >= 6) signals.push({
    signal: 'emotional-compression',
    severity: r1(emotionalCompression),
    explanation: `emotional diversity at ${r1(avgEmotionalDiversity)}/10 (single register dominating)`,
  });

  // 12. synthetic intimacy
  // Vulnerable framing + cinematic polish + high CTA.
  const syntheticIntimacy = clamp10(polish * 0.4 + avgCta * 0.4 + 2);
  if (syntheticIntimacy >= 7) signals.push({
    signal: 'synthetic-intimacy',
    severity: r1(syntheticIntimacy),
    explanation: 'intimate framing combined with polished delivery and CTA',
  });

  // 13. conversion obsession
  const conversionShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'conversion-spike').length / outcomes.length;
  const conversionObsession = clamp10(conversionShare * 12);
  if (conversionObsession >= 4) signals.push({
    signal: 'conversion-obsession',
    severity: r1(conversionObsession),
    explanation: `${Math.round(conversionShare * 100)}% of recent outcomes were conversion-driven`,
  });

  signals.sort((a, b) => b.severity - a.severity || a.signal.localeCompare(b.signal));

  // Aggregate pressure score: weighted toward the highest severity
  // signals rather than the mean, so a single critical signal can
  // still drive the level high.
  const pressureScore = signals.length === 0
    ? 0
    : r1(clamp10(
      Math.max(...signals.map((s) => s.severity)) * 0.7 +
      avg(signals.map((s) => s.severity)) * 0.3,
    ));

  const pressureLevel = levelOf(pressureScore);

  return {
    pressureLevel,
    pressureScore,
    signals,
    reasonCodes: [
      `pressure-level:${pressureLevel}`,
      `pressure-score:${pressureScore}/10`,
      `signal-count:${signals.length}`,
      ...signals.slice(0, 5).map((s) => `${s.signal}:${s.severity}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
