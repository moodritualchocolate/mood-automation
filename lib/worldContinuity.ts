/**
 * WORLD CONTINUITY ENGINE (Phase 7)
 *
 * The scene must feel like it existed before the frame and continues
 * after it. The engine outputs LIVED-IN ARTIFACTS the image brief
 * incorporates so the camera caught a moment in progress, not a set.
 *
 * Examples named in the spec:
 *   unfinished tea, tabs already open, chair slightly moved,
 *   unread message from earlier, worn hoodie, half-open cabinet,
 *   exhausted apartment lighting, jacket thrown on chair,
 *   half-eaten snack, sink not cleaned yet.
 *
 * Artifacts are selected per cultural micro-moment + emotional core
 * so they ALWAYS fit the room. Random clutter is forbidden.
 */

import type { HumanState } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { CulturalMicroMoment } from './culturalMemory';

export interface WorldArtifact {
  id: string;
  description: string;
  /** What this artifact implies about the past. */
  pastImplication: string;
  /** Where in the frame the artifact should appear. */
  placement: 'foreground-edge' | 'background-corner' | 'mid-ground' | 'out-of-focus' | 'cropped-at-edge';
}

export interface WorldContinuityPlan {
  /** A short paragraph the image brief inherits — names the artifacts
   *  the camera should see in the room. */
  briefLine: string;
  artifacts: WorldArtifact[];
  /** A one-line implied past — "ten minutes before this frame, X". */
  impliedPast: string;
  /** A one-line implied next moment. */
  impliedNext: string;
}

const ARTIFACTS: Record<string, WorldArtifact> = {
  'unfinished-tea': { id: 'unfinished-tea', description: 'a mug with cold tea, half-drunk', pastImplication: 'someone made it and stopped wanting it', placement: 'foreground-edge' },
  'tabs-open': { id: 'tabs-open', description: 'a laptop edge in frame, multiple browser tabs visible at the top of the screen', pastImplication: 'half a dozen unfinished thoughts', placement: 'cropped-at-edge' },
  'chair-slightly-moved': { id: 'chair-slightly-moved', description: 'a second chair pulled an inch from the table, no one in it', pastImplication: 'someone was here recently', placement: 'background-corner' },
  'unread-message': { id: 'unread-message', description: 'a phone face-down with a notification glow at the edge', pastImplication: 'an obligation deferred', placement: 'mid-ground' },
  'worn-hoodie': { id: 'worn-hoodie', description: 'a hoodie cuffs visible at the wrists — frayed, soft from use', pastImplication: 'this hoodie has been the answer to a lot of mornings', placement: 'cropped-at-edge' },
  'half-open-cabinet': { id: 'half-open-cabinet', description: 'a kitchen cabinet door half-open in the background', pastImplication: 'reached for something and forgot to close it', placement: 'background-corner' },
  'jacket-on-chair': { id: 'jacket-on-chair', description: 'a coat thrown over the back of a chair', pastImplication: 'arrived and stopped before putting it away', placement: 'background-corner' },
  'half-eaten-snack': { id: 'half-eaten-snack', description: 'a snack wrapper open on the counter, contents half-gone', pastImplication: 'ate without hunger', placement: 'foreground-edge' },
  'unwashed-sink': { id: 'unwashed-sink', description: 'dishes in the sink, evening light on water marks', pastImplication: 'the day did not get put away', placement: 'mid-ground' },
  'crumpled-blanket': { id: 'crumpled-blanket', description: 'a blanket pushed half off the couch', pastImplication: 'they were on the couch longer than they meant to be', placement: 'background-corner' },
  'receipt-crumpled': { id: 'receipt-crumpled', description: 'a receipt crumpled on the kitchen counter', pastImplication: 'errand done, nothing put away', placement: 'foreground-edge' },
  'phone-charger-trailing': { id: 'phone-charger-trailing', description: 'a phone charger cable trailing over the bed edge', pastImplication: 'kept connected past sleep', placement: 'cropped-at-edge' },
  'used-coffee-filter': { id: 'used-coffee-filter', description: 'an espresso machine drip tray with grounds still in it', pastImplication: 'the second cup, not the first', placement: 'background-corner' },
  'open-notebook': { id: 'open-notebook', description: 'a notebook open to a half-filled page', pastImplication: 'a thought began, did not finish', placement: 'mid-ground' },
  'shoes-half-off': { id: 'shoes-half-off', description: 'shoes on the floor, one toed off, one still tied', pastImplication: 'sat down with not enough energy to finish undressing', placement: 'mid-ground' },
  'window-rain-streak': { id: 'window-rain-streak', description: 'a streak of dried rain on the window', pastImplication: 'weather that did not clean itself up', placement: 'background-corner' },
  'keys-on-counter': { id: 'keys-on-counter', description: 'house keys dropped on the kitchen counter with the mail', pastImplication: 'walked in, did not move past this spot', placement: 'foreground-edge' },
  'cold-toast': { id: 'cold-toast', description: 'a piece of toast on a plate, untouched, cold', pastImplication: 'morning intention without follow-through', placement: 'foreground-edge' },
};

