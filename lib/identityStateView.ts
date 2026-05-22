/**
 * IDENTITY STATE VIEW (Phase 123 — Wave 9: Manifestation Architecture)
 *
 * The single question the whole architecture exists to answer, made
 * visible: is the organism still itself? This surface reads the
 * civilization's beliefs, scars, and optimization history into one
 * identity reading — held, or eroding.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export interface IdentityStateViewModel {
  present: boolean;
  /** 0..10 — how strongly the identity is holding. */
  identity_strength: number;
  identity_held: boolean;
  core_belief: string | null;
  belief_count: number;
  /** 0..1 — the share of decisions optimization has won. */
  optimization_share: number;
  signals: string[];
  statement: string;
}

export function buildIdentityStateView(snap: RuntimeSnapshot): IdentityStateViewModel {
  const civ = snap.civilization;
  if (!civ) {
    return {
      present: false, identity_strength: 0, identity_held: false, core_belief: null,
      belief_count: 0, optimization_share: 0, signals: [],
      statement: 'no identity yet — the civilization has not been founded',
    };
  }

  const signals: string[] = [];
  const total = civ.optimizationWins + civ.identityWins;
  const optimization_share = total > 0 ? civ.optimizationWins / total : 0;

  // Identity strength — strong beliefs and identity wins hold it;
  // unhealed scars and optimization wins erode it.
  const core = [...civ.beliefs].sort((a, b) => b.strength - a.strength)[0] ?? null;
  let identity_strength = 5;
  identity_strength += (core ? core.strength : 0) * 0.25;
  identity_strength += civ.myths.length * 0.4;
  identity_strength -= optimization_share * 5;
  identity_strength -= civ.scars.filter((s) => !s.healed).length * 0.6;
  identity_strength = Math.max(0, Math.min(10, Math.round(identity_strength * 10) / 10));

  if (core) signals.push(`core belief: "${core.statement}" (strength ${core.strength}/10)`);
  if (optimization_share > 0.5) signals.push(`optimization has won ${Math.round(optimization_share * 100)}% of decisions`);
  if (civ.myths.length > 0) signals.push(`${civ.myths.length} founding myth(s) anchor the identity`);
  const activeScars = civ.scars.filter((s) => !s.healed).length;
  if (activeScars > 0) signals.push(`${activeScars} unhealed scar(s) pull against the identity`);

  const identity_held = identity_strength >= 5 && optimization_share <= 0.6;

  return {
    present: true,
    identity_strength,
    identity_held,
    core_belief: core ? core.statement : null,
    belief_count: civ.beliefs.length,
    optimization_share: Math.round(optimization_share * 100) / 100,
    signals,
    statement: identity_held
      ? `the identity is holding — strength ${identity_strength}/10 across ${civ.generation} generations`
      : `the identity is eroding — strength ${identity_strength}/10, optimization share ${Math.round(optimization_share * 100)}%`,
  };
}
