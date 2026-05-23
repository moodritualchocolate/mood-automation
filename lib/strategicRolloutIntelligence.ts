/**
 * STRATEGIC ROLLOUT INTELLIGENCE (Phase 192 — Wave 12: Autonomous Action Architecture)
 *
 * A campaign is a sequence, not a single shot. This module decides the
 * rollout posture — lead, build, sustain, or pause — so each action
 * lands in the right place in the arc.
 */

export type RolloutPosture = 'lead' | 'build' | 'sustain' | 'pause';

export interface StrategicRolloutReading {
  rollout_posture: RolloutPosture;
  /** 0..10 — how well-sequenced the rollout is. */
  rollout_coherence: number;
  rollout_note: string;
  notes: string[];
}

export interface StrategicRolloutInput {
  /** Actions authorized so far in the campaign. */
  actionsAuthorized: number;
  /** True when the moment is ripe (Wave 11). */
  timingRipe: boolean;
  /** 0..10 — recovery time owed to the audience. */
  recoveryDebt: number;
}

export function readStrategicRolloutIntelligence(input: StrategicRolloutInput): StrategicRolloutReading {
  const { actionsAuthorized, timingRipe, recoveryDebt } = input;
  const notes: string[] = [];

  const rollout_posture: RolloutPosture =
    recoveryDebt >= 7 ? 'pause' :
    actionsAuthorized === 0 && timingRipe ? 'lead' :
    actionsAuthorized < 4 ? 'build' :
    'sustain';

  const rollout_coherence = round1(Math.max(0, Math.min(10,
    8 - recoveryDebt * 0.4 + (timingRipe ? 1 : 0))));

  const rollout_note =
    rollout_posture === 'lead' ? 'lead the rollout — open the arc with the strongest statement'
    : rollout_posture === 'build' ? 'build the rollout — each action deepens the one before'
    : rollout_posture === 'sustain' ? 'sustain the rollout — hold presence without escalating'
    : 'pause the rollout — the sequence needs a rest before its next beat';

  notes.push(`strategic rollout intelligence: ${rollout_posture} (coherence ${rollout_coherence}/10) — ${rollout_note}`);
  return { rollout_posture, rollout_coherence, rollout_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
