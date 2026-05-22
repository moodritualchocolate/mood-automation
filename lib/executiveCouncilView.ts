/**
 * EXECUTIVE COUNCIL VIEW (Phase 121 — Wave 9: Manifestation Architecture)
 *
 * The civilization's council, surfaced. The persistent reputation
 * economy becomes a roster of cognitive entities and their standing;
 * the institutional memory becomes a record of how the council has
 * governed. This is the runtime's parliament, made visible.
 */

import type { RuntimeSnapshot, Tone } from './runtimeUIBrain';

export interface CouncilMember {
  entity: string;
  standing: number;
  tone: Tone;
}

export interface CouncilSessionLine {
  generation: number;
  verdict: string;
  governing_priority: string;
  consensus_quality: number;
  earned: boolean;
}

export interface ExecutiveCouncilViewModel {
  present: boolean;
  members: CouncilMember[];
  recent_sessions: CouncilSessionLine[];
  average_consensus: number;
  governing_priority: string | null;
  statement: string;
}

export function buildExecutiveCouncilView(snap: RuntimeSnapshot): ExecutiveCouncilViewModel {
  const civ = snap.civilization;
  if (!civ) {
    return {
      present: false, members: [], recent_sessions: [], average_consensus: 0,
      governing_priority: null,
      statement: 'no council — the civilization has not been founded',
    };
  }

  const members: CouncilMember[] = Object.entries(civ.reputationEconomy)
    .map(([entity, standing]) => ({
      entity,
      standing: Math.round(standing * 10) / 10,
      tone: (standing >= 6 ? 'good' : standing >= 3 ? 'neutral' : 'warn') as Tone,
    }))
    .sort((a, b) => b.standing - a.standing);

  const recent_sessions: CouncilSessionLine[] = civ.institutionalMemory.slice(-8).reverse().map((m) => ({
    generation: m.generation,
    verdict: m.verdict,
    governing_priority: m.governingPriority,
    consensus_quality: m.consensusQuality,
    earned: m.emergedFromTension,
  }));

  const average_consensus = civ.institutionalMemory.length
    ? Math.round((civ.institutionalMemory.reduce((s, m) => s + m.consensusQuality, 0) / civ.institutionalMemory.length) * 10) / 10
    : 0;

  // The priority that has governed most across the civilization's life.
  const governing_priority = Object.entries(civ.culturalTendency)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    present: members.length > 0 || recent_sessions.length > 0,
    members, recent_sessions, average_consensus, governing_priority,
    statement: governing_priority
      ? `the council has been governed most by "${governing_priority}" — average consensus ${average_consensus}/10`
      : 'the council has not yet held a recorded session',
  };
}
