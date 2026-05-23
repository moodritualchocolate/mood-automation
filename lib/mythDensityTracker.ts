/**
 * MYTH DENSITY TRACKER (Phase 414 — Wave 16)
 */

export interface MythDensityReading {
  density: number;
  notes: string[];
}

export interface MythDensityInput {
  archetypeCount: number;
  symbolReuse: number;
}

export function readMythDensityTracker(input: MythDensityInput): MythDensityReading {
  const notes: string[] = [];
  const density = round1(Math.min(10, input.archetypeCount * 2 + input.symbolReuse * 0.5));
  notes.push(`myth density tracker: ${density}/10`);
  return { density, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
