/**
 * CAMPAIGN EVOLUTION ENGINE
 *
 * Reads the memory snapshot and outputs a directive for what the
 * NEXT banner should do differently.
 *
 * Example outputs:
 *   - "We already created 4 loud interruption posters. Now create a
 *      quiet emotional frame."
 *   - "We already used documentary-crop twice. Evolve toward
 *      off-center-portrait or negative-space."
 *   - "Three of the last four banners had typography louder than the
 *      truth. Earn the silence."
 *
 * The directive is consumed by the Creative Director — the cognition
 * branch reads it as a system-prompt suffix; the heuristic fallback
 * applies it as a layout-family / restraint nudge.
 *
 * The point is the system behaves like a brand director WITH MEMORY,
 * not a generator that resets at each click.
 */

import type { CreativeDirection, MemorySnapshot } from '@/core/types';

export type EvolutionMove =
  | 'pivot-to-silence'         // we have been loud → go quiet
  | 'pivot-to-interruption'    // we have been quiet too long → break it
  | 'rotate-layout'            // a single layout has dominated → use a different one
  | 'rotate-family'            // emotional family has repeated → step sideways
  | 'reduce-typography'        // typo overload across recent banners
  | 'restore-typography'       // every recent banner was absent — bring presence back
  | 'cool-the-pressure'        // overstimulation flag is up
  | 'campaign-warm-up'         // very early in the campaign, no constraints yet
  | 'hold-the-line';           // recent banners are healthy — keep the rhythm

export interface EvolutionDirective {
  move: EvolutionMove;
  narrative: string;
  // Concrete nudges the Creative Director can apply directly.
  preferLayouts: CreativeDirection['layoutFamily'][];
  avoidLayouts: CreativeDirection['layoutFamily'][];
  preferPacings: CreativeDirection['emotionalPacing'][];
  avoidPacings: CreativeDirection['emotionalPacing'][];
  restraintNudge: number;   // -0.2..+0.2 to apply on the next banner
  typographyNudge: 'lower' | 'raise' | null;
}

