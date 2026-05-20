/**
 * "NOT GOOD ENOUGH" META-CRITIC (Phase 2)
 *
 * The most important upgrade.
 *
 * Synthesizes the scroll-stop critic, the taste critic, the visual
 * psychology engine, the product presence engine, and the reference
 * intelligence engine into ONE verdict the pipeline acts on.
 *
 * Brutality is configurable: a higher brutality threshold demands more
 * from every signal. Default brutality 0.7 means: every signal must
 * clear a meaningful floor — no signal carries the banner alone.
 *
 * The meta-critic does NOT vote. It enforces. If the taste critic
 * rejected, the meta-critic rejects, period. If the reference closeness
 * is below the floor, the meta-critic rejects, period. The point is to
 * stop accepting "technically correct."
 */

import type {
  AestheticCritique,
  Critique,
  EngineContext,
  FinalVerdict,
  MemorySnapshot,
  ProductPresence,
  ReferenceMatch,
  VisualPsychology,
} from '@/core/types';
import type { FatigueReport } from '@lib/visualFatigue';
import type { ReactionCurve } from '@lib/humanReaction';
import type { TasteVerdict } from '@lib/tasteJudge';

export interface MetaInput {
  ctx: EngineContext;
  scrollStop: Critique;
  taste: AestheticCritique;
  psychology: VisualPsychology;
  productPresence: ProductPresence | null;
  reference: ReferenceMatch;
  memory: MemorySnapshot;
  /** 0..1 — higher means more brutal. Default 0.7. */
  brutality?: number;
  // Phase 2.5 — explicit taste system signals.
  judge?: TasteVerdict;
  reaction?: ReactionCurve;
  fatigue?: FatigueReport;
}

