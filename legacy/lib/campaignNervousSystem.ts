/**
 * CAMPAIGN NERVOUS SYSTEM (Phase 28 — Wave 2: Reality Execution)
 *
 * The campaign must now feel LIVE. This module synthesises the four
 * Phase 28 sensors — performance pulse, audience signal state,
 * campaign saturation, emotional fatigue — into one nervous-system
 * reading. The campaign should know: "something in the audience is
 * changing."
 *
 * Meta-critic question: "Is this campaign still emotionally alive, or
 * is it only repeating itself?"
 */

import type { BannerEngagement } from './engagementMemory';
import type { EmotionalTraceEntry } from './humanMemory';
import { readPerformancePulse, type CampaignPulse } from './performancePulse';
import { readAudienceSignalState } from './audienceSignalState';
import { readCampaignSaturation } from './campaignSaturation';
import { readEmotionalFatigue } from './emotionalFatigueMonitor';

export interface CampaignNervousSystemReading {
  campaignPulse: CampaignPulse;
  signalStrength: number;
  emotionalFatigue: number;
  saturationRisk: number;
  audienceDrift: number;
  motifOveruse: string[];
  resonanceTrend: number;
  truthWeakening: boolean;
  attentionPattern: 'rising' | 'holding' | 'fading' | 'cold';
  /** True when the campaign reads as still emotionally alive. */
  emotionally_alive: boolean;
  recommendedResponse: string;
  notes: string[];
}

export interface CampaignNervousSystemInput {
  engagements: BannerEngagement[];
  trail: EmotionalTraceEntry[];
}

export function readCampaignNervousSystem(input: CampaignNervousSystemInput): CampaignNervousSystemReading {
  const { engagements, trail } = input;
  const notes: string[] = [];

  const pulse = readPerformancePulse({ engagements });
  const signal = readAudienceSignalState({ engagements });
  const saturation = readCampaignSaturation({ trail });
  const fatigue = readEmotionalFatigue({ trail });

  const attentionPattern: CampaignNervousSystemReading['attentionPattern'] =
    pulse.pulse === 'spike' ? 'rising' :
    pulse.pulse === 'steady' ? 'holding' :
    pulse.pulse === 'declining' || pulse.pulse === 'flat' ? 'fading' : 'cold';

  // The campaign is emotionally alive when it is not saturated, not
  // fatigued, and its truth is not weakening.
  const emotionally_alive =
    saturation.saturation_risk < 6 &&
    fatigue.emotional_fatigue < 6 &&
    !fatigue.truth_weakening &&
    !saturation.repeated_territory;

  let recommendedResponse: string;
  if (!emotionally_alive) {
    if (saturation.repeated_territory) {
      recommendedResponse = `change emotional territory — "${saturation.overexposed_territory}" is saturated`;
    } else if (fatigue.truth_weakening) {
      recommendedResponse = 'the truth is becoming a slogan — find the next emotional move, not another expression of the same one';
    } else {
      recommendedResponse = 'the campaign is fatiguing — disrupt the motif and deepen, do not repeat';
    }
  } else if (attentionPattern === 'fading' || attentionPattern === 'cold') {
    recommendedResponse = 'resonance is low — sharpen the human truth; do not chase loudness';
  } else {
    recommendedResponse = 'the campaign is alive — continue the arc, evolve the motif';
  }

  notes.push(`campaign nervous system: pulse ${pulse.pulse}, ${emotionally_alive ? 'EMOTIONALLY ALIVE' : 'REPEATING ITSELF'}`);
  notes.push(...pulse.notes, ...signal.notes, ...saturation.notes, ...fatigue.notes);

  return {
    campaignPulse: pulse.pulse,
    signalStrength: signal.signal_strength,
    emotionalFatigue: fatigue.emotional_fatigue,
    saturationRisk: saturation.saturation_risk,
    audienceDrift: signal.audience_drift,
    motifOveruse: saturation.motif_overuse,
    resonanceTrend: fatigue.resonance_trend,
    truthWeakening: fatigue.truth_weakening,
    attentionPattern,
    emotionally_alive,
    recommendedResponse,
    notes,
  };
}