export function evolveCampaign(memory: MemorySnapshot): EvolutionDirective {
  if (memory.totalBanners < 2) {
    return {
      move: 'campaign-warm-up',
      narrative: 'Campaign just started — no fatigue, no rhythm to break yet.',
      preferLayouts: [],
      avoidLayouts: [],
      preferPacings: [],
      avoidPacings: [],
      restraintNudge: 0,
      typographyNudge: null,
    };
  }

  // ─── overstimulation override ──────────────────────────────────
  if (memory.overstimulationFlag) {
    return {
      move: 'cool-the-pressure',
      narrative: 'Last few banners ran hot — three or more wired/tense pacings in a row. Pull the next one back into silence.',
      preferLayouts: ['negative-space', 'editorial-page'],
      avoidLayouts: ['documentary-crop'],
      preferPacings: ['quiet', 'collapsed'],
      avoidPacings: ['wired', 'tense', 'interrupted'],
      restraintNudge: +0.15,
      typographyNudge: 'lower',
    };
  }

  // ─── pivot-to-silence ──────────────────────────────────────────
  if (memory.aggressiveCount > memory.silenceCount * 2 && memory.aggressiveCount >= 2) {
    return {
      move: 'pivot-to-silence',
      narrative: `Aggressive banners (${memory.aggressiveCount}) outnumber restrained ones (${memory.silenceCount}). Time to earn the quiet.`,
      preferLayouts: ['negative-space', 'editorial-page'],
      avoidLayouts: ['off-center-portrait'],
      preferPacings: ['quiet', 'collapsed'],
      avoidPacings: ['wired', 'tense'],
      restraintNudge: +0.12,
      typographyNudge: 'lower',
    };
  }

  // ─── pivot-to-interruption ─────────────────────────────────────
  if (memory.silenceCount > memory.aggressiveCount * 2 && memory.silenceCount >= 3) {
    return {
      move: 'pivot-to-interruption',
      narrative: `Silence has carried the campaign (${memory.silenceCount} restrained vs ${memory.aggressiveCount} aggressive). Break it.`,
      preferLayouts: ['off-center-portrait', 'timestamp-anchor'],
      avoidLayouts: ['negative-space'],
      preferPacings: ['interrupted', 'tense'],
      avoidPacings: ['quiet'],
      restraintNudge: -0.10,
      typographyNudge: 'raise',
    };
  }

  // ─── rotate-layout ─────────────────────────────────────────────
  const layoutCounts = countTop(memory.layoutFatigue, 3);
  const [dominantLayout, dominantLayoutCount] = layoutCounts[0] ?? ['', 0];
  if (dominantLayout && dominantLayoutCount >= 3 && memory.totalBanners >= 4) {
    return {
      move: 'rotate-layout',
      narrative: `Layout "${dominantLayout}" has been used ${dominantLayoutCount}× — rotate.`,
      preferLayouts: alternativesTo(dominantLayout as CreativeDirection['layoutFamily']),
      avoidLayouts: [dominantLayout as CreativeDirection['layoutFamily']],
      preferPacings: [],
      avoidPacings: [],
      restraintNudge: 0,
      typographyNudge: null,
    };
  }

  // ─── rotate-family ─────────────────────────────────────────────
  const familyCounts = countTop(memory.recurringEmotionalPatterns, 3);
  const [dominantFamily, dominantFamilyCount] = familyCounts[0] ?? ['', 0];
  if (dominantFamily && dominantFamilyCount >= 3 && memory.totalBanners >= 4) {
    return {
      move: 'rotate-family',
      narrative: `Emotional family "${dominantFamily}" has dominated (${dominantFamilyCount}×) — step sideways.`,
      preferLayouts: [],
      avoidLayouts: [],
      preferPacings: [],
      avoidPacings: [],
      restraintNudge: 0,
      typographyNudge: null,
    };
  }

  // ─── reduce / restore typography ───────────────────────────────
  const typoCounts = countTop(memory.typographyFatigue, 3);
  const loudCount = (memory.typographyFatigue['loud'] ?? 0) + (memory.typographyFatigue['timestamp'] ?? 0);
  const absentCount = memory.typographyFatigue['absent'] ?? 0;
  if (loudCount >= 3) {
    return {
      move: 'reduce-typography',
      narrative: `Typography has been loud or timestamp-anchored ${loudCount} times — give the photograph the next banner.`,
      preferLayouts: ['negative-space'],
      avoidLayouts: ['timestamp-anchor'],
      preferPacings: ['quiet'],
      avoidPacings: ['wired'],
      restraintNudge: +0.10,
      typographyNudge: 'lower',
    };
  }
  if (absentCount >= 3 && typoCounts[0]?.[0] === 'absent') {
    return {
      move: 'restore-typography',
      narrative: 'Three banners in a row have been typographically absent — bring an editorial voice back.',
      preferLayouts: ['editorial-page'],
      avoidLayouts: [],
      preferPacings: [],
      avoidPacings: [],
      restraintNudge: -0.05,
      typographyNudge: 'raise',
    };
  }

  // ─── hold the line ─────────────────────────────────────────────
  return {
    move: 'hold-the-line',
    narrative: 'Recent rhythm looks healthy — no rotation needed.',
    preferLayouts: [],
    avoidLayouts: [],
    preferPacings: [],
    avoidPacings: [],
    restraintNudge: 0,
    typographyNudge: null,
  };
}

// ────────────────────────────────────────────────────────────────

function countTop(map: Record<string, number>, n: number): Array<[string, number]> {
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function alternativesTo(layout: CreativeDirection['layoutFamily']): CreativeDirection['layoutFamily'][] {
  const all: CreativeDirection['layoutFamily'][] = [
    'documentary-crop',
    'editorial-page',
    'off-center-portrait',
    'environmental-wide',
    'timestamp-anchor',
    'negative-space',
  ];
  return all.filter((l) => l !== layout);
}
