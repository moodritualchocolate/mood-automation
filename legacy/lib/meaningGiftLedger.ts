/** MEANING GIFT LEDGER (Phase 461 — Wave 16) */
export interface MeaningGiftLedgerReading { gifts_offered: number; notes: string[]; }
export interface MeaningGiftLedgerInput { priorGifts: number; thisCycleGift: boolean; }
export function readMeaningGiftLedger(input: MeaningGiftLedgerInput): MeaningGiftLedgerReading {
  const gifts_offered = input.priorGifts + (input.thisCycleGift ? 1 : 0);
  return { gifts_offered, notes: [`meaning gift ledger: ${gifts_offered} gift(s) on record`] };
}
