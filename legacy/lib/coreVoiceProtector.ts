/**
 * CORE VOICE PROTECTOR (Phase 333 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Protects the brand's core voice from drift across cycles.
 */

export interface CoreVoiceProtectorReading {
  /** True when the core voice is intact. */
  voice_intact: boolean;
  /** 0..10 — drift from the founding voice. */
  drift: number;
  notes: string[];
}

export interface CoreVoiceProtectorInput {
  voiceConsistent: boolean;
  borrowedTropes: number;
}

export function readCoreVoiceProtector(input: CoreVoiceProtectorInput): CoreVoiceProtectorReading {
  const { voiceConsistent, borrowedTropes } = input;
  const notes: string[] = [];

  const drift = round1(Math.min(10, (voiceConsistent ? 0 : 4) + borrowedTropes * 0.5));
  const voice_intact = drift < 4;

  notes.push(`core voice protector: ${voice_intact ? 'intact' : 'DRIFTING'} (drift ${drift}/10)`);
  return { voice_intact, drift, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
