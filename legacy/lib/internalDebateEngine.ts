/**
 * INTERNAL DEBATE ENGINE (Phase 44 — Wave 5: Autonomous Strategic Society)
 *
 * Turns the council's parallel opinions into a real DEBATE — it finds
 * the points of tension, pairs the strongest advocate against the
 * strongest objector, and produces the internal arguments the system
 * had with itself before acting.
 *
 * The disagreements must create better judgment, not chaos.
 */

import type { CouncilSession } from './cognitiveCouncil';
import type { EntityOpinion } from './councilTypes';

export interface DebateExchange {
  topic: string;
  advocate: EntityOpinion;
  objector: EntityOpinion;
  /** 0..10 — how sharp the disagreement is. */
  tension: number;
}

export interface InternalDebateReading {
  exchanges: DebateExchange[];
  /** 0..10 — how much genuine cognitive tension the debate carried. */
  debate_tension: number;
  /** 0..10 — how authentic the tension is (vs shallow agreement). */
  tension_authenticity: number;
  /** True when the council agreed too quickly — a suspicious consensus. */
  shallow_consensus: boolean;
  /** The single most important unresolved disagreement. */
  central_disagreement: string | null;
  notes: string[];
}

export interface InternalDebateInput {
  session: CouncilSession;
}

export function runInternalDebate(input: InternalDebateInput): InternalDebateReading {
  const { session } = input;
  const notes: string[] = [];

  const objectors = session.opinions.filter((o) => o.stance === 'object')
    .sort((a, b) => b.conviction - a.conviction);
  const advocates = session.opinions.filter((o) => o.stance === 'advocate')
    .sort((a, b) => b.conviction - a.conviction);

  // Pair each strong objector against the strongest advocate.
  const exchanges: DebateExchange[] = [];
  for (const objector of objectors.slice(0, 4)) {
    const advocate = advocates[0];
    if (!advocate) break;
    const tension = round1(Math.min(10, (objector.conviction + advocate.conviction) / 2));
    exchanges.push({
      topic: `${objector.priority_defended} vs ${advocate.priority_defended}`,
      advocate,
      objector,
      tension,
    });
  }

  const debate_tension = exchanges.length
    ? round1(exchanges.reduce((s, e) => s + e.tension, 0) / exchanges.length)
    : 0;

  // Authenticity — a debate is authentic when there is real
  // disagreement among CONVICTED entities. A council that all
  // advocates instantly, or all at low conviction, is shallow.
  const convicted = session.opinions.filter((o) => o.conviction >= 6).length;
  const distinctStances = new Set(session.opinions.map((o) => o.stance)).size;
  let tension_authenticity = 0;
  if (session.tally.object >= 1 && session.tally.advocate >= 1) tension_authenticity += 5;
  tension_authenticity += Math.min(3, distinctStances);
  if (convicted >= 5) tension_authenticity += 2;
  tension_authenticity = round1(Math.min(10, tension_authenticity));

  // Shallow consensus — almost everyone agreed, fast, without
  // objection. The meta-critic treats this with suspicion.
  const shallow_consensus =
    session.tally.object === 0 &&
    session.tally.caution <= 1 &&
    session.tally.advocate >= 8;

  const central_disagreement = exchanges[0]
    ? `${exchanges[0].objector.entity} objects ("${exchanges[0].objector.argument}") while ${exchanges[0].advocate.entity} advocates`
    : null;

  notes.push(`internal debate: ${exchanges.length} exchange(s), tension ${debate_tension}/10, authenticity ${tension_authenticity}/10`);
  if (shallow_consensus) notes.push('WARNING: shallow consensus — the council agreed too quickly; suspicion raised');
  if (central_disagreement) notes.push(`central disagreement: ${central_disagreement}`);

  return {
    exchanges, debate_tension, tension_authenticity, shallow_consensus,
    central_disagreement, notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
