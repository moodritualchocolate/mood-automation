/** GENTLE RECLAMATION LAYER (Phase 477 — Wave 16) */
export interface GentleReclamationLayerReading { reclamation_gentle: boolean; notes: string[]; }
export interface GentleReclamationLayerInput { reclaimingSpaceForcefully: boolean; }
export function readGentleReclamationLayer(input: GentleReclamationLayerInput): GentleReclamationLayerReading {
  return { reclamation_gentle: !input.reclaimingSpaceForcefully, notes: [`gentle reclamation layer: ${input.reclaimingSpaceForcefully ? 'FORCEFUL' : 'gentle'}`] };
}
