/**
 * DIRECTIVE STREAM VIEW (Phase 115 — Wave 9: Manifestation Architecture)
 *
 * The executive's voice, surfaced as a live stream. Every tick the
 * directive engine issued one command; this module renders the
 * current directive, the recent stream, and which directive the
 * runtime has been leaning on — the runtime's will, made visible.
 */

import type { RuntimeSnapshot, Tone } from './runtimeUIBrain';

export interface DirectiveStreamEntry {
  tick: number;
  directive: string;
  tone: Tone;
}

export interface DirectiveStreamViewModel {
  present: boolean;
  current: string;
  current_tone: Tone;
  stream: DirectiveStreamEntry[];
  dominant_directive: string;
  /** How many recent ticks the dominant directive held. */
  dominant_share: number;
  statement: string;
}

const DIRECTIVE_TONE: Record<string, Tone> = {
  publish: 'good', escalate: 'warn', archive: 'neutral', pause: 'cool',
  silence: 'cool', hibernate: 'bad', rebuild: 'warn', 'protect-identity': 'warn',
  // Wave 20 — first cognitive action.
  observe: 'cool',
  // Wave 21 — cognitive vocabulary.
  notice: 'cool', consider: 'cool', restrain: 'cool',
  // Wave 22 — permission gate.
  permit: 'good', 'permit-refused': 'warn',
  // Wave 23 — first internal intention.
  prepare: 'good', 'prepare-refused': 'warn',
  // Wave 24 — first internal draft.
  draft: 'good', 'draft-refused': 'warn',
  // Wave 26 — internal review layer.
  review: 'neutral', 'review-refused': 'warn',
  revise: 'neutral', 'revise-refused': 'warn',
  approve: 'good', 'approve-refused': 'warn',
};

export function buildDirectiveStreamView(snap: RuntimeSnapshot): DirectiveStreamViewModel {
  const os = snap.os;
  if (!os || os.directiveLog.length === 0) {
    return {
      present: false, current: 'none', current_tone: 'neutral', stream: [],
      dominant_directive: 'none', dominant_share: 0,
      statement: 'the directive stream is silent — no tick has issued a directive',
    };
  }

  const recent = os.directiveLog.slice(-16);
  const stream: DirectiveStreamEntry[] = recent
    .map((d) => ({ tick: d.tick, directive: d.directive, tone: DIRECTIVE_TONE[d.directive] ?? 'neutral' }))
    .reverse();

  const current = stream[0].directive;
  const current_tone = stream[0].tone;

  const counts: Record<string, number> = {};
  for (const d of recent) counts[d.directive] = (counts[d.directive] ?? 0) + 1;
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant_directive = ranked[0][0];
  const dominant_share = Math.round((ranked[0][1] / recent.length) * 100);

  const statement = `the runtime's directive this tick is "${current}" — ` +
    `it has leaned on "${dominant_directive}" ${dominant_share}% of recent ticks`;

  return {
    present: true, current, current_tone, stream,
    dominant_directive, dominant_share, statement,
  };
}
