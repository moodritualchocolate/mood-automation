/**
 * CONTRADICTION FIELD VIEW (Wave 32)
 *
 * Derives the dashboard view model. No invented values. Every number
 * and every "dominant tension" reference is a comparison or aggregation
 * of real numbers in the contradiction-memory archive.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  ContradictionMemoryState,
  TensionPair,
  SacrificeEvent,
  ResolvedTensionEvent,
} from './contradictionMemory';

export type ContradictionFieldStatus = 'stable' | 'tense' | 'critical';

export interface ContradictionFieldViewModel {
  present: boolean;
  status: ContradictionFieldStatus;
  /** 0..10 — max tension across all pairs. */
  conflictIntensity: number;
  /** 0..10 — weighted-mean tension × weight. */
  systemTension: number;
  /** 0..10 — fraction of pairs above 5, scaled to 10. */
  goalCollisionRate: number;
  /** 0..10 — weighted by pair tensionWeight + goal priority. */
  strategicInstability: number;
  /** 0..10 — tension on high-priority (≥ 7) goals. */
  identityStress: number;
  /** 0..10 — inverse of systemTension, plus a bonus from recent
   *  resolution events. */
  resolutionCapacity: number;
  /** Top tensions by current tensionScore × tensionWeight. */
  dominantTensions: Array<{
    pairId: string;
    goalATitle: string;
    opposingPressureLabel: string;
    tensionScore: number;
    tensionWeight: number;
  }>;
  /** Goals currently in fragmented/abandoned state due to (or contributing
   *  to) elevated tension. Surfaces unstable identity components. */
  unstableGoals: string[];
  /** Last 5 resolution events. */
  recentResolutions: ResolvedTensionEvent[];
  /** Last 5 sacrifice events. */
  recentSacrifices: SacrificeEvent[];
  statement: string;
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }

export function buildContradictionFieldView(snap: RuntimeSnapshot): ContradictionFieldViewModel {
  const contradiction = snap.contradictionMemory ?? null;
  const purpose = snap.purposeMemory ?? null;
  if (!contradiction || contradiction.pairs.length === 0) {
    return {
      present: false,
      status: 'stable',
      conflictIntensity: 0, systemTension: 0,
      goalCollisionRate: 0, strategicInstability: 0,
      identityStress: 0, resolutionCapacity: 10,
      dominantTensions: [], unstableGoals: [],
      recentResolutions: [], recentSacrifices: [],
      statement: 'no contradiction memory yet',
    };
  }

  const pairs = contradiction.pairs;

  // conflictIntensity = max tension across all pairs.
  const conflictIntensity = pairs.length === 0
    ? 0
    : round1(Math.max(...pairs.map((p) => p.tensionScore)));

  // systemTension = mean of (tension × weight / 10) across pairs.
  const systemTension = pairs.length === 0
    ? 0
    : round1(
        pairs.reduce((a, p) => a + (p.tensionScore * p.tensionWeight) / 10, 0)
        / pairs.length,
      );

  // goalCollisionRate = fraction of pairs with tension > 5, scaled to 10.
  const collisionCount = pairs.filter((p) => p.tensionScore > 5).length;
  const goalCollisionRate = pairs.length === 0
    ? 0
    : round1((collisionCount / pairs.length) * 10);

  // strategicInstability = mean(tensionScore × pair.tensionWeight × (goal.priority/10))
  // — pressures matter more when both the pair's weight and the goal's
  // priority are high.
  const goalById = new Map((purpose?.goals ?? []).map((g) => [g.id, g] as const));
  const strategicInstability = pairs.length === 0
    ? 0
    : round1(clamp10(
        pairs.reduce((a, p) => {
          const goal = goalById.get(p.goalAId);
          const priorityFactor = goal ? (goal.priority / 10) : 0.6;
          return a + (p.tensionScore * (p.tensionWeight / 10) * priorityFactor);
        }, 0) / pairs.length,
      ));

  // identityStress = mean tension on pairs whose goal has priority ≥ 7.
  const highPriorityPairs = pairs.filter((p) => {
    const goal = goalById.get(p.goalAId);
    return goal && goal.priority >= 7;
  });
  const identityStress = highPriorityPairs.length === 0
    ? 0
    : round1(
        highPriorityPairs.reduce((a, p) => a + p.tensionScore, 0)
        / highPriorityPairs.length,
      );

  // resolutionCapacity = baseline 10 - (systemTension/2) plus a small
  // bonus from a recent resolution event. Never negative.
  let resolutionCapacity = 10 - systemTension / 2;
  if (contradiction.lastResolutionAt) {
    const ageMs = Date.now() - contradiction.lastResolutionAt;
    if (ageMs < 60_000) resolutionCapacity += 1;  // resolution in last minute boosts capacity.
  }
  resolutionCapacity = round1(clamp10(resolutionCapacity));

  // Status banding.
  const status: ContradictionFieldStatus =
    systemTension >= 6 ? 'critical' :
    systemTension >= 3 ? 'tense'    :
                          'stable';

  // dominant tensions — top 3 by score × weight.
  const dominantTensions = [...pairs]
    .filter((p) => p.tensionScore > 0)
    .sort((a, b) => (b.tensionScore * b.tensionWeight) - (a.tensionScore * a.tensionWeight))
    .slice(0, 3)
    .map((p) => ({
      pairId: p.pairId,
      goalATitle: p.goalATitle,
      opposingPressureLabel: p.opposingPressureLabel,
      tensionScore: p.tensionScore,
      tensionWeight: p.tensionWeight,
    }));

  // unstable goals — those in fragmented/abandoned state right now.
  const unstableGoals = (purpose?.goals ?? [])
    .filter((g) => g.activationState === 'fragmented' || g.activationState === 'abandoned')
    .map((g) => g.title);

  const recentResolutions = contradiction.resolvedTensions.slice(-5).reverse();
  const recentSacrifices = contradiction.sacrifices.slice(-5).reverse();

  const statement = status === 'critical'
    ? `contradiction CRITICAL — system tension ${systemTension}/10, identity stress ${identityStress}/10`
    : status === 'tense'
      ? `contradiction tense — system tension ${systemTension}/10, ${collisionCount} pair${collisionCount === 1 ? '' : 's'} colliding`
      : `contradiction stable — system tension ${systemTension}/10`;

  return {
    present: true, status,
    conflictIntensity, systemTension,
    goalCollisionRate, strategicInstability,
    identityStress, resolutionCapacity,
    dominantTensions, unstableGoals,
    recentResolutions, recentSacrifices,
    statement,
  };
}

/**
 * Strongest current tension as a single string for inlining into
 * defer thoughts when systemTension is elevated. Returns null when
 * there is no meaningful tension to surface.
 */
export function strongestActiveTensionLabel(snap: RuntimeSnapshot): string | null {
  const contradiction = snap.contradictionMemory;
  if (!contradiction) return null;
  const dominant = contradiction.pairs
    .filter((p) => p.tensionScore >= 5)
    .sort((a, b) => (b.tensionScore * b.tensionWeight) - (a.tensionScore * a.tensionWeight))[0];
  if (!dominant) return null;
  return `${dominant.goalATitle} ↔ ${dominant.opposingPressureLabel} (tension ${dominant.tensionScore.toFixed(1)}/10)`;
}
