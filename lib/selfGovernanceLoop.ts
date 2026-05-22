/**
 * SELF-GOVERNANCE LOOP (Phase 41 — Executive Decision Runtime / Wave 4)
 *
 * After a decision is made, the system checks ITSELF: does the
 * decision honour the executive principles, or did a temptation slip
 * through? The loop is the organism governing its own behaviour.
 *
 * The six self-governance questions are the Wave 4 meta-critic
 * questions, asked by the system OF ITSELF.
 */

import type { ExecutiveAction } from './actionSelection';

export interface SelfGovernanceReading {
  /** The six executive self-checks, each pass / fail. */
  checks: Array<{ question: string; passed: boolean; note: string }>;
  /** 0..10 — how well-governed the decision is. */
  governance_score: number;
  /** True when the decision survives self-governance. */
  decision_is_governed: boolean;
  notes: string[];
}

export interface SelfGovernanceInput {
  action: ExecutiveAction;
  /** Is the decision strategically wise (not merely emotionally effective)? */
  strategicallyWise: boolean;
  /** Does it preserve long-term trust? */
  preservesLongTermTrust: boolean;
  /** Would repeating this damage the organism? */
  repeatingWouldDamage: boolean;
  /** Is the system speaking from a true thing, not from discomfort? */
  speakingFromTruth: boolean;
  /** Does the campaign belong to the psychological state of the world? */
  belongsToWorld: boolean;
  /** Would this still strengthen MOOD one year from now? */
  strengthensInOneYear: boolean;
}

export function runSelfGovernanceLoop(input: SelfGovernanceInput): SelfGovernanceReading {
  const {
    action, strategicallyWise, preservesLongTermTrust, repeatingWouldDamage,
    speakingFromTruth, belongsToWorld, strengthensInOneYear,
  } = input;
  const notes: string[] = [];

  const checks: SelfGovernanceReading['checks'] = [
    {
      question: 'Is this strategically wise, or merely emotionally effective?',
      passed: strategicallyWise,
      note: strategicallyWise ? 'strategically wise' : 'merely emotionally effective',
    },
    {
      question: 'Does this preserve long-term trust?',
      passed: preservesLongTermTrust,
      note: preservesLongTermTrust ? 'long-term trust preserved' : 'long-term trust at risk',
    },
    {
      question: 'Would repeating this damage the organism?',
      passed: !repeatingWouldDamage,
      note: repeatingWouldDamage ? 'repeating this would damage the organism' : 'safe to recur',
    },
    {
      question: 'Is the system speaking because it has something true to say?',
      passed: speakingFromTruth,
      note: speakingFromTruth ? 'speaking from truth' : 'speaking because silence feels uncomfortable',
    },
    {
      question: 'Does this campaign belong to the psychological state of the world?',
      passed: belongsToWorld,
      note: belongsToWorld ? 'belongs to the world-state' : 'does not belong to the world-state',
    },
    {
      question: 'Would this still strengthen MOOD one year from now?',
      passed: strengthensInOneYear,
      note: strengthensInOneYear ? 'still strengthens MOOD in a year' : 'no lasting value',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const governance_score = Math.round((passedCount / checks.length) * 100) / 10;

  // A non-output action (silence / delay / archive) is self-governed
  // by definition — restraint always passes the loop.
  const isRestraint = action === 'silence' || action === 'delay' || action === 'archive'
    || action === 'fragment' || action === 'merge';
  const decision_is_governed = isRestraint || passedCount >= 4;

  notes.push(`self-governance loop: ${passedCount}/${checks.length} checks passed — decision ${decision_is_governed ? 'is governed' : 'FAILS self-governance'}`);
  for (const c of checks) if (!c.passed) notes.push(`self-governance: failed — "${c.question}" (${c.note})`);

  return { checks, governance_score, decision_is_governed, notes };
}
