/**
 * PRODUCT PRESENCE — does the product belong at all? (Phase 8)
 *
 * The spec opened the question wider than Phase 7's humanInterruption:
 *
 *   "Sometimes:
 *     pouch absent
 *     chocolate absent
 *     only aftermath
 *     only wrapper corner
 *     only color memory
 *     only object association
 *
 *    The product is not mandatory.
 *    The emotion is mandatory."
 *
 * Eight distinct presence options. Phase 7's humanInterruption decides
 * 'silent / background / evidence / gesture / hand-held'. Phase 8 adds
 * the FOUR new modes the spec named:
 *
 *   only-aftermath        — the wrapper crumpled in a bin, no product
 *   only-wrapper-corner   — a corner of packaging at the frame edge
 *   only-color-memory     — a brand color cameo, no product object
 *   only-object-association — a recurring scene object (mug, hoodie)
 *                             that the campaign has paired with the
 *                             product across multiple banners
 *
 * The engine reads the campaign's object motifs (from Phase 7's
 * object-emotion store) to decide if 'only-object-association' is
 * earned for this banner.
 */

import type { CreativeDirection } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { AssetJob } from './campaignDecision';
import type { ObjectMotif } from './objectEmotionMemory';
import type { InterruptionPlan } from './humanInterruption';

export type PresenceMode =
  | 'absent'                    // product simply does not appear
  | 'environmental'             // present as scene object
  | 'evidence'                  // partial-crop or table evidence
  | 'gesture'                   // mid-action gesture
  | 'hand-held'                 // explicit, held
  | 'only-aftermath'            // wrapper-after-the-fact only
  | 'only-wrapper-corner'       // packaging-edge only
  | 'only-color-memory'         // a brand-color cameo
  | 'only-object-association';  // a paired scene-object stands in

export interface PresenceDecision {
  mode: PresenceMode;
  briefLine: string;
  reasoning: string;
  /** When the candidate mode requires a specific paired object (only-object-association),
   *  this is the object id from the motif store. */
  pairedObject: string | null;
  /** True when the engine refuses to put the product in the frame at all. */
  productAbsent: boolean;
}

export interface PresenceInput {
  emotionalCore: EmotionalCore | null;
  job: AssetJob;
  direction: CreativeDirection;
  interruption: InterruptionPlan;
  /** The campaign's accumulated object motifs (from Phase 7). */
  motifs: ObjectMotif[];
  /** True when the campaign rhythm is currently saying product-everywhere. */
  rhythmSaysReduceProduct: boolean;
  /** Banner index in the campaign — used to gate "only-X" modes. */
  campaignBannerIndex: number;
}

export function decideProductPresence(input: PresenceInput): PresenceDecision {
  const { emotionalCore, job, direction, interruption, motifs, rhythmSaysReduceProduct, campaignBannerIndex } = input;

  // 1. If Phase 7's humanInterruption already said 'silent', honour it
  //    — but upgrade the language to one of the spec's "only-X" forms
  //    when the campaign has earned them.
  if (!interruption.productAppears) {
    // The campaign needs at least 2 banners to have established a motif.
    if (campaignBannerIndex >= 3 && motifs.length >= 2) {
      // Find the strongest motif whose dominant core matches the current one.
      const candidate = motifs
        .slice()
        .sort((a, b) => b.appearances - a.appearances)
        .find((m) => m.appearances >= 2 && (!emotionalCore || m.dominantCore === emotionalCore.id || m.appearances >= 3));
      if (candidate) {
        return {
          mode: 'only-object-association',
          briefLine: `no product visible — instead, the recurring campaign object "${candidate.objectId.replace(/-/g, ' ')}" carries the brand`,
          reasoning: `motif "${candidate.motifLabel ?? candidate.objectId}" has been the campaign's stand-in across ${candidate.appearances} banners`,
          pairedObject: candidate.objectId,
          productAbsent: true,
        };
      }
    }
    return {
      mode: 'absent',
      briefLine: 'no product visible in the frame — emotion carries the brand',
      reasoning: interruption.reasoning,
      pairedObject: null,
      productAbsent: true,
    };
  }

  // 2. Rhythm rescues — when the campaign has been product-heavy, the
  //    engine prefers a "only-aftermath" / "only-wrapper-corner" mode
  //    instead of full visible product (unless job is explicitly sell).
  if (rhythmSaysReduceProduct && job !== 'sell') {
    return {
      mode: 'only-aftermath',
      briefLine: 'product NOT visible — a crumpled wrapper in a bin or on the counter is the only trace',
      reasoning: 'campaign rhythm asked for less product; aftermath carries the presence without the object',
      pairedObject: null,
      productAbsent: true,
    };
  }

  // 3. When the emotional core is depleted AND the job is sell, the
  //    interruption engine downgraded to evidence. We push one step
  //    further: only-wrapper-corner. The product is recognisable but
  //    will not dominate even at the edge.
  const depletedCores = ['depletion', 'silent-burnout', 'functional-collapse', 'emotional-numbness', 'too-tired-to-rest'];
  if (job === 'sell' && emotionalCore && depletedCores.includes(emotionalCore.id) && interruption.visibility <= 4) {
    return {
      mode: 'only-wrapper-corner',
      briefLine: 'product reduced to a wrapper-corner at the frame edge — visible, but barely',
      reasoning: `'sell' on "${emotionalCore.id}" with low interruption-visibility — only-wrapper-corner is the honest treatment`,
      pairedObject: null,
      productAbsent: false,
    };
  }

  // 4. When the campaign has formed a strong color motif (the brand
  //    has been seen in 4+ banners), allow 'only-color-memory' for the
  //    occasional banner where pure object would feel commercial.
  //    Selection is bounded — only every 5th banner can choose this.
  if (campaignBannerIndex >= 5 && campaignBannerIndex % 5 === 0 && motifs.some((m) => m.appearances >= 4)) {
    return {
      mode: 'only-color-memory',
      briefLine: 'no product object — a brand-color cameo on a single surface (a folded cloth, a passing shape) is the only echo',
      reasoning: 'campaign has earned a color identity; this banner lets that identity carry the presence',
      pairedObject: null,
      productAbsent: false,
    };
  }

  // 5. Default — honour interruption's intensity, mapped to the
  //    legacy modes.
  let mode: PresenceMode;
  switch (interruption.intensity) {
    case 'silent':     mode = 'absent';        break;
    case 'background': mode = 'environmental'; break;
    case 'evidence':   mode = 'evidence';      break;
    case 'gesture':    mode = 'gesture';       break;
    case 'hand-held':  mode = 'hand-held';     break;
  }
  return {
    mode,
    briefLine: interruption.briefLine,
    reasoning: `default — ${interruption.reasoning}`,
    pairedObject: null,
    productAbsent: mode === 'absent',
  };
  void direction;
}
