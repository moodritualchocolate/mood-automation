/**
 * AUTONOMOUS NARRATIVE ENGINE (Phase 25)
 *
 * The campaign's self-directing narrative mind. It reads the
 * accumulated campaign trail and emits the NEXT NARRATIVE MOVE the
 * campaign should make — not chosen by a human, derived from what
 * the campaign has been quietly proving.
 *
 * Different from Phase 10 cinematicBrain (which synthesises a single
 * banner's directorial verdict) — the autonomous narrative engine
 * operates at the CAMPAIGN level and across TIME, and it is allowed
 * to retire its own earlier conclusions.
 */

import type { EmotionalTraceEntry } from './humanMemory';

export type NarrativeMove =
  | 'open-a-new-thread'
  | 'deepen-the-current-thread'
  | 'contradict-the-last-banner'
  | 'return-to-an-abandoned-thread'
  | 'let-the-campaign-go-quiet'
  | 'name-what-has-been-implied';

export interface AutonomousNarrativeReading {
  next_move: NarrativeMove;
  /** The campaign's current emotional thesis, derived from the trail. */
  derived_thesis: string;
  /** 0..10 — how confident the engine is in the move. */
  move_confidence: number;
  notes: string[];
}

export interface AutonomousNarrativeInput {
  recentTrail: EmotionalTraceEntry[];
}

export function readAutonomousNarrativeEngine(input: AutonomousNarrativeInput): AutonomousNarrativeReading {
  const { recentTrail } = input;
  const notes: string[] = [];

  if (recentTrail.length === 0) {
    return {
      next_move: 'open-a-new-thread',
      derived_thesis: 'the campaign has not spoken yet — the first banner opens the thesis',
      move_confidence: 5,
      notes: ['autonomous narrative: campaign is empty — opening a new thread'],
    };
  }

  // Count family recurrence + check for repetition in the last 3.
  const counts: Record<string, number> = {};
  for (const t of recentTrail.slice(0, 12)) counts[t.family] = (counts[t.family] ?? 0) + 1;
  let dominant: string | null = null;
  let max = 0;
  for (const [f, c] of Object.entries(counts)) {
    if (c > max) { dominant = f; max = c; }
  }

  const lastThree = recentTrail.slice(0, 3);
  const allSameFamily = lastThree.length === 3 && lastThree.every((t) => t.family === lastThree[0].family);

  let next_move: NarrativeMove;
  let move_confidence: number;
  if (allSameFamily) {
    next_move = 'contradict-the-last-banner';
    move_confidence = 8;
    notes.push('autonomous narrative: last three banners share a family — the campaign must contradict to stay alive');
  } else if (max >= 5) {
    next_move = 'name-what-has-been-implied';
    move_confidence = 7;
    notes.push(`autonomous narrative: "${dominant}" has been implied many times — time to name it`);
  } else if (recentTrail.length >= 8 && max <= 2) {
    next_move = 'deepen-the-current-thread';
    move_confidence = 6;
    notes.push('autonomous narrative: the campaign is broad but shallow — deepen one thread');
  } else {
    next_move = 'deepen-the-current-thread';
    move_confidence = 6;
  }

  const derived_thesis = dominant
    ? `the campaign has been quietly proving: modern life keeps the body in "${dominant}" without ever naming it`
    : 'the campaign thesis is still forming';

  notes.push(`derived thesis: ${derived_thesis}`);
  return { next_move, derived_thesis, move_confidence, notes };
}
