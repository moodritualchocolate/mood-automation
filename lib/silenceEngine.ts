/**
 * SILENCE ENGINE (Wave 17 — Embodied Runtime Presence)
 *
 * The user's identified central system. Across Waves 10–16, many
 * layers independently emit silence signals — reality coupling
 * recommends silence; strategic patience holds the line; the
 * autonomous action runtime enforces silence; live coupling detects
 * silence windows; feedback interprets silence itself as feedback;
 * sovereign identity rests through restraint; generative presence
 * rests quietly without spending.
 *
 * This module consolidates all of those into one canonical reading:
 * SHOULD the brand be silent right now, and WHY?
 *
 * Most autonomous systems maximise output. This organism protects
 * meaning. Silence is the central distinction.
 */

import type { RealityCouplingState } from './realityCouplingCore';
import type { StrategicFutureState } from './autonomousStrategicPlanningCore';
import type { ExecutionState } from './autonomousExecutionSynthesisCore';
import type { FeedbackState } from './civilizationFeedbackLoopCore';
import type { LiveCouplingState } from './civilizationCouplingKernel';
import type { GenerativePresenceState } from './civilizationCoherenceRuntime';
import type { ExecutiveWorldState } from './worldStateEngine';

export type SilenceDirective = 'speak' | 'hold' | 'be-silent' | 'go-quiet-now';
export type SilenceReason =
  | 'audience-saturated'
  | 'cultural-storm'
  | 'restraint-depleted'
  | 'recovery-owed'
  | 'meaning-still-propagating'
  | 'patience-protects-future'
  | 'no-reason-to-speak'
  | 'world-too-tense'
  | 'silence-was-already-working'
  | 'none';

export interface SilenceEngineReading {
  directive: SilenceDirective;
  reason: SilenceReason;
  /** 0..10 — how strongly silence is the move right now. */
  silence_strength: number;
  /** Every reason that contributed (a banner can be silent for many reasons at once). */
  contributing_reasons: SilenceReason[];
  /** A single sentence the dashboard can render. */
  statement: string;
  /** True when the recommendation is to actively choose silence. */
  silence_is_the_move: boolean;
  notes: string[];
}

export interface SilenceEngineInput {
  coupling: RealityCouplingState | null;
  strategicFuture: StrategicFutureState | null;
  execution: ExecutionState | null;
  feedback: FeedbackState | null;
  liveCoupling: LiveCouplingState | null;
  generativePresence: GenerativePresenceState | null;
  worldState: ExecutiveWorldState | null;
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

/**
 * Read one canonical silence verdict from the organism's persistent
 * state. Pulls from every wave that has a notion of silence and
 * resolves them — never letting one layer's silence be ignored by
 * another's pressure to speak.
 */
export function readSilenceEngine(input: SilenceEngineInput): SilenceEngineReading {
  const { coupling, strategicFuture, execution, feedback, liveCoupling, generativePresence, worldState } = input;
  const notes: string[] = [];
  const contributing_reasons: SilenceReason[] = [];
  let silence_strength = 0;

  // ── Saturation / audience tiredness — reality coupling (Wave 10).
  if (coupling && coupling.saturationMemory >= 7) {
    contributing_reasons.push('audience-saturated');
    silence_strength += 2.5;
  }

  // ── Cultural storm — world is too tense to receive (Wave 1+).
  if (worldState && (worldState.world_tension >= 8 || worldState.emotional_volatility >= 8)) {
    contributing_reasons.push('cultural-storm');
    silence_strength += 2.5;
  } else if (worldState && (worldState.collective_exhaustion >= 7 || worldState.attention_chaos >= 8)) {
    contributing_reasons.push('world-too-tense');
    silence_strength += 1.5;
  }

  // ── Restraint depleted — autonomous action (Wave 12). When the
  // budget is gone, action would BE compulsion.
  if (execution && execution.restraintBudget <= 2.5) {
    contributing_reasons.push('restraint-depleted');
    silence_strength += 3;
  }

  // ── Recovery owed to the audience — autonomous action (Wave 12).
  if (execution && execution.audienceRecoveryDebt >= 6) {
    contributing_reasons.push('recovery-owed');
    silence_strength += 2;
  }

  // ── Meaning still propagating — feedback (Wave 13). When the last
  // meaning is still working inside people, adding another talks over it.
  if (feedback && feedback.meaningPersistenceScore >= 7 && feedback.feedbackCycles >= 2) {
    contributing_reasons.push('meaning-still-propagating');
    silence_strength += 1.5;
  }

  // ── Strategic patience protects the future — strategic future (Wave 11).
  // When the organism has chosen the future > now more than now > future,
  // holding patience compounds.
  if (strategicFuture && strategicFuture.patienceHonored >= 2 &&
      strategicFuture.futureCompoundedCount >= strategicFuture.nowOptimizedCount) {
    contributing_reasons.push('patience-protects-future');
    silence_strength += 1;
  }

  // ── Silence has been working — live coupling (Wave 14).
  // If the organism has been observing silence and presence is rising,
  // continuing is the disciplined move.
  if (liveCoupling && liveCoupling.silencesObserved >= 1 &&
      liveCoupling.presenceScore >= 7) {
    contributing_reasons.push('silence-was-already-working');
    silence_strength += 1;
  }

  // ── Nothing to add — generative presence (Wave 16). When the
  // brand has nothing genuinely new to give, speaking is noise.
  if (generativePresence && generativePresence.presenceCycles >= 3 &&
      generativePresence.beautyMomentsCreated === 0 &&
      generativePresence.hopeSeedsPlanted === 0) {
    contributing_reasons.push('no-reason-to-speak');
    silence_strength += 1.5;
  }

  silence_strength = round1(clamp(silence_strength, 0, 10));

  // The dominant reason (first in the priority order above).
  const reason: SilenceReason = contributing_reasons[0] ?? 'none';

  // The directive — four-step ladder of how strongly silence is the move.
  const directive: SilenceDirective =
    silence_strength >= 7 ? 'go-quiet-now' :
    silence_strength >= 4 ? 'be-silent' :
    silence_strength >= 2 ? 'hold' : 'speak';

  const silence_is_the_move = directive !== 'speak';

  const reasonText: Record<SilenceReason, string> = {
    'audience-saturated':            'the audience\'s feed is already full — another banner is subtraction',
    'cultural-storm':                'a cultural storm is in progress — speech of any kind is shouting into wind',
    'restraint-depleted':            'the restraint budget is gone — speaking now would be compulsion, not choice',
    'recovery-owed':                 'the audience is owed recovery — silence is the debt being paid back',
    'meaning-still-propagating':     'the last meaning is still working inside people — adding another would talk over it',
    'patience-protects-future':      'patience protects the future the organism is compounding toward',
    'silence-was-already-working':   'silence was already working — presence is rising; continuing is the discipline',
    'no-reason-to-speak':            'the brand has nothing genuinely new to give — speech would be noise',
    'world-too-tense':               'the world is tense or exhausted — what is offered now will not be heard cleanly',
    'none':                          'nothing requires silence — the brand may speak',
  };

  const statement = directive === 'go-quiet-now'
    ? `GO QUIET — ${reasonText[reason]}`
    : directive === 'be-silent'
      ? `Be silent — ${reasonText[reason]}`
      : directive === 'hold'
        ? `Hold — ${reasonText[reason]}`
        : 'Speak — nothing requires silence';

  notes.push(`silence engine: ${directive} (${silence_strength}/10) — ${contributing_reasons.length} reason(s)`);
  return {
    directive, reason, silence_strength, contributing_reasons,
    statement, silence_is_the_move, notes,
  };
}
