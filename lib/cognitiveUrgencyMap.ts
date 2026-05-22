/**
 * COGNITIVE URGENCY MAP (Phase 36 — Strategic Priority Engine / Wave 4)
 *
 * Distinguishes REAL urgency (the system has something true to say
 * now) from FALSE urgency (silence feels uncomfortable, the calendar
 * expects an output, the feed is hungry).
 *
 * False urgency is the executive failure mode this map exists to
 * catch.
 */

export type UrgencyKind = 'real-urgency' | 'false-urgency' | 'no-urgency';

export interface CognitiveUrgencyReading {
  urgency_kind: UrgencyKind;
  /** 0..10 — how genuine the urgency is. */
  urgency_authenticity: number;
  /** True when the only reason to speak is discomfort with silence. */
  speaking_from_discomfort: boolean;
  notes: string[];
}

export interface CognitiveUrgencyInput {
  /** 0..10 — how true / new the thing the system wants to say is. */
  truthValue: number;
  /** 0..10 — how emotionally novel it is (not a repeat). */
  emotionalNovelty: number;
  /** 0..10 — how strong the "we must post" pressure is. */
  outputPressure: number;
  /** 0..10 — campaign fatigue (high fatigue + low novelty = false urgency). */
  fatigue: number;
}

export function mapCognitiveUrgency(input: CognitiveUrgencyInput): CognitiveUrgencyReading {
  const { truthValue, emotionalNovelty, outputPressure, fatigue } = input;
  const notes: string[] = [];

  // Real urgency: there is a true, novel thing to say.
  const realSignal = (truthValue + emotionalNovelty) / 2;
  // False urgency: high pressure to output but nothing novel + fatigue.
  const falseSignal = outputPressure - emotionalNovelty * 0.6 + fatigue * 0.4;

  const urgency_authenticity = round1(clamp10(realSignal - Math.max(0, falseSignal - 4)));

  let urgency_kind: UrgencyKind;
  if (realSignal >= 6) urgency_kind = 'real-urgency';
  else if (falseSignal >= 5 && realSignal < 5) urgency_kind = 'false-urgency';
  else urgency_kind = 'no-urgency';

  const speaking_from_discomfort = urgency_kind === 'false-urgency';

  notes.push(`cognitive urgency: ${urgency_kind} — authenticity ${urgency_authenticity}/10`);
  if (speaking_from_discomfort) {
    notes.push('cognitive urgency: the system would be speaking because silence feels uncomfortable, not because it has something true to say');
  }

  return { urgency_kind, urgency_authenticity, speaking_from_discomfort, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
