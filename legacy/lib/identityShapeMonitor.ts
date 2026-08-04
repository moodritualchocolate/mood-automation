/**
 * IDENTITY SHAPE MONITOR (Phase 349 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Monitors the overall shape of identity — sharp vs blurred,
 * recognizable vs generic.
 */

export type IdentityShape = 'sharp' | 'recognizable' | 'blurred' | 'generic';

export interface IdentityShapeReading {
  shape: IdentityShape;
  /** True when the shape is still clear. */
  shape_holds: boolean;
  notes: string[];
}

export interface IdentityShapeInput {
  invariantsScore: number;
  similarityToField: number;
}

export function readIdentityShapeMonitor(input: IdentityShapeInput): IdentityShapeReading {
  const { invariantsScore, similarityToField } = input;
  const notes: string[] = [];

  const shape: IdentityShape =
    similarityToField >= 7 ? 'generic' :
    similarityToField >= 5 ? 'blurred' :
    invariantsScore >= 8 ? 'sharp' : 'recognizable';

  const shape_holds = shape === 'sharp' || shape === 'recognizable';

  notes.push(`identity shape monitor: ${shape}`);
  return { shape, shape_holds, notes };
}
