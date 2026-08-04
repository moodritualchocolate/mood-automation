/** QUIET AUTHORITY FIELD (Phase 448 — Wave 16) */
export interface QuietAuthorityReading { authority_quiet_and_real: boolean; notes: string[]; }
export interface QuietAuthorityInput { authorityEarned: boolean; demanding: boolean; }
export function readQuietAuthorityField(input: QuietAuthorityInput): QuietAuthorityReading {
  const authority_quiet_and_real = input.authorityEarned && !input.demanding;
  return { authority_quiet_and_real, notes: [`quiet authority field: ${authority_quiet_and_real ? 'quiet and real' : 'demanding'}`] };
}
