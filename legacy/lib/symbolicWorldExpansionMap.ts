/** SYMBOLIC WORLD EXPANSION MAP (Phase 453 — Wave 16) */
export interface SymbolicWorldExpansionMapReading { expanding: boolean; expansion_rate: number; notes: string[]; }
export interface SymbolicWorldExpansionMapInput { worldGrowthSignals: number; }
export function readSymbolicWorldExpansionMap(input: SymbolicWorldExpansionMapInput): SymbolicWorldExpansionMapReading {
  const expansion_rate = Math.min(10, input.worldGrowthSignals);
  const expanding = expansion_rate >= 5;
  return { expanding, expansion_rate, notes: [`symbolic world expansion map: ${expanding ? 'expanding' : 'contained'}`] };
}
