/** WOUND RECOGNITION ENGINE (Phase 456 — Wave 16) */
export interface WoundRecognitionReading { wound_recognised: boolean; wound: string | null; notes: string[]; }
export interface WoundRecognitionInput { detected: boolean; kind: string | null; }
export function readWoundRecognitionEngine(input: WoundRecognitionInput): WoundRecognitionReading {
  return { wound_recognised: input.detected, wound: input.kind, notes: [`wound recognition engine: ${input.detected ? `recognised — ${input.kind}` : 'none'}`] };
}
