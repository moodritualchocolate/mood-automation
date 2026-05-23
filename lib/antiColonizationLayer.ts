/** ANTI-COLONIZATION LAYER (Phase 473 — Wave 16) */
export interface AntiColonizationLayerReading { refuses_colonization: boolean; notes: string[]; }
export interface AntiColonizationLayerInput { takingOverSpace: boolean; }
export function readAntiColonizationLayer(input: AntiColonizationLayerInput): AntiColonizationLayerReading {
  return { refuses_colonization: !input.takingOverSpace, notes: [`anti-colonization layer: ${input.takingOverSpace ? 'TAKING OVER' : 'sharing space'}`] };
}
