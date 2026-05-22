/**
 * CAMPAIGN EVOLUTION ENGINE (Phase 40 — Strategic Campaign Lifecycles / Wave 4)
 *
 * Decides how the campaign should EVOLVE — continue naturally, deepen
 * a theme, evolve into a new register, or hold. A campaign is a
 * living entity; it must grow, not loop.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export type CampaignEvolutionMove = 'continue-naturally' | 'deepen-the-theme' | 'evolve-the-register' | 'hold';

export interface CampaignEvolutionReading {
  evolution_move: CampaignEvolutionMove;
  /** 0..10 — how much the campaign needs to evolve now. */
  evolution_need: number;
  reason: string;
  notes: string[];
}

export interface CampaignEvolutionInput {
  trail: EmotionalTraceEntry[];
  /** 0..10 — narrative momentum (Phase 40). */
  momentum: number;
  /** 0..10 — truth decay (Phase 40). */
  truthDecay: number;
}

export function readCampaignEvolution(input: CampaignEvolutionInput): CampaignEvolutionReading {
  const { trail, momentum, truthDecay } = input;
  const notes: string[] = [];

  if (trail.length < 3) {
    return {
      evolution_move: 'continue-naturally', evolution_need: 2,
      reason: 'the campaign is still opening — continue naturally',
      notes: ['campaign evolution: campaign opening'],
    };
  }

  let evolution_move: CampaignEvolutionMove;
  let reason: string;
  let evolution_need: number;

  if (truthDecay >= 7) {
    evolution_move = 'evolve-the-register';
    reason = 'the founding truth has decayed — the campaign must evolve into a new emotional register';
    evolution_need = 8;
  } else if (momentum < 4) {
    evolution_move = 'deepen-the-theme';
    reason = 'momentum has stalled — deepen the theme rather than widen it';
    evolution_need = 7;
  } else if (momentum >= 7) {
    evolution_move = 'continue-naturally';
    reason = 'the campaign has momentum — continue the arc naturally';
    evolution_need = 3;
  } else {
    evolution_move = 'hold';
    reason = 'the campaign is mid-arc and steady — hold and let the next true thing arrive';
    evolution_need = 4;
  }

  notes.push(`campaign evolution: ${evolution_move} — ${reason}`);
  return { evolution_move, evolution_need, reason, notes };
}
