/**
 * STRATEGIC PATIENCE RUNTIME (Phase 158 — Wave 11: Strategic Future Intelligence)
 *
 * The hardest strategic act is the deliberate wait. This runtime
 * decides when patience — not speed — is the move: when the moment is
 * early, when debt is high, when waiting compounds more than acting.
 */

import type { MarketTimingReading } from './marketTimingIntelligence';
import type { FutureScenarioReading } from './futureScenarioSimulation';

export interface StrategicPatienceReading {
  /** True when the runtime recommends patience over acting now. */
  recommend_patience: boolean;
  /** 0..10 — how strongly patience is the move. */
  patience_strength: number;
  patience_case: string;
  notes: string[];
}

export interface StrategicPatienceInput {
  timing: MarketTimingReading;
  scenarios: FutureScenarioReading;
  /** 0..10 — accrued strategic debt. */
  strategicDebt: number;
}

export function readStrategicPatience(input: StrategicPatienceInput): StrategicPatienceReading {
  const { timing, scenarios, strategicDebt } = input;
  const notes: string[] = [];

  let patience_strength = 0;
  if (timing.timing === 'too-early') patience_strength += 4;
  if (timing.timing === 'missed') patience_strength += 3;
  if (scenarios.expected_future < 4) patience_strength += 2.5;
  patience_strength += Math.max(0, (strategicDebt - 5) * 0.5);
  // A genuinely ripe moment overrides mild patience pressure.
  if (timing.timing === 'ripe') patience_strength -= 3;
  patience_strength = round1(Math.max(0, Math.min(10, patience_strength)));

  const recommend_patience = patience_strength >= 6;

  const patience_case = !recommend_patience
    ? 'the moment rewards acting — patience is not the stronger move here'
    : timing.timing === 'too-early'
      ? 'the moment is early — waiting one cycle compounds more than acting now'
      : 'debt and a thin expected future make patience the disciplined move';

  notes.push(`strategic patience runtime: ${recommend_patience ? 'RECOMMEND PATIENCE' : 'acting is appropriate'} ` +
    `(${patience_strength}/10) — ${patience_case}`);
  return { recommend_patience, patience_strength, patience_case, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
