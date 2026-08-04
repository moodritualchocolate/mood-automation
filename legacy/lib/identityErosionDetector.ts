/**
 * IDENTITY EROSION DETECTOR (Phase 331 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Erosion is slow — never a single break, always a sequence of small
 * compromises. This detector flags the trend before any one compromise
 * looks alarming.
 */

export interface IdentityErosionReading {
  /** True when slow erosion is detected. */
  erosion_detected: boolean;
  /** 0..10 — rate of erosion across recent cycles. */
  erosion_rate: number;
  notes: string[];
}

export interface IdentityErosionInput {
  identityCorruptions: number;
  preservationCycles: number;
  popularityChosenOverTruth: number;
}

export function readIdentityErosionDetector(input: IdentityErosionInput): IdentityErosionReading {
  const { identityCorruptions, preservationCycles, popularityChosenOverTruth } = input;
  const notes: string[] = [];

  const corruptionRate = preservationCycles > 0 ? identityCorruptions / preservationCycles : 0;
  const popRate = preservationCycles > 0 ? popularityChosenOverTruth / preservationCycles : 0;
  const erosion_rate = round1(Math.min(10, corruptionRate * 8 + popRate * 6));
  const erosion_detected = erosion_rate >= 4 && preservationCycles >= 3;

  notes.push(`identity erosion detector: ${erosion_detected ? 'EROSION' : 'stable'} (rate ${erosion_rate}/10)`);
  return { erosion_detected, erosion_rate, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
