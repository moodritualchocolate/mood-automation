/**
 * SYMBOLIC OBJECTS (Phase 26 — Unified Cognitive Field)
 *
 * Objects are not props. They are MEMORY CONTAINERS — psychological
 * carriers that hold emotional meaning, cultural meaning, behavior,
 * pressure, ritual, and identity.
 *
 * Phase 26 does not add a new creative feature: it gives the rest of
 * the cognition a shared vocabulary for the objects that recur in
 * modern life, so every engine reads an object the same way.
 */

import type { HumanTruth } from '@/core/types';

export type SymbolicObjectId =
  | 'phone' | 'laptop' | 'coffee' | 'bed' | 'fridge' | 'charger'
  | 'headphones' | 'notification-bubble' | 'inbox' | 'car-seat'
  | 'office-chair' | 'kitchen-counter' | 'gym-bag' | 'water-bottle'
  | 'child-toy' | 'open-browser-tab' | 'unread-message' | 'couch'
  | 'sink' | 'train-seat' | 'balcony-chair';

export interface SymbolicObjectRecord {
  object: SymbolicObjectId;
  emotionalMeanings: string[];
  culturalMeanings: string[];
  associatedBehaviors: string[];
  associatedPressures: string[];
  ritualLinks: string[];
  identityLinks: string[];
  /** 0..10 — how worn-out this object is as a creative motif. */
  decayRisk: number;
  /** 0..10 — how easily this object becomes a cliché if overused. */
  overuseRisk: number;
  /** Words / phrases that indicate the object is present in a scene. */
  match: RegExp;
}

