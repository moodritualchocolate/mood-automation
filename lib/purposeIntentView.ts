/**
 * PURPOSE / INTENT VIEW (Wave 31)
 *
 * Derives the dashboard view model from purpose-memory state. Pure
 * derivation — never invents goals, never fabricates trends.
 *
 * Surfaces:
 *   activeStrategicDirection — highest-priority active goal's title
 *   strongestAlignment       — goal with highest alignmentScore
 *   strongestDrift           — goal with highest driftScore
 *   dormantGoals             — list of dormant goal titles
 *   fragmentedGoals          — list of fragmented goal titles
 *   coherencePressure        — mean coherenceWeight across active goals
 *   strategicStability       — 10 − mean driftScore across all goals
 *   purposeFatigue           — mean fatigueScore across active+emerging goals
 *   recentTransitions        — last 5 activation transitions
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type { Goal, ActivationTransitionRecord } from './purposeMemory';

export interface PurposeIntentViewModel {
  present: boolean;
  activeStrategicDirection: string | null;
  strongestAlignment: { title: string; score: number } | null;
  strongestDrift: { title: string; score: number } | null;
  dormantGoals: string[];
  fragmentedGoals: string[];
  abandonedGoals: string[];
  coherencePressure: number;
  strategicStability: number;
  purposeFatigue: number;
  goalSummaries: Array<{
    id: string;
    title: string;
    activationState: string;
    priority: number;
    alignmentScore: number;
    driftScore: number;
    fatigueScore: number;
    coherenceWeight: number;
    pressureScore: number;
    abandonmentRisk: number;
  }>;
  recentTransitions: ActivationTransitionRecord[];
  statement: string;
}

function round1(n: number): number { return Math.round(n * 10) / 10; }

export function buildPurposeIntentView(snap: RuntimeSnapshot): PurposeIntentViewModel {
  const purpose = snap.purposeMemory ?? null;
  if (!purpose || purpose.goals.length === 0) {
    return {
      present: false,
      activeStrategicDirection: null,
      strongestAlignment: null,
      strongestDrift: null,
      dormantGoals: [], fragmentedGoals: [], abandonedGoals: [],
      coherencePressure: 0, strategicStability: 10, purposeFatigue: 0,
      goalSummaries: [],
      recentTransitions: [],
      statement: 'no purpose memory yet — goals will accumulate as cognition runs',
    };
  }

  const goals = purpose.goals;
  const active = goals.filter((g) => g.activationState === 'active');
  const emerging = goals.filter((g) => g.activationState === 'emerging');
  const fragmented = goals.filter((g) => g.activationState === 'fragmented');
  const dormant = goals.filter((g) => g.activationState === 'dormant');
  const abandoned = goals.filter((g) => g.activationState === 'abandoned');

  // active strategic direction = highest priority active goal
  const activeStrategicDirection = active.length > 0
    ? active.reduce((a, b) => (a.priority >= b.priority ? a : b)).title
    : null;

  const pickByMax = (gs: Goal[], key: keyof Goal): Goal | null => {
    if (gs.length === 0) return null;
    return gs.reduce((a, b) => ((a[key] as number) >= (b[key] as number) ? a : b));
  };

  const ali = pickByMax(goals, 'alignmentScore');
  const dri = pickByMax(goals, 'driftScore');

  const meanOf = (gs: Goal[], k: keyof Goal): number =>
    gs.length === 0 ? 0
      : round1(gs.reduce((a, b) => a + (b[k] as number), 0) / gs.length);

  const activeAndEmerging = [...active, ...emerging];
  const coherencePressure = meanOf(activeAndEmerging, 'coherenceWeight');
  const strategicStability = round1(Math.max(0, 10 - meanOf(goals, 'driftScore')));
  const purposeFatigue = meanOf(activeAndEmerging, 'fatigueScore');

  const goalSummaries = goals.map((g) => ({
    id: g.id, title: g.title, activationState: g.activationState,
    priority: g.priority, alignmentScore: g.alignmentScore,
    driftScore: g.driftScore, fatigueScore: g.fatigueScore,
    coherenceWeight: g.coherenceWeight, pressureScore: g.pressureScore,
    abandonmentRisk: g.abandonmentRisk,
  }));

  const recentTransitions = purpose.activationTransitions.slice(-5).reverse();

  const statement = activeStrategicDirection
    ? `strategic direction: '${activeStrategicDirection}' — ${active.length} active, ${fragmented.length} fragmented, ${dormant.length} dormant`
    : `no active goals yet — ${emerging.length} emerging, awaiting consistent supporting cognition`;

  return {
    present: true,
    activeStrategicDirection,
    strongestAlignment: ali ? { title: ali.title, score: ali.alignmentScore } : null,
    strongestDrift: dri ? { title: dri.title, score: dri.driftScore } : null,
    dormantGoals: dormant.map((g) => g.title),
    fragmentedGoals: fragmented.map((g) => g.title),
    abandonedGoals: abandoned.map((g) => g.title),
    coherencePressure,
    strategicStability,
    purposeFatigue,
    goalSummaries,
    recentTransitions,
    statement,
  };
}

/**
 * Find the strongest active goal whose title can be inlined into a
 * defer thought (Wave 31 feedback loop). Returns null when no active
 * goal exists. Returns the highest-priority active goal so defer
 * thoughts reference the most strategically important goal currently
 * being defended.
 */
export function strongestActiveGoalForDefer(snap: RuntimeSnapshot): string | null {
  const purpose = snap.purposeMemory;
  if (!purpose) return null;
  const active = purpose.goals.filter((g) => g.activationState === 'active');
  if (active.length === 0) return null;
  return active.reduce((a, b) => (a.priority >= b.priority ? a : b)).title;
}