const MOMENT_PRESETS: Record<string, string[]> = {
  'car-after-work': ['phone-charger-trailing', 'keys-on-counter'],
  'fridge-open-at-night': ['unwashed-sink', 'half-eaten-snack'],
  'unread-whatsapp': ['unread-message', 'used-coffee-filter'],
  'bed-scrolling': ['phone-charger-trailing', 'crumpled-blanket'],
  'office-fluorescent': ['tabs-open', 'used-coffee-filter'],
  'train-ride-silence': ['worn-hoodie', 'unread-message'],
  'reserves-fatigue': ['jacket-on-chair', 'worn-hoodie', 'half-eaten-snack'],
  'startup-late-night': ['tabs-open', 'used-coffee-filter', 'open-notebook'],
  'parenting-overload': ['crumpled-blanket', 'unwashed-sink', 'half-eaten-snack'],
  'coffee-machine-emptiness': ['used-coffee-filter', 'receipt-crumpled'],
  'no-energy-for-people': ['jacket-on-chair', 'shoes-half-off'],
  'saturday-stillness': ['cold-toast', 'crumpled-blanket', 'open-notebook'],
  'overstimulated-tabs': ['tabs-open', 'used-coffee-filter', 'unread-message'],
  'office-1647-brain-death': ['tabs-open', 'used-coffee-filter'],
  'post-meeting-emptiness': ['open-notebook'],
  'zoning-out': ['tabs-open', 'unread-message'],
  'eating-without-hunger': ['half-eaten-snack', 'unwashed-sink'],
  'late-kitchen-silence': ['unwashed-sink', 'cold-toast'],
  'avoiding-messages': ['phone-charger-trailing', 'unread-message'],
  'staring-without-processing': ['open-notebook', 'used-coffee-filter'],
};

export interface ContinuityInput {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  microMoment: CulturalMicroMoment | null;
  /** Seed for deterministic-but-varied artifact selection across attempts. */
  seed?: number;
}

export function planWorldContinuity(input: ContinuityInput): WorldContinuityPlan {
  const { state, microMoment, seed = 0 } = input;

  // Always include 2-3 artifacts. The cultural micro-moment provides
  // the strongest match; fallback by state family.
  let candidateIds: string[] = [];
  if (microMoment && MOMENT_PRESETS[microMoment.state_id]) {
    candidateIds = MOMENT_PRESETS[microMoment.state_id];
  } else {
    candidateIds = familyDefaults(state.family);
  }

  // Choose 2 from candidates + always 1 cross-state "lived-in" artifact
  // so banners across the campaign share a quiet visual vocabulary.
  const rng = mulberry32(seed);
  const pickedIds = pickN(candidateIds, 2, rng);
  const cross = pickN(['worn-hoodie', 'phone-charger-trailing', 'jacket-on-chair', 'used-coffee-filter'].filter((id) => !pickedIds.includes(id)), 1, rng);
  const artifacts = [...pickedIds, ...cross].map((id) => ARTIFACTS[id]).filter(Boolean);

  const impliedPast = buildPast(microMoment, state, artifacts);
  const impliedNext = buildNext(microMoment, state);

  const briefLine = `Lived-in continuity: ${artifacts.map((a) => a.description).join('; ')}. Each detail implies the past — never staged.`;

  return { briefLine, artifacts, impliedPast, impliedNext };
}

function familyDefaults(family: HumanState['family']): string[] {
  switch (family) {
    case 'fatigue':
    case 'collapse':       return ['jacket-on-chair', 'used-coffee-filter', 'worn-hoodie'];
    case 'overstimulation': return ['tabs-open', 'unread-message'];
    case 'avoidance':      return ['shoes-half-off', 'jacket-on-chair'];
    case 'numbness':       return ['cold-toast', 'crumpled-blanket'];
    case 'pressure':       return ['open-notebook', 'used-coffee-filter'];
    case 'fragmentation':  return ['tabs-open', 'open-notebook'];
    case 'paralysis':      return ['cold-toast', 'open-notebook'];
    default:               return ['worn-hoodie', 'used-coffee-filter'];
  }
}

function buildPast(moment: CulturalMicroMoment | null, state: HumanState, artifacts: WorldArtifact[]): string {
  const arts = artifacts.slice(0, 2).map((a) => a.pastImplication).join('; ');
  const setting = moment?.environment ?? state.setting[0] ?? 'this room';
  return `Ten minutes before this frame: ${arts}. The subject arrived at ${setting} and did not move past this spot.`;
}

function buildNext(moment: CulturalMicroMoment | null, state: HumanState): string {
  // The "after" is left intentionally unresolved — that is the spec's
  // "mid-life, not staged" rule.
  void moment; void state;
  return 'Two minutes after this frame: the subject still has not decided to do the next thing.';
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
