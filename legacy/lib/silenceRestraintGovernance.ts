/**
 * SILENCE & RESTRAINT GOVERNANCE (Phase 49 — Wave 5)
 *
 * The council's standing authority on NOT speaking. It weighs the
 * Recovery Director's and Anti-Hype Defender's positions against the
 * rest and rules on whether restraint — or outright silence — is the
 * wiser governance of the moment.
 */

import type { CouncilBriefing, EntityOpinion } from './councilTypes';

export interface SilenceRestraintReading {
  /** 0..10 — how strongly the council favours restraint. */
  restraint_pressure: number;
  /** True when silence is the governed recommendation. */
  recommend_silence: boolean;
  /** True when the banner should ship but with more restraint. */
  recommend_more_restraint: boolean;
  reason: string;
  notes: string[];
}

export interface SilenceRestraintInput {
  briefing: CouncilBriefing;
  opinions: EntityOpinion[];
}

export function readSilenceRestraintGovernance(input: SilenceRestraintInput): SilenceRestraintReading {
  const { briefing, opinions } = input;
  const notes: string[] = [];

  const recovery = opinions.find((o) => o.entity === 'recovery-director');
  const antiHype = opinions.find((o) => o.entity === 'anti-hype-defender');

  let restraint_pressure = 0;
  if (briefing.recommendSilence) restraint_pressure += 4;
  if (recovery && recovery.stance === 'object') restraint_pressure += recovery.conviction * 0.3;
  if (antiHype && antiHype.stance === 'object') restraint_pressure += antiHype.conviction * 0.25;
  if (briefing.cognitiveEnergy < 4) restraint_pressure += 2;
  if (briefing.optimizationCorruptsTruth) restraint_pressure += 2;
  restraint_pressure = round1(Math.min(10, restraint_pressure));

  const recommend_silence = briefing.recommendSilence || restraint_pressure >= 7;
  const recommend_more_restraint = !recommend_silence && restraint_pressure >= 4;

  let reason: string;
  if (recommend_silence) {
    reason = 'the council governs toward silence — speaking now would cost more than it gives';
  } else if (recommend_more_restraint) {
    reason = 'the council governs toward more restraint — ship, but quieter';
  } else {
    reason = 'restraint pressure is low — the council does not require silence here';
  }

  notes.push(`silence & restraint governance: pressure ${restraint_pressure}/10 — ${reason}`);
  return { restraint_pressure, recommend_silence, recommend_more_restraint, reason, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
