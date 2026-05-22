/**
 * COGNITIVE ENERGY MODEL (Phase 37 — Wave 4: Executive Cognition)
 *
 * The system must understand exhaustion — its own, and the
 * audience's. This module synthesises the Phase 37 sensors and
 * answers the executive question the system must now ask:
 *
 *   "Should we speak?" — not "can we post?"
 *
 * Hard gates:
 *   - high fatigue + low novelty → recommend silence
 *   - attention extraction exceeds emotional value → reject
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { BannerEngagement } from './engagementMemory';
import { readOutputFatigue } from './outputFatigue';
import { readAudienceExhaustion } from './audienceExhaustionTracker';
import { readCreativeRecoveryCycles } from './creativeRecoveryCycles';
import { readEmotionalOverexposure } from './emotionalOverexposure';
import { readAttentionDepletion } from './attentionDepletionEngine';

export interface CognitiveEnergyReading {
  outputFatigue: number;
  audienceFatigue: number;
  recoveryNeed: number;
  overexposure: number;
  truthSaturation: number;
  attentionEconomy: number;
  /** 0..10 — overall cognitive energy available to speak well. */
  cognitive_energy: number;
  /** True when the system should speak now. */
  should_speak: boolean;
  /** True when silence is the wiser move. */
  recommend_silence: boolean;
  /** True when the banner depletes more attention than it returns. */
  depletes_attention: boolean;
  reason: string;
  notes: string[];
}

export interface CognitiveEnergyInput {
  trail: EmotionalTraceEntry[];
  engagements: BannerEngagement[];
  emotionalNovelty: number;        // 0..10
  hookStrength: number;            // 0..10
  loudness: number;                // 0..10
  aftertaste: number;              // 0..10
  recognition: number;             // 0..10
}

export function readCognitiveEnergy(input: CognitiveEnergyInput): CognitiveEnergyReading {
  const { trail, engagements, emotionalNovelty, hookStrength, loudness, aftertaste, recognition } = input;
  const notes: string[] = [];

  const output = readOutputFatigue({ trail, emotionalNovelty });
  const audience = readAudienceExhaustion({ engagements });
  const recovery = readCreativeRecoveryCycles({ trail });
  const overexposure = readEmotionalOverexposure({ trail });
  const depletion = readAttentionDepletion({ hookStrength, loudness, aftertaste, recognition });

  // Cognitive energy — what is left to speak well with.
  let cognitive_energy = 10;
  cognitive_energy -= output.output_fatigue * 0.3;
  cognitive_energy -= audience.audience_fatigue * 0.25;
  cognitive_energy -= recovery.recovery_need * 0.2;
  cognitive_energy -= overexposure.overexposure * 0.25;
  cognitive_energy = clamp10(round1(cognitive_energy));

  const fatigueHigh = output.output_fatigue >= 6 || audience.audience_fatigue >= 6 || overexposure.overexposure >= 6;
  const noveltyLow = emotionalNovelty < 5;
  const depletes_attention = depletion.extraction_exceeds_value;

  // Hard gate: high fatigue + low novelty → recommend silence.
  const recommend_silence = (fatigueHigh && noveltyLow) || recovery.recommend_cooldown;
  const should_speak = !recommend_silence && cognitive_energy >= 4;

  let reason: string;
  if (depletes_attention) {
    reason = 'the banner extracts more attention than it returns — it should not be spoken';
  } else if (recommend_silence) {
    reason = fatigueHigh && noveltyLow
      ? 'fatigue is high and emotional novelty is low — silence is the wiser move'
      : 'the campaign needs a recovery window — silence before the next output';
  } else if (should_speak) {
    reason = 'cognitive energy is sufficient and there is something novel to say — the system should speak';
  } else {
    reason = 'cognitive energy is low — speak only if the truth genuinely demands it';
  }

  notes.push(`cognitive energy: ${cognitive_energy}/10 — ${should_speak ? 'SHOULD SPEAK' : 'should NOT speak'}; ${reason}`);
  notes.push(...output.notes, ...audience.notes, ...recovery.notes, ...overexposure.notes, ...depletion.notes);

  return {
    outputFatigue: output.output_fatigue,
    audienceFatigue: audience.audience_fatigue,
    recoveryNeed: recovery.recovery_need,
    overexposure: overexposure.overexposure,
    truthSaturation: overexposure.truth_saturation,
    attentionEconomy: depletion.attention_economy,
    cognitive_energy,
    should_speak,
    recommend_silence,
    depletes_attention,
    reason,
    notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
