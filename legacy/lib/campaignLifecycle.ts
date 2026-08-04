/**
 * CAMPAIGN LIFECYCLE (Phase 40 — Wave 4: Executive Cognition)
 *
 * Campaigns become living entities with a lifecycle. This module
 * synthesises the Phase 40 sensors and assigns the campaign a
 * lifecycle STATE — and the runtime fields that describe its health.
 *
 * The lifecycle state is derived entirely from the persisted trail,
 * so it survives a restart: the campaign remembers how old it is.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import { readNarrativeMomentum } from './narrativeMomentum';
import { readEmotionalArcPersistence } from './emotionalArcPersistence';
import { readCampaignEvolution, type CampaignEvolutionMove } from './campaignEvolutionEngine';
import { readCampaignRetirement } from './campaignRetirement';
import { readReawakeningTriggers } from './reawakeningTriggers';

export type CampaignLifecycleState =
  | 'emerging' | 'deepening' | 'culturally-recognized' | 'overexposed'
  | 'emotionally-drained' | 'identity-risk' | 'dormant' | 'recoverable' | 'timeless';

export interface CampaignLifecycleReading {
  lifecycle_state: CampaignLifecycleState;
  campaign_health: number;          // 0..10
  emotional_age: number;
  truth_decay: number;              // 0..10
  recognition_depth: number;        // 0..10
  reawakening_probability: number;  // 0..10
  evolution_move: CampaignEvolutionMove;
  /** True when an exhausted direction should be retired. */
  should_retire: boolean;
  /** A dormant family worth reawakening, if any. */
  reawaken_family: string | null;
  lifecycleSummary: string;
  notes: string[];
}

export interface CampaignLifecycleInput {
  trail: EmotionalTraceEntry[];
  /** 0..10 — recent recognition depth (audience feedback). */
  recognitionDepth: number;
  /** 0..10 — identity risk (Phase 39 governance). */
  identityRisk: number;
}

export function readCampaignLifecycle(input: CampaignLifecycleInput): CampaignLifecycleReading {
  const { trail, recognitionDepth, identityRisk } = input;
  const notes: string[] = [];

  const momentum = readNarrativeMomentum({ trail });
  const arc = readEmotionalArcPersistence({ trail });
  const evolution = readCampaignEvolution({ trail, momentum: momentum.momentum, truthDecay: arc.truth_decay });
  const retirement = readCampaignRetirement({ trail, truthDecay: arc.truth_decay });
  const reawakening = readReawakeningTriggers({ trail });

  const emotional_age = arc.emotional_age;
  const truth_decay = arc.truth_decay;
  const recognition_depth = round1(recognitionDepth);

  // Campaign health — momentum + arc persistence − decay − identity risk.
  let campaign_health = 0;
  campaign_health += momentum.momentum * 0.35;
  campaign_health += arc.arc_persistence * 0.3;
  campaign_health -= truth_decay * 0.25;
  campaign_health -= identityRisk * 0.2;
  campaign_health = clamp10(round1(campaign_health + 3));

  // Lifecycle state.
  let lifecycle_state: CampaignLifecycleState;
  if (emotional_age < 3) lifecycle_state = 'emerging';
  else if (identityRisk >= 7) lifecycle_state = 'identity-risk';
  else if (retirement.should_retire) lifecycle_state = 'emotionally-drained';
  else if (truth_decay >= 7) lifecycle_state = 'overexposed';
  else if (momentum.is_stalled && reawakening.reawaken_candidate) lifecycle_state = 'recoverable';
  else if (momentum.is_stalled) lifecycle_state = 'dormant';
  else if (recognition_depth >= 7 && arc.arc_holds) lifecycle_state = 'culturally-recognized';
  else if (emotional_age >= 25 && campaign_health >= 7) lifecycle_state = 'timeless';
  else lifecycle_state = 'deepening';

  const lifecycleSummary =
    `${lifecycle_state} — age ${emotional_age}, health ${campaign_health}/10, ` +
    `truth decay ${truth_decay}/10, evolution "${evolution.evolution_move}"`;

  notes.push(`campaign lifecycle: ${lifecycleSummary}`);
  notes.push(...momentum.notes, ...arc.notes, ...evolution.notes, ...retirement.notes, ...reawakening.notes);

  return {
    lifecycle_state,
    campaign_health,
    emotional_age,
    truth_decay,
    recognition_depth,
    reawakening_probability: reawakening.reawakening_probability,
    evolution_move: evolution.evolution_move,
    should_retire: retirement.should_retire,
    reawaken_family: reawakening.reawaken_candidate?.family ?? null,
    lifecycleSummary,
    notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
