/**
 * COGNITION ENGINE — Wave 20: First Cognition · Wave 21: Vocabulary
 *
 * One orchestrator runs every cognitive verb. The pipeline is fixed:
 *
 *   1. read os-runtime.json + organism.json
 *   2. evolve the OS state via the verb's evolve function
 *      (pushes a directive with a thought composed from real values)
 *   3. evolve the organism (age += 1; no energy / stress / complexity
 *      change — these are not actions, they are cognition)
 *   4. save both stores atomically before returning
 *
 * No randomness, no invention. The thought in each directive is
 * derived at evolve time from the persistent state. The summary
 * returned is for verification — the source of truth is on disk.
 */

import {
  createOSRuntimeStore,
  evolveOSFromObservation,
  evolveOSFromNotice,
  evolveOSFromConsider,
  evolveOSFromRestrain,
  evolveOSFromPermit,
  evolveOSFromPrepare,
  evolveOSFromDraft,
  evolveOSFromReview,
  evolveOSFromRevise,
  evolveOSFromApprove,
  evolveOSFromPropose,
  evolveOSFromRest,
  evolveOSFromWakeTransition,
  evolveOSFromDefer,
} from './operatingSystemCore';
import { classifyConsciousness } from './consciousnessView';
import { createTemporalMemoryStore } from './temporalMemory';
import { computeTemporalAssessment, suggestDeferReason } from './temporalIntelligenceView';
import {
  createOrganismCoreStore,
  evolveOrganismFromCognitiveAct,
} from './persistentOrganismCore';
import {
  createCognitiveLineageStore,
} from './cognitiveLineage';
import type { LineageEntry } from './cognitiveLineage';
import type {
  OSRuntimeState,
  DirectiveRecord,
  OperationalPosture,
  StrategicSeasonName,
  PermissionWindow,
  IntentionState,
  CurrentDraft,
  CurrentReview,
  CurrentRevision,
  ApprovalState,
  PendingExternalAction,
} from './operatingSystemCore';

export type CognitiveVerb =
  | 'observe' | 'notice' | 'consider' | 'restrain'
  | 'permit'  | 'prepare' | 'draft'
  | 'review'  | 'revise'  | 'approve'
  | 'propose' | 'rest'    | 'defer';

export interface CognitionEventResult {
  verb: CognitiveVerb;
  at: number;
  directive: DirectiveRecord;
  thought: string;
  os: {
    uptime_before: number;
    uptime_after: number;
    posture_before: OperationalPosture;
    posture_after: OperationalPosture;
    season: StrategicSeasonName;
    season_age_after: number;
    directive_log_length_after: number;
    /** Wave 22 — the permission window after this act. null when the
     *  window is closed (still no permission), populated when a
     *  successful permit has opened it. Cleared back to null when a
     *  successful prepare consumes it (Wave 23). */
    permission_window: PermissionWindow | null;
    /** Wave 23 — the internal intention after this act. null until a
     *  successful prepare opens it. No creative content; bare
     *  readiness only. Cleared to null when a successful draft
     *  consumes it (Wave 24). */
    current_intention: IntentionState | null;
    /** Wave 24 — the first internal artifact after this act. null
     *  until a successful draft creates it. Carries the deterministic
     *  body and restraintTrace; never holds external content. */
    current_draft: CurrentDraft | null;
    /** Wave 26 — the review of currentDraft after this act. null
     *  until a successful review evaluates it; cleared on revise. */
    current_review: CurrentReview | null;
    /** Wave 26 — revision metadata for the latest revise event. */
    current_revision: CurrentRevision | null;
    /** Wave 26 — approval verdict if approve has fired. */
    current_approval: ApprovalState | null;
    /** Wave 27 — Phase 8A pending external action candidates. Capped
     *  array, FIFO eviction at PENDING_ACTIONS_LIMIT. */
    pending_external_actions: PendingExternalAction[];
  };
  organism: {
    age_before: number;
    age_after: number;
  };
}

