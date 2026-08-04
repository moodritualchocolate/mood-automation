/**
 * ADAPTIVE EMOTIONAL INTELLIGENCE (Phase 25)
 *
 * The top-level synthesis of Phase 25. It reads every other Phase 25
 * signal and emits the campaign's single ADAPTATION DIRECTIVE — what
 * the campaign organism should do differently, right now, to stay a
 * living model of human reality rather than a self-referential
 * generator.
 *
 * This is the closing module of the 25-phase architecture. It does
 * not generate. It governs.
 */

import type { AutonomousNarrativeReading } from './autonomousNarrativeEngine';
import type { CulturalSignalEvolutionReading } from './culturalSignalEvolution';
import type { SelfUpdatingPsychologyReading } from './selfUpdatingPsychology';
import type { EmergentCampaignMemoryReading } from './emergentCampaignMemory';
import type { CollectiveRealityTrackingReading } from './collectiveRealityTracking';

export type AdaptationDirective =
  | 'hold-course'
  | 'disrupt-the-rut'
  | 'resync-with-reality'
  | 'retire-dead-patterns'
  | 'name-the-emergent-thesis'
  | 'go-quiet-and-observe';

export interface AdaptiveEmotionalIntelligenceReading {
  directive: AdaptationDirective;
  /** 0..10 — how urgently the campaign needs to adapt. */
  adaptation_urgency: number;
  /** A one-line statement of the campaign's living state. */
  organism_state: string;
  notes: string[];
}

export interface AdaptiveEmotionalIntelligenceInput {
  autonomousNarrative: AutonomousNarrativeReading;
  culturalSignalEvolution: CulturalSignalEvolutionReading;
  selfUpdatingPsychology: SelfUpdatingPsychologyReading;
  emergentCampaignMemory: EmergentCampaignMemoryReading;
  collectiveRealityTracking: CollectiveRealityTrackingReading;
}

export function readAdaptiveEmotionalIntelligence(input: AdaptiveEmotionalIntelligenceInput): AdaptiveEmotionalIntelligenceReading {
  const {
    autonomousNarrative, culturalSignalEvolution, selfUpdatingPsychology,
    emergentCampaignMemory, collectiveRealityTracking,
  } = input;
  const notes: string[] = [];

  // Priority order: reality sync > rut > dead patterns > emergent
  // thesis > narrative move.
  let directive: AdaptationDirective;
  let adaptation_urgency: number;

  if (collectiveRealityTracking.campaign_self_referential) {
    directive = 'resync-with-reality';
    adaptation_urgency = 9;
    notes.push('adaptation: campaign has drifted from reality — resync is the priority');
  } else if (emergentCampaignMemory.has_emergent_rut) {
    directive = 'disrupt-the-rut';
    adaptation_urgency = 8;
    notes.push('adaptation: an emergent signature has become a rut — disruption required');
  } else if (selfUpdatingPsychology.update_pressure >= 6) {
    directive = 'retire-dead-patterns';
    adaptation_urgency = 7;
    notes.push('adaptation: dead emotional patterns are still in use — retire them');
  } else if (autonomousNarrative.next_move === 'name-what-has-been-implied') {
    directive = 'name-the-emergent-thesis';
    adaptation_urgency = 6;
    notes.push('adaptation: the campaign thesis is ready to be named');
  } else if (culturalSignalEvolution.evolution_velocity >= 7) {
    directive = 'go-quiet-and-observe';
    adaptation_urgency = 5;
    notes.push('adaptation: cultural signal is moving fast — observe before speaking');
  } else {
    directive = 'hold-course';
    adaptation_urgency = 3;
    notes.push('adaptation: the campaign organism is healthy — hold course');
  }

  const organism_state = collectiveRealityTracking.campaign_self_referential
    ? 'the campaign organism is talking to itself'
    : emergentCampaignMemory.has_emergent_rut
      ? 'the campaign organism has a habit it cannot see'
      : `the campaign organism is alive and ${autonomousNarrative.next_move.replace(/-/g, ' ')}`;

  notes.push(`organism state: ${organism_state}`);
  return { directive, adaptation_urgency, organism_state, notes };
}
