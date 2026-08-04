/**
 * 6. PRODUCT INTEGRATION ENGINE
 *
 * Decides how the product is treated relative to the image.
 *
 * V1 rule: the product NEVER becomes a pasted PNG overlay. If the
 * image-generation engine was instructed to integrate it into the
 * scene (via productRole !== 'hidden'), the renderer leaves it alone.
 *
 * If the creative direction wants a "desk-proof" or "table-object"
 * placement but the image stub cannot generate it, this engine will
 * still REFUSE to layer a packshot on top — it instead returns
 * `null` and lets the critic decide whether the absence is OK.
 *
 * This engine is essentially a guard: the bad behaviour we are
 * preventing is bolt-on PNG product. We provide a single decision.
 */

import type { CreativeDirection, EngineContext } from '@/core/types';

export interface ProductDecision {
  inScene: boolean;            // product is expected to be inside the photo
  overlay: null;               // V1 NEVER overlays product. Always null.
  reasoning: string;
}

export function decideProductIntegration(input: {
  ctx: EngineContext;
  direction: CreativeDirection;
}): ProductDecision {
  const { ctx, direction } = input;

  const inScene = direction.productRole !== 'hidden';

  const reasoning = inScene
    ? `productRole=${direction.productRole}: product must live inside the photographed scene as an object`
    : 'productRole=hidden: the banner intentionally carries no product — the truth carries the brand';

  const decision: ProductDecision = { inScene, overlay: null, reasoning };
  ctx.emit({ stage: 'product-integration', message: reasoning, data: decision });
  return decision;
}
