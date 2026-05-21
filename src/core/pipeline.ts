/**
 * The pipeline.
 *
 * This is the ONLY place that wires engines together. It enforces the
 * spec's mandatory order:
 *
 *   human truth → emotional tension → campaign concept → composition
 *   → image → typography → CTA → critique → rejection → export → memory
 *
 * Phase 2 adds the TASTE LAYER between generation and the rejection
 * decision. The scroll-stop critic still runs first (cheap structural
 * checks), then four taste engines weigh in (reference intelligence,
 * taste critic, visual psychology, product presence), and finally the
 * "Not Good Enough" meta-critic synthesises everything into the single
 * verdict the pipeline acts on.
 *
 * Engines never call each other. The pipeline calls them. This keeps
 * each engine swappable and lets future formulas (CALM, FOCUS) and
 * future outputs (carousels, video) inject themselves cleanly.
 */

import { randomUUID } from 'crypto';
import type {
  Banner,
  EngineContext,
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
import { createMemoryStore } from '@/engines/memory';
// Phase 2 — taste layer
import { matchReference } from '@/engines/reference-intelligence';
import { tasteCritique } from '@/engines/taste-critic';
import { analyzeVisualPsychology } from '@/engines/visual-psychology';
import { analyzeProductPresence } from '@/engines/product-presence';
import { decideFinalVerdict } from '@/engines/not-good-enough';
// Phase 2.5 — explicit taste system (lib/*)
import {
  extractDNA,
  loadReferences,
  judgeTaste,
  simulateHumanReaction,
  evolveCampaign,
  detectFatigue,
  // Phase 3 — campaign brain
  selectCulturalMoment,
  decideAssetJob,
  decideCourage,
  analyzeRhythm,
  bannerWouldWorsenRhythm,
  scanAntiAI,
  createHumanMemoryStore,
  entryFromBanner,
  // Phase 4 — reality loop
  createEngagementStore,
  createAftertasteStore,
  predictAftertaste,
  detectDrift,
  analyzeAtmosphere,
} from '@lib/index';
import type { BannerFootprint } from '@lib/atmosphereConsistency';

export interface RunOptions {
  onEvent?: (event: PipelineEvent) => void;
  /** Override the meta-critic brutality for this run. 0..1. */
  brutality?: number;
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

  // Phase 2 raises the default attempts ceiling — the meta-critic is
  // brutal, so the pipeline needs more room to converge.
  const maxAttempts = Math.max(1, Math.min(request.maxAttempts ?? 3, 5));
  let attempt = 0;
  const rejectedAttempts: Banner['rejectedAttempts'] = [];

  let stateSeed = Date.now();
  let forceStateId: string | undefined = request.forceStateId;

  // Phase 2.5 — compute the campaign-director directive once per run
  // from the memory snapshot at run start. The Creative Director reads
  // it on every attempt below.
  const evolutionAtRunStart = evolveCampaign(memory);
  emit({
    stage: 'campaign-evolution',
    message: `directive: ${evolutionAtRunStart.move} — ${evolutionAtRunStart.narrative}`,
    data: evolutionAtRunStart,
  });

  // Phase 2.5 — references load once (cached on globalThis after).
  const references = await loadReferences();
  emit({ stage: 'references', message: `loaded ${references.length} reference analyses` });

  // ─── Phase 3 — campaign brain pre-generation decisions ────────
  const jobDecision = decideAssetJob({ memory, campaignMode: ctx.campaignMode, seed: stateSeed });
  emit({
    stage: 'campaign-decision',
    message: `asset job: "${jobDecision.job}" — ${jobDecision.rationale}`,
    data: jobDecision,
  });

  const rhythmReport = analyzeRhythm(memory);
  emit({
    stage: 'campaign-rhythm',
    message: `health ${rhythmReport.healthScore.toFixed(1)}/10 · imbalanced axis: ${rhythmReport.mostImbalanced ?? 'none'}`,
    data: rhythmReport,
  });

  const humanMemoryStore = createHumanMemoryStore();
  const emotionalTrail = await humanMemoryStore.read();
  emit({ stage: 'human-memory', message: `${emotionalTrail.length} prior emotional traces` });

  // ─── Phase 4 — reality loop: drift + atmosphere readings ──────
  const engagementStore = createEngagementStore();
  const aftertasteStore = createAftertasteStore();
  const allEngagements = await engagementStore.list();
  // Join the engagement records with the emotional trace's banner facts
  // — those carry the typography dominance / layout / product role /
  // DNA fragments the drift detector needs.
  const bannerFacts = emotionalTrail
    .filter((e) => !!e.facts)
    .map((e) => ({
      bannerId: e.bannerId,
      typographyDominance: e.facts!.typographyDominance as any,
      layoutFamily: e.facts!.layoutFamily as any,
      productRole: e.facts!.productRole as any,
      documentary_weight: e.facts!.documentary_weight,
      realism_type: e.facts!.realism_type,
      silence_ratio: e.facts!.silence_ratio,
      shippedAt: e.createdAt,
    }));
  const driftReport = detectDrift({ engagements: allEngagements, bannerFacts });
  emit({
    stage: 'taste-drift',
    message: driftReport.active.length === 0
      ? 'no drift yet — audience signal too thin'
      : `${driftReport.active.length} drift signals active; guard ${driftReport.diversityGuardEngaged ? 'ENGAGED' : 'idle'}`,
    data: driftReport,
  });

  while (attempt < maxAttempts) {
    attempt += 1;

    const state: HumanState = selectHumanState({ ctx, memory, forceStateId, seed: stateSeed });
    const truth = await buildHumanTruth({ ctx, state });

    // ─── Per-attempt campaign-brain decisions ────────────────────
    const culturalMoment = selectCulturalMoment({ state, memory, seed: stateSeed + attempt });
    emit({
      stage: 'cultural-intelligence',
      message: `moment: "${culturalMoment.id}" — ${culturalMoment.reading}`,
      data: { forbidden: culturalMoment.forbiddenPatterns },
    });

    const courage = decideCourage({ state, job: jobDecision.job, culturalMoment: culturalMoment.id, memory, seed: stateSeed + attempt });
    emit({
      stage: 'visual-courage',
      message: `${courage.level} — ${courage.reason}`,
      data: courage.overrides,
    });

    const direction = await direct({
      ctx, truth, campaignMode: ctx.campaignMode, memory,
      evolution: evolutionAtRunStart,
      job: jobDecision,
      courage,
      rhythm: rhythmReport,
      culturalMoment,
    });
    const composition = planComposition({ ctx, direction });
    decideProductIntegration({ ctx, direction });

    // Image-level inner loop (max 2 image regens before bumping to concept).
    let imageAttempts = 0;
    while (true) {
      imageAttempts += 1;
      const { brief, image } = await generateImage({ ctx, truth, direction, composition });

      const typography = await buildTypography({ ctx, truth, direction });
      const cta = buildCTA({ ctx, direction, composition, seed: stateSeed + imageAttempts });

      // ─── Critic stack ──────────────────────────────────────────
      const scrollStop = await critique({
        ctx, truth, direction, composition,
        imageBrief: brief, image, typography, cta,
      });

      const reference = matchReference({ ctx, truth, direction, composition, typography });
      const taste = await tasteCritique({ ctx, truth, direction, composition, typography, image });
      const psychology = analyzeVisualPsychology({ ctx, direction, composition, typography });
      const productPresence = analyzeProductPresence({ ctx, truth, direction, composition, brief, image });

      // ─── Phase 2.5 — explicit taste system ────────────────────
      const dna = extractDNA({ direction, composition, typography, truth, brief, imageProvider: image.provider });
      const judge = judgeTaste({ truth, direction, composition, typography, image, bannerDNA: dna, references });
      emit({
        stage: 'taste-judge',
        message: `verdict: ${judge.verdict} · composite ${judge.composite.toFixed(1)} · nearest "${judge.closestCategory ?? 'none'}" (${judge.closestDistance.toFixed(2)})`,
        data: { rewards: judge.rewards, punishments: judge.punishments },
      });
      const reaction = simulateHumanReaction({ truth, direction, bannerDNA: dna, taste: judge });
      emit({
        stage: 'human-reaction',
        message: `${reaction.at_0_3s} → ${reaction.at_1s} → ${reaction.at_3s} (engagement ${reaction.engagementQuality.toFixed(1)})`,
        data: { arc: reaction.arc, scrollPast: reaction.scrollPast },
      });
      const fatigue = detectFatigue({
        banner: { direction, state, typography, hook: direction.hook },
        memory,
      });
      emit({
        stage: 'visual-fatigue',
        message: `${fatigue.verdict} · totals ${fatigue.totals.toFixed(1)}`,
        data: { flags: fatigue.flags, scores: fatigue.scores },
      });

      // ─── Phase 3 — anti-AI scan + rhythm-worsen check ────────
      const antiAI = scanAntiAI({ direction, typography, bannerDNA: dna, truth, memory, imageProvider: image.provider });
      emit({
        stage: 'anti-ai',
        message: `smell ${antiAI.smell.toFixed(1)} · signatures [${antiAI.signatures.join(', ') || 'none'}] · drift [${antiAI.driftSignatures.join(', ') || 'none'}]`,
        data: { notes: antiAI.notes, pushAwayFrom: antiAI.pushAwayFrom },
      });

      const rhythmWorsen = bannerWouldWorsenRhythm(rhythmReport, { direction, job: jobDecision.job });
      if (rhythmWorsen.worsens) {
        emit({
          stage: 'campaign-rhythm',
          message: `would worsen rhythm: ${rhythmWorsen.reason}`,
          data: rhythmWorsen,
        });
      }

      // ─── Phase 4 — aftertaste prediction + atmosphere snapshot
      // computed pre-verdict so the meta-critic can gate on them. ──
      const tentativeAftertaste = predictAftertaste({
        bannerId,
        shippedAt: Date.now(),
        engagement: null,
        bannerDNA: dna,
        predictedReactionAt3s: reaction.at_3s,
        tensionPhrase: truth.tension,
        truthLength: truth.truth.length,
      });
      const tentativeFootprint: BannerFootprint = {
        bannerId,
        dna,
        job: jobDecision.job,
        family: state.family,
        truth: truth.truth,
        tension: truth.tension,
      };
      const priorFootprints: BannerFootprint[] = emotionalTrail.slice(0, 19).map((e) => ({
        bannerId: e.bannerId,
        dna: dnaFromFacts(e.facts),
        job: e.job ?? 'sell',
        family: e.family,
        truth: e.truth,
        tension: e.tension,
      }));
      const tentativeAtmosphere = analyzeAtmosphere([tentativeFootprint, ...priorFootprints]);
      emit({
        stage: 'aftertaste',
        message: `predicted ${tentativeAftertaste.residueStrength.toFixed(1)}/10 · spike-vs-residue ${tentativeAftertaste.spikeVsResidueRatio.toFixed(2)}`,
        data: tentativeAftertaste,
      });
      emit({
        stage: 'atmosphere',
        message: `consistency ${tentativeAtmosphere.consistency.toFixed(1)}/10 · uniformity penalty ${tentativeAtmosphere.uniformityPenalty.toFixed(1)}`,
        data: tentativeAtmosphere,
      });
      // ───────────────────────────────────────────────────────────

      const finalVerdict = decideFinalVerdict({
        ctx,
        scrollStop,
        taste,
        psychology,
        productPresence,
        reference,
        memory,
        brutality: opts.brutality,
        judge,
        reaction,
        fatigue,
        antiAI,
        rhythmWorsen,
        job: jobDecision,
        direction,
        aftertastePrediction: tentativeAftertaste,
        atmosphere: tentativeAtmosphere,
        drift: driftReport,
      });
      // ───────────────────────────────────────────────────────────

      if (finalVerdict.verdict === 'approve') {
        const shippedAt = Date.now();
        // Phase 4 — the aftertaste + atmosphere already computed
        // pre-verdict. Persist them.
        const aftertastePrediction = { ...tentativeAftertaste, shippedAt };
        await aftertasteStore.upsert(aftertastePrediction);
        const atmosphere = tentativeAtmosphere;

        const partial: Omit<Banner, 'memorySnapshot'> = {
          id: bannerId,
          createdAt: shippedAt,
          formula: ctx.formula,
          campaignMode: ctx.campaignMode,
          state, truth, direction, composition,
          imageBrief: brief, image, typography, cta,
          critique: scrollStop,
          taste, psychology, productPresence, referenceMatch: reference, finalVerdict,
          tasteSystem: {
            dna, judge, reaction, fatigue, evolutionAtRunStart,
            campaignBrain: {
              job: jobDecision,
              culturalMoment,
              courage,
              rhythm: rhythmReport,
              antiAI,
              residue: '', // filled by entryFromBanner below
            },
            realityLoop: {
              aftertastePrediction,
              drift: driftReport,
              atmosphere,
            },
          },
          attempts: attempt,
          rejectedAttempts,
        };

        // Persist emotional trace + main memory in parallel.
        const provisional: Banner = { ...partial, memorySnapshot: memory };
        const traceEntry = entryFromBanner(provisional, jobDecision.job, culturalMoment.id);
        partial.tasteSystem.campaignBrain.residue = traceEntry.residue;
        await humanMemoryStore.record(traceEntry);

        const memorySnapshot = await memoryStore.record(provisional);
        const banner: Banner = { ...partial, memorySnapshot };

        emit({
          stage: 'human-memory',
          message: `residue: ${traceEntry.residue}`,
          data: { traceEntry },
        });
        emit({ stage: 'pipeline', message: 'banner approved', data: { attempt, imageAttempts, totals: finalVerdict.totals } });
        return { banner, events };
      }

      // Rejection routing.
      if (finalVerdict.verdict === 'reject-image' && imageAttempts < 2) {
        rejectedAttempts.push({ stage: 'image', reason: finalVerdict.reasons.join('; ') });
        emit({ stage: 'rejection', message: 'regenerating image', data: { reasons: finalVerdict.reasons } });
        continue; // inner loop
      }

      rejectedAttempts.push({
        stage: finalVerdict.verdict === 'reject-image' ? 'image-exhausted' : finalVerdict.verdict,
        reason: finalVerdict.reasons.join('; '),
      });
      emit({ stage: 'rejection', message: `regenerating concept (${finalVerdict.verdict})`, data: { reasons: finalVerdict.reasons } });
      stateSeed += 7919;
      forceStateId = undefined;
      memory = await memoryStore.read();
      break; // exit inner loop, next outer attempt
    }
  }

  throw new ExhaustedAttempts(
    maxAttempts,
    rejectedAttempts.slice(-3).map((r) => `${r.stage}: ${r.reason}`),
  );
}

/**
 * Neutral DNA — used when the atmosphere analyser needs to score voice
 * + job mix across banners whose DNA was not persisted (older runs).
 * Every axis at 0.5 contributes nothing to spread, so older banners
 * effectively count only toward voice and job-mix consistency.
 */
const NEUTRAL_DNA: import('@lib/referenceDNA').ReferenceDNA = {
  silence_ratio: 0.5,
  tension_map: 0.5,
  framing_behavior: 0.5,
  typography_confidence: 0.5,
  negative_space_usage: 0.5,
  emotional_density: 0.5,
  product_aggression_level: 0.5,
  interruption_style: 0.5,
  realism_type: 0.5,
  visual_temperature: 0.5,
  camera_energy: 0.5,
  editorial_level: 0.5,
  fashion_influence: 0.5,
  documentary_weight: 0.5,
  luxury_restraint: 0.5,
  anti_commercial_feel: 0.5,
};

/**
 * Build a partial DNA from the emotional trace's stored facts. The
 * trail persists 3 axes (silence_ratio, documentary_weight,
 * realism_type) directly; the rest are filled with neutral midpoints,
 * which means atmosphere spread reads honestly on the 3 stored axes
 * and ignores the others.
 */
function dnaFromFacts(facts: { silence_ratio: number; documentary_weight: number; realism_type: number } | undefined) {
  if (!facts) return NEUTRAL_DNA;
  return {
    ...NEUTRAL_DNA,
    silence_ratio: facts.silence_ratio,
    documentary_weight: facts.documentary_weight,
    realism_type: facts.realism_type,
  };
}
