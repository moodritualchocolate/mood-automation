/**
 * AUTONOMOUS ACTION THROTTLE (Phase 209 — Wave 12: Autonomous Action Architecture)
 *
 * The final rate limiter on autonomy. Even when every gate passes,
 * this throttle caps how fast the organism may act — so autonomy can
 * never accelerate into a runaway loop.
 */

export type ThrottleLevel = 'open' | 'limited' | 'closed';

export interface ActionThrottleReading {
  throttle_level: ThrottleLevel;
  /** True when the throttle permits action this cycle. */
  throttle_permits_action: boolean;
  throttle_reason: string;
  notes: string[];
}

export interface ActionThrottleInput {
  /** 0..10 — current execution load. */
  executionLoad: number;
  /** True when action is compulsive (Phase 200). */
  isCompulsive: boolean;
  /** 0..10 — restraint still available. */
  restraintBudget: number;
}

export function readAutonomousActionThrottle(input: ActionThrottleInput): ActionThrottleReading {
  const { executionLoad, isCompulsive, restraintBudget } = input;
  const notes: string[] = [];

  const throttle_level: ThrottleLevel =
    isCompulsive || restraintBudget <= 1.5 ? 'closed' :
    executionLoad >= 6.5 || restraintBudget <= 4 ? 'limited' :
    'open';

  const throttle_permits_action = throttle_level !== 'closed';

  const throttle_reason =
    throttle_level === 'closed'
      ? (isCompulsive ? 'throttle closed — compulsive action detected, autonomy halted' : 'throttle closed — restraint depleted')
      : throttle_level === 'limited'
        ? 'throttle limited — action allowed at a reduced rate'
        : 'throttle open — autonomy may proceed at full rate';

  notes.push(`autonomous action throttle: ${throttle_level} — ${throttle_reason}`);
  return { throttle_level, throttle_permits_action, throttle_reason, notes };
}