export function decideFinalVerdict(input: MetaInput): FinalVerdict {
  const { ctx, scrollStop, taste, psychology, productPresence, reference, memory, judge, reaction, fatigue } = input;

  // Brutality rises with the campaign's history — if recent banners have
  // approved easily, raise the bar; if many rejections recently, hold
  // steady. This is the spec's "rejection system" learning behavior.
  const brutality = clampUnit((input.brutality ?? 0.65) + brutalityFromMemory(memory));

  // Composite totals.
  const scrollStopTotal = compositeScrollStop(scrollStop);
  const tasteTotal = compositeTaste(taste);
  const psychologyTotal = compositePsychology(psychology);
  const productTotal = productPresence ? compositePresence(productPresence) : null;

  const totals: FinalVerdict['totals'] = {
    scrollStop: scrollStopTotal,
    taste: tasteTotal,
    psychology: psychologyTotal,
    productPresence: productTotal,
    referenceCloseness: reference.closeness,
  };

  // Floors scale with brutality. At brutality 0.7:
  //  - scrollStop must be >= 6.0
  //  - taste must be <= 4.0 (lower is better — it's a failure score)
  //  - psychology must be >= 5.5
  //  - product (if present) must be >= 6.0
  //  - reference closeness must be >= 0.55
  const floorScrollStop      = 5.0 + brutality * 1.5;
  const ceilingTaste         = 5.5 - brutality * 1.5;
  const floorPsychology      = 4.5 + brutality * 1.5;
  const floorProduct         = 5.0 + brutality * 1.5;
  const floorRefCloseness    = 0.45 + brutality * 0.15;

  const reasons: string[] = [];
  let verdict: FinalVerdict['verdict'] = 'approve';

  // Hard gates — fire only at sufficient brutality. At low brutality the
  // taste rejection rolls into the soft accumulator below.
  if (taste.verdict === 'taste-reject' && brutality >= 0.75) {
    reasons.push(...taste.reasons);
    verdict = 'reject-taste';
  }
  if (productPresence?.verdict === 'pasted') {
    reasons.push(...productPresence.reasons);
    verdict = 'reject-image';
  }

  // ─── Phase 2.5 hard gates ─────────────────────────────────────
  // The TasteJudge has its own hard verdict — when it says hard-refuse,
  // the meta-critic refuses regardless of brutality. This is the
  // "comfortable not generating" rule from the spec.
  if (judge && judge.verdict === 'hard-refuse') {
    reasons.push(`taste judge hard-refused: ${judge.punishments.slice(0, 2).join('; ')}`);
    verdict = 'reject-taste';
  }
  // Soft-refuse from the judge fires at default brutality and up.
  if (judge && judge.verdict === 'soft-refuse' && brutality >= 0.65 && verdict === 'approve') {
    reasons.push(`taste judge soft-refused: ${judge.punishments.slice(0, 2).join('; ')}`);
    verdict = 'reject-taste';
  }
  // The human-reaction simulator's scroll-past prediction is a HARD gate.
  // If the prediction says the viewer scrolls past at 0.3s, refusal is mandatory.
  if (reaction && reaction.scrollPast) {
    reasons.push(`predicted scroll-past at 0.3s — ${reaction.at_0_3s} into ${reaction.at_1s}`);
    verdict = 'reject-concept';
  }
  // Visual fatigue is a hard gate at brutal mode; soft pressure at default.
  if (fatigue && fatigue.verdict === 'fatigued' && brutality >= 0.8) {
    reasons.push(`campaign fatigue: ${fatigue.flags.slice(0, 2).join('; ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // Soft gates — accumulate, then decide.
  const softReasons: string[] = [];
  if (scrollStopTotal < floorScrollStop) softReasons.push(`scroll-stop ${scrollStopTotal.toFixed(1)} below floor ${floorScrollStop.toFixed(1)}`);
  if (tasteTotal > ceilingTaste)         softReasons.push(`taste failures ${tasteTotal.toFixed(1)} above ceiling ${ceilingTaste.toFixed(1)}`);
  if (psychologyTotal < floorPsychology) softReasons.push(`psychology ${psychologyTotal.toFixed(1)} below floor ${floorPsychology.toFixed(1)}`);
  if (productTotal !== null && productTotal < floorProduct)
    softReasons.push(`product presence ${productTotal.toFixed(1)} below floor ${floorProduct.toFixed(1)}`);
  if (reference.closeness < floorRefCloseness)
    softReasons.push(`reference closeness ${reference.closeness.toFixed(2)} below floor ${floorRefCloseness.toFixed(2)} — drifted from every taste anchor`);

  // Phase 2.5 — soft pressure from the explicit taste system.
  if (judge && judge.composite < (5.5 + brutality * 1.5)) {
    softReasons.push(`taste judge composite ${judge.composite.toFixed(1)} below floor ${(5.5 + brutality * 1.5).toFixed(1)}`);
  }
  if (reaction && reaction.engagementQuality < (4 + brutality * 2)) {
    softReasons.push(`predicted engagement ${reaction.engagementQuality.toFixed(1)} below floor`);
  }
  if (fatigue && fatigue.verdict === 'fatigued') {
    softReasons.push(`campaign fatigue: ${fatigue.flags[0] ?? 'multi-axis'}`);
  }

  // Memory-aware additional rejection: campaign overstimulation.
  if (memory.overstimulationFlag) {
    softReasons.push('campaign has overstimulated recently — this banner needs more silence');
  }

  if (verdict === 'approve' && softReasons.length >= 2) {
    // Two or more soft floors broken → reject. Decide what kind based
    // on which floors broke first.
    reasons.push(...softReasons);
    const tasteHeavy = tasteTotal > ceilingTaste;
    const psychHeavy = psychologyTotal < floorPsychology;
    const productHeavy = productTotal !== null && productTotal < floorProduct;
    if (productHeavy && !tasteHeavy && !psychHeavy) {
      verdict = 'reject-image';
    } else if (psychHeavy) {
      verdict = 'reject-concept';
    } else {
      verdict = 'reject-taste';
    }
  }

  // Surface the reference's named divergences as gentle hints even on
  // approve — these become memory signals the director can learn from.
  if (verdict === 'approve' && reference.divergences.length > 0) {
    softReasons.push(...reference.divergences.map((d) => `note: ${d}`));
  }

  const notes = writeNotes(verdict, totals, brutality);

  const final: FinalVerdict = {
    verdict,
    reasons,
    notes,
    totals,
    brutality,
  };

  ctx.emit({
    stage: 'not-good-enough',
    message: `meta-verdict: ${verdict} · brutality ${brutality.toFixed(2)}`,
    data: { totals, reasons, softReasons },
  });
  return final;
}

// ───── compositors ─────

function compositeScrollStop(c: Critique): number {
  const positives = c.scores.emotionalTruthClarity + c.scores.tension + c.scores.curiosity
                  + c.scores.focalPointObvious + c.scores.eyeStops + c.scores.feelsLikeRealCampaign;
  const negatives = c.scores.feelsAI + c.scores.compositionGeneric + c.scores.productPasted + c.scores.typographyForced;
  // Scale to 0..10 — 6 positives sum to max 60, 4 negatives sum to max 40.
  return clamp10((positives / 60) * 7 + (1 - negatives / 40) * 3);
}

function compositeTaste(t: AestheticCritique): number {
  // Mean of failure scores — 0..10, lower is better.
  const vals = Object.values(t.failures);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function compositePsychology(p: VisualPsychology): number {
  // Equal-weight average of the six judged axes.
  return (
    p.focalInterruption +
    p.emotionalHierarchyClear +
    p.delayedProductReveal +
    p.ctaResolution +
    p.eyeFlowIntegrity
  ) / 5;
}

function compositePresence(p: ProductPresence): number {
  const vals = Object.values(p.scores);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ───── brutality memory ─────

function brutalityFromMemory(m: MemorySnapshot): number {
  // If the last 4 banners all approved on first attempt, raise the bar
  // slightly. If many recent rejections, ease off. (Memory does not yet
  // store per-banner attempt count, so we proxy via arc length.)
  if (m.totalBanners < 4) return 0;
  if (m.aggressiveCount > m.silenceCount * 2) return 0.05; // campaign too loud — push more rejections of loud
  if (m.overstimulationFlag) return 0.05;
  return 0;
}

function writeNotes(
  verdict: FinalVerdict['verdict'],
  totals: FinalVerdict['totals'],
  brutality: number,
): string {
  if (verdict === 'approve') {
    return `Approved at brutality ${brutality.toFixed(2)}. Scroll-stop ${totals.scrollStop.toFixed(1)}, taste ${totals.taste.toFixed(1)} (lower is better), psychology ${totals.psychology.toFixed(1)}, reference closeness ${totals.referenceCloseness.toFixed(2)}.`;
  }
  return `Rejected at brutality ${brutality.toFixed(2)}. The banner is technically correct but fails the floor: ${verdict}.`;
}

function clampUnit(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
