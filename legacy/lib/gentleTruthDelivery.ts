/** GENTLE TRUTH DELIVERY (Phase 457 — Wave 16) */
export interface GentleTruthDeliveryReading { delivered_gently: boolean; notes: string[]; }
export interface GentleTruthDeliveryInput { truthOffered: boolean; deliveredHarshly: boolean; }
export function readGentleTruthDelivery(input: GentleTruthDeliveryInput): GentleTruthDeliveryReading {
  const delivered_gently = input.truthOffered && !input.deliveredHarshly;
  return { delivered_gently, notes: [`gentle truth delivery: ${delivered_gently ? 'gentle' : 'harsh'}`] };
}
