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
  // Phase 5 — perceptual foundation
  coresForState,
  momentsForCore,
  scoreVisualTaste,
  planVisualBehavior,
  predictEmotionalAftertaste,
  synthesiseCampaignMemoryV2,
  // Phase 7 — human perception + world continuity
  selectAtmosphericLight,
  planTypographyPsychology,
  applyTypographyPsychology,
  planWorldContinuity,
  planMicroHumanDetails,
  buildInvisibleStory,
  decideHumanInterruption,
  createObjectEmotionStore,
  extractObjectsFromBrief,
  synthesiseCampaignIdentity,
  critiquePerception,
  // Phase 8 — visual composition intelligence
  analyzeVisualGravity,
  analyzeNegativeSpace,
  analyzeCompositionRhythm,
  decideProductPresence,
  planHumanFraming,
  directLayout,
  // Phase 9 — temporal campaign cinema
  buildCampaignTimeline,
  judgeSequence,
  analyzeWorldPersistence,
  buildObjectMemoryGraph,
  analyzeSceneContinuity,
  analyzeVisualTempo,
  tempoWouldWorsen,
  decideAbsence,
  readEmotionalContradiction,
  // Phase 10 — unified cinematic brain
  analyzeUnresolvedEmotion,
  scoreEmotionalCompression,
  analyzeSubconsciousRecognition,
  detectSyntheticBehavior,
  decideCinematicVerdict,
  // Phase 11 — natural human chaos
  planLifeNoise,
  readHumanContradiction,
  readNonPerformativeReality,
  // Phase 12 — cultural memory engine
  matchSharedCulturalPattern,
  readCollectiveRecognition,
  selectUnspokenRitual,
  detectCulturalDrift,
  // Phase 13 — reality pressure
  readRealityPressure,
  readConsequence,
  readInvisibleStakes,
  readFunctionalCollapse,
} from '@lib/index';
import type { BannerFootprint } from '@lib/atmosphereConsistency';
import type { EmotionalCore } from '@lib/humanTruthEngine';
import type { CulturalMicroMoment } from '@lib/culturalMemory';

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
  const priorAftertaste = await aftertasteStore.read();
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

  // ─── Phase 5 — campaign memory v2 synthesised once per run ────
  const campaignMemoryV2 = synthesiseCampaignMemoryV2({
    trail: emotionalTrail,
    aftertaste: priorAftertaste,
    rhythm: rhythmReport,
  });

  // ─── Phase 7 — load object motifs + synthesise campaign identity
  const objectEmotionStore = createObjectEmotionStore();
  const motifs = await objectEmotionStore.list();
  const campaignIdentity = synthesiseCampaignIdentity({
    trail: emotionalTrail,
    campaignMemoryV2,
    motifs,
  });
  emit({
    stage: 'campaign-identity',
    message: campaignIdentity.directorNote,
    data: { recognisability: campaignIdentity.recognisability, motifs: campaignIdentity.objectMotifs.slice(0, 3) },
  });

  // ─── Phase 9 — campaign timeline + world DNA + object graph + tempo
  const campaignTimeline = buildCampaignTimeline(emotionalTrail);
  emit({ stage: 'campaign-timeline', message: campaignTimeline.directorRead });

  // Build per-banner light history from the trail's facts (none persisted
  // directly; we derive a stand-in by mapping the family to a typical
  // light family using the same heuristics atmosphericLight uses).
  const recentLightBehaviors = emotionalTrail.slice(0, 8).map((t) => ({
    behavior: inferLightBehaviorFromTrail(t),
    ts: t.createdAt,
  }));
  const worldPersistence = analyzeWorldPersistence({
    trail: emotionalTrail,
    recentLightBehaviors,
    motifs,
  });
  emit({
    stage: 'world-persistence',
    message: worldPersistence.worldFeelsLivedIn
      ? `world lived in: ${worldPersistence.dna_signature.objectScars.slice(0, 3).map((o) => o.objectId).join(', ')}`
      : 'world still forming',
    data: { evolve: worldPersistence.whatShouldEvolve, stay: worldPersistence.whatShouldStay },
  });

  const objectMemoryGraph = buildObjectMemoryGraph({ trail: emotionalTrail, motifs });
  if (objectMemoryGraph.loudest) {
    emit({
      stage: 'object-memory-graph',
      message: `loudest object: "${objectMemoryGraph.loudest.objectId}" (weight ${objectMemoryGraph.loudest.emotionalWeight.toFixed(1)})`,
    });
  }

  const visualTempo = analyzeVisualTempo({ trail: emotionalTrail });
  emit({
    stage: 'visual-tempo',
    message: visualTempo.needs_breath_next ? 'needs breath next' : 'tempo healthy',
    data: visualTempo.axes,
  });

  // ─── Phase 10 — unified cinematic brain (campaign-level signals)
  const unresolvedReport = analyzeUnresolvedEmotion({
    trail: emotionalTrail,
    timeline: campaignTimeline,
  });
  emit({
    stage: 'unresolved-emotion',
    message: unresolvedReport.unfinished_sentence,
    data: { signals: unresolvedReport.signals.length, most_active: unresolvedReport.most_active?.kind },
  });

  const subconsciousRecognition = analyzeSubconsciousRecognition({
    trail: emotionalTrail,
    worldDNA: worldPersistence.dna_signature,
    objectGraph: objectMemoryGraph,
    timeline: campaignTimeline,
  });
  emit({
    stage: 'subconscious-recognition',
    message: subconsciousRecognition.recognisable_without_logo
      ? `recognisable without a logo — ${subconsciousRecognition.recognition_score.toFixed(1)}/10`
      : `forming recognition — ${subconsciousRecognition.recognition_score.toFixed(1)}/10`,
    data: { patterns: subconsciousRecognition.patterns.length, missing: subconsciousRecognition.missing_signatures },
  });
  emit({
    stage: 'campaign-memory-v2',
    message: campaignMemoryV2.directorNote,
    data: {
      coresCovered: campaignMemoryV2.coresCovered.slice(0, 3),
      coresMissing: campaignMemoryV2.coresMissing.length,
      saturation: campaignMemoryV2.saturationScore,
      atmosphereAtRisk: campaignMemoryV2.atmosphereAtRisk,
    },
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

      // ─── Phase 5 — perceptual layer ───────────────────────────
      const cores = coresForState(state.id);
      const emotionalCore: EmotionalCore | null = cores[0] ?? null;
      const candidateMoments = emotionalCore ? momentsForCore(emotionalCore.id) : [];
      const culturalMicroMoment: CulturalMicroMoment | null =
        candidateMoments[(stateSeed + attempt) % Math.max(candidateMoments.length, 1)] ?? null;
      emit({
        stage: 'emotional-core',
        message: emotionalCore ? `core: ${emotionalCore.id} — "${emotionalCore.silent_sentence}"` : 'no emotional core mapped',
      });
      if (culturalMicroMoment) {
        emit({
          stage: 'cultural-micro-moment',
          message: `moment: ${culturalMicroMoment.state_id} — ${culturalMicroMoment.environment}`,
        });
      }

      const imperfectionPlan = planVisualBehavior({
        formula: ctx.formula,
        plan: composition,
        direction,
        state,
        emotionalCore,
        seed: stateSeed + attempt,
      });
      emit({
        stage: 'human-visual-behavior',
        message: `${imperfectionPlan.behaviors.join(', ')} — ${imperfectionPlan.motivation}`,
      });

      const visualTaste = scoreVisualTaste({
        direction, typography, bannerDNA: dna,
        truth: { truth: truth.truth, tension: truth.tension },
        timeAnchor: state.timeAnchor,
        imageProvider: image.provider,
        emotionalCore,
        referenceCloseness: reference.closeness,
        atmosphereConsistency: null, // computed alongside aftertaste below
      });
      emit({
        stage: 'visual-taste',
        message: `score ${visualTaste.score.toFixed(1)}/10 · AI prob ${(visualTaste.ai_detection_probability * 100).toFixed(0)}% · ${visualTaste.rejection_reason ?? 'cleared'}`,
        data: { forbidden: visualTaste.forbiddenPatternsHit.map((p) => p.id) },
      });

      const emotionalAftertaste = predictEmotionalAftertaste({
        bannerDNA: dna,
        reactionAt3s: reaction.at_3s,
        tensionPhrase: truth.tension,
        truthText: truth.truth,
        emotionalCore,
      });
      emit({
        stage: 'emotional-aftertaste',
        message: `composite ${emotionalAftertaste.composite.toFixed(1)} — ${emotionalAftertaste.post_view_emotional_state}`,
      });

      // ─── Phase 7 — perception + world continuity layer ───────
      const atmosphericLight = selectAtmosphericLight({
        state, emotionalCore,
        microMomentId: culturalMicroMoment?.state_id ?? null,
      });
      emit({ stage: 'atmospheric-light', message: `${atmosphericLight.behavior} — ${atmosphericLight.psychological_meaning}` });

      const worldContinuity = planWorldContinuity({
        state, emotionalCore,
        microMoment: culturalMicroMoment,
        seed: stateSeed + attempt,
      });
      emit({
        stage: 'world-continuity',
        message: `${worldContinuity.artifacts.length} artifacts: ${worldContinuity.artifacts.map((a) => a.id).join(', ')}`,
      });

      const microHumanDetails = planMicroHumanDetails({
        state, emotionalCore,
        seed: stateSeed + attempt,
      });
      emit({ stage: 'micro-human-details', message: microHumanDetails.details.join(', ') });

      const invisibleStory = buildInvisibleStory({
        state, emotionalCore,
        microMoment: culturalMicroMoment,
      });
      emit({ stage: 'invisible-story', message: `before: ${invisibleStory.ten_minutes_before.slice(0, 70)}…` });

      const humanInterruption = decideHumanInterruption({
        job: jobDecision.job,
        emotionalCore,
        direction,
      });
      emit({
        stage: 'human-interruption',
        message: `${humanInterruption.intensity} (vis ${humanInterruption.visibility}/10) — ${humanInterruption.reasoning}`,
      });

      const typographyPsychology = planTypographyPsychology({
        state, emotionalCore, direction, typography, composition,
      });
      emit({
        stage: 'typography-psychology',
        message: `${typographyPsychology.posture} — ${typographyPsychology.psychological_meaning}`,
      });

      const perceptionCriticVerdict = critiquePerception({
        truth, direction, typography, bannerDNA: dna,
        emotionalCore, emotionalAftertaste,
        visualTaste, tasteJudge: judge,
        worldContinuity, microDetails: microHumanDetails, invisibleStory,
        hasCulturalGrounding: !!culturalMicroMoment,
      });
      emit({
        stage: 'perception-critic',
        message: `${perceptionCriticVerdict.verdict} — silent-recognition ${perceptionCriticVerdict.silent_emotional_recognition.toFixed(1)}/10` + (perceptionCriticVerdict.rejection_reason ? ` — ${perceptionCriticVerdict.rejection_reason}` : ''),
        data: { notes: perceptionCriticVerdict.notes },
      });

      // ─── Phase 8 — visual composition intelligence ─────────────
      const gravity = analyzeVisualGravity({ direction, composition, typography });
      emit({
        stage: 'visual-gravity',
        message: `composite ${gravity.composite.toFixed(1)} · focal-dominance ${gravity.focal_dominance.toFixed(1)} · competing ${gravity.competing_anchors.toFixed(1)}` + (gravity.rejection_reason ? ` — ${gravity.rejection_reason}` : ''),
      });

      const negativeSpace = analyzeNegativeSpace({ formula: ctx.formula, direction, composition });
      emit({
        stage: 'negative-space',
        message: `${negativeSpace.prescribed_behavior} · tension ${negativeSpace.space_tension_score.toFixed(1)}/10` + (negativeSpace.rejection_reason ? ` — ${negativeSpace.rejection_reason}` : ''),
      });

      const compositionRhythm8 = analyzeCompositionRhythm({
        trail: emotionalTrail,
        memory,
        candidate: {
          layoutFamily: direction.layoutFamily,
          focalPoint: direction.focalPoint,
          productRole: direction.productRole,
          typographyDominance: direction.typographyDominance,
          negativeSpaceBias: composition.negativeSpaceBias,
        },
      });
      emit({
        stage: 'composition-rhythm',
        message: compositionRhythm8.would_repeat
          ? `would repeat: ${compositionRhythm8.repeated_pattern} — suggested: ${compositionRhythm8.suggested_correction ?? '—'}`
          : 'spatial rhythm healthy',
      });

      const productMotifs = await objectEmotionStore.list();
      const rhythmSaysReduceProduct = !!rhythmReport.axes.find(
        (a) => a.axis === 'product-vs-no-product' && a.bias > 0.4,
      );
      const productPresence8 = decideProductPresence({
        emotionalCore,
        job: jobDecision.job,
        direction,
        interruption: humanInterruption,
        motifs: productMotifs,
        rhythmSaysReduceProduct,
        campaignBannerIndex: emotionalTrail.length,
      });
      emit({
        stage: 'product-presence-v2',
        message: `mode: ${productPresence8.mode} — ${productPresence8.reasoning}`,
      });

      const framing8 = planHumanFraming({
        direction,
        emotionalCore,
        restraint: direction.restraint,
        seed: stateSeed + attempt,
      });
      emit({
        stage: 'human-framing',
        message: `${framing8.camera_distance} · ${framing8.behaviors.join(', ')}`,
      });

      const directorVerdict = directLayout({
        formula: ctx.formula,
        direction, composition, emotionalCore,
        gravity, negativeSpace, rhythm: compositionRhythm8,
        presence: productPresence8, framing: framing8,
        campaignIdentity, recentAftertaste: priorAftertaste,
      });
      emit({
        stage: 'layout-director',
        message: directorVerdict.director_note,
        data: {
          archetype: directorVerdict.composition_archetype,
          would_subtract: directorVerdict.would_improve_with_subtraction,
          subtract_target: directorVerdict.subtraction_target,
          rejections: directorVerdict.rejection_conditions,
        },
      });

      // ─── Phase 9 — temporal cognition per candidate banner ─────
      const candidateNote = inferCandidateNote(reaction.at_3s, state.family);
      const sequenceVerdict = judgeSequence({
        timeline: campaignTimeline,
        candidate_note: candidateNote,
      });
      emit({
        stage: 'emotional-sequence',
        message: sequenceVerdict.redundant_with_previous
          ? `REDUNDANT — candidate "${candidateNote}" repeats previous`
          : sequenceVerdict.advances_arc
            ? `advances arc → "${candidateNote}"`
            : `flat — "${candidateNote}" does not advance the arc`,
      });

      const candidateApartmentKind = culturalMicroMoment?.state_id
        ? APARTMENT_KIND_MAP[culturalMicroMoment.state_id] ?? null
        : null;
      const sceneContinuityReport = analyzeSceneContinuity({
        trail: emotionalTrail,
        worldDNA: worldPersistence.dna_signature,
        objectGraph: objectMemoryGraph,
        candidate: {
          apartmentKind: candidateApartmentKind,
          lightBehavior: atmosphericLight.behavior,
          family: state.family,
          objectIds: extractObjectsFromBrief(brief.scene, worldContinuity.artifacts.map((a) => a.description)),
          isQuiet: direction.typographyDominance === 'whisper' || direction.typographyDominance === 'absent',
        },
        bannerIndex: emotionalTrail.length,
      });
      emit({
        stage: 'scene-continuity',
        message: sceneContinuityReport.invisible_context.slice(0, 120),
      });

      const tempoWorsen = tempoWouldWorsen(visualTempo, {
        typographyDominance: direction.typographyDominance,
        productRole: direction.productRole,
        restraint: direction.restraint,
      });
      if (tempoWorsen.worsens) {
        emit({ stage: 'visual-tempo', message: `would worsen ${tempoWorsen.axis} — ${tempoWorsen.reason}` });
      }

      const absenceDecision = decideAbsence({
        emotionalCore,
        microMoment: culturalMicroMoment,
        tempo: visualTempo,
        timeline: campaignTimeline,
        bannerIndex: emotionalTrail.length,
        jobId: jobDecision.job,
      });
      emit({
        stage: 'absence-intelligence',
        message: `curiosity ${absenceDecision.curiosity_score.toFixed(1)}/10 — ${absenceDecision.reasoning[0] ?? '—'}`,
        data: { drop_copy: absenceDecision.drop_copy, drop_cta: absenceDecision.drop_cta, drop_product: absenceDecision.drop_product },
      });

      const contradictionReading = readEmotionalContradiction({ truth, emotionalCore });
      emit({
        stage: 'emotional-contradiction',
        message: contradictionReading.the_contradiction
          ? `"${contradictionReading.the_contradiction.name}" — depth ${contradictionReading.depth.toFixed(1)}/10`
          : 'no named contradiction',
      });

      // ─── Phase 10 — per-banner cinematic signals ──────────────
      const compressionReading = scoreEmotionalCompression({
        truth, direction, typography, emotionalCore,
        worldContinuity,
      });
      emit({
        stage: 'emotional-compression',
        message: `score ${compressionReading.score.toFixed(1)}/10 · ratio ${compressionReading.compression_ratio.toFixed(2)} · implied ${compressionReading.implied_emotions.length} / shown ${compressionReading.shown_emotions.length}`,
      });

      const syntheticReading = detectSyntheticBehavior({
        direction, composition, typography, dna,
        framing: framing8, worldContinuity, gravity,
        truthLength: truth.truth.length,
      });
      emit({
        stage: 'anti-synthetic',
        message: syntheticReading.reads_as_designed
          ? `reads as designed — ${syntheticReading.signatures.join(', ')}`
          : `observed (${syntheticReading.rewards.length} imperfection signals)`,
        data: { score: syntheticReading.synthetic_score, signatures: syntheticReading.signatures },
      });

      const cinematicVerdict = decideCinematicVerdict({
        trail: emotionalTrail,
        timeline: campaignTimeline,
        unresolved: unresolvedReport,
        worldDNA: worldPersistence.dna_signature,
        objectGraph: objectMemoryGraph,
        campaignIdentity,
        subconsciousRecognition,
        tempo: visualTempo,
        candidateAftertaste: emotionalAftertaste,
        candidateContradiction: contradictionReading,
        candidateCompression: compressionReading,
        candidateSynthetic: syntheticReading,
        candidateNote,
      });
      emit({
        stage: 'cinematic-brain',
        message: cinematicVerdict.director_voice,
        data: {
          thesis: cinematicVerdict.campaign_emotional_thesis,
          trajectory: cinematicVerdict.emotional_trajectory,
          three_second_pass: cinematicVerdict.three_second_test.passes,
          aligned: cinematicVerdict.candidate_alignment.serves_thesis,
        },
      });

      // ─── Phase 11 — natural human chaos ───────────────────────
      const lifeNoise = planLifeNoise({ state, seed: stateSeed + attempt });
      emit({
        stage: 'life-noise',
        message: `${lifeNoise.fragments.length} non-symbolic fragments · mess ${lifeNoise.mess_score.toFixed(1)}/10`,
      });

      const humanContradiction = readHumanContradiction({
        state, emotionalCore, truthText: truth.truth,
      });
      emit({
        stage: 'human-contradiction',
        message: humanContradiction.pair
          ? `${humanContradiction.pair.feeling} → ${humanContradiction.pair.behavior} (recognition ${humanContradiction.recognition_score.toFixed(1)}/10)`
          : 'no behavioral contradiction mapped',
      });

      const nonPerformative = readNonPerformativeReality({
        direction, typography, dna,
        atmosphericLight,
        aftertaste: emotionalAftertaste,
        contradiction: humanContradiction,
        truthText: truth.truth,
        poeticOverloadHint: syntheticReading.synthetic_score,
      });
      emit({
        stage: 'non-performative-reality',
        message: nonPerformative.trying_to_simulate
          ? `WARNING simulating depth — ${nonPerformative.patterns.join(', ')}`
          : nonPerformative.feels_like_happened
            ? 'feels like a moment that happened'
            : `mild performance risk (${nonPerformative.performativeness_score.toFixed(1)}/10)`,
        data: { rewards: nonPerformative.rewards },
      });

      // ─── Phase 12 — cultural memory engine ────────────────────
      const sharedPatternMatch = matchSharedCulturalPattern({ state, emotionalCore });
      emit({
        stage: 'shared-cultural-pattern',
        message: sharedPatternMatch.pattern
          ? `pattern: "${sharedPatternMatch.pattern.named_tension}" (strength ${sharedPatternMatch.strength})`
          : 'no shared cultural pattern matched',
      });
      const collectiveRecognition = readCollectiveRecognition({
        truth, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        pattern_strength: sharedPatternMatch.strength,
      });
      emit({
        stage: 'collective-recognition',
        message: collectiveRecognition.is_collective
          ? `collective — recognition ${collectiveRecognition.recognition_score.toFixed(1)}/10`
          : collectiveRecognition.is_individual_only
            ? `reads as one specific person — ${collectiveRecognition.recognition_score.toFixed(1)}/10`
            : `forming recognition (${collectiveRecognition.recognition_score.toFixed(1)}/10)`,
      });
      const unspokenRitualPick = selectUnspokenRitual({
        state, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        seed: stateSeed + attempt,
      });
      if (unspokenRitualPick.ritual) {
        emit({
          stage: 'unspoken-ritual',
          message: `${unspokenRitualPick.ritual.id} — ${unspokenRitualPick.ritual.observable_action}`,
        });
      }
      const culturalDriftReading = detectCulturalDrift({
        direction,
        emotionalCore,
        pattern: sharedPatternMatch.pattern,
        atmosphericLight,
        truthText: truth.truth,
      });
      emit({
        stage: 'cultural-drift',
        message: culturalDriftReading.feels_culturally_consumed
          ? `culturally consumed: ${culturalDriftReading.detected_cliches.join(', ')}`
          : `no drift — saturation ${culturalDriftReading.saturation_score.toFixed(1)}/10`,
      });

      // ─── Phase 13 — reality pressure ──────────────────────────
      const realityPressureReading = readRealityPressure({
        truth, state, emotionalCore,
      });
      emit({
        stage: 'reality-pressure',
        message: `specificity ${realityPressureReading.pressure_specificity.toFixed(1)}/10 · signals: ${realityPressureReading.signals.map((s) => s.type).join(', ') || 'none'}` + (realityPressureReading.reads_generic ? ' · GENERIC' : ''),
      });
      const consequenceReading = readConsequence({
        truth, state, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        pressure: realityPressureReading,
      });
      emit({
        stage: 'consequence',
        message: consequenceReading.has_stakes
          ? `stakes ${consequenceReading.stakes_clarity.toFixed(1)}/10 — "${consequenceReading.stakes_phrase.slice(0, 100)}…"`
          : `decorative emotion — no stakes`,
      });
      const invisibleStakesReading = readInvisibleStakes({
        state, emotionalCore,
        pattern: sharedPatternMatch.pattern,
        ritual: unspokenRitualPick.ritual,
      });
      emit({
        stage: 'invisible-stakes',
        message: invisibleStakesReading.compulsion
          ? `${invisibleStakesReading.compulsion.id} — "${invisibleStakesReading.compulsion.daily_cost.slice(0, 80)}"`
          : 'no modern compulsion mapped',
      });
      const functionalCollapseReading = readFunctionalCollapse({
        state, truth, direction, emotionalCore, atmosphericLight,
      });
      emit({
        stage: 'functional-collapse',
        message: `${functionalCollapseReading.type} (functional ${functionalCollapseReading.functional_collapse_score.toFixed(1)}, accidentally-true ${functionalCollapseReading.accidentally_true_score.toFixed(1)}) — ${functionalCollapseReading.directorNote}`,
      });
      // ───────────────────────────────────────────────────────────

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
        // Phase 5
        visualTaste,
        emotionalAftertaste,
        campaignMemoryV2,
        // Phase 7
        perceptionCriticVerdict,
        campaignIdentity,
        // Phase 8
        gravity,
        negativeSpace,
        compositionRhythm8,
        productPresence8,
        framing8,
        directorVerdict,
        // Phase 9
        sequenceVerdict,
        tempoWorsen,
        absenceDecision,
        contradictionReading,
        objectMemoryGraph,
        // Phase 10
        compressionReading,
        syntheticReading,
        cinematicVerdict,
        // Phase 11
        humanContradiction,
        nonPerformative,
        lifeNoise,
        // Phase 12
        sharedPattern: sharedPatternMatch.pattern,
        collectiveRecognition,
        unspokenRitualPick,
        culturalDriftReading,
        // Phase 13
        realityPressureReading,
        consequenceReading,
        invisibleStakesReading,
        functionalCollapseReading,
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
            perception: {
              emotionalCore,
              culturalMicroMoment,
              visualTaste,
              imperfection: imperfectionPlan,
              emotionalAftertaste,
              campaignMemoryV2,
            },
            perceptionV2: {
              atmosphericLight,
              typographyPsychology,
              worldContinuity,
              microHumanDetails,
              invisibleStory,
              humanInterruption,
              campaignIdentity,
              perceptionCritic: perceptionCriticVerdict,
            },
            composition8: {
              gravity,
              negativeSpace,
              rhythm: compositionRhythm8,
              presence: productPresence8,
              framing: framing8,
              director: directorVerdict,
            },
            temporal: {
              timeline: campaignTimeline,
              sequence: sequenceVerdict,
              worldPersistence,
              objectGraph: objectMemoryGraph,
              sceneContinuity: sceneContinuityReport,
              visualTempo,
              absence: absenceDecision,
              contradiction: contradictionReading,
            },
            cinematic: {
              unresolved: unresolvedReport,
              compression: compressionReading,
              recognition: subconsciousRecognition,
              synthetic: syntheticReading,
              verdict: cinematicVerdict,
            },
            humanity: {
              lifeNoise,
              contradiction: humanContradiction,
              nonPerformative,
            },
            culture: {
              sharedPattern: sharedPatternMatch.pattern,
              collectiveRecognition,
              unspokenRitual: unspokenRitualPick,
              drift: culturalDriftReading,
            },
            pressure: {
              reality: realityPressureReading,
              consequence: consequenceReading,
              invisibleStakes: invisibleStakesReading,
              functionalCollapse: functionalCollapseReading,
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

        // ─── Phase 7 — update object-emotion store from the scene ─
        const detectedObjects = extractObjectsFromBrief(
          brief.scene,
          worldContinuity.artifacts.map((a) => a.description),
        );
        for (const objectId of detectedObjects) {
          await objectEmotionStore.record(objectId, emotionalCore?.id ?? null);
        }
        if (detectedObjects.length > 0) {
          emit({
            stage: 'object-emotion-memory',
            message: `${detectedObjects.length} objects updated: ${detectedObjects.slice(0, 4).join(', ')}`,
          });
        }

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

/** Phase 9 helper: derive a per-banner light behaviour from a trail
 *  entry's family + closing reaction. Mirrors atmosphericLight's family
 *  fallback so the worldPersistence reading stays honest across runs. */
function inferLightBehaviorFromTrail(t: import('@lib/humanMemory').EmotionalTraceEntry): string {
  switch (t.family) {
    case 'fatigue':
    case 'collapse':       return 'sunset-emotional-pause';
    case 'overstimulation':return 'fluorescent-depletion';
    case 'numbness':
    case 'paralysis':      return 'overcast-flattening';
    case 'pressure':       return 'late-office-warmth';
    case 'fragmentation':  return 'monitor-cool-only';
    case 'avoidance':      return 'cold-morning-detachment';
    default:               return 'window-soft-warm';
  }
}

/** Phase 9 helper: map closing reaction + family → an emotional note
 *  for the current candidate banner. Mirrors campaignTimeline's
 *  noteForEntry so the sequence engine and the timeline agree. */
function inferCandidateNote(
  at_3s: import('@lib/humanReaction').Reaction,
  family: string,
): import('@lib/campaignTimeline').EmotionalNote {
  if (at_3s === 'rejection') return 'denial';
  if (at_3s === 'indifference') return 'numbness';
  if (at_3s === 'confusion') return 'disorientation';
  if (at_3s === 'discomfort') return 'micro-collapse';
  if (at_3s === 'intimacy' && (family === 'fatigue' || family === 'collapse')) return 'aftermath';
  if (at_3s === 'intimacy') return 'recovery';
  if (at_3s === 'validation') return 'quiet-control';
  if (at_3s === 'recognition' && family === 'numbness') return 'detachment';
  if (at_3s === 'recognition' && (family === 'fatigue' || family === 'collapse')) return 'ritual';
  if (at_3s === 'recognition') return 'quiet-control';
  if (at_3s === 'emotional tension' && family === 'pressure') return 'micro-collapse';
  if (at_3s === 'emotional tension') return 'ritual';
  if (at_3s === 'aspiration') return 'recovery';
  if (at_3s === 'curiosity') return 'disorientation';
  if (at_3s === 'interruption') return 'disorientation';
  return 'ritual';
}

/** Phase 9: cultural micro-moment id → apartment kind (mirror of the
 *  map in worldPersistence so scene-continuity stays consistent). */
const APARTMENT_KIND_MAP: Record<string, string> = {
  'fridge-open-at-night': 'apartment-kitchen-night',
  'bed-scrolling': 'apartment-bedroom-night',
  'saturday-stillness': 'apartment-living-room-day',
  'late-kitchen-silence': 'apartment-kitchen-night',
  'no-energy-for-people': 'apartment-entry',
  'reserves-fatigue': 'apartment-kitchen-morning',
  'parenting-overload': 'apartment-living-room-day',
  'overstimulated-tabs': 'office-or-desk',
  'office-fluorescent': 'office-floor',
  'office-1647-brain-death': 'office-floor',
  'startup-late-night': 'office-floor-night',
  'train-ride-silence': 'transit-train',
  'car-after-work': 'transit-car',
  'post-meeting-emptiness': 'office-corridor',
  'zoning-out': 'video-call-desk',
  'staring-without-processing': 'desk',
  'unread-whatsapp': 'apartment-table',
  'avoiding-messages': 'apartment-surface',
  'eating-without-hunger': 'apartment-kitchen-counter',
  'coffee-machine-emptiness': 'office-kitchenette',
};
