/**
 * CULTURAL INTELLIGENCE LAYER
 *
 * A structured catalog of the cultural moods the system understands as
 * CONTEXT — never as copy. The spec named these:
 *
 *   exhaustion culture, dopamine burnout, productivity fatigue,
 *   anti-hustle energy, overconnected life, quiet luxury,
 *   digital numbness, wellness skepticism, "tired of being optimized"
 *
 * For each moment we encode:
 *  - the state families it naturally lives inside
 *  - the asset tones it favors
 *  - what to NEVER do (the literal-copy traps)
 *  - a one-line cultural reading the Creative Director can reference
 *
 * The engine selects ONE cultural moment per banner — biased by the
 * state family, but not deterministic. The campaign brain rotates
 * cultural moments across runs so no single mood dominates.
 */

import type { HumanState, MemorySnapshot } from '@/core/types';

export const CULTURAL_MOMENT_IDS = [
  'exhaustion-culture',
  'dopamine-burnout',
  'productivity-fatigue',
  'anti-hustle',
  'overconnected-life',
  'quiet-luxury',
  'digital-numbness',
  'wellness-skepticism',
  'tired-of-optimization',
] as const;
export type CulturalMomentId = (typeof CULTURAL_MOMENT_IDS)[number];

export interface CulturalMoment {
  id: CulturalMomentId;
  reading: string;                    // one-line cultural reading
  favoredFamilies: HumanState['family'][];
  favoredTones: Array<'observed' | 'documentary' | 'restrained' | 'editorial' | 'aggressive' | 'quiet'>;
  forbiddenPatterns: string[];        // literal-copy traps to avoid
}

export const CULTURAL_MOMENTS: Record<CulturalMomentId, CulturalMoment> = {
  'exhaustion-culture': {
    id: 'exhaustion-culture',
    reading: 'Tiredness is no longer a state — it is the climate.',
    favoredFamilies: ['fatigue', 'collapse', 'numbness'],
    favoredTones: ['observed', 'documentary', 'quiet'],
    forbiddenPatterns: ['hashtag-grindset visual', 'recovery aesthetic stock photo', 'spa-day language'],
  },
  'dopamine-burnout': {
    id: 'dopamine-burnout',
    reading: 'The reward circuits have learned the trick.',
    favoredFamilies: ['overstimulation', 'numbness', 'fragmentation'],
    favoredTones: ['restrained', 'quiet', 'editorial'],
    forbiddenPatterns: ['neon glow text', 'flashing UI screenshots', 'app-store screenshot energy'],
  },
  'productivity-fatigue': {
    id: 'productivity-fatigue',
    reading: 'The to-do list is now the to-do feeling.',
    favoredFamilies: ['pressure', 'fatigue', 'fragmentation'],
    favoredTones: ['observed', 'editorial'],
    forbiddenPatterns: ['productivity-app screenshot', 'planner aesthetic', 'morning-routine voice-over'],
  },
  'anti-hustle': {
    id: 'anti-hustle',
    reading: 'The body opted out of the meeting in the head.',
    favoredFamilies: ['avoidance', 'paralysis', 'fatigue'],
    favoredTones: ['quiet', 'documentary', 'restrained'],
    forbiddenPatterns: ['"quiet quitting" jargon', 'beach laptop photo', 'four-hour-work-week aesthetic'],
  },
  'overconnected-life': {
    id: 'overconnected-life',
    reading: 'Available to everyone. Unavailable to themselves.',
    favoredFamilies: ['overstimulation', 'fragmentation', 'numbness'],
    favoredTones: ['documentary', 'restrained'],
    forbiddenPatterns: ['phone-stack-up-at-dinner trope', 'detox retreat aesthetic', 'analog-revival nostalgia'],
  },
  'quiet-luxury': {
    id: 'quiet-luxury',
    reading: 'Restraint as the new conspicuous consumption.',
    favoredFamilies: ['numbness', 'paralysis', 'fatigue'],
    favoredTones: ['editorial', 'restrained', 'quiet'],
    forbiddenPatterns: ['logo-free hoodie pastiche', 'gorpcore wardrobe', '"old money" reels aesthetic'],
  },
  'digital-numbness': {
    id: 'digital-numbness',
    reading: 'The screens have stopped being the thing — they are the air.',
    favoredFamilies: ['numbness', 'fragmentation', 'overstimulation'],
    favoredTones: ['documentary', 'quiet'],
    forbiddenPatterns: ['screen-time anxiety infographic', 'doom-scroll visual cliché', 'phone-as-villain framing'],
  },
  'wellness-skepticism': {
    id: 'wellness-skepticism',
    reading: 'The optimization advice is now the source of the exhaustion.',
    favoredFamilies: ['pressure', 'fatigue', 'avoidance'],
    favoredTones: ['restrained', 'observed'],
    forbiddenPatterns: ['supplements-on-marble', '"science-backed" claims', 'before/after biohacker'],
  },
  'tired-of-optimization': {
    id: 'tired-of-optimization',
    reading: 'They are tired of being a project to be managed.',
    favoredFamilies: ['fatigue', 'avoidance', 'numbness', 'paralysis'],
    favoredTones: ['documentary', 'restrained', 'quiet'],
    forbiddenPatterns: ['habit-tracker UI', 'wearable-data visual', 'graph-going-up aesthetic'],
  },
};

export interface SelectMomentInput {
  state: HumanState;
  memory: MemorySnapshot;
  seed?: number;
}

/**
 * Select one cultural moment for this banner.
 *
 * Selection biases:
 *  - favors moments whose favoredFamilies include the chosen state's family
 *  - fatigues recently-used moments (rotation across the campaign)
 *  - seeded for determinism
 */
export function selectCulturalMoment(input: SelectMomentInput): CulturalMoment {
  const { state, memory, seed = Date.now() } = input;
  const recent = (memory.recentCulturalMoments ?? []).slice(0, 6);

  const scored = CULTURAL_MOMENT_IDS.map((id) => {
    const m = CULTURAL_MOMENTS[id];
    let score = 1;
    if (m.favoredFamilies.includes(state.family)) score *= 2.4;
    const recencyIdx = recent.indexOf(id);
    if (recencyIdx >= 0) score *= 0.15 + recencyIdx * 0.15; // last-used heavily penalised
    return { moment: m, score };
  });

  const total = scored.reduce((a, b) => a + b.score, 0);
  let pick = mulberry32(seed)() * total;
  for (const { moment, score } of scored) {
    if ((pick -= score) <= 0) return moment;
  }
  return CULTURAL_MOMENTS[CULTURAL_MOMENT_IDS[0]];
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
