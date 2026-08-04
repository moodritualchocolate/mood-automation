/**
 * CONSEQUENCE SEVERITY ENGINE (pure, advisory)
 *
 * Classifies a consequence episode into one of four severity levels:
 *
 *   minor    — small repetition rise; cosmetic shifts; magnitude < 2
 *   moderate — temporary emotional flattening; reversible drift; magnitude 2..4
 *   severe   — identity erosion acceleration; multi-axis movement; magnitude 4..6
 *              OR any catastrophic-class outcome at lower magnitude
 *   critical — trust collapse following aggressive optimization; magnitude > 6
 *              OR catastrophic outcome combined with high magnitude
 *
 * Same input → same output. The engine ranks; it does not act.
 */

import type {
  ConsequenceEpisode, ConsequenceOutcome, OutcomeDeltas,
} from './consequenceIntelligenceMemory';

export type ConsequenceSeverity = 'minor' | 'moderate' | 'severe' | 'critical';

const CATASTROPHIC_OUTCOMES: ReadonlySet<ConsequenceOutcome> = new Set([
  'trust-collapsed',
  'persuasion-collapsed',
  'identity-eroded',
  'campaign-coherence-degraded',
  'aggression-escalation-failed',
]);

const RECOVERY_OUTCOMES: ReadonlySet<ConsequenceOutcome> = new Set([
  'trust-recovered',
  'fatigue-improved',
  'originality-restored',
  'persuasion-stabilized',
  'identity-stabilized',
  'convergence-reversed',
  'emotional-realism-improved',
  'campaign-coherence-recovered',
]);

function totalAxisActivity(deltas: OutcomeDeltas): number {
  return (
    Math.abs(deltas.trustDebt) +
    Math.abs(deltas.fatigue) +
    Math.abs(deltas.originalityPressure) +
    Math.abs(deltas.persuasionVariance) +
    Math.abs(deltas.visualConvergence) +
    Math.abs(deltas.emotionalFlattening) +
    Math.abs(deltas.overallCreativeHealth)
  );
}

export function classifyConsequenceSeverity(
  episode: Pick<ConsequenceEpisode, 'downstreamOutcome' | 'outcomeMagnitude' | 'deltas' | 'secondaryOutcomes'>,
): ConsequenceSeverity {
  const m = episode.outcomeMagnitude;
  const cumulative = totalAxisActivity(episode.deltas);
  const catastrophic = CATASTROPHIC_OUTCOMES.has(episode.downstreamOutcome) ||
    episode.secondaryOutcomes.some((o) => CATASTROPHIC_OUTCOMES.has(o));
  const recovery = RECOVERY_OUTCOMES.has(episode.downstreamOutcome);

  // Recovery outcomes are never critical — recovery is by definition good.
  if (recovery) {
    if (m >= 5 || cumulative >= 12) return 'severe';   // strong recovery still notable
    if (m >= 3 || cumulative >= 7)  return 'moderate';
    return 'minor';
  }

  if (m > 6 || cumulative > 16) return 'critical';
  if (catastrophic && m >= 3)   return 'severe';
  if (m >= 4 || cumulative > 10) return 'severe';
  if (m >= 2 || cumulative > 4)  return 'moderate';
  return 'minor';
}

export function explainSeverity(
  severity: ConsequenceSeverity,
  episode: Pick<ConsequenceEpisode, 'downstreamOutcome' | 'outcomeMagnitude' | 'condition'>,
): string {
  const c = episode.condition;
  const contextBits: string[] = [];
  if (c.trustDebt >= 6)         contextBits.push(`trust debt ${c.trustDebt}/10`);
  if (c.mutationPressure >= 6)  contextBits.push(`mutation pressure ${c.mutationPressure}/10`);
  if (c.visualConvergence >= 6) contextBits.push(`visual convergence ${c.visualConvergence}/10`);
  if (c.fatigue >= 6)           contextBits.push(`fatigue ${c.fatigue}/10`);
  const ctx = contextBits.length > 0 ? ` (context: ${contextBits.join(', ')})` : '';
  return `${severity}: ${episode.downstreamOutcome} at magnitude ${episode.outcomeMagnitude}/10${ctx}`;
}
