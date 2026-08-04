/**
 * EMOTIONAL CONTINUITY RUNTIME (Phase 31 — Wave 2: Reality Execution)
 *
 * Campaigns must not emotionally reset. This module synthesises the
 * Phase 31 sensors (truth fatigue, motif decay, atmosphere continuity,
 * emotional arc memory) and DECIDES the campaign's next emotional
 * move: continue, deepen, reverse, interrupt, or retire.
 *
 * Meta-critic question: "Is this the next emotional move, or just
 * another expression of the same feeling?"
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { HumanTruth } from '@/core/types';
import { readTruthFatigue } from './truthFatigue';
import { readMotifDecay } from './motifDecay';
import { readAtmosphereContinuity } from './atmosphereContinuity';
import { readEmotionalArcMemory, type EmotionalArc } from './emotionalArcMemory';

export type EmotionalMove = 'continue' | 'deepen' | 'reverse' | 'interrupt' | 'retire';

export interface EmotionalContinuityRuntimeReading {
  activeEmotionalArc: EmotionalArc;
  arcProgression: number;
  truthFatigue: number;
  motifDecay: number;
  atmosphereContinuity: number;
  emotionalRepetitionRisk: number;
  nextEmotionalMove: EmotionalMove;
  continueOrDisrupt: 'continue' | 'disrupt';
  decayWarnings: string[];
  /** True when the banner is the next emotional move, not a repeat. */
  is_the_next_move: boolean;
  notes: string[];
}

export interface EmotionalContinuityRuntimeInput {
  trail: EmotionalTraceEntry[];
  candidateTruth: HumanTruth;
  candidateFamily: string;
  candidateMotifs: string[];
}

export function readEmotionalContinuityRuntime(input: EmotionalContinuityRuntimeInput): EmotionalContinuityRuntimeReading {
  const { trail, candidateTruth, candidateFamily, candidateMotifs } = input;
  const notes: string[] = [];

  const fatigue = readTruthFatigue({ trail, candidateTruth });
  const decay = readMotifDecay({ trail, candidateMotifs });
  const atmosphere = readAtmosphereContinuity({ trail, candidateFamily });
  const arc = readEmotionalArcMemory({ trail });

  const decayWarnings: string[] = [];
  if (fatigue.truth_became_slogan) decayWarnings.push('the truth has worn into a slogan');
  if (decay.motif_decay_detected) decayWarnings.push(`the motif "${decay.most_decayed!.motif}" has decayed`);
  if (atmosphere.atmosphere_decorative) decayWarnings.push('the atmosphere has become decorative');
  if (arc.arc_stalled) decayWarnings.push('the emotional arc has stalled');

  const motifDecayScore = decay.most_decayed?.decay ?? 0;

  // Emotional repetition risk — the central Phase 31 danger.
  let emotionalRepetitionRisk = 0;
  emotionalRepetitionRisk += fatigue.truth_fatigue * 0.4;
  emotionalRepetitionRisk += motifDecayScore * 0.3;
  if (arc.arc_stalled) emotionalRepetitionRisk += 3;
  if (atmosphere.atmosphere_decorative) emotionalRepetitionRisk += 2;
  emotionalRepetitionRisk = round1(Math.min(10, emotionalRepetitionRisk));

  // Decide the next emotional move.
  let nextEmotionalMove: EmotionalMove;
  if (fatigue.truth_became_slogan && fatigue.truth_fatigue >= 7) nextEmotionalMove = 'retire';
  else if (arc.arc_stalled) nextEmotionalMove = 'interrupt';
  else if (atmosphere.emotional_reset_detected) nextEmotionalMove = 'reverse';
  else if (arc.active_arc === 'escalating' || arc.active_arc === 'deepening') nextEmotionalMove = 'deepen';
  else nextEmotionalMove = 'continue';

  const continueOrDisrupt: 'continue' | 'disrupt' =
    (nextEmotionalMove === 'continue' || nextEmotionalMove === 'deepen') ? 'continue' : 'disrupt';

  // It is the next move when repetition risk is contained AND the move
  // is not a flat 'continue' on a stalled / decorative campaign.
  const is_the_next_move =
    emotionalRepetitionRisk < 6 &&
    !(nextEmotionalMove === 'continue' && (arc.arc_stalled || atmosphere.atmosphere_decorative));

  notes.push(`emotional continuity: arc ${arc.active_arc}, next move "${nextEmotionalMove}", repetition risk ${emotionalRepetitionRisk}/10`);
  notes.push(...fatigue.notes, ...decay.notes, ...atmosphere.notes, ...arc.notes);

  return {
    activeEmotionalArc: arc.active_arc,
    arcProgression: arc.arc_progression,
    truthFatigue: fatigue.truth_fatigue,
    motifDecay: round1(motifDecayScore),
    atmosphereContinuity: atmosphere.atmosphere_continuity,
    emotionalRepetitionRisk,
    nextEmotionalMove,
    continueOrDisrupt,
    decayWarnings,
    is_the_next_move,
    notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
