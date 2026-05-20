/**
 * The pipeline.
 *
 * This is the ONLY place that wires engines together. It enforces the
 * spec's mandatory order:
 *
 *   human truth → emotional tension → campaign concept → composition
 *   → image → typography → CTA → critique → rejection → export → memory
 *
 * The orchestrator also owns the regenerate loop the spec demands: when
 * the critic rejects, we either regenerate the image with a hardened
 * prompt, or throw out the concept entirely and pick a different state.
 *
 * Engines never call each other. The pipeline calls them. This keeps
 * each engine swappable and lets future formulas (CALM, FOCUS) and
 * future outputs (carousels, video) inject themselves cleanly.
 */

import { randomUUID } from 'crypto';
import type {
  Banner,
  CampaignMode,
  EngineContext,
  Formula,
  GenerateRequest,
  HumanState,
  MemorySnapshot,
  PipelineEvent,
} from './types';
import { ExhaustedAttempts } from './errors';

import { selectHumanState } from '@/engines/human-state';
import { buildHumanTruth } from '@/engines/human-truth';
import { direct } from '@/engines/creative-director';
import { planComposition } from '@/engines/composition';
import { generateImage } from '@/engines/image';
import { decideProductIntegration } from '@/engines/product-integration';
import { buildTypography } from '@/engines/typography';
import { buildCTA } from '@/engines/cta';
import { critique } from '@/engines/scroll-stop-critic';
import { decideRejection } from '@/engines/rejection';
import { createMemoryStore } from '@/engines/memory';

export interface RunOptions {
  onEvent?: (event: PipelineEvent) => void;
}

export interface RunResult {
  banner: Banner;
  events: PipelineEvent[];
}

export async function runPipeline(request: GenerateRequest, opts: RunOptions = {}): Promise<RunResult> {
  const bannerId = randomUUID();
  const events: PipelineEvent[] = [];
  const emit = (e: Omit<PipelineEvent, 'ts'>) => {
    const full: PipelineEvent = { ...e, ts: Date.now() };
    events.push(full);
    opts.onEvent?.(full);
  };

  const ctx: EngineContext = {
    formula: request.formula,
    campaignMode: request.campaignMode ?? null,
    bannerId,
    emit,
  };

  const memoryStore = createMemoryStore();
  let memory: MemorySnapshot = await memoryStore.read();

  const maxAttempts = Math.max(1, Math.min(request.maxAttempts ?? 2, 4));
  let attempt = 0;
  const rejectedAttempts: Banner['rejectedAttempts'] = [];

  // The concept-level loop. State may change per iteration if the
  // critic returns reject-concept. Within an iteration the image-level
  // loop can also rerun.
  let stateSeed = Date.now();
  let forceStateId: string | undefined = request.forceStateId;

  while (attempt < maxAttempts) {
    attempt += 1;

    const state: HumanState = selectHumanState({
      ctx,
      memory,
      forceStateId,
      seed: stateSeed,
    });

    const truth = await buildHumanTruth({ ctx, state });
    const direction = await direct({ ctx, truth, campaignMode: ctx.campaignMode, memory });
    const composition = planComposition({ ctx, direction });

    // Product decision happens before image — informs the image prompt.
    decideProductIntegration({ ctx, direction });

    // Image-level inner loop (max 2 image regens before bumping to concept).
    let imageAttempts = 0;
    let image, brief;
    while (true) {
      imageAttempts += 1;
      ({ brief, image } = await generateImage({ ctx, truth, direction, composition }));

      const typography = await buildTypography({ ctx, truth, direction });
      const cta = buildCTA({ ctx, direction, composition, seed: stateSeed + imageAttempts });

      const c = await critique({
        ctx, truth, direction, composition,
        imageBrief: brief, image,
        typography, cta,
      });

      const action = decideRejection(c);

      if (action.kind === 'approve') {
        const memorySnapshot = await memoryStore.record({
          id: bannerId,
          createdAt: Date.now(),
          formula: ctx.formula,
          campaignMode: ctx.campaignMode,
          state, truth, direction, composition,
          imageBrief: brief, image, typography, cta,
          critique: c,
          attempts: attempt,
          rejectedAttempts,
          memorySnapshot: memory, // pre-record snapshot; overwritten below
        });

        const banner: Banner = {
          id: bannerId,
          createdAt: Date.now(),
          formula: ctx.formula,
          campaignMode: ctx.campaignMode,
          state, truth, direction, composition,
          imageBrief: brief, image, typography, cta,
          critique: c,
          attempts: attempt,
          rejectedAttempts,
          memorySnapshot,
        };

        emit({ stage: 'pipeline', message: 'banner approved', data: { attempt, imageAttempts } });
        return { banner, events };
      }

      if (action.kind === 'regen-image' && imageAttempts < 2) {
        rejectedAttempts.push({ stage: 'image', reason: action.reasons.join('; ') });
        emit({ stage: 'rejection', message: 'regenerating image', data: { reasons: action.reasons } });
        continue; // inner loop
      }

      // Either reject-concept, or image-regens exhausted → break outer attempt.
      rejectedAttempts.push({
        stage: action.kind === 'regen-image' ? 'image-exhausted' : 'concept',
        reason: action.reasons.join('; '),
      });
      emit({ stage: 'rejection', message: 'regenerating concept', data: { reasons: action.reasons } });
      stateSeed += 7919;
      forceStateId = undefined; // let the selector choose fresh
      // refresh memory snapshot in case other things wrote
      memory = await memoryStore.read();
      break; // exit inner loop, go to next outer attempt
    }
  }

  throw new ExhaustedAttempts(
    maxAttempts,
    rejectedAttempts.slice(-3).map((r) => `${r.stage}: ${r.reason}`),
  );
}
