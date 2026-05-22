/**
 * EXECUTIVE CONSENSUS RUNTIME (Phase 54 — Wave 5)
 *
 * Brings the whole society to a CONSENSUS — not a vote, a synthesis.
 * It weighs the council conflict, the silence governance, the
 * identity court, the audience society, and the self-reflection into
 * one consensus verdict, and — critically — judges the QUALITY of
 * that consensus.
 *
 * A consensus reached through genuine cognitive tension is trusted.
 * A consensus reached too easily is not.
 */

import type { CouncilConflictReading } from './councilConflictResolution';
import type { InternalDebateReading } from './internalDebateEngine';
import type { SilenceRestraintReading } from './silenceRestraintGovernance';
import type { IdentityDefenseCourtReading } from './identityDefenseCourt';
import type { SelfReflectionReading } from './selfReflectionHypocrisy';

export type ConsensusVerdict = 'proceed' | 'proceed-restrained' | 'hold' | 'block';

export interface ExecutiveConsensusReading {
  consensus: ConsensusVerdict;
  /** 0..10 — how much the consensus rests on genuine tension. */
  consensus_quality: number;
  /** True when the consensus is trustworthy (earned through debate). */
  consensus_is_earned: boolean;
  /** The reason the winning position prevailed. */
  why_it_won: string;
  notes: string[];
}

export interface ExecutiveConsensusInput {
  conflict: CouncilConflictReading;
  debate: InternalDebateReading;
  silence: SilenceRestraintReading;
  identityCourt: IdentityDefenseCourtReading;
  selfReflection: SelfReflectionReading;
}

export function runExecutiveConsensus(input: ExecutiveConsensusInput): ExecutiveConsensusReading {
  const { conflict, debate, silence, identityCourt, selfReflection } = input;
  const notes: string[] = [];

  let consensus: ConsensusVerdict;
  let why_it_won: string;

  // Identity court overrules everything — identity is non-negotiable.
  if (identityCourt.identity_must_be_defended) {
    consensus = 'block';
    why_it_won = `the identity defense court convicted the banner — ${identityCourt.charge}`;
  } else if (silence.recommend_silence) {
    consensus = 'hold';
    why_it_won = `silence & restraint governance ruled for silence — ${silence.reason}`;
  } else if (conflict.standing === 'blocked') {
    consensus = 'block';
    why_it_won = `the council's objection force outweighed its advocacy — decisive voice: ${conflict.decisive_voice}`;
  } else if (conflict.standing === 'contested') {
    consensus = 'hold';
    why_it_won = `the council is genuinely split (${debate.central_disagreement ?? 'no central disagreement'}) — hold until the tension resolves`;
  } else if (conflict.standing === 'proceed-with-caution' || silence.recommend_more_restraint) {
    consensus = 'proceed-restrained';
    why_it_won = 'the council will proceed but the restraint governance requires a quieter version';
  } else {
    consensus = 'proceed';
    why_it_won = `the council reached a clear standing — decisive voice: ${conflict.decisive_voice}`;
  }

  // Consensus quality — earned through genuine tension, eroded by
  // shallow agreement and by detected hypocrisy.
  let consensus_quality = 0;
  consensus_quality += debate.tension_authenticity * 0.6;
  consensus_quality += Math.min(3, debate.exchanges.length);
  if (debate.shallow_consensus) consensus_quality -= 4;
  if (selfReflection.hypocrisy_detected) consensus_quality -= selfReflection.hypocrisy_score * 0.3;
  consensus_quality = Math.max(0, Math.min(10, round1(consensus_quality)));

  const consensus_is_earned = consensus_quality >= 5 && !debate.shallow_consensus;

  notes.push(`executive consensus: "${consensus}" — ${why_it_won}`);
  notes.push(`executive consensus: quality ${consensus_quality}/10 — ${consensus_is_earned ? 'earned through genuine tension' : 'NOT earned — shallow or hypocritical'}`);

  return { consensus, consensus_quality, consensus_is_earned, why_it_won, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
