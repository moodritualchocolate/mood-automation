/**
 * STRATEGIC PRIORITY ENGINE (Phase 36 — Wave 4: Executive Cognition)
 *
 * The system stops treating every opportunity equally. This module
 * synthesises the Phase 36 sensors into one strategic-priority
 * reading — deciding which candidates deserve executive energy, and
 * which should be deferred, refused, or sacrificed.
 *
 * Meta-critic question: "Is this strategically wise, or merely
 * emotionally effective?"
 */

import { readCampaignPriority } from './campaignPriorityScore';
import { weightRealityImportance, type ImportanceKind } from './realityImportanceWeight';
import { readLongTermVsShortTerm } from './longTermVsShortTerm';
import { readExecutiveTradeoffs } from './executiveTradeoffEngine';
import { mapCognitiveUrgency, type UrgencyKind } from './cognitiveUrgencyMap';

export interface StrategicPriorityReading {
  strategic_weight: number;        // 0..10
  identity_risk: number;           // 0..10
  truth_value: number;             // 0..10
  fatigue_cost: number;            // 0..10
  saturation_probability: number;  // 0..10
  cultural_importance: number;     // 0..10
  long_term_equity: number;        // 0..10
  priority_band: 'deepen' | 'proceed' | 'defer' | 'refuse';
  dominant_importance: ImportanceKind;
  urgency_kind: UrgencyKind;
  /** True when proceeding would be strategically unwise. */
  strategically_unwise: boolean;
  /** True when the candidate is merely emotionally effective. */
  merely_emotionally_effective: boolean;
  executiveSummary: string;
  notes: string[];
}

export interface StrategicPriorityInput {
  truthValue: number;
  resonance: number;
  identityRisk: number;
  saturationRisk: number;
  optimizationRisk: number;
  viralityRisk: number;
  engagementPull: number;
  engagementDepth: number;
  emotionalNovelty: number;
  outputPressure: number;
  fatigue: number;
  culturalImportance: number;
}

export function readStrategicPriority(input: StrategicPriorityInput): StrategicPriorityReading {
  const {
    truthValue, resonance, identityRisk, saturationRisk, optimizationRisk, viralityRisk,
    engagementPull, engagementDepth, emotionalNovelty, outputPressure, fatigue, culturalImportance,
  } = input;
  const notes: string[] = [];

  const priority = readCampaignPriority({ truthValue, resonance, identityRisk, saturationRisk, optimizationRisk });
  const longTerm = readLongTermVsShortTerm({ truthValue, resonance, identityRisk, engagementPull, engagementDepth });
  const importance = weightRealityImportance({
    truthValue, resonance, longTermEquity: longTerm.long_term_equity, engagementPull, identityRisk,
  });
  const tradeoffs = readExecutiveTradeoffs({ truthValue, engagementPull, identityRisk, saturationRisk, viralityRisk });
  const urgency = mapCognitiveUrgency({ truthValue, emotionalNovelty, outputPressure, fatigue });

  // Strategic weight — priority, lifted by long-term equity and real
  // urgency, cut by temptation and false urgency.
  let strategic_weight = priority.priority_score;
  strategic_weight += (longTerm.long_term_equity - 5) * 0.3;
  if (urgency.urgency_kind === 'real-urgency') strategic_weight += 1;
  if (importance.is_a_temptation) strategic_weight -= 2;
  if (urgency.speaking_from_discomfort) strategic_weight -= 2;
  strategic_weight = clamp10(round1(strategic_weight));

  const strategically_unwise =
    priority.band === 'refuse' ||
    importance.dominant_kind === 'identity-dangerous' ||
    importance.is_a_temptation ||
    urgency.speaking_from_discomfort;

  // Merely emotionally effective: the candidate is emotionally
  // important but neither strategically important nor long-term sound.
  const merely_emotionally_effective =
    importance.emotionally_important >= 6 &&
    importance.strategically_important < 5 &&
    longTerm.long_term_equity < 5;

  const executiveSummary =
    `priority "${priority.band}" · strategic weight ${strategic_weight}/10 · ` +
    `${importance.dominant_kind} · urgency ${urgency.urgency_kind} · ` +
    `${longTerm.recommendation}`;

  notes.push(`strategic priority: ${executiveSummary}`);
  if (strategically_unwise) notes.push('strategic priority: proceeding here would be strategically UNWISE');
  if (merely_emotionally_effective) notes.push('strategic priority: this is merely emotionally effective — not strategically wise');
  notes.push(...priority.notes, ...importance.notes, ...longTerm.notes, ...tradeoffs.notes, ...urgency.notes);

  return {
    strategic_weight,
    identity_risk: round1(identityRisk),
    truth_value: round1(truthValue),
    fatigue_cost: round1(fatigue),
    saturation_probability: round1(saturationRisk),
    cultural_importance: round1(culturalImportance),
    long_term_equity: longTerm.long_term_equity,
    priority_band: priority.band,
    dominant_importance: importance.dominant_kind,
    urgency_kind: urgency.urgency_kind,
    strategically_unwise,
    merely_emotionally_effective,
    executiveSummary,
    notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
