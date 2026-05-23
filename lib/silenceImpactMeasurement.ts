/**
 * SILENCE IMPACT MEASUREMENT (Phase 224 — Wave 13: Reality Feedback Infrastructure)
 *
 * Silence is not the absence of action; it is its own action with its
 * own impact. This module measures what the silence did — whether it
 * gave the audience room to absorb, or whether it left the brand
 * forgotten.
 */

export type SilenceImpactKind = 'gave-room' | 'restored-attention' | 'was-forgotten' | 'neutral';

export interface SilenceImpactReading {
  silence_impact: SilenceImpactKind;
  /** -10..10 — net impact of the silence. */
  impact_score: number;
  /** True when the silence was an action with positive impact. */
  silence_did_work: boolean;
  notes: string[];
}

export interface SilenceImpactInput {
  /** True when no banner shipped this cycle. */
  wasSilent: boolean;
  /** 0..10 — audience fatigue before the silence. */
  fatigueBefore: number;
  /** 0..10 — audience fatigue after a cycle of silence. */
  fatigueAfter: number;
  /** True when prior cycles already had nothing shipping. */
  consecutiveSilenceCycles: number;
}

export function readSilenceImpactMeasurement(input: SilenceImpactInput): SilenceImpactReading {
  const { wasSilent, fatigueBefore, fatigueAfter, consecutiveSilenceCycles } = input;
  const notes: string[] = [];

  if (!wasSilent) {
    return {
      silence_impact: 'neutral', impact_score: 0, silence_did_work: false,
      notes: ['silence impact measurement: nothing to measure — an action shipped this cycle'],
    };
  }

  const fatigueRelief = fatigueBefore - fatigueAfter;
  let impact_score = fatigueRelief * 0.8 - consecutiveSilenceCycles * 0.5;
  impact_score = round1(Math.max(-10, Math.min(10, impact_score)));

  const silence_impact: SilenceImpactKind =
    consecutiveSilenceCycles >= 4 ? 'was-forgotten' :
    fatigueRelief >= 1.5 ? 'restored-attention' :
    fatigueRelief > 0 ? 'gave-room' : 'neutral';

  const silence_did_work =
    (silence_impact === 'gave-room' || silence_impact === 'restored-attention') &&
    consecutiveSilenceCycles < 4;

  notes.push(`silence impact measurement: ${silence_impact} (${impact_score}) — ` +
    (silence_did_work ? 'the silence was a positive action' : 'the silence did not earn its keep this cycle'));
  return { silence_impact, impact_score, silence_did_work, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
