/**
 * COGNITIVE SIGNALS (Wave 25 — Dynamic Signal Architecture)
 *
 * The per-verb deltas that make organism vitals actually move.
 * Every value here is deterministic, justified, and small enough
 * that no single cognitive act dramatizes the dashboard. The drift
 * is honest gradient: do real cognition, vitals move by exactly the
 * amount the formula says. Open the dashboard and walk away — vitals
 * stay still. No time-based decay, no randomness, no synthetic noise.
 *
 * Energy:       restraint conserves; drafting/revising are real work;
 *               approval restores.
 * Stress:       contradiction and revision raise it; restraint and
 *               approval lower it.
 * Complexity:   first draft opens load; first revision adds; approval
 *               closes and sheds.
 * Coordination: EMA per act — disciplined verbs raise, refusals drop.
 */

export interface CognitiveSignalDelta {
  energyDelta: number;
  stressDelta: number;
  complexityDelta: number;
  /** Contribution to coordinationEMA via EMA blend
   *  next = current * 0.8 + contribution * 0.2 */
  coordinationContribution: number;
}

const ZERO: CognitiveSignalDelta = {
  energyDelta: 0, stressDelta: 0, complexityDelta: 0,
  coordinationContribution: 5,  // neutral baseline
};

export const VERB_DELTAS: Readonly<Record<string, CognitiveSignalDelta>> = {
  observe:  { energyDelta: -0.10, stressDelta:  0.00, complexityDelta:  0.00, coordinationContribution: 7 },
  notice:   { energyDelta: -0.10, stressDelta:  0.00, complexityDelta:  0.00, coordinationContribution: 7 },
  consider: { energyDelta: -0.15, stressDelta:  0.00, complexityDelta:  0.00, coordinationContribution: 7 },
  restrain: { energyDelta: +0.20, stressDelta: -0.20, complexityDelta: -0.05, coordinationContribution: 7 },
  permit:   { energyDelta: -0.10, stressDelta:  0.00, complexityDelta:  0.00, coordinationContribution: 6 },
  prepare:  { energyDelta: -0.10, stressDelta:  0.00, complexityDelta:  0.00, coordinationContribution: 6 },
  draft:    { energyDelta: -0.30, stressDelta:  0.00, complexityDelta:  0.00, coordinationContribution: 5 },
  // Phase 7 verbs — deltas defined now so the table is complete;
  // they fire when Wave 26 introduces the verbs.
  review:   { energyDelta: -0.20, stressDelta:  0.00, complexityDelta:  0.00, coordinationContribution: 8 },
  revise:   { energyDelta: -0.30, stressDelta: +0.30, complexityDelta: +0.50, coordinationContribution: 5 },
  approve:  { energyDelta: +0.30, stressDelta: -0.50, complexityDelta: -0.30, coordinationContribution: 9 },
  // Wave 27 — Phase 8A: Action Sandbox. propose is a boundary act —
  // not internal cognition (which restores), not external action
  // (which there isn't one of yet). Modest energy cost; small stress
  // bump from approaching the boundary; complexity adds (one more
  // pending candidate to hold in mind).
  propose:  { energyDelta: -0.25, stressDelta: +0.10, complexityDelta: +0.30, coordinationContribution: 7 },
  // Wave 28 — Rest + Recovery Physiology. The largest restorative
  // deltas in the system. coordinationContribution is set for the
  // record but is overridden in evolveOSFromRest (which applies an
  // additive +0.3 to coordinationEMA instead of EMA-blending).
  rest:     { energyDelta: +1.2, stressDelta: -0.8, complexityDelta: -0.6, coordinationContribution: 7 },
};

/** Any *-refused directive shares this delta. Small energy debit,
 *  small stress bump, low coordination contribution. The refusal
 *  isn't hidden by the DSA — it costs something visible. */
export const REFUSAL_DELTA: CognitiveSignalDelta = {
  energyDelta: -0.05,
  stressDelta: +0.10,
  complexityDelta:  0.00,
  coordinationContribution: 3,
};

export function deltaForDirective(directive: string): CognitiveSignalDelta {
  if (directive.endsWith('-refused')) return REFUSAL_DELTA;
  return VERB_DELTAS[directive] ?? ZERO;
}

/**
 * Context the orchestrator computes between OS evolve and organism
 * evolve, so the organism's delta can account for state-transition
 * facts the verb table alone can't see (first draft ever, first
 * revision in chain, an approval just firing, a review that found
 * contradictions).
 */
export interface CognitiveActContext {
  /** The directive that was actually pushed — may end in -refused. */
  directiveName: string;
  /** Wave 26 — contradictionScore from this act's review, if any. */
  contradictionScore?: number;
  /** Wave 26 — true on the very first 'draft' that ever lands in the
   *  lineage; raises complexityLoad by +1.00 on top of the base delta. */
  isFirstDraftEver?: boolean;
  /** Wave 26 — true on the first 'revise' within the current draft
   *  chain; raises complexityLoad by +0.50 on top of the base delta. */
  isFirstRevisionInChain?: boolean;
  /** Wave 26 — true on a successful 'approve'; advances
   *  evolutionaryAge and sheds complexity by -0.30. */
  approvalFired?: boolean;
  /** Wave 28 — on a successful 'rest', the wall-clock time of the
   *  rest. Used by the organism evolve to set lastRestAt. */
  restAt?: number;
  /** Wave 28 — on a successful 'rest', the os.uptime at rest. Used
   *  to set lastRestTick. */
  restTick?: number;
  /** Wave 28 — on a successful 'rest', the pre-rest vitals snapshot
   *  for the lastRestSnapshot field on organism state. The
   *  orchestrator captures these before evolveOrganismFromCognitiveAct
   *  applies the delta, then passes them in. */
  preRestSnapshot?: {
    energyReserves: number;
    stressAccumulation: number;
    complexityLoad: number;
    fragmentationStreak: number;
  };
  /** Wave 28 — on a successful 'rest', the post-rest fragmentation
   *  from os state (organism doesn't carry fragmentationStreak itself). */
  postRestFragmentation?: number;
}
