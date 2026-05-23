/** GENTLE STRENGTH INDEX (Phase 447 — Wave 16) */
export interface GentleStrengthIndexReading { strength: number; gentle_and_strong: boolean; notes: string[]; }
export interface GentleStrengthIndexInput { sovereignty: number; softness: number; }
export function readGentleStrengthIndex(input: GentleStrengthIndexInput): GentleStrengthIndexReading {
  const strength = Math.min(10, input.sovereignty * 0.5 + input.softness * 0.5);
  const gentle_and_strong = input.sovereignty >= 6 && input.softness >= 6;
  return { strength, gentle_and_strong, notes: [`gentle strength index: ${gentle_and_strong ? 'gentle AND strong' : 'unbalanced'} (${strength.toFixed(1)}/10)`] };
}
