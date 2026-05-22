/**
 * NARRATIVE ARC INTELLIGENCE (Phase 48 — Wave 5)
 *
 * The council's reading of the campaign as a STORY across time —
 * whether the arc is rising, holding, or breaking, and what the
 * next chapter must do to keep the narrative alive.
 */

import type { CouncilBriefing } from './councilTypes';

export type ArcChapter = 'rising' | 'holding' | 'turning' | 'breaking' | 'opening';

export interface NarrativeArcIntelligenceReading {
  chapter: ArcChapter;
  /** 0..10 — how coherent the arc reads. */
  arc_coherence: number;
  /** What the next chapter must do. */
  next_chapter_demand: string;
  notes: string[];
}

export interface NarrativeArcIntelligenceInput {
  briefing: CouncilBriefing;
}

export function readNarrativeArcIntelligence(input: NarrativeArcIntelligenceInput): NarrativeArcIntelligenceReading {
  const { briefing } = input;
  const notes: string[] = [];

  let chapter: ArcChapter;
  let next_chapter_demand: string;

  if (briefing.lifecycleState === 'emerging') {
    chapter = 'opening';
    next_chapter_demand = 'establish the campaign\'s emotional territory clearly';
  } else if (briefing.lifecycleState === 'overexposed' || briefing.lifecycleState === 'emotionally-drained') {
    chapter = 'breaking';
    next_chapter_demand = 'the arc is breaking — the next chapter must change or rest, not extend';
  } else if (briefing.emotionalRepetitionRisk >= 6) {
    chapter = 'turning';
    next_chapter_demand = 'the arc must turn — a continuation here would be a repeat, not a chapter';
  } else if (briefing.campaignHealth >= 7 && briefing.continuityScore >= 6) {
    chapter = 'rising';
    next_chapter_demand = 'the arc is rising — the next chapter should deepen, not widen';
  } else {
    chapter = 'holding';
    next_chapter_demand = 'the arc is holding — let the next true thing arrive before moving it';
  }

  let arc_coherence = round1(Math.max(0, Math.min(10,
    briefing.continuityScore * 0.5 + briefing.campaignHealth * 0.3 + (10 - briefing.emotionalRepetitionRisk) * 0.2)));

  notes.push(`narrative arc intelligence: chapter "${chapter}" (coherence ${arc_coherence}/10) — ${next_chapter_demand}`);
  return { chapter, arc_coherence, next_chapter_demand, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
