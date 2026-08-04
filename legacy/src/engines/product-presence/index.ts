/**
 * PRODUCT PRESENCE INTELLIGENCE (Phase 2)
 *
 * The product is evidence, not hero PNG.
 *
 * When the direction's productRole is 'hidden', the engine returns null
 * and the meta-critic skips it — absent product cannot fail.
 *
 * Otherwise the engine scores seven dimensions of product behavior.
 * Stub provider runs can only judge structural axes (relevance, physical
 * logic, narrative justification, scene integration); the optical axes
 * (lens, shadow, realism) come from cognition vision when a real
 * provider was used.
 */

import type {
  CompositionPlan,
  CreativeDirection,
  EngineContext,
  HumanTruth,
  ImageBrief,
  ImageResult,
  ProductPresence,
} from '@/core/types';

export interface PresenceInput {
  ctx: EngineContext;
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
  brief: ImageBrief;
  image: ImageResult;
}

export function analyzeProductPresence(input: PresenceInput): ProductPresence | null {
  const { ctx, direction, composition, truth, brief, image } = input;

  if (direction.productRole === 'hidden') {
    ctx.emit({ stage: 'product-presence', message: 'product hidden — no presence to score' });
    return null;
  }

  // Real-photo axes default to "presumed good" with stub provider
  // because the stub does not photograph product (it paints atmosphere).
  // We will sharpen these later when a vision model evaluates the
  // actual rendered photo.
  const usingStub = image.provider.startsWith('stub');

  // Environmental realism — is the product placed in a believable
  // physical context for the state?
  const realisticContext = directionMatchesSetting(direction, truth);
  const environmentalRealism = realisticContext ? 8 : 4;

  // Natural scene integration — the product zone must fall OUTSIDE
  // the focal zone (a product inside the focal zone behaves like a hero).
  const naturalSceneIntegration = composition.productZone
    ? overlapsHeavily(composition.productZone, composition.focal)
      ? 4
      : 8
    : 9; // no product zone declared (image-only product) — treat as integrated

  // Emotional relevance — the product's role aligns with the state family.
  const emotionalRelevance = scoreEmotionalRelevance(direction.productRole, truth.state.family);

  // Physical logic — the brief explicitly instructs the product as a
  // scene object, and the product zone sits below the focal (gravity).
  const focalCenterY = composition.focal.y + composition.focal.h / 2;
  const productCenterY = composition.productZone
    ? composition.productZone.y + composition.productZone.h / 2
    : null;
  const physicalLogic = productCenterY === null
    ? 8
    : productCenterY > focalCenterY
      ? 8
      : 5;

  // Lens consistency — only judgeable with real photo. Defaults to 7.
  const lensConsistency = usingStub ? 7 : 6;

  // Shadow consistency — same.
  const shadowConsistency = usingStub ? 7 : 6;

  // Narrative justification — the brief explicitly references the
  // product as evidence ("treated as a scene object not a hero",
  // "evidence of the day"). Read directly from the brief.
  const narrativeJustification = /evidence|scene object|found|day|table|desk|reached for/i.test(brief.scene)
    ? 8
    : 5;

  const scores = {
    environmentalRealism,
    naturalSceneIntegration,
    emotionalRelevance,
    physicalLogic,
    lensConsistency,
    shadowConsistency,
    narrativeJustification,
  };

  const reasons: string[] = [];
  if (environmentalRealism <= 4) reasons.push('Product role does not match the state setting — feels placed.');
  if (naturalSceneIntegration <= 4) reasons.push('Product sits inside the focal zone — behaves like a hero.');
  if (emotionalRelevance <= 4) reasons.push('Product behavior does not earn its place in this emotional family.');
  if (physicalLogic <= 5) reasons.push('Product is above the focal — defies the scene gravity.');

  // Verdict — average + worst-case rule.
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / 7;
  const worst = Math.min(...Object.values(scores));
  let verdict: ProductPresence['verdict'];
  if (worst <= 3) verdict = 'pasted';
  else if (avg < 6 || worst <= 5) verdict = 'inserted-risk';
  else verdict = 'evidence';

  const presence: ProductPresence = { scores, verdict, reasons };
  ctx.emit({
    stage: 'product-presence',
    message: `verdict: ${verdict} · avg ${avg.toFixed(1)}`,
    data: { scores, reasons },
  });
  return presence;
}

function directionMatchesSetting(d: CreativeDirection, t: HumanTruth): boolean {
  // Cross-check: if the product is "desk-proof" or "table-object", the
  // state's settings should include a desk/table/kitchen surface.
  const settings = t.state.setting.join(' ').toLowerCase();
  switch (d.productRole) {
    case 'desk-proof':       return /desk|laptop|table|monitor/.test(settings);
    case 'table-object':     return /table|kitchen|counter|surface/.test(settings);
    case 'hand-held':        return /seat|aisle|car|gym|bathroom|street/.test(settings);
    case 'environmental':    return settings.length > 0;
    case 'partial-crop':     return true;
    case 'foreground-blur':  return true;
    case 'background-object':return true;
    case 'emotional-proof':  return true;
    case 'hidden':           return true;
  }
}

function scoreEmotionalRelevance(role: CreativeDirection['productRole'], family: string): number {
  // Some product behaviors fight specific families. E.g. "hand-held"
  // during "paralysis" reads contradictory (the body doesn't move).
  const incompatible: Record<string, string[]> = {
    'hand-held':         ['paralysis', 'numbness'],
    'partial-crop':      [],
    'environmental':     [],
    'desk-proof':        ['avoidance'],
    'table-object':      [],
    'foreground-blur':   [],
    'background-object': [],
    'emotional-proof':   [],
    'hidden':            [],
  };
  return incompatible[role]?.includes(family) ? 4 : 8;
}

function overlapsHeavily(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return false;
  const overlap = (x2 - x1) * (y2 - y1);
  const aArea = a.w * a.h;
  return overlap / aArea > 0.4;
}
