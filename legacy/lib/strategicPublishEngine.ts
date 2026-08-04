/**
 * STRATEGIC PUBLISH ENGINE (Phase 183 — Wave 12: Autonomous Action Architecture)
 *
 * Once an action is authorized and justified, this engine decides the
 * publish posture — ship it, hold it for a better moment, or withhold
 * it entirely.
 */

import type { MarketTiming } from './marketTimingIntelligence';

export type PublishDecision = 'publish' | 'hold' | 'withhold';

export interface StrategicPublishReading {
  publish_decision: PublishDecision;
  /** 0..10 — how ready the action is to be published now. */
  publish_readiness: number;
  publish_note: string;
  notes: string[];
}

export interface StrategicPublishInput {
  authorized: boolean;
  actionShouldExist: boolean;
  timing: MarketTiming;
  recommendSilence: boolean;
}

export function readStrategicPublishEngine(input: StrategicPublishInput): StrategicPublishReading {
  const { authorized, actionShouldExist, timing, recommendSilence } = input;
  const notes: string[] = [];

  let publish_readiness = 5;
  if (authorized) publish_readiness += 2;
  if (actionShouldExist) publish_readiness += 2;
  if (timing === 'ripe') publish_readiness += 1.5;
  if (timing === 'too-early') publish_readiness -= 2;
  if (timing === 'missed') publish_readiness -= 3;
  if (recommendSilence) publish_readiness -= 4;
  publish_readiness = round1(Math.max(0, Math.min(10, publish_readiness)));

  const publish_decision: PublishDecision =
    !authorized || !actionShouldExist || recommendSilence ? 'withhold' :
    timing === 'too-early' || timing === 'missed' ? 'hold' :
    'publish';

  const publish_note =
    publish_decision === 'publish' ? 'ship it — authorized, justified, and well-timed'
    : publish_decision === 'hold' ? 'hold it — sound action, wrong moment; wait for the window'
    : 'withhold it — this action should not enter the world';

  notes.push(`strategic publish engine: ${publish_decision} (readiness ${publish_readiness}/10) — ${publish_note}`);
  return { publish_decision, publish_readiness, publish_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
