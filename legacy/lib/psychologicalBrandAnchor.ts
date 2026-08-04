/**
 * PSYCHOLOGICAL BRAND ANCHOR (Phase 39 — Executive Identity Governance / Wave 4)
 *
 * The fixed psychological CENTRE of MOOD — the single thing the brand
 * is, beneath every campaign. The anchor is what the governance layer
 * pulls a drifting banner back toward.
 */

export interface PsychologicalBrandAnchor {
  centre: string;
  the_promise: string;
  the_feeling: string;
  the_refusal: string;
}

export const PSYCHOLOGICAL_BRAND_ANCHOR: PsychologicalBrandAnchor = {
  centre: 'MOOD sees the exhausted modern human exactly as they are, and does not ask them to be more',
  the_promise: 'a small, honest, real pause — not a fix, not an optimisation, not a transformation',
  the_feeling: 'being recognised without being performed at',
  the_refusal: 'MOOD refuses to sell improvement, hype, escape, or aspiration',
};

export interface BrandAnchorReading {
  /** 0..10 — how close the candidate sits to the psychological anchor. */
  anchor_proximity: number;
  /** True when the candidate is anchored to the brand centre. */
  is_anchored: boolean;
  /** The pull-back instruction when the candidate has drifted. */
  anchor_correction: string | null;
  notes: string[];
}

export interface BrandAnchorInput {
  /** 0..10 — how much the banner recognises the human as they are. */
  recognition: number;
  /** 0..10 — how much the banner asks the human to become more. */
  improvementPressure: number;
  /** 0..10 — how non-performative the banner is. */
  nonPerformative: number;
}

export function readPsychologicalBrandAnchor(input: BrandAnchorInput): BrandAnchorReading {
  const { recognition, improvementPressure, nonPerformative } = input;
  const notes: string[] = [];

  let anchor_proximity = 0;
  anchor_proximity += recognition * 0.4;
  anchor_proximity += nonPerformative * 0.35;
  anchor_proximity += (10 - improvementPressure) * 0.25;
  anchor_proximity = Math.max(0, Math.min(10, round1(anchor_proximity)));

  const is_anchored = anchor_proximity >= 6 && improvementPressure < 6;

  let anchor_correction: string | null = null;
  if (improvementPressure >= 6) {
    anchor_correction = 'the banner is asking the human to become more — pull back to the anchor: recognise them as they are';
  } else if (!is_anchored) {
    anchor_correction = 'the banner has drifted from the brand centre — return to "recognised without being performed at"';
  }

  notes.push(`psychological brand anchor: proximity ${anchor_proximity}/10 — ${is_anchored ? 'anchored' : 'drifted'}`);
  if (anchor_correction) notes.push(`brand anchor: ${anchor_correction}`);

  return { anchor_proximity, is_anchored, anchor_correction, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