export const SYMBOLIC_OBJECTS: Record<SymbolicObjectId, SymbolicObjectRecord> = {
  'phone': {
    object: 'phone', emotionalMeanings: ['reachability', 'escape', 'low-grade anxiety'],
    culturalMeanings: ['ambient availability', 'the second nervous system'],
    associatedBehaviors: ['doomscroll', 'lock-screen-pull', 'disappearing-into-phone'],
    associatedPressures: ['notification-fragmentation', 'infinite-accessibility'],
    ritualLinks: ['morning-cup', 'walk-before-bed'], identityLinks: ['reliable-person'],
    decayRisk: 8, overuseRisk: 9, match: /\bphone|screen|lock ?screen\b/i,
  },
  'laptop': {
    object: 'laptop', emotionalMeanings: ['unfinished work', 'identity as output'],
    culturalMeanings: ['work-home boundary collapse'],
    associatedBehaviors: ['reopen-laptop', 'tab-switching', 'fake-productivity'],
    associatedPressures: ['work-home-boundary-collapse', 'productivity-identity'],
    ritualLinks: [], identityLinks: ['employee', 'founder'],
    decayRisk: 6, overuseRisk: 6, match: /\blaptop|macbook\b/i,
  },
  'coffee': {
    object: 'coffee', emotionalMeanings: ['borrowed energy', 'a private pause'],
    culturalMeanings: ['the compensation ritual of the working day'],
    associatedBehaviors: ['third-coffee', 'predawn-coffee-alone'],
    associatedPressures: ['recovery-failure'], ritualLinks: ['morning-cup'],
    identityLinks: ['capable-adult'], decayRisk: 7, overuseRisk: 8,
    match: /\bcoffee|espresso|mug|cup\b/i,
  },
  'bed': {
    object: 'bed', emotionalMeanings: ['unreached rest', 'productivity zone'],
    culturalMeanings: ['bed as a second office'],
    associatedBehaviors: ['one-more-thing-before-sleep', 'doomscroll'],
    associatedPressures: ['bed-as-productivity-zone'], ritualLinks: ['evening-shower'],
    identityLinks: [], decayRisk: 5, overuseRisk: 6, match: /\bbed|duvet|pillow|blanket\b/i,
  },
  'fridge': {
    object: 'fridge', emotionalMeanings: ['restlessness mistaken for hunger'],
    culturalMeanings: ['the late-night search for something not in the fridge'],
    associatedBehaviors: ['fridge-without-hunger', 'fridge-light-at-23-45'],
    associatedPressures: [], ritualLinks: ['nighttime-snack'], identityLinks: [],
    decayRisk: 4, overuseRisk: 5, match: /\bfridge|freezer\b/i,
  },
  'charger': {
    object: 'charger', emotionalMeanings: ['low battery as a self-portrait'],
    culturalMeanings: ['the body and the device draining together'],
    associatedBehaviors: [], associatedPressures: ['infinite-accessibility'],
    ritualLinks: [], identityLinks: [], decayRisk: 3, overuseRisk: 4,
    match: /\bcharger|charging|low battery|cable\b/i,
  },
  'headphones': {
    object: 'headphones', emotionalMeanings: ['company without obligation', 'a wall'],
    culturalMeanings: ['private audio as a boundary in shared space'],
    associatedBehaviors: ['nature-walk-on-a-call'], associatedPressures: [],
    ritualLinks: ['one-specific-podcast-voice'], identityLinks: [],
    decayRisk: 3, overuseRisk: 4, match: /\bheadphones|earbuds|airpods\b/i,
  },
  'notification-bubble': {
    object: 'notification-bubble', emotionalMeanings: ['small dread', 'small dopamine'],
    culturalMeanings: ['the red dot as ambient pressure'],
    associatedBehaviors: ['lock-screen-pull', 'refresh-inbox'],
    associatedPressures: ['notification-fragmentation', 'algorithmic-interruption'],
    ritualLinks: [], identityLinks: [], decayRisk: 6, overuseRisk: 7,
    match: /\bnotification|red dot|badge|alert\b/i,
  },
  'inbox': {
    object: 'inbox', emotionalMeanings: ['unanswered obligation', 'shame surface'],
    culturalMeanings: ['the inbox as a measure of being behind'],
    associatedBehaviors: ['refresh-inbox'], associatedPressures: ['infinite-accessibility'],
    ritualLinks: [], identityLinks: ['reliable-person'], decayRisk: 5, overuseRisk: 5,
    match: /\binbox|email|unread mail\b/i,
  },
  'car-seat': {
    object: 'car-seat', emotionalMeanings: ['the only unallocated minute'],
    culturalMeanings: ['the parked car as the last private room'],
    associatedBehaviors: ['parked-car-silence'], associatedPressures: [],
    ritualLinks: ['five-minutes-in-the-car'], identityLinks: [],
    decayRisk: 3, overuseRisk: 4, match: /\bcar|driveway|engine|steering wheel\b/i,
  },
  'office-chair': {
    object: 'office-chair', emotionalMeanings: ['the body staffing a role'],
    culturalMeanings: ['presence as a proxy for value'],
    associatedBehaviors: ['present-with-empty-eyes'], associatedPressures: ['optimization-culture'],
    ritualLinks: [], identityLinks: ['employee'], decayRisk: 4, overuseRisk: 5,
    match: /\boffice chair|desk chair|swivel\b/i,
  },
  'kitchen-counter': {
    object: 'kitchen-counter', emotionalMeanings: ['the household\'s quiet hour'],
    culturalMeanings: ['the counter as the stage of domestic transitions'],
    associatedBehaviors: ['kitchen-standing-without-purpose'], associatedPressures: [],
    ritualLinks: ['morning-cup'], identityLinks: ['parent'], decayRisk: 3, overuseRisk: 4,
    match: /\bkitchen counter|counter|kitchen island\b/i,
  },
  'gym-bag': {
    object: 'gym-bag', emotionalMeanings: ['the shadow self who was going to go'],
    culturalMeanings: ['the gap between the intended self and the lived one'],
    associatedBehaviors: ['workout-as-anxiety-burnoff'], associatedPressures: ['endless-self-improvement-loop'],
    ritualLinks: [], identityLinks: [], decayRisk: 4, overuseRisk: 5,
    match: /\bgym bag|sports bag|running shoes\b/i,
  },
  'water-bottle': {
    object: 'water-bottle', emotionalMeanings: ['optimisation as a small obligation'],
    culturalMeanings: ['the wellness object that became a task'],
    associatedBehaviors: [], associatedPressures: ['endless-self-improvement-loop'],
    ritualLinks: [], identityLinks: [], decayRisk: 4, overuseRisk: 6,
    match: /\bwater bottle|hydration\b/i,
  },
  'child-toy': {
    object: 'child-toy', emotionalMeanings: ['the parent identity in object form'],
    culturalMeanings: ['the toy left where the day ended'],
    associatedBehaviors: [], associatedPressures: ['parenting-without-recovery'],
    ritualLinks: [], identityLinks: ['parent'], decayRisk: 3, overuseRisk: 4,
    match: /\btoy|lego|stuffed animal|crayon\b/i,
  },
  'open-browser-tab': {
    object: 'open-browser-tab', emotionalMeanings: ['a thought started, not closed'],
    culturalMeanings: ['the tab graveyard as a mind-map of the unfinished'],
    associatedBehaviors: ['tab-switching'], associatedPressures: ['notification-fragmentation'],
    ritualLinks: [], identityLinks: [], decayRisk: 6, overuseRisk: 7,
    match: /\btab|tabs|browser\b/i,
  },
  'unread-message': {
    object: 'unread-message', emotionalMeanings: ['relational debt', 'a reply that costs'],
    culturalMeanings: ['the message left to keep until there is energy'],
    associatedBehaviors: ['reply-rehearsal'], associatedPressures: ['social-performance-pressure'],
    ritualLinks: [], identityLinks: ['reliable-person'], decayRisk: 5, overuseRisk: 6,
    match: /\bunread message|unanswered|message left\b/i,
  },
  'couch': {
    object: 'couch', emotionalMeanings: ['rest that is not rest'],
    culturalMeanings: ['the couch as a recovery zone that does not recover'],
    associatedBehaviors: ['fake-break'], associatedPressures: ['passive-entertainment-overload'],
    ritualLinks: ['one-specific-corner-of-the-couch'], identityLinks: [],
    decayRisk: 4, overuseRisk: 5, match: /\bcouch|sofa\b/i,
  },
  'sink': {
    object: 'sink', emotionalMeanings: ['the small unfinished thing'],
    culturalMeanings: ['the sink as the household\'s honest state'],
    associatedBehaviors: [], associatedPressures: [], ritualLinks: ['face-wash-as-reset'],
    identityLinks: ['good-host'], decayRisk: 3, overuseRisk: 4, match: /\bsink|dishes|tap\b/i,
  },
  'train-seat': {
    object: 'train-seat', emotionalMeanings: ['a transitional self', 'borrowed stillness'],
    culturalMeanings: ['the commute as the only unowned time'],
    associatedBehaviors: [], associatedPressures: [], ritualLinks: [], identityLinks: [],
    decayRisk: 3, overuseRisk: 4, match: /\btrain|subway|bus seat|commute\b/i,
  },
  'balcony-chair': {
    object: 'balcony-chair', emotionalMeanings: ['a small claimed outdoor minute'],
    culturalMeanings: ['the balcony as the apartment\'s edge of escape'],
    associatedBehaviors: ['staring-moment'], associatedPressures: [],
    ritualLinks: [], identityLinks: [], decayRisk: 3, overuseRisk: 4,
    match: /\bbalcony|terrace|porch\b/i,
  },
};

