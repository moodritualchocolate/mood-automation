/**
 * ANTI-OPTIMIZATION LAYER (Phase 33 — Wave 2: Reality Execution)
 *
 * Protects the system from becoming a performance machine. The
 * biggest danger of Wave 2 is that real data corrupts human truth.
 * This module synthesises the Phase 33 sensors into one verdict.
 *
 * Hard rule: performance is a signal, not a master.
 *
 * Meta-critic question: "Are we improving the campaign, or training
 * it to become less truthful?"
 */

import type { CreativeDirection } from '@/core/types';
import { readPerformanceCorruption } from './performanceCorruptionDetector';
import { readTruthVsEngagement } from './truthVsEngagement';
import { readAlgorithmicPressure } from './algorithmicPressureShield';
import { readViralityImmuneSystem } from './viralityImmuneSystem';

export interface AntiOptimizationReading {
  optimizationRisk: number;
  engagementCorruption: number;
  algorithmicPressure: number;
  truthCompromise: boolean;
  trendContamination: boolean;
  viralityRisk: number;
  brandIntegrityRisk: number;
  /** True when "improving" the campaign would make it less truthful. */
  optimization_corrupts_truth: boolean;
  recommendedResistance: string;
  notes: string[];
}

export interface AntiOptimizationInput {
  direction: CreativeDirection;
  hookStrength: number;
  aftertaste: number;
  truthStrength: number;
  attentionIsLoud: boolean;
  recognition: number;
  engagementStrength: number;
  engagementDepth: number;
  viralContamination: number;
  usesOverCirculatedVocab: boolean;
  commentPerformativeness: number;
  trendContaminationFlagged: boolean;
}

export function readAntiOptimization(input: AntiOptimizationInput): AntiOptimizationReading {
  const {
    direction, hookStrength, aftertaste, truthStrength, attentionIsLoud, recognition,
    engagementStrength, engagementDepth, viralContamination, usesOverCirculatedVocab,
    commentPerformativeness, trendContaminationFlagged,
  } = input;
  const notes: string[] = [];

  const corruption = readPerformanceCorruption({
    hookStrength, aftertaste, truthStrength, attentionIsLoud, recognition,
  });
  const truthEngagement = readTruthVsEngagement({
    truthStrength, engagementStrength, engagementDepth,
  });
  const algorithmic = readAlgorithmicPressure({
    direction, truthStrength, trendContaminationFlagged,
  });
  const virality = readViralityImmuneSystem({
    viralContamination, usesOverCirculatedVocab, commentPerformativeness, truthStrength,
  });

  const truthCompromise = corruption.performance_weakened_truth || truthEngagement.verdict === 'engagement-chasing';
  const trendContamination = algorithmic.drift_signatures.includes('trend-contamination')
    || virality.signatures.includes('over-circulated-viral-vocabulary');

  const brandIntegrityRisk = round1(Math.min(10,
    corruption.corruption_score * 0.35 +
    algorithmic.algorithmic_pressure * 0.3 +
    virality.virality_risk * 0.35));

  const optimizationRisk = round1(Math.min(10,
    corruption.corruption_score * 0.4 +
    algorithmic.algorithmic_pressure * 0.3 +
    virality.virality_risk * 0.3));

  const optimization_corrupts_truth = truthCompromise || virality.immune_response_triggered;

  let recommendedResistance: string;
  if (optimization_corrupts_truth) {
    recommendedResistance = 'RESIST — improving these metrics would train the campaign to be less truthful; hold the human truth';
  } else if (optimizationRisk >= 5) {
    recommendedResistance = 'watch — mild optimisation pressure; treat performance as a signal, not a master';
  } else {
    recommendedResistance = 'clear — performance and truth are not in conflict';
  }

  notes.push(`anti-optimization: ${optimization_corrupts_truth ? 'optimisation WOULD corrupt truth — resist' : 'optimisation is safe here'} (risk ${optimizationRisk}/10)`);
  notes.push(...corruption.notes, ...truthEngagement.notes, ...algorithmic.notes, ...virality.notes);

  return {
    optimizationRisk,
    engagementCorruption: corruption.corruption_score,
    algorithmicPressure: algorithmic.algorithmic_pressure,
    truthCompromise,
    trendContamination,
    viralityRisk: virality.virality_risk,
    brandIntegrityRisk,
    optimization_corrupts_truth,
    recommendedResistance,
    notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
