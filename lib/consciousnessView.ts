/**
 * CONSCIOUSNESS VIEW (Wave 29 — Hibernation & Idle Consciousness)
 *
 * One module, three concerns:
 *
 *   1. classifyConsciousness(os, organism) — pure function that
 *      reads persisted state and returns a category label. Used by
 *      the orchestrator (to decide wake-transition firing) and by
 *      the dashboard (to render the consciousness panel).
 *
 *   2. applyPassiveMetabolism(os, organism, classification) — applies
 *      tiny deterministic adjustments to OS + organism state while
 *      the organism is not actively cognising. Rate-limited to one
 *      step per METABOLISM_INTERVAL_TICKS passive ticks. Returns the
 *      updated pair or null if no change.
 *
 *   3. buildConsciousnessView(snap) — the dashboard view model.
 *      Surfaces classification, wakeCount, lastWakeTick, idle/
 *      hibernation durations, last cognition tick, cadence state,
 *      and whether passive metabolism is currently drifting.
 *
 * Every value derives from persisted state. No randomness. No
 * directive log entries are added by metabolism — metabolism is
 * physiological, not cognitive. The user's "no cognition drift
 * while hibernating" rule is honored by construction.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type { OSRuntimeState } from './operatingSystemCore';
import type { OrganismVitalState } from './persistentOrganismCore';
import {
  IDLE_AFTER_TICKS,
  HIBERNATE_AFTER_TICKS,
  METABOLISM_INTERVAL_TICKS,
} from './operatingSystemCore';

export type ConsciousnessState = 'active' | 'idle' | 'recovering' | 'hibernating';

// The cadence used for "recovering" classification. Mirrors Wave 28's
// REST_CADENCE_MIN_TICKS without importing it directly (keeps the
// dependency graph one-way).
const REST_CADENCE_LOCK_TICKS = 10;

/**
 * Pure classifier. Reads os + organism state and returns a label.
 * Order of checks matters — earlier checks dominate later ones.
 */
export function classifyConsciousness(
  os: OSRuntimeState,
  organism: OrganismVitalState | null,
): ConsciousnessState {
  if (!organism) return 'active';

  // Pending external work keeps the organism active even after long quiet.
  if (os.pendingExternalActions.length > 0) return 'active';

  // Cadence lock from a recent rest dominates idle/hibernating.
  const lastRestTick = organism.lastRestTick ?? -Infinity;
  const ticksSinceRest = os.uptime - lastRestTick;
  if (lastRestTick !== -Infinity && ticksSinceRest < REST_CADENCE_LOCK_TICKS) {
    return 'recovering';
  }

  const lastCognitionTick = os.directiveLog.length > 0
    ? os.directiveLog[os.directiveLog.length - 1].tick
    : -Infinity;
  const ticksSinceCognition = lastCognitionTick === -Infinity
    ? os.uptime
    : os.uptime - lastCognitionTick;

  const deepIdle =
    ticksSinceCognition >= HIBERNATE_AFTER_TICKS &&
    (organism.energyReserves <= 4 || organism.restCount >= 3);
  if (deepIdle) return 'hibernating';

  const moderateIdle =
    ticksSinceCognition >= IDLE_AFTER_TICKS &&
    os.fragmentationStreak <= 0;
  if (moderateIdle) return 'idle';

  return 'active';
}

/**
 * Passive metabolism — tiny adjustments to OS + organism state while
 * the organism is not actively cognising. Fires only on metabolism
 * ticks (every METABOLISM_INTERVAL_TICKS-th passive tick) and only
 * when classification !== 'active'.
 *
 * Per-step deltas (all clamped):
 *   stressAccumulation     -0.10  (floor 0)
 *   fragmentationStreak    -1 if currently > 0
 *   coordinationEMA        drifts toward 6.0 by 0.10
 *
 * Returns the updated { os, organism } pair, or null when no change
 * is warranted. The caller is responsible for persisting (the
 * /api/runtime route does this after the passive tick fires).
 */
