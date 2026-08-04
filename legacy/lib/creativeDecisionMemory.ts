/**
 * CREATIVE DECISION MEMORY (Phase 35 — Autonomous Creative Direction / Wave 2)
 *
 * Records the creative DECISIONS the system makes — not the assets,
 * the decisions. Each decision carries its territory, its move, its
 * reason, and what it rejected, so future runs can see the chain of
 * reasoning the campaign has been following.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export interface CreativeDecisionRecord {
  ts: number;
  chosenTerritory: string;
  emotionalMove: string;
  reason: string;
  rejectedTerritories: string[];
}

export interface CreativeDecisionMemoryReading {
  /** The decision this run is making. */
  decision: CreativeDecisionRecord;
  /** The chain of recent territories the campaign has decided on. */
  decision_chain: string[];
  /** True when this decision repeats the immediately prior one. */
  repeats_prior_decision: boolean;
  notes: string[];
}

export interface CreativeDecisionMemoryInput {
  chosenTerritory: string;
  emotionalMove: string;
  reason: string;
  rejectedTerritories: string[];
  trail: EmotionalTraceEntry[];
}

export function recordCreativeDecision(input: CreativeDecisionMemoryInput): CreativeDecisionMemoryReading {
  const { chosenTerritory, emotionalMove, reason, rejectedTerritories, trail } = input;
  const notes: string[] = [];

  const decision: CreativeDecisionRecord = {
    ts: Date.now(),
    chosenTerritory,
    emotionalMove,
    reason,
    rejectedTerritories,
  };

  // The decision chain — the recent territories the campaign moved
  // through, newest first.
  const decision_chain = trail.slice(0, 6).map((t) => t.family);
  const repeats_prior_decision = decision_chain[0] === chosenTerritory && emotionalMove === 'continue';

  if (repeats_prior_decision) {
    notes.push('creative decision memory: this decision repeats the prior one — a decision must be a continuation, correction, or evolution, not a repeat');
  } else {
    notes.push(`creative decision memory: decided "${chosenTerritory}" via "${emotionalMove}" — chain: ${decision_chain.join(' → ') || 'opening'}`);
  }

  return { decision, decision_chain, repeats_prior_decision, notes };
}
