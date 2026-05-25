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
import { recordPolicyAudit } from '@lib/copyQualityPolicyAudit';
import {
  recordCulturalObservation, buildHookFingerprint,
  createCulturalPerceptionMemoryStore,
  applyObservation as applyCulturalObservation,
  type CulturalObservation,
} from '@lib/culturalPerceptionMemory';
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
            } catch {
              // non-fatal — identity observation never blocks generation
            }
          } catch {
            // non-fatal — cognitive weight observation never blocks generation
          }
        } catch {
          // non-fatal — conflict observation never blocks generation
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
