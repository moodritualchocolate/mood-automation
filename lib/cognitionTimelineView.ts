/**
 * COGNITION TIMELINE VIEW (Phase 114 — Wave 9: Manifestation Architecture)
 *
 * A live timeline of the runtime's recent cognition — every kernel
 * tick's directive, every remembered civilization session, every
 * shipped or refused run, ordered into one scrollable history. The
 * timeline is the runtime thinking out loud, in sequence.
 */

import type { RuntimeSnapshot, Tone } from './runtimeUIBrain';

export type TimelineKind = 'directive' | 'session' | 'verdict';

export interface TimelineEvent {
  tick: number;
  kind: TimelineKind;
  label: string;
  detail: string;
  tone: Tone;
}

export interface CognitionTimelineViewModel {
  present: boolean;
  events: TimelineEvent[];
  span_ticks: number;
  statement: string;
}

const DIRECTIVE_TONE: Record<string, Tone> = {
  publish: 'good', escalate: 'warn', archive: 'neutral', pause: 'cool',
  silence: 'cool', hibernate: 'bad', rebuild: 'warn', 'protect-identity': 'warn',
  // Wave 20 — observation is the lightest cognition; cool tone.
  observe: 'cool',
  // Wave 21 — cognitive vocabulary. All three share the 'cool' tone
  // with observe, marking them as the discipline-of-attention class.
  notice: 'cool', consider: 'cool', restrain: 'cool',
  // Wave 22 — permission gate. Success is 'good' (the chain opened
  // a forward path); refusal is 'warn' (the gate is closed and the
  // viewer should see it).
  permit: 'good', 'permit-refused': 'warn',
  // Wave 23 — first internal intention.
  prepare: 'good', 'prepare-refused': 'warn',
};

export function buildCognitionTimelineView(snap: RuntimeSnapshot): CognitionTimelineViewModel {
  const { os, civilization, runtime } = snap;
  const events: TimelineEvent[] = [];

  if (os) {
    for (const d of os.directiveLog.slice(-14)) {
      events.push({
        tick: d.tick,
        kind: 'directive',
        label: `directive "${d.directive}"`,
        // Wave 20 — when the directive carries a thought (cognitive
        // actions write one), show the thought as the detail. Older
        // directive entries without a thought fall back to the tick.
        detail: d.thought ?? `kernel tick ${d.tick}`,
        tone: DIRECTIVE_TONE[d.directive] ?? 'neutral',
      });
    }
  }
  if (civilization) {
    for (const m of civilization.institutionalMemory.slice(-8)) {
      events.push({
        tick: m.generation,
        kind: 'session',
        label: `civilization session — ${m.verdict}`,
        detail: `governed by "${m.governingPriority}", consensus ${m.consensusQuality}/10`,
        tone: m.emergedFromTension ? 'good' : 'warn',
      });
    }
  }
  if (runtime) {
    for (const h of runtime.history.slice(-8)) {
      events.push({
        tick: h.generationIndex,
        kind: 'verdict',
        label: `run ${h.generationIndex} — ${h.verdict}`,
        detail: `territory "${h.emotionalTerritory}", coherence ${h.fieldCoherence}/10`,
        tone: h.verdict === 'approve' ? 'good' : 'warn',
      });
    }
  }

  // Newest first.
  events.sort((a, b) => b.tick - a.tick);
  const trimmed = events.slice(0, 24);
  const span_ticks = trimmed.length ? trimmed[0].tick - trimmed[trimmed.length - 1].tick : 0;

  return {
    present: trimmed.length > 0,
    events: trimmed,
    span_ticks,
    statement: trimmed.length
      ? `${trimmed.length} cognition events across ${span_ticks} ticks`
      : 'no cognition history yet — the timeline is empty',
  };
}