export async function runCognitiveAct(verb: CognitiveVerb): Promise<CognitionEventResult> {
  const osStore = createOSRuntimeStore();
  const organismStore = createOrganismCoreStore();
  const lineageStore = createCognitiveLineageStore();

  const temporalStore = createTemporalMemoryStore();
  const [osPre, organismPre, lineagePre, temporalPre] = await Promise.all([
    osStore.read(),
    organismStore.read(),
    lineageStore.read(),
    temporalStore.read(),
  ]);

  const at = Date.now();

  // Wave 29 — wake transition. If the pre-verb consciousness state was
  // 'hibernating', inject a 'wake-transition' directive BEFORE the verb
  // dispatches. The wake takes its own tick (uptime + seasonAge + 1)
  // and bumps wakeCount; the verb that follows takes the next tick.
  // Organism age increments only once (from the verb), because the
  // wake itself is an OS-level event, not a cognitive one.
  const consciousnessPre = classifyConsciousness(osPre, organismPre);
  let osBeforeVerb = osPre;
  if (consciousnessPre === 'hibernating') {
    const lastCognition = osPre.directiveLog.length > 0
      ? osPre.directiveLog[osPre.directiveLog.length - 1].tick
      : 0;
    const hibernatedForTicks = Math.max(0, osPre.uptime - lastCognition);
    osBeforeVerb = evolveOSFromWakeTransition(osPre, at, hibernatedForTicks);
  }

  // Wave 26 — dispatch with the extra context review and revise need.
  // review needs priorDraftBodies (for novelty); revise needs the
  // count of revisions in the current draft chain (for the loop cap).
  // Dispatch operates on osBeforeVerb (which equals osPre when no
  // wake transition fired, or the post-wake state when it did).
  let osPost: OSRuntimeState;
  if (verb === 'review') {
    const priorBodies = lineagePre.entries
      .filter((e): e is Extract<LineageEntry, { kind: 'draft' }> => e.kind === 'draft')
      .map((e) => e.payload.body);
    osPost = evolveOSFromReview(osBeforeVerb, at, priorBodies);
  } else if (verb === 'revise') {
    const currentChainOriginalId = osBeforeVerb.currentDraft
      ? (osBeforeVerb.currentDraft.revisedFrom?.originalDraftId ?? osBeforeVerb.currentDraft.draftId)
      : null;
    const revisionCountInChain = currentChainOriginalId
      ? lineagePre.entries.filter((e): e is Extract<LineageEntry, { kind: 'revision' }> =>
          e.kind === 'revision' && e.payload.derivedFromOriginalDraftId === currentChainOriginalId,
        ).length
      : 0;
    osPost = evolveOSFromRevise(osBeforeVerb, at, revisionCountInChain);
  } else if (verb === 'approve') {
    osPost = evolveOSFromApprove(osBeforeVerb, at);
  } else if (verb === 'propose') {
    osPost = evolveOSFromPropose(osBeforeVerb, at);
  } else if (verb === 'rest') {
    osPost = evolveOSFromRest(osBeforeVerb, organismPre, at);
  } else if (verb === 'defer') {
    // Compose the defer thought from the CURRENT temporal assessment
    // (computed against pre-evolve state — that's what justified the
    // patience). The assessment in temporalMemory will update AFTER
    // this verb completes.
    const preSnapshot = {
      organism: organismPre, os: osBeforeVerb,
      civilization: null, worldState: null, runtime: null,
      temporalMemory: temporalPre,
      capturedAt: at,
    } as Parameters<typeof computeTemporalAssessment>[0];
    const assessment = computeTemporalAssessment(preSnapshot);
    const reason = suggestDeferReason(assessment);
    osPost = evolveOSFromDefer(osBeforeVerb, at, reason);
  } else {
    const EVOLVE_BY_VERB: Record<string, (state: OSRuntimeState, at?: number) => OSRuntimeState> = {
      observe: evolveOSFromObservation,
      notice: evolveOSFromNotice,
      consider: evolveOSFromConsider,
      restrain: evolveOSFromRestrain,
      permit: evolveOSFromPermit,
      prepare: evolveOSFromPrepare,
      draft: evolveOSFromDraft,
    };
    osPost = EVOLVE_BY_VERB[verb](osBeforeVerb, at);
  }

  const directive = osPost.directiveLog[osPost.directiveLog.length - 1];
  const directiveName = directive.directive;

  // Wave 25/26 — cognitive act context for organism vitals.
  // contradictionScore comes from the freshly-built review on success.
  // isFirstRevisionInChain fires the first time revise succeeds in the
  // current draft chain (revisionNumber === 1).
  const contradictionScore = directiveName === 'review'
    ? (osPost.currentReview?.contradictionScore ?? 0)
    : 0;
  // Wave 28 — rest context: snapshot pre-rest organism vitals + post-rest
  // fragmentation so evolveOrganismFromCognitiveAct can build lastRestSnapshot.
  const isRestSuccess = directiveName === 'rest';
  const restCtx = isRestSuccess
    ? {
        restAt: at,
        restTick: osPost.uptime,
        preRestSnapshot: {
          energyReserves: organismPre.energyReserves,
          stressAccumulation: organismPre.stressAccumulation,
          complexityLoad: organismPre.complexityLoad,
          fragmentationStreak: osPre.fragmentationStreak,
        },
        postRestFragmentation: osPost.fragmentationStreak,
      }
    : {};
  const ctx = {
    directiveName,
    isFirstDraftEver:
      directiveName === 'draft' &&
      !osPre.directiveLog.some((d) => d.directive === 'draft'),
    isFirstRevisionInChain:
      directiveName === 'revise' &&
      osPost.currentRevision?.revisionNumber === 1,
    approvalFired: directiveName === 'approve',
    contradictionScore,
    ...restCtx,
  };
  const organismPost = evolveOrganismFromCognitiveAct(organismPre, ctx);

  await Promise.all([
    osStore.save(osPost),
    organismStore.save(organismPost),
  ]);

  // Wave 26 — lineage inscription. Only successful structured acts
  // append. Refusals stay in directiveLog only (no payload to preserve).
  if (directiveName === 'draft' && osPost.currentDraft) {
    await lineageStore.append({
      kind: 'draft', id: osPost.currentDraft.draftId,
      at, tick: osPost.uptime,
      payload: osPost.currentDraft,
    });
  } else if (directiveName === 'review' && osPost.currentReview) {
    await lineageStore.append({
      kind: 'review', id: osPost.currentReview.reviewId,
      at, tick: osPost.uptime,
      derivedFromDraftId: osPost.currentReview.derivedFromDraftId,
      payload: osPost.currentReview,
    });
  } else if (directiveName === 'revise' && osPost.currentRevision && osPost.currentDraft) {
    // Two lineage entries on revise: the revision metadata, then the
    // revised draft itself. Both link back via derivedFrom fields.
    await lineageStore.append({
      kind: 'revision', id: osPost.currentRevision.revisionId,
      at, tick: osPost.uptime,
      derivedFromDraftId: osPost.currentRevision.derivedFromPriorDraftId,
      derivedFromReviewId: osPost.currentRevision.basedOnReviewId,
      payload: osPost.currentRevision,
    });
    await lineageStore.append({
      kind: 'draft', id: osPost.currentDraft.draftId,
      at, tick: osPost.uptime,
      derivedFromPriorDraftId: osPost.currentRevision.derivedFromPriorDraftId,
      payload: osPost.currentDraft,
    });
  } else if (directiveName === 'approve' && osPost.currentApproval) {
    await lineageStore.append({
      kind: 'approval', id: osPost.currentApproval.approvalId,
      at, tick: osPost.uptime,
      derivedFromDraftId: osPost.currentApproval.approvedDraftId,
      derivedFromReviewId: osPost.currentApproval.basedOnReviewId,
      payload: osPost.currentApproval,
    });
  }

  // Wave 30 — temporal memory writes. Every cognitive directive
  // (success or refusal, except wake-transition which is an OS-only
  // marker) appends a cadence observation. Verb-specific events
  // (rest success, approve outcomes, fragmentation resolution,
  // defer) append their own observations.
  if (directiveName !== 'wake-transition') {
    const newTemporal: typeof temporalPre = { ...temporalPre,
      cadenceHistory: [...temporalPre.cadenceHistory],
      recoveryHistory: [...temporalPre.recoveryHistory],
      approvalHistory: [...temporalPre.approvalHistory],
      fragmentationHistory: [...temporalPre.fragmentationHistory],
      deferHistory: [...temporalPre.deferHistory],
    };

    // cadenceHistory — every directive.
    const lastCadence = temporalPre.cadenceHistory.length > 0
      ? temporalPre.cadenceHistory[temporalPre.cadenceHistory.length - 1]
      : null;
    const interActMs = lastCadence ? at - lastCadence.at : null;
    const interActTicks = lastCadence ? osPost.uptime - lastCadence.tick : null;
    newTemporal.cadenceHistory.push({
      at, tick: osPost.uptime, directive: directiveName,
      interActMs, interActTicks,
    });

    // recoveryHistory — rest success only.
    if (directiveName === 'rest' && organismPost.lastRestSnapshot) {
      const s = organismPost.lastRestSnapshot;
      // Effectiveness: how much of the spec's max delta was actually
      // achieved. Energy max delta = 1.2; stress max delta = 0.8.
      const energyAchieved = (s.afterEnergy - s.beforeEnergy) / 1.2;
      const stressAchieved = (s.beforeStress - s.afterStress) / 0.8;
      const effectiveness = Math.max(0, Math.min(1, (energyAchieved + stressAchieved) / 2));
      newTemporal.recoveryHistory.push({
        at, tick: osPost.uptime,
        beforeEnergy: s.beforeEnergy, afterEnergy: s.afterEnergy,
        beforeStress: s.beforeStress, afterStress: s.afterStress,
        beforeComplexity: s.beforeComplexity, afterComplexity: s.afterComplexity,
        effectiveness: Math.round(effectiveness * 100) / 100,
      });
    }

    // approvalHistory — both approve and approve-refused.
    if (directiveName === 'approve' && osPost.currentApproval) {
      const s = osPost.currentApproval.scoresSnapshot;
      newTemporal.approvalHistory.push({
        at, tick: osPost.uptime, outcome: 'approved',
        qualityScore: s.qualityScore,
        coherenceScore: s.coherenceScore,
        restraintScore: s.restraintScore,
        contradictionScore: s.contradictionScore,
      });
    } else if (directiveName === 'approve-refused') {
      newTemporal.approvalHistory.push({
        at, tick: osPost.uptime, outcome: 'refused',
      });
    }

    // fragmentationHistory — when streak resets from > 0 to 0 via a
    // non-refused cognitive verb (the only path Wave 30 tracks).
    if (osPre.fragmentationStreak > 0 && osPost.fragmentationStreak === 0) {
      newTemporal.fragmentationHistory.push({
        at, tick: osPost.uptime,
        peakStreak: osPre.fragmentationStreak,
        resolvedBy: 'success',
      });
    }

    // deferHistory — defer success.
    if (directiveName === 'defer') {
      const preSnapshot = {
        organism: organismPre, os: osPre,
        civilization: null, worldState: null, runtime: null,
        temporalMemory: temporalPre,
        capturedAt: at,
      } as Parameters<typeof computeTemporalAssessment>[0];
      const assessment = computeTemporalAssessment(preSnapshot);
      newTemporal.deferHistory.push({
        at, tick: osPost.uptime,
        reason: directive.thought ?? '(no reason)',
        cadenceHealthAtDefer: assessment.cadenceHealth,
        fragmentationRiskAtDefer: assessment.fragmentationRisk,
      });
      newTemporal.totalDefers = (temporalPre.totalDefers ?? 0) + 1;
    }

    newTemporal.firstObservationAt = temporalPre.firstObservationAt ?? at;
    newTemporal.lastObservationAt = at;

    await temporalStore.save(newTemporal);
  }

  return {
    verb,
    at,
    directive,
    thought: directive.thought ?? '(no thought recorded)',
    os: {
      uptime_before: osPre.uptime,
      uptime_after: osPost.uptime,
      posture_before: osPre.operationalPosture,
      posture_after: osPost.operationalPosture,
      season: osPost.currentSeason,
      season_age_after: osPost.seasonAge,
      directive_log_length_after: osPost.directiveLog.length,
      permission_window: osPost.permissionWindow,
      current_intention: osPost.currentIntention,
      current_draft: osPost.currentDraft,
      current_review: osPost.currentReview,
      current_revision: osPost.currentRevision,
      current_approval: osPost.currentApproval,
      pending_external_actions: osPost.pendingExternalActions ?? [],
    },
    organism: {
      age_before: organismPre.age,
      age_after: organismPost.age,
    },
  };
}

// Verb-specific wrappers — what the route handlers call.
export const runObservation = () => runCognitiveAct('observe');
export const runNotice      = () => runCognitiveAct('notice');
export const runConsider    = () => runCognitiveAct('consider');
export const runRestrain    = () => runCognitiveAct('restrain');
export const runPermit      = () => runCognitiveAct('permit');
export const runPrepare     = () => runCognitiveAct('prepare');
export const runDraft       = () => runCognitiveAct('draft');
export const runReview      = () => runCognitiveAct('review');
export const runRevise      = () => runCognitiveAct('revise');
export const runApprove     = () => runCognitiveAct('approve');
export const runPropose     = () => runCognitiveAct('propose');
export const runRest        = () => runCognitiveAct('rest');
export const runDefer       = () => runCognitiveAct('defer');
