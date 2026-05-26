/**
 * POST /api/generate
 *
 * Body: { formula: Formula, campaignMode?: CampaignMode, forceStateId?: string,
 *         copyQualityRefusalEnabled?: boolean }
 *
 * Streams newline-delimited JSON payloads:
 *   { "type": "event", "event": PipelineEvent }
 *   { "type": "banner", "banner": Banner, "svg": string }
 *   { "type": "error", "error": string }
 *
 * Pre-pipeline: when the request OMITS copyQualityRefusalEnabled, a
 * lightweight policy preflight defaults the flag from
 * lib/copyQualityPolicy. Explicit request values (true or false)
 * always win. The preflight result is emitted as a `preflight-policy`
 * stream event AND attached to the shipped banner.
 */

import { NextRequest } from 'next/server';
import { runPipeline } from '@/core/pipeline';
import type { GenerateRequest } from '@/core/types';
import { composeBannerSvg } from '@/components/banner-svg';
import { rememberBanner } from '@/core/banner-cache';
import { runCopyQualityPolicyPreflight } from '@lib/copyQualityPolicyPreflight';
import { recordPolicyAudit, createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';
import {
  recordCulturalObservation, buildHookFingerprint,
  createCulturalPerceptionMemoryStore,
  applyObservation as applyCulturalObservation,
  type CulturalObservation,
} from '@lib/culturalPerceptionMemory';
import { computeCreativeDrift } from '@lib/creativeDriftEngine';
import { recordCreativeDriftObservation } from '@lib/creativeDriftMemory';
import { recordVisualDNAFingerprint } from '@lib/visualDNAMemory';
import { recordNarrativeDNAFingerprint } from '@lib/narrativeDNAMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createCopyQualityMemoryStore } from '@lib/copyQualityMemory';
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { computeCulturalPerception } from '@lib/culturalPerceptionEngine';
import { computeCrossBrainConflict } from '@lib/crossBrainConflictEngine';
import {
  recordConflictObservation, buildConflictObservation,
  createConflictMemoryStore,
} from '@lib/conflictMemory';
import { buildConflictLongitudinalView } from '@lib/conflictLongitudinalView';
import { computeCognitiveWeightEvolution } from '@lib/cognitiveWeightEvolution';
import {
  recordCognitiveWeightObservation, buildHistoryContext,
  createCognitiveWeightMemoryStore,
} from '@lib/cognitiveWeightMemory';
import { computeIdentityContinuity } from '@lib/identityContinuityEngine';
import {
  recordIdentityObservation, buildIdentityHistoryContext,
  createIdentityContinuityMemoryStore,
} from '@lib/identityContinuityMemory';
import { buildPolicyAuditView } from '@lib/copyQualityPolicyAuditView';
import { computeExecutiveGovernance } from '@lib/executiveGovernanceEngine';
import {
  recordGovernanceObservation, buildGovernanceObservation, buildGovernanceHistoryContext,
  createExecutiveGovernanceMemoryStore,
} from '@lib/executiveGovernanceMemory';
import { computeStrategicOutcomeIntelligence } from '@lib/strategicOutcomeIntelligence';
import {
  recordOutcomeObservation, buildOutcomeHistoryContext,
  createStrategicOutcomeMemoryStore,
} from '@lib/strategicOutcomeMemory';
import { computeCounterfactualCognition } from '@lib/counterfactualCognitionEngine';
import {
  recordCounterfactualObservation, buildCounterfactualObservation,
} from '@lib/counterfactualCognitionMemory';
import { computeCampaignEvolution } from '@lib/campaignLifecycleEngine';
import {
  recordCampaignLifecycleObservation, buildCampaignLifecycleObservation,
  buildCampaignLifecycleHistoryContext,
  createCampaignLifecycleMemoryStore,
} from '@lib/campaignLifecycleMemory';
import { recordPostActivationSample, createBranchActivationMemoryStore } from '@lib/branchActivationMemory';
import { computeProjectionCalibration } from '@lib/projectionCalibrationEngine';
import {
  recordCalibrationSnapshot, createProjectionCalibrationMemoryStore,
} from '@lib/projectionCalibrationMemory';
import {
  createOperatorConfidencePreferenceMemoryStore,
  getAllPreferencesForOperator,
} from '@lib/operatorConfidencePreferenceMemory';
import { computeOperatorCalibrationReconciliation } from '@lib/operatorCalibrationReconciliation';
import {
  recordReconciliationSnapshot,
  createOperatorCalibrationReconciliationMemoryStore,
} from '@lib/operatorCalibrationReconciliationMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateBody extends GenerateRequest {
  /** Optional override for the meta-critic brutality (0..1). */
  brutality?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerateBody;

  // Capture the ORIGINAL request flag before the preflight may
  // overwrite it. The audit trail records this verbatim so the
  // governance memory shows what the caller actually asked for.
  const requestedFlag = body.copyQualityRefusalEnabled;

  // ─── Copy-Quality Policy Preflight ──────────────────────────
  // EXPLICIT request value (true or false) ALWAYS wins. Only when
  // the flag is undefined does the preflight compute a default from
  // the policy helper. Failure to read memory degrades to "off".
  const brutalityResolved = body.brutality ?? 0.65;
  const preflight = await runCopyQualityPolicyPreflight({
    explicitFlag: body.copyQualityRefusalEnabled,
    formula: body.formula,
    campaignMode: body.campaignMode ?? null,
    brutality: brutalityResolved,
  });
  if (preflight.applied) {
    // Default-fill — only when request omitted the flag.
    body.copyQualityRefusalEnabled = preflight.enabled;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      try {
        // Emit the preflight result up-front as a pipeline event so it
        // shows in the studio trace. Uses the existing PipelineEvent
        // envelope — no new stream type.
        write({
          type: 'event',
          event: {
            ts: Date.now(),
            stage: 'preflight-policy',
            message:
              `source:${preflight.source} · enabled:${preflight.enabled} · ` +
              `band:${preflight.policyBand} · confidence ${preflight.confidence}/10` +
              (preflight.applied ? ' (route applied default)' : ' (explicit; preflight skipped)'),
            data: {
              source: preflight.source,
              enabled: preflight.enabled,
              policyBand: preflight.policyBand,
              reasonCodes: preflight.reasonCodes.slice(0, 8),
            },
          },
        });
        const result = await runPipeline(body, {
          brutality: body.brutality,
          onEvent: (event) => write({ type: 'event', event }),
          copyQualityPolicyPreflight: preflight,
        });
        rememberBanner(result.banner);
        const svg = composeBannerSvg(result.banner);
        write({ type: 'banner', banner: result.banner, svg });

        // ─── Policy Audit Trail ─────────────────────────────────
        // Governance memory: one entry per generation attempt. The
        // pipeline computes a fuller policy recommendation with real
        // signal — prefer that over the preflight's pre-pipeline
        // synthesis when present. Write failure is swallowed inside
        // recordPolicyAudit; nothing downstream blocks on the audit.
        const banner = result.banner;
        const livePolicy = banner.copyQualityPolicy ?? null;
        const liveQuality = banner.copyQuality ?? null;
        await recordPolicyAudit({
          at: banner.createdAt,
          formula: banner.formula,
          campaignMode: banner.campaignMode,
          brutality: banner.finalVerdict.brutality,
          attempt: banner.attempts,
          requestedFlag,
          preflightRecommendedEnabled: preflight.enabled,
          preflightSource: preflight.source,
          finalAppliedEnabled: body.copyQualityRefusalEnabled === true,
          policyBand: livePolicy?.policyBand ?? preflight.policyBand,
          confidence: livePolicy?.confidence ?? preflight.confidence,
          suggestedIntegrityThreshold: livePolicy?.suggestedIntegrityThreshold ?? 0,
          suggestedBrutalityThreshold: livePolicy?.suggestedBrutalityThreshold ?? 0,
          reasonCodes: [
            ...preflight.reasonCodes,
            ...(livePolicy?.reasonCodes ?? []),
          ],
          policyRecommendsEnabled: livePolicy?.recommendedEnabled ?? preflight.enabled,
          outcomeVerdict: banner.finalVerdict.verdict,
          outcomeReasons: banner.finalVerdict.reasons,
          copyIntegrity:     liveQuality?.copyIntegrity     ?? null,
          trustSafety:       liveQuality?.trustSafety       ?? null,
          dignitySafety:     liveQuality?.dignitySafety     ?? null,
          repetitionConcern: liveQuality?.repetitionConcern ?? null,
        });

        // ─── Cultural Perception Memory ─────────────────────────
        // Append one compact observation of the shipped banner so the
        // perception layer can read collective creative-pattern drift
        // over time. STRICTLY observational — no effect on generation,
        // verdicts, brutality, or refusal. Failure is non-fatal.
        const observation: CulturalObservation = {
          at: banner.createdAt,
          bannerId: banner.id,
          formula: banner.formula,
          campaignMode: banner.campaignMode,
          layoutFamily: banner.direction.layoutFamily,
          productRole: banner.direction.productRole,
          typographyDominance: banner.direction.typographyDominance,
          focalPoint: banner.direction.focalPoint,
          emotionalFamily: banner.state.family,
          stateLabel: banner.state.label,
          emotionalFrame: banner.copywriter?.emotionalFrame ?? null,
          persuasionTone: banner.copywriter?.persuasionTone ?? null,
          pacing: banner.direction.emotionalPacing,
          restraint: banner.direction.restraint,
          hookFingerprint: buildHookFingerprint(banner.direction.hook),
          ctaStyle: banner.cta.style,
          ctaBehavior: banner.direction.ctaBehavior,
          copyIntegrity:     liveQuality?.copyIntegrity     ?? null,
          trustSafety:       liveQuality?.trustSafety       ?? null,
          dignitySafety:     liveQuality?.dignitySafety     ?? null,
          repetitionConcern: liveQuality?.repetitionConcern ?? null,
          ctaRestraint:      liveQuality?.ctaRestraint      ?? null,
          hebrewNaturalness: liveQuality?.hebrewNaturalness ?? null,
          policyBand:        livePolicy?.policyBand          ?? null,
          outcomeVerdict:    banner.finalVerdict.verdict,
        };
        await recordCulturalObservation(observation);

        // ─── Cross-Brain Conflict Engine ────────────────────────
        // Compute the conflict reading using the just-updated cultural
        // perception (memory now includes the observation) + the live
        // banner signals. Persist one observation so the longitudinal
        // view can detect recurring tensions. Write failure is non-fatal.
        try {
          const culturalState = await createCulturalPerceptionMemoryStore()
            .read().catch(() => null);
          // The store already applied the observation when recordCulturalObservation
          // succeeded; if it failed (which would have been swallowed),
          // synthesize the post-observation state purely so the engine
          // still sees the live frame.
          const culturalForEngine = culturalState ?? null;
          const culturalForCurrentFrame = culturalState
            ? culturalState
            : applyCulturalObservation(
                {
                  observations: [], visualPatternFrequency: {}, emotionalPatternFrequency: {},
                  pacingFrequency: {}, hookFrequency: {}, ctaFrequency: {}, toneFrequency: {},
                  firstSeenAt: {}, lastSeenAt: {}, trustTrajectory: [], noveltyDecayTrace: [],
                  emotionalDriftBuckets: [], resistanceMarkers: [], totalObservations: 0,
                  firstUpdatedAt: null, updatedAt: 0,
                },
                observation,
              );
          void culturalForCurrentFrame;

          const culturalPerception = computeCulturalPerception({
            memory: culturalForEngine,
            current: { observation },
          });

          const conflict = computeCrossBrainConflict({
            formula: banner.formula,
            campaignMode: banner.campaignMode,
            brutality: banner.finalVerdict.brutality,
            strategy: banner.adStrategy ?? null,
            copywriter: banner.copywriter ?? null,
            copyQuality: liveQuality,
            culturalPerception,
            policyAudit: null,
            qualityLongitudinal: null,
          });

          // Emit conflict reading as a pipeline event so the studio
          // trace shows it. Uses the existing PipelineEvent envelope.
          write({
            type: 'event',
            event: {
              ts: Date.now(),
              stage: 'cross-brain-conflict',
              message:
                `tension ${conflict.overallTension}/10 · ` +
                `stability ${conflict.cognitiveStability}/10 · ` +
                `alignment ${conflict.alignmentScore}/10 · ` +
                `active ${conflict.activeConflicts.length}` +
                (conflict.dominantConflict ? ` · dominant ${conflict.dominantConflict}` : ''),
              data: {
                overallTension: conflict.overallTension,
                dominantConflict: conflict.dominantConflict,
                activeConflicts: conflict.activeConflicts.map((c) => ({
                  type: c.type, severity: c.severity,
                })),
              },
            },
          });

          await recordConflictObservation(buildConflictObservation({
            at: banner.createdAt,
            bannerId: banner.id,
            formula: banner.formula,
            campaignMode: banner.campaignMode,
            overallTension: conflict.overallTension,
            cognitiveStability: conflict.cognitiveStability,
            alignmentScore: conflict.alignmentScore,
            dominantConflict: conflict.dominantConflict,
            activeConflicts: conflict.activeConflicts,
            agreementZones: conflict.agreementZones,
            silentRiskCount: conflict.silentRisks.length,
          }));

          // ─── Dynamic Cognitive Weight Evolution ───────────────
          // Compute per-brain weights using the just-shipped conflict
          // + cultural perception + historical context, emit as a
          // pipeline event, and persist one observation so the
          // longitudinal view can detect authority drift. Write
          // failure is non-fatal.
          try {
            const conflictMemAfter = await createConflictMemoryStore()
              .read().catch(() => null);
            const conflictLongitudinal = buildConflictLongitudinalView({
              memory: conflictMemAfter,
              current: conflict,
            });
            const weightMemBefore = await createCognitiveWeightMemoryStore()
              .read().catch(() => null);
            const weights = computeCognitiveWeightEvolution({
              conflict,
              strategy: banner.adStrategy ?? null,
              copyQuality: liveQuality,
              culturalPerception,
              policyAudit: null,
              qualityLongitudinal: null,
              conflictLongitudinal,
              history: buildHistoryContext(weightMemBefore),
            });
            write({
              type: 'event',
              event: {
                ts: Date.now(),
                stage: 'cognitive-weight',
                message:
                  `stability ${weights.globalStability}/10 · ` +
                  `adaptation ${weights.adaptationPressure}/10 · ` +
                  `fragmentation ${weights.cognitiveFragmentation}/10 · ` +
                  `dominant ${weights.dominantSystems.map((d) => d.system).join(',') || 'none'}`,
                data: {
                  globalStability: weights.globalStability,
                  adaptationPressure: weights.adaptationPressure,
                  cognitiveFragmentation: weights.cognitiveFragmentation,
                  dominantSystems: weights.dominantSystems.map((d) => ({
                    system: d.system, weight: d.weight,
                  })),
                },
              },
            });
            await recordCognitiveWeightObservation({
              at: banner.createdAt,
              bannerId: banner.id,
              formula: banner.formula,
              campaignMode: banner.campaignMode,
              weights: weights.weights,
              globalStability: weights.globalStability,
              adaptationPressure: weights.adaptationPressure,
              cognitiveFragmentation: weights.cognitiveFragmentation,
              dominantSystem: weights.dominantSystems[0]?.system ?? null,
              suppressedSystems: weights.suppressedSystems.map((s) => s.system),
            });

            // ─── Persistent Identity Continuity ─────────────────
            // With weights now persisted, derive the identity reading
            // for this run and store it so the longitudinal view can
            // surface persistent behavioral identity. STRICTLY
            // observational — no self-modification, no goal mutation.
            try {
              const identityMemBefore = await createIdentityContinuityMemoryStore()
                .read().catch(() => null);
              const policyAuditView = buildPolicyAuditView(null);
              const identity = computeIdentityContinuity({
                cognitiveWeight: weights,
                conflict,
                culturalPerception,
                strategy: banner.adStrategy ?? null,
                copyQuality: liveQuality,
                qualityLongitudinal: null,
                policyAuditView,
                directionRestraint: banner.direction.restraint,
                history: buildIdentityHistoryContext(identityMemBefore),
              });
              write({
                type: 'event',
                event: {
                  ts: Date.now(),
                  stage: 'identity-continuity',
                  message:
                    `stability ${identity.identityStability}/10 · ` +
                    `consistency ${identity.behavioralConsistency}/10 · ` +
                    `fragmentation ${identity.identityFragmentation}/10 · ` +
                    `dominant ${identity.dominantIdentityVectors.map((d) => d.vector).join(',') || 'none'} · ` +
                    `continuity-risk ${identity.continuityRisk}/10`,
                  data: {
                    identityStability: identity.identityStability,
                    identityFragmentation: identity.identityFragmentation,
                    behavioralConsistency: identity.behavioralConsistency,
                    continuityRisk: identity.continuityRisk,
                    dominantIdentityVectors: identity.dominantIdentityVectors.map((d) => ({
                      vector: d.vector, strength: d.strength, persistence: d.persistence,
                    })),
                  },
                },
              });
              await recordIdentityObservation({
                at: banner.createdAt,
                bannerId: banner.id,
                formula: banner.formula,
                campaignMode: banner.campaignMode,
                vectorStrengths: identity.vectorStrengths,
                identityStability: identity.identityStability,
                identityFragmentation: identity.identityFragmentation,
                behavioralConsistency: identity.behavioralConsistency,
                adaptationVelocity: identity.adaptationVelocity,
                continuityRisk: identity.continuityRisk,
                dominantVector: identity.dominantIdentityVectors[0]?.vector ?? null,
                emergingVectors: identity.emergingIdentityVectors.map((e) => e.vector),
                collapsingVectors: identity.collapsingIdentityVectors.map((c) => c.vector),
                contradictionCount: identity.identityContradictions.length,
              });

              // ─── Executive Cognitive Governance ─────────────────
              // With weights + conflict + identity all persisted,
              // derive the contextual governance structure for this
              // run and store it so the longitudinal view can detect
              // recurring executives, stabilizers, shadow executives,
              // and overreach. STRICTLY observational — no autonomous
              // orchestration, no runtime authority enforcement.
              try {
                const governanceMemBefore = await createExecutiveGovernanceMemoryStore()
                  .read().catch(() => null);
                const governance = computeExecutiveGovernance({
                  cognitiveWeight: weights,
                  conflict,
                  culturalPerception,
                  identityContinuity: identity,
                  qualityLongitudinal: null,
                  history: buildGovernanceHistoryContext(governanceMemBefore),
                });
                write({
                  type: 'event',
                  event: {
                    ts: Date.now(),
                    stage: 'executive-governance',
                    message:
                      `executive ${governance.dominantGovernanceStructure.primaryExecutive ?? 'none'} · ` +
                      `legitimacy ${governance.executiveLegitimacy}/10 · ` +
                      `stability ${governance.governanceStability}/10 · ` +
                      `fragmentation ${governance.authorityFragmentation}/10 · ` +
                      `overreach-risks ${governance.executiveOverreachRisks.length}`,
                    data: {
                      primaryExecutive: governance.dominantGovernanceStructure.primaryExecutive,
                      governanceStability: governance.governanceStability,
                      executiveLegitimacy: governance.executiveLegitimacy,
                      authorityFragmentation: governance.authorityFragmentation,
                      shadowExecutives: governance.shadowExecutives.map((s) => s.system),
                      overreachRisks: governance.executiveOverreachRisks.map((o) => o.system),
                    },
                  },
                });
                await recordGovernanceObservation(buildGovernanceObservation({
                  at: banner.createdAt,
                  bannerId: banner.id,
                  formula: banner.formula,
                  campaignMode: banner.campaignMode,
                  governance,
                  authorities: weights.weights,
                  suppressed: weights.suppressedSystems.map((s) => s.system),
                }));

                // ─── Strategic Outcome Intelligence ────────────────
                // With identity + governance both persisted, derive
                // the strategic-outcome reading for this run and
                // record one observation so the longitudinal view
                // can correlate which structures produce durable vs
                // temporary success. STRICTLY observational — no
                // autonomous optimization, no runtime mutation.
                try {
                  const outcomeMemBefore = await createStrategicOutcomeMemoryStore()
                    .read().catch(() => null);
                  const outcome = computeStrategicOutcomeIntelligence({
                    strategy: banner.adStrategy ?? null,
                    conflict,
                    culturalPerception,
                    identityContinuity: identity,
                    executiveGovernance: governance,
                    qualityLongitudinal: null,
                    policyAuditView: null,
                    history: buildOutcomeHistoryContext(outcomeMemBefore),
                  });
                  write({
                    type: 'event',
                    event: {
                      ts: Date.now(),
                      stage: 'strategic-outcome',
                      message:
                        `stability ${outcome.strategicStability}/10 · ` +
                        `trust-durability ${outcome.trustDurability}/10 · ` +
                        `audience-resilience ${outcome.audienceResilience}/10 · ` +
                        `novelty-fragility ${outcome.noveltyFragility}/10 · ` +
                        `risk ${outcome.strategicRisk}/10 · ` +
                        `dominant ${outcome.dominantStrategicSignatures.map((d) => d.signature).join(',') || 'none'}`,
                      data: {
                        strategicStability: outcome.strategicStability,
                        trustDurability: outcome.trustDurability,
                        audienceResilience: outcome.audienceResilience,
                        noveltyFragility: outcome.noveltyFragility,
                        strategicRisk: outcome.strategicRisk,
                        dominantSignatures: outcome.dominantStrategicSignatures.map((d) => ({
                          signature: d.signature, durability: d.durability,
                        })),
                      },
                    },
                  });
                  // Build a compact governance fingerprint (exec + top-2 supporters).
                  const govFingerprint = (() => {
                    const exec = governance.dominantGovernanceStructure.primaryExecutive ?? 'none';
                    const support = governance.dominantGovernanceStructure.supportingSystems.slice(0, 2).join('+') || 'none';
                    return `${exec}|${support}`;
                  })();
                  const decaySignal = (
                    outcome.noveltyFragility +
                    outcome.signatureStrengths['trust-erosive'] +
                    outcome.strategicRisk
                  ) / 3;
                  await recordOutcomeObservation({
                    at: banner.createdAt,
                    bannerId: banner.id,
                    formula: banner.formula,
                    campaignMode: banner.campaignMode,
                    signatureStrengths: outcome.signatureStrengths,
                    dominantSignature: outcome.dominantStrategicSignatures[0]?.signature ?? null,
                    emergingSignatures: outcome.emergingStrategicSignatures.map((e) => e.signature),
                    collapsingSignatures: outcome.collapsingStrategicSignatures.map((c) => c.signature),
                    strategicStability: outcome.strategicStability,
                    trustDurability: outcome.trustDurability,
                    audienceResilience: outcome.audienceResilience,
                    noveltyFragility: outcome.noveltyFragility,
                    longTermConsistency: outcome.longTermConsistency,
                    strategicRisk: outcome.strategicRisk,
                    identityVector: identity.dominantIdentityVectors[0]?.vector ?? null,
                    governanceExecutive: governance.dominantGovernanceStructure.primaryExecutive ?? null,
                    governanceFingerprint: govFingerprint,
                    audienceNumbness: culturalPerception.audienceNumbness,
                    decaySignal: Math.round(decaySignal * 10) / 10,
                  });

                  // ─── Counterfactual Cognition ─────────────────────
                  // Multi-path CREATIVE STRATEGY simulation: for each
                  // suppressed/shadow brain + a few alternates, project
                  // the campaign archetype that would have emerged and
                  // its impact across the 7 axes (creative · emotional ·
                  // trust · fatigue · durability · conversion · brand).
                  // STRICTLY simulation-only — no autonomous branching.
                  try {
                    const counterfactual = computeCounterfactualCognition({
                      strategy: banner.adStrategy ?? null,
                      conflict,
                      culturalPerception,
                      cognitiveWeight: weights,
                      identityContinuity: identity,
                      executiveGovernance: governance,
                      strategicOutcome: outcome,
                    });
                    write({
                      type: 'event',
                      event: {
                        ts: Date.now(),
                        stage: 'counterfactual-cognition',
                        message:
                          `actual ${counterfactual.actualArchetype ?? 'none'} (${counterfactual.actualLeader ?? 'none'}) · ` +
                          `projections ${counterfactual.projections.length} · ` +
                          `trust-optimal ${counterfactual.trustOptimizedPath?.counterfactualCampaignArchetype ?? 'none'} · ` +
                          `durability-optimal ${counterfactual.durabilityOptimizedPath?.counterfactualCampaignArchetype ?? 'none'} · ` +
                          `fatigue-aware ${counterfactual.fatigueAwarePath?.counterfactualCampaignArchetype ?? 'none'}`,
                        data: {
                          actualLeader: counterfactual.actualLeader,
                          actualArchetype: counterfactual.actualArchetype,
                          projections: counterfactual.projections.map((p) => ({
                            alternateLeader: p.alternateLeader,
                            archetype: p.counterfactualCampaignArchetype,
                            trustImpact: p.trustImpact,
                            durabilityImpact: p.durabilityImpact,
                            divergenceFromActual: p.divergenceFromActual,
                          })),
                        },
                      },
                    });
                    await recordCounterfactualObservation(buildCounterfactualObservation({
                      at: banner.createdAt,
                      bannerId: banner.id,
                      formula: banner.formula,
                      campaignMode: banner.campaignMode,
                      actualLeader: counterfactual.actualLeader,
                      actualArchetype: counterfactual.actualArchetype,
                      projections: counterfactual.projections,
                      trustOptimizedArchetype: counterfactual.trustOptimizedPath?.counterfactualCampaignArchetype ?? null,
                      durabilityOptimizedArchetype: counterfactual.durabilityOptimizedPath?.counterfactualCampaignArchetype ?? null,
                    }));

                    // ─── Campaign Lifecycle Evolution ────────────────
                    // With every upstream layer persisted, derive the
                    // campaign-level evolution reading for this run
                    // (phase + freshness vs fatigue + trust momentum
                    // + decay risk + branch readiness + audience
                    // rotation need + strategic durability) and store
                    // one observation. STRICTLY observational — no
                    // autonomous publishing, no branching, no budget
                    // decisions, no prompt mutation.
                    try {
                      const lifecycleMemBefore = await createCampaignLifecycleMemoryStore()
                        .read().catch(() => null);
                      const evolution = computeCampaignEvolution({
                        strategy: banner.adStrategy ?? null,
                        copyQuality: liveQuality,
                        culturalPerception,
                        identityContinuity: identity,
                        executiveGovernance: governance,
                        strategicOutcome: outcome,
                        counterfactualCognition: counterfactual,
                        history: buildCampaignLifecycleHistoryContext(lifecycleMemBefore),
                      });
                      write({
                        type: 'event',
                        event: {
                          ts: Date.now(),
                          stage: 'campaign-evolution',
                          message:
                            `phase ${evolution.currentPhase} · ` +
                            `health ${evolution.campaignHealth}/10 · ` +
                            `trust-momentum ${evolution.trustMomentum}/10 · ` +
                            `fatigue ${evolution.fatiguePressure}/10 · ` +
                            `decay ${evolution.decayRisk}/10 · ` +
                            `branch ${evolution.branchReadiness}/10 · ` +
                            `audience-rotation ${evolution.audienceRotationNeed}/10`,
                          data: {
                            currentPhase: evolution.currentPhase,
                            campaignHealth: evolution.campaignHealth,
                            trustMomentum: evolution.trustMomentum,
                            fatiguePressure: evolution.fatiguePressure,
                            decayRisk: evolution.decayRisk,
                            branchReadiness: evolution.branchReadiness,
                            audienceRotationNeed: evolution.audienceRotationNeed,
                            strategicDurability: evolution.strategicDurability,
                            dominantCampaignPattern: evolution.dominantCampaignPattern,
                          },
                        },
                      });
                      await recordCampaignLifecycleObservation(buildCampaignLifecycleObservation({
                        at: banner.createdAt,
                        bannerId: banner.id,
                        formula: banner.formula,
                        campaignMode: banner.campaignMode,
                        evolution,
                      }));

                      // ─── Branch Activation Outcome Observation ──────
                      // Update any UNRESOLVED branch activations with
                      // this run's campaign-evolution snapshot. Pure
                      // observation — the activation event itself was
                      // already recorded via the POST endpoint at
                      // operator-decision time. STRICTLY read-only;
                      // this writes only outcome-delta accumulators
                      // on already-existing activation records.
                      await recordPostActivationSample({
                        at: banner.createdAt,
                        campaignHealth: evolution.campaignHealth,
                        trustMomentum: evolution.trustMomentum,
                        fatiguePressure: evolution.fatiguePressure,
                        strategicDurability: evolution.strategicDurability,
                        decayRisk: evolution.decayRisk,
                      });

                      // ─── Projection Calibration Snapshot ────────────
                      // After the post-activation sample updates
                      // branch-activation memory (resolving any windows
                      // that closed this run), capture a calibration
                      // snapshot — pure annotations, never mutating
                      // projections or scores. Failure swallowed.
                      try {
                        const branchMemAfter = await createBranchActivationMemoryStore()
                          .read().catch(() => null);
                        const calibrationMemBefore = await createProjectionCalibrationMemoryStore()
                          .read().catch(() => null);
                        const report = computeProjectionCalibration({
                          branchActivationMemory: branchMemAfter,
                          calibrationMemory: calibrationMemBefore,
                        });
                        if (report.calibrations.length > 0) {
                          const perTypeAccuracy: Record<string, number> = {};
                          for (const c of report.calibrations) {
                            perTypeAccuracy[c.projectionType] = c.historicalAccuracy;
                          }
                          write({
                            type: 'event',
                            event: {
                              ts: Date.now(),
                              stage: 'projection-calibration',
                              message:
                                `overall accuracy ${report.overallAccuracy}/10 · ` +
                                `confidence ${report.overallConfidence}/10 · ` +
                                `types ${report.calibrations.length}` +
                                (report.mostReliableProjectionType
                                  ? ` · most-reliable ${report.mostReliableProjectionType}`
                                  : ''),
                              data: {
                                overallAccuracy: report.overallAccuracy,
                                overallConfidence: report.overallConfidence,
                                mostReliableProjectionType: report.mostReliableProjectionType,
                                leastReliableProjectionType: report.leastReliableProjectionType,
                              },
                            },
                          });
                          await recordCalibrationSnapshot({
                            at: banner.createdAt,
                            bannerId: banner.id,
                            overallConfidence: report.overallConfidence,
                            overallAccuracy: report.overallAccuracy,
                            perTypeAccuracy,
                          });

                          // ─── Operator Calibration Reconciliation ────
                          // After a fresh calibration report exists,
                          // compare it to the operator's current
                          // confidence sliders for every operator with
                          // recorded preferences. Persist one snapshot
                          // per operator so the longitudinal view can
                          // trace divergence/convergence. STRICTLY
                          // observation only — never modifies operator
                          // sliders or system calibration.
                          try {
                            const opPrefMem = await createOperatorConfidencePreferenceMemoryStore()
                              .read().catch(() => null);
                            const reconcileMemBefore = await createOperatorCalibrationReconciliationMemoryStore()
                              .read().catch(() => null);
                            const operators = opPrefMem
                              ? Object.keys(opPrefMem.operatorUpdateCounts)
                              : [];
                            for (const operatorId of operators) {
                              const prefs = getAllPreferencesForOperator(opPrefMem!, operatorId);
                              if (prefs.length === 0) continue;
                              const reconciliation = computeOperatorCalibrationReconciliation({
                                operatorId,
                                calibrationReport: report,
                                operatorPreferences: prefs,
                                reconciliationMemory: reconcileMemBefore,
                              });
                              if (reconciliation.totalReconciliations === 0) continue;
                              const perTypeSummary: Record<string, {
                                system: number; operator: number;
                                agreement: number; relationship: string;
                              }> = {};
                              for (const r of reconciliation.reconciliations) {
                                perTypeSummary[r.projectionType] = {
                                  system: r.systemConfidence,
                                  operator: r.operatorConfidence,
                                  agreement: r.agreementLevel,
                                  relationship: r.relationshipType,
                                };
                              }
                              await recordReconciliationSnapshot({
                                at: banner.createdAt,
                                bannerId: banner.id,
                                operatorId,
                                perTypeSummary,
                              });
                            }
                          } catch {
                            // non-fatal — reconciliation snapshot never blocks generation
                          }
                        }
                      } catch {
                        // non-fatal — calibration snapshot never blocks generation
                      }
                    } catch {
                      // non-fatal — lifecycle observation never blocks generation
                    }
                  } catch {
                    // non-fatal — counterfactual observation never blocks generation
                  }
                } catch {
                  // non-fatal — outcome observation never blocks generation
                }
              } catch {
                // non-fatal — governance observation never blocks generation
              }
            } catch {
              // non-fatal — identity observation never blocks generation
            }
          } catch {
            // non-fatal — cognitive weight observation never blocks generation
          }
        } catch {
          // non-fatal — conflict observation never blocks generation
        }

        // ─── Creative Drift Observation ─────────────────────────
        // Final post-pipeline observation. Reads every existing memory
        // store (read-only) to compute a drift snapshot, then appends
        // ONE entry to creative-drift memory (its own dedicated FIFO).
        // Strictly observational — never mutates any other memory,
        // never affects the banner, the verdict, or critic behavior.
        // Wrapped so that any failure swallows silently.
        try {
          const [
            copywriterMem, copyQualityMem, identityMem, campaignMem,
            outcomeMem, strategyMem, policyAuditMem,
          ] = await Promise.all([
            createCopywriterMemoryStore().read().catch(() => null),
            createCopyQualityMemoryStore().read().catch(() => null),
            createIdentityContinuityMemoryStore().read().catch(() => null),
            createCampaignLifecycleMemoryStore().read().catch(() => null),
            createStrategicOutcomeMemoryStore().read().catch(() => null),
            createAdStrategyMemoryStore().read().catch(() => null),
            createPolicyAuditStore().read().catch(() => null),
          ]);
          const driftSnapshot = computeCreativeDrift({
            copywriter:  copywriterMem  as never,
            copyQuality: copyQualityMem as never,
            identity:    identityMem    as never,
            campaign:    campaignMem    as never,
            outcomes:    outcomeMem     as never,
            strategy:    strategyMem    as never,
            policy:      policyAuditMem as never,
          });
          write({
            type: 'event',
            event: {
              ts: Date.now(),
              stage: 'creative-drift',
              message:
                `health ${driftSnapshot.overallCreativeHealth}/10 · ` +
                `drift ${driftSnapshot.driftSeverity}/10 · ` +
                `entropy ${driftSnapshot.entropyLevel}/10` +
                (driftSnapshot.dominantDriftPatterns.length > 0
                  ? ` · ${driftSnapshot.dominantDriftPatterns.length} dominant pattern(s)`
                  : ''),
              data: {
                overallCreativeHealth: driftSnapshot.overallCreativeHealth,
                driftSeverity: driftSnapshot.driftSeverity,
                entropyLevel: driftSnapshot.entropyLevel,
                originalityPressure: driftSnapshot.originalityPressure,
                dominantPatterns: driftSnapshot.dominantDriftPatterns.map((p) => p.pattern).slice(0, 4),
              },
            },
          });
          await recordCreativeDriftObservation(driftSnapshot, {
            at: result.banner.createdAt,
            bannerId: result.banner.id,
            formula: result.banner.formula,
            campaignMode: result.banner.campaignMode ?? null,
          });
        } catch {
          // non-fatal — creative drift observation never blocks generation
        }

        // ─── Visual + Narrative DNA Fingerprints ────────────────
        // Token-extracted fingerprints — NOT image analysis. Each
        // fingerprint compresses the banner's structural fields into
        // deterministic strings + scalar 0..10 readings. They feed
        // the creative-fatigue engine. Append-only FIFOs, wrapped so
        // failure never blocks generation.
        try {
          await recordVisualDNAFingerprint(result.banner as never);
        } catch {
          // non-fatal — visual DNA fingerprint never blocks generation
        }
        try {
          await recordNarrativeDNAFingerprint(result.banner as never);
        } catch {
          // non-fatal — narrative DNA fingerprint never blocks generation
        }
      } catch (e) {
        write({ type: 'error', error: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
    },
  });
}
