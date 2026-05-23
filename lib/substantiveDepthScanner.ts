/** SUBSTANTIVE DEPTH SCANNER (Phase 466 — Wave 16) */
export interface SubstantiveDepthReading { has_substance: boolean; depth: number; notes: string[]; }
export interface SubstantiveDepthInput { meaningWeight: number; }
export function readSubstantiveDepthScanner(input: SubstantiveDepthInput): SubstantiveDepthReading {
  const has_substance = input.meaningWeight >= 5;
  return { has_substance, depth: input.meaningWeight, notes: [`substantive depth scanner: ${has_substance ? 'substantive' : 'shallow'}`] };
}
