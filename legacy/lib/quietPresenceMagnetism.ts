/** QUIET PRESENCE MAGNETISM (Phase 475 — Wave 16) */
export interface QuietPresenceMagnetismReading { magnetic_through_quiet: boolean; notes: string[]; }
export interface QuietPresenceMagnetismInput { quiet: boolean; drawingAttentionAnyway: boolean; }
export function readQuietPresenceMagnetism(input: QuietPresenceMagnetismInput): QuietPresenceMagnetismReading {
  return { magnetic_through_quiet: input.quiet && input.drawingAttentionAnyway, notes: [`quiet presence magnetism: ${input.quiet && input.drawingAttentionAnyway ? 'MAGNETIC' : 'absent'}`] };
}
