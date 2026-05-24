/**
 * COGNITION ENGINE — Wave 20: First Cognition
 *
 * The smallest possible cognitive action pipeline. When a runtime
 * trigger arrives, the organism observes itself: it reads its own
 * persistent state, notes what is true at this instant, emits the
 * directive 'observe' with a thought describing what was perceived,
 * increments organism age, and transitions posture from 'booting'
 * to 'observing'.
 *
 * Architectural truthfulness:
 *   - The thought is composed from values read from persistent state
 *     at the moment of observation. No randomness, no invention.
 *   - The directive 'observe' is a real entry in os.directiveLog,
 *     which the existing CognitionTimeline and DirectiveStream views
 *     read directly — no parallel timeline store is introduced.
 *   - organism.age advances by 1; energy, stress, complexity, and
 *     consecutiveActions are not touched (observation is not action).
 *   - Persistence is across two stores (os-runtime.json,
 *     organism.json); both saves happen before this function returns.
 *
 * The summary returned to the caller is for verification only — it
 * never becomes the source of truth. The source of truth is on disk.
 */

import { createOSRuntimeStore, evolveOSFromObservation } from './operatingSystemCore';
import { createOrganismCoreStore, evolveOrganismFromObservation } from './persistentOrganismCore';
import type { DirectiveRecord, OperationalPosture, StrategicSeasonName } from './operatingSystemCore';

export type CognitionTrigger = 'observation';

export interface CognitionEventResult {
  trigger: CognitionTrigger;
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
  };
  organism: {
    age_before: number;
    age_after: number;
  };
}

export async function runObservation(): Promise<CognitionEventResult> {
  const osStore = createOSRuntimeStore();
  const organismStore = createOrganismCoreStore();

  const [osPre, organismPre] = await Promise.all([
    osStore.read(),
    organismStore.read(),
  ]);

  const at = Date.now();
  const osPost = evolveOSFromObservation(osPre, at);
  const organismPost = evolveOrganismFromObservation(organismPre);

  await Promise.all([
    osStore.save(osPost),
    organismStore.save(organismPost),
  ]);

  const directive = osPost.directiveLog[osPost.directiveLog.length - 1];
  const thought = directive.thought ?? '(no thought recorded)';

  return {
    trigger: 'observation',
    at,
    directive,
    thought,
    os: {
      uptime_before: osPre.uptime,
      uptime_after: osPost.uptime,
      posture_before: osPre.operationalPosture,
      posture_after: osPost.operationalPosture,
      season: osPost.currentSeason,
      season_age_after: osPost.seasonAge,
      directive_log_length_after: osPost.directiveLog.length,
    },
    organism: {
      age_before: organismPre.age,
      age_after: organismPost.age,
    },
  };
}