export function applyPassiveMetabolism(
  os: OSRuntimeState,
  organism: OrganismVitalState,
  classification: ConsciousnessState,
): { os: OSRuntimeState; organism: OrganismVitalState } | null {
  if (classification === 'active') return null;
  if (os.uptime % METABOLISM_INTERVAL_TICKS !== 0) return null;

  let changed = false;

  let stress = organism.stressAccumulation;
  if (stress > 0) {
    const newStress = Math.max(0, Math.round((stress - 0.10) * 10) / 10);
    if (newStress !== stress) {
      stress = newStress;
      changed = true;
    }
  }

  let fragment = os.fragmentationStreak;
  if (fragment > 0) {
    fragment = Math.max(0, fragment - 1);
    changed = true;
  }

  let coord = os.coordinationEMA;
  const distFromBaseline = 6.0 - coord;
  if (Math.abs(distFromBaseline) >= 0.10) {
    const step = distFromBaseline > 0 ? +0.10 : -0.10;
    const newCoord = Math.max(0, Math.min(10, Math.round((coord + step) * 10) / 10));
    if (newCoord !== coord) {
      coord = newCoord;
      changed = true;
    }
  }

  if (!changed) return null;

  return {
    os: { ...os, coordinationEMA: coord, fragmentationStreak: fragment },
    organism: { ...organism, stressAccumulation: stress },
  };
}

export interface ConsciousnessViewModel {
  present: boolean;
  state: ConsciousnessState;
  wakeCount: number;
  lastWakeTick?: number;
  lastWakeAt?: number;
  lastCognitionTick?: number;
  ticksSinceCognition?: number;
  ticksSinceRest?: number;
  idleForTicks?: number;
  hibernatingForTicks?: number;
  cadenceLocked: boolean;
  passiveMetabolismActive: boolean;
  /** Number of passive ticks until the next metabolism step fires.
   *  0 means a step is due on this very tick. Undefined when
   *  metabolism is not active (state === 'active'). */
  passiveMetabolismInTicks?: number;
  statement: string;
}

export function buildConsciousnessView(snap: RuntimeSnapshot): ConsciousnessViewModel {
  const os = snap.os;
  const organism = snap.organism;
  if (!os || !organism) {
    return {
      present: false, state: 'active', wakeCount: 0,
      cadenceLocked: false, passiveMetabolismActive: false,
      statement: 'no runtime — consciousness state unavailable',
    };
  }

  const state = classifyConsciousness(os, organism);

  const lastCognitionTick = os.directiveLog.length > 0
    ? os.directiveLog[os.directiveLog.length - 1].tick
    : undefined;
  const ticksSinceCognition = lastCognitionTick != null
    ? os.uptime - lastCognitionTick
    : undefined;

  const lastRestTick = organism.lastRestTick;
  const ticksSinceRest = lastRestTick != null
    ? os.uptime - lastRestTick
    : undefined;

  const idleForTicks =
    (state === 'idle' || state === 'hibernating') ? ticksSinceCognition : undefined;
  const hibernatingForTicks =
    state === 'hibernating'
      ? (ticksSinceCognition != null
          ? Math.max(0, ticksSinceCognition - HIBERNATE_AFTER_TICKS)
          : undefined)
      : undefined;

  const cadenceLocked = state === 'recovering';
  const passiveMetabolismActive = state !== 'active';
  const passiveMetabolismInTicks = passiveMetabolismActive
    ? (METABOLISM_INTERVAL_TICKS - (os.uptime % METABOLISM_INTERVAL_TICKS)) % METABOLISM_INTERVAL_TICKS
    : undefined;

  const statement =
    state === 'active'      ? 'organism is active — cognition recent or work pending' :
    state === 'recovering'  ? `organism is in cooldown — ${ticksSinceRest ?? '?'} ticks since rest` :
    state === 'idle'        ? `organism is idle — ${idleForTicks ?? '?'} ticks since last cognition` :
                              `organism is hibernating — ${idleForTicks ?? '?'} ticks of quiet, awaiting deliberate wake`;

  return {
    present: true,
    state,
    wakeCount: os.wakeCount ?? 0,
    lastWakeTick: os.lastWakeTick,
    lastWakeAt: os.lastWakeAt,
    lastCognitionTick,
    ticksSinceCognition,
    ticksSinceRest,
    idleForTicks,
    hibernatingForTicks,
    cadenceLocked,
    passiveMetabolismActive,
    passiveMetabolismInTicks,
    statement,
  };
}
