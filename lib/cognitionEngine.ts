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
} from './operatingSystemCore';
import {
  createOrganismCoreStore,
  evolveOrganismFromCognitiveAct,
} from './persistentOrganismCore';
import type {
  OSRuntimeState,
  DirectiveRecord,
  OperationalPosture,
  StrategicSeasonName,
  PermissionWindow,
  IntentionState,
  CurrentDraft,
} from './operatingSystemCore';

export type CognitiveVerb =
  | 'observe' | 'notice' | 'consider' | 'restrain'
  | 'permit'  | 'prepare' | 'draft';

type EvolveOSFn = (state: OSRuntimeState, at?: number) => OSRuntimeState;

const EVOLVE_BY_VERB: Record<CognitiveVerb, EvolveOSFn> = {
  observe: evolveOSFromObservation,
  notice: evolveOSFromNotice,
  consider: evolveOSFromConsider,
  restrain: evolveOSFromRestrain,
  permit: evolveOSFromPermit,
  prepare: evolveOSFromPrepare,
  draft: evolveOSFromDraft,
};

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
  };
  organism: {
    age_before: number;
    age_after: number;
  };
}

export async function runCognitiveAct(verb: CognitiveVerb): Promise<CognitionEventResult> {
  const osStore = createOSRuntimeStore();
  const organismStore = createOrganismCoreStore();

  const [osPre, organismPre] = await Promise.all([
    osStore.read(),
    organismStore.read(),
  ]);

  const at = Date.now();
  const osPost = EVOLVE_BY_VERB[verb](osPre, at);
  const directive = osPost.directiveLog[osPost.directiveLog.length - 1];

  // Wave 25 — DSA: compose the cognitive act context from real
  // state-transition facts (no fakery). isFirstDraftEver fires when
  // currentDraft transitions from null to set AND no prior draft
  // directive exists in the pre-evolve log. approvalFired fires
  // when the directive is a successful 'approve' (Wave 26 verb).
  // isFirstRevisionInChain is wired in Wave 26.
  const directiveName = directive.directive;
  const ctx = {
    directiveName,
    isFirstDraftEver:
      directiveName === 'draft' &&
      !osPre.currentDraft &&
      !osPre.directiveLog.some((d) => d.directive === 'draft'),
    approvalFired: directiveName === 'approve',
    // contradictionScore + isFirstRevisionInChain populated in Wave 26
  };
  const organismPost = evolveOrganismFromCognitiveAct(organismPre, ctx);

  await Promise.all([
    osStore.save(osPost),
    organismStore.save(organismPost),
  ]);

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
