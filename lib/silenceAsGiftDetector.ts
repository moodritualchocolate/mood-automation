/** SILENCE AS GIFT DETECTOR (Phase 485 — Wave 16) */
export interface SilenceAsGiftReading { silence_was_a_gift: boolean; notes: string[]; }
export interface SilenceAsGiftInput { silenceCame: boolean; audienceWanted: boolean; }
export function readSilenceAsGiftDetector(input: SilenceAsGiftInput): SilenceAsGiftReading {
  return { silence_was_a_gift: input.silenceCame && input.audienceWanted, notes: [`silence as gift detector: ${input.silenceCame && input.audienceWanted ? 'GIFT' : 'just absence'}`] };
}
