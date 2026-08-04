/**
 * EMOTIONAL GEOMETRY (Phase 30 — Visual Cognition / Wave 2)
 *
 * Reads the GEOMETRY of a frame as emotion. Where the weight sits,
 * how the asymmetry leans, how the negative space pushes — geometry
 * carries meaning before the copy does.
 */

import type { CompositionPlan } from '@/core/types';

export type GeometryMood =
  | 'grounded-weight' | 'unstable-lean' | 'compressed-pressure'
  | 'open-quiet' | 'falling-collapse' | 'centred-stillness';

export interface EmotionalGeometryReading {
  geometry_mood: GeometryMood;
  /** 0..10 — how much the geometry carries emotional meaning. */
  geometry_meaning: number;
  /** 0..10 — how human (vs random) the asymmetry feels. */
  asymmetry_is_human: number;
  /** True when composition carries meaning before copy. */
  meaning_before_copy: boolean;
  notes: string[];
}

export interface EmotionalGeometryInput {
  composition: CompositionPlan;
}

export function readEmotionalGeometry(input: EmotionalGeometryInput): EmotionalGeometryReading {
  const { composition } = input;
  const notes: string[] = [];

  const f = composition.focal;
  const cx = f.x + f.w / 2;
  const cy = f.y + f.h / 2;

  let geometry_mood: GeometryMood;
  if (cy > 0.62 && cx < 0.45) geometry_mood = 'falling-collapse';
  else if (cy > 0.6) geometry_mood = 'grounded-weight';
  else if (cy < 0.4) geometry_mood = 'unstable-lean';
  else if (composition.negativeSpaceBias === 'center') geometry_mood = 'centred-stillness';
  else if (composition.negativeSpaceBias === 'corners') geometry_mood = 'compressed-pressure';
  else geometry_mood = 'open-quiet';

  // Asymmetry-is-human: a moderate off-centre offset reads human; a
  // dead-centre OR an extreme edge offset reads designed / random.
  const offset = Math.hypot(cx - 0.5, cy - 0.5);
  const asymmetry_is_human = offset < 0.05 ? 3
    : offset > 0.4 ? 4
    : round1(8 - Math.abs(offset - 0.2) * 12);

  let geometry_meaning = 5;
  if (geometry_mood !== 'centred-stillness') geometry_meaning += 2;
  if (asymmetry_is_human >= 6) geometry_meaning += 2;
  if (composition.eyeFlow.length >= 3) geometry_meaning += 1;
  geometry_meaning = Math.min(10, round1(geometry_meaning));

  const meaning_before_copy = geometry_meaning >= 6 && asymmetry_is_human >= 5;

  notes.push(`emotional geometry: ${geometry_mood} — meaning ${geometry_meaning}/10, human asymmetry ${asymmetry_is_human}/10`);
  if (!meaning_before_copy) notes.push('emotional geometry: the frame does not carry meaning before the copy does');

  return { geometry_mood, geometry_meaning, asymmetry_is_human: clamp10(asymmetry_is_human), meaning_before_copy, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