export interface SymbolicObjectsReading {
  objects_present: SymbolicObjectRecord[];
  /** 0..10 — how strongly the scene is carried by symbolic objects. */
  symbolic_density: number;
  /** True when an object present is high decay/overuse risk. */
  worn_motif_present: boolean;
  notes: string[];
}

export interface SymbolicObjectsInput {
  truth: HumanTruth;
  /** Optional extra scene text (image brief scene, world artifacts). */
  sceneText?: string;
}

export function readSymbolicObjects(input: SymbolicObjectsInput): SymbolicObjectsReading {
  const { truth, sceneText } = input;
  const hay = `${truth.truth} ${truth.tension} ${sceneText ?? ''}`;
  const notes: string[] = [];

  const objects_present = Object.values(SYMBOLIC_OBJECTS).filter((o) => o.match.test(hay));
  const symbolic_density = Math.min(10, objects_present.length * 3);
  const worn_motif_present = objects_present.some((o) => o.decayRisk >= 7 || o.overuseRisk >= 8);

  if (objects_present.length) {
    notes.push(`symbolic objects present: ${objects_present.map((o) => o.object).join(', ')}`);
  } else {
    notes.push('no symbolic object detected — the scene carries meaning without an object anchor');
  }
  if (worn_motif_present) notes.push('WARNING: a high decay/overuse-risk object motif is present');

  return { objects_present, symbolic_density, worn_motif_present, notes };
}
