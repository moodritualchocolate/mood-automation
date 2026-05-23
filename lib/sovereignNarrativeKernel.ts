/**
 * SOVEREIGN NARRATIVE KERNEL (Phase 329 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The narrative the brand is telling must originate from inside,
 * never from the field reflecting back at it. This kernel checks
 * narrative sovereignty: is this story the brand's, or borrowed?
 */

export interface SovereignNarrativeKernelReading {
  /** True when the narrative being told is genuinely the brand's. */
  narrative_is_sovereign: boolean;
  /** The origin of the current narrative. */
  narrative_origin: 'brand-internal' | 'audience-reflected' | 'trend-borrowed';
  notes: string[];
}

export interface SovereignNarrativeKernelInput {
  narrativeOriginatesInBrand: boolean;
  narrativeReflectsAudience: boolean;
  narrativeBorrowedFromTrend: boolean;
}

export function readSovereignNarrativeKernel(input: SovereignNarrativeKernelInput): SovereignNarrativeKernelReading {
  const { narrativeOriginatesInBrand, narrativeReflectsAudience, narrativeBorrowedFromTrend } = input;
  const notes: string[] = [];

  const narrative_origin: SovereignNarrativeKernelReading['narrative_origin'] =
    narrativeBorrowedFromTrend ? 'trend-borrowed' :
    narrativeReflectsAudience ? 'audience-reflected' :
    'brand-internal';

  const narrative_is_sovereign = narrativeOriginatesInBrand && narrative_origin === 'brand-internal';

  notes.push(`sovereign narrative kernel: origin "${narrative_origin}" — ${narrative_is_sovereign ? 'SOVEREIGN' : 'borrowed'}`);
  return { narrative_is_sovereign, narrative_origin, notes };
}
