/**
 * COGNITIVE DECISION ENGINE (Phase 41 — Executive Decision Runtime / Wave 4)
 *
 * Chooses the executive ACTION. The engine decides like a strategic
 * creative director — weighing identity, energy, timing, strategy,
 * and lifecycle — and selects one action from the catalogue.
 */

import type { ExecutiveAction } from './actionSelection';
import type { StrategicConflictReading } from './strategicConflictResolution';

export interface CognitiveDecisionReading {
  action: ExecutiveAction;
  /** 0..10 — confidence in the decision. */
  decision_confidence: number;
  /** The dominant driver of the decision. */
  primary_driver: string;
  notes: string[];
}

export interface CognitiveDecisionInput {
  conflict: StrategicConflictReading;
  /** Phase 39 — identity governance wants to archive. */
  identityBlocks: boolean;
  /** Phase 42 — the campaign does not understand the world. */
  worldBlind: boolean;
  /** Phase 37 — silence is the wiser move. */
  recommendSilence: boolean;
  /** Phase 38 — the moment is psychologically wrong. */
  timingWrong: boolean;
  /** Phase 36 — strategic priority band. */
  priorityBand: 'deepen' | 'proceed' | 'defer' | 'refuse';
  /** Phase 36 — real urgency + high strategic weight. */
  realUrgency: boolean;
  strategicWeight: number;
  /** Phase 40 — the lifecycle's recommended evolution move. */
  evolutionMove: 'continue-naturally' | 'deepen-the-theme' | 'evolve-the-register' | 'hold';
  shouldRetire: boolean;
}

export function decideExecutiveAction(input: CognitiveDecisionInput): CognitiveDecisionReading {
  const {
    conflict, identityBlocks, worldBlind, recommendSilence, timingWrong,
    priorityBand, realUrgency, strategicWeight, evolutionMove, shouldRetire,
  } = input;
  const notes: string[] = [];

  let action: ExecutiveAction;
  let primary_driver: string;
  let decision_confidence: number;

  // The hierarchy decides — identity first, then world, energy, timing.
  if (identityBlocks || priorityBand === 'refuse') {
    action = 'archive';
    primary_driver = 'identity governance / strategic refusal';
    decision_confidence = 9;
  } else if (worldBlind) {
    action = 'delay';
    primary_driver = 'the campaign does not understand the world it is entering';
    decision_confidence = 8;
  } else if (recommendSilence) {
    action = 'silence';
    primary_driver = 'cognitive energy — silence is wiser than output';
    decision_confidence = 8;
  } else if (timingWrong) {
    action = 'delay';
    primary_driver = 'temporal psychology — the moment is wrong';
    decision_confidence = 7.5;
  } else if (shouldRetire) {
    action = 'reverse';
    primary_driver = 'lifecycle — the current direction is exhausted; reverse it';
    decision_confidence = 7;
  } else if (priorityBand === 'defer') {
    action = 'delay';
    primary_driver = 'strategic priority — low priority, better deferred';
    decision_confidence = 6.5;
  } else if (realUrgency && strategicWeight >= 7) {
    action = 'escalate';
    primary_driver = 'strategic priority — real urgency and high strategic weight';
    decision_confidence = 8;
  } else if (evolutionMove === 'deepen-the-theme' || priorityBand === 'deepen') {
    action = 'deepen';
    primary_driver = 'lifecycle — deepen the current theme';
    decision_confidence = 7.5;
  } else if (evolutionMove === 'evolve-the-register') {
    action = 'reverse';
    primary_driver = 'lifecycle — the register must evolve';
    decision_confidence = 7;
  } else if (evolutionMove === 'continue-naturally') {
    action = 'continue';
    primary_driver = 'lifecycle — continue the arc naturally';
    decision_confidence = 7;
  } else {
    action = 'publish';
    primary_driver = 'no blocker — the banner is sound; publish';
    decision_confidence = 7;
  }

  // The conflict resolver can override toward a block.
  if (conflict.governing_blocks && (action === 'publish' || action === 'continue' || action === 'deepen')) {
    action = 'delay';
    primary_driver = `strategic conflict — ${conflict.governing_reason}`;
    decision_confidence = Math.max(decision_confidence, 7);
    notes.push('cognitive decision: a governing conflict overrode the output toward delay');
  }

  notes.push(`cognitive decision: action "${action}" — driver: ${primary_driver} (confidence ${decision_confidence}/10)`);
  return { action, decision_confidence, primary_driver, notes };
}
