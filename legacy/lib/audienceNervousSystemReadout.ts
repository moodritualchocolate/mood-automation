/**
 * AUDIENCE NERVOUS SYSTEM READOUT (Phase 233 — Wave 13: Reality Feedback Infrastructure)
 *
 * The audience is a nervous system the organism is acting on. This
 * module reads its state — calm, alert, fatigued, agitated — so the
 * next action can choose the right pressure to place on it.
 */

export type NervousSystemState = 'calm' | 'alert' | 'fatigued' | 'agitated' | 'overloaded';

export interface AudienceNervousSystemReadoutReading {
  nervous_system_state: NervousSystemState;
  /** 0..10 — how much pressure the audience can absorb right now. */
  absorb_capacity: number;
  /** True when an action now would harm the audience nervous system. */
  next_action_would_harm: boolean;
  notes: string[];
}

export interface AudienceNervousSystemReadoutInput {
  /** 0..10 — audience fatigue. */
  audienceFatigue: number;
  /** 0..10 — collective emotional volatility. */
  emotionalVolatility: number;
  /** 0..10 — digital overload. */
  digitalOverload: number;
}

export function readAudienceNervousSystemReadout(input: AudienceNervousSystemReadoutInput): AudienceNervousSystemReadoutReading {
  const { audienceFatigue, emotionalVolatility, digitalOverload } = input;
  const notes: string[] = [];

  const overload = (audienceFatigue + emotionalVolatility + digitalOverload) / 3;

  const nervous_system_state: NervousSystemState =
    overload >= 8 ? 'overloaded' :
    emotionalVolatility >= 7 ? 'agitated' :
    audienceFatigue >= 7 ? 'fatigued' :
    overload >= 5 ? 'alert' : 'calm';

  const absorb_capacity = round1(Math.max(0, Math.min(10, 10 - overload)));
  const next_action_would_harm = nervous_system_state === 'overloaded' || nervous_system_state === 'fatigued';

  notes.push(`audience nervous system readout: ${nervous_system_state} (absorb capacity ${absorb_capacity}/10)` +
    (next_action_would_harm ? ' — another action now would harm the audience nervous system' : ''));
  return { nervous_system_state, absorb_capacity, next_action_would_harm, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
