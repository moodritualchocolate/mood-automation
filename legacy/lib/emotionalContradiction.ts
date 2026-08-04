/**
 * EMOTIONAL CONTRADICTION (Phase 9)
 *
 * The strongest banners often contain two conflicting truths.
 *
 * Examples the spec named:
 *   energized but lonely
 *   productive but detached
 *   calm but guilty
 *   relieved but emotionally absent
 *
 * The engine reads the emotional core + cultural micro-moment + state
 * family + the truth's tension phrase, and returns:
 *   - the_contradiction      — named pair the banner expresses, if any
 *   - depth                  — 0..10 how present the contradiction is
 *   - is_human_contradiction — true when both truths are recognisably
 *                              human, not a clever literary device
 *   - feels_constructed      — true when the contradiction reads as
 *                              writing trickery instead of observation
 *
 * The meta-critic uses depth as a positive signal and
 * feels_constructed as a soft refuse.
 */

import type { EmotionalCore } from './humanTruthEngine';
import type { HumanTruth } from '@/core/types';

export interface Contradiction {
  positive_face: string;   // the "energized" half
  negative_face: string;   // the "lonely" half
  name: string;
}

const CONTRADICTION_LIBRARY: Contradiction[] = [
  { positive_face: 'energized', negative_face: 'lonely',  name: 'energized but lonely' },
  { positive_face: 'productive', negative_face: 'detached', name: 'productive but detached' },
  { positive_face: 'calm',       negative_face: 'guilty',   name: 'calm but guilty' },
  { positive_face: 'relieved',   negative_face: 'absent',   name: 'relieved but emotionally absent' },
  { positive_face: 'connected',  negative_face: 'unreached', name: 'connected but unreached' },
  { positive_face: 'rested',     negative_face: 'unable to land', name: 'rested but unable to land' },
  { positive_face: 'present',    negative_face: 'somewhere else', name: 'present but somewhere else' },
  { positive_face: 'capable',    negative_face: 'unable to choose', name: 'capable but unable to choose' },
  { positive_face: 'arrived',    negative_face: 'not yet here', name: 'arrived but not yet here' },
  { positive_face: 'visible',    negative_face: 'unseen',   name: 'visible but unseen' },
];

export interface ContradictionReading {
  the_contradiction: Contradiction | null;
  depth: number;
  is_human_contradiction: boolean;
  feels_constructed: boolean;
  notes: string[];
}

export interface ContradictionInput {
  truth: HumanTruth;
  emotionalCore: EmotionalCore | null;
}

export function readEmotionalContradiction(input: ContradictionInput): ContradictionReading {
  const { truth, emotionalCore } = input;
  const notes: string[] = [];

  // Step 1: try to map the core to a known contradiction.
  let the_contradiction: Contradiction | null = null;
  if (emotionalCore) {
    switch (emotionalCore.id) {
      case 'loneliness-in-public':       the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'connected but unreached')!; break;
      case 'silent-burnout':             the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'productive but detached')!; break;
      case 'guilt':                      the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'calm but guilty')!; break;
      case 'emotional-numbness':         the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'present but somewhere else')!; break;
      case 'too-tired-to-rest':          the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'rested but unable to land')!; break;
      case 'inability-to-land':          the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'arrived but not yet here')!; break;
      case 'decision-fatigue':           the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'capable but unable to choose')!; break;
      case 'social-performance-exhaustion': the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'visible but unseen')!; break;
      case 'overstimulated-but-flat':    the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'energized but lonely')!; break;
      case 'emotional-drift':            the_contradiction = CONTRADICTION_LIBRARY.find((c) => c.name === 'relieved but emotionally absent')!; break;
      default:                            the_contradiction = null;
    }
  }

  // Step 2: depth — driven by truth's tension phrase being short and sharp
  // AND the core having a contradiction field that maps to the same idea.
  let depth = 0;
  if (the_contradiction) {
    depth = 5;
    if (truth.tension && truth.tension.length > 0 && truth.tension.length < 40) {
      depth += 3;
      notes.push(`tension phrase "${truth.tension}" sharpens the contradiction`);
    } else if (truth.tension) {
      depth += 1;
    }
    if (emotionalCore?.contradiction) {
      depth += 1;
    }
  } else if (truth.tension && truth.tension.length < 40) {
    // A tension exists but we couldn't map a named contradiction.
    depth = 4;
    notes.push('truth carries tension but no named contradiction matched');
  }
  depth = Math.max(0, Math.min(10, depth));

  // Step 3: is it human? — yes when BOTH faces are everyday words the
  // viewer would say out loud. The library is curated for that.
  const is_human_contradiction = the_contradiction !== null;

  // Step 4: does it feel CONSTRUCTED? — yes when the truth uses obvious
  // "X but Y" rhetoric in a long sentence, or when the truth has no
  // tension at all but a contradiction was forced.
  const looksRhetorical = / but |, but /i.test(truth.truth) && truth.truth.length > 90;
  const forcedWithoutTension = the_contradiction !== null && (!truth.tension || truth.tension.length === 0);
  const feels_constructed = looksRhetorical || forcedWithoutTension;
  if (feels_constructed) {
    notes.push('contradiction reads as rhetorical — too literary, not observed');
  }

  if (notes.length === 0) notes.push('contradiction present and human-shaped');

  return {
    the_contradiction,
    depth,
    is_human_contradiction,
    feels_constructed,
    notes,
  };
}
