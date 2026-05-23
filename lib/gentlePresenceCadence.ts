/** GENTLE PRESENCE CADENCE (Phase 472 — Wave 16) */
export interface GentlePresenceCadenceReading { cadence_gentle: boolean; notes: string[]; }
export interface GentlePresenceCadenceInput { spaceBetween: number; }
export function readGentlePresenceCadence(input: GentlePresenceCadenceInput): GentlePresenceCadenceReading {
  const cadence_gentle = input.spaceBetween >= 3;
  return { cadence_gentle, notes: [`gentle presence cadence: ${cadence_gentle ? 'gentle' : 'crowded'}`] };
}
