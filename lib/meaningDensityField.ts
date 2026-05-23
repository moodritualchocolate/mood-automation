/**
 * MEANING DENSITY FIELD (Phase 421 — Wave 16)
 */
export interface MeaningDensityFieldReading { density: number; field_dense: boolean; notes: string[]; }
export interface MeaningDensityFieldInput { meaningPropagated: number; presenceCycles: number; }
export function readMeaningDensityField(input: MeaningDensityFieldInput): MeaningDensityFieldReading {
  const density = input.presenceCycles > 0 ? Math.min(10, (input.meaningPropagated / input.presenceCycles) * 10) : 0;
  const field_dense = density >= 5;
  return { density, field_dense, notes: [`meaning density field: ${density.toFixed(1)}/10`] };
}
