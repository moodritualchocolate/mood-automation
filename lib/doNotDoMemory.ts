/**
 * DO-NOT-DO MEMORY (Phase 35 — Autonomous Creative Direction / Wave 2)
 *
 * Compiles the campaign's DO-NOT-DO list — the concrete things the
 * next run must not do, gathered from every warning the Wave 2
 * sensors raised: saturation, fatigue, drift, optimisation
 * corruption, identity risk.
 *
 * A creative decision without a do-not-do list is not a decision.
 */

import type { CampaignNervousSystemReading } from './campaignNervousSystem';
import type { EmotionalContinuityRuntimeReading } from './emotionalContinuityRuntime';
import type { AntiOptimizationReading } from './antiOptimization';
import type { IdentityPersistenceReading } from './identityPersistence';
import type { AudienceRealityFeedbackReading } from './audienceRealityFeedback';

export interface DoNotDoMemoryReading {
  do_not_do: string[];
  /** The single most important prohibition. */
  primary_prohibition: string | null;
  notes: string[];
}

export interface DoNotDoMemoryInput {
  nervousSystem: CampaignNervousSystemReading;
  continuity: EmotionalContinuityRuntimeReading;
  antiOptimization: AntiOptimizationReading;
  identity: IdentityPersistenceReading;
  feedback: AudienceRealityFeedbackReading;
}

export function compileDoNotDoMemory(input: DoNotDoMemoryInput): DoNotDoMemoryReading {
  const { nervousSystem, continuity, antiOptimization, identity, feedback } = input;
  const notes: string[] = [];
  const do_not_do: string[] = [];

  if (nervousSystem.saturationRisk >= 6 && nervousSystem.motifOveruse.length) {
    do_not_do.push(`do not reuse the overused motif "${nervousSystem.motifOveruse[0]}"`);
  }
  if (nervousSystem.truthWeakening) {
    do_not_do.push('do not restate the weakening truth — find the next emotional move');
  }
  for (const w of continuity.decayWarnings) {
    do_not_do.push(`do not ignore: ${w}`);
  }
  if (antiOptimization.optimization_corrupts_truth) {
    do_not_do.push('do not optimise toward the recent engagement signal — it would corrupt human truth');
  }
  if (antiOptimization.trendContamination) {
    do_not_do.push('do not absorb trend / viral vocabulary');
  }
  if (identity.violatedRefusals.length) {
    do_not_do.push(`do not drift toward: ${identity.violatedRefusals.join(', ')}`);
  }
  if (feedback.has_feedback && feedback.response_corrupts_truth) {
    do_not_do.push('do not repeat what produced the shallow response');
  }
  if (do_not_do.length === 0) {
    do_not_do.push('do not become loud, performative, or platform-native — hold the restrained MOOD voice');
  }

  const primary_prohibition = do_not_do[0] ?? null;
  notes.push(`do-not-do memory: ${do_not_do.length} prohibition(s) compiled`);

  return { do_not_do, primary_prohibition, notes };
}
