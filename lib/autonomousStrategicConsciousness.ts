/**
 * AUTONOMOUS STRATEGIC CONSCIOUSNESS (Phase 55 — Wave 5)
 *
 * The closing module of Wave 5 — and the point at which the system
 * stops being a creative pipeline and becomes a strategic
 * psychological CIVILIZATION. It synthesises the entire council
 * process — the convening, the debate, the conflict, the governance,
 * the courts, the self-reflection, the consensus — into one
 * conscious verdict the campaign acts on.
 *
 * The global Wave 5 question: "Did this decision emerge from genuine
 * cognitive tension, or from shallow consensus?"
 */

import type { CouncilSession } from './cognitiveCouncil';
import type { InternalDebateReading } from './internalDebateEngine';
import type { ExecutiveConsensusReading } from './executiveConsensusRuntime';
import type { SelfReflectionReading } from './selfReflectionHypocrisy';
import type { AutonomousCampaignPlanReading } from './autonomousCampaignPlanning';
import type { NarrativeArcIntelligenceReading } from './narrativeArcIntelligence';

export interface StrategicConsciousnessReading {
  /** The final Wave 5 verdict the campaign acts on. */
  verdict: 'proceed' | 'proceed-restrained' | 'hold' | 'block';
  /** True when the decision emerged from genuine cognitive tension. */
  emerged_from_genuine_tension: boolean;
  /** True when the decision rests on a suspicious shallow consensus. */
  shallow_consensus_suspected: boolean;
  /** 0..10 — how conscious (deliberated, self-aware) the decision is. */
  consciousness_score: number;
  /** The decision explained in the system's own voice. */
  conscious_statement: string;
  /** The internal dissent that was overruled — never discarded. */
  recorded_dissent: string[];
  notes: string[];
}

export interface StrategicConsciousnessInput {
  session: CouncilSession;
  debate: InternalDebateReading;
  consensus: ExecutiveConsensusReading;
  selfReflection: SelfReflectionReading;
  plan: AutonomousCampaignPlanReading;
  arc: NarrativeArcIntelligenceReading;
}

export function readAutonomousStrategicConsciousness(input: StrategicConsciousnessInput): StrategicConsciousnessReading {
  const { session, debate, consensus, selfReflection, plan, arc } = input;
  const notes: string[] = [];

  const verdict = consensus.consensus;

  // A decision emerged from genuine tension when the debate was
  // authentic, the consensus was earned, and no hypocrisy slipped
  // through unexamined.
  const emerged_from_genuine_tension =
    debate.tension_authenticity >= 5 &&
    consensus.consensus_is_earned &&
    !debate.shallow_consensus;

  const shallow_consensus_suspected = debate.shallow_consensus || !consensus.consensus_is_earned;

  // Consciousness — the decision is conscious when it was debated,
  // self-examined, and connected to a plan and an arc.
  let consciousness_score = 0;
  consciousness_score += debate.tension_authenticity * 0.4;
  consciousness_score += consensus.consensus_quality * 0.35;
  consciousness_score += (selfReflection.hypocrisy_detected ? 1 : 2.5);  // catching hypocrisy is conscious; having none is best
  if (debate.exchanges.length >= 2) consciousness_score += 1;
  consciousness_score = Math.max(0, Math.min(10, round1(consciousness_score)));

  // Recorded dissent — the objecting voices, kept on the record even
  // when overruled. A civilization does not discard its minority.
  const recorded_dissent = session.opinions
    .filter((o) => o.stance === 'object')
    .map((o) => `${o.entity}: ${o.argument}`);

  const conscious_statement =
    `The council debated and reached "${verdict}" — ${consensus.why_it_won}. ` +
    `${emerged_from_genuine_tension ? 'The decision emerged from genuine cognitive tension' : 'The decision rests on a thin consensus and should be held lightly'}. ` +
    `${selfReflection.hypocrisy_detected ? selfReflection.self_reflection + ' ' : ''}` +
    `The arc is "${arc.chapter}"; the plan is "${plan.planned_move}". ` +
    `${recorded_dissent.length} dissenting voice(s) recorded.`;

  notes.push(`autonomous strategic consciousness: verdict "${verdict}", consciousness ${consciousness_score}/10`);
  notes.push(emerged_from_genuine_tension
    ? 'autonomous strategic consciousness: the decision emerged from genuine cognitive tension'
    : 'WARNING: the decision may rest on a shallow consensus');

  return {
    verdict,
    emerged_from_genuine_tension,
    shallow_consensus_suspected,
    consciousness_score,
    conscious_statement,
    recorded_dissent,
    notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
