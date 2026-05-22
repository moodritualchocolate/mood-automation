/**
 * CAMPAIGN PRIORITY SCORE (Phase 36 — Strategic Priority Engine / Wave 4)
 *
 * Scores how much executive ENERGY a candidate deserves. The system
 * must stop treating every opportunity equally — some are worth
 * deepening, some worth deferring, some worth refusing outright.
 */

export interface CampaignPriorityReading {
  /** 0..10 — overall priority. */
  priority_score: number;
  /** The priority band. */
  band: 'deepen' | 'proceed' | 'defer' | 'refuse';
  notes: string[];
}

export interface CampaignPriorityInput {
  /** 0..10 — how true the candidate is (cognitive-field emergence). */
  truthValue: number;
  /** 0..10 — psychological resonance / recognition. */
  resonance: number;
  /** 0..10 — identity risk (higher = worse). */
  identityRisk: number;
  /** 0..10 — saturation risk (higher = worse). */
  saturationRisk: number;
  /** 0..10 — optimisation-corruption risk (higher = worse). */
  optimizationRisk: number;
}

export function readCampaignPriority(input: CampaignPriorityInput): CampaignPriorityReading {
  const { truthValue, resonance, identityRisk, saturationRisk, optimizationRisk } = input;
  const notes: string[] = [];

  // Priority rewards truth + resonance, penalises every risk.
  let priority_score = 0;
  priority_score += truthValue * 0.4;
  priority_score += resonance * 0.3;
  priority_score -= identityRisk * 0.25;
  priority_score -= saturationRisk * 0.15;
  priority_score -= optimizationRisk * 0.2;
  priority_score = clamp10(round1(priority_score + 3));

  const band: CampaignPriorityReading['band'] =
    identityRisk >= 7 || optimizationRisk >= 8 ? 'refuse'
    : priority_score >= 7 ? 'deepen'
    : priority_score >= 4.5 ? 'proceed'
    : 'defer';

  notes.push(`campaign priority: ${priority_score}/10 — band "${band}"`);
  if (band === 'refuse') notes.push('campaign priority: this opportunity is identity-dangerous — refuse it, do not spend energy on it');
  if (band === 'defer') notes.push('campaign priority: low strategic priority — better deferred than forced');

  return { priority_score, band, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
